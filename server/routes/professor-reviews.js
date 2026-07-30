const crypto = require("crypto");
const admin = require("../_lib/firebaseAdmin");
const courseDetailsByCode = require("../../courses-data.js");

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
const SEMESTER_OPTIONS = [
  { value: "fall-2024", label: "Fall 2024" },
  { value: "spring-2025", label: "Spring 2025" },
  { value: "summer-2025", label: "Summer 2025" },
  { value: "fall-2025", label: "Fall 2025" },
  { value: "spring-2026", label: "Spring 2026" },
  { value: "summer-2026", label: "Summer 2026" },
  { value: "fall-2026", label: "Fall 2026" },
  { value: "spring-2027", label: "Spring 2027" },
  { value: "summer-2027", label: "Summer 2027" }
];

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

function normalizeCourseKey(value) {
  return String(value || "").toLowerCase().replace(/[^a-z0-9]/g, "");
}

function cleanCourseCode(value) {
  const compact = cleanString(value, 40).toUpperCase().replace(/[^A-Z0-9]/g, "");
  const match = compact.match(/^([A-Z]{3,4})([0-9]{4}[A-Z]?)$/);

  return match ? match[1] + " " + match[2] : "";
}

function getSemesterOption(value) {
  const normalizedValue = cleanString(value, 80).toLowerCase();

  return SEMESTER_OPTIONS.find(function (semester) {
    return semester.value === normalizedValue || semester.label.toLowerCase() === normalizedValue;
  }) || null;
}

function getRecordedCourseForProfessor(professorId, requestedCourseCode) {
  const requestedKey = normalizeCourseKey(requestedCourseCode);

  if (!professorId || !requestedKey) {
    return null;
  }

  const courseCode = Object.keys(courseDetailsByCode || {}).find(function (code) {
    const details = courseDetailsByCode[code] || {};
    const professorsForCourse = Array.isArray(details.professors) ? details.professors : [];
    const courseMatches = normalizeCourseKey(code) === requestedKey;
    const professorMatches = professorsForCourse.some(function (entry) {
      const professorEntry = typeof entry === "string" ? { id: entry } : entry || {};
      return professorEntry.id === professorId;
    });

    return courseMatches && professorMatches;
  });

  if (!courseCode) {
    return null;
  }

  const details = courseDetailsByCode[courseCode] || {};

  return {
    code: courseCode,
    title: cleanString(details.title || courseCode, 140)
  };
}

function getCourseDisplay(course) {
  return [course.code, course.title].filter(Boolean).join(" - ");
}

function getStructuredReviewInput(body, professorId) {
  const course = getRecordedCourseForProfessor(professorId, cleanCourseCode(body.courseCode));
  const semester = getSemesterOption(body.semester);

  if (!course || !semester) {
    return null;
  }

  return {
    courseCode: course.code,
    courseTitle: course.title,
    courseKey: normalizeCourseKey(course.code),
    course: getCourseDisplay(course),
    semester: semester.value,
    semesterLabel: semester.label,
    term: semester.label
  };
}

function getLegacyReviewInput(body) {
  return {
    course: cleanString(body.course, 120),
    term: cleanString(body.term, 120)
  };
}

async function findDuplicateStructuredReview(db, reviewerUid, professorId, courseCode, semester, ignoreReviewId) {
  const snapshot = await db.collection("professorReviews")
    .where("reviewerUid", "==", reviewerUid)
    .limit(MAX_ADMIN_REVIEWS)
    .get();

  return snapshot.docs.find(function (doc) {
    const data = doc.data() || {};

    return doc.id !== ignoreReviewId &&
      data.professorId === professorId &&
      normalizeCourseKey(data.courseCode) === normalizeCourseKey(courseCode) &&
      data.semester === semester;
  }) || null;
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
    courseCode: data.courseCode || "",
    courseTitle: data.courseTitle || "",
    course: data.course || "",
    semester: data.semester || "",
    semesterLabel: data.semesterLabel || "",
    term: data.term || "",
    rating: Number(data.rating || 0),
    clarityRating: Number(data.clarityRating || 0),
    gradingRating: Number(data.gradingRating || 0),
    workloadRating: Number(data.workloadRating || 0),
    attendanceRating: Number(data.attendanceRating || 0),
    takeAgain: data.takeAgain || "",
    text: data.text || "",
    createdAt: serializeTimestamp(data.createdAt),
    updatedAt: serializeTimestamp(data.updatedAt)
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

async function handleMyReviews(req, res) {
  const decodedUser = await getSignedInUser(req);

  const snapshot = await admin.firestore()
    .collection("professorReviews")
    .where("reviewerUid", "==", decodedUser.uid)
    .limit(MAX_PUBLIC_REVIEWS)
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
  const courseInput = getStructuredReviewInput(body, professorId);
  const rating = cleanRating(body.rating);
  const clarityRating = cleanRating(body.clarityRating);
  const gradingRating = cleanRating(body.gradingRating);
  const workloadRating = cleanRating(body.workloadRating);
  const attendanceRating = cleanRating(body.attendanceRating);
  const takeAgain = cleanString(body.takeAgain, 12).toLowerCase();
  const text = cleanString(body.text || body.review, 1600);

  if (!professorId || !courseInput || !rating || !clarityRating || !gradingRating || !workloadRating || !attendanceRating || (takeAgain !== "yes" && takeAgain !== "no") || !text) {
    return res.status(400).json({ error: "Choose a recorded course, a standard semester, and complete every review field." });
  }

  const decodedUser = await getSignedInUser(req);
  const db = admin.firestore();
  const duplicateReview = await findDuplicateStructuredReview(db, decodedUser.uid, professorId, courseInput.courseCode, courseInput.semester, "");

  if (duplicateReview) {
    return res.status(409).json({ error: "You already reviewed this professor for that course and semester." });
  }

  const uidHash = crypto
    .createHash("sha256")
    .update(decodedUser.uid)
    .digest("hex")
    .slice(0, 32);
  const reviewRef = db.collection("professorReviews").doc(professorId + "_" + courseInput.courseKey + "_" + courseInput.semester + "_" + uidHash);

  await consumeRateLimit({
    bucket: "professor-review-submit",
    keyParts: [decodedUser.uid, professorId, courseInput.courseKey, courseInput.semester, getClientIp(req)],
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
      const error = new Error("You already reviewed this professor for that course and semester.");
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
      courseCode: courseInput.courseCode,
      courseTitle: courseInput.courseTitle,
      course: courseInput.course,
      semester: courseInput.semester,
      semesterLabel: courseInput.semesterLabel,
      term: courseInput.term,
      rating,
      clarityRating,
      gradingRating,
      workloadRating,
      attendanceRating,
      takeAgain,
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

async function handleUpdateReview(req, res) {
  const body = getRequestBody(req);
  const reviewId = cleanReviewId(body.reviewId);
  const rating = cleanRating(body.rating);
  const clarityRating = cleanRating(body.clarityRating);
  const gradingRating = cleanRating(body.gradingRating);
  const workloadRating = cleanRating(body.workloadRating);
  const attendanceRating = cleanRating(body.attendanceRating);
  const takeAgain = cleanString(body.takeAgain, 12).toLowerCase();
  const text = cleanString(body.text || body.review, 1600);
  const decodedUser = await getSignedInUser(req);

  if (!reviewId) {
    return res.status(400).json({ error: "Missing review id." });
  }

  if (!rating || !clarityRating || !gradingRating || !workloadRating || !attendanceRating || (takeAgain !== "yes" && takeAgain !== "no") || !text) {
    return res.status(400).json({ error: "Fill out every rating, the take-again answer, and the review before saving." });
  }

  const db = admin.firestore();
  const reviewRef = db.collection("professorReviews").doc(reviewId);
  const reviewDoc = await reviewRef.get();

  if (!reviewDoc.exists) {
    return res.status(404).json({ error: "Review not found." });
  }

  const reviewData = reviewDoc.data() || {};

  if (reviewData.reviewerUid !== decodedUser.uid) {
    return res.status(403).json({ error: "You can only edit your own reviews." });
  }

  const wantsStructuredCourse = Boolean(cleanString(body.courseCode, 40) || cleanString(body.semester, 80));
  const updateData = {
    rating,
    clarityRating,
    gradingRating,
    workloadRating,
    attendanceRating,
    takeAgain,
    text,
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  };

  if (wantsStructuredCourse) {
    const courseInput = getStructuredReviewInput(body, cleanProfessorId(reviewData.professorId));

    if (!courseInput) {
      return res.status(400).json({ error: "Choose one of the recorded courses and a standard semester before saving." });
    }

    const duplicateReview = await findDuplicateStructuredReview(db, decodedUser.uid, reviewData.professorId, courseInput.courseCode, courseInput.semester, reviewId);

    if (duplicateReview) {
      return res.status(409).json({ error: "You already have a review for that professor, course, and semester." });
    }

    Object.assign(updateData, {
      courseCode: courseInput.courseCode,
      courseTitle: courseInput.courseTitle,
      course: courseInput.course,
      semester: courseInput.semester,
      semesterLabel: courseInput.semesterLabel,
      term: courseInput.term
    });
  } else {
    const legacyInput = getLegacyReviewInput(body);

    if (!legacyInput.course || !legacyInput.term) {
      return res.status(400).json({ error: "This legacy review needs its original course and term before saving." });
    }

    Object.assign(updateData, {
      course: legacyInput.course,
      term: legacyInput.term
    });
  }

  await reviewRef.update(updateData);

  const updatedReview = await reviewRef.get();

  return res.status(200).json({
    success: true,
    review: serializeReview(updatedReview, { includePrivate: true })
  });
}

async function handleDeleteReview(req, res) {
  const body = getRequestBody(req);
  const reviewId = cleanReviewId(body.reviewId);
  const decodedUser = await getSignedInUser(req);

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
  const isReviewOwner = reviewData.reviewerUid === decodedUser.uid;
  let adminUser = null;

  if (!isReviewOwner) {
    adminUser = await requireAdmin(decodedUser);
  }

  await reviewRef.delete();

  if (adminUser) {
    await db.collection("adminReviewDeletions").doc(reviewId).set({
      reviewId,
      professorId: reviewData.professorId || "",
      courseCode: reviewData.courseCode || "",
      semester: reviewData.semester || "",
      reviewerUid: reviewData.reviewerUid || "",
      deletedByUid: adminUser.uid,
      deletedByEmail: adminUser.email,
      deletedAt: admin.firestore.FieldValue.serverTimestamp()
    }).catch(function () {});
  }

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
      const myMode = scope === "mine" || scope === "me";

      if (adminMode) {
        return await handleAdminReviews(req, res);
      }

      if (myMode) {
        return await handleMyReviews(req, res);
      }

      return await handlePublicReviews(req, res);
    }

    if (req.method === "POST") {
      const body = getRequestBody(req);
      const action = cleanString(body.action || "create", 40);

      if (action === "delete") {
        return await handleDeleteReview(req, res);
      }

      if (action === "update") {
        return await handleUpdateReview(req, res);
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
