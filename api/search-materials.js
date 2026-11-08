const admin = require("../server/_lib/firebaseAdmin");
const {
  getOptionalSiteSessionUser
} = require("../server/_lib/securityHelpers");
const {
  consumeSecurityRateLimit
} = require("../server/_lib/securityRateLimits");

const MATERIAL_SEARCH_WINDOW_MS =
  60 * 1000;
const MATERIAL_SEARCH_MAX_REQUESTS = 20;
const MATERIAL_CACHE_DURATION_MS =
  15 * 60 * 1000;

let materialIndexCache = {
  expiresAt: 0,
  materials: []
};

function cleanString(value, maxLength) {
  return String(value || "")
    .trim()
    .replace(/\s+/g, " ")
    .slice(0, maxLength);
}

function normalize(value) {
  return cleanString(value, 500)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function getTimestampMillis(value) {
  if (!value) {
    return 0;
  }

  if (typeof value.toDate === "function") {
    return value.toDate().getTime();
  }

  if (typeof value.seconds === "number") {
    return value.seconds * 1000;
  }

  if (typeof value._seconds === "number") {
    return value._seconds * 1000;
  }

  const parsedDate = new Date(value);

  return Number.isNaN(parsedDate.getTime())
    ? 0
    : parsedDate.getTime();
}

function getMaterialScore(query, data) {
  const normalizedQuery = normalize(query);
  const terms = normalizedQuery.split(/\s+/).filter(Boolean);
  const title = normalize(data.title);
  const courseCode = normalize(data.courseCode);

  const searchableText = normalize([
    data.title,
    data.courseCode,
    data.courseTitle,
    data.professor,
    data.semester,
    data.materialType || data.type || data.category,
    data.fileName
  ].join(" "));

  if (!terms.length || !terms.every(function (term) {
    return searchableText.includes(term);
  })) {
    return -1;
  }

  let score = 0;

  if (title === normalizedQuery) {
    score += 500;
  } else if (title.startsWith(normalizedQuery)) {
    score += 300;
  } else if (title.includes(normalizedQuery)) {
    score += 180;
  }

  if (courseCode === normalizedQuery) {
    score += 260;
  } else if (courseCode.startsWith(normalizedQuery)) {
    score += 140;
  }

  if (searchableText.includes(normalizedQuery)) {
    score += 80;
  }

  return score;
}

async function getMaterialIndex() {
  if (materialIndexCache.expiresAt > Date.now()) {
    return materialIndexCache.materials;
  }

  const collection = admin
    .firestore()
    .collection("courseMaterials");

  let snapshot;

  try {
    snapshot = await collection
      .where("status", "==", "approved")
      .orderBy("createdAt", "desc")
      .limit(100)
      .get();
  } catch (error) {
    snapshot = await collection
      .orderBy("createdAt", "desc")
      .limit(100)
      .get();
  }

  const materials = [];

  snapshot.forEach(function (doc) {
    const data = doc.data() || {};
    const status = cleanString(data.status, 40).toLowerCase();

    if (status !== "approved") {
      return;
    }

    materials.push({
      id: doc.id,
      data,
      createdAtMillis: getTimestampMillis(
        data.createdAt || data.createdAtIso
      )
    });
  });

  materialIndexCache = {
    expiresAt: Date.now() + MATERIAL_CACHE_DURATION_MS,
    materials
  };

  return materials;
}

module.exports = async function handler(req, res) {
  try {
    if (req.method !== "GET") {
      res.setHeader("Allow", "GET");

      return res.status(405).json({
        error: "Method not allowed"
      });
    }

    const query = cleanString((req.query || {}).q, 100);

    res.setHeader("Cache-Control", "no-store");

    if (query.length < 2) {
      return res.status(200).json({
        materials: [],
        materialsLocked: false
      });
    }

    const decodedUser = await getOptionalSiteSessionUser(req, {
      checkRevoked: true
    });

    if (!decodedUser || !decodedUser.uid) {
      return res.status(200).json({
        materials: [],
        materialsLocked: true
      });
    }

    const userRecord = await admin
      .auth()
      .getUser(decodedUser.uid);

    const email = String(
      userRecord.email || decodedUser.email || ""
    ).trim().toLowerCase();

    if (
      !userRecord.emailVerified ||
      !email.endsWith("@aucegypt.edu")
    ) {
      return res.status(200).json({
        materials: [],
        materialsLocked: true
      });
    }

    await consumeSecurityRateLimit({
      scope: "material-search-user",
      identifier: decodedUser.uid,
      maxAttempts:
        MATERIAL_SEARCH_MAX_REQUESTS,
      windowMs:
        MATERIAL_SEARCH_WINDOW_MS,
      message:
        "Too many material searches. Please try again shortly."
    });

    const materialIndex = await getMaterialIndex();
    const materials = [];

    materialIndex.forEach(function (indexedMaterial) {
      const data = indexedMaterial.data;
      const score = getMaterialScore(query, data);

      if (score < 0) {
        return;
      }

      materials.push({
        id: indexedMaterial.id,
        title: cleanString(
          data.title || "Course material",
          160
        ),
        courseCode: cleanString(
          data.courseCode,
          40
        ).toUpperCase(),
        courseTitle: cleanString(
          data.courseTitle,
          160
        ),
        professor: cleanString(
          data.professor,
          120
        ),
        semester: cleanString(
          data.semester,
          80
        ),
        materialType: cleanString(
          data.materialType ||
            data.type ||
            data.category ||
            "Material",
          80
        ),
        score,
        createdAtMillis: indexedMaterial.createdAtMillis
      });
    });

    materials.sort(function (
      firstMaterial,
      secondMaterial
    ) {
      return (
        secondMaterial.score - firstMaterial.score ||
        secondMaterial.createdAtMillis -
          firstMaterial.createdAtMillis
      );
    });

    return res.status(200).json({
      materials: materials
        .slice(0, 20)
        .map(function (material) {
          return {
            id: material.id,
            title: material.title,
            courseCode: material.courseCode,
            courseTitle: material.courseTitle,
            professor: material.professor,
            semester: material.semester,
            materialType: material.materialType,
            score: material.score
          };
        }),
      materialsLocked: false
    });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      error:
        error.message ||
        "Could not search course materials."
    });
  }
};
