import { timingSafeEqual } from "node:crypto";
import type { NextApiHandler, NextApiRequest } from "next";
import type { DocumentReference, Transaction } from "firebase-admin/firestore";
import { admin } from "@/server/backend/firebase";
import { deleteCloudinaryMaterial } from "@/server/backend/cloudinary-course-materials";

const CLEANUP_GRACE_MS = 15 * 60 * 1000;
const CLEANUP_BATCH_SIZE = 100;
const CLEANUP_CONCURRENCY = 5;

function cleanString(value: unknown, maxLength: number): string {
  return String(value || "").trim().replace(/\s+/g, " ").slice(0, maxLength);
}
function getTimestampMillis(value: unknown): number {
  if (!value) return 0;
  const v = value as { toDate?: () => Date; seconds?: number; _seconds?: number };
  if (typeof v.toDate === "function") return v.toDate().getTime();
  if (typeof v.seconds === "number") return v.seconds * 1000;
  if (typeof v._seconds === "number") return v._seconds * 1000;
  const d = new Date(String(value));
  return Number.isNaN(d.getTime()) ? 0 : d.getTime();
}
function getHeader(req: NextApiRequest, name: string): string {
  const value = req.headers[name] ?? req.headers[name.toLowerCase()];
  return Array.isArray(value) ? String(value[0] || "") : String(value || "");
}
function hasValidCronAuthorization(req: NextApiRequest): boolean {
  const secret = String(process.env.CRON_SECRET || "").trim();
  const submitted = getHeader(req, "authorization");
  const expected = `Bearer ${secret}`;
  const submittedBuffer = Buffer.from(submitted);
  const expectedBuffer = Buffer.from(expected);
  return Boolean(
    secret.length >= 16 &&
      submittedBuffer.length === expectedBuffer.length &&
      timingSafeEqual(submittedBuffer, expectedBuffer),
  );
}
function clearActiveAuthorization(transaction: Transaction, limitRef: DocumentReference) {
  transaction.set(limitRef, {
    activeAuthorizationId: "",
    activeAuthorizationExpiresAt: null,
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  }, { merge: true });
}
type CleanupClaim =
  | { status: "missing" | "skipped" | "metadata" }
  | { status: "claimed"; authorizationId: string; uploaderUid: string; storageKey: string };
async function claimAuthorizationCleanup(
  authorizationRef: DocumentReference,
  cutoffMs: number,
): Promise<CleanupClaim> {
  const db = admin.firestore();
  return db.runTransaction(async (transaction) => {
    const authorizationDoc = await transaction.get(authorizationRef);
    if (!authorizationDoc.exists) return { status: "missing" };
    const data = authorizationDoc.data() || {};
    const expiresAtMs = getTimestampMillis(data.expiresAt);
    if (!expiresAtMs || expiresAtMs > cutoffMs) return { status: "skipped" };
    const authorizationId = authorizationRef.id;
    const uploaderUid = cleanString(data.uploaderUid, 160);
    const limitRef = uploaderUid ? db.collection("materialUploadLimits").doc(uploaderUid) : null;
    const limitDoc = limitRef ? await transaction.get(limitRef) : null;
    const limitData = limitDoc?.exists ? limitDoc.data() || {} : {};
    if (data.consumedAt) {
      transaction.delete(authorizationRef);
      if (limitRef && cleanString(limitData.activeAuthorizationId, 80) === authorizationId) {
        clearActiveAuthorization(transaction, limitRef);
      }
      return { status: "metadata" };
    }
    transaction.set(authorizationRef, { cleanupStartedAt: admin.firestore.FieldValue.serverTimestamp() }, { merge: true });
    return {
      status: "claimed",
      authorizationId,
      uploaderUid,
      storageKey: cleanString(data.storageKey, 80),
    };
  });
}
async function finalizeAuthorizationCleanup(cleanup: Extract<CleanupClaim, { status: "claimed" }>) {
  const db = admin.firestore();
  const authorizationRef = db.collection("materialUploadAuthorizations").doc(cleanup.authorizationId);
  const limitRef = cleanup.uploaderUid ? db.collection("materialUploadLimits").doc(cleanup.uploaderUid) : null;
  await db.runTransaction(async (transaction) => {
    const authorizationDoc = await transaction.get(authorizationRef);
    const limitDoc = limitRef ? await transaction.get(limitRef) : null;
    const limitData = limitDoc?.exists ? limitDoc.data() || {} : {};
    if (authorizationDoc.exists) transaction.delete(authorizationRef);
    if (limitRef && cleanString(limitData.activeAuthorizationId, 80) === cleanup.authorizationId) {
      clearActiveAuthorization(transaction, limitRef);
    }
  });
}
async function cleanupAuthorizationDocument(ref: DocumentReference, cutoffMs: number) {
  const cleanup = await claimAuthorizationCleanup(ref, cutoffMs);
  if (cleanup.status !== "claimed") return cleanup.status;
  await deleteCloudinaryMaterial(cleanup.storageKey);
  await finalizeAuthorizationCleanup(cleanup);
  return "file";
}

const handler: NextApiHandler = async (req, res) => {
  res.setHeader("Cache-Control", "no-store");
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Method not allowed" });
  }
  if (!hasValidCronAuthorization(req)) return res.status(401).json({ error: "Unauthorized" });
  try {
    const cutoffMs = Date.now() - CLEANUP_GRACE_MS;
    const cutoff = admin.firestore.Timestamp.fromDate(new Date(cutoffMs));
    const snapshot = await admin.firestore()
      .collection("materialUploadAuthorizations")
      .where("expiresAt", "<=", cutoff)
      .orderBy("expiresAt", "asc")
      .limit(CLEANUP_BATCH_SIZE)
      .get();
    const documents = snapshot.docs;
    const state = { nextIndex: 0, filesDeleted: 0, metadataRemoved: 0, skipped: 0, failed: 0 };
    async function runWorker() {
      while (state.nextIndex < documents.length) {
        const index = state.nextIndex++;
        try {
          const result = await cleanupAuthorizationDocument(documents[index].ref, cutoffMs);
          if (result === "file") state.filesDeleted += 1;
          else if (result === "metadata") state.metadataRemoved += 1;
          else state.skipped += 1;
        } catch {
          state.failed += 1;
        }
      }
    }
    await Promise.all(Array.from({ length: Math.min(CLEANUP_CONCURRENCY, documents.length) }, () => runWorker()));
    return res.status(200).json({
      success: true,
      scanned: documents.length,
      filesDeleted: state.filesDeleted,
      metadataRemoved: state.metadataRemoved,
      skipped: state.skipped,
      failed: state.failed,
    });
  } catch {
    return res.status(500).json({ error: "Material cleanup failed." });
  }
};

export default handler;
