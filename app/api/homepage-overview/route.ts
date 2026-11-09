import { NextResponse } from "next/server";
import { type QueryDocumentSnapshot, type DocumentData } from "firebase-admin/firestore";
import { firestore } from "../../../server/firebase";

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
async function latestMaterials(limit: number) {
  const collection = firestore().collection("courseMaterials");
  const safeLimit = Math.max(1, Math.min(12, Math.floor(Number(limit) || 3)));
  let snapshot;
  try {
    snapshot = await collection.where("status", "==", "approved")
      .orderBy("createdAt", "desc").limit(safeLimit).get();
  } catch {
    snapshot = await collection.orderBy("createdAt", "desc").limit(20).get();
  }
  return snapshot.docs.filter(doc => clean(doc.data().status, 40).toLowerCase() === "approved")
    .map(serializeMaterial)
    .sort((a, b) => timestampMillis(b.createdAt) - timestampMillis(a.createdAt))
    .slice(0, safeLimit);
}

export async function GET() {
  try {
    const db = firestore();
    const [reviewCount, materialCount, latestReviewData, latestMaterialData, rankings] = await Promise.all([
      db.collection("professorReviews").count().get(),
      db.collection("courseMaterials").where("status", "==", "approved").count().get(),
      latestReviews(3),
      latestMaterials(3),
      rankedProfessors()
    ]);
    const lowest = [...rankings].sort((a, b) => a.averageRating - b.averageRating
      || b.reviewCount - a.reviewCount || a.professorName.localeCompare(b.professorName)).slice(0, 3);
    return NextResponse.json({
      reviewCount: Number(reviewCount.data().count || 0),
      materialCount: Number(materialCount.data().count || 0),
      latestReviews: latestReviewData,
      latestMaterials: latestMaterialData,
      topReviewedProfessors: rankings.slice(0, 12),
      lowestRatedProfessors: lowest
    }, { headers: { "Cache-Control": "public, max-age=300, s-maxage=3600, stale-while-revalidate=86400" } });
  } catch {
    return NextResponse.json({ error: "Could not load the homepage overview." }, { status: 500 });
  }
}
