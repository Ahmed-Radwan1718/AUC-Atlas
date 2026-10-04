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

async function getTopReviewedProfessors(limit) {
  const safeLimit = Math.max(
    1,
    Math.min(
      24,
      Math.floor(Number(limit) || 12)
    )
  );
  const snapshot = await admin.firestore()
    .collection("professorReviews")
    .select(
      "professorId",
      "professorName",
      "rating"
    )
    .get();
  const totals = new Map();

  snapshot.forEach(function (doc) {
    const data = doc.data() || {};
    const professorId = cleanString(
      data.professorId,
      80
    );
    const professorName = cleanString(
      data.professorName,
      120
    );
    const rating = Number(data.rating || 0);

    if (
      !professorId ||
      !Number.isFinite(rating) ||
      rating < 1 ||
      rating > 5
    ) {
      return;
    }

    const summary = totals.get(professorId) || {
      professorId,
      professorName,
      reviewCount: 0,
      ratingTotal: 0
    };

    if (!summary.professorName && professorName) {
      summary.professorName = professorName;
    }

    summary.reviewCount += 1;
    summary.ratingTotal += rating;
    totals.set(professorId, summary);
  });

  return Array.from(totals.values())
    .map(function (summary) {
      return {
        professorId: summary.professorId,
        professorName: summary.professorName,
        reviewCount: summary.reviewCount,
        averageRating: Math.round(
          (
            summary.ratingTotal /
            summary.reviewCount
          ) * 100
        ) / 100
      };
    })
    .sort(function (a, b) {
      if (b.averageRating !== a.averageRating) {
        return b.averageRating - a.averageRating;
      }

      if (b.reviewCount !== a.reviewCount) {
        return b.reviewCount - a.reviewCount;
      }

      return a.professorName.localeCompare(
        b.professorName
      );
    })
    .slice(0, safeLimit);
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
      latestMaterials,
      topReviewedProfessors
    ] = await Promise.all([
      db.collection("professorReviews")
        .count()
        .get(),
      db.collection("courseMaterials")
        .where("status", "==", "approved")
        .count()
        .get(),
      getLatestReviews(3),
      getLatestMaterials(3),
      getTopReviewedProfessors(12)
    ]);

    res.setHeader(
      "Cache-Control",
      "public, max-age=300, s-maxage=3600, stale-while-revalidate=86400"
    );

    return res.status(200).json({
      reviewCount: Number(
        reviewCountSnapshot.data().count || 0
      ),
      materialCount: Number(
        materialCountSnapshot.data().count || 0
      ),
      latestReviews,
      latestMaterials,
      topReviewedProfessors
    });
  } catch (error) {
    return res.status(500).json({
      error: "Could not load the homepage overview."
    });
  }
};
