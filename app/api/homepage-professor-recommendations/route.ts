import { NextRequest, NextResponse } from "next/server";
import { firestore } from "../../../server/firebase";
import { optionalSessionUser } from "../../../server/session";
import { professors } from "../../../data/professors";
import { getProfessorRatingSnapshot, homepageProfessorRankings } from "../../../server/professorRatingSummaries";
import { isValidEnrollmentTerm } from "../../../lib/enrollmentTerm";
import { semesterFromEnrollment } from "../../../lib/course-recommendations/homepagePlanner";
import { getNewHomepageMechanicalSemesterPlan } from "../../../lib/course-recommendations/newHomepageMechanicalPlan";
import {
  nextAcademicSemester, rankProfessorsForCourses, type CourseRating
} from "../../../lib/course-recommendations/newHomepageProfessorRecommendations";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const headers = { "Cache-Control": "private, no-store" };

const respond = (body: Record<string, unknown>, status = 200) =>
  NextResponse.json(body, { status, headers });

/**
 * The new homepage uses the explicitly supplied MENG semester plan.
 * Student ratings must refer to the SAME course and professor, not merely
 * a department or the professor's overall rating. Past teaching does not
 * guarantee a professor will teach the upcoming term.
 */
export async function GET(request: NextRequest) {
  const user = await optionalSessionUser(request);
  if (!user) return respond({ status: "sign-in", consider: [], avoid: [] });

  try {
    const profile = (await firestore().collection("users").doc(user.uid).get()).data() || {};
    const major = String(profile.major || "").trim();
    const enrollmentTerm = String(profile.enrollmentTerm || "").trim();
    if (!major || !isValidEnrollmentTerm(enrollmentTerm)) {
      return respond({ status: "select-major", consider: [], avoid: [] });
    }
    if (major !== "Mechanical Engineering") {
      return respond({ status: "unsupported-major", consider: [], avoid: [] });
    }

    const current = semesterFromEnrollment(enrollmentTerm);
    const next = current ? nextAcademicSemester(current) : null;
    if (!next) return respond({ status: "select-major", consider: [], avoid: [] });

    // When browsing an earlier/later semester in the course selector, preview
    // the professor list for the semester immediately after it.
    const requested = request.nextUrl.searchParams.get("semester");
    if (requested !== null && !/^[1-9]$/.test(requested)) {
      return respond({ status: "error", consider: [], avoid: [] }, 400);
    }
    const target = requested === null
      ? next
      : { semester: Number(requested), term: "Semester " + requested };

    const plan = getNewHomepageMechanicalSemesterPlan(target.semester);
    if (!plan) {
      return respond({
        status: "plan-pending", semester: target.semester,
        term: target.term, consider: [], avoid: []
      });
    }

    const predictedCourses = plan.courses.map(course => course.code);
    const reviewCollection = firestore().collection("professorReviews");
    const found = await Promise.all(predictedCourses.flatMap(courseCode =>
      ["courseCode", "courseTaken"].map(async field => {
        // Bound reads. Both keys are required for legacy and current reviews.
        const snapshot = await reviewCollection.where(field, "==", courseCode)
          .select("professorId", "rating", "courseCode", "courseTaken")
          .limit(150).get();
        return snapshot.docs.map(doc => {
          const data = doc.data();
          // A current courseCode wins if an older courseTaken value disagrees.
          const actual = String(data.courseCode || data.courseTaken || "").trim().toUpperCase();
          return actual === courseCode ? {
            id: doc.id, professorId: String(data.professorId || ""),
            rating: Number(data.rating), courseCode
          } : null;
        }).filter((item): item is CourseRating => item !== null);
      })
    ));
    // Overall ratings can corroborate a small course-specific sample, but
    // never establish that someone teaches a course on their own.
    // If the summary is unavailable, course-specific recommendations still work.
    let overall = [] as ReturnType<typeof homepageProfessorRankings>;
    try {
      overall = homepageProfessorRankings(await getProfessorRatingSnapshot());
    } catch (error) {
      console.error("Professor overall ratings unavailable for homepage suggestions", error);
    }
    const rated = rankProfessorsForCourses(predictedCourses, found.flat(), professors, overall);
    return respond({
      status: "ready",
      semester: target.semester,
      term: target.term,
      predictedCourses,
      ...rated
    });
  } catch (error) {
    console.error("Next-semester professor suggestions failed", error);
    return respond({ status: "error", consider: [], avoid: [] }, 500);
  }
}
