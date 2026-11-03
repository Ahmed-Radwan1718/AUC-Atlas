import type { NextApiHandler } from "next";
import type { UserRecord } from "firebase-admin/auth";
import type { DocumentData } from "firebase-admin/firestore";
import { admin } from "@/server/backend/firebase";
import {
  authenticateAdminPassword,
  createAdminError,
  ensureAdminUser,
  getAdminAuthenticationRequirements,
  isAdminUid,
  requireFreshAdminAccess,
  verifyAdminAuthenticator,
} from "@/server/backend/admin-helpers";
import { deleteCloudinaryMaterial } from "@/server/backend/cloudinary-course-materials";
import { asBackendError, asRecord } from "@/server/backend/types";

type Actor = Awaited<ReturnType<typeof ensureAdminUser>>;
type FirestoreDocument = {
  id: string;
  data(): DocumentData | undefined;
};

function cleanString(value: unknown, maxLength: number): string {
  return String(value || "").trim().replace(/\s+/g, " ").slice(0, maxLength);
}
function cleanMultiline(value: unknown, maxLength: number): string {
  return String(value || "").trim().slice(0, maxLength);
}
function getTimestampMillis(value: unknown): number {
  if (!value) return 0;
  const v = value as { toMillis?: () => number; toDate?: () => Date; seconds?: number; _seconds?: number };
  if (typeof v.toMillis === "function") return v.toMillis();
  if (typeof v.toDate === "function") return v.toDate().getTime();
  if (typeof v.seconds === "number") return v.seconds * 1000;
  if (typeof v._seconds === "number") return v._seconds * 1000;
  const d = new Date(String(value));
  return Number.isNaN(d.getTime()) ? 0 : d.getTime();
}
function getTimestampIso(value: unknown): string {
  const millis = getTimestampMillis(value);
  return millis ? new Date(millis).toISOString() : "";
}
function cleanNotificationType(value: unknown): string {
  const type = cleanString(value, 20).toLowerCase();
  return ["info", "important", "maintenance"].includes(type) ? type : "info";
}
function cleanNotificationLink(value: unknown): string {
  const link = cleanString(value, 500);
  if (!link) return "";
  const normalized = link.replace(/^\/+/, "");
  if (!normalized || /^(?:[a-z][a-z0-9+.-]*:|\/\/)/i.test(link) || /[\s\\]/.test(link) || !/^[A-Za-z0-9][A-Za-z0-9._~!$&'()*+,;=:@%/?#-]*$/.test(normalized)) {
    throw createAdminError("Notification links must be internal site paths such as courses.html.", 400);
  }
  return normalized;
}
function serializeNotification(doc: FirestoreDocument) {
  const data = doc.data() || {};
  const expiresAt = getTimestampIso(data.expiresAt || data.expiresAtIso);
  const expiresAtMillis = getTimestampMillis(expiresAt);
  return {
    id: doc.id,
    title: cleanString(data.title, 120),
    message: cleanMultiline(data.message, 1600),
    type: cleanNotificationType(data.type),
    linkUrl: cleanNotificationLink(data.linkUrl),
    linkLabel: cleanString(data.linkLabel, 60),
    createdAt: getTimestampIso(data.createdAt || data.createdAtIso),
    expiresAt,
    active: data.published !== false && (!expiresAtMillis || expiresAtMillis > Date.now()),
  };
}
function serializeReview(doc: FirestoreDocument) {
  const data = doc.data() || {};
  return {
    id: doc.id,
    professorId: data.professorId || "",
    professorName: data.professorName || "",
    courseCode: data.courseCode || data.courseTaken || "",
    semesterTaken: data.semesterTaken || "",
    rating: Number(data.rating || 0),
    studentNote: data.studentNote || "",
    authorUid: data.authorUid || data.authorUserId || "",
    authorName: data.authorName || "AUC student",
    createdAt: getTimestampIso(data.createdAt || data.createdAtIso),
  };
}
function serializeMaterial(doc: FirestoreDocument) {
  const data = doc.data() || {};
  return {
    id: doc.id,
    source: "firestore",
    courseCode: data.courseCode || "",
    courseTitle: data.courseTitle || "",
    professor: data.professor || "",
    semester: data.semester || "",
    materialType: data.materialType || data.type || data.category || "Material",
    title: data.title || data.fileName || "Course material",
    fileName: data.fileName || "",
    fileId: data.fileId || "",
    storageKey: data.storageKey || "",
    status: data.status || "pending",
    uploaderUid: data.uploaderUid || "",
    uploaderDisplayName: data.uploaderDisplayName || "AUC student",
    createdAt: getTimestampIso(data.createdAt || data.createdAtIso),
  };
}
function serializeReport(doc: FirestoreDocument) {
  const data = doc.data() || {};
  const snapshot = asRecord(data.targetSnapshot);
  return {
    id: doc.id,
    targetType: data.targetType || "",
    targetId: data.targetId || "",
    targetKey: data.targetKey || "",
    targetLabel: data.targetLabel || "",
    targetOwnerUid: data.targetOwnerUid || "",
    reason: data.reason || "",
    reporterUid: data.reporterUid || "",
    reporterEmail: data.reporterEmail || "",
    status: data.status || "open",
    createdAt: getTimestampIso(data.createdAt || data.createdAtIso),
    targetSnapshot: {
      professorName: snapshot.professorName || "",
      courseCode: snapshot.courseCode || "",
      semesterTaken: snapshot.semesterTaken || "",
      rating: Number(snapshot.rating || 0),
      studentNote: snapshot.studentNote || "",
      authorUid: snapshot.authorUid || "",
      authorName: snapshot.authorName || "",
      title: snapshot.title || "",
      fileName: snapshot.fileName || "",
      professor: snapshot.professor || "",
      semester: snapshot.semester || "",
      materialType: snapshot.materialType || "",
      uploaderUid: snapshot.uploaderUid || "",
      uploaderDisplayName: snapshot.uploaderDisplayName || "",
      fileId: snapshot.fileId || "",
    },
  };
}
function serializeAudit(doc: FirestoreDocument) {
  const data = doc.data() || {};
  return {
    id: doc.id,
    action: data.action || "admin_action",
    targetType: data.targetType || "",
    targetId: data.targetId || "",
    targetLabel: data.targetLabel || "",
    reason: data.reason || "",
    actorUid: data.actorUid || "",
    actorEmail: data.actorEmail || "",
    createdAt: getTimestampIso(data.createdAt || data.createdAtIso),
  };
}
async function writeAuditLog(actor: Actor, details: Record<string, unknown>): Promise<void> {
  await admin.firestore().collection("adminAuditLogs").add({
    action: cleanString(details.action, 80),
    targetType: cleanString(details.targetType, 80),
    targetId: cleanString(details.targetId, 180),
    targetLabel: cleanString(details.targetLabel, 240),
    reason: cleanMultiline(details.reason, 500),
    actorUid: actor.uid,
    actorEmail: actor.email,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    createdAtIso: new Date().toISOString(),
  });
}
async function revokeStoredSessions(uid: string, reason: string): Promise<void> {
  const snapshot = await admin.firestore().collection("users").doc(uid).collection("sessions").limit(400).get();
  if (snapshot.empty) return;
  const batch = admin.firestore().batch();
  snapshot.forEach((doc) => batch.set(doc.ref, { revokedAt: admin.firestore.FieldValue.serverTimestamp(), revokedReason: reason || "admin_action" }, { merge: true }));
  await batch.commit();
}
function serializeUserRecord(userRecord: UserRecord, userData: Record<string, unknown>, actor: Actor, configuredAdmins: Set<string>) {
  const moderation = asRecord(userData.moderation);
  return {
    uid: userRecord.uid,
    email: userRecord.email || userData.email || "",
    displayName: userData.fullName || userData.displayName || userRecord.displayName || "AUC student",
    photoURL: userData.photoURL || userRecord.photoURL || "",
    major: userData.major || "",
    aucId: userData.aucId || userData.aucIdLookupKey || "",
    disabled: Boolean(userRecord.disabled),
    emailVerified: Boolean(userRecord.emailVerified),
    isAdmin: userRecord.uid === actor.uid || configuredAdmins.has(userRecord.uid) || userRecord.customClaims?.admin === true,
    activeSessionRecords: null,
    banReason: moderation.reason || "",
    banUpdatedAt: getTimestampIso(moderation.updatedAt || moderation.updatedAtIso),
    createdAt: userRecord.metadata.creationTime ? new Date(userRecord.metadata.creationTime).toISOString() : "",
    lastSignInAt: userRecord.metadata.lastSignInTime ? new Date(userRecord.metadata.lastSignInTime).toISOString() : "",
  };
}
async function listAllUsers(actor: Actor) {
  const records: UserRecord[] = [];
  let pageToken: string | undefined;
  do {
    const page = await admin.auth().listUsers(1000, pageToken);
    records.push(...page.users);
    pageToken = page.pageToken;
  } while (pageToken);
  const configuredAdmins = new Set(String(process.env.ADMIN_UIDS || "").split(/[\s,]+/).map((uid) => uid.trim()).filter(Boolean));
  const db = admin.firestore();
  const users = [];
  for (let index = 0; index < records.length; index += 25) {
    const batch = await Promise.all(records.slice(index, index + 25).map(async (record) => {
      const doc = await db.collection("users").doc(record.uid).get();
      return serializeUserRecord(record, doc.exists ? doc.data() || {} : {}, actor, configuredAdmins);
    }));
    users.push(...batch);
  }
  users.sort((a, b) => getTimestampMillis(b.createdAt) - getTimestampMillis(a.createdAt));
  return users;
}
async function getDashboardData(actor: Actor) {
  const db = admin.firestore();
  const [reviewsSnapshot, materialsSnapshot, reportsSnapshot, auditSnapshot, notificationsSnapshot, users] = await Promise.all([
    db.collection("professorReviews").limit(25).get(),
    db.collection("courseMaterials").limit(25).get(),
    db.collection("contentReports").where("status", "==", "open").limit(25).get(),
    db.collection("adminAuditLogs").orderBy("createdAt", "desc").limit(10).get(),
    db.collection("siteNotifications").orderBy("createdAtIso", "desc").limit(25).get(),
    listAllUsers(actor),
  ]);
  const reviews = reviewsSnapshot.docs.map(serializeReview).sort((a, b) => getTimestampMillis(b.createdAt) - getTimestampMillis(a.createdAt));
  const materials = materialsSnapshot.docs.map(serializeMaterial).filter((m) => m.status !== "rejected").sort((a, b) => getTimestampMillis(b.createdAt) - getTimestampMillis(a.createdAt));
  const reports = reportsSnapshot.docs.map(serializeReport).sort((a, b) => getTimestampMillis(b.createdAt) - getTimestampMillis(a.createdAt));
  return {
    success: true,
    admin: { uid: actor.uid, email: actor.email, displayName: actor.displayName },
    stats: { users: users.length, reviews: reviews.length, materials: materials.length, bannedUsers: users.filter((u) => u.disabled).length },
    users,
    reports: reports.slice(0, 250),
    reviews: reviews.slice(0, 250),
    materials: materials.slice(0, 250),
    notifications: notificationsSnapshot.docs.map(serializeNotification),
    auditLogs: auditSnapshot.docs.map(serializeAudit),
  };
}
async function lookupUser(uidValue: unknown) {
  const uid = cleanString(uidValue, 160);
  if (!uid) throw createAdminError("Enter a Firebase UID.", 400);
  let record: UserRecord;
  try { record = await admin.auth().getUser(uid); }
  catch (error) {
    if ((error as { code?: unknown }).code === "auth/user-not-found") throw createAdminError("No Firebase user was found with that UID.", 404);
    throw error;
  }
  const userRef = admin.firestore().collection("users").doc(uid);
  const [doc, sessions] = await Promise.all([userRef.get(), userRef.collection("sessions").get()]);
  const data = doc.exists ? doc.data() || {} : {};
  const moderation = asRecord(data.moderation);
  return {
    uid: record.uid,
    email: record.email || data.email || "",
    displayName: data.fullName || record.displayName || "AUC student",
    photoURL: data.photoURL || record.photoURL || "",
    disabled: Boolean(record.disabled),
    emailVerified: Boolean(record.emailVerified),
    isAdmin: await isAdminUid(uid),
    activeSessionRecords: sessions.size,
    banReason: moderation.reason || "",
    banUpdatedAt: getTimestampIso(moderation.updatedAt),
    createdAt: record.metadata.creationTime ? new Date(record.metadata.creationTime).toISOString() : "",
    lastSignInAt: record.metadata.lastSignInTime ? new Date(record.metadata.lastSignInTime).toISOString() : "",
  };
}
async function resolveOpenReportsForTarget(actor: Actor, targetType: unknown, targetId: unknown, resolution: unknown) {
  const safeType = cleanString(targetType, 20);
  const safeId = cleanString(targetId, 180);
  if (!safeType || !safeId) return 0;
  const snapshot = await admin.firestore().collection("contentReports").where("targetKey", "==", `${safeType}:${safeId}`).limit(500).get();
  if (snapshot.empty) return 0;
  const batch = admin.firestore().batch();
  const resolvedAtIso = new Date().toISOString();
  let count = 0;
  snapshot.forEach((doc) => {
    if ((doc.data() || {}).status !== "open") return;
    count += 1;
    batch.set(doc.ref, {
      status: "resolved", resolution: cleanString(resolution, 80),
      resolvedAt: admin.firestore.FieldValue.serverTimestamp(), resolvedAtIso,
      resolvedByAdminUid: actor.uid, resolvedByAdminEmail: actor.email,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(), updatedAtIso: resolvedAtIso,
    }, { merge: true });
  });
  if (count) await batch.commit();
  return count;
}
async function handleDeleteReview(actor: Actor, body: Record<string, unknown>) {
  const reviewId = cleanString(body.reviewId, 160);
  const reason = cleanMultiline(body.reason, 500);
  if (!reviewId || !/^[A-Za-z0-9_-]+$/.test(reviewId)) throw createAdminError("Review not found.", 400);
  const ref = admin.firestore().collection("professorReviews").doc(reviewId);
  const doc = await ref.get();
  if (!doc.exists) throw createAdminError("Review not found.", 404);
  const data = doc.data() || {};
  await ref.delete();
  await writeAuditLog(actor, { action: "delete_review", targetType: "review", targetId: reviewId, targetLabel: cleanString(`${data.professorName || "Professor"} · ${data.courseCode || data.courseTaken || "Course"}`, 240), reason });
  await resolveOpenReportsForTarget(actor, "review", reviewId, "content_removed");
  return { success: true };
}
async function handleApproveMaterial(actor: Actor, body: Record<string, unknown>) {
  const materialId = cleanString(body.materialId, 180);
  if (!materialId || !/^[A-Za-z0-9_-]+$/.test(materialId)) {
    throw createAdminError("Course material not found.", 400);
  }
  const ref = admin.firestore().collection("courseMaterials").doc(materialId);
  const doc = await ref.get();
  if (!doc.exists) throw createAdminError("Course material not found.", 404);
  const data = doc.data() || {};
  const status = cleanString(data.status || "pending", 40).toLowerCase();
  const fileId = cleanString(data.fileId, 160);
  if (status === "approved") return { success: true };
  if (status !== "pending" || !fileId) {
    throw createAdminError("This upload cannot be approved in its current state.", 409);
  }
  const approvedAtIso = new Date().toISOString();
  await ref.set({
    status: "approved",
    approvedAt: admin.firestore.FieldValue.serverTimestamp(),
    approvedAtIso,
    approvedByAdminUid: actor.uid,
    approvedByAdminEmail: actor.email,
  }, { merge: true });
  await writeAuditLog(actor, {
    action: "approve_material",
    targetType: "course_material",
    targetId: materialId,
    targetLabel: cleanString(data.title || data.fileName || "Course material", 240),
    reason: "",
  });
  return { success: true };
}
async function handleDeleteMaterial(actor: Actor, body: Record<string, unknown>) {
  const materialId = cleanString(body.materialId, 180);
  const reason = cleanMultiline(body.reason, 500);
  if (!materialId) throw createAdminError("Course material not found.", 400);
  const ref = admin.firestore().collection("courseMaterials").doc(materialId);
  const doc = await ref.get();
  if (!doc.exists) throw createAdminError("Course material not found.", 404);
  const data = doc.data() || {};
  await deleteCloudinaryMaterial(data.storageKey).catch(() => undefined);
  const deletedAtIso = new Date().toISOString();
  await ref.set({ status: "rejected", deletedAt: admin.firestore.FieldValue.serverTimestamp(), deletedAtIso, deletedByAdminUid: actor.uid, adminDeletionReason: reason }, { merge: true });
  await writeAuditLog(actor, { action: "delete_material", targetType: "course_material", targetId: materialId, targetLabel: cleanString(data.title || data.fileName || "Course material", 240), reason });
  await resolveOpenReportsForTarget(actor, "material", materialId, "content_removed");
  return { success: true };
}
async function handleDismissReport(actor: Actor, body: Record<string, unknown>) {
  const reportId = cleanString(body.reportId, 80);
  const reason = cleanMultiline(body.reason, 500);
  if (!/^[a-f0-9]{64}$/i.test(reportId)) throw createAdminError("Content report not found.", 400);
  const ref = admin.firestore().collection("contentReports").doc(reportId);
  const doc = await ref.get();
  if (!doc.exists) throw createAdminError("Content report not found.", 404);
  const data = doc.data() || {};
  const targetType = cleanString(data.targetType, 20);
  const targetId = cleanString(data.targetId, 180);
  await resolveOpenReportsForTarget(actor, targetType, targetId, "dismissed");
  await writeAuditLog(actor, { action: "dismiss_content_report", targetType: "content_report", targetId: reportId, targetLabel: cleanString(data.targetLabel || `${targetType} ${targetId}`, 240), reason });
  return { success: true };
}
async function handleSetUserBan(actor: Actor, body: Record<string, unknown>) {
  const uid = cleanString(body.uid, 160);
  const banned = body.banned === true;
  const reason = cleanMultiline(body.reason, 500);
  if (!uid) throw createAdminError("Enter a Firebase UID.", 400);
  if (uid === actor.uid) throw createAdminError("You cannot ban your own administrator account.", 400);
  if (await isAdminUid(uid)) throw createAdminError("Administrator accounts cannot be banned here.", 403);
  let record: UserRecord;
  try { record = await admin.auth().getUser(uid); }
  catch (error) { if ((error as { code?: unknown }).code === "auth/user-not-found") throw createAdminError("No Firebase user was found with that UID.", 404); throw error; }
  await admin.auth().updateUser(uid, { disabled: banned });
  if (banned) await Promise.all([admin.auth().revokeRefreshTokens(uid), revokeStoredSessions(uid, "admin_ban")]);
  await admin.firestore().collection("users").doc(uid).set({ moderation: { banned, reason: banned ? reason : "", updatedByUid: actor.uid, updatedAt: admin.firestore.FieldValue.serverTimestamp(), updatedAtIso: new Date().toISOString() } }, { merge: true });
  await writeAuditLog(actor, { action: banned ? "ban_user" : "unban_user", targetType: "user", targetId: uid, targetLabel: record.email || record.displayName || uid, reason });
  return { success: true, user: await lookupUser(uid) };
}
async function handleRevokeUserSessions(actor: Actor, body: Record<string, unknown>) {
  const uid = cleanString(body.uid, 160);
  const reason = cleanMultiline(body.reason, 500);
  if (!uid) throw createAdminError("Enter a Firebase UID.", 400);
  if (uid === actor.uid || await isAdminUid(uid)) throw createAdminError("Administrator sessions cannot be revoked here.", 403);
  let record: UserRecord;
  try { record = await admin.auth().getUser(uid); }
  catch (error) { if ((error as { code?: unknown }).code === "auth/user-not-found") throw createAdminError("No Firebase user was found with that UID.", 404); throw error; }
  await Promise.all([admin.auth().revokeRefreshTokens(uid), revokeStoredSessions(uid, "admin_revoke_sessions")]);
  await writeAuditLog(actor, { action: "revoke_user_sessions", targetType: "user", targetId: uid, targetLabel: record.email || record.displayName || uid, reason });
  return { success: true, user: await lookupUser(uid) };
}
async function handleCreateNotification(actor: Actor, body: Record<string, unknown>) {
  const title = cleanString(body.title, 120);
  const message = cleanMultiline(body.message, 1600);
  const type = cleanNotificationType(body.type);
  const linkUrl = cleanNotificationLink(body.linkUrl);
  const linkLabel = linkUrl ? cleanString(body.linkLabel, 60) || "View details" : "";
  const expiresAtInput = cleanString(body.expiresAt, 80);
  if (!title || !message) throw createAdminError("Enter a notification title and message.", 400);
  let expiresAt = null;
  let expiresAtIso = "";
  if (expiresAtInput) {
    const date = new Date(expiresAtInput);
    if (Number.isNaN(date.getTime()) || date.getTime() <= Date.now()) throw createAdminError("Choose a future expiration date and time.", 400);
    expiresAt = admin.firestore.Timestamp.fromDate(date);
    expiresAtIso = date.toISOString();
  }
  const ref = admin.firestore().collection("siteNotifications").doc();
  await ref.set({ title, message, type, linkUrl, linkLabel, published: true, createdAt: admin.firestore.FieldValue.serverTimestamp(), createdAtIso: new Date().toISOString(), expiresAt, expiresAtIso, createdByAdminUid: actor.uid, createdByAdminEmail: actor.email });
  const saved = await ref.get();
  await writeAuditLog(actor, { action: "create_notification", targetType: "site_notification", targetId: ref.id, targetLabel: title, reason: "" });
  return { success: true, notification: serializeNotification(saved) };
}
async function handleDeleteNotification(actor: Actor, body: Record<string, unknown>) {
  const id = cleanString(body.notificationId, 180);
  if (!/^[A-Za-z0-9_-]{6,180}$/.test(id)) throw createAdminError("Notification not found.", 400);
  const ref = admin.firestore().collection("siteNotifications").doc(id);
  const doc = await ref.get();
  if (!doc.exists) throw createAdminError("Notification not found.", 404);
  const notification = serializeNotification(doc);
  await ref.delete();
  await writeAuditLog(actor, { action: "delete_notification", targetType: "site_notification", targetId: id, targetLabel: notification.title, reason: "" });
  return { success: true };
}

const handler: NextApiHandler = async (req, res) => {
  try {
    res.setHeader("Cache-Control", "no-store");
    if (req.method !== "GET" && req.method !== "POST") {
      res.setHeader("Allow", "GET, POST");
      return res.status(405).json({ error: "Method not allowed" });
    }
    const actor = await ensureAdminUser(req);
    const body = req.method === "POST" ? asRecord(req.body) : {};
    const action = cleanString(body.action, 80);
    if (req.method === "POST" && action === "getAuthenticationRequirements") {
      return res.status(200).json({ success: true, ...(await getAdminAuthenticationRequirements(actor)) });
    }
    if (req.method === "POST" && action === "authenticateAdminPassword") {
      return res.status(200).json(await authenticateAdminPassword(actor, body.password));
    }
    if (req.method === "POST" && action === "verifyAdminAuthenticator") {
      return res.status(200).json(await verifyAdminAuthenticator(actor, body.adminChallengeToken, body.authenticatorCode));
    }
    await requireFreshAdminAccess(req, actor);
    if (req.method === "GET") return res.status(200).json(await getDashboardData(actor));

    let result: unknown;
    if (action === "lookupUser") result = { success: true, user: await lookupUser(body.uid) };
    else if (action === "setUserBan") result = await handleSetUserBan(actor, body);
    else if (action === "revokeUserSessions") result = await handleRevokeUserSessions(actor, body);
    else if (action === "deleteReview") result = await handleDeleteReview(actor, body);
    else if (action === "approveMaterial") result = await handleApproveMaterial(actor, body);
    else if (action === "deleteMaterial") result = await handleDeleteMaterial(actor, body);
    else if (action === "dismissReport") result = await handleDismissReport(actor, body);
    else if (action === "createNotification") result = await handleCreateNotification(actor, body);
    else if (action === "deleteNotification") result = await handleDeleteNotification(actor, body);
    else if (action === "updateDonation") throw createAdminError("Donation counter management has been removed.", 404);
    else throw createAdminError("Unknown administrator action.", 400);
    return res.status(200).json(result);
  } catch (unknownError) {
    const error = asBackendError(unknownError, "Could not complete the administrator action.");
    res.setHeader("Cache-Control", "no-store");
    if (error.retryAfterSeconds) res.setHeader("Retry-After", String(error.retryAfterSeconds));
    return res.status(error.statusCode || 500).json({
      error: error.message || "Could not complete the administrator action.",
      code: error.code || "",
      requiresTwoFactor: Boolean(error.requiresTwoFactor),
    });
  }
};

export default handler;
