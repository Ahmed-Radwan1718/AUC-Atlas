import { NextResponse } from "next/server";
import type { DocumentData, QueryDocumentSnapshot } from "firebase-admin/firestore";
import { cleanString, getTimestampMillis } from "@/lib/server/backend-utils";
import { getAdminFirestore } from "@/lib/server/firebase-admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function serializeReview(doc: QueryDocumentSnapshot<DocumentData>) {
  const data = doc.data() || {};
  const createdAtMillis = getTimestampMillis(data.createdAt || data.createdAtIso);

  return {
    id: doc.id,
    professorId: cleanString(data.professorId, 80),
    professorName: cleanString(data.professorName, 120),
    courseCode: cleanString(data.courseCode || data.courseTaken, 60).toUpperCase(),
    rating: Math.max(0, Math.min(5, Number(data.rating || 0))),
    createdAt: createdAtMillis
      ? new Date(createdAtMillis).toISOString()
      : cleanString(data.createdAtIso, 80),
  };
}

function serializeMaterial(doc: QueryDocumentSnapshot<DocumentData>) {
  const data = doc.data() || {};
  const createdAtMillis = getTimestampMillis(data.createdAt || data.createdAtIso);

  return {
    id: doc.id,
    courseCode: cleanString(data.courseCode, 40).toUpperCase(),
    courseTitle: cleanString(data.courseTitle, 160),
    materialType: cleanString(data.materialType || data.type || data.category, 80),
    title: cleanString(data.title, 160),
    createdAt: createdAtMillis
      ? new Date(createdAtMillis).toISOString()
      : cleanString(data.createdAtIso, 80),
  };
}

async function getLatestReviews(limit: number) {
  const snapshot = await getAdminFirestore()
    .collection("professorReviews")
    .orderBy("createdAt", "desc")
    .limit(Math.max(1, Math.min(12, limit)))
    .get();

  return snapshot.docs.map(serializeReview);
}

async function getTopReviewedProfessors(limit: number) {
  const safeLimit = Math.max(1, Math.min(24, Math.floor(Number(limit) || 12)));
  const snapshot = await getAdminFirestore()
    .collection("professorReviews")
    .select("professorId", "professorName", "rating")
    .get();
  const totals = new Map<
    string,
    { professorId: string; professorName: string; reviewCount: number; ratingTotal: number }
  >();

  snapshot.forEach((doc) => {
    const data = doc.data() || {};
    const professorId = cleanString(data.professorId, 80);
    const professorName = cleanString(data.professorName, 120);
    const rating = Number(data.rating || 0);

    if (!professorId || !Number.isFinite(rating) || rating < 1 || rating > 5) {
      return;
    }

    const summary = totals.get(professorId) || {
      professorId,
      professorName,
      reviewCount: 0,
      ratingTotal: 0,
    };

    if (!summary.professorName && professorName) summary.professorName = professorName;
    summary.reviewCount += 1;
    summary.ratingTotal += rating;
    totals.set(professorId, summary);
  });

  return Array.from(totals.values())
    .map((summary) => ({
      professorId: summary.professorId,
      professorName: summary.professorName,
      reviewCount: summary.reviewCount,
      averageRating:
        Math.round((summary.ratingTotal / summary.reviewCount) * 100) / 100,
    }))
    .sort((a, b) => {
      if (b.averageRating !== a.averageRating) return b.averageRating - a.averageRating;
      if (b.reviewCount !== a.reviewCount) return b.reviewCount - a.reviewCount;
      return a.professorName.localeCompare(b.professorName);
    })
    .slice(0, safeLimit);
}

async function getLatestMaterials(limit: number) {
  const safeLimit = Math.max(1, Math.min(12, Math.floor(Number(limit) || 3)));
  const collection = getAdminFirestore().collection("courseMaterials");
  let snapshot;

  try {
    snapshot = await collection
      .where("status", "==", "approved")
      .orderBy("createdAt", "desc")
      .limit(safeLimit)
      .get();
  } catch {
    snapshot = await collection.orderBy("createdAt", "desc").limit(20).get();
  }

  return snapshot.docs
    .filter((doc) => cleanString(doc.data().status, 40).toLowerCase() === "approved")
    .map(serializeMaterial)
    .sort((a, b) => getTimestampMillis(b.createdAt) - getTimestampMillis(a.createdAt))
    .slice(0, safeLimit);
}

export async function GET() {
  try {
    const db = getAdminFirestore();
    const [
      reviewCountSnapshot,
      materialCountSnapshot,
      latestReviews,
      latestMaterials,
      topReviewedProfessors,
    ] = await Promise.all([
      db.collection("professorReviews").count().get(),
      db.collection("courseMaterials").where("status", "==", "approved").count().get(),
      getLatestReviews(3),
      getLatestMaterials(3),
      getTopReviewedProfessors(12),
    ]);

    return NextResponse.json(
      {
        reviewCount: Number(reviewCountSnapshot.data().count || 0),
        materialCount: Number(materialCountSnapshot.data().count || 0),
        latestReviews,
        latestMaterials,
        topReviewedProfessors,
      },
      {
        headers: {
          "Cache-Control":
            "public, max-age=300, s-maxage=3600, stale-while-revalidate=86400",
        },
      },
    );
  } catch {
    return NextResponse.json(
      { error: "Could not load the homepage overview." },
      { status: 500 },
    );
  }
}
