import { NextRequest, NextResponse } from "next/server";
import { firestore } from "../../../server/firebase";
import { optionalSessionUser } from "../../../server/session";
import { isValidEnrollmentTerm } from "../../../lib/enrollmentTerm";
import { degreePlans1 } from "../../../data/degree-plans-1";
import { getMechanicalSemesterPlan } from "../../../lib/course-recommendations/mechanicalEngineering";
import {
  completedCourseCodesFromChecklist,
  semesterFromEnrollment
} from "../../../lib/course-recommendations/homepagePlanner";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const headers = { "Cache-Control": "private, no-store" };

const response = (body: Record<string, unknown>, status = 200) =>
  NextResponse.json(body, { status, headers });

/**
 * Serve only the semester plans we have actually established (MENG 1-5).
 * Do not use an AUC ID to infer course completion or invent later semesters.
 */
export async function GET(request: NextRequest) {
  const user = await optionalSessionUser(request);
  if (!user) return response({ status: "sign-in", courses: [] });

  try {
    const userRef = firestore().collection("users").doc(user.uid);
    const profileSnapshot = await userRef.get();
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

    const plan = getMechanicalSemesterPlan(selected.semester);
    const label = selected.term + " · Semester " + selected.semester;
    if (!plan) {
      return response({
        status: "plan-pending",
        term: label,
        semester: selected.semester,
        courses: []
      });
    }

    // Saved progress is optional. Missing checkboxes are not assumed passed.
    const progressSnapshot = await userRef.collection("savedTools").doc("degree-progress").get();
    const progress = progressSnapshot.data() || {};
    const usedSavedProgress = progressSnapshot.exists && progress.major === major;
    const checkedKeys = usedSavedProgress && Array.isArray(progress.completedKeys)
      ? progress.completedKeys.filter((key: unknown): key is string => typeof key === "string")
      : [];
    const groups = degreePlans1["Mechanical Engineering"].groups;
    const completed = completedCourseCodesFromChecklist(checkedKeys, groups);

    const courses = plan.courses
      .filter(course => !completed.has(course.code))
      .map(course => ({
        code: course.code,
        title: course.title,
        semester: plan.semester,
        credits: course.credits,
        kind: course.kind
      }));
    // Category slots are choices, not invented registered course codes.
    const requirements = plan.coreCategories.map(category => ({
      id: category.categoryId,
      label: category.title,
      timing: "due",
      credits: category.credits
    }));
    const totalCredits = courses.reduce((sum, course) => sum + course.credits, 0)
      + plan.coreCategories.reduce((sum, category) => sum + category.credits, 0);

    return response({
      status: "ready",
      term: label,
      upcoming: selected.upcoming,
      usedSavedProgress,
      totalCredits,
      courses,
      requirements
    });
  } catch (error) {
    console.error("Homepage course recommendations failed", error);
    return response({ status: "error", courses: [] }, 500);
  }
}
