const admin = require("../_lib/firebaseAdmin");

const {
  getUserFromRequest
} = require("../_lib/securityHelpers");

const {
  getClientIp,
  consumeRateLimit,
  THIRTY_MINUTES_MS,
  ONE_HOUR_MS
} = require("../_lib/rateLimitHelpers");

const MAX_PUBLIC_REVIEWS = 200;
const MAX_ADMIN_REVIEWS = 500;

function cleanString(value, maxLength) {
  return String(value || "").trim().slice(0, maxLength);
}

function normalizeEmail(value) {
  return cleanString(value, 180).toLowerCase();
}

function getConfiguredAdminEmails() {
  return String(process.env.AUC_ATLAS_ADMIN_EMAILS || "")
    .split(",")
    .map(normalizeEmail)
    .filter(Boolean);
}

function getRequestBody(req) {
  if (req.body && typeof req.body === "object") {
    return req.body;
  }

  if (typeof req.body === "string") {
    try {
      return JSON.parse(req.body);
    } catch (error) {
      return Object.fromEntries(new URLSearchParams(req.body));
    }
  }

  return {};
}

function cleanProfessorId(value) {
  const professorId = cleanString(value, 80).toLowerCase();

  if (!/^[a-z0-9-]+$/.test(professorId)) {
    return "";
  }

  return professorId;
}

function cleanReviewId(value) {
  const reviewId = cleanString(value, 120);

  if (!reviewId || reviewId.includes("/") || !/^[A-Za-z0-9_-]+$/.test(reviewId)) {
    return "";
  }

  return reviewId;
}

function cleanRating(value) {
  const rating = Math.round(Number(value));

  if (!Number.isFinite(rating) || rating < 1 || rating > 5) {
    return 0;
  }

  return rating;
}

function timestampToMillis(value) {
  if (!value) return 0;
  if (typeof value.toMillis === "function") return value.toMillis();
  if (typeof value.toDate === "function") return value.toDate().getTime();

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 0 : date.getTime();
}

function serializeTimestamp(value) {
  const millis = timestampToMillis(value);
  return millis ? new Date(millis).toISOString() : null;
}

function serializeReview(reviewDoc, options) {
  const settings = options || {};
  const data = reviewDoc.data() || {};
  const review = {
    id: reviewDoc.id,
    professorId: data.professorId || "",
    professorName: data.professorName || "",
    reviewerUid: data.reviewerUid || "",
    reviewerName: data.reviewerName || "AUC student",
    reviewerPhoto: data.reviewerPhoto || "",
    course: data.course || "",
    term: data.term || "",
    rating: Number(data.rating || 0),
    text: data.text || "",
    createdAt: serializeTimestamp(data.createdAt)
  };

  if (settings.includePrivate) {
    review.reviewerEmail = data.reviewerEmail || "";
  }

  return review;
}

function getReviewTime(review) {
  const date = new Date(review.createdAt || 0);
  return Number.isNaN(date.getTime()) ? 0 : date.getTime();
}

async function getSignedInUser(req) {
  return await getUserFromRequest(req, {
    checkRevoked: true,
    requireCompletedTwoFactor: true
  });
}

function rolesIncludeAdmin(value) {
  if (Array.isArray(value)) {
    return value.map(function (role) {
      return String(role || "").trim().toLowerCase();
    }).includes("admin");
  }

  return String(value || "")
    .split(",")
    .map(function (role) {
      return role.trim().toLowerCase();
    })
    .includes("admin");
}

async function requireAdmin(decodedUser) {
  const db = admin.firestore();
  const userRecord = await admin.auth().getUser(decodedUser.uid);
  const customClaims = userRecord.customClaims || {};
  const email = normalizeEmail(userRecord.email || decodedUser.email || "");
  const adminDoc = await db.collection("adminUsers").doc(decodedUser.uid).get();
  const adminData = adminDoc.exists ? adminDoc.data() || {} : {};
  const assignedByClaim = customClaims.admin === true ||
    customClaims.role === "admin" ||
    rolesIncludeAdmin(customClaims.roles);
  const assignedByAdminDoc = adminDoc.exists && adminData.active === true;
  const assignedByEnvironment = getConfiguredAdminEmails().includes(email);

  if (!assignedByClaim && !assignedByAdminDoc && !assignedByEnvironment) {
    const error = new Error("You do not have permission to manage reviews.");
    error.statusCode = 403;
    throw error;
  }

  return {
    uid: decodedUser.uid,
    email
  };
}

async function getReviewerProfile(decodedUser) {
  const db = admin.firestore();
  const userRecord = await admin.auth().getUser(decodedUser.uid);
  const userDoc = await db.collection("users").doc(decodedUser.uid).get();
  const userData = userDoc.exists ? userDoc.data() || {} : {};
  const email = userRecord.email || userData.email || decodedUser.email || "";
  const reviewerName = userData.fullName ||
    userRecord.displayName ||
    decodedUser.name ||
    email.split("@")[0] ||
    "AUC student";

  return {
    reviewerName: cleanString(reviewerName, 120),
    reviewerEmail: cleanString(email, 180),
    reviewerPhoto: cleanString(userData.photoURL || userRecord.photoURL || "", 600)
  };
}

async function handlePublicReviews(req, res) {
  const professorId = cleanProfessorId((req.query || {}).professorId || (req.query || {}).professor);

  if (!professorId) {
    return res.status(400).json({ error: "Missing professor id." });
  }

  const snapshot = await admin.firestore()
    .collection("professorReviews")
    .where("professorId", "==", professorId)
    .limit(MAX_PUBLIC_REVIEWS)
    .get();

  const reviews = snapshot.docs
    .map(function (doc) {
      return serializeReview(doc);
    })
    .sort(function (a, b) {
      return getReviewTime(b) - getReviewTime(a);
    });

  return res.status(200).json({
    success: true,
    reviews
  });
}

async function handleAdminReviews(req, res) {
  const decodedUser = await getSignedInUser(req);
  await requireAdmin(decodedUser);

  const snapshot = await admin.firestore()
    .collection("professorReviews")
    .limit(MAX_ADMIN_REVIEWS)
    .get();

  const reviews = snapshot.docs
    .map(function (doc) {
      return serializeReview(doc, { includePrivate: true });
    })
    .sort(function (a, b) {
      return getReviewTime(b) - getReviewTime(a);
    });

  return res.status(200).json({
    success: true,
    reviews
  });
}

async function handleCreateReview(req, res) {
  const body = getRequestBody(req);
  const professorId = cleanProfessorId(body.professorId);
  const professorName = cleanString(body.professorName, 120);
  const course = cleanString(body.course, 80);
  const term = cleanString(body.term, 80);
  const rating = cleanRating(body.rating);
  const text = cleanString(body.text || body.review, 1600);

  if (!professorId || !course || !term || !rating || !text) {
    return res.status(400).json({ error: "Please complete every review field." });
  }

  const decodedUser = await getSignedInUser(req);
  const db = admin.firestore();
  const uidHash = require("crypto")
    .createHash("sha256")
    .update(decodedUser.uid)
    .digest("hex")
    .slice(0, 32);
  const reviewRef = db.collection("professorReviews").doc(professorId + "_" + uidHash);
  const previousUserReviews = await db.collection("professorReviews")
    .where("reviewerUid", "==", decodedUser.uid)
    .limit(MAX_ADMIN_REVIEWS)
    .get();
  const alreadyReviewedProfessor = previousUserReviews.docs.some(function (doc) {
    const data = doc.data() || {};
    return data.professorId === professorId;
  });

  if (alreadyReviewedProfessor) {
    return res.status(409).json({ error: "You already reviewed this professor." });
  }

  await consumeRateLimit({
    bucket: "professor-review-submit",
    keyParts: [decodedUser.uid, professorId, getClientIp(req)],
    firstLimit: 5,
    secondLimit: 10,
    firstLockMs: THIRTY_MINUTES_MS,
    secondLockMs: ONE_HOUR_MS,
    errorMessage: "Too many review submissions."
  });

  const reviewer = await getReviewerProfile(decodedUser);

  await db.runTransaction(async function (transaction) {
    const existingReview = await transaction.get(reviewRef);

    if (existingReview.exists) {
      const error = new Error("You already reviewed this professor.");
      error.statusCode = 409;
      throw error;
    }

    transaction.set(reviewRef, {
      professorId,
      professorName,
      reviewerUid: decodedUser.uid,
      reviewerName: reviewer.reviewerName,
      reviewerEmail: reviewer.reviewerEmail,
      reviewerPhoto: reviewer.reviewerPhoto,
      course,
      term,
      rating,
      text,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });
  });

  const savedReview = await reviewRef.get();

  return res.status(200).json({
    success: true,
    review: serializeReview(savedReview)
  });
}

async function handleDeleteReview(req, res) {
  const body = getRequestBody(req);
  const reviewId = cleanReviewId(body.reviewId);
  const decodedUser = await getSignedInUser(req);
  const adminUser = await requireAdmin(decodedUser);

  if (!reviewId) {
    return res.status(400).json({ error: "Missing review id." });
  }

  const db = admin.firestore();
  const reviewRef = db.collection("professorReviews").doc(reviewId);
  const reviewDoc = await reviewRef.get();

  if (!reviewDoc.exists) {
    return res.status(404).json({ error: "Review not found." });
  }

  const reviewData = reviewDoc.data() || {};

  await reviewRef.delete();

  await db.collection("adminReviewDeletions").doc(reviewId).set({
    reviewId,
    professorId: reviewData.professorId || "",
    reviewerUid: reviewData.reviewerUid || "",
    deletedByUid: adminUser.uid,
    deletedByEmail: adminUser.email,
    deletedAt: admin.firestore.FieldValue.serverTimestamp()
  }).catch(function () {});

  return res.status(200).json({
    success: true,
    reviewId
  });
}

module.exports = async function handler(req, res) {
  try {
    res.setHeader("Cache-Control", "no-store");

    if (req.method === "GET") {
      const scope = cleanString((req.query || {}).scope || "", 40);
      const adminMode = scope === "admin" || String((req.query || {}).admin || "") === "1";

      if (adminMode) {
        return await handleAdminReviews(req, res);
      }

      return await handlePublicReviews(req, res);
    }

    if (req.method === "POST") {
      const body = getRequestBody(req);
      const action = cleanString(body.action || "create", 40);

      if (action === "delete") {
        return await handleDeleteReview(req, res);
      }

      return await handleCreateReview(req, res);
    }

    return res.status(405).json({ error: "Method not allowed" });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      error: error.message || "Could not process review request."
    });
  }
};
