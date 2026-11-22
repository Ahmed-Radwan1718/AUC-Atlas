import { NextRequest, NextResponse } from "next/server";
import { firebaseAuth, firestore } from "../../../server/firebase";
import { optionalSessionUser } from "../../../server/session";
import { serializeMaterialData } from "../../../server/materials";
import { isValidEnrollmentTerm } from "../../../lib/enrollmentTerm";
import { semesterFromEnrollment } from "../../../lib/course-recommendations/homepagePlanner";
import { getNewHomepageMechanicalSemesterPlan } from "../../../lib/course-recommendations/newHomepageMechanicalPlan";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const headers = { "Cache-Control": "private, no-store" };
// Read only the newest indexed records for each current-semester course.
// The extra candidates allow for rejected uploads without a broader scan.
const MATERIAL_READ_LIMIT = 12;
const respond = (body: Record<string, unknown>, status = 200) =>
  NextResponse.json(body, { status, headers });

/**
 * Only the student's calculated current semester determines these materials.
 * Browsing other semesters in "Your Courses" must not change this feed.
 * The fixed MENG plans currently cover semesters 1 and 2.
 */
export async function GET(request: NextRequest) {
  const user = await optionalSessionUser(request);
  if (!user) return respond({ status: "sign-in", courses: [] });

  try {
    // Downloading course materials requires a verified AUC email too.
    const account = await firebaseAuth().getUser(user.uid);
    const email = String(account.email || user.email || "").trim().toLowerCase();
    if (!account.emailVerified || !email.endsWith("@aucegypt.edu")) {
      return respond({ status: "verify-email", courses: [] });
    }

    const profile = (await firestore().collection("users").doc(user.uid).get()).data() || {};
    const major = String(profile.major || "").trim();
    const enrollmentTerm = String(profile.enrollmentTerm || "").trim();
    if (!major || !isValidEnrollmentTerm(enrollmentTerm)) {
      return respond({ status: "select-major", courses: [] });
    }
    if (major !== "Mechanical Engineering") {
      return respond({ status: "unsupported-major", courses: [] });
    }

    const current = semesterFromEnrollment(enrollmentTerm);
    if (!current) return respond({ status: "select-major", courses: [] });
    const plan = getNewHomepageMechanicalSemesterPlan(current.semester);
    if (!plan) {
      return respond({
        status: "plan-pending", term: current.term,
        semester: current.semester, courses: []
      });
    }

    const courseCollection = firestore().collection("courseMaterials");
    const courses = await Promise.all(plan.courses.map(async course => {
      const snapshot = await courseCollection
        .where("courseCode", "==", course.code)
        .orderBy("createdAt", "desc")
        .limit(MATERIAL_READ_LIMIT).get();

      const materials = snapshot.docs
        .map(doc => serializeMaterialData(doc.id, doc.data()))
        .filter(material => material.status !== "rejected")
        .slice(0, 3)
        .map(material => ({
          id: material.id,
          title: material.title || material.fileName || "Untitled material",
          materialType: material.materialType || "Material",
          createdAt: material.createdAt,
          href: material.downloadUrl
        }));
      return { code: course.code, title: course.title, materials };
    }));

    return respond({
      status: "ready", term: current.term, semester: current.semester,
      upcoming: current.upcoming, courses
    });
  } catch (error) {
    console.error("Homepage course materials failed", error);
    return respond({ status: "error", courses: [] }, 500);
  }
}
