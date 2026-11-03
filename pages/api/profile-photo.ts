import { createHash, randomBytes } from "node:crypto";
import type { NextApiHandler } from "next";
import { admin } from "@/server/backend/firebase";
import { getSiteSessionUser } from "@/server/backend/security";
import { consumeSecurityRateLimit } from "@/server/backend/security-rate-limits";
import { asBackendError, asRecord, type BackendError } from "@/server/backend/types";

const PUBLIC_ID_PREFIX = "auc-atlas/profile-photos";
const UPLOAD_PRESET = String(
  process.env.CLOUDINARY_PROFILE_PHOTO_UPLOAD_PRESET || "auc_atlas_profile_photos",
).trim();
const MAX_BYTES = 4 * 1024 * 1024;
const ALLOWED_FORMATS = ["jpg", "jpeg", "png", "webp"];
const UPLOADS_PER_HOUR = 5;
const UPLOAD_WINDOW_MS = 60 * 60 * 1000;
const MUTATIONS_PER_HOUR = 10;
const MUTATION_WINDOW_MS = 60 * 60 * 1000;

type CloudinaryConfig = { cloudName: string; apiKey: string; apiSecret: string };

function getFirstName(fullName: unknown, email: unknown): string {
  const name = String(fullName || "").trim();
  return name ? name.split(/\s+/)[0] : String(email || "").split("@")[0] || "there";
}
function getCloudinaryConfig(): CloudinaryConfig {
  let cloudName = String(process.env.CLOUDINARY_CLOUD_NAME || process.env.CLOUDINARY_NAME || "").trim();
  let apiKey = String(process.env.CLOUDINARY_API_KEY || "").trim();
  let apiSecret = String(process.env.CLOUDINARY_API_SECRET || "").trim();
  if ((!cloudName || !apiKey || !apiSecret) && process.env.CLOUDINARY_URL) {
    try {
      const url = new URL(process.env.CLOUDINARY_URL);
      cloudName ||= url.hostname;
      apiKey ||= decodeURIComponent(url.username || "");
      apiSecret ||= decodeURIComponent(url.password || "");
    } catch {}
  }
  if (!cloudName || !apiKey || !apiSecret) {
    const error = new Error("Cloudinary is not configured.") as BackendError;
    error.statusCode = 500;
    throw error;
  }
  return { cloudName, apiKey, apiSecret };
}
function createProfilePhotoError(message: string, statusCode: number): BackendError {
  const error = new Error(message) as BackendError;
  error.statusCode = statusCode;
  return error;
}
function createRateLimitError(retryAfterSeconds: unknown): BackendError {
  const safe = Math.max(1, Math.ceil(Number(retryAfterSeconds) || 1));
  const minutes = Math.max(1, Math.ceil(safe / 60));
  const error = createProfilePhotoError(
    `Too many profile-photo uploads. Try again in ${minutes} ${minutes === 1 ? "minute" : "minutes"}.`,
    429,
  );
  error.retryAfterSeconds = safe;
  return error;
}
function getTimestampMillis(value: unknown): number {
  if (!value) return 0;
  const timestamp = value as { toDate?: () => Date; seconds?: number; _seconds?: number };
  if (typeof timestamp.toDate === "function") return timestamp.toDate().getTime();
  if (typeof timestamp.seconds === "number") return timestamp.seconds * 1000;
  if (typeof timestamp._seconds === "number") return timestamp._seconds * 1000;
  const parsed = new Date(String(value));
  return Number.isNaN(parsed.getTime()) ? 0 : parsed.getTime();
}
function getSafePublicIdPart(value: unknown): string {
  return String(value || "").replace(/[^\w-]/g, "_");
}
function getProfilePhotoPublicIdPrefix(uid: string): string {
  return `${PUBLIC_ID_PREFIX}/${getSafePublicIdPart(uid)}`;
}
function createProfilePhotoPublicId(uid: string): string {
  return `${getProfilePhotoPublicIdPrefix(uid)}/${Date.now()}-${randomBytes(8).toString("hex")}`;
}
function isExpectedProfilePhotoPublicId(uid: string, publicId: string): boolean {
  const prefix = `${getProfilePhotoPublicIdPrefix(uid)}/`;
  const suffix = publicId.slice(prefix.length);
  return publicId.startsWith(prefix) && /^\d{10,16}-[a-f0-9]{16}$/i.test(suffix);
}
function signCloudinaryParams(params: Record<string, string>, apiSecret: string): string {
  const signatureBase = Object.keys(params)
    .sort()
    .map((key) => `${key}=${params[key]}`)
    .join("&");
  return createHash("sha1").update(signatureBase + apiSecret).digest("hex");
}
async function consumeUploadAttempt(uid: string): Promise<void> {
  const db = admin.firestore();
  const limitRef = db.collection("profilePhotoUploadLimits").doc(uid);
  const nowMs = Date.now();
  await db.runTransaction(async (transaction) => {
    const limitDoc = await transaction.get(limitRef);
    const data = limitDoc.exists ? limitDoc.data() || {} : {};
    const windowStartedAtMs = getTimestampMillis(data.windowStartedAt);
    const hasActiveWindow =
      windowStartedAtMs > 0 && nowMs < windowStartedAtMs + UPLOAD_WINDOW_MS;
    const uploadCount = hasActiveWindow ? Math.max(0, Number(data.uploadCount) || 0) : 0;
    const activeWindowStartedAtMs = hasActiveWindow ? windowStartedAtMs : nowMs;
    if (uploadCount >= UPLOADS_PER_HOUR) {
      throw createRateLimitError(
        Math.ceil((activeWindowStartedAtMs + UPLOAD_WINDOW_MS - nowMs) / 1000),
      );
    }
    transaction.set(
      limitRef,
      {
        uid,
        uploadCount: uploadCount + 1,
        windowStartedAt: admin.firestore.Timestamp.fromDate(new Date(activeWindowStartedAtMs)),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true },
    );
  });
}
function isExpectedCloudinaryPhotoUrl(
  photoURL: unknown,
  config: CloudinaryConfig,
  publicId: string,
): boolean {
  try {
    const parsedUrl = new URL(String(photoURL || ""));
    const pathname = decodeURIComponent(parsedUrl.pathname || "");
    return (
      parsedUrl.protocol === "https:" &&
      parsedUrl.hostname === "res.cloudinary.com" &&
      pathname.startsWith(`/${config.cloudName}/image/upload/`) &&
      pathname.includes(`/${publicId}`)
    );
  } catch {
    return false;
  }
}
async function getCloudinaryPhotoDetails(config: CloudinaryConfig, publicId: string) {
  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${encodeURIComponent(config.cloudName)}/resources/image/upload/${encodeURIComponent(publicId)}`,
    {
      headers: {
        Accept: "application/json",
        Authorization: `Basic ${Buffer.from(`${config.apiKey}:${config.apiSecret}`).toString("base64")}`,
      },
    },
  );
  if (response.status === 404) {
    throw createProfilePhotoError("Could not verify uploaded profile photo.", 400);
  }
  if (!response.ok) {
    throw createProfilePhotoError("Could not verify the stored profile photo.", 502);
  }
  return asRecord(await response.json().catch(() => ({})));
}
async function verifyCloudinaryPhoto(
  config: CloudinaryConfig,
  publicId: string,
  submittedVersion: number,
): Promise<string> {
  const asset = await getCloudinaryPhotoDetails(config, publicId);
  const format = String(asset.format || "").trim().toLowerCase();
  const bytes = Math.max(0, Number(asset.bytes) || 0);
  const version = Number(asset.version);
  const valid =
    asset.public_id === publicId &&
    asset.resource_type === "image" &&
    asset.type === "upload" &&
    ALLOWED_FORMATS.includes(format) &&
    bytes > 0 &&
    bytes <= MAX_BYTES &&
    Number.isSafeInteger(version) &&
    version === submittedVersion &&
    isExpectedCloudinaryPhotoUrl(asset.secure_url, config, publicId);
  if (!valid) {
    throw createProfilePhotoError("The uploaded profile photo type or size is not allowed.", 400);
  }
  return String(asset.secure_url || "").trim();
}
async function destroyCloudinaryPhoto(config: CloudinaryConfig, publicId: string): Promise<void> {
  if (!publicId) return;
  const timestamp = String(Math.floor(Date.now() / 1000));
  const signedParams = { invalidate: "true", public_id: publicId, timestamp };
  const signature = signCloudinaryParams(signedParams, config.apiSecret);
  const body = new URLSearchParams({ ...signedParams, api_key: config.apiKey, signature });
  await fetch(
    `https://api.cloudinary.com/v1_1/${encodeURIComponent(config.cloudName)}/image/destroy`,
    {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: body.toString(),
    },
  ).catch(() => undefined);
}
async function getAccountUser(uid: string, fallbackEmail: string) {
  const [userRecord, userDoc] = await Promise.all([
    admin.auth().getUser(uid),
    admin.firestore().collection("users").doc(uid).get(),
  ]);
  const userData = userDoc.exists ? userDoc.data() || {} : {};
  const fullName = String(userData.fullName || userRecord.displayName || "");
  const email = String(userRecord.email || userData.email || fallbackEmail || "");
  const twoFactorData = asRecord(userData.twoFactor);
  return {
    uid,
    email,
    emailVerified: Boolean(userRecord.emailVerified || userData.emailVerified),
    displayName: fullName,
    fullName,
    photoURL: String(userData.photoURL || userRecord.photoURL || ""),
    firstName: getFirstName(fullName, email),
    major: String(userData.major || ""),
    authProvider: String(userData.authProvider || "password"),
    twoFactor: {
      appEnabled: Boolean(twoFactorData.appEnabled),
      emailEnabled: Boolean(twoFactorData.emailEnabled),
    },
  };
}

const handler: NextApiHandler = async (req, res) => {
  try {
    if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
    const decodedUser = await getSiteSessionUser(req, { checkRevoked: true });
    const body = asRecord(req.body);
    const action = String(body.action || "").trim();
    const config = getCloudinaryConfig();
    res.setHeader("Cache-Control", "no-store");

    if (action === "save" || action === "remove") {
      await consumeSecurityRateLimit({
        scope: "profile-photo-mutation-user",
        identifier: decodedUser.uid,
        maxAttempts: MUTATIONS_PER_HOUR,
        windowMs: MUTATION_WINDOW_MS,
        message: "Too many profile photo changes. Please try again later.",
      });
    }

    if (action === "signature") {
      await consumeUploadAttempt(decodedUser.uid);
      const timestamp = String(Math.floor(Date.now() / 1000));
      const publicId = createProfilePhotoPublicId(decodedUser.uid);
      const allowedFormats = ALLOWED_FORMATS.join(",");
      const signedParams = {
        allowed_formats: allowedFormats,
        invalidate: "true",
        overwrite: "false",
        public_id: publicId,
        timestamp,
        upload_preset: UPLOAD_PRESET,
      };
      return res.status(200).json({
        success: true,
        cloudName: config.cloudName,
        apiKey: config.apiKey,
        timestamp,
        publicId,
        overwrite: "false",
        invalidate: "true",
        allowedFormats,
        uploadPreset: UPLOAD_PRESET,
        signature: signCloudinaryParams(signedParams, config.apiSecret),
      });
    }

    if (action === "save") {
      const submittedPublicId = String(body.publicId || "").trim();
      const submittedVersion = Number(body.version);
      if (
        !isExpectedProfilePhotoPublicId(decodedUser.uid, submittedPublicId) ||
        !Number.isSafeInteger(submittedVersion) ||
        submittedVersion <= 0
      ) {
        throw createProfilePhotoError("Could not verify uploaded profile photo.", 400);
      }
      const photoURL = await verifyCloudinaryPhoto(config, submittedPublicId, submittedVersion);
      const userRef = admin.firestore().collection("users").doc(decodedUser.uid);
      const userDoc = await userRef.get();
      const userData = userDoc.exists ? userDoc.data() || {} : {};
      const previousPublicId = String(userData.photoPublicId || "").trim();
      await admin.auth().updateUser(decodedUser.uid, { photoURL });
      await userRef.set(
        {
          email: decodedUser.email || "",
          photoURL,
          photoPublicId: submittedPublicId,
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        },
        { merge: true },
      );
      if (previousPublicId && previousPublicId !== submittedPublicId) {
        await destroyCloudinaryPhoto(config, previousPublicId);
      }
      return res.status(200).json({
        success: true,
        user: await getAccountUser(decodedUser.uid, decodedUser.email || ""),
      });
    }

    if (action === "remove") {
      const userRef = admin.firestore().collection("users").doc(decodedUser.uid);
      const userDoc = await userRef.get();
      const userData = userDoc.exists ? userDoc.data() || {} : {};
      const publicId = String(userData.photoPublicId || "").trim();
      await destroyCloudinaryPhoto(config, publicId);
      await admin.auth().updateUser(decodedUser.uid, { photoURL: null });
      await userRef.set(
        {
          email: decodedUser.email || "",
          photoURL: "",
          photoPublicId: "",
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        },
        { merge: true },
      );
      return res.status(200).json({
        success: true,
        user: await getAccountUser(decodedUser.uid, decodedUser.email || ""),
      });
    }

    throw createProfilePhotoError("Unsupported profile photo action.", 400);
  } catch (unknownError) {
    const error = asBackendError(unknownError, "Could not update profile photo.");
    res.setHeader("Cache-Control", "no-store");
    if (error.retryAfterSeconds) res.setHeader("Retry-After", String(error.retryAfterSeconds));
    return res.status(error.statusCode || 500).json({
      error: error.message || "Could not update profile photo.",
    });
  }
};

export default handler;
