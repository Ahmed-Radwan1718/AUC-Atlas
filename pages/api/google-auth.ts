import type { NextApiHandler, NextApiRequest, NextApiResponse } from "next";
import type { DecodedIdToken, UserRecord } from "firebase-admin/auth";
import type { DocumentReference } from "firebase-admin/firestore";
import { admin } from "@/server/backend/firebase";
import {
  createLoginChallenge,
  createSiteSessionForUid,
  ensureAllowedAucEmail,
  getOptionalSiteSessionUser,
  getSiteSessionUser,
} from "@/server/backend/security";
import { consumeSecurityRateLimit, getRequestIp } from "@/server/backend/security-rate-limits";
import { asBackendError, asRecord, type BackendError, type UnknownRecord } from "@/server/backend/types";

const WINDOW_MS = 15 * 60 * 1000;
const MAX_IP_ATTEMPTS = 100;

function cleanString(value: unknown, maxLength?: number): string {
  const cleaned = String(value || "").trim();
  return maxLength ? cleaned.slice(0, maxLength) : cleaned;
}
function cleanEmail(value: unknown): string {
  return cleanString(value, 160).toLowerCase();
}
function createHttpError(message: string, statusCode: number): BackendError {
  const error = new Error(message) as BackendError;
  error.statusCode = statusCode;
  return error;
}
function getGoogleProvider(userRecord: UserRecord) {
  return userRecord.providerData.find((provider) => provider?.providerId === "google.com") || null;
}
function getGoogleConnection(userData: UnknownRecord) {
  const connection = asRecord(userData.googleConnection);
  return {
    providerUid: cleanString(connection.providerUid, 200),
    email: cleanEmail(connection.email),
  };
}
function isConfirmedGoogleConnection(userRecord: UserRecord, userData: UnknownRecord): boolean {
  const googleProvider = getGoogleProvider(userRecord);
  const connection = getGoogleConnection(userData);
  return Boolean(
    googleProvider &&
      connection.providerUid &&
      connection.providerUid === cleanString(googleProvider.uid, 200),
  );
}
function getAccountEmail(
  decodedUser: { email?: unknown },
  userRecord: UserRecord,
  userData: UnknownRecord,
): string {
  const accountEmail = cleanEmail(userData.email || decodedUser.email || userRecord.email);
  ensureAllowedAucEmail(accountEmail, "continue with Google");
  return accountEmail;
}
function getFirebaseClientConfig(): Record<string, string> {
  const projectId = cleanString(process.env.FIREBASE_PROJECT_ID);
  const apiKey = cleanString(process.env.FIREBASE_WEB_API_KEY);
  const authDomain = cleanString(process.env.FIREBASE_AUTH_DOMAIN) || (projectId ? `${projectId}.firebaseapp.com` : "");
  if (!projectId || !apiKey || !authDomain) {
    throw createHttpError("Firebase client configuration is not complete.", 500);
  }
  const firebase: Record<string, string> = { apiKey, authDomain, projectId };
  const optionalValues: Record<string, string> = {
    appId: cleanString(process.env.FIREBASE_APP_ID),
    storageBucket: cleanString(process.env.FIREBASE_STORAGE_BUCKET),
    messagingSenderId: cleanString(process.env.FIREBASE_MESSAGING_SENDER_ID),
    measurementId: cleanString(process.env.FIREBASE_MEASUREMENT_ID),
  };
  for (const [key, value] of Object.entries(optionalValues)) if (value) firebase[key] = value;
  return firebase;
}

type AccountContext = {
  decodedUser: DecodedIdToken & { siteSessionId: string };
  userRecord: UserRecord;
  userRef: DocumentReference;
  userData: UnknownRecord;
};
async function getOptionalAccountContext(req: NextApiRequest): Promise<AccountContext | null> {
  let decodedUser;
  try {
    decodedUser = await getOptionalSiteSessionUser(req, { checkRevoked: true });
  } catch (unknownError) {
    const error = asBackendError(unknownError);
    if (error.statusCode === 401 || error.statusCode === 403) return null;
    throw error;
  }
  if (!decodedUser?.uid) return null;
  const userRef = admin.firestore().collection("users").doc(decodedUser.uid);
  const [userRecord, userDoc] = await Promise.all([
    admin.auth().getUser(decodedUser.uid),
    userRef.get(),
  ]);
  if (!userDoc.exists) return null;
  return { decodedUser, userRecord, userRef, userData: userDoc.data() || {} };
}

async function handleGet(req: NextApiRequest, res: NextApiResponse) {
  const context = await getOptionalAccountContext(req);
  let customToken = "";
  let connected = false;
  let googleEmail = "";
  if (context) {
    customToken = await admin.auth().createCustomToken(context.decodedUser.uid);
    connected = isConfirmedGoogleConnection(context.userRecord, context.userData);
    if (connected) googleEmail = cleanEmail(getGoogleProvider(context.userRecord)?.email);
  }
  res.setHeader("Cache-Control", "private, no-store");
  return res.status(200).json({
    success: true,
    firebase: getFirebaseClientConfig(),
    customToken,
    connected,
    googleEmail,
  });
}

async function handleConnect(req: NextApiRequest, res: NextApiResponse) {
  const sessionUser = await getSiteSessionUser(req, { checkRevoked: true });
  const idToken = cleanString(asRecord(req.body).idToken, 10000);
  if (!idToken) throw createHttpError("Could not verify the Google connection.", 400);
  const linkedToken = await admin.auth().verifyIdToken(idToken, true);
  if (!linkedToken || linkedToken.uid !== sessionUser.uid) {
    throw createHttpError(
      "The Google account connection did not match your signed-in AUC Atlas account.",
      403,
    );
  }
  const userRef = admin.firestore().collection("users").doc(sessionUser.uid);
  const [userRecord, userDoc] = await Promise.all([
    admin.auth().getUser(sessionUser.uid),
    userRef.get(),
  ]);
  if (!userDoc.exists) {
    throw createHttpError("Only an existing AUC Atlas account can connect Google.", 403);
  }
  const userData = userDoc.data() || {};
  const googleProvider = getGoogleProvider(userRecord);
  if (!googleProvider) throw createHttpError("Please finish connecting your Google account first.", 400);
  const accountEmail = getAccountEmail(sessionUser, userRecord, userData);
  await admin.auth().updateUser(sessionUser.uid, { email: accountEmail, emailVerified: true });
  await userRef.set(
    {
      googleConnection: {
        providerUid: cleanString(googleProvider.uid, 200),
        email: cleanEmail(googleProvider.email),
        connectedAt: admin.firestore.FieldValue.serverTimestamp(),
      },
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    },
    { merge: true },
  );
  return res.status(200).json({
    success: true,
    connected: true,
    googleEmail: cleanEmail(googleProvider.email),
  });
}

async function handleLogin(req: NextApiRequest, res: NextApiResponse) {
  await consumeSecurityRateLimit({
    scope: "google-login-ip",
    identifier: getRequestIp(req),
    maxAttempts: MAX_IP_ATTEMPTS,
    windowMs: WINDOW_MS,
    message: "Too many Google login attempts from this connection. Please try again later.",
  });
  const idToken = cleanString(asRecord(req.body).idToken, 10000);
  if (!idToken) throw createHttpError("Could not verify your Google account.", 400);
  const decodedToken = await admin.auth().verifyIdToken(idToken, true);
  const signInProvider = cleanString(decodedToken.firebase?.sign_in_provider, 80);
  if (!decodedToken.uid || signInProvider !== "google.com") {
    throw createHttpError("Please sign in using Google.", 401);
  }
  const userRef = admin.firestore().collection("users").doc(decodedToken.uid);
  const userDoc = await userRef.get();
  if (!userDoc.exists) {
    await admin.auth().deleteUser(decodedToken.uid).catch(() => undefined);
    throw createHttpError(
      "This Google account is not connected to an existing AUC Atlas account. Log in with your AUC email first, then connect Google from My Account.",
      403,
    );
  }
  const userData = userDoc.data() || {};
  const userRecord = await admin.auth().getUser(decodedToken.uid);
  const googleProvider = getGoogleProvider(userRecord);
  if (!googleProvider || !isConfirmedGoogleConnection(userRecord, userData)) {
    throw createHttpError(
      "This Google account is not connected to an existing AUC Atlas account. Log in with your AUC email first, then connect Google from My Account.",
      403,
    );
  }
  const accountEmail = getAccountEmail(decodedToken, userRecord, userData);
  const updatedUserRecord = await admin.auth().updateUser(decodedToken.uid, {
    email: accountEmail,
    emailVerified: true,
  });
  const twoFactor = asRecord(userData.twoFactor);
  const appEnabled = Boolean(twoFactor.appEnabled);
  const emailEnabled = Boolean(twoFactor.emailEnabled);
  if (appEnabled || emailEnabled) {
    await createLoginChallenge(decodedToken.uid, res, {
      email: accountEmail,
      authMethod: "google",
      twoFactor: { appEnabled, emailEnabled },
    });
    return res.status(200).json({
      success: true,
      requiresTwoFactor: true,
      method: appEnabled ? "app" : "email",
      emailRecoveryAvailable: emailEnabled,
    });
  }
  await createSiteSessionForUid(decodedToken.uid, res, req);
  return res.status(200).json({
    success: true,
    requiresTwoFactor: false,
    user: {
      uid: decodedToken.uid,
      email: accountEmail,
      emailVerified: true,
      displayName: String(userData.fullName || updatedUserRecord.displayName || ""),
      fullName: String(userData.fullName || updatedUserRecord.displayName || ""),
      photoURL: String(userData.photoURL || updatedUserRecord.photoURL || ""),
    },
  });
}

const handler: NextApiHandler = async (req, res) => {
  try {
    if (req.method === "GET") return handleGet(req, res);
    if (req.method === "POST") {
      const action = cleanString(asRecord(req.body).action, 30).toLowerCase();
      if (action === "connect") return handleConnect(req, res);
      if (action === "login") return handleLogin(req, res);
      return res.status(400).json({ error: "Invalid Google authentication action." });
    }
    return res.status(405).json({ error: "Method not allowed" });
  } catch (unknownError) {
    const error = asBackendError(unknownError, "Could not process Google authentication.");
    if (error.retryAfterSeconds) res.setHeader("Retry-After", String(error.retryAfterSeconds));
    const authenticationError = String(error.code || "").startsWith("auth/");
    return res.status(error.statusCode || (authenticationError ? 401 : 500)).json({
      error: error.message || "Could not process Google authentication.",
    });
  }
};

export default handler;
