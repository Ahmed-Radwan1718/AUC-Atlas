import "server-only";

import { createHmac } from "node:crypto";
import type { DecodedIdToken } from "firebase-admin/auth";
import { ApiError, getCookie, getTimestampMillis } from "@/lib/server/backend-utils";
import {
  FieldValue,
  getAdminAuth,
  getAdminFirestore,
} from "@/lib/server/firebase-admin";

const IS_PRODUCTION =
  process.env.NODE_ENV === "production" || process.env.VERCEL_ENV === "production";
const PROD_SESSION_COOKIE = "__Host-auc_atlas_session";
const PROD_SESSION_ID_COOKIE = "__Host-auc_atlas_session_id";
const DEV_SESSION_COOKIE = "auc_atlas_session";
const DEV_SESSION_ID_COOKIE = "auc_atlas_session_id";
const SITE_SESSION_TOUCH_COOLDOWN_MS = 5 * 60 * 1000;
const ALLOWED_AUC_EMAIL_DOMAIN = "aucegypt.edu";

type SiteSessionUser = DecodedIdToken & {
  siteSessionId: string;
};

type SessionCookiePair = {
  sessionCookie: string;
  sessionId: string;
};

function getSecuritySecret(): string {
  return String(
    process.env.SECURITY_CODE_SECRET ||
      process.env.FIREBASE_PRIVATE_KEY ||
      process.env.FIREBASE_CLIENT_EMAIL ||
      "auc-atlas-security-secret",
  );
}

function cleanAuthEmail(value: unknown): string {
  return String(value || "").trim().toLowerCase();
}

function isAllowedAucEmail(email: string): boolean {
  const normalizedEmail = cleanAuthEmail(email);
  const atIndex = normalizedEmail.indexOf("@");

  return (
    atIndex > 0 &&
    atIndex === normalizedEmail.lastIndexOf("@") &&
    normalizedEmail.slice(atIndex + 1) === ALLOWED_AUC_EMAIL_DOMAIN
  );
}

function getSiteSessionHash(sessionId: string): string {
  return createHmac("sha256", getSecuritySecret())
    .update(`site-session:${sessionId}`)
    .digest("hex");
}

function readSessionCookies(request: Request): SessionCookiePair {
  const candidates = IS_PRODUCTION
    ? [
        [PROD_SESSION_COOKIE, PROD_SESSION_ID_COOKIE],
        [DEV_SESSION_COOKIE, DEV_SESSION_ID_COOKIE],
      ]
    : [
        [DEV_SESSION_COOKIE, DEV_SESSION_ID_COOKIE],
        [PROD_SESSION_COOKIE, PROD_SESSION_ID_COOKIE],
      ];

  let fallback: SessionCookiePair = { sessionCookie: "", sessionId: "" };

  for (const [sessionCookieName, sessionIdCookieName] of candidates) {
    const pair = {
      sessionCookie: getCookie(request, sessionCookieName),
      sessionId: getCookie(request, sessionIdCookieName),
    };

    if (pair.sessionCookie && pair.sessionId) return pair;
    if (!fallback.sessionCookie && pair.sessionCookie) fallback = pair;
  }

  return fallback;
}

function isSiteSessionActive(data: Record<string, unknown>): boolean {
  return Boolean(
    data && !data.revokedAt && getTimestampMillis(data.expiresAt) > Date.now(),
  );
}

function getBrowserVersion(match: RegExpMatchArray | null): string {
  return match?.[1] ? String(match[1]).split(".")[0] : "";
}

function getSessionBrowserDetails(userAgent: string) {
  let match = userAgent.match(/EdgA?\/([\d.]+)/) || userAgent.match(/EdgiOS\/([\d.]+)/);
  if (match) {
    return { key: "chrome", name: "Microsoft Edge", version: getBrowserVersion(match) };
  }

  match = userAgent.match(/OPR\/([\d.]+)/) || userAgent.match(/Opera\/([\d.]+)/);
  if (match) {
    return { key: "opera", name: "Opera", version: getBrowserVersion(match) };
  }

  match = userAgent.match(/CriOS\/([\d.]+)/) || userAgent.match(/Chrome\/([\d.]+)/);
  if (match) {
    return { key: "chrome", name: "Chrome", version: getBrowserVersion(match) };
  }

  match = userAgent.match(/FxiOS\/([\d.]+)/) || userAgent.match(/Firefox\/([\d.]+)/);
  if (match) {
    return { key: "firefox", name: "Firefox", version: getBrowserVersion(match) };
  }

  match = userAgent.match(/Version\/([\d.]+).*Safari\//);
  if (match || /Safari\//.test(userAgent)) {
    return { key: "safari", name: "Safari", version: getBrowserVersion(match) };
  }

  return { key: "chrome", name: "Browser", version: "" };
}

function getSessionPlatformLabel(userAgent: string): string {
  if (/iPad/.test(userAgent)) return "iPadOS";
  if (/iPhone|iPod/.test(userAgent)) return "iOS";
  if (/Android/.test(userAgent)) return "Android";
  if (/Windows NT/.test(userAgent)) return "Windows";
  if (/Mac OS X|Macintosh/.test(userAgent)) return "macOS";
  if (/Linux/.test(userAgent)) return "Linux";
  return "Device";
}

function getSessionDeviceType(userAgent: string): string {
  if (/iPad|Tablet/.test(userAgent)) return "Tablet";
  if (/Mobi|iPhone|iPod|Android/.test(userAgent)) return "Mobile";
  return "Desktop";
}

function getSessionDetailsFromRequest(request: Request) {
  const userAgent = String(request.headers.get("user-agent") || "").slice(0, 600);
  const forwardedFor = String(request.headers.get("x-forwarded-for") || "")
    .split(",")[0]
    .trim();
  const realIp = String(request.headers.get("x-real-ip") || "").trim();
  const ipAddress = String(forwardedFor || realIp || "").slice(0, 80);
  const browser = getSessionBrowserDetails(userAgent);
  const osName = getSessionPlatformLabel(userAgent);
  const deviceType = getSessionDeviceType(userAgent);

  return {
    userAgent,
    ipAddress,
    browserKey: browser.key,
    browserName: browser.name,
    browserVersion: browser.version,
    browserLabel: browser.name,
    osName,
    deviceType,
    deviceLabel: `${browser.name} on ${osName}`,
  };
}

async function saveSiteSession(uid: string, sessionHash: string, request: Request) {
  const sessionRef = getAdminFirestore()
    .collection("users")
    .doc(uid)
    .collection("sessions")
    .doc(sessionHash);

  await sessionRef.set(
    {
      ...getSessionDetailsFromRequest(request),
      uid,
      sessionId: sessionHash,
      lastSeenAt: FieldValue.serverTimestamp(),
    },
    { merge: true },
  );
}

async function getDecodedUserEmail(decodedUser: DecodedIdToken): Promise<string> {
  const tokenEmail = cleanAuthEmail(decodedUser.email);
  if (tokenEmail) return tokenEmail;

  if (decodedUser.uid) {
    const userRecord = await getAdminAuth().getUser(decodedUser.uid);
    return cleanAuthEmail(userRecord.email);
  }

  return "";
}

export async function getSiteSessionUser(
  request: Request,
  options: { checkRevoked?: boolean } = {},
): Promise<SiteSessionUser> {
  const { sessionCookie, sessionId } = readSessionCookies(request);

  if (!sessionCookie) {
    throw new ApiError("not-signed-in", 401);
  }

  if (!/^[a-f0-9]{64}$/i.test(sessionId)) {
    throw new ApiError("account-session-invalid", 401);
  }

  const sessionHash = getSiteSessionHash(sessionId);
  const fallbackSessionPrefix = "idtoken.";
  const usesFallbackIdToken = sessionCookie.startsWith(fallbackSessionPrefix);
  const cookieToken = usesFallbackIdToken
    ? sessionCookie.slice(fallbackSessionPrefix.length)
    : sessionCookie;
  const checkRevoked = options.checkRevoked !== false;
  const auth = getAdminAuth();
  const decodedUser = usesFallbackIdToken
    ? await auth.verifyIdToken(cookieToken, checkRevoked)
    : await auth.verifySessionCookie(cookieToken, checkRevoked);
  const decodedEmail = await getDecodedUserEmail(decodedUser);

  if (!isAllowedAucEmail(decodedEmail)) {
    throw new ApiError("Please use your AUC email address (@aucegypt.edu) to continue.", 403);
  }

  const userRecord = await auth.getUser(decodedUser.uid);
  const authoritativeEmail = cleanAuthEmail(userRecord.email || decodedUser.email);

  if (!userRecord.emailVerified || !isAllowedAucEmail(authoritativeEmail)) {
    const error = new ApiError(
      "Please verify your AUC email address before continuing.",
      403,
    );
    error.code = "email-verification-required";
    throw error;
  }

  const sessionRef = getAdminFirestore()
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
    throw new ApiError("account-session-invalid", 401);
  }

  const lastSeenAtMs = getTimestampMillis(sessionData.lastSeenAt || sessionData.createdAt);
  if (!lastSeenAtMs || Date.now() - lastSeenAtMs > SITE_SESSION_TOUCH_COOLDOWN_MS) {
    await saveSiteSession(decodedUser.uid, sessionHash, request);
  }

  return { ...decodedUser, siteSessionId: sessionHash };
}

export async function getOptionalSiteSessionUser(
  request: Request,
  options: { checkRevoked?: boolean } = {},
): Promise<SiteSessionUser | null> {
  try {
    return await getSiteSessionUser(request, options);
  } catch {
    return null;
  }
}
