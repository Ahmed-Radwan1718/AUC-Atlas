import type { NextApiHandler, NextApiRequest } from "next";
import type { DocumentData } from "firebase-admin/firestore";
import { admin } from "@/server/backend/firebase";
import { getSiteSessionUser } from "@/server/backend/security";
import { consumeSecurityRateLimit, getRequestIp } from "@/server/backend/security-rate-limits";
import { asBackendError, asRecord, type BackendError } from "@/server/backend/types";

const SUMMARY_WINDOW_MS = 60 * 1000;
const SUMMARY_MAX_REQUESTS = 60;
const MUTATION_WINDOW_MS = 60 * 60 * 1000;
const MUTATION_MAX_REQUESTS = 30;
const MAX_PER_PROFESSOR = 5;
const SUBMISSION_WINDOW_MS = 60 * 60 * 1000;
const MAX_SUBMISSIONS_PER_WINDOW = 35;

const allowedValues: Record<string, readonly string[]> = {
  recommendation: ["Yes", "Depends", "No"],
  attendancePolicy: ["Required", "Sometimes checked", "Not important", "Not sure"],
  workload: ["Light", "Moderate", "Heavy"],
  lectureUsefulness: ["Essential", "Helpful", "Attending means less work at home", "Skippable", "Not lecture-based"],
  officeHours: ["Helpful", "Available but limited", "Hard to reach", "Did not use"],
  gradingStyle: ["Exams-heavy", "Projects-heavy", "Assignments-heavy", "Participation-heavy", "Mixed"],
  examDifficulty: ["Easier than class material", "Matches class material", "Harder than class material", "No exams"],
  gradingTransparency: ["Rubric is clear", "Somewhat clear", "Unclear"],
  feedbackQuality: ["Helpful", "Minimal", "None", "Not applicable"],
};

type FirestoreDocument = {
  id: string;
  data(): DocumentData | undefined;
};

function cleanString(value: unknown, maxLength: number): string {
  return String(value || "").trim().replace(/\s+/g, " ").slice(0, maxLength);
}
function normalizeCourseCode(value: unknown): string {
  return cleanString(value, 60).toUpperCase();
}
function cleanNote(value: unknown, maxLength: number): string {
  return String(value || "").trim().slice(0, maxLength);
}
function cleanChoice(value: unknown, key: string): string {
  const cleaned = cleanString(value, 80);
  const normalized = key === "gradingTransparency" && cleaned === "Rubrics clear" ? "Rubric is clear" : cleaned;
  return allowedValues[key]?.includes(normalized) ? normalized : "";
}
function cleanBoolean(value: unknown): boolean {
  return typeof value === "boolean" ? value : cleanString(value, 10).toLowerCase() === "true";
}
function createReviewError(message: string, statusCode: number): BackendError {
  const error = new Error(message) as BackendError;
  error.statusCode = statusCode;
  return error;
}
function getTimestampMillis(value: unknown): number {
  if (!value) return 0;
  const stored = value as { toDate?: () => Date; seconds?: number; _seconds?: number };
  if (typeof stored.toDate === "function") return stored.toDate().getTime();
  if (typeof stored.seconds === "number") return stored.seconds * 1000;
  if (typeof stored._seconds === "number") return stored._seconds * 1000;
  const parsed = new Date(String(value));
  return Number.isNaN(parsed.getTime()) ? 0 : parsed.getTime();
}
function createSubmissionRateLimitError(retryAfterSeconds: unknown): BackendError {
  const safe = Math.max(1, Math.ceil(Number(retryAfterSeconds) || 1));
  const minutes = Math.max(1, Math.ceil(safe / 60));
  const error = createReviewError(
    `You can submit up to ${MAX_SUBMISSIONS_PER_WINDOW} new reviews per hour. Try again in ${minutes} ${minutes === 1 ? "minute" : "minutes"}.`,
    429,
  );
  error.retryAfterSeconds = safe;
  return error;
}

type ReviewFields = {
  professorId: string;
  professorName: string;
  courseTaken: string;
  courseCode: string;
  semesterTaken: string;
  isAnonymous: boolean;
  rating: number;
  recommendation: string;
  recommendationReason: string;
  attendancePolicy: string;
  workload: string;
  lectureUsefulness: string;
  officeHours: string;
  gradingStyle: string;
  examDifficulty: string;
  gradingTransparency: string;
  feedbackQuality: string;
  studentNote: string;
};

async function createReviewWithSubmissionLimits(
  uid: string,
  reviewFields: ReviewFields,
  reviewData: Record<string, unknown>,
) {
  const db = admin.firestore();
  const collection = db.collection("professorReviews");
  const reviewRef = collection.doc();
  const hourlyLimitRef = db.collection("users").doc(uid).collection("reviewSubmissionLimits").doc("hourly");
  const currentAuthorQuery = collection.where("professorId", "==", reviewFields.professorId).where("authorUid", "==", uid).limit(MAX_PER_PROFESSOR);
  const legacyAuthorQuery = collection.where("professorId", "==", reviewFields.professorId).where("authorUserId", "==", uid).limit(MAX_PER_PROFESSOR);
  const nowMs = Date.now();
  await db.runTransaction(async (transaction) => {
    const [hourlyLimitDoc, currentAuthorSnapshot, legacyAuthorSnapshot] = await Promise.all([
      transaction.get(hourlyLimitRef),
      transaction.get(currentAuthorQuery),
      transaction.get(legacyAuthorQuery),
    ]);
    const existingIds = new Set<string>();
    currentAuthorSnapshot.forEach((doc) => existingIds.add(doc.id));
    legacyAuthorSnapshot.forEach((doc) => existingIds.add(doc.id));
    if (existingIds.size >= MAX_PER_PROFESSOR) {
      throw createReviewError(`You can leave a maximum of ${MAX_PER_PROFESSOR} reviews for each professor.`, 409);
    }
    const hourlyData = hourlyLimitDoc.exists ? hourlyLimitDoc.data() || {} : {};
    const windowStartedAtMs = getTimestampMillis(hourlyData.windowStartedAt);
    const windowEndsAtMs = windowStartedAtMs + SUBMISSION_WINDOW_MS;
    const hasActiveWindow = windowStartedAtMs > 0 && nowMs < windowEndsAtMs;
    const submissionCount = hasActiveWindow ? Math.max(0, Number(hourlyData.count || 0)) : 0;
    if (hasActiveWindow && submissionCount >= MAX_SUBMISSIONS_PER_WINDOW) {
      throw createSubmissionRateLimitError(Math.ceil((windowEndsAtMs - nowMs) / 1000));
    }
    const activeStart = hasActiveWindow ? windowStartedAtMs : nowMs;
    transaction.set(hourlyLimitRef, {
      count: submissionCount + 1,
      windowStartedAt: admin.firestore.Timestamp.fromDate(new Date(activeStart)),
      lastSubmissionAt: admin.firestore.FieldValue.serverTimestamp(),
      expiresAt: admin.firestore.Timestamp.fromDate(new Date(activeStart + SUBMISSION_WINDOW_MS)),
    });
    transaction.set(reviewRef, reviewData);
  });
  return reviewRef;
}

function serializeReview(doc: FirestoreDocument) {
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
    gradingTransparency: data.gradingTransparency === "Rubrics clear" ? "Rubric is clear" : data.gradingTransparency || "",
    feedbackQuality: data.feedbackQuality || "",
    studentNote: data.studentNote || "",
    isAnonymous,
    authorName: isAnonymous ? "Anonymous student" : data.authorName || "AUC student",
    authorPhotoURL: isAnonymous ? "" : data.authorPhotoURL || "",
    createdAt: createdAtMillis ? new Date(createdAtMillis).toISOString() : data.createdAtIso || "",
  };
}
async function getAuthorProfile(uid: string, decodedEmail: unknown) {
  const [userRecord, userDoc] = await Promise.all([
    admin.auth().getUser(uid),
    admin.firestore().collection("users").doc(uid).get(),
  ]);
  const userData = userDoc.exists ? userDoc.data() || {} : {};
  const email = String(userRecord.email || userData.email || decodedEmail || "");
  return {
    authorName: cleanString(userData.fullName || userRecord.displayName || email.split("@")[0] || "AUC student", 80),
    authorPhotoURL: cleanString(userData.photoURL || userRecord.photoURL || "", 500),
  };
}
async function ensureVerifiedReviewAuthor(uid: string, emailVerified: unknown) {
  if (emailVerified === true) return;
  const userRecord = await admin.auth().getUser(uid);
  if (!userRecord.emailVerified) {
    throw createReviewError("Please verify your email address before submitting a professor review.", 403);
  }
}
async function getProfessorReviews(professorId: string) {
  const snapshot = await admin.firestore().collection("professorReviews").where("professorId", "==", professorId).limit(100).get();
  const reviews = snapshot.docs.map(serializeReview);
  reviews.sort((a, b) => getTimestampMillis(b.createdAt) - getTimestampMillis(a.createdAt));
  return reviews;
}
async function getProfessorReviewCount(professorId: string): Promise<number> {
  const snapshot = await admin.firestore().collection("professorReviews").where("professorId", "==", professorId).count().get();
  return Number(snapshot.data().count || 0);
}

let summaryCache: { expiresAt: number; summaries: Record<string, { reviewCount: number; averageRating: number }> | null } = {
  expiresAt: 0,
  summaries: null,
};
async function getProfessorReviewSummaries() {
  if (summaryCache.summaries && summaryCache.expiresAt > Date.now()) return summaryCache.summaries;
  const snapshot = await admin.firestore().collection("professorReviews").select("professorId", "rating").get();
  const totals = new Map<string, { reviewCount: number; ratingCount: number; ratingTotal: number }>();
  snapshot.forEach((doc) => {
    const data = doc.data() || {};
    const professorId = cleanString(data.professorId, 80);
    const rating = Number(data.rating || 0);
    if (!professorId) return;
    const summary = totals.get(professorId) || { reviewCount: 0, ratingCount: 0, ratingTotal: 0 };
    summary.reviewCount += 1;
    if (Number.isFinite(rating) && rating >= 1 && rating <= 5) {
      summary.ratingCount += 1;
      summary.ratingTotal += rating;
    }
    totals.set(professorId, summary);
  });
  const summaries: Record<string, { reviewCount: number; averageRating: number }> = {};
  totals.forEach((summary, professorId) => {
    summaries[professorId] = {
      reviewCount: summary.reviewCount,
      averageRating: summary.ratingCount ? Math.round((summary.ratingTotal / summary.ratingCount) * 100) / 100 : 0,
    };
  });
  summaryCache = { expiresAt: Date.now() + 60 * 60 * 1000, summaries };
  return summaries;
}
async function getCourseReviews(courseCode: string) {
  const normalized = normalizeCourseCode(courseCode);
  const collection = admin.firestore().collection("professorReviews");
  const snapshots = await Promise.all([
    collection.where("courseCode", "==", normalized).limit(100).get(),
    collection.where("courseTaken", "==", normalized).limit(100).get(),
  ]);
  const reviewsById = new Map<string, ReturnType<typeof serializeReview>>();
  snapshots.forEach((snapshot) => snapshot.forEach((doc) => reviewsById.set(doc.id, serializeReview(doc))));
  return Array.from(reviewsById.values()).sort((a, b) => getTimestampMillis(b.createdAt) - getTimestampMillis(a.createdAt));
}
async function getAuthorReviews(uid: string) {
  const collection = admin.firestore().collection("professorReviews");
  const snapshots = await Promise.all([
    collection.where("authorUid", "==", uid).limit(100).get(),
    collection.where("authorUserId", "==", uid).limit(100).get(),
  ]);
  const reviewsById = new Map<string, ReturnType<typeof serializeReview>>();
  snapshots.forEach((snapshot) => snapshot.forEach((doc) => reviewsById.set(doc.id, serializeReview(doc))));
  return Array.from(reviewsById.values()).sort((a, b) => getTimestampMillis(b.createdAt) - getTimestampMillis(a.createdAt));
}
function getReviewId(req: NextApiRequest): string {
  const body = asRecord(req.body);
  const value = cleanString(body.reviewId || req.query.reviewId, 120);
  if (!value || !/^[A-Za-z0-9_-]+$/.test(value)) throw createReviewError("Review not found.", 400);
  return value;
}
async function getOwnedReview(reviewId: string, uid: string) {
  const ref = admin.firestore().collection("professorReviews").doc(reviewId);
  const doc = await ref.get();
  if (!doc.exists) throw createReviewError("Review not found.", 404);
  const data = doc.data() || {};
  if (String(data.authorUid || data.authorUserId || "") !== uid) {
    throw createReviewError("You cannot change this review.", 403);
  }
  return { ref, doc, data };
}
function buildReviewFields(bodyValue: unknown, existingData?: Record<string, unknown>): ReviewFields {
  const source = asRecord(bodyValue);
  const existing = existingData || {};
  const getValue = (key: string) => Object.prototype.hasOwnProperty.call(source, key) ? source[key] : existing[key];
  const recommendation = cleanChoice(getValue("recommendation"), "recommendation");
  const courseCode = normalizeCourseCode(getValue("courseCode") || getValue("courseTaken"));
  return {
    professorId: cleanString(existing.professorId || source.professorId, 80),
    professorName: cleanString(existing.professorName || source.professorName, 120),
    courseTaken: courseCode,
    courseCode,
    semesterTaken: cleanString(getValue("semesterTaken"), 60),
    isAnonymous: cleanBoolean(getValue("isAnonymous")),
    rating: Number(getValue("rating") || 0),
    recommendation,
    recommendationReason: recommendation === "Depends" ? cleanNote(getValue("recommendationReason"), 5000) : "",
    attendancePolicy: cleanChoice(getValue("attendancePolicy"), "attendancePolicy"),
    workload: cleanChoice(getValue("workload"), "workload"),
    lectureUsefulness: cleanChoice(getValue("lectureUsefulness"), "lectureUsefulness"),
    officeHours: cleanChoice(getValue("officeHours"), "officeHours"),
    gradingStyle: cleanChoice(getValue("gradingStyle"), "gradingStyle"),
    examDifficulty: cleanChoice(getValue("examDifficulty"), "examDifficulty"),
    gradingTransparency: cleanChoice(getValue("gradingTransparency"), "gradingTransparency"),
    feedbackQuality: cleanChoice(getValue("feedbackQuality"), "feedbackQuality"),
    studentNote: cleanNote(getValue("studentNote"), 5000),
  };
}
function validateReviewFields(fields: ReviewFields): void {
  if (!fields.professorId || !fields.professorName) throw createReviewError("Professor not found.", 400);
  if (!fields.courseTaken) throw createReviewError("Please enter the course taken.", 400);
  if (!fields.semesterTaken) throw createReviewError("Please enter the semester taken.", 400);
  if (!Number.isInteger(fields.rating) || fields.rating < 1 || fields.rating > 5) throw createReviewError("Please choose a star rating.", 400);
  if (!fields.recommendation) throw createReviewError("Please choose a recommendation.", 400);
  if (fields.recommendation === "Depends" && !fields.recommendationReason) throw createReviewError("Please explain what it depends on.", 400);
}

const handler: NextApiHandler = async (req, res) => {
  try {
    if (req.method === "GET") {
      const mine = cleanString(req.query.mine || req.query.author, 20);
      const summariesRequested = cleanString(req.query.summaries || req.query.summary, 20);
      if (summariesRequested === "true") {
        await consumeSecurityRateLimit({
          scope: "professor-review-summaries-ip",
          identifier: getRequestIp(req),
          maxAttempts: SUMMARY_MAX_REQUESTS,
          windowMs: SUMMARY_WINDOW_MS,
          message: "Too many professor-review summary requests. Please try again later.",
        });
        res.setHeader("Cache-Control", "public, max-age=300, s-maxage=3600, stale-while-revalidate=86400");
        return res.status(200).json({ summaries: await getProfessorReviewSummaries() });
      }
      if (mine === "true" || mine === "me") {
        const user = await getSiteSessionUser(req, { checkRevoked: true });
        return res.status(200).json({ reviews: await getAuthorReviews(user.uid) });
      }
      const courseCode = normalizeCourseCode(req.query.courseCode || req.query.courseTaken);
      if (courseCode) return res.status(200).json({ reviews: await getCourseReviews(courseCode) });
      const professorId = cleanString(req.query.professorId, 80);
      if (!professorId) throw createReviewError("Professor or course not found.", 400);
      if (cleanString(req.query.countOnly, 20) === "true") {
        return res.status(200).json({ reviewCount: await getProfessorReviewCount(professorId) });
      }
      return res.status(200).json({ reviews: await getProfessorReviews(professorId) });
    }

    if (!req.method || !["POST", "PATCH", "DELETE"].includes(req.method)) {
      return res.status(405).json({ error: "Method not allowed" });
    }
    const user = await getSiteSessionUser(req, { checkRevoked: true });
    if (req.method === "PATCH" || req.method === "DELETE") {
      await consumeSecurityRateLimit({
        scope: "professor-review-mutation-user",
        identifier: user.uid,
        maxAttempts: MUTATION_MAX_REQUESTS,
        windowMs: MUTATION_WINDOW_MS,
        message: "Too many professor-review changes. Please try again later.",
      });
    }
    if (req.method === "DELETE") {
      const owned = await getOwnedReview(getReviewId(req), user.uid);
      await owned.ref.delete();
      return res.status(200).json({ success: true, reviews: await getAuthorReviews(user.uid) });
    }
    await ensureVerifiedReviewAuthor(user.uid, user.email_verified);
    if (req.method === "PATCH") {
      const owned = await getOwnedReview(getReviewId(req), user.uid);
      const fields = buildReviewFields(req.body, owned.data);
      validateReviewFields(fields);
      const author = await getAuthorProfile(user.uid, user.email);
      await owned.ref.update({
        ...fields,
        authorUid: user.uid,
        authorUserId: user.uid,
        authorName: author.authorName,
        authorPhotoURL: author.authorPhotoURL,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAtIso: new Date().toISOString(),
      });
      const updated = await owned.ref.get();
      return res.status(200).json({ success: true, review: serializeReview(updated), reviews: await getAuthorReviews(user.uid) });
    }
    const fields = buildReviewFields(req.body);
    validateReviewFields(fields);
    const author = await getAuthorProfile(user.uid, user.email);
    const ref = await createReviewWithSubmissionLimits(user.uid, fields, {
      ...fields,
      authorUid: user.uid,
      authorUserId: user.uid,
      authorName: author.authorName,
      authorPhotoURL: author.authorPhotoURL,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      createdAtIso: new Date().toISOString(),
    });
    const created = await ref.get();
    return res.status(201).json({ success: true, review: serializeReview(created), reviews: await getProfessorReviews(fields.professorId) });
  } catch (unknownError) {
    const error = asBackendError(unknownError, "Could not save review.");
    if (error.retryAfterSeconds) res.setHeader("Retry-After", String(error.retryAfterSeconds));
    return res.status(error.statusCode || 500).json({ error: error.message || "Could not save review." });
  }
};

export default handler;
