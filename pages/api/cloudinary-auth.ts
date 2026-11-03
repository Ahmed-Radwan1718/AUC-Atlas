import { randomBytes } from "node:crypto";
import type { NextApiHandler } from "next";
import { admin } from "@/server/backend/firebase";
import {
  MATERIAL_MAX_FILE_BYTES,
  MATERIAL_UPLOAD_AUTH_TTL_SECONDS,
  MATERIAL_USER_QUOTA_BYTES,
  cleanMaterialFileName,
  getMaterialFileExtension,
  isAllowedMaterialFileName,
} from "@/server/backend/course-material-upload-policy";
import {
  createCloudinaryUploadAuthorization,
  deleteCloudinaryMaterial,
} from "@/server/backend/cloudinary-course-materials";
import { getSiteSessionUser } from "@/server/backend/security";
import { asBackendError, asRecord, type BackendError } from "@/server/backend/types";

const MATERIAL_TYPES = [
  "Notes",
  "Slides",
  "Syllabus",
  "Past exam",
  "Practice sheet",
  "Lab file",
  "Past assignments",
  "Review sheet",
] as const;
const TYPE_LOOKUP = new Map(MATERIAL_TYPES.map((type) => [type.toLowerCase(), type]));

function createError(message: string, statusCode: number): BackendError {
  const error = new Error(message) as BackendError;
  error.statusCode = statusCode;
  return error;
}
function cleanString(value: unknown, maxLength: number): string {
  return String(value || "").trim().replace(/\s+/g, " ").slice(0, maxLength);
}
function cleanBoolean(value: unknown): boolean {
  return typeof value === "boolean" ? value : cleanString(value, 10).toLowerCase() === "true";
}
function cleanMaterialType(value: unknown): string {
  return TYPE_LOOKUP.get(cleanString(value, 80).toLowerCase()) || "";
}
function getMaterialMimeType(fileName: unknown): string {
  const mimeTypes: Record<string, string> = {
    pdf: "application/pdf",
    doc: "application/msword",
    docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ppt: "application/vnd.ms-powerpoint",
    pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    xls: "application/vnd.ms-excel",
    xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    png: "image/png",
  };
  return mimeTypes[getMaterialFileExtension(fileName)] || "";
}
async function ensureVerifiedAucUser(req: Parameters<typeof getSiteSessionUser>[0]) {
  const decodedUser = await getSiteSessionUser(req, { checkRevoked: true });
  const userRecord = await admin.auth().getUser(decodedUser.uid);
  const email = String(userRecord.email || decodedUser.email || "").trim().toLowerCase();
  if (!userRecord.emailVerified || !email.endsWith("@aucegypt.edu")) {
    throw createError("Please verify your AUC email address before uploading materials.", 403);
  }
  const userDoc = await admin.firestore().collection("users").doc(decodedUser.uid).get();
  const userData = userDoc.exists ? userDoc.data() || {} : {};
  const displayName = String(
    userData.fullName || userRecord.displayName || email.split("@")[0] || "AUC student",
  ).trim().replace(/\s+/g, " ").slice(0, 80);
  const photoURL = String(userData.photoURL || userRecord.photoURL || "").trim().slice(0, 500);
  return { uid: decodedUser.uid, displayName: displayName || "AUC student", photoURL };
}
async function getStoredBytesForUploader(uid: string): Promise<number> {
  const snapshot = await admin.firestore().collection("courseMaterials").where("uploaderUid", "==", uid).get();
  return snapshot.docs.reduce((total, doc) => {
    const data = doc.data() || {};
    if (cleanString(data.status, 40).toLowerCase() === "rejected") return total;
    return total + Math.max(0, Number(data.size) || 0);
  }, 0);
}
async function cancelAuthorization(uploaderUid: string, authorizationId: unknown): Promise<void> {
  const safeId = cleanString(authorizationId, 80);
  if (!/^[a-f0-9]{36}$/i.test(safeId)) return;
  const db = admin.firestore();
  const ref = db.collection("materialUploadAuthorizations").doc(safeId);
  let storageKey = "";
  await db.runTransaction(async (transaction) => {
    const doc = await transaction.get(ref);
    if (!doc.exists) return;
    const data = doc.data() || {};
    if (cleanString(data.uploaderUid, 160) !== cleanString(uploaderUid, 160) || data.consumedAt) return;
    storageKey = cleanString(data.storageKey || safeId, 80);
    transaction.set(ref, { cancelledAt: admin.firestore.FieldValue.serverTimestamp() }, { merge: true });
  });
  if (storageKey) await deleteCloudinaryMaterial(storageKey).catch(() => undefined);
}

const handler: NextApiHandler = async (req, res) => {
  try {
    if (req.method !== "POST") {
      res.setHeader("Allow", "POST");
      return res.status(405).json({ error: "Method not allowed" });
    }
    const uploader = await ensureVerifiedAucUser(req);
    const body = asRecord(req.body);
    const action = cleanString(body.action, 40).toLowerCase();
    res.setHeader("Cache-Control", "no-store");
    if (action === "cancel") {
      await cancelAuthorization(uploader.uid, body.authorizationId);
      return res.status(200).json({ success: true });
    }

    const courseCode = cleanString(body.courseCode, 40).toUpperCase();
    const courseTitle = cleanString(body.courseTitle, 160);
    const professor = cleanString(body.professor, 120);
    const semester = cleanString(body.semester, 80);
    const materialType = cleanMaterialType(body.materialType || body.type || body.category);
    const isAnonymous = cleanBoolean(body.isAnonymous);
    const title = cleanString(body.title, 160);
    const fileName = cleanMaterialFileName(body.fileName);
    const fileSize = Number(body.fileSize);
    const fileType = getMaterialMimeType(fileName);
    if (
      !courseCode || !professor || !semester || !materialType || !title ||
      !isAllowedMaterialFileName(fileName) || !fileType ||
      !Number.isSafeInteger(fileSize) || fileSize <= 0 || fileSize > MATERIAL_MAX_FILE_BYTES
    ) {
      throw createError("Choose a supported course-material file up to 25MB.", 400);
    }

    const authorizationId = randomBytes(18).toString("hex");
    const issuedAt = Math.floor(Date.now() / 1000);
    const expiresAtMs = (issuedAt + MATERIAL_UPLOAD_AUTH_TTL_SECONDS) * 1000;
    const currentStoredBytes = await getStoredBytesForUploader(uploader.uid);
    if (currentStoredBytes + fileSize > MATERIAL_USER_QUOTA_BYTES) {
      throw createError("Your course-material storage quota has been reached.", 413);
    }
    const cloudinaryUpload = createCloudinaryUploadAuthorization(authorizationId, fileName);
    await admin.firestore().collection("materialUploadAuthorizations").doc(authorizationId).set({
      authorizationId,
      uploaderUid: uploader.uid,
      courseCode,
      courseTitle,
      professor,
      semester,
      materialType,
      title,
      fileName,
      uploadFileName: fileName,
      fileSize,
      fileType,
      storageKey: cloudinaryUpload.publicId,
      folder: "",
      isAnonymous,
      uploaderDisplayName: uploader.displayName,
      uploaderPhotoURL: uploader.photoURL,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      createdAtIso: new Date().toISOString(),
      expiresAt: admin.firestore.Timestamp.fromDate(new Date(expiresAtMs)),
      consumedAt: null,
      cancelledAt: null,
    });
    return res.status(200).json({
      authorizationId,
      storageKey: cloudinaryUpload.publicId,
      cloudinaryPublicId: cloudinaryUpload.publicId,
      uploadUrl: cloudinaryUpload.uploadUrl,
      apiKey: cloudinaryUpload.apiKey,
      signature: cloudinaryUpload.signature,
      timestamp: cloudinaryUpload.timestamp,
      uploadParameters: cloudinaryUpload.uploadParameters,
      fileType,
      expiresAt: new Date(expiresAtMs).toISOString(),
      limits: { maxFileBytes: MATERIAL_MAX_FILE_BYTES, userQuotaBytes: MATERIAL_USER_QUOTA_BYTES },
    });
  } catch (unknownError) {
    const error = asBackendError(unknownError, "Could not prepare upload.");
    res.setHeader("Cache-Control", "no-store");
    return res.status(error.statusCode || 500).json({ error: error.message || "Could not prepare upload." });
  }
};

export default handler;
