import { createHash } from "node:crypto";
import type { NextApiHandler } from "next";
import type { CollectionReference, DocumentReference, Firestore, Query } from "firebase-admin/firestore";
import { admin } from "@/server/backend/firebase";
import { deleteCloudinaryMaterial } from "@/server/backend/cloudinary-course-materials";
import {
  clearSiteSessionCookie,
  getSiteSessionUser,
  requireSecurityPanelAccess,
  signInWithPassword,
} from "@/server/backend/security";
import { clearSecurityRateLimit, consumeSecurityRateLimit } from "@/server/backend/security-rate-limits";
import { asBackendError, asRecord, type BackendError } from "@/server/backend/types";

const WINDOW_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 5;

function cleanString(value: unknown, maxLength: number): string {
  return String(value || "").trim().slice(0, maxLength);
}
function createError(message: string, statusCode: number): BackendError {
  const error = new Error(message) as BackendError;
  error.statusCode = statusCode;
  return error;
}
function getCloudinaryConfig() {
  let cloudName = cleanString(process.env.CLOUDINARY_CLOUD_NAME || process.env.CLOUDINARY_NAME, 160);
  let apiKey = cleanString(process.env.CLOUDINARY_API_KEY, 160);
  let apiSecret = cleanString(process.env.CLOUDINARY_API_SECRET, 500);
  if ((!cloudName || !apiKey || !apiSecret) && process.env.CLOUDINARY_URL) {
    try {
      const url = new URL(process.env.CLOUDINARY_URL);
      cloudName ||= url.hostname;
      apiKey ||= decodeURIComponent(url.username || "");
      apiSecret ||= decodeURIComponent(url.password || "");
    } catch {}
  }
  return cloudName && apiKey && apiSecret ? { cloudName, apiKey, apiSecret } : null;
}
function signParams(params: Record<string, string>, secret: string): string {
  return createHash("sha1")
    .update(Object.keys(params).sort().map((key) => `${key}=${params[key]}`).join("&") + secret)
    .digest("hex");
}
async function deleteCloudinaryProfilePhoto(publicId: unknown): Promise<void> {
  const safePublicId = cleanString(publicId, 500);
  const config = getCloudinaryConfig();
  if (!config || !/^auc-atlas\/profile-photos\/[A-Za-z0-9_-]+\//.test(safePublicId)) return;
  const timestamp = String(Math.floor(Date.now() / 1000));
  const signedParams = { invalidate: "true", public_id: safePublicId, timestamp };
  const body = new URLSearchParams({
    ...signedParams,
    api_key: config.apiKey,
    signature: signParams(signedParams, config.apiSecret),
  });
  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${encodeURIComponent(config.cloudName)}/image/destroy`,
    { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: body.toString() },
  );
  if (!response.ok) throw createError("Could not delete the profile photo.", 502);
}
async function deleteDocumentReferences(db: Firestore, docs: Array<{ ref: DocumentReference }>): Promise<void> {
  for (let start = 0; start < docs.length; start += 400) {
    const batch = db.batch();
    for (const doc of docs.slice(start, start + 400)) batch.delete(doc.ref);
    await batch.commit();
  }
}
async function deleteQueryDocuments(db: Firestore, query: Query): Promise<void> {
  while (true) {
    const snapshot = await query.limit(200).get();
    if (snapshot.empty) return;
    await deleteDocumentReferences(db, snapshot.docs);
  }
}
async function deleteUserMaterials(db: Firestore, uid: string): Promise<void> {
  const query = db.collection("courseMaterials").where("uploaderUid", "==", uid);
  while (true) {
    const snapshot = await query.limit(50).get();
    if (snapshot.empty) return;
    await Promise.all(snapshot.docs.map((doc) => deleteCloudinaryMaterial(doc.data().storageKey).catch(() => undefined)));
    await deleteDocumentReferences(db, snapshot.docs);
  }
}
async function deleteCollectionTree(collectionRef: CollectionReference): Promise<void> {
  while (true) {
    const snapshot = await collectionRef.limit(100).get();
    if (snapshot.empty) return;
    for (const doc of snapshot.docs) await deleteDocumentTree(doc.ref);
  }
}
async function deleteDocumentTree(documentRef: DocumentReference): Promise<void> {
  for (const childCollection of await documentRef.listCollections()) {
    await deleteCollectionTree(childCollection);
  }
  await documentRef.delete();
}
async function deleteOwnedReservation(
  db: Firestore,
  collectionName: string,
  documentId: string,
  uid: string,
): Promise<void> {
  const safeDocumentId = cleanString(documentId, 160);
  if (!safeDocumentId) return;
  const ref = db.collection(collectionName).doc(safeDocumentId);
  const doc = await ref.get();
  if (doc.exists && String((doc.data() || {}).uid || "") === uid) await ref.delete();
}

const handler: NextApiHandler = async (req, res) => {
  try {
    if (req.method !== "DELETE") {
      res.setHeader("Allow", "DELETE");
      return res.status(405).json({ error: "Method not allowed" });
    }
    res.setHeader("Cache-Control", "no-store");
    const decodedUser = await getSiteSessionUser(req, { checkRevoked: true });
    await requireSecurityPanelAccess(req, decodedUser);
    const body = asRecord(req.body);
    const currentPassword = String(body.currentPassword || "");
    const confirmation = cleanString(body.confirmation, 20);
    if (!currentPassword || currentPassword.length > 1024) throw createError("Enter your current password.", 400);
    if (confirmation !== "DELETE") throw createError("Type DELETE exactly to confirm account deletion.", 400);
    const userRecord = await admin.auth().getUser(decodedUser.uid);
    const email = String(userRecord.email || decodedUser.email || "").trim();
    if (!email) throw createError("No email address was found on this account.", 400);
    await consumeSecurityRateLimit({
      scope: "delete-account-password",
      identifier: decodedUser.uid,
      maxAttempts: MAX_ATTEMPTS,
      windowMs: WINDOW_MS,
      message: "Too many account-deletion attempts. Please try again later.",
    });
    try {
      await signInWithPassword(email, currentPassword);
    } catch {
      throw createError("Current password is incorrect.", 401);
    }
    await clearSecurityRateLimit("delete-account-password", decodedUser.uid);
    const db = admin.firestore();
    const userRef = db.collection("users").doc(decodedUser.uid);
    const userDoc = await userRef.get();
    const userData = userDoc.exists ? userDoc.data() || {} : {};
    const aucIdLookupKey = String(userData.aucIdLookupKey || userData.aucId || "").replace(/\D/g, "");
    await deleteCloudinaryProfilePhoto(userData.photoPublicId).catch(() => undefined);
    await deleteUserMaterials(db, decodedUser.uid);
    await deleteQueryDocuments(db, db.collection("professorReviews").where("authorUid", "==", decodedUser.uid));
    await deleteQueryDocuments(db, db.collection("professorReviews").where("authorUserId", "==", decodedUser.uid));
    await deleteQueryDocuments(db, db.collection("materialUploadAuthorizations").where("uploaderUid", "==", decodedUser.uid));
    await deleteQueryDocuments(db, db.collection("loginChallenges").where("uid", "==", decodedUser.uid));
    await Promise.all([
      deleteOwnedReservation(db, "accountAucIds", aucIdLookupKey, decodedUser.uid),
      db.collection("twoFactorSecrets").doc(decodedUser.uid).delete().catch(() => undefined),
      db.collection("materialUploadLimits").doc(decodedUser.uid).delete().catch(() => undefined),
      db.collection("profilePhotoUploadLimits").doc(decodedUser.uid).delete().catch(() => undefined),
    ]);
    await deleteDocumentTree(userRef);
    await admin.auth().deleteUser(decodedUser.uid);
    clearSiteSessionCookie(res);
    return res.status(200).json({ success: true });
  } catch (unknownError) {
    const error = asBackendError(unknownError, "Could not delete the account.");
    if (error.retryAfterSeconds) res.setHeader("Retry-After", String(error.retryAfterSeconds));
    return res.status(error.statusCode || 500).json({ error: error.message || "Could not delete the account." });
  }
};

export default handler;
