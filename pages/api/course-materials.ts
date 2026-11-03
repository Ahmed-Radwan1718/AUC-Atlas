import type { NextApiHandler } from "next";
import type { QueryDocumentSnapshot } from "firebase-admin/firestore";
import { admin } from "@/server/backend/firebase";
import {
  MATERIAL_MAX_FILE_BYTES,
  cleanMaterialFileName,
  doesMaterialMimeMatchFileName,
  getMaterialFileExtension,
  isAllowedMaterialMimeType,
  normalizeMaterialMimeType,
} from "@/server/backend/course-material-upload-policy";
import {
  deleteCloudinaryMaterial,
  getCloudinaryMaterial,
  isCloudinaryMaterialPublicId,
} from "@/server/backend/cloudinary-course-materials";
import { getSiteSessionUser } from "@/server/backend/security";
import { consumeSecurityRateLimit } from "@/server/backend/security-rate-limits";
import { asBackendError, asRecord, type BackendError } from "@/server/backend/types";

const RANDOM_WINDOW_MS = 10 * 60 * 1000;
const RANDOM_MAX_REQUESTS = 30;
const MUTATION_WINDOW_MS = 60 * 60 * 1000;
const MUTATION_MAX_REQUESTS = 30;
const MATERIAL_TYPES = ["Notes", "Slides", "Syllabus", "Past exam", "Practice sheet", "Lab file", "Past assignments", "Review sheet"] as const;
const TYPE_LOOKUP = new Map(MATERIAL_TYPES.map((type) => [type.toLowerCase(), type]));

function cleanString(value: unknown, maxLength: number): string {
  return String(value || "").trim().replace(/\s+/g, " ").slice(0, maxLength);
}
function cleanBoolean(value: unknown): boolean {
  return typeof value === "boolean" ? value : cleanString(value, 10).toLowerCase() === "true";
}
function cleanMaterialType(value: unknown): string {
  return TYPE_LOOKUP.get(cleanString(value, 80).toLowerCase()) || "";
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
function createMaterialError(message: string, statusCode: number): BackendError {
  const error = new Error(message) as BackendError;
  error.statusCode = statusCode;
  return error;
}
function serializeMaterialData(id: string, data: Record<string, unknown>) {
  const createdAtMillis = getTimestampMillis(data.createdAt || data.createdAtIso);
  const isAnonymous = cleanBoolean(data.isAnonymous);
  return {
    id,
    courseCode: data.courseCode || "",
    courseTitle: data.courseTitle || "",
    professor: data.professor || "",
    semester: data.semester || "",
    materialType: data.materialType || data.type || data.category || "",
    uploadGroupId: data.uploadGroupId || "",
    title: data.title || "",
    fileName: data.fileName || "",
    fileUrl: "",
    downloadUrl: id ? `/api/course-material-download?id=${encodeURIComponent(id)}` : "",
    fileId: "",
    size: Number(data.size || 0),
    fileType: data.fileType || "",
    status: data.status === "rejected" ? "rejected" : "approved",
    isAnonymous,
    uploaderUid: isAnonymous ? "" : data.uploaderUid || "",
    uploaderDisplayName: isAnonymous ? "Anonymous student" : data.uploaderDisplayName || "AUC student",
    uploaderPhotoURL: isAnonymous ? "" : data.uploaderPhotoURL || "",
    createdAt: createdAtMillis ? new Date(createdAtMillis).toISOString() : data.createdAtIso || "",
  };
}
function serializeMaterial(doc: QueryDocumentSnapshot) {
  return serializeMaterialData(doc.id, doc.data() || {});
}
async function ensureVerifiedMaterialUser(uid: string, emailFromToken: unknown, action: string) {
  const userRecord = await admin.auth().getUser(uid);
  const email = String(userRecord.email || emailFromToken || "").trim().toLowerCase();
  if (!userRecord.emailVerified || !email.endsWith("@aucegypt.edu")) {
    throw createMaterialError(`Please verify your AUC email address before ${action || "accessing course materials"}.`, 403);
  }
  return userRecord;
}
async function getUploaderProfile(uid: string, emailFromToken: unknown, userRecord: Awaited<ReturnType<typeof admin.auth>> extends never ? never : any) {
  const userDoc = await admin.firestore().collection("users").doc(uid).get();
  const userData = userDoc.exists ? userDoc.data() || {} : {};
  const email = userRecord.email || userData.email || emailFromToken || "";
  return {
    displayName: cleanString(userData.fullName || userRecord.displayName || String(email).split("@")[0] || "AUC student", 80),
    photoURL: cleanString(userData.photoURL || userRecord.photoURL || "", 500),
  };
}
async function getCourseMaterials(courseCode: string) {
  const snapshot = await admin.firestore().collection("courseMaterials").where("courseCode", "==", courseCode).limit(100).get();
  return snapshot.docs
    .map(serializeMaterial)
    .filter((material) => cleanString(material.status, 40).toLowerCase() !== "rejected")
    .sort((a, b) => getTimestampMillis(b.createdAt) - getTimestampMillis(a.createdAt));
}
async function getRandomCourseMaterials(limit: unknown) {
  const safeLimit = Math.max(1, Math.min(12, Math.floor(Number(limit) || 6)));
  const snapshot = await admin.firestore().collection("courseMaterials").get();
  const groups = new Map<string, ReturnType<typeof serializeMaterial>>();
  snapshot.forEach((doc) => {
    const material = serializeMaterial(doc);
    if (cleanString(material.status, 40).toLowerCase() === "rejected") return;
    const key = cleanString(material.uploadGroupId, 80) || material.id;
    const current = groups.get(key);
    if (!current || getTimestampMillis(material.createdAt) > getTimestampMillis(current.createdAt)) groups.set(key, material);
  });
  const values = Array.from(groups.values());
  for (let index = values.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    [values[randomIndex], values[index]] = [values[index], values[randomIndex]];
  }
  return values.slice(0, safeLimit);
}
async function getUserMaterials(uid: string) {
  const snapshot = await admin.firestore().collection("courseMaterials").where("uploaderUid", "==", uid).limit(200).get();
  return snapshot.docs.map(serializeMaterial).filter((material) => material.status !== "rejected").sort((a, b) => getTimestampMillis(b.createdAt) - getTimestampMillis(a.createdAt));
}
async function getOwnedMaterial(materialId: unknown, uid: string) {
  const safeId = cleanString(materialId, 160);
  if (!safeId) throw createMaterialError("Course material not found.", 404);
  const ref = admin.firestore().collection("courseMaterials").doc(safeId);
  const doc = await ref.get();
  if (!doc.exists) throw createMaterialError("Course material not found.", 404);
  const data = doc.data() || {};
  if (cleanString(data.uploaderUid, 160) !== cleanString(uid, 160)) {
    throw createMaterialError("You cannot manage this course material.", 403);
  }
  if (data.status === "rejected") throw createMaterialError("Course material not found.", 404);
  return { ref, data };
}
function validateAuthorization(data: Record<string, unknown>, authorizationId: string, uid: string) {
  const expiresAtMs = getTimestampMillis(data.expiresAt);
  if (cleanString(data.authorizationId, 80) !== authorizationId || cleanString(data.uploaderUid, 160) !== cleanString(uid, 160)) {
    throw createMaterialError("Could not verify this upload authorization.", 403);
  }
  if (data.consumedAt || data.cancelledAt || data.cleanupStartedAt) {
    throw createMaterialError("This upload authorization has already been used.", 409);
  }
  if (!expiresAtMs || expiresAtMs + 5 * 60 * 1000 <= Date.now()) {
    throw createMaterialError("This upload authorization has expired.", 410);
  }
  return data;
}
async function getAuthorization(authorizationId: string, uid: string) {
  if (!/^[a-f0-9]{36}$/i.test(authorizationId)) throw createMaterialError("Could not verify this upload authorization.", 400);
  const ref = admin.firestore().collection("materialUploadAuthorizations").doc(authorizationId);
  const doc = await ref.get();
  if (!doc.exists) throw createMaterialError("Could not verify this upload authorization.", 400);
  return { ref, data: validateAuthorization(doc.data() || {}, authorizationId, uid) };
}
async function verifyCloudinaryMaterialUpload(data: { publicId: string; assetId: string; fileName: string; fileSize: number; fileType: string }) {
  if (!isCloudinaryMaterialPublicId(data.publicId) || !/^[A-Za-z0-9_-]{16,160}$/.test(data.assetId)) {
    throw createMaterialError("Could not verify the uploaded course material.", 400);
  }
  const file = await getCloudinaryMaterial(data.publicId);
  const expectedExtension = getMaterialFileExtension(data.fileName);
  if (
    file.publicId !== data.publicId || file.assetId !== data.assetId || file.resourceType !== "raw" ||
    file.deliveryType !== "authenticated" || file.format !== expectedExtension || file.size !== data.fileSize ||
    file.size <= 0 || file.size > MATERIAL_MAX_FILE_BYTES || !isAllowedMaterialMimeType(data.fileType) ||
    !doesMaterialMimeMatchFileName(data.fileName, data.fileType)
  ) {
    await deleteCloudinaryMaterial(data.publicId).catch(() => undefined);
    throw createMaterialError("The uploaded file type or size is not allowed.", 400);
  }
  return {
    storageKey: data.publicId,
    fileId: data.assetId,
    cloudinaryPublicId: data.publicId,
    cloudinaryAssetId: data.assetId,
    cloudinaryFormat: file.format,
    fileName: cleanMaterialFileName(data.fileName),
    size: file.size,
    fileType: normalizeMaterialMimeType(data.fileType),
  };
}

const handler: NextApiHandler = async (req, res) => {
  try {
    const allowedMethods = ["GET", "POST", "PATCH", "DELETE"];
    if (!req.method || !allowedMethods.includes(req.method)) {
      res.setHeader("Allow", allowedMethods.join(", "));
      return res.status(405).json({ error: "Method not allowed" });
    }
    const user = await getSiteSessionUser(req, { checkRevoked: true });
    const userRecord = await ensureVerifiedMaterialUser(user.uid, user.email, req.method === "POST" ? "uploading materials" : "managing course materials");
    res.setHeader("Cache-Control", "no-store");
    if (req.method === "GET") {
      if (String(req.query.mine || "").toLowerCase() === "true") return res.status(200).json({ materials: await getUserMaterials(user.uid) });
      if (String(req.query.random || "").toLowerCase() === "true") {
        await consumeSecurityRateLimit({ scope: "course-material-random-user", identifier: user.uid, maxAttempts: RANDOM_MAX_REQUESTS, windowMs: RANDOM_WINDOW_MS, message: "Too many random course-material requests. Please try again later." });
        return res.status(200).json({ materials: await getRandomCourseMaterials(req.query.limit) });
      }
      const courseCode = cleanString(req.query.courseCode, 40).toUpperCase();
      if (!courseCode) throw createMaterialError("Course not found.", 400);
      return res.status(200).json({ materials: await getCourseMaterials(courseCode) });
    }
    if (req.method === "PATCH" || req.method === "DELETE") {
      await consumeSecurityRateLimit({ scope: "course-material-mutation-user", identifier: user.uid, maxAttempts: MUTATION_MAX_REQUESTS, windowMs: MUTATION_WINDOW_MS, message: "Too many course-material changes. Please try again later." });
    }
    const body = asRecord(req.body);
    if (req.method === "PATCH") {
      const materialId = cleanString(body.materialId, 160);
      const title = cleanString(body.title, 160);
      const materialType = cleanMaterialType(body.materialType || body.type || body.category);
      if (!materialId || !title || !materialType) throw createMaterialError("Enter a material name and choose a valid category.", 400);
      const owned = await getOwnedMaterial(materialId, user.uid);
      await owned.ref.update({ title, materialType, status: "approved", updatedAt: admin.firestore.FieldValue.serverTimestamp(), updatedAtIso: new Date().toISOString() });
      return res.status(200).json({ success: true, materials: await getUserMaterials(user.uid) });
    }
    if (req.method === "DELETE") {
      const owned = await getOwnedMaterial(body.materialId, user.uid);
      await deleteCloudinaryMaterial(owned.data.storageKey).catch(() => undefined);
      await owned.ref.update({ status: "rejected", deletedAt: admin.firestore.FieldValue.serverTimestamp(), deletedAtIso: new Date().toISOString() });
      return res.status(200).json({ success: true, materials: await getUserMaterials(user.uid) });
    }

    const uploader = await getUploaderProfile(user.uid, user.email, userRecord);
    const authorizationId = cleanString(body.uploadAuthorizationId, 80);
    const submittedPublicId = cleanString(body.cloudinaryPublicId, 80);
    const submittedAssetId = cleanString(body.cloudinaryAssetId, 160);
    const requestedGroupId = cleanString(body.uploadGroupId, 80);
    if (!authorizationId || !submittedPublicId || !submittedAssetId) throw createMaterialError("Could not save this course material.", 400);
    const uploadGroupId = /^[A-Za-z0-9-]{8,80}$/.test(requestedGroupId) ? requestedGroupId : `single-${authorizationId}`;
    const authorization = await getAuthorization(authorizationId, user.uid);
    const a = authorization.data;
    const courseCode = cleanString(a.courseCode, 40).toUpperCase();
    const courseTitle = cleanString(a.courseTitle, 160);
    const professor = cleanString(a.professor, 120);
    const semester = cleanString(a.semester, 80);
    const materialType = cleanMaterialType(a.materialType);
    const isAnonymous = cleanBoolean(a.isAnonymous);
    const title = cleanString(a.title, 160);
    const fileName = cleanMaterialFileName(a.fileName);
    const fileSize = Number(a.fileSize);
    const fileType = normalizeMaterialMimeType(a.fileType);
    const storageKey = cleanString(a.storageKey, 80);
    if (!courseCode || !professor || !semester || !materialType || !title || !fileName || !isCloudinaryMaterialPublicId(storageKey) || submittedPublicId !== storageKey || !/^[A-Za-z0-9_-]{16,160}$/.test(submittedAssetId) || !Number.isSafeInteger(fileSize) || fileSize <= 0 || fileSize > MATERIAL_MAX_FILE_BYTES || !isAllowedMaterialMimeType(fileType) || !doesMaterialMimeMatchFileName(fileName, fileType)) {
      throw createMaterialError("Could not verify this upload authorization.", 400);
    }
    const verified = await verifyCloudinaryMaterialUpload({ publicId: storageKey, assetId: submittedAssetId, fileName, fileSize, fileType });
    const createdAtIso = new Date().toISOString();
    const materialData: Record<string, unknown> = {
      courseCode, courseTitle, professor, semester, materialType, uploadGroupId, isAnonymous, title,
      fileName: verified.fileName, fileUrl: "", filePath: "", fileId: verified.fileId,
      storageKey: verified.storageKey, storageProvider: "cloudinary",
      cloudinaryPublicId: verified.cloudinaryPublicId, cloudinaryAssetId: verified.cloudinaryAssetId,
      cloudinaryFormat: verified.cloudinaryFormat, size: verified.size, fileType: verified.fileType,
      status: "approved", uploaderUid: user.uid, uploaderDisplayName: uploader.displayName,
      uploaderPhotoURL: uploader.photoURL, createdAt: admin.firestore.FieldValue.serverTimestamp(), createdAtIso,
    };
    const db = admin.firestore();
    const materialRef = db.collection("courseMaterials").doc(`cloudinary-${verified.fileId}`);
    const uploadLimitRef = db.collection("materialUploadLimits").doc(user.uid);
    let existingMaterialData: Record<string, unknown> | null = null;
    await db.runTransaction(async (transaction) => {
      const currentAuthorizationDoc = await transaction.get(authorization.ref);
      if (!currentAuthorizationDoc.exists) throw createMaterialError("Could not verify this upload authorization.", 400);
      validateAuthorization(currentAuthorizationDoc.data() || {}, authorizationId, user.uid);
      const [existingMaterialDoc, uploadLimitDoc] = await Promise.all([
        transaction.get(materialRef), transaction.get(uploadLimitRef),
      ]);
      if (existingMaterialDoc.exists) {
        const existingData = existingMaterialDoc.data() || {};
        if (cleanString(existingData.uploaderUid, 160) !== cleanString(user.uid, 160) || existingData.status === "rejected") throw createMaterialError("This uploaded file is already registered.", 409);
        existingMaterialData = existingData;
      } else transaction.set(materialRef, materialData);
      transaction.update(authorization.ref, {
        consumedAt: admin.firestore.FieldValue.serverTimestamp(), registeredFileId: verified.fileId,
        registeredStorageKey: verified.storageKey, registeredCloudinaryAssetId: verified.cloudinaryAssetId,
        registeredCloudinaryPublicId: verified.cloudinaryPublicId, registeredMaterialId: materialRef.id,
      });
      const uploadLimitData = uploadLimitDoc.exists ? uploadLimitDoc.data() || {} : {};
      if (cleanString(uploadLimitData.activeAuthorizationId, 80) === authorizationId) {
        transaction.set(uploadLimitRef, { activeAuthorizationId: "", activeAuthorizationExpiresAt: null, updatedAt: admin.firestore.FieldValue.serverTimestamp() }, { merge: true });
      }
    });
    return res.status(existingMaterialData ? 200 : 201).json({
      material: serializeMaterialData(materialRef.id, existingMaterialData || materialData),
      alreadySaved: Boolean(existingMaterialData),
    });
  } catch (unknownError) {
    const error = asBackendError(unknownError, "Could not load course materials.");
    return res.status(error.statusCode || 500).json({ error: error.message || "Could not load course materials." });
  }
};

export default handler;
