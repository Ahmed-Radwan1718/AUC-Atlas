const admin = require("../_lib/firebaseAdmin");

const { getSiteSessionUser } = require("../_lib/securityHelpers");

const allowedValues = {
  recommendation: ["Yes", "Depends", "No"],
  attendancePolicy: ["Required", "Sometimes checked", "Not important", "Not sure"],
  workload: ["Light", "Moderate", "Heavy"],
  lectureUsefulness: ["Essential", "Helpful", "Attending means less work at home", "Skippable", "Not lecture-based"],
  officeHours: ["Helpful", "Available but limited", "Hard to reach", "Did not use"],
  gradingStyle: ["Exams-heavy", "Projects-heavy", "Assignments-heavy", "Participation-heavy", "Mixed"],
  examDifficulty: ["Easier than class material", "Matches class material", "Harder than class material", "No exams"],
  gradingTransparency: ["Rubrics clear", "Somewhat clear", "Unclear"],
  feedbackQuality: ["Helpful", "Minimal", "None", "Not applicable"]
};

function cleanString(value, maxLength) {
  return String(value || "").trim().replace(/\s+/g, " ").slice(0, maxLength);
}

function cleanNote(value, maxLength) {
  return String(value || "").trim().slice(0, maxLength);
}

function cleanChoice(value, key) {
  const cleanedValue = cleanString(value, 80);
  return allowedValues[key].includes(cleanedValue) ? cleanedValue : "";
}

function createReviewError(message, statusCode) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
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
  const createdAtMillis = getTimestampMillis(data.createdAt);
  const authorUid = data.authorUid || data.authorUserId || "";

  return {
    id: doc.id,
    professorId: data.professorId || "",
    professorName: data.professorName || "",
    courseTaken: data.courseTaken || "",
    semesterTaken: data.semesterTaken || "",
    rating: Number(data.rating || 0),
    recommendation: data.recommendation || "",
    recommendationReason: data.recommendationReason || "",
    attendancePolicy: data.attendancePolicy || "",
    workload: data.workload || "",
    lectureUsefulness: data.lectureUsefulness || "",
    officeHours: data.officeHours || "",
    gradingStyle: data.gradingStyle || "",
    examDifficulty: data.examDifficulty || "",
    gradingTransparency: data.gradingTransparency || "",
    feedbackQuality: data.feedbackQuality || "",
    studentNote: data.studentNote || "",
    authorUid,
    authorUserId: authorUid,
    authorName: data.authorName || "AUC student",
    authorPhotoURL: data.authorPhotoURL || "",
    createdAt: createdAtMillis ? new Date(createdAtMillis).toISOString() : (data.createdAtIso || "")
  };
}

async function getAuthorProfile(decodedUser) {
  const userRecord = await admin.auth().getUser(decodedUser.uid);
  const userDoc = await admin.firestore().collection("users").doc(decodedUser.uid).get();
  const userData = userDoc.exists ? userDoc.data() || {} : {};
  const email = userRecord.email || userData.email || decodedUser.email || "";
  const authorName = userData.fullName || userRecord.displayName || email.split("@")[0] || "AUC student";
  const authorPhotoURL = userData.photoURL || userRecord.photoURL || "";

  return {
    authorName: cleanString(authorName, 80),
    authorPhotoURL: cleanString(authorPhotoURL, 500)
  };
}

async function ensureVerifiedReviewAuthor(decodedUser) {
  if (!decodedUser || !decodedUser.uid) {
    throw createReviewError("Please log in before submitting a review.", 401);
  }

  if (decodedUser.email_verified === true) {
    return;
  }

  const userRecord = await admin.auth().getUser(decodedUser.uid);

  if (!userRecord.emailVerified) {
    throw createReviewError("Please verify your email address before submitting a professor review.", 403);
  }
}

async function getProfessorReviews(professorId) {
  const snapshot = await admin.firestore()
    .collection("professorReviews")
    .where("professorId", "==", professorId)
    .limit(100)
    .get();

  const reviews = [];

  snapshot.forEach(function (doc) {
    reviews.push(serializeReview(doc));
  });

  reviews.sort(function (a, b) {
    return getTimestampMillis(b.createdAt) - getTimestampMillis(a.createdAt);
  });

  return reviews;
}

module.exports = async function handler(req, res) {
  try {
    if (req.method === "GET") {
      const professorId = cleanString((req.query || {}).professorId, 80);

      if (!professorId) {
        throw createReviewError("Professor not found.", 400);
      }

      const reviews = await getProfessorReviews(professorId);
      return res.status(200).json({ reviews });
    }

    if (req.method !== "POST") {
      return res.status(405).json({ error: "Method not allowed" });
    }

    const decodedUser = await getSiteSessionUser(req, {
      checkRevoked: true
    });
    await ensureVerifiedReviewAuthor(decodedUser);

    const body = req.body || {};
    const professorId = cleanString(body.professorId, 80);
    const professorName = cleanString(body.professorName, 120);
    const courseTaken = cleanString(body.courseTaken, 60);
    const semesterTaken = cleanString(body.semesterTaken, 60);
    const rating = Number(body.rating || 0);
    const recommendation = cleanChoice(body.recommendation, "recommendation");
    const recommendationReason = cleanNote(body.recommendationReason, 220);
    const studentNote = cleanNote(body.studentNote, 360);

    if (!professorId || !professorName) {
      throw createReviewError("Professor not found.", 400);
    }

    if (!courseTaken) {
      throw createReviewError("Please enter the course taken.", 400);
    }

    if (!semesterTaken) {
      throw createReviewError("Please enter the semester taken.", 400);
    }

    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      throw createReviewError("Please choose a star rating.", 400);
    }

    if (!recommendation) {
      throw createReviewError("Please choose a recommendation.", 400);
    }

    if (recommendation === "Depends" && !recommendationReason) {
      throw createReviewError("Please explain what it depends on.", 400);
    }

    if (!studentNote) {
      throw createReviewError("Please add a short note for students.", 400);
    }

    const authorProfile = await getAuthorProfile(decodedUser);
    const createdAtIso = new Date().toISOString();
    const reviewData = {
      professorId,
      professorName,
      courseTaken,
      semesterTaken,
      rating,
      recommendation,
      recommendationReason,
      attendancePolicy: cleanChoice(body.attendancePolicy, "attendancePolicy"),
      workload: cleanChoice(body.workload, "workload"),
      lectureUsefulness: cleanChoice(body.lectureUsefulness, "lectureUsefulness"),
      officeHours: cleanChoice(body.officeHours, "officeHours"),
      gradingStyle: cleanChoice(body.gradingStyle, "gradingStyle"),
      examDifficulty: cleanChoice(body.examDifficulty, "examDifficulty"),
      gradingTransparency: cleanChoice(body.gradingTransparency, "gradingTransparency"),
      feedbackQuality: cleanChoice(body.feedbackQuality, "feedbackQuality"),
      studentNote,
      authorUid: decodedUser.uid,
      authorUserId: decodedUser.uid,
      authorName: authorProfile.authorName,
      authorPhotoURL: authorProfile.authorPhotoURL,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      createdAtIso
    };

    const reviewRef = await admin.firestore().collection("professorReviews").add(reviewData);
    const reviews = await getProfessorReviews(professorId);

    return res.status(201).json({
      success: true,
      review: Object.assign({ id: reviewRef.id, createdAt: createdAtIso }, reviewData),
      reviews
    });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      error: error.message || "Could not save review."
    });
  }
};
