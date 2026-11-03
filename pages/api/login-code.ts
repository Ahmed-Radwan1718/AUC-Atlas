import { createHmac, randomBytes, randomInt, timingSafeEqual } from "node:crypto";
import type { NextApiHandler, NextApiRequest, NextApiResponse } from "next";
import type { UserRecord } from "firebase-admin/auth";
import { admin } from "@/server/backend/firebase";
import {
  clearLoginChallenge,
  consumeLoginChallenge,
  createLoginChallenge,
  createSiteSessionForUid,
  ensureAllowedAucEmail,
  getLoginChallenge,
  type LoginChallenge,
} from "@/server/backend/security";
import {
  clearSecurityRateLimit,
  consumeSecurityRateLimit,
  getRequestIp,
} from "@/server/backend/security-rate-limits";
import { asBackendError, asRecord, type BackendError } from "@/server/backend/types";

const COLLECTION = "emailLoginCodes";
const EXPIRES_MS = 10 * 60 * 1000;
const MAX_VERIFY_ATTEMPTS = 6;
const REQUEST_WINDOW_MS = 15 * 60 * 1000;
const REQUEST_MAX_EMAIL = 5;
const REQUEST_MAX_IP = 30;
const VERIFY_WINDOW_MS = 15 * 60 * 1000;
const VERIFY_MAX_EMAIL = 12;
const VERIFY_MAX_IP = 100;

function cleanEmail(value: unknown): string {
  return String(value || "").trim().toLowerCase().slice(0, 160);
}
function cleanCode(value: unknown): string {
  return String(value || "").replace(/\D/g, "").slice(0, 6);
}
function createHttpError(message: string, statusCode: number): BackendError {
  const error = new Error(message) as BackendError;
  error.statusCode = statusCode;
  return error;
}
function getEmailCodeSecret(): string {
  const secret = String(
    process.env.SECURITY_CODE_SECRET ||
      process.env.FIREBASE_PRIVATE_KEY ||
      process.env.FIREBASE_CLIENT_EMAIL ||
      "",
  ).trim();
  if (!secret) throw createHttpError("Email sign-in codes are not configured.", 500);
  return secret;
}
function createLoginCodeHash(challengeId: string, uid: string, code: string): string {
  return createHmac("sha256", getEmailCodeSecret())
    .update(`email-login-code:${challengeId}:${uid}:${code}`)
    .digest("hex");
}
function loginCodeHashesMatch(storedHash: unknown, suppliedHash: unknown): boolean {
  const stored = Buffer.from(String(storedHash || ""), "hex");
  const supplied = Buffer.from(String(suppliedHash || ""), "hex");
  return stored.length === 32 && supplied.length === 32 && timingSafeEqual(stored, supplied);
}
function timestampToMillis(value: unknown): number {
  if (!value) return 0;
  const v = value as { toMillis?: () => number; toDate?: () => Date; seconds?: number; _seconds?: number };
  if (typeof v.toMillis === "function") return v.toMillis();
  if (typeof v.toDate === "function") return v.toDate().getTime();
  if (typeof v.seconds === "number") return v.seconds * 1000;
  if (typeof v._seconds === "number") return v._seconds * 1000;
  const parsed = new Date(String(value));
  return Number.isNaN(parsed.getTime()) ? 0 : parsed.getTime();
}
function getResendConfiguration() {
  const apiKey = String(process.env.RESEND_API_KEY || "").trim();
  const from = String(process.env.RESEND_FROM_EMAIL || "").trim();
  if (!apiKey || !from) throw createHttpError("Email sign-in codes are not configured.", 500);
  return { apiKey, from };
}
async function getUserByEmail(email: string): Promise<UserRecord | null> {
  try {
    return await admin.auth().getUserByEmail(email);
  } catch (unknownError) {
    const error = asBackendError(unknownError);
    if (error.code === "auth/user-not-found") return null;
    throw error;
  }
}
async function sendLoginCodeEmail(email: string, code: string, challengeId: string): Promise<void> {
  const resend = getResendConfiguration();
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${resend.apiKey}`,
      "Content-Type": "application/json",
      "Idempotency-Key": `auc-atlas-login-${challengeId}`,
    },
    body: JSON.stringify({
      from: resend.from,
      to: [email],
      subject: `${code} is your AUC Atlas sign-in code`,
      text: `Your AUC Atlas sign-in code is ${code}. It expires in 10 minutes. If you did not request this code, you can ignore this email.`,
      html: `<div style="margin:0;padding:40px 20px;background:#f7f4ee;font-family:Arial,sans-serif;color:#171717;"><div style="max-width:520px;margin:0 auto;padding:34px;border:1px solid rgba(23,23,23,0.1);border-radius:26px;background:#ffffff;"><p style="margin:0 0 14px;color:#c09a5c;font-size:12px;font-weight:700;letter-spacing:0.14em;text-transform:uppercase;">AUC Atlas</p><h1 style="margin:0 0 16px;font-size:28px;line-height:1.2;">Your sign-in code</h1><p style="margin:0 0 24px;color:#666666;font-size:15px;line-height:1.7;">Enter this code on the AUC Atlas login page:</p><div style="margin:0 0 24px;padding:20px;border-radius:18px;background:#f7f4ee;color:#171717;font-size:34px;font-weight:700;letter-spacing:0.22em;text-align:center;">${code}</div><p style="margin:0;color:#777777;font-size:13px;line-height:1.7;">This code expires in 10 minutes. If you did not request it, you can safely ignore this email.</p></div></div>`,
    }),
  });
  const data = asRecord(await response.json().catch(() => ({})));
  if (!response.ok || !data.id) {
    throw createHttpError("Could not send the sign-in code. Please try again.", 502);
  }
}

async function consumeRequestRateLimits(req: NextApiRequest, email: string) {
  await consumeSecurityRateLimit({
    scope: "email-login-code-request-ip",
    identifier: getRequestIp(req),
    maxAttempts: REQUEST_MAX_IP,
    windowMs: REQUEST_WINDOW_MS,
    message: "Too many sign-in code requests from this connection. Please try again later.",
  });
  await consumeSecurityRateLimit({
    scope: "email-login-code-request-email",
    identifier: email,
    maxAttempts: REQUEST_MAX_EMAIL,
    windowMs: REQUEST_WINDOW_MS,
    message: "Too many sign-in codes were requested for this email. Please try again later.",
  });
}
async function consumeVerifyRateLimits(req: NextApiRequest, email: string) {
  await consumeSecurityRateLimit({
    scope: "email-login-code-verify-ip",
    identifier: getRequestIp(req),
    maxAttempts: VERIFY_MAX_IP,
    windowMs: VERIFY_WINDOW_MS,
    message: "Too many code verification attempts from this connection. Please try again later.",
  });
  await consumeSecurityRateLimit({
    scope: "email-login-code-verify-email",
    identifier: email,
    maxAttempts: VERIFY_MAX_EMAIL,
    windowMs: VERIFY_WINDOW_MS,
    message: "Too many code verification attempts for this email. Please request a new code later.",
  });
}

type RequestResponse = {
  success: true;
  challengeId: string;
  expiresInSeconds: number;
  message: string;
  email?: string;
};
function createGenericRequestResponse(challengeId: string): RequestResponse {
  return {
    success: true,
    challengeId,
    expiresInSeconds: EXPIRES_MS / 1000,
    message: "If an account exists for this email, a sign-in code has been sent.",
  };
}

async function requestLoginCode(req: NextApiRequest, res: NextApiResponse) {
  const body = asRecord(req.body);
  const recovery = body.recovery === true;
  let loginChallenge: LoginChallenge | null = null;
  let email = cleanEmail(body.email);
  let userRecord: UserRecord | null = null;

  if (recovery) {
    loginChallenge = await getLoginChallenge(req);
    if (
      !loginChallenge.uid ||
      loginChallenge.authMethod !== "password" ||
      !loginChallenge.twoFactor.emailEnabled
    ) {
      throw createHttpError(
        "Log in with your password again to receive an email verification code.",
        403,
      );
    }
    userRecord = await admin.auth().getUser(loginChallenge.uid);
    if (userRecord.disabled) throw createHttpError("This account is disabled.", 403);
    email = ensureAllowedAucEmail(
      userRecord.email || loginChallenge.email || "",
      "receive a recovery code",
    );
  } else {
    if (!email) return res.status(400).json({ error: "Please enter your email address." });
    ensureAllowedAucEmail(email, "receive a sign-in code");
    userRecord = await getUserByEmail(email);
  }

  await consumeRequestRateLimits(req, email);
  const challengeId = randomBytes(32).toString("hex");
  if (!userRecord || userRecord.disabled) {
    return res.status(200).json(createGenericRequestResponse(challengeId));
  }

  const code = String(randomInt(0, 1_000_000)).padStart(6, "0");
  const challengeRef = admin.firestore().collection(COLLECTION).doc(userRecord.uid);
  await sendLoginCodeEmail(email, code, challengeId);
  await challengeRef.set({
    uid: userRecord.uid,
    challengeId,
    codeHash: createLoginCodeHash(challengeId, userRecord.uid, code),
    purpose: recovery ? "login-email-two-factor" : "passwordless",
    loginChallengeId: recovery && loginChallenge ? loginChallenge.challengeId : "",
    attempts: 0,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    expiresAt: admin.firestore.Timestamp.fromDate(new Date(Date.now() + EXPIRES_MS)),
  });
  const responseData = createGenericRequestResponse(challengeId);
  if (recovery) responseData.email = email;
  return res.status(200).json(responseData);
}

async function verifyLoginCode(req: NextApiRequest, res: NextApiResponse) {
  const body = asRecord(req.body);
  const recovery = body.recovery === true;
  let loginChallenge: LoginChallenge | null = null;
  let email = cleanEmail(body.email);
  const challengeId = String(body.challengeId || "").trim().toLowerCase();
  const code = cleanCode(body.code);

  if ((!recovery && !email) || !/^[a-f0-9]{64}$/.test(challengeId) || !/^\d{6}$/.test(code)) {
    return res.status(400).json({
      error: recovery
        ? "Please enter the 6-digit recovery code."
        : "Please enter the 6-digit sign-in code.",
    });
  }

  let userRecord: UserRecord | null = null;
  if (recovery) {
    loginChallenge = await getLoginChallenge(req);
    if (
      !loginChallenge.uid ||
      loginChallenge.authMethod !== "password" ||
      !loginChallenge.twoFactor.emailEnabled
    ) {
      throw createHttpError("Log in with your password again to use email verification.", 403);
    }
    userRecord = await admin.auth().getUser(loginChallenge.uid);
    if (userRecord.disabled) throw createHttpError("This account is disabled.", 403);
    email = ensureAllowedAucEmail(
      userRecord.email || loginChallenge.email || "",
      "verify a recovery code",
    );
  } else {
    ensureAllowedAucEmail(email, "verify a sign-in code");
    userRecord = await getUserByEmail(email);
  }

  await consumeVerifyRateLimits(req, email);
  if (!userRecord || userRecord.disabled) {
    return res.status(401).json({ error: "The sign-in code is invalid or has expired." });
  }

  const uid = userRecord.uid;
  const challengeRef = admin.firestore().collection(COLLECTION).doc(uid);
  const verificationResult = await admin.firestore().runTransaction(async (transaction) => {
    const challengeDoc = await transaction.get(challengeRef);
    if (!challengeDoc.exists) return { valid: false };
    const challenge = challengeDoc.data() || {};
    const expiresAtMs = timestampToMillis(challenge.expiresAt);
    if (challenge.usedAt || !expiresAtMs || expiresAtMs <= Date.now()) {
      transaction.delete(challengeRef);
      return { valid: false };
    }
    const expectedPurpose = recovery ? "login-email-two-factor" : "passwordless";
    if (
      challenge.challengeId !== challengeId ||
      challenge.uid !== uid ||
      String(challenge.purpose || "passwordless") !== expectedPurpose ||
      (recovery && (!loginChallenge || challenge.loginChallengeId !== loginChallenge.challengeId))
    ) {
      return { valid: false };
    }
    const attempts = Math.max(0, Number(challenge.attempts || 0));
    if (attempts >= MAX_VERIFY_ATTEMPTS) {
      transaction.delete(challengeRef);
      return { valid: false };
    }
    const valid = loginCodeHashesMatch(
      challenge.codeHash,
      createLoginCodeHash(challengeId, uid, code),
    );
    const nextAttempts = attempts + 1;
    if (!valid) {
      if (nextAttempts >= MAX_VERIFY_ATTEMPTS) transaction.delete(challengeRef);
      else {
        transaction.update(challengeRef, {
          attempts: nextAttempts,
          lastAttemptAt: admin.firestore.FieldValue.serverTimestamp(),
        });
      }
      return { valid: false };
    }
    transaction.update(challengeRef, {
      attempts: nextAttempts,
      usedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    return { valid: true };
  });

  if (!verificationResult.valid) {
    return res.status(401).json({ error: "The sign-in code is invalid or has expired." });
  }

  if (!userRecord.emailVerified) {
    userRecord = await admin.auth().updateUser(uid, { emailVerified: true });
    await admin.firestore().collection("users").doc(uid).set(
      {
        emailVerified: true,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true },
    );
  }

  const userDoc = await admin.firestore().collection("users").doc(uid).get();
  const userData = userDoc.exists ? userDoc.data() || {} : {};
  const twoFactor = asRecord(userData.twoFactor);
  const emailAddress = String(userRecord.email || userData.email || email);
  const fullName = String(userData.fullName || userRecord.displayName || "");
  const photoURL = String(userData.photoURL || userRecord.photoURL || "");

  if (recovery) {
    if (!loginChallenge) throw createHttpError("Please log in again.", 401);
    await consumeLoginChallenge(loginChallenge);
    await createSiteSessionForUid(uid, res, req);
    await clearLoginChallenge(req, res);
    await challengeRef.delete().catch(() => undefined);
    await Promise.all([
      clearSecurityRateLimit("email-login-code-request-email", email),
      clearSecurityRateLimit("email-login-code-verify-email", email),
    ]);
    return res.status(200).json({
      success: true,
      requiresTwoFactor: false,
      user: {
        uid,
        email: emailAddress,
        emailVerified: Boolean(userRecord.emailVerified),
        displayName: fullName,
        fullName,
        photoURL,
      },
    });
  }

  if (twoFactor.appEnabled) {
    await createLoginChallenge(uid, res, {
      email: emailAddress,
      twoFactor: { appEnabled: true, emailEnabled: Boolean(twoFactor.emailEnabled) },
    });
    await challengeRef.delete().catch(() => undefined);
    return res.status(200).json({ success: true, requiresTwoFactor: true, method: "app" });
  }

  await createSiteSessionForUid(uid, res, req);
  await challengeRef.delete().catch(() => undefined);
  await Promise.all([
    clearSecurityRateLimit("email-login-code-request-email", email),
    clearSecurityRateLimit("email-login-code-verify-email", email),
  ]);
  return res.status(200).json({
    success: true,
    requiresTwoFactor: false,
    user: {
      uid,
      email: emailAddress,
      emailVerified: Boolean(userRecord.emailVerified),
      displayName: fullName,
      fullName,
      photoURL,
    },
  });
}

const handler: NextApiHandler = async (req, res) => {
  try {
    if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
    const action = String(asRecord(req.body).action || "").trim().toLowerCase().slice(0, 20);
    if (action === "request") return requestLoginCode(req, res);
    if (action === "verify") return verifyLoginCode(req, res);
    return res.status(400).json({ error: "Invalid sign-in code action." });
  } catch (unknownError) {
    const error = asBackendError(unknownError, "Could not process the sign-in code.");
    if (error.retryAfterSeconds) res.setHeader("Retry-After", String(error.retryAfterSeconds));
    return res.status(error.statusCode || 500).json({
      error: error.message || "Could not process the sign-in code.",
    });
  }
};

export default handler;
