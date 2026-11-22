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
// Index-backed recent-file reads plus bounded lookups for complete selected bundles.
const MATERIAL_READ_LIMIT = 36;
const UPLOADS_PER_COURSE = 3;
const UPLOAD_FILE_LIMIT = 100;
const respond = (body: Record<string, unknown>, status = 200) =>
  NextResponse.json(body, { status, headers });

/**
 * The displayed semester can be browsed independently of saved enrollment.
 * When the calculated semester has no fixed course list yet, preview the
 * newest defined semester without claiming that it is current enrollment.
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
    const requested = request.nextUrl.searchParams.get("semester");
    if (requested !== null && !/^[1-8]$/.test(requested)) {
      return respond({ status: "error", courses: [] }, 400);
    }

    let semester = requested === null ? current.semester : Number(requested);
    let plan = getNewHomepageMechanicalSemesterPlan(semester);
    // A student can still browse real uploaded materials even if their own
    // later-semester plan has not been authored yet.
    const fallback = requested === null && !plan;
    if (fallback) {
      for (const candidate of [2, 1]) {
        const available = getNewHomepageMechanicalSemesterPlan(candidate);
        if (available) {
          semester = candidate;
          plan = available;
          break;
        }
      }
    }
    if (!plan) {
      return respond({
        status: "plan-pending", term: current.term,
        semester, courses: []
      });
    }
    const preview = semester !== current.semester;

    const courseCollection = firestore().collection("courseMaterials");
    const courses = await Promise.all(plan.courses.map(async course => {
      const snapshot = await courseCollection
        .where("courseCode", "==", course.code)
        .orderBy("createdAt", "desc")
        .limit(MATERIAL_READ_LIMIT).get();

      // The course page groups files by their uploadGroupId. Repeat that
      // grouping here instead of treating each file as a separate upload.
      type FileRecord = ReturnType<typeof serializeMaterialData>;
      const byUpload = new Map<string, FileRecord[]>();
      for (const doc of snapshot.docs) {
        const file = serializeMaterialData(doc.id, doc.data());
        if (file.status === "rejected") continue;
        const groupKey = file.uploadGroupId || file.id;
        if (!byUpload.has(groupKey)) byUpload.set(groupKey, []);
        byUpload.get(groupKey)!.push(file);
      }

      const recentGroups = [...byUpload.entries()].slice(0, UPLOADS_PER_COURSE);
      const materials = await Promise.all(recentGroups.map(async ([groupKey, initialFiles]) => {
        let files = initialFiles;
        const uploadGroupId = initialFiles[0]?.uploadGroupId;

        // The first page of recent files could cut through a large upload.
        // Fetch the full selected bundle, including older files outside
        // the recent-material window, just as the course page presents it.
        if (uploadGroupId && !uploadGroupId.startsWith("single-")) {
          const completeUpload = await courseCollection
            .where("uploadGroupId", "==", uploadGroupId)
            .limit(UPLOAD_FILE_LIMIT).get();
          files = completeUpload.docs
            .map(doc => serializeMaterialData(doc.id, doc.data()))
            .filter(file => file.status !== "rejected" &&
              file.courseCode === course.code &&
              file.uploadGroupId === uploadGroupId);
        }

        files.sort((a, b) => Date.parse(b.createdAt || "") - Date.parse(a.createdAt || ""));
        const first = files[0];
        if (!first) return null;

        return {
          id: groupKey,
          title: first.title || "Course material",
          materialType: first.materialType || "Material",
          professor: first.professor || "Professor not listed",
          semester: first.semester || "",
          createdAt: first.createdAt,
          files: files.map(file => ({
            id: file.id,
            fileName: file.fileName || file.title || "Course material",
            fileType: file.fileType || "",
            size: file.size || 0,
            href: file.downloadUrl
          }))
        };
      }));
      return {
        code: course.code, title: course.title,
        materials: materials.filter((upload): upload is NonNullable<typeof upload> => Boolean(upload))
      };
    }));

    // Only show courses that have approved uploaded files.
    const coursesWithMaterials = courses.filter(course => course.materials.length > 0);

    return respond({
      status: "ready", term: current.term, semester,
      currentSemester: current.semester, preview, fallback,
      upcoming: current.upcoming && !preview, courses: coursesWithMaterials
    });
  } catch (error) {
    console.error("Homepage course materials failed", error);
    return respond({ status: "error", courses: [] }, 500);
  }
}
