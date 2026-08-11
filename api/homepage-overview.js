const admin = require("../server/_lib/firebaseAdmin");

function cleanString(value, maxLength) {
  return String(value || "").trim().replace(/\s+/g, " ").slice(0, maxLength);
}

function getTimestampMillis(value) {
  if (!value) return 0;
  if (typeof value.toDate === "function") return value.toDate().getTime();
  if (typeof value.seconds === "number") return value.seconds * 1000;
  if (typeof value._seconds === "number") return value._seconds * 1000;

  const parsedDate = new Date(value);
  return Number.isNaN(parsedDate.getTime()) ? 0 : parsedDate.getTime();
}

function serializeReview(doc) {
  const data = doc.data() || {};
  const createdAtMillis = getTimestampMillis(data.createdAt || data.createdAtIso);

  return {
    id: doc.id,
    professorId: cleanString(data.professorId, 80),
    professorName: cleanString(data.professorName, 120),
    courseCode: cleanString(
      data.courseCode || data.courseTaken,
      60
    ).toUpperCase(),
    rating: Math.max(
      0,
      Math.min(5, Number(data.rating || 0))
    ),
    createdAt: createdAtMillis
      ? new Date(createdAtMillis).toISOString()
      : cleanString(data.createdAtIso, 80)
  };
}

function serializeMaterial(doc) {
  const data = doc.data() || {};
  const createdAtMillis = getTimestampMillis(data.createdAt || data.createdAtIso);

  return {
    id: doc.id,
    courseCode: cleanString(
      data.courseCode,
      40
    ).toUpperCase(),
    courseTitle: cleanString(data.courseTitle, 160),
    materialType: cleanString(
      data.materialType ||
      data.type ||
      data.category,
      80
    ),
    title: cleanString(data.title, 160),
    createdAt: createdAtMillis
      ? new Date(createdAtMillis).toISOString()
      : cleanString(data.createdAtIso, 80)
  };
}

async function getLatestReviews(limit) {
  const snapshot = await admin.firestore()
    .collection("professorReviews")
    .orderBy("createdAt", "desc")
    .limit(
      Math.max(
        1,
        Math.min(12, limit)
      )
    )
    .get();
  const reviews = [];

  snapshot.forEach(function (doc) {
    reviews.push(serializeReview(doc));
  });

  return reviews;
}

async function getLatestMaterials(limit) {
  const safeLimit = Math.max(
    1,
    Math.min(
      12,
      Math.floor(Number(limit) || 3)
    )
  );
  const collection = admin.firestore()
    .collection("courseMaterials");
  let snapshot;

  try {
    snapshot = await collection
      .where("status", "==", "approved")
      .orderBy("createdAt", "desc")
      .limit(safeLimit)
      .get();
  } catch (error) {
    snapshot = await collection
      .orderBy("createdAt", "desc")
      .limit(20)
      .get();
  }

  const materials = [];

  snapshot.forEach(function (doc) {
    const data = doc.data() || {};

    if (
      cleanString(
        data.status,
        40
      ).toLowerCase() !== "approved"
    ) {
      return;
    }

    materials.push(serializeMaterial(doc));
  });

  materials.sort(function (a, b) {
    return (
      getTimestampMillis(b.createdAt) -
      getTimestampMillis(a.createdAt)
    );
  });

  return materials.slice(0, safeLimit);
}

module.exports = async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({
      error: "Method not allowed"
    });
  }

  try {
    const db = admin.firestore();
    const [
      reviewCountSnapshot,
      materialCountSnapshot,
      latestReviews,
      latestMaterials
    ] = await Promise.all([
      db.collection("professorReviews")
        .count()
        .get(),
      db.collection("courseMaterials")
        .where("status", "==", "approved")
        .count()
        .get(),
      getLatestReviews(3),
      getLatestMaterials(3)
    ]);

    res.setHeader(
      "Cache-Control",
      "public, max-age=60, s-maxage=300, stale-while-revalidate=600"
    );

    return res.status(200).json({
      reviewCount: Number(
        reviewCountSnapshot.data().count || 0
      ),
      materialCount: Number(
        materialCountSnapshot.data().count || 0
      ),
      latestReviews,
      latestMaterials
    });
  } catch (error) {
    return res.status(500).json({
      error: "Could not load the homepage overview."
    });
  }
};
