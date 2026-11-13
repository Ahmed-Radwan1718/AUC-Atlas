import { NextRequest, NextResponse } from "next/server";
import { type QueryDocumentSnapshot, type DocumentData } from "firebase-admin/firestore";
import { firestore } from "../../../server/firebase";
import { optionalSessionUser } from "../../../server/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function clean(value: unknown, limit: number): string {
  return String(value || "").trim().replace(/\s+/g, " ").slice(0, limit);
}
function timestampMillis(value: unknown): number {
  if (!value) return 0;
  if (typeof value === "object" && "toMillis" in value && typeof value.toMillis === "function") {
    return value.toMillis() as number;
  }
  if (typeof value === "object" && "seconds" in value && typeof value.seconds === "number") {
    return value.seconds * 1000;
  }
  const time = new Date(value as string).getTime();
  return Number.isFinite(time) ? time : 0;
}
function isoDate(value: unknown): string {
  const time = timestampMillis(value);
  return time ? new Date(time).toISOString() : "";
}
function serializeReview(doc: QueryDocumentSnapshot<DocumentData>) {
  const data = doc.data();
  return {
    id: doc.id,
    professorId: clean(data.professorId, 80),
    professorName: clean(data.professorName, 120),
    courseCode: clean(data.courseCode || data.courseTaken, 60).toUpperCase(),
    rating: Math.max(0, Math.min(5, Number(data.rating || 0))),
    createdAt: isoDate(data.createdAt || data.createdAtIso) || clean(data.createdAtIso, 80)
  };
}
function serializeMaterial(doc: QueryDocumentSnapshot<DocumentData>) {
  const data = doc.data();
  return {
    id: doc.id,
    courseCode: clean(data.courseCode, 40).toUpperCase(),
    courseTitle: clean(data.courseTitle, 160),
    materialType: clean(data.materialType || data.type || data.category, 80),
    title: clean(data.title, 160),
    fileName: clean(data.fileName, 240),
    fileType: clean(data.fileType, 120),
    createdAt: isoDate(data.createdAt || data.createdAtIso) || clean(data.createdAtIso, 80)
  };
}
async function latestReviews(limit: number) {
  const snapshot = await firestore().collection("professorReviews")
    .orderBy("createdAt", "desc").limit(Math.max(1, Math.min(12, limit))).get();
  return snapshot.docs.map(serializeReview);
}
async function rankedProfessors() {
  const reviews = await firestore().collection("professorReviews")
    .select("professorId", "professorName", "rating").get();
  const totals = new Map<string, { professorId: string; professorName: string; reviewCount: number; ratingTotal: number }>();
  reviews.forEach(doc => {
    const data = doc.data();
    const professorId = clean(data.professorId, 80);
    const professorName = clean(data.professorName, 120);
    const rating = Number(data.rating || 0);
    if (!professorId || !Number.isFinite(rating) || rating < 1 || rating > 5) return;
    const summary = totals.get(professorId) || { professorId, professorName, reviewCount: 0, ratingTotal: 0 };
    if (!summary.professorName && professorName) summary.professorName = professorName;
    summary.reviewCount += 1;
    summary.ratingTotal += rating;
    totals.set(professorId, summary);
  });
  return [...totals.values()].map(({ professorId, professorName, reviewCount, ratingTotal }) => ({
    professorId, professorName, reviewCount,
    averageRating: Math.round((ratingTotal / reviewCount) * 100) / 100
  })).sort((a, b) => b.averageRating - a.averageRating
    || b.reviewCount - a.reviewCount || a.professorName.localeCompare(b.professorName));
}
async function latestMaterials() {
  // Read every approved upload, including those beyond the former three-item cap.
  // Sort in memory to include documents that only have the legacy createdAtIso.
  const snapshot = await firestore().collection("courseMaterials")
    .where("status", "==", "approved").get();
  return snapshot.docs.map(serializeMaterial)
    .sort((a, b) => timestampMillis(b.createdAt) - timestampMillis(a.createdAt)
      || a.id.localeCompare(b.id));
}

export async function GET(request: NextRequest) {
  const headers = { "Cache-Control": "private, no-store" };
  const user = await optionalSessionUser(request);
  try {
    const db = firestore();
    // Public homepage statistics and course-material previews remain available.
    // Professor review counts, rankings, and individual review metadata are
    // only queried for verified AUC Atlas sessions.
    const [materialCount, latestMaterialData, reviewCount, latestReviewData, rankings] = await Promise.all([
      db.collection("courseMaterials").where("status", "==", "approved").count().get(),
      latestMaterials(),
      user ? db.collection("professorReviews").count().get() : Promise.resolve(null),
      user ? latestReviews(3) : Promise.resolve([]),
      user ? rankedProfessors() : Promise.resolve([])
    ]);
    const lowest = rankings.filter(professor => professor.averageRating <= 2)
      .sort((a, b) => a.averageRating - b.averageRating
        || b.reviewCount - a.reviewCount || a.professorName.localeCompare(b.professorName));
    return NextResponse.json({
      reviewsLocked: !user,
      reviewCount: reviewCount ? Number(reviewCount.data().count || 0) : null,
      materialCount: Number(materialCount.data().count || 0),
      latestReviews: latestReviewData,
      latestMaterials: latestMaterialData,
      topReviewedProfessors: rankings.filter(professor => professor.averageRating >= 4),
      lowestRatedProfessors: lowest
    }, { headers });
  } catch {
    return NextResponse.json({ error: "Could not load the homepage overview." }, { status: 500, headers });
  }
}
