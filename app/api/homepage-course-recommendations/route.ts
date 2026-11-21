import { NextRequest, NextResponse } from "next/server";
import { firestore } from "../../../server/firebase";
import { optionalSessionUser } from "../../../server/session";
import { isValidEnrollmentTerm } from "../../../lib/enrollmentTerm";
import { semesterFromEnrollment } from "../../../lib/course-recommendations/homepagePlanner";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const headers = { "Cache-Control": "private, no-store" };

const response = (body: Record<string, unknown>, status = 200) =>
  NextResponse.json(body, { status, headers });

/**
 * New homepage only: MENG courses are awaiting a manually supplied
 * semester-by-semester plan. Do not use the previous recommendation
 * algorithm or infer course completion from enrollment or saved progress.
 *
 * The legacy homepage and Degree Progression are unaffected.
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

    return response({
      status: "plan-pending",
      term: selected.term + " · Semester " + selected.semester,
      semester: selected.semester,
      courses: []
    });
  } catch (error) {
    console.error("Homepage course recommendations failed", error);
    return response({ status: "error", courses: [] }, 500);
  }
}
