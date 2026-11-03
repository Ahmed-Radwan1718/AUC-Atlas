import "server-only";

import { createHmac } from "node:crypto";
import { ApiError, cleanString, getTimestampMillis } from "@/lib/server/backend-utils";
import {
  FieldValue,
  getAdminFirestore,
  Timestamp,
} from "@/lib/server/firebase-admin";

type RateLimitOptions = {
  scope: string;
  identifier: string;
  maxAttempts: number;
  windowMs: number;
  message?: string;
};

function getRateLimitSecret(): string {
  return String(
    process.env.SECURITY_RATE_LIMIT_SECRET ||
      process.env.SECURITY_CODE_SECRET ||
      process.env.FIREBASE_PRIVATE_KEY ||
      process.env.FIREBASE_CLIENT_EMAIL ||
      "auc-atlas-rate-limit-secret",
  );
}

function getRateLimitDocumentId(scope: string, identifier: string): string {
  return createHmac("sha256", getRateLimitSecret())
    .update(
      `${cleanString(scope, 80).toLowerCase()}:${cleanString(identifier, 500).toLowerCase()}`,
    )
    .digest("hex");
}

function createRateLimitError(message: string | undefined, retryAfterSeconds: number) {
  const error = new ApiError(
    message || "Too many attempts. Please try again later.",
    429,
  );
  error.retryAfterSeconds = Math.max(1, Math.ceil(Number(retryAfterSeconds) || 1));
  return error;
}

export async function consumeSecurityRateLimit(options: RateLimitOptions) {
  const scope = cleanString(options.scope, 80).toLowerCase();
  const identifier = cleanString(options.identifier, 500).toLowerCase();
  const maxAttempts = Math.max(1, Math.floor(Number(options.maxAttempts) || 1));
  const windowMs = Math.max(1000, Math.floor(Number(options.windowMs) || 1000));

  if (!scope || !identifier) {
    throw new ApiError("Could not verify this security attempt.", 400);
  }

  const db = getAdminFirestore();
  const rateLimitRef = db
    .collection("securityRateLimits")
    .doc(getRateLimitDocumentId(scope, identifier));
  const nowMs = Date.now();

  await db.runTransaction(async (transaction) => {
    const rateLimitDoc = await transaction.get(rateLimitRef);
    const data = rateLimitDoc.exists ? rateLimitDoc.data() || {} : {};
    const windowStartedAtMs = getTimestampMillis(data.windowStartedAt);
    const windowEndsAtMs = windowStartedAtMs + windowMs;
    const hasActiveWindow = windowStartedAtMs > 0 && nowMs < windowEndsAtMs;
    const attemptCount = hasActiveWindow
      ? Math.max(0, Number(data.count || 0))
      : 0;

    if (hasActiveWindow && attemptCount >= maxAttempts) {
      throw createRateLimitError(
        options.message,
        Math.ceil((windowEndsAtMs - nowMs) / 1000),
      );
    }

    const activeWindowStartedAtMs = hasActiveWindow ? windowStartedAtMs : nowMs;

    transaction.set(rateLimitRef, {
      scope,
      count: attemptCount + 1,
      windowStartedAt: Timestamp.fromDate(new Date(activeWindowStartedAtMs)),
      lastAttemptAt: FieldValue.serverTimestamp(),
      expiresAt: Timestamp.fromDate(new Date(activeWindowStartedAtMs + windowMs)),
    });
  });
}
