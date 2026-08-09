const admin = require("../_lib/firebaseAdmin");

const { getSiteSessionUser } = require("../_lib/securityHelpers");

const REVIEW_MAX_PER_PROFESSOR = 5;
const REVIEW_SUBMISSION_WINDOW_MS =
  60 * 60 * 1000;
const REVIEW_MAX_SUBMISSIONS_PER_WINDOW = 5;

const allowedValues = {
  recommendation: ["Yes", "Depends", "No"],
  attendancePolicy: ["Required", "Sometimes checked", "Not important", "Not sure"],
  workload: ["Light", "Moderate", "Heavy"],
  lectureUsefulness: ["Essential", "Helpful", "Attending means less work at home", "Skippable", "Not lecture-based"],
  officeHours: ["Helpful", "Available but limited", "Hard to reach", "Did not use"],
  gradingStyle: ["Exams-heavy", "Projects-heavy", "Assignments-heavy", "Participation-heavy", "Mixed"],
  examDifficulty: ["Easier than class material", "Matches class material", "Harder than class material", "No exams"],
  gradingTransparency: ["Rubric is clear", "Somewhat clear", "Unclear"],
  feedbackQuality: ["Helpful", "Minimal", "None", "Not applicable"]
};

function cleanString(value, maxLength) {
  return String(value || "").trim().replace(/\s+/g, " ").slice(0, maxLength);
}

function normalizeCourseCode(value) {
  return cleanString(value, 60).toUpperCase();
}

function cleanNote(value, maxLength) {
  return String(value || "").trim().slice(0, maxLength);
}

function cleanChoice(value, key) {
  const cleanedValue = cleanString(value, 80);
  const normalizedValue = key === "gradingTransparency" && cleanedValue === "Rubrics clear"
    ? "Rubric is clear"
    : cleanedValue;

  return allowedValues[key].includes(normalizedValue) ? normalizedValue : "";
}

function cleanBoolean(value) {
  if (typeof value === "boolean") {
    return value;
  }

  return cleanString(value, 10).toLowerCase() === "true";
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

function createReviewRateLimitError(
  retryAfterSeconds
) {
  const safeRetryAfterSeconds = Math.max(
    1,
    Math.ceil(
      Number(retryAfterSeconds) || 1
    )
  );
  const retryAfterMinutes = Math.max(
    1,
    Math.ceil(
      safeRetryAfterSeconds / 60
    )
  );
  const error = createReviewError(
    "You can submit up to " +
      REVIEW_MAX_SUBMISSIONS_PER_WINDOW +
      " new reviews per hour. Try again in " +
      retryAfterMinutes +
      (
        retryAfterMinutes === 1
          ? " minute."
          : " minutes."
      ),
    429
  );

  error.retryAfterSeconds =
    safeRetryAfterSeconds;

  return error;
}

async function createReviewWithSubmissionLimits(
  decodedUser,
  reviewFields,
  reviewData
) {
  const db = admin.firestore();
  const reviewCollection =
    db.collection("professorReviews");
  const reviewRef =
    reviewCollection.doc();
  const hourlyLimitRef = db
    .collection("users")
    .doc(decodedUser.uid)
    .collection("reviewSubmissionLimits")
    .doc("hourly");
  const currentAuthorQuery =
    reviewCollection
      .where(
        "professorId",
        "==",
        reviewFields.professorId
      )
      .where(
        "authorUid",
        "==",
        decodedUser.uid
      )
      .limit(
        REVIEW_MAX_PER_PROFESSOR
      );
  const legacyAuthorQuery =
    reviewCollection
      .where(
        "professorId",
        "==",
        reviewFields.professorId
      )
      .where(
        "authorUserId",
        "==",
        decodedUser.uid
      )
      .limit(
        REVIEW_MAX_PER_PROFESSOR
      );
  const nowMs = Date.now();

  await db.runTransaction(
    async function (transaction) {
      const hourlyLimitDoc =
        await transaction.get(
          hourlyLimitRef
        );
      const currentAuthorSnapshot =
        await transaction.get(
          currentAuthorQuery
        );
      const legacyAuthorSnapshot =
        await transaction.get(
          legacyAuthorQuery
        );
      const existingReviewIds =
        new Set();

      currentAuthorSnapshot.forEach(
        function (doc) {
          existingReviewIds.add(doc.id);
        }
      );

      legacyAuthorSnapshot.forEach(
        function (doc) {
          existingReviewIds.add(doc.id);
        }
      );

      if (
        existingReviewIds.size >=
        REVIEW_MAX_PER_PROFESSOR
      ) {
        throw createReviewError(
          "You can leave a maximum of " +
            REVIEW_MAX_PER_PROFESSOR +
            " reviews for each professor.",
          409
        );
      }

      const hourlyLimitData =
        hourlyLimitDoc.exists
          ? hourlyLimitDoc.data() || {}
          : {};
      const windowStartedAtMs =
        getTimestampMillis(
          hourlyLimitData.windowStartedAt
        );
      const windowEndsAtMs =
        windowStartedAtMs +
        REVIEW_SUBMISSION_WINDOW_MS;
      const hasActiveWindow =
        windowStartedAtMs > 0 &&
        nowMs < windowEndsAtMs;
      const submissionCount =
        hasActiveWindow
          ? Math.max(
              0,
              Number(
                hourlyLimitData.count || 0
              )
            )
          : 0;

      if (
        hasActiveWindow &&
        submissionCount >=
          REVIEW_MAX_SUBMISSIONS_PER_WINDOW
      ) {
        throw createReviewRateLimitError(
          Math.ceil(
            (
              windowEndsAtMs -
              nowMs
            ) / 1000
          )
        );
      }

      const activeWindowStartedAtMs =
        hasActiveWindow
          ? windowStartedAtMs
          : nowMs;

      transaction.set(
        hourlyLimitRef,
        {
          count: submissionCount + 1,
          windowStartedAt:
            admin.firestore.Timestamp
              .fromDate(
                new Date(
                  activeWindowStartedAtMs
                )
              ),
          lastSubmissionAt:
            admin.firestore.FieldValue
              .serverTimestamp(),
          expiresAt:
            admin.firestore.Timestamp
              .fromDate(
                new Date(
                  activeWindowStartedAtMs +
                    REVIEW_SUBMISSION_WINDOW_MS
                )
              )
        }
      );

      transaction.set(
        reviewRef,
        reviewData
      );
    }
  );

  return reviewRef;
}

function serializeReview(doc) {
  const data = doc.data() || {};
  const createdAtMillis = getTimestampMillis(data.createdAt);
  const isAnonymous = cleanBoolean(data.isAnonymous);

  return {
    id: doc.id,
    professorId: data.professorId || "",
    professorName: data.professorName || "",
    courseTaken: normalizeCourseCode(data.courseCode || data.courseTaken),
    courseCode: normalizeCourseCode(data.courseCode || data.courseTaken),
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
    gradingTransparency: data.gradingTransparency === "Rubrics clear" ? "Rubric is clear" : (data.gradingTransparency || ""),
    feedbackQuality: data.feedbackQuality || "",
    studentNote: data.studentNote || "",
    isAnonymous,
    authorName: isAnonymous ? "Anonymous student" : (data.authorName || "AUC student"),
    authorPhotoURL: isAnonymous ? "" : (data.authorPhotoURL || ""),
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

async function getProfessorReviewCount(professorId) {
  const snapshot = await admin.firestore()
    .collection("professorReviews")
    .where("professorId", "==", professorId)
    .count()
    .get();

  return Number(snapshot.data().count || 0);
}

async function getProfessorReviewSummaries() {
  const snapshot = await admin.firestore()
    .collection("professorReviews")
    .select("professorId", "rating")
    .get();
  const totals = new Map();

  snapshot.forEach(function (doc) {
    const data = doc.data() || {};
    const professorId = cleanString(
      data.professorId,
      80
    );
    const rating = Number(data.rating || 0);

    if (!professorId) {
      return;
    }

    const summary = totals.get(professorId) || {
      reviewCount: 0,
      ratingCount: 0,
      ratingTotal: 0
    };

    summary.reviewCount += 1;

    if (
      Number.isFinite(rating) &&
      rating >= 1 &&
      rating <= 5
    ) {
      summary.ratingCount += 1;
      summary.ratingTotal += rating;
    }

    totals.set(professorId, summary);
  });

  const summaries = {};

  totals.forEach(function (summary, professorId) {
    summaries[professorId] = {
      reviewCount: summary.reviewCount,
      averageRating: summary.ratingCount
        ? Math.round(
            (
              summary.ratingTotal /
              summary.ratingCount
            ) * 100
          ) / 100
        : 0
    };
  });

  return summaries;
}

async function getCourseReviews(courseCode) {
  const normalizedCourseCode = normalizeCourseCode(courseCode);
  const reviewsById = new Map();
  const collection = admin.firestore().collection("professorReviews");
  const snapshots = await Promise.all([
    collection.where("courseCode", "==", normalizedCourseCode).limit(100).get(),
    collection.where("courseTaken", "==", normalizedCourseCode).limit(100).get()
  ]);

  snapshots.forEach(function (snapshot) {
    snapshot.forEach(function (doc) {
      reviewsById.set(doc.id, serializeReview(doc));
    });
  });

  const reviews = Array.from(reviewsById.values());

  reviews.sort(function (a, b) {
    return getTimestampMillis(b.createdAt) - getTimestampMillis(a.createdAt);
  });

  return reviews;
}

async function getAuthorReviews(authorUid) {
  const reviewsById = new Map();
  const collection = admin.firestore().collection("professorReviews");
  const snapshots = await Promise.all([
    collection.where("authorUid", "==", authorUid).limit(100).get(),
    collection.where("authorUserId", "==", authorUid).limit(100).get()
  ]);

  snapshots.forEach(function (snapshot) {
    snapshot.forEach(function (doc) {
      reviewsById.set(doc.id, serializeReview(doc));
    });
  });

  const reviews = Array.from(reviewsById.values());

  reviews.sort(function (a, b) {
    return getTimestampMillis(b.createdAt) - getTimestampMillis(a.createdAt);
  });

  return reviews;
}

function getReviewOwnerUid(reviewData) {
  return reviewData.authorUid || reviewData.authorUserId || "";
}

function getReviewId(req) {
  const body = req.body || {};
  const query = req.query || {};
  const reviewId = cleanString(body.reviewId || query.reviewId, 120);

  if (!reviewId || !/^[A-Za-z0-9_-]+$/.test(reviewId)) {
    throw createReviewError("Review not found.", 400);
  }

  return reviewId;
}

async function getOwnedReview(reviewId, authorUid) {
  const reviewRef = admin.firestore().collection("professorReviews").doc(reviewId);
  const reviewDoc = await reviewRef.get();

  if (!reviewDoc.exists) {
    throw createReviewError("Review not found.", 404);
  }

  const reviewData = reviewDoc.data() || {};

  if (getReviewOwnerUid(reviewData) !== authorUid) {
    throw createReviewError("You cannot change this review.", 403);
  }

  return {
    ref: reviewRef,
    doc: reviewDoc,
    data: reviewData
  };
}

function buildReviewFields(body, existingData) {
  const source = body || {};
  const existing = existingData || {};

  function getValue(key) {
    return Object.prototype.hasOwnProperty.call(source, key)
      ? source[key]
      : existing[key];
  }

  const recommendation = cleanChoice(getValue("recommendation"), "recommendation");
  const recommendationReason = recommendation === "Depends"
    ? cleanNote(getValue("recommendationReason"), 220)
    : "";
  const courseCode = normalizeCourseCode(
    getValue("courseCode") || getValue("courseTaken")
  );

  return {
    professorId: cleanString(existing.professorId || source.professorId, 80),
    professorName: cleanString(existing.professorName || source.professorName, 120),
    courseTaken: courseCode,
    courseCode,
    semesterTaken: cleanString(getValue("semesterTaken"), 60),
    isAnonymous: cleanBoolean(getValue("isAnonymous")),
    rating: Number(getValue("rating") || 0),
    recommendation,
    recommendationReason,
    attendancePolicy: cleanChoice(getValue("attendancePolicy"), "attendancePolicy"),
    workload: cleanChoice(getValue("workload"), "workload"),
    lectureUsefulness: cleanChoice(getValue("lectureUsefulness"), "lectureUsefulness"),
    officeHours: cleanChoice(getValue("officeHours"), "officeHours"),
    gradingStyle: cleanChoice(getValue("gradingStyle"), "gradingStyle"),
    examDifficulty: cleanChoice(getValue("examDifficulty"), "examDifficulty"),
    gradingTransparency: cleanChoice(getValue("gradingTransparency"), "gradingTransparency"),
    feedbackQuality: cleanChoice(getValue("feedbackQuality"), "feedbackQuality"),
    studentNote: cleanNote(getValue("studentNote"), 360)
  };
}

function validateReviewFields(reviewFields) {
  if (!reviewFields.professorId || !reviewFields.professorName) {
    throw createReviewError("Professor not found.", 400);
  }

  if (!reviewFields.courseTaken) {
    throw createReviewError("Please enter the course taken.", 400);
  }

  if (!reviewFields.semesterTaken) {
    throw createReviewError("Please enter the semester taken.", 400);
  }

  if (!Number.isInteger(reviewFields.rating) || reviewFields.rating < 1 || reviewFields.rating > 5) {
    throw createReviewError("Please choose a star rating.", 400);
  }

  if (!reviewFields.recommendation) {
    throw createReviewError("Please choose a recommendation.", 400);
  }

  if (reviewFields.recommendation === "Depends" && !reviewFields.recommendationReason) {
    throw createReviewError("Please explain what it depends on.", 400);
  }

  if (!reviewFields.studentNote) {
    throw createReviewError("Please add a short note for students.", 400);
  }
}

module.exports = async function handler(req, res) {
  try {
    if (req.method === "GET") {
      const query = req.query || {};
      const mine = cleanString(query.mine || query.author, 20);
      const summariesRequested = cleanString(
        query.summaries || query.summary,
        20
      );

      if (summariesRequested === "true") {
        const summaries =
          await getProfessorReviewSummaries();

        return res.status(200).json({
          summaries
        });
      }

      if (mine === "true" || mine === "me") {
        const decodedUser = await getSiteSessionUser(req, {
          checkRevoked: true
        });
        const reviews = await getAuthorReviews(decodedUser.uid);
        return res.status(200).json({ reviews });
      }

      const courseCode = normalizeCourseCode(query.courseCode || query.courseTaken);

      if (courseCode) {
        const reviews = await getCourseReviews(courseCode);
        return res.status(200).json({ reviews });
      }

      const professorId = cleanString(query.professorId, 80);

      if (!professorId) {
        throw createReviewError("Professor or course not found.", 400);
      }

      if (cleanString(query.countOnly, 20) === "true") {
        const reviewCount = await getProfessorReviewCount(professorId);
        return res.status(200).json({ reviewCount });
      }

      const reviews = await getProfessorReviews(professorId);
      return res.status(200).json({ reviews });
    }

    if (!["POST", "PATCH", "DELETE"].includes(req.method)) {
      return res.status(405).json({ error: "Method not allowed" });
    }

    const decodedUser = await getSiteSessionUser(req, {
      checkRevoked: true
    });

    if (req.method === "DELETE") {
      const reviewId = getReviewId(req);
      const ownedReview = await getOwnedReview(reviewId, decodedUser.uid);

      await ownedReview.ref.delete();

      const reviews = await getAuthorReviews(decodedUser.uid);

      return res.status(200).json({
        success: true,
        reviews
      });
    }

    await ensureVerifiedReviewAuthor(decodedUser);

    const body = req.body || {};

    if (req.method === "PATCH") {
      const reviewId = getReviewId(req);
      const ownedReview = await getOwnedReview(reviewId, decodedUser.uid);
      const reviewFields = buildReviewFields(body, ownedReview.data);

      validateReviewFields(reviewFields);

      const authorProfile = await getAuthorProfile(decodedUser);
      const updatedAtIso = new Date().toISOString();
      const updateData = Object.assign({}, reviewFields, {
        authorUid: decodedUser.uid,
        authorUserId: decodedUser.uid,
        authorName: authorProfile.authorName,
        authorPhotoURL: authorProfile.authorPhotoURL,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAtIso
      });

      await ownedReview.ref.update(updateData);

      const updatedReviewDoc = await ownedReview.ref.get();
      const reviews = await getAuthorReviews(decodedUser.uid);

      return res.status(200).json({
        success: true,
        review: serializeReview(updatedReviewDoc),
        reviews
      });
    }

    const reviewFields = buildReviewFields(body);

    validateReviewFields(reviewFields);

    const authorProfile = await getAuthorProfile(decodedUser);
    const createdAtIso = new Date().toISOString();
    const reviewData = Object.assign({}, reviewFields, {
      authorUid: decodedUser.uid,
      authorUserId: decodedUser.uid,
      authorName: authorProfile.authorName,
      authorPhotoURL: authorProfile.authorPhotoURL,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      createdAtIso
    });

    const reviewRef =
      await createReviewWithSubmissionLimits(
        decodedUser,
        reviewFields,
        reviewData
      );
    const createdReviewDoc = await reviewRef.get();
    const reviews = await getProfessorReviews(reviewFields.professorId);

    return res.status(201).json({
      success: true,
      review: serializeReview(createdReviewDoc),
      reviews
    });
  } catch (error) {
    if (error.retryAfterSeconds) {
      res.setHeader(
        "Retry-After",
        String(error.retryAfterSeconds)
      );
    }

    return res.status(error.statusCode || 500).json({
      error: error.message || "Could not save review."
    });
  }
};
