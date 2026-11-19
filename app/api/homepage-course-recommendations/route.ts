import { NextRequest, NextResponse } from "next/server";
import { firestore } from "../../../server/firebase";
import { optionalSessionUser } from "../../../server/session";
import { courses } from "../../../data/courses";
import { degreePlans1 } from "../../../data/degree-plans-1";
import {
  completedMechanicalCourses,
  recommendMechanicalCourses
} from "../../../lib/mechanicalCourseRecommendations";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const headers = { "Cache-Control": "private, no-store" };
const respond = (data: Record<string, unknown>, status = 200) =>
  NextResponse.json(data, { status, headers });

export async function GET(request: NextRequest) {
  const user = await optionalSessionUser(request);
  if (!user) return respond({ status: "sign-in", courses: [] });

  try {
    const db = firestore();
    const userRef = db.collection("users").doc(user.uid);
    const [profile, progress] = await Promise.all([
      userRef.get(),
      userRef.collection("savedTools").doc("degree-progress").get()
    ]);

    const profileData = profile.exists ? profile.data() || {} : {};
    const major = String(profileData.major || "").trim();
    if (!major) return respond({ status: "select-major", courses: [] });
    if (major !== "Mechanical Engineering") {
      return respond({ status: "unsupported-major", courses: [] });
    }

    const saved = progress.exists ? progress.data() || {} : {};
    const keys = String(saved.major || "") === major && Array.isArray(saved.completedKeys)
      ? saved.completedKeys.filter((key: unknown): key is string => typeof key === "string")
      : [];
    const completed = completedMechanicalCourses(keys, degreePlans1["Mechanical Engineering"]);

    const recommendation = recommendMechanicalCourses({
      aucId: profileData.aucId || profileData.aucIdLookupKey,
      completedCodes: completed,
      hasSavedProgress: keys.length > 0,
      catalog: courses
    });

    if (!recommendation) return respond({ status: "invalid-id", courses: [] });
    return respond({ status: "ready", ...recommendation });
  } catch {
    return respond({ status: "error", courses: [] }, 500);
  }
}
