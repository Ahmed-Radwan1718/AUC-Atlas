import "server-only";

import { createHmac } from "node:crypto";
import type { NextApiRequest } from "next";
import { admin } from "@/server/backend/firebase";
import type { BackendError } from "@/server/backend/types";

function cleanString(value: unknown, maxLength: number): string {
  return String(value || "").trim().slice(0, maxLength);
}

function getRateLimitSecret(): string {
  return String(
    process.env.SECURITY_RATE_LIMIT_SECRET ||
      process.env.SECURITY_CODE_SECRET ||
      process.env.FIREBASE_PRIVATE_KEY ||
      process.env.FIREBASE_CLIENT_EMAIL ||
      "auc-atlas-rate-limit-secret",
  );
}

function getRequestHeader(req: NextApiRequest, name: string): string {
  const value = req.headers[name] ?? req.headers[name.toLowerCase()];
  return Array.isArray(value) ? String(value[0] || "") : String(value || "");
}

export function getRequestIp(req: NextApiRequest): string {
  const forwardedFor = getRequestHeader(req, "x-forwarded-for").split(",")[0].trim();
  const realIp = getRequestHeader(req, "x-real-ip").trim();
  const socketIp = req.socket?.remoteAddress || "";
  return cleanString(forwardedFor || realIp || socketIp || "unknown", 100).toLowerCase();
}

function timestampToMillis(value: unknown): number {
  if (!value) return 0;
  const timestamp = value as {
    toMillis?: () => number;
    toDate?: () => Date;
    seconds?: number;
    _seconds?: number;
  };
  if (typeof timestamp.toMillis === "function") return timestamp.toMillis();
  if (typeof timestamp.toDate === "function") return timestamp.toDate().getTime();
  if (typeof timestamp.seconds === "number") return timestamp.seconds * 1000;
  if (typeof timestamp._seconds === "number") return timestamp._seconds * 1000;
  const parsedDate = new Date(String(value));
  return Number.isNaN(parsedDate.getTime()) ? 0 : parsedDate.getTime();
}

function getRateLimitDocumentId(scope: unknown, identifier: unknown): string {
  return createHmac("sha256", getRateLimitSecret())
    .update(`${cleanString(scope, 80).toLowerCase()}:${cleanString(identifier, 500).toLowerCase()}`)
    .digest("hex");
}

function createRateLimitError(message: unknown, retryAfterSeconds: unknown): BackendError {
  const error = new Error(
    String(message || "Too many attempts. Please try again later."),
  ) as BackendError;
  error.statusCode = 429;
  error.retryAfterSeconds = Math.max(1, Math.ceil(Number(retryAfterSeconds) || 1));
  return error;
}

export type SecurityRateLimitOptions = {
  scope: unknown;
  identifier: unknown;
  maxAttempts: unknown;
  windowMs: unknown;
  message?: unknown;
};

export async function consumeSecurityRateLimit(options: SecurityRateLimitOptions): Promise<void> {
  const settings = options || ({} as SecurityRateLimitOptions);
  const scope = cleanString(settings.scope, 80).toLowerCase();
  const identifier = cleanString(settings.identifier, 500).toLowerCase();
  const maxAttempts = Math.max(1, Math.floor(Number(settings.maxAttempts) || 1));
  const windowMs = Math.max(1000, Math.floor(Number(settings.windowMs) || 1000));

  if (!scope || !identifier) {
    const error = new Error("Could not verify this security attempt.") as BackendError;
    error.statusCode = 400;
    throw error;
  }

  const db = admin.firestore();
  const rateLimitRef = db
    .collection("securityRateLimits")
    .doc(getRateLimitDocumentId(scope, identifier));
  const nowMs = Date.now();

  await db.runTransaction(async (transaction) => {
    const rateLimitDoc = await transaction.get(rateLimitRef);
    const data = rateLimitDoc.exists ? rateLimitDoc.data() || {} : {};
    const windowStartedAtMs = timestampToMillis(data.windowStartedAt);
    const windowEndsAtMs = windowStartedAtMs + windowMs;
    const hasActiveWindow = windowStartedAtMs > 0 && nowMs < windowEndsAtMs;
    const attemptCount = hasActiveWindow ? Math.max(0, Number(data.count || 0)) : 0;

    if (hasActiveWindow && attemptCount >= maxAttempts) {
      throw createRateLimitError(
        settings.message,
        Math.ceil((windowEndsAtMs - nowMs) / 1000),
      );
    }

    const activeWindowStartedAtMs = hasActiveWindow ? windowStartedAtMs : nowMs;
    transaction.set(rateLimitRef, {
      scope,
      count: attemptCount + 1,
      windowStartedAt: admin.firestore.Timestamp.fromDate(new Date(activeWindowStartedAtMs)),
      lastAttemptAt: admin.firestore.FieldValue.serverTimestamp(),
      expiresAt: admin.firestore.Timestamp.fromDate(
        new Date(activeWindowStartedAtMs + windowMs),
      ),
    });
  });
}

export async function clearSecurityRateLimit(scope: unknown, identifier: unknown): Promise<void> {
  const safeScope = cleanString(scope, 80).toLowerCase();
  const safeIdentifier = cleanString(identifier, 500).toLowerCase();
  if (!safeScope || !safeIdentifier) return;

  await admin
    .firestore()
    .collection("securityRateLimits")
    .doc(getRateLimitDocumentId(safeScope, safeIdentifier))
    .delete()
    .catch(() => undefined);
}
