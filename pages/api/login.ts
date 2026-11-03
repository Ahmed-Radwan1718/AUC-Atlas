import type { NextApiHandler } from "next";
import { admin } from "@/server/backend/firebase";
import {
  createLoginChallenge,
  createSiteSessionFromIdToken,
  ensureAllowedAucEmail,
  signInWithPassword,
} from "@/server/backend/security";
import {
  clearSecurityRateLimit,
  consumeSecurityRateLimit,
  getRequestIp,
} from "@/server/backend/security-rate-limits";
import { asBackendError, asRecord } from "@/server/backend/types";

const LOGIN_RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000;
const LOGIN_MAX_ACCOUNT_ATTEMPTS = 8;
const LOGIN_MAX_IP_ATTEMPTS = 100;

const handler: NextApiHandler = async (req, res) => {
  try {
    if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

    const body = asRecord(req.body);
    const email = String(body.email || "").trim().toLowerCase();
    const password = String(body.password || "");
    if (!email || !password) {
      return res.status(400).json({ error: "Please enter your email and password." });
    }

    ensureAllowedAucEmail(email, "log in");
    await consumeSecurityRateLimit({
      scope: "login-ip",
      identifier: getRequestIp(req),
      maxAttempts: LOGIN_MAX_IP_ATTEMPTS,
      windowMs: LOGIN_RATE_LIMIT_WINDOW_MS,
      message: "Too many login attempts from this connection. Please try again later.",
    });
    await consumeSecurityRateLimit({
      scope: "login-account",
      identifier: email,
      maxAttempts: LOGIN_MAX_ACCOUNT_ATTEMPTS,
      windowMs: LOGIN_RATE_LIMIT_WINDOW_MS,
      message: "Too many login attempts for this account. Please try again later.",
    });

    let loginResult;
    try {
      loginResult = await signInWithPassword(email, password);
    } catch {
      return res.status(401).json({ error: "Incorrect email or password." });
    }

    await clearSecurityRateLimit("login-account", email);
    const uid = String(loginResult.localId || loginResult.uid || "");
    const idToken = String(loginResult.idToken || "");
    if (!uid || !idToken) {
      return res.status(500).json({ error: "Could not start login session." });
    }

    const userRecord = await admin.auth().getUser(uid);
    if (!userRecord.emailVerified) {
      return res.status(403).json({
        error:
          "Please verify your AUC email address before logging in. You can also use an email sign-in code to verify your address.",
      });
    }

    const userDoc = await admin.firestore().collection("users").doc(uid).get();
    const userData = userDoc.exists ? userDoc.data() || {} : {};
    const twoFactor = asRecord(userData.twoFactor);
    const fullName = String(userData.fullName || userRecord.displayName || "");
    const emailAddress = String(userRecord.email || userData.email || email);
    const photoURL = String(userData.photoURL || userRecord.photoURL || "");
    const appEnabled = Boolean(twoFactor.appEnabled);
    const emailEnabled = Boolean(twoFactor.emailEnabled);

    if (appEnabled || emailEnabled) {
      await createLoginChallenge(uid, res, {
        email: emailAddress,
        authMethod: "password",
        twoFactor: { appEnabled, emailEnabled },
      });
      return res.status(200).json({
        success: true,
        requiresTwoFactor: true,
        method: appEnabled ? "app" : "email",
        emailRecoveryAvailable: emailEnabled,
      });
    }

    await createSiteSessionFromIdToken(idToken, res, req);
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
  } catch (unknownError) {
    const error = asBackendError(unknownError, "Could not log in.");
    if (error.retryAfterSeconds) res.setHeader("Retry-After", String(error.retryAfterSeconds));
    return res.status(error.statusCode || 500).json({ error: error.message || "Could not log in." });
  }
};

export default handler;
