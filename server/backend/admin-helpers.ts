import "server-only";

import { createHash, randomBytes, timingSafeEqual } from "node:crypto";
import type { NextApiRequest } from "next";
import { authenticator } from "otplib";
import { admin } from "@/server/backend/firebase";
import {
  clearAuthenticatorAttempts,
  consumeAuthenticatorAttempt,
  getAuthenticatorSecret,
  getSiteSessionUser,
  signInWithPassword,
} from "@/server/backend/security";
import type { BackendError } from "@/server/backend/types";

const ACCESS_EXPIRES_MS = 5 * 60 * 60 * 1000;
const CHALLENGE_EXPIRES_MS = 10 * 60 * 1000;
const ACCESS_HEADER = "x-auc-admin-access";

type AdminActor = {
  uid: string;
  email: string;
  displayName: string;
  decodedUser: Awaited<ReturnType<typeof getSiteSessionUser>>;
};

export function createAdminError(message: string, statusCode: number, code?: string): BackendError {
  const error = new Error(message) as BackendError;
  error.statusCode = statusCode;
  if (code) error.code = code;
  return error;
}
function configuredAdminUids(): Set<string> {
  return new Set(String(process.env.ADMIN_UIDS || "").split(/[\s,]+/).map((uid) => uid.trim()).filter(Boolean));
}
function hasAdminClaim(userRecord: { customClaims?: Record<string, unknown> }): boolean {
  return userRecord.customClaims?.admin === true;
}
export async function isAdminUid(uid: unknown): Promise<boolean> {
  const safeUid = String(uid || "").trim();
  if (!safeUid) return false;
  if (configuredAdminUids().has(safeUid)) return true;
  try {
    return hasAdminClaim(await admin.auth().getUser(safeUid));
  } catch (error) {
    if ((error as { code?: unknown }).code === "auth/user-not-found") return false;
    throw error;
  }
}
export async function ensureAdminUser(req: NextApiRequest): Promise<AdminActor> {
  const decodedUser = await getSiteSessionUser(req, { checkRevoked: true });
  const userRecord = await admin.auth().getUser(decodedUser.uid);
  if (
    !configuredAdminUids().has(decodedUser.uid) &&
    decodedUser.admin !== true &&
    !hasAdminClaim(userRecord)
  ) {
    throw createAdminError("Administrator access is required.", 403, "administrator-required");
  }
  return {
    uid: decodedUser.uid,
    email: String(userRecord.email || decodedUser.email || "").trim().toLowerCase(),
    displayName: String(userRecord.displayName || "AUC Atlas Admin").trim(),
    decodedUser,
  };
}
function timestampToMillis(value: unknown): number {
  if (!value) return 0;
  const v = value as { toMillis?: () => number; toDate?: () => Date; seconds?: number; _seconds?: number };
  if (typeof v.toMillis === "function") return v.toMillis();
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
function accessError(message?: string): BackendError {
  return createAdminError(message || "Enter your administrator password to continue.", 403, "admin-fresh-auth-required");
}
function getSessionId(actor: AdminActor): string {
  const id = String(actor.decodedUser.siteSessionId || "").trim();
  if (!/^[a-f0-9]{64}$/i.test(id)) throw accessError("Your administrator session is invalid. Log in again.");
  return id;
}
function hashAccess(uid: string, sessionId: string, token: string): string {
  return createHash("sha256").update(`admin-access:${uid}:${sessionId}:${token}`).digest("hex");
}
function hashChallenge(uid: string, sessionId: string, token: string): string {
  return createHash("sha256").update(`admin-auth-challenge:${uid}:${sessionId}:${token}`).digest("hex");
}
function safeEqualHex(a: unknown, b: unknown): boolean {
  const x = String(a || "");
  const y = String(b || "");
  if (!/^[a-f0-9]{64}$/i.test(x) || !/^[a-f0-9]{64}$/i.test(y)) return false;
  return timingSafeEqual(Buffer.from(x, "hex"), Buffer.from(y, "hex"));
}
function accessRef(actor: AdminActor) {
  return admin.firestore().collection("users").doc(actor.uid).collection("adminAccess").doc(getSessionId(actor));
}
async function twoFactorState(uid: string) {
  const [userDoc, secret] = await Promise.all([
    admin.firestore().collection("users").doc(uid).get(),
    getAuthenticatorSecret(uid),
  ]);
  const data = userDoc.exists ? userDoc.data() || {} : {};
  const twoFactor = data.twoFactor && typeof data.twoFactor === "object" ? data.twoFactor as Record<string, unknown> : {};
  return { requiresTwoFactor: Boolean(twoFactor.appEnabled || secret), secret: String(secret || "").trim() };
}
export async function getAdminAuthenticationRequirements(actor: AdminActor) {
  const twoFactor = await twoFactorState(actor.uid);
  return {
    requiresPassword: true,
    requiresTwoFactor: twoFactor.requiresTwoFactor,
    admin: { uid: actor.uid, email: actor.email, displayName: actor.displayName },
  };
}
async function createAccess(actor: AdminActor, authenticatorVerified: boolean) {
  const sessionId = getSessionId(actor);
  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + ACCESS_EXPIRES_MS);
  await accessRef(actor).set({
    uid: actor.uid,
    siteSessionId: sessionId,
    tokenHash: hashAccess(actor.uid, sessionId, token),
    passwordVerified: true,
    authenticatorVerified,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    expiresAt: admin.firestore.Timestamp.fromDate(expiresAt),
  });
  return { success: true, adminAccessToken: token, adminAccessExpiresAt: expiresAt.toISOString(), requiresTwoFactor: authenticatorVerified };
}
function challengeError(message?: string): BackendError {
  const error = createAdminError(message || "Administrator verification expired. Enter your password again.", 401, "admin-auth-challenge-invalid");
  error.requiresTwoFactor = true;
  return error;
}
async function createChallenge(actor: AdminActor) {
  const sessionId = getSessionId(actor);
  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + CHALLENGE_EXPIRES_MS);
  await accessRef(actor).set({
    uid: actor.uid,
    siteSessionId: sessionId,
    challengeTokenHash: hashChallenge(actor.uid, sessionId, token),
    passwordVerified: true,
    authenticatorVerified: false,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    expiresAt: admin.firestore.Timestamp.fromDate(expiresAt),
  });
  return { token, expiresAt };
}
async function requireChallenge(actor: AdminActor, tokenValue: unknown) {
  const token = String(tokenValue || "").trim();
  if (!/^[a-f0-9]{64}$/i.test(token)) throw challengeError();
  const sessionId = getSessionId(actor);
  const ref = accessRef(actor);
  const doc = await ref.get();
  if (!doc.exists) throw challengeError();
  const data = doc.data() || {};
  const expiresAtMs = timestampToMillis(data.expiresAt);
  if (!expiresAtMs || expiresAtMs <= Date.now()) {
    await ref.delete().catch(() => undefined);
    throw challengeError("Administrator verification expired. Enter your password again.");
  }
  if (String(data.uid || "") !== actor.uid || String(data.siteSessionId || "") !== sessionId || data.passwordVerified !== true || data.authenticatorVerified === true || !safeEqualHex(data.challengeTokenHash, hashChallenge(actor.uid, sessionId, token))) {
    throw challengeError();
  }
  return { token, sessionId, ref };
}
async function consumeChallenge(actor: AdminActor, tokenValue: unknown): Promise<void> {
  const validated = await requireChallenge(actor, tokenValue);
  await admin.firestore().runTransaction(async (transaction) => {
    const doc = await transaction.get(validated.ref);
    if (!doc.exists) throw challengeError();
    const data = doc.data() || {};
    if (
      timestampToMillis(data.expiresAt) <= Date.now() ||
      String(data.uid || "") !== actor.uid ||
      String(data.siteSessionId || "") !== validated.sessionId ||
      data.passwordVerified !== true || data.authenticatorVerified === true ||
      !safeEqualHex(data.challengeTokenHash, hashChallenge(actor.uid, validated.sessionId, validated.token))
    ) throw challengeError();
    transaction.delete(validated.ref);
  });
}
export async function authenticateAdminPassword(actor: AdminActor, passwordValue: unknown) {
  const password = String(passwordValue || "").slice(0, 1024);
  if (!password) throw createAdminError("Enter your administrator account password.", 400, "admin-password-required");
  await consumeAuthenticatorAttempt(actor.uid, "admin-password");
  let result;
  try { result = await signInWithPassword(actor.email, password); }
  catch { throw createAdminError("Incorrect administrator password.", 401, "admin-password-invalid"); }
  if (String(result.localId || "") !== actor.uid) throw createAdminError("Incorrect administrator password.", 401, "admin-password-invalid");
  await clearAuthenticatorAttempts(actor.uid, "admin-password");
  const twoFactor = await twoFactorState(actor.uid);
  if (!twoFactor.requiresTwoFactor) return createAccess(actor, false);
  if (!twoFactor.secret) {
    const error = createAdminError("Authenticator app is not configured correctly.", 500, "admin-authenticator-misconfigured");
    error.requiresTwoFactor = true;
    throw error;
  }
  const challenge = await createChallenge(actor);
  return { success: true, requiresTwoFactor: true, adminChallengeToken: challenge.token, adminChallengeExpiresAt: challenge.expiresAt.toISOString() };
}
export async function verifyAdminAuthenticator(actor: AdminActor, challengeToken: unknown, codeValue: unknown) {
  const code = String(codeValue || "").replace(/\D/g, "").slice(0, 6);
  if (!/^\d{6}$/.test(code)) {
    const error = createAdminError("Enter your 6-digit authenticator code.", 400, "admin-authenticator-required");
    error.requiresTwoFactor = true;
    throw error;
  }
  await requireChallenge(actor, challengeToken);
  const twoFactor = await twoFactorState(actor.uid);
  if (!twoFactor.requiresTwoFactor || !twoFactor.secret) {
    const error = createAdminError("Authenticator app is not configured correctly.", 500, "admin-authenticator-misconfigured");
    error.requiresTwoFactor = true;
    throw error;
  }
  await consumeAuthenticatorAttempt(actor.uid, "admin-two-factor");
  authenticator.options = { window: 1 };
  if (!authenticator.check(code, twoFactor.secret)) {
    const error = createAdminError("Invalid authenticator code.", 401, "admin-authenticator-invalid");
    error.requiresTwoFactor = true;
    throw error;
  }
  await consumeChallenge(actor, challengeToken);
  await clearAuthenticatorAttempts(actor.uid, "admin-two-factor");
  return createAccess(actor, true);
}
export async function requireFreshAdminAccess(req: NextApiRequest, actor: AdminActor): Promise<true> {
  const token = getHeader(req, ACCESS_HEADER).trim();
  if (!/^[a-f0-9]{64}$/i.test(token)) throw accessError();
  const sessionId = getSessionId(actor);
  const ref = accessRef(actor);
  const doc = await ref.get();
  if (!doc.exists) throw accessError();
  const data = doc.data() || {};
  if (timestampToMillis(data.expiresAt) <= Date.now()) {
    await ref.delete().catch(() => undefined);
    throw accessError("Administrator authentication expired. Enter your password again.");
  }
  if (String(data.uid || "") !== actor.uid || String(data.siteSessionId || "") !== sessionId || data.passwordVerified !== true || !safeEqualHex(data.tokenHash, hashAccess(actor.uid, sessionId, token))) throw accessError();
  const twoFactor = await twoFactorState(actor.uid);
  if (twoFactor.requiresTwoFactor && data.authenticatorVerified !== true) throw accessError("Authenticator verification is required.");
  return true;
}
