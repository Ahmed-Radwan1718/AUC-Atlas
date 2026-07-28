const crypto = require("crypto");
const admin = require("./firebaseAdmin");

const DEFAULT_WINDOW_MS = 24 * 60 * 60 * 1000;
const THIRTY_MINUTES_MS = 30 * 60 * 1000;
const ONE_HOUR_MS = 60 * 60 * 1000;

function getClientIp(req) {
  const forwardedFor = req.headers["x-forwarded-for"];

  if (typeof forwardedFor === "string" && forwardedFor.trim()) {
    return forwardedFor.split(",")[0].trim();
  }

  if (Array.isArray(forwardedFor) && forwardedFor[0]) {
    return String(forwardedFor[0]).split(",")[0].trim();
  }

  return String(
    req.headers["cf-connecting-ip"] ||
    req.headers["x-real-ip"] ||
    req.socket?.remoteAddress ||
    "unknown-ip"
  ).trim();
}

function getRateLimitSecret() {
  return process.env.SECURITY_CODE_SECRET ||
    process.env.FIREBASE_PRIVATE_KEY ||
    "auc-atlas-rate-limit-secret";
}

function hashValue(value) {
  return crypto
    .createHmac("sha256", getRateLimitSecret())
    .update(String(value))
    .digest("hex");
}

function timestampToMillis(value) {
  if (!value) return 0;
  if (typeof value.toMillis === "function") return value.toMillis();
  if (typeof value.toDate === "function") return value.toDate().getTime();

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 0 : date.getTime();
}

function minutesLeft(timestampMs) {
  return Math.max(1, Math.ceil((timestampMs - Date.now()) / 60000));
}

function createRateLimitError(message, lockedUntilMs) {
  const error = new Error(message + " Try again in " + minutesLeft(lockedUntilMs) + " minutes.");
  error.statusCode = 429;
  return error;
}

async function consumeRateLimit(options) {
  const bucket = String(options.bucket || "").trim();
  const keyParts = Array.isArray(options.keyParts) ? options.keyParts : [];
  const windowMs = Number(options.windowMs || DEFAULT_WINDOW_MS);
  const firstLimit = Number(options.firstLimit || 5);
  const secondLimit = Number(options.secondLimit || 10);
  const firstLockMs = Number(options.firstLockMs || THIRTY_MINUTES_MS);
  const secondLockMs = Number(options.secondLockMs || ONE_HOUR_MS);
  const errorMessage = String(options.errorMessage || "Too many requests.");

  if (!bucket || !keyParts.length) {
    const error = new Error("Missing rate-limit settings.");
    error.statusCode = 500;
    throw error;
  }

  const safeKey = keyParts.map(function (part) {
    return String(part || "").trim().toLowerCase();
  }).join("|");

  const keyHash = hashValue(bucket + "|" + safeKey);
  const ref = admin.firestore().collection("apiRateLimits").doc(keyHash);

  let blockedUntilMs = 0;

  await admin.firestore().runTransaction(async function (transaction) {
    const now = Date.now();
    const nowTimestamp = admin.firestore.Timestamp.fromMillis(now);
    const doc = await transaction.get(ref);
    const data = doc.exists ? doc.data() || {} : {};

    const existingLockedUntilMs = timestampToMillis(data.lockedUntil);

    if (existingLockedUntilMs > now) {
      blockedUntilMs = existingLockedUntilMs;
      return;
    }

    const windowStartedAtMs = timestampToMillis(data.windowStartedAt);
    const oldWindow = !windowStartedAtMs || now - windowStartedAtMs > windowMs;
    const count = (oldWindow ? 0 : Number(data.count || 0)) + 1;

    let lockedUntil = null;
    let lockLevel = 0;

    if (count >= secondLimit) {
      blockedUntilMs = now + secondLockMs;
      lockedUntil = admin.firestore.Timestamp.fromMillis(blockedUntilMs);
      lockLevel = secondLimit;
    } else if (count >= firstLimit) {
      blockedUntilMs = now + firstLockMs;
      lockedUntil = admin.firestore.Timestamp.fromMillis(blockedUntilMs);
      lockLevel = firstLimit;
    }

    transaction.set(ref, {
      bucket,
      keyHash,
      count,
      firstLimit,
      secondLimit,
      lockLevel,
      lockedUntil,
      windowStartedAt: oldWindow ? nowTimestamp : data.windowStartedAt,
      lastAttemptAt: nowTimestamp,
      updatedAt: nowTimestamp
    }, { merge: true });
  });

  if (blockedUntilMs) {
    throw createRateLimitError(errorMessage, blockedUntilMs);
  }

  return true;
}

module.exports = {
  DEFAULT_WINDOW_MS,
  THIRTY_MINUTES_MS,
  ONE_HOUR_MS,
  getClientIp,
  consumeRateLimit
};
