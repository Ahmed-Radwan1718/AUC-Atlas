import type { NextApiHandler } from "next";
import { ensureAllowedAucEmail } from "@/server/backend/security";
import { consumeSecurityRateLimit, getRequestIp } from "@/server/backend/security-rate-limits";
import { asBackendError, asRecord, type BackendError } from "@/server/backend/types";

const WINDOW_MS = 30 * 60 * 1000;
const MAX_EMAIL_ATTEMPTS = 5;
const MAX_IP_ATTEMPTS = 20;

function getFirebaseWebApiKey(): string {
  const apiKey = String(process.env.FIREBASE_WEB_API_KEY || "").trim();
  if (!apiKey) {
    const error = new Error("Firebase password reset is not configured.") as BackendError;
    error.statusCode = 500;
    throw error;
  }
  return apiKey;
}

function getFirebaseErrorCode(data: unknown): string {
  const body = asRecord(data);
  const firebaseError = asRecord(body.error);
  return String(firebaseError.message || "").split(" : ")[0].trim();
}

async function sendFirebasePasswordResetEmail(email: string): Promise<void> {
  const response = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:sendOobCode?key=${encodeURIComponent(getFirebaseWebApiKey())}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ requestType: "PASSWORD_RESET", email }),
    },
  );
  const data = await response.json().catch(() => ({}));
  if (response.ok) return;
  const firebaseErrorCode = getFirebaseErrorCode(data);
  if (firebaseErrorCode === "EMAIL_NOT_FOUND" || firebaseErrorCode === "USER_NOT_FOUND") return;
  const isRateLimited = ["TOO_MANY_ATTEMPTS_TRY_LATER", "TOO_MANY_ATTEMPTS"].includes(
    firebaseErrorCode,
  );
  const error = new Error(
    isRateLimited
      ? "Too many password reset requests. Please try again later."
      : "Could not send the password reset email. Please try again.",
  ) as BackendError;
  error.statusCode = isRateLimited ? 429 : 500;
  throw error;
}

const handler: NextApiHandler = async (req, res) => {
  try {
    if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
    const email = String(asRecord(req.body).email || "").trim().toLowerCase().slice(0, 160);
    if (!email) return res.status(400).json({ error: "Please enter your email address." });
    ensureAllowedAucEmail(email, "reset your password");
    await consumeSecurityRateLimit({
      scope: "password-reset-ip",
      identifier: getRequestIp(req),
      maxAttempts: MAX_IP_ATTEMPTS,
      windowMs: WINDOW_MS,
      message: "Too many password reset requests from this connection. Please try again later.",
    });
    await consumeSecurityRateLimit({
      scope: "password-reset-email",
      identifier: email,
      maxAttempts: MAX_EMAIL_ATTEMPTS,
      windowMs: WINDOW_MS,
      message: "Too many password reset requests for this email. Please try again later.",
    });
    await sendFirebasePasswordResetEmail(email);
    return res.status(200).json({
      success: true,
      message: "If an AUC Atlas account exists for this email, a password reset link has been sent.",
    });
  } catch (unknownError) {
    const error = asBackendError(unknownError, "Could not send the password reset email.");
    if (error.retryAfterSeconds) res.setHeader("Retry-After", String(error.retryAfterSeconds));
    return res.status(error.statusCode || 500).json({
      error: error.message || "Could not send the password reset email.",
    });
  }
};

export default handler;
