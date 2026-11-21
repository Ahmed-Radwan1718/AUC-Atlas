import { NextRequest, NextResponse } from "next/server";
import { firestore } from "../../../server/firebase";
import { optionalSessionUser } from "../../../server/session";
import { isValidEnrollmentTerm } from "../../../lib/enrollmentTerm";
import { semesterFromEnrollment } from "../../../lib/course-recommendations/homepagePlanner";
import { getNewHomepageMechanicalSemesterPlan } from "../../../lib/course-recommendations/newHomepageMechanicalPlan";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const headers = { "Cache-Control": "private, no-store" };

const response = (body: Record<string, unknown>, status = 200) =>
  NextResponse.json(body, { status, headers });

/**
 * Course suggestions for /homepagenew are fixed owner-supplied MENG lists.
 * Existing Degree Progression plans and the legacy homepage are unaffected.
 * A student's enrollment determines which semester list to show, not which
 * courses they have completed. Unspecified semesters remain pending.
 */
export async function GET(request: NextRequest) {
  const user = await optionalSessionUser(request);
  if (!user) return response({ status: "sign-in", courses: [] });

  try {
    const profileSnapshot = await firestore().collection("users").doc(user.uid).get();
    const profile = profileSnapshot.data() || {};
    const major = String(profile.major || "").trim();
    const enrollmentTerm = String(profile.enrollmentTerm || "").trim();

    if (!major || !isValidEnrollmentTerm(enrollmentTerm)) {
      return response({ status: "select-major", courses: [] });
    }
    if (major !== "Mechanical Engineering") {
      return response({ status: "unsupported-major", courses: [] });
    }

    const selected = semesterFromEnrollment(enrollmentTerm);
    if (!selected) return response({ status: "select-major", courses: [] });

    // A selector can view any of the eight standard semesters without
    // changing the student's saved enrollment or their actual current term.
    const requested = request.nextUrl.searchParams.get("semester");
    if (requested !== null && !/^[1-8]$/.test(requested)) {
      return response({ status: "error", courses: [] }, 400);
    }
    const semester = requested === null ? selected.semester : Number(requested);
    const viewingCurrent = semester === selected.semester;
    const term = viewingCurrent
      ? selected.term + " · Semester " + semester
      : "Semester " + semester;
    const plan = getNewHomepageMechanicalSemesterPlan(semester);
    if (!plan) {
      return response({
        status: "plan-pending",
        term,
        semester,
        courses: []
      });
    }

    return response({
      status: "ready",
      term,
      semester,
      upcoming: viewingCurrent && selected.upcoming,
      totalCredits: plan.totalCredits,
      courses: plan.courses.map(course => ({ ...course, semester })),
      requirements: plan.requirements.map(requirement => ({
        ...requirement, timing: "due"
      }))
    });
  } catch (error) {
    console.error("Homepage course recommendations failed", error);
    return response({ status: "error", courses: [] }, 500);
  }
}
