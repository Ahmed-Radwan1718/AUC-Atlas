import { NextRequest, NextResponse } from "next/server";
import { firestore } from "../../../server/firebase";
import { optionalSessionUser } from "../../../server/session";
import { courses } from "../../../data/courses";
import { professors } from "../../../data/professors";
import { degreePlans1 } from "../../../data/degree-plans-1";
import { completedMechanicalCourses } from "../../../lib/mechanicalCourseRecommendations";
import {
  projectNextMechanicalSemester, rankProjectedCourseProfessors,
  type ProfessorReviewForRecommendation
} from "../../../lib/nextSemesterProfessorRecommendations";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const headers = { "Cache-Control": "private, no-store" };
const respond = (data: Record<string, unknown>, status = 200) =>
  NextResponse.json(data, { status, headers });

export async function GET(request: NextRequest) {
  const user = await optionalSessionUser(request);
  if (!user) return respond({ status: "sign-in", consider: [], avoid: [] });

  try {
    const db = firestore();
    const userRef = db.collection("users").doc(user.uid);
    const [profile, progress] = await Promise.all([
      userRef.get(),
      userRef.collection("savedTools").doc("degree-progress").get()
    ]);
    const profileData = profile.exists ? profile.data() || {} : {};
    const major = String(profileData.major || "").trim();
    if (!major) return respond({ status: "select-major", consider: [], avoid: [] });
    if (major !== "Mechanical Engineering") {
      return respond({ status: "unsupported-major", consider: [], avoid: [] });
    }

    const saved = progress.exists ? progress.data() || {} : {};
    const keys = String(saved.major || "") === major && Array.isArray(saved.completedKeys)
      ? saved.completedKeys.filter((key: unknown): key is string => typeof key === "string")
      : [];
    const completedCodes = completedMechanicalCourses(keys, degreePlans1["Mechanical Engineering"]);
    const projected = projectNextMechanicalSemester({
      aucId: profileData.aucId || profileData.aucIdLookupKey,
      completedCodes,
      hasSavedProgress: keys.length > 0,
      catalog: courses
    });
    if (!projected) return respond({ status: "invalid-id", consider: [], avoid: [] });

    const codes = [...new Set(projected.predictedCodes)];
    if (!codes.length) return respond({
      status: "ready", term: projected.term, predictedCourses: [],
      usedSavedProgress: projected.usedSavedProgress,
      consider: [], avoid: [], evidence: "historical-course-reviews"
    });

    const reviewsRef = db.collection("professorReviews");
    // Review records may use either the current courseCode field or its
    // courseTaken predecessor. Read both, deduplicate by document ID, and
    // select only fields needed for an aggregate. Do not return review text,
    // student IDs, or author information to the browser.
    const columns = ["professorId", "courseCode", "courseTaken", "rating",
      "authorUid", "authorUserId", "createdAt"] as const;
    const [current, legacy] = await Promise.all([
      reviewsRef.where("courseCode", "in", codes).select(...columns).get(),
      reviewsRef.where("courseTaken", "in", codes).select(...columns).get()
    ]);
    const raw = new Map<string, ProfessorReviewForRecommendation>();
    for (const snapshot of [current, legacy]) {
      for (const doc of snapshot.docs) raw.set(doc.id, { id: doc.id, ...doc.data() });
    }
    const ranked = rankProjectedCourseProfessors({
      predictedCodes: codes,
      reviews: [...raw.values()],
      professors,
      minReviews: 5,
      limit: 5
    });

    return respond({
      status: "ready", term: projected.term, predictedCourses: codes,
      usedSavedProgress: projected.usedSavedProgress,
      evidence: "historical-course-reviews",
      ...ranked
    });
  } catch (error) {
    console.error("Homepage professor recommendations failed", error);
    return respond({ status: "error", consider: [], avoid: [] }, 500);
  }
}
