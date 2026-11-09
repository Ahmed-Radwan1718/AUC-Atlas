import { createHmac } from "node:crypto";
import type { NextRequest } from "next/server";
import { FieldValue, Timestamp } from "firebase-admin/firestore";
import { firestore } from "./firebase";

type RateLimitSettings = {
  scope: string; identifier: string; maxAttempts: number; windowMs: number; message: string;
};
export class RateLimitError extends Error {
  readonly statusCode = 429;
  readonly retryAfterSeconds: number;
  constructor(message: string, seconds: number) {
    super(message);
    this.retryAfterSeconds = Math.max(1, Math.ceil(seconds || 1));
  }
}
function clean(value: unknown, max: number) {
  return String(value || "").trim().slice(0, max);
}
export function requestIp(request: NextRequest): string {
  return clean(
    request.headers.get("x-forwarded-for")?.split(",")[0].trim()
      || request.headers.get("x-real-ip") || "unknown", 100
  ).toLowerCase();
}
function rateLimitSecret(): string {
  return String(
    process.env.SECURITY_RATE_LIMIT_SECRET ||
    process.env.SECURITY_CODE_SECRET ||
    process.env.FIREBASE_PRIVATE_KEY ||
    process.env.FIREBASE_CLIENT_EMAIL ||
    "auc-atlas-rate-limit-secret"
  );
}
export function sessionSecret(): string {
  return String(
    process.env.SECURITY_CODE_SECRET ||
    process.env.FIREBASE_PRIVATE_KEY ||
    process.env.FIREBASE_CLIENT_EMAIL ||
    "auc-atlas-security-secret"
  );
}
export function sessionHash(sessionId: string): string {
  return createHmac("sha256", sessionSecret()).update("site-session:" + sessionId).digest("hex");
}
function millis(value: unknown): number {
  if (!value) return 0;
  if (value instanceof Timestamp) return value.toMillis();
  if (typeof value === "object" && "seconds" in value && typeof value.seconds === "number") {
    return value.seconds * 1000;
  }
  const parsed = new Date(value as string).getTime();
  return Number.isFinite(parsed) ? parsed : 0;
}
export async function consumeRateLimit(settings: RateLimitSettings): Promise<void> {
  const scope = clean(settings.scope, 80).toLowerCase();
  const identifier = clean(settings.identifier, 500).toLowerCase();
  const maxAttempts = Math.max(1, Math.floor(Number(settings.maxAttempts) || 1));
  const windowMs = Math.max(1000, Math.floor(Number(settings.windowMs) || 1000));
  if (!scope || !identifier) throw new Error("Could not verify this security attempt.");
  const id = createHmac("sha256", rateLimitSecret()).update(scope + ":" + identifier).digest("hex");
  const db = firestore();
  const ref = db.collection("securityRateLimits").doc(id);
  const now = Date.now();
  await db.runTransaction(async transaction => {
    const snapshot = await transaction.get(ref);
    const data = snapshot.exists ? snapshot.data() || {} : {};
    const started = millis(data.windowStartedAt);
    const active = started > 0 && now < started + windowMs;
    const count = active ? Math.max(0, Number(data.count || 0)) : 0;
    if (active && count >= maxAttempts) {
      throw new RateLimitError(settings.message || "Too many attempts. Please try again later.",
        Math.ceil((started + windowMs - now) / 1000));
    }
    const windowStart = active ? started : now;
    transaction.set(ref, {
      scope, count: count + 1,
      windowStartedAt: Timestamp.fromMillis(windowStart),
      lastAttemptAt: FieldValue.serverTimestamp(),
      expiresAt: Timestamp.fromMillis(windowStart + windowMs)
    });
  });
}
