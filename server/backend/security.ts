import "server-only";

import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import type { NextApiRequest, NextApiResponse } from "next";
import type { DecodedIdToken } from "firebase-admin/auth";
import type { DocumentReference } from "firebase-admin/firestore";
import { admin } from "@/server/backend/firebase";
import { decryptTotpSecret, encryptTotpSecret } from "@/server/backend/totp-encryption";
import { asBackendError, asRecord, type BackendError, type UnknownRecord } from "@/server/backend/types";

const IS_PRODUCTION =
  process.env.NODE_ENV === "production" || process.env.VERCEL_ENV === "production";
const SITE_SESSION_COOKIE_NAME = IS_PRODUCTION
  ? "__Host-auc_atlas_session"
  : "auc_atlas_session";
const SITE_SESSION_ID_COOKIE_NAME = IS_PRODUCTION
  ? "__Host-auc_atlas_session_id"
  : "auc_atlas_session_id";
const LOGIN_CHALLENGE_COOKIE_NAME = IS_PRODUCTION
  ? "__Host-auc_atlas_login_challenge"
  : "auc_atlas_login_challenge";

const SITE_SESSION_EXPIRES_MS = 5 * 24 * 60 * 60 * 1000;
const SITE_SESSION_TOUCH_COOLDOWN_MS = 5 * 60 * 1000;
const LOGIN_CHALLENGE_EXPIRES_MS = 10 * 60 * 1000;
const SECURITY_PANEL_ACCESS_EXPIRES_MS = 15 * 60 * 1000;
const AUTHENTICATOR_ATTEMPT_WINDOW_MS = 15 * 60 * 1000;
const AUTHENTICATOR_MAX_ATTEMPTS = 5;
const ALLOWED_AUC_EMAIL_DOMAIN = "aucegypt.edu";

type DecodedSiteUser = DecodedIdToken & { siteSessionId: string };

type FirebaseSignInResult = UnknownRecord & {
  idToken?: string;
  localId?: string;
  uid?: string;
};

type SessionRecordOptions = { create?: boolean };

type LoginChallengeDetails = {
  email?: string;
  authMethod?: string;
  twoFactor?: UnknownRecord;
};

export type LoginChallenge = {
  challengeId: string;
  ref: DocumentReference;
  uid: string;
  email: string;
  authMethod: string;
  twoFactor: UnknownRecord;
};

type SessionInternal = {
  id: string;
  browserKey: string;
  browserName: string;
  browserVersion: string;
  browserLabel: string;
  osName: string;
  deviceType: string;
  deviceLabel: string;
  ipAddress: string;
  userAgent: string;
  createdAt: string;
  lastSeenAt: string;
  expiresAt: string;
  current: boolean;
  ref: DocumentReference;
  groupKey: string;
  lastSeenAtMs: number;
};

function getSecuritySecret(): string {
  return String(
    process.env.SECURITY_CODE_SECRET ||
      process.env.FIREBASE_PRIVATE_KEY ||
      process.env.FIREBASE_CLIENT_EMAIL ||
      "auc-atlas-security-secret",
  );
}

function createRandomToken(): string {
  return randomBytes(32).toString("hex");
}

function isExpired(timestamp: unknown): boolean {
  if (!timestamp) return true;
  const value = timestamp as { toDate?: () => Date };
  const date = typeof value.toDate === "function" ? value.toDate() : new Date(String(timestamp));
  return date.getTime() <= Date.now();
}

function getLoginChallengeHash(
  uid: unknown,
  challengeId: unknown,
  token: unknown,
  salt: unknown,
): string {
  return createHmac("sha256", getSecuritySecret())
    .update(`login-challenge:${String(uid || "")}:${String(challengeId || "")}:${String(token || "")}:${String(salt || "")}`)
    .digest("hex");
}

function getSiteSessionHash(sessionId: unknown): string {
  return createHmac("sha256", getSecuritySecret())
    .update(`site-session:${String(sessionId || "")}`)
    .digest("hex");
}

function getSecurityPanelAccessHash(
  uid: unknown,
  siteSessionId: unknown,
  token: unknown,
): string {
  return createHmac("sha256", getSecuritySecret())
    .update(`security-panel:${String(uid || "")}:${String(siteSessionId || "")}:${String(token || "")}`)
    .digest("hex");
}

function getRequestHeader(req: NextApiRequest, name: string): string {
  const value = req.headers[name] ?? req.headers[name.toLowerCase()];
  return Array.isArray(value) ? String(value[0] || "") : String(value || "");
}

function getSessionClientIp(req: NextApiRequest): string {
  const forwardedFor = getRequestHeader(req, "x-forwarded-for").split(",")[0].trim();
  const realIp = getRequestHeader(req, "x-real-ip").trim();
  const socketIp = req.socket?.remoteAddress || "";
  return String(forwardedFor || realIp || socketIp || "").slice(0, 80);
}

function getBrowserVersion(match: RegExpMatchArray | null): string {
  return match?.[1] ? String(match[1]).split(".")[0] : "";
}

function getSessionBrowserDetails(userAgent: unknown) {
  const value = String(userAgent || "");
  let match = value.match(/EdgA?\/([\d.]+)/) || value.match(/EdgiOS\/([\d.]+)/);
  if (match) return { key: "chrome", name: "Microsoft Edge", version: getBrowserVersion(match) };
  match = value.match(/OPR\/([\d.]+)/) || value.match(/Opera\/([\d.]+)/);
  if (match) return { key: "opera", name: "Opera", version: getBrowserVersion(match) };
  match = value.match(/CriOS\/([\d.]+)/) || value.match(/Chrome\/([\d.]+)/);
  if (match) return { key: "chrome", name: "Chrome", version: getBrowserVersion(match) };
  match = value.match(/FxiOS\/([\d.]+)/) || value.match(/Firefox\/([\d.]+)/);
  if (match) return { key: "firefox", name: "Firefox", version: getBrowserVersion(match) };
  match = value.match(/Version\/([\d.]+).*Safari\//);
  if (match || /Safari\//.test(value)) {
    return { key: "safari", name: "Safari", version: getBrowserVersion(match) };
  }
  return { key: "chrome", name: "Browser", version: "" };
}

function getSessionPlatformLabel(userAgent: unknown): string {
  const value = String(userAgent || "");
  if (/iPad/.test(value)) return "iPadOS";
  if (/iPhone|iPod/.test(value)) return "iOS";
  if (/Android/.test(value)) return "Android";
  if (/Windows NT/.test(value)) return "Windows";
  if (/Mac OS X|Macintosh/.test(value)) return "macOS";
  if (/Linux/.test(value)) return "Linux";
  return "Device";
}

function getSessionDeviceType(userAgent: unknown): string {
  const value = String(userAgent || "");
  if (/iPad|Tablet/.test(value)) return "Tablet";
  if (/Mobi|iPhone|iPod|Android/.test(value)) return "Mobile";
  return "Desktop";
}

function getSessionDetailsFromRequest(req: NextApiRequest) {
  const userAgent = getRequestHeader(req, "user-agent").slice(0, 600);
  const browser = getSessionBrowserDetails(userAgent);
  const osName = getSessionPlatformLabel(userAgent);
  const deviceType = getSessionDeviceType(userAgent);
  return {
    userAgent,
    ipAddress: getSessionClientIp(req),
    browserKey: browser.key,
    browserName: browser.name,
    browserVersion: browser.version,
    browserLabel: browser.name,
    osName,
    deviceType,
    deviceLabel: `${browser.name} on ${osName}`,
  };
}

function sessionTimestampToMillis(value: unknown): number {
  if (!value) return 0;
  const timestamp = value as {
    toDate?: () => Date;
    seconds?: number;
    _seconds?: number;
  };
  if (typeof timestamp.toDate === "function") return timestamp.toDate().getTime();
  if (typeof timestamp.seconds === "number") return timestamp.seconds * 1000;
  if (typeof timestamp._seconds === "number") return timestamp._seconds * 1000;
  const parsedDate = new Date(String(value));
  return Number.isNaN(parsedDate.getTime()) ? 0 : parsedDate.getTime();
}

function serializeSessionTimestamp(value: unknown): string {
  const millis = sessionTimestampToMillis(value);
  return millis ? new Date(millis).toISOString() : "";
}

function createAuthenticatorAttemptLimitError(retryAfterSeconds: unknown): BackendError {
  const safeRetryAfterSeconds = Math.max(1, Math.ceil(Number(retryAfterSeconds) || 1));
  const retryAfterMinutes = Math.max(1, Math.ceil(safeRetryAfterSeconds / 60));
  const error = new Error(
    `Too many authenticator attempts. Try again in ${retryAfterMinutes} ${retryAfterMinutes === 1 ? "minute" : "minutes"}.`,
  ) as BackendError;
  error.statusCode = 429;
  error.retryAfterSeconds = safeRetryAfterSeconds;
  return error;
}

function getAuthenticatorAttemptDocumentId(scope: unknown): string {
  return String(scope || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

export async function consumeAuthenticatorAttempt(uid: unknown, scope: unknown): Promise<void> {
  const safeUid = String(uid || "").trim();
  const documentId = getAuthenticatorAttemptDocumentId(scope);
  if (!safeUid || !documentId) {
    const error = new Error("Could not verify authenticator attempt.") as BackendError;
    error.statusCode = 400;
    throw error;
  }

  const db = admin.firestore();
  const attemptRef = db
    .collection("users")
    .doc(safeUid)
    .collection("authenticatorAttempts")
    .doc(documentId);
  const nowMs = Date.now();

  await db.runTransaction(async (transaction) => {
    const attemptDoc = await transaction.get(attemptRef);
    const data = attemptDoc.exists ? attemptDoc.data() || {} : {};
    const windowStartedAtMs = sessionTimestampToMillis(data.windowStartedAt);
    const windowEndsAtMs = windowStartedAtMs + AUTHENTICATOR_ATTEMPT_WINDOW_MS;
    const hasActiveWindow = windowStartedAtMs > 0 && nowMs < windowEndsAtMs;
    const attemptCount = hasActiveWindow ? Math.max(0, Number(data.count || 0)) : 0;

    if (hasActiveWindow && attemptCount >= AUTHENTICATOR_MAX_ATTEMPTS) {
      throw createAuthenticatorAttemptLimitError(Math.ceil((windowEndsAtMs - nowMs) / 1000));
    }

    const activeWindowStartedAtMs = hasActiveWindow ? windowStartedAtMs : nowMs;
    transaction.set(attemptRef, {
      count: attemptCount + 1,
      windowStartedAt: admin.firestore.Timestamp.fromDate(new Date(activeWindowStartedAtMs)),
      lastAttemptAt: admin.firestore.FieldValue.serverTimestamp(),
      expiresAt: admin.firestore.Timestamp.fromDate(
        new Date(activeWindowStartedAtMs + AUTHENTICATOR_ATTEMPT_WINDOW_MS),
      ),
    });
  });
}

export async function clearAuthenticatorAttempts(uid: unknown, scope: unknown): Promise<void> {
  const safeUid = String(uid || "").trim();
  const documentId = getAuthenticatorAttemptDocumentId(scope);
  if (!safeUid || !documentId) return;
  await admin
    .firestore()
    .collection("users")
    .doc(safeUid)
    .collection("authenticatorAttempts")
    .doc(documentId)
    .delete()
    .catch(() => undefined);
}

function isSiteSessionActive(data: UnknownRecord): boolean {
  return Boolean(data && !data.revokedAt && !isExpired(data.expiresAt));
}

function cleanAuthEmail(value: unknown): string {
  return String(value || "").trim().toLowerCase();
}

export function isAllowedAucEmail(email: unknown): boolean {
  const normalizedEmail = cleanAuthEmail(email);
  const atIndex = normalizedEmail.indexOf("@");
  return (
    atIndex > 0 &&
    atIndex === normalizedEmail.lastIndexOf("@") &&
    normalizedEmail.slice(atIndex + 1) === ALLOWED_AUC_EMAIL_DOMAIN
  );
}

function createAucEmailRequiredError(action: unknown): BackendError {
  const error = new Error(
    `Please use your AUC email address (@aucegypt.edu) to ${String(action || "continue")}.`,
  ) as BackendError;
  error.statusCode = 403;
  return error;
}

export function ensureAllowedAucEmail(email: unknown, action?: unknown): string {
  const normalizedEmail = cleanAuthEmail(email);
  if (!isAllowedAucEmail(normalizedEmail)) throw createAucEmailRequiredError(action);
  return normalizedEmail;
}

async function getDecodedUserEmail(decodedUser: DecodedIdToken): Promise<string> {
  const tokenEmail = cleanAuthEmail(decodedUser.email);
  if (tokenEmail) return tokenEmail;
  if (decodedUser.uid) {
    const userRecord = await admin.auth().getUser(decodedUser.uid);
    return cleanAuthEmail(userRecord.email);
  }
  return "";
}

async function ensureDecodedUserHasAllowedAucEmail(
  decodedUser: DecodedIdToken,
  action?: unknown,
): Promise<string> {
  return ensureAllowedAucEmail(await getDecodedUserEmail(decodedUser), action);
}

function appendSetCookie(res: NextApiResponse, cookieValue: string): void {
  const existing = res.getHeader("Set-Cookie");
  if (!existing) {
    res.setHeader("Set-Cookie", cookieValue);
    return;
  }
  const existingValues = Array.isArray(existing) ? existing.map(String) : [String(existing)];
  res.setHeader("Set-Cookie", [...existingValues, cookieValue]);
}

function setCookie(
  res: NextApiResponse,
  name: string,
  value: string,
  maxAgeSeconds: number,
): void {
  appendSetCookie(
    res,
    `${name}=${encodeURIComponent(value)}; Max-Age=${maxAgeSeconds}; Path=/; HttpOnly; SameSite=Lax${IS_PRODUCTION ? "; Secure" : ""}`,
  );
}

function clearCookie(res: NextApiResponse, name: string): void {
  appendSetCookie(
    res,
    `${name}=; Max-Age=0; Path=/; HttpOnly; SameSite=Lax${IS_PRODUCTION ? "; Secure" : ""}`,
  );
}

function getCookie(req: NextApiRequest, name: string): string {
  const cookieHeader = req.headers.cookie || "";
  for (const cookie of cookieHeader.split(";")) {
    const parts = cookie.trim().split("=");
    if (parts[0] === name) {
      try {
        return decodeURIComponent(parts.slice(1).join("="));
      } catch {
        return parts.slice(1).join("=");
      }
    }
  }
  return "";
}

function getFirebaseWebApiKey(): string {
  const apiKey = String(process.env.FIREBASE_WEB_API_KEY || "").trim();
  if (!apiKey) {
    const error = new Error("Firebase login is not configured.") as BackendError;
    error.statusCode = 500;
    throw error;
  }
  return apiKey;
}

async function firebaseAuthRest(endpoint: string, payload: UnknownRecord): Promise<FirebaseSignInResult> {
  const response = await fetch(
    `https://identitytoolkit.googleapis.com/v1/${endpoint}?key=${encodeURIComponent(getFirebaseWebApiKey())}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    },
  );
  const data = (await response.json().catch(() => ({}))) as FirebaseSignInResult;
  if (!response.ok) {
    const error = new Error("firebase-auth-rest-error") as BackendError;
    error.statusCode = response.status;
    error.firebaseError = data;
    throw error;
  }
  return data;
}

export function signInWithPassword(email: unknown, password: unknown): Promise<FirebaseSignInResult> {
  return firebaseAuthRest("accounts:signInWithPassword", {
    email: String(email || ""),
    password: String(password || ""),
    returnSecureToken: true,
  });
}

export function signInWithCustomToken(customToken: unknown): Promise<FirebaseSignInResult> {
  return firebaseAuthRest("accounts:signInWithCustomToken", {
    token: String(customToken || ""),
    returnSecureToken: true,
  });
}

export function getCurrentSiteSessionHash(req: NextApiRequest): string {
  const sessionId = getCookie(req, SITE_SESSION_ID_COOKIE_NAME);
  return /^[a-f0-9]{64}$/i.test(sessionId) ? getSiteSessionHash(sessionId) : "";
}

async function saveSiteSession(
  uid: string,
  sessionHash: string,
  req: NextApiRequest,
  options: SessionRecordOptions,
) {
  const details = getSessionDetailsFromRequest(req);
  const sessionRef = admin
    .firestore()
    .collection("users")
    .doc(uid)
    .collection("sessions")
    .doc(sessionHash);
  const now = admin.firestore.FieldValue.serverTimestamp();
  const updateData: Record<string, unknown> = {
    ...details,
    uid,
    sessionId: sessionHash,
    lastSeenAt: now,
  };
  if (options.create) {
    updateData.createdAt = now;
    updateData.expiresAt = admin.firestore.Timestamp.fromDate(
      new Date(Date.now() + SITE_SESSION_EXPIRES_MS),
    );
    updateData.revokedAt = null;
  }
  await sessionRef.set(updateData, { merge: true });
  return { id: sessionHash, ref: sessionRef };
}

async function createSiteSessionRecord(
  decodedUser: DecodedIdToken,
  req: NextApiRequest,
  res?: NextApiResponse,
) {
  if (!decodedUser?.uid) return { id: "" };
  const sessionId = createRandomToken();
  const sessionHash = getSiteSessionHash(sessionId);
  await saveSiteSession(decodedUser.uid, sessionHash, req, { create: true });
  void getUserSiteSessions(decodedUser.uid, sessionHash).catch(() => undefined);
  if (res) {
    setCookie(
      res,
      SITE_SESSION_ID_COOKIE_NAME,
      sessionId,
      Math.floor(SITE_SESSION_EXPIRES_MS / 1000),
    );
  }
  return { id: sessionHash };
}

export async function ensureSiteSessionRecord(
  decodedUser: DecodedIdToken & { siteSessionId?: string },
  req: NextApiRequest,
  res?: NextApiResponse,
) {
  const currentSessionHash = getCurrentSiteSessionHash(req);
  if (decodedUser?.uid && currentSessionHash) {
    decodedUser.siteSessionId = currentSessionHash;
    return { id: currentSessionHash };
  }
  return createSiteSessionRecord(decodedUser, req, res);
}

function getSiteSessionDisplayKey(session: SessionInternal): string {
  const userAgent = String(session.userAgent || "").trim().toLowerCase();
  const ipAddress = String(session.ipAddress || "").trim().toLowerCase();
  if (userAgent) return [userAgent, ipAddress].join("|");
  return [
    String(session.browserName || session.browserLabel || "Browser").trim().toLowerCase(),
    String(session.browserVersion || "").trim().toLowerCase(),
    String(session.osName || "Device").trim().toLowerCase(),
    String(session.deviceType || "").trim().toLowerCase(),
    ipAddress,
  ].join("|");
}

export async function getUserSiteSessions(uid: string, currentSessionHash: string) {
  const snapshot = await admin
    .firestore()
    .collection("users")
    .doc(uid)
    .collection("sessions")
    .get();
  const sessionsByKey = new Map<string, SessionInternal>();
  const cleanup: Array<Promise<unknown>> = [];

  snapshot.forEach((doc) => {
    const data = doc.data() || {};
    if (data.revokedAt) return;
    if (!isSiteSessionActive(data)) {
      cleanup.push(doc.ref.delete().catch(() => undefined));
      return;
    }

    const lastSeenAt = data.lastSeenAt || data.createdAt;
    const session: SessionInternal = {
      id: doc.id,
      browserKey: String(data.browserKey || "chrome"),
      browserName: String(data.browserName || "Browser"),
      browserVersion: String(data.browserVersion || ""),
      browserLabel: String(data.browserLabel || data.browserName || "Browser"),
      osName: String(data.osName || "Device"),
      deviceType: String(data.deviceType || ""),
      deviceLabel: String(data.deviceLabel || "Browser session"),
      ipAddress: String(data.ipAddress || ""),
      userAgent: String(data.userAgent || ""),
      createdAt: serializeSessionTimestamp(data.createdAt),
      lastSeenAt: serializeSessionTimestamp(lastSeenAt),
      expiresAt: serializeSessionTimestamp(data.expiresAt),
      current: Boolean(currentSessionHash && doc.id === currentSessionHash),
      ref: doc.ref,
      groupKey: "",
      lastSeenAtMs: sessionTimestampToMillis(lastSeenAt),
    };
    session.groupKey = getSiteSessionDisplayKey(session);
    const existingSession = sessionsByKey.get(session.groupKey);
    if (!existingSession) {
      sessionsByKey.set(session.groupKey, session);
      return;
    }
    const shouldReplaceExisting =
      session.current || (!existingSession.current && session.lastSeenAtMs > existingSession.lastSeenAtMs);
    const duplicateSession = shouldReplaceExisting ? existingSession : session;
    cleanup.push(duplicateSession.ref.delete().catch(() => undefined));
    if (shouldReplaceExisting) sessionsByKey.set(session.groupKey, session);
  });

  await Promise.all(cleanup.slice(0, 20));
  const sessions = Array.from(sessionsByKey.values());
  sessions.sort((a, b) => (a.current !== b.current ? (a.current ? -1 : 1) : b.lastSeenAtMs - a.lastSeenAtMs));
  return sessions.map(({ ref: _ref, groupKey: _groupKey, lastSeenAtMs: _lastSeenAtMs, ...session }) => session);
}

export async function revokeUserSiteSession(
  uid: string,
  sessionId: unknown,
  revokedReason?: string,
) {
  const cleanSessionId = String(sessionId || "").trim();
  if (!/^[a-f0-9]{64}$/i.test(cleanSessionId)) {
    const error = new Error("Session not found.") as BackendError;
    error.statusCode = 404;
    throw error;
  }
  const sessionRef = admin
    .firestore()
    .collection("users")
    .doc(uid)
    .collection("sessions")
    .doc(cleanSessionId);
  const sessionDoc = await sessionRef.get();
  if (!sessionDoc.exists || !isSiteSessionActive(sessionDoc.data() || {})) {
    const error = new Error("Session not found.") as BackendError;
    error.statusCode = 404;
    throw error;
  }
  await sessionRef.set(
    {
      revokedAt: admin.firestore.FieldValue.serverTimestamp(),
      revokedReason: revokedReason || "signed_out",
    },
    { merge: true },
  );
  return { id: cleanSessionId };
}

export async function createSiteSessionFromIdToken(
  idToken: string,
  res: NextApiResponse,
  req: NextApiRequest,
): Promise<string> {
  const decodedToken = await admin.auth().verifyIdToken(idToken);
  await ensureDecodedUserHasAllowedAucEmail(decodedToken, "continue");
  const fallbackSessionPrefix = "idtoken.";
  let sessionCookie = "";
  let sessionMaxAgeSeconds = Math.floor(SITE_SESSION_EXPIRES_MS / 1000);

  try {
    sessionCookie = await Promise.race<string>([
      admin.auth().createSessionCookie(idToken, { expiresIn: SITE_SESSION_EXPIRES_MS }),
      new Promise<string>((_resolve, reject) => {
        setTimeout(() => {
          const error = new Error("session-cookie-timeout") as BackendError;
          error.sessionCookieTimeout = true;
          reject(error);
        }, 2500);
      }),
    ]);
  } catch (unknownError) {
    const error = asBackendError(unknownError);
    if (!error.sessionCookieTimeout) throw error;
    sessionCookie = `${fallbackSessionPrefix}${idToken}`;
    sessionMaxAgeSeconds = 55 * 60;
  }

  setCookie(res, SITE_SESSION_COOKIE_NAME, sessionCookie, sessionMaxAgeSeconds);
  await createSiteSessionRecord(decodedToken, req, res);
  return sessionCookie;
}

export async function createSiteSessionForUid(
  uid: string,
  res: NextApiResponse,
  req: NextApiRequest,
): Promise<FirebaseSignInResult & { sessionCookie: string }> {
  const customToken = await admin.auth().createCustomToken(uid);
  const signInData = await signInWithCustomToken(customToken);
  const idToken = String(signInData.idToken || "");
  if (!idToken) {
    const error = new Error("Could not create login session.") as BackendError;
    error.statusCode = 500;
    throw error;
  }
  const sessionCookie = await createSiteSessionFromIdToken(idToken, res, req);
  return { ...signInData, sessionCookie };
}

export function clearSiteSessionCookie(res: NextApiResponse): void {
  clearCookie(res, SITE_SESSION_COOKIE_NAME);
  clearCookie(res, SITE_SESSION_ID_COOKIE_NAME);
}

export async function getSiteSessionUser(
  req: NextApiRequest,
  options: { checkRevoked?: boolean } = {},
): Promise<DecodedSiteUser> {
  const sessionCookie = getCookie(req, SITE_SESSION_COOKIE_NAME);
  const sessionHash = getCurrentSiteSessionHash(req);
  const fallbackSessionPrefix = "idtoken.";
  if (!sessionCookie) {
    const error = new Error("not-signed-in") as BackendError;
    error.statusCode = 401;
    throw error;
  }
  if (!sessionHash) {
    const error = new Error("account-session-invalid") as BackendError;
    error.statusCode = 401;
    throw error;
  }

  const usesFallbackIdToken = sessionCookie.startsWith(fallbackSessionPrefix);
  const cookieToken = usesFallbackIdToken
    ? sessionCookie.slice(fallbackSessionPrefix.length)
    : sessionCookie;
  const decodedUser = usesFallbackIdToken
    ? await admin.auth().verifyIdToken(cookieToken, options.checkRevoked !== false)
    : await admin.auth().verifySessionCookie(cookieToken, options.checkRevoked !== false);

  await ensureDecodedUserHasAllowedAucEmail(decodedUser, "continue");
  const userRecord = await admin.auth().getUser(decodedUser.uid);
  const authoritativeEmail = cleanAuthEmail(userRecord.email || decodedUser.email);
  if (!userRecord.emailVerified || !isAllowedAucEmail(authoritativeEmail)) {
    const error = new Error("Please verify your AUC email address before continuing.") as BackendError;
    error.statusCode = 403;
    error.code = "email-verification-required";
    throw error;
  }

  const sessionRef = admin
    .firestore()
    .collection("users")
    .doc(decodedUser.uid)
    .collection("sessions")
    .doc(sessionHash);
  const sessionDoc = await sessionRef.get();
  const sessionData = sessionDoc.exists ? sessionDoc.data() || {} : {};
  const storedSessionUid = String(sessionData.uid || "").trim();
  const storedSessionId = String(sessionData.sessionId || "").trim();
  if (
    !sessionDoc.exists ||
    !isSiteSessionActive(sessionData) ||
    storedSessionUid !== decodedUser.uid ||
    storedSessionId !== sessionHash
  ) {
    const error = new Error("account-session-invalid") as BackendError;
    error.statusCode = 401;
    error.revokedReason = String(sessionData.revokedReason || "");
    throw error;
  }

  const lastSeenAtMs = sessionTimestampToMillis(sessionData.lastSeenAt || sessionData.createdAt);
  if (!lastSeenAtMs || Date.now() - lastSeenAtMs > SITE_SESSION_TOUCH_COOLDOWN_MS) {
    await saveSiteSession(decodedUser.uid, sessionHash, req, { create: false });
  }
  return Object.assign(decodedUser, { siteSessionId: sessionHash }) as DecodedSiteUser;
}

export async function getOptionalSiteSessionUser(
  req: NextApiRequest,
  options: { checkRevoked?: boolean } = {},
): Promise<DecodedSiteUser | null> {
  try {
    return await getSiteSessionUser(req, options);
  } catch {
    return null;
  }
}

export async function clearCurrentSiteSession(
  req: NextApiRequest,
  res: NextApiResponse,
): Promise<void> {
  const sessionHash = getCurrentSiteSessionHash(req);
  const decodedUser = await getOptionalSiteSessionUser(req, { checkRevoked: false });
  if (decodedUser?.uid && sessionHash) {
    await revokeUserSiteSession(decodedUser.uid, sessionHash, "signed_out").catch(() => undefined);
  }
  clearSiteSessionCookie(res);
}

export async function createLoginChallenge(
  uid: string,
  res: NextApiResponse,
  details: LoginChallengeDetails = {},
) {
  const db = admin.firestore();
  const challengeRef = db.collection("loginChallenges").doc();
  const challengeId = challengeRef.id;
  const token = createRandomToken();
  const salt = db.collection("_").doc().id;

  await challengeRef.set({
    uid,
    challengeHash: getLoginChallengeHash(uid, challengeId, token, salt),
    salt,
    email: details.email || "",
    authMethod: String(details.authMethod || "").slice(0, 40),
    twoFactor: details.twoFactor || {},
    consumedAt: null,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    expiresAt: admin.firestore.Timestamp.fromDate(
      new Date(Date.now() + LOGIN_CHALLENGE_EXPIRES_MS),
    ),
  });

  setCookie(
    res,
    LOGIN_CHALLENGE_COOKIE_NAME,
    `${challengeId}.${token}`,
    Math.floor(LOGIN_CHALLENGE_EXPIRES_MS / 1000),
  );
  return { challengeId };
}

export async function getLoginChallenge(req: NextApiRequest): Promise<LoginChallenge> {
  const cookieValue = getCookie(req, LOGIN_CHALLENGE_COOKIE_NAME);
  if (!cookieValue || !cookieValue.includes(".")) {
    const error = new Error("Please log in again.") as BackendError;
    error.statusCode = 401;
    throw error;
  }

  const parts = cookieValue.split(".");
  const challengeId = parts[0];
  const token = parts.slice(1).join(".");
  if (!/^[A-Za-z0-9_-]{6,160}$/.test(challengeId)) {
    const error = new Error("Please log in again.") as BackendError;
    error.statusCode = 401;
    throw error;
  }

  const challengeRef = admin.firestore().collection("loginChallenges").doc(challengeId);
  const challengeDoc = await challengeRef.get();
  if (!challengeDoc.exists) {
    const error = new Error("Please log in again.") as BackendError;
    error.statusCode = 401;
    throw error;
  }
  const data = challengeDoc.data() || {};
  if (data.consumedAt) {
    const error = new Error("Please log in again.") as BackendError;
    error.statusCode = 401;
    throw error;
  }
  if (isExpired(data.expiresAt)) {
    await challengeRef.delete().catch(() => undefined);
    const error = new Error("Authenticator login expired. Please log in again.") as BackendError;
    error.statusCode = 401;
    throw error;
  }

  const submittedHash = getLoginChallengeHash(
    data.uid,
    challengeId,
    token,
    data.salt || "",
  );
  const savedBuffer = Buffer.from(String(data.challengeHash || ""), "hex");
  const submittedBuffer = Buffer.from(submittedHash, "hex");
  if (
    savedBuffer.length !== submittedBuffer.length ||
    !timingSafeEqual(savedBuffer, submittedBuffer)
  ) {
    const error = new Error("Please log in again.") as BackendError;
    error.statusCode = 401;
    throw error;
  }

  return {
    challengeId,
    ref: challengeRef,
    uid: String(data.uid || ""),
    email: String(data.email || ""),
    authMethod: String(data.authMethod || ""),
    twoFactor: asRecord(data.twoFactor),
  };
}

export async function consumeLoginChallenge(challenge: LoginChallenge): Promise<LoginChallenge> {
  if (!challenge?.ref || !challenge.uid) {
    const error = new Error("Please log in again.") as BackendError;
    error.statusCode = 401;
    throw error;
  }
  const db = admin.firestore();
  await db.runTransaction(async (transaction) => {
    const challengeDoc = await transaction.get(challenge.ref);
    if (!challengeDoc.exists) {
      const error = new Error("Please log in again.") as BackendError;
      error.statusCode = 401;
      throw error;
    }
    const data = challengeDoc.data() || {};
    if (
      data.consumedAt ||
      isExpired(data.expiresAt) ||
      String(data.uid || "") !== challenge.uid
    ) {
      const error = new Error("Please log in again.") as BackendError;
      error.statusCode = 401;
      throw error;
    }
    transaction.update(challenge.ref, {
      consumedAt: admin.firestore.FieldValue.serverTimestamp(),
      consumedReason: "authenticated",
    });
  });
  return challenge;
}

export async function clearLoginChallenge(
  req: NextApiRequest,
  res: NextApiResponse,
): Promise<void> {
  const cookieValue = getCookie(req, LOGIN_CHALLENGE_COOKIE_NAME);
  clearCookie(res, LOGIN_CHALLENGE_COOKIE_NAME);
  if (!cookieValue || !cookieValue.includes(".")) return;
  const challengeId = cookieValue.split(".")[0];
  if (!/^[A-Za-z0-9_-]{6,160}$/.test(challengeId)) return;
  await admin
    .firestore()
    .collection("loginChallenges")
    .doc(challengeId)
    .delete()
    .catch(() => undefined);
}

export async function getAuthenticatorSecret(uid: unknown): Promise<string> {
  const safeUid = String(uid || "").trim();
  if (!safeUid) return "";
  const db = admin.firestore();
  const secretRef = db.collection("twoFactorSecrets").doc(safeUid);
  const secretDoc = await secretRef.get();
  const encryptionContext = `authenticator-account:${safeUid}`;

  if (secretDoc.exists) {
    const data = secretDoc.data() || {};
    if (data.appSecretEncrypted) {
      return decryptTotpSecret(data.appSecretEncrypted, encryptionContext);
    }
    const legacySecret = String(data.appSecret || "").trim();
    if (legacySecret) {
      await secretRef.set(
        {
          appSecretEncrypted: encryptTotpSecret(legacySecret, encryptionContext),
          appSecret: admin.firestore.FieldValue.delete(),
          encryptionUpdatedAt: admin.firestore.FieldValue.serverTimestamp(),
        },
        { merge: true },
      );
      return legacySecret;
    }
  }

  const userRef = db.collection("users").doc(safeUid);
  const userDoc = await userRef.get();
  const userData = userDoc.exists ? userDoc.data() || {} : {};
  const twoFactor = asRecord(userData.twoFactor);
  const legacyUserSecret = String(twoFactor.appSecret || "").trim();
  if (!legacyUserSecret) return "";

  await Promise.all([
    secretRef.set(
      {
        appSecretEncrypted: encryptTotpSecret(legacyUserSecret, encryptionContext),
        appSecret: admin.firestore.FieldValue.delete(),
        encryptionUpdatedAt: admin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true },
    ),
    userRef
      .update({ "twoFactor.appSecret": admin.firestore.FieldValue.delete() })
      .catch(() => undefined),
  ]);
  return legacyUserSecret;
}

function getSecurityPanelAccessDocumentId(decodedUser: DecodedSiteUser): string {
  const siteSessionId = String(decodedUser.siteSessionId || "");
  return siteSessionId.replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 180) || "legacy-session";
}

function createSecurityPanelAccessError(message?: string): BackendError {
  const error = new Error(
    message || "Enter your authenticator code to open the Security panel.",
  ) as BackendError;
  error.statusCode = 403;
  return error;
}

export async function issueSecurityPanelAccess(decodedUser: DecodedSiteUser) {
  if (!decodedUser?.uid) throw createSecurityPanelAccessError("Please log in again.");
  const token = createRandomToken();
  const siteSessionId = String(decodedUser.siteSessionId || "");
  const expiresAt = new Date(Date.now() + SECURITY_PANEL_ACCESS_EXPIRES_MS);
  const accessRef = admin
    .firestore()
    .collection("users")
    .doc(decodedUser.uid)
    .collection("securityPanelAccess")
    .doc(getSecurityPanelAccessDocumentId(decodedUser));
  await accessRef.set({
    tokenHash: getSecurityPanelAccessHash(decodedUser.uid, siteSessionId, token),
    siteSessionId,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    expiresAt: admin.firestore.Timestamp.fromDate(expiresAt),
  });
  return { token, expiresAt: expiresAt.toISOString() };
}

export async function requireSecurityPanelAccess(
  req: NextApiRequest,
  decodedUser: DecodedSiteUser,
): Promise<true> {
  if (!decodedUser?.uid) throw createSecurityPanelAccessError("Please log in again.");
  const userRef = admin.firestore().collection("users").doc(decodedUser.uid);
  const userDoc = await userRef.get();
  const userData = userDoc.exists ? userDoc.data() || {} : {};
  const twoFactor = asRecord(userData.twoFactor);
  if (!twoFactor.appEnabled) return true;

  const token = getRequestHeader(req, "x-auc-security-access").trim();
  if (!token) throw createSecurityPanelAccessError();

  const siteSessionId = String(decodedUser.siteSessionId || "");
  const accessRef = userRef
    .collection("securityPanelAccess")
    .doc(getSecurityPanelAccessDocumentId(decodedUser));
  const accessDoc = await accessRef.get();
  if (!accessDoc.exists) throw createSecurityPanelAccessError();
  const accessData = accessDoc.data() || {};
  if (isExpired(accessData.expiresAt)) {
    await accessRef.delete().catch(() => undefined);
    throw createSecurityPanelAccessError(
      "Security access expired. Enter a new authenticator code.",
    );
  }
  if (String(accessData.siteSessionId || "") !== siteSessionId) {
    throw createSecurityPanelAccessError();
  }

  const savedHash = String(accessData.tokenHash || "");
  const submittedHash = getSecurityPanelAccessHash(decodedUser.uid, siteSessionId, token);
  const savedBuffer = Buffer.from(savedHash, "hex");
  const submittedBuffer = Buffer.from(submittedHash, "hex");
  if (
    !savedHash ||
    savedBuffer.length !== submittedBuffer.length ||
    !timingSafeEqual(savedBuffer, submittedBuffer)
  ) {
    throw createSecurityPanelAccessError();
  }
  return true;
}
