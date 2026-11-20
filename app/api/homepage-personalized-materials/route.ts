import { NextRequest, NextResponse } from "next/server";
import { firestore } from "../../../server/firebase";
import { optionalSessionUser } from "../../../server/session";
import { verifiedMaterialUser } from "../../../server/materialUpload";
import { courses } from "../../../data/courses";
import { degreePlans1 } from "../../../data/degree-plans-1";
import { completedMechanicalCourses, recommendMechanicalCourses }
  from "../../../lib/mechanicalCourseRecommendations";
import { selectPersonalizedMaterials } from "../../../lib/personalizedMaterials";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const headers = { "Cache-Control": "private, no-store" };
const respond = (body: Record<string, unknown>, status = 200) =>
  NextResponse.json(body, { headers, status });

export async function GET(request: NextRequest) {
  const user = await optionalSessionUser(request);
  if (!user) return respond({ status: "sign-in", materials: [] });

  try {
    await verifiedMaterialUser(user);
    const db = firestore();
    const userRef = db.collection("users").doc(user.uid);
    const [profile, progress] = await Promise.all([
      userRef.get(),
      userRef.collection("savedTools").doc("degree-progress").get()
    ]);
    const profileData = profile.data() || {};
    const major = String(profileData.major || "").trim();
    if (!major) return respond({ status: "select-major", materials: [] });
    if (major !== "Mechanical Engineering") {
      return respond({ status: "unsupported-major", materials: [] });
    }
    const saved = progress.data() || {};
    const keys = String(saved.major || "") === major && Array.isArray(saved.completedKeys)
      ? saved.completedKeys.filter((key: unknown): key is string => typeof key === "string")
      : [];
    const completed = completedMechanicalCourses(keys, degreePlans1["Mechanical Engineering"]);
    const recommended = recommendMechanicalCourses({
      aucId: profileData.aucId || profileData.aucIdLookupKey,
      completedCodes: completed,
      hasSavedProgress: keys.length > 0,
      catalog: courses,
      limit: 8
    });
    if (!recommended) return respond({ status: "invalid-id", materials: [] });

    const courseCodes = [...new Set(recommended.courses.map(course => course.code))];
    if (!courseCodes.length) {
      return respond({ status: "ready", materials: [], term: recommended.term });
    }

    // Uses the deployed (courseCode ASC, createdAt DESC) Firestore index.
    // Bounded and scoped to the student's 8 or fewer suggested courses;
    // never scan the whole materials collection or fall back to global uploads.
    // Old materials without a status are allowed; rejected ones are filtered.
    const query = db.collection("courseMaterials")
      .where("courseCode", "in", courseCodes)
      .orderBy("createdAt", "desc")
      .limit(80);
    const snapshot = await query.get();
    const materials = selectPersonalizedMaterials({
      courseCodes,
      records: snapshot.docs.map(doc => ({ id: doc.id, data: doc.data() })),
      limit: 4
    });
    return respond({ status: "ready", materials, term: recommended.term });
  } catch (error) {
    console.error("Personalized course materials unavailable", error);
    return respond({ status: "error", materials: [] }, 500);
  }
}
