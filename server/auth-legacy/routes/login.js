const admin = require("../_lib/firebaseAdmin");

const {
  signInWithPassword,
  createSiteSessionFromIdToken,
  createLoginChallenge,
  ensureAllowedAucEmail
} = require("../_lib/securityHelpers");
const {
  getRequestIp,
  consumeSecurityRateLimit,
  clearSecurityRateLimit
} = require("../_lib/securityRateLimits");

const LOGIN_RATE_LIMIT_WINDOW_MS =
  15 * 60 * 1000;
const LOGIN_MAX_ACCOUNT_ATTEMPTS = 8;
const LOGIN_MAX_IP_ATTEMPTS = 100;

function cleanEmail(value) {
  return String(value || "").trim().toLowerCase();
}

function cleanPassword(value) {
  return String(value || "");
}

module.exports = async function handler(req, res) {
  try {
    if (req.method !== "POST") {
      return res.status(405).json({ error: "Method not allowed" });
    }

    const email = cleanEmail((req.body || {}).email);
    const password = cleanPassword((req.body || {}).password);

    if (!email || !password) {
      return res.status(400).json({ error: "Please enter your email and password." });
    }

    ensureAllowedAucEmail(email, "log in");

    await consumeSecurityRateLimit({
      scope: "login-ip",
      identifier: getRequestIp(req),
      maxAttempts: LOGIN_MAX_IP_ATTEMPTS,
      windowMs: LOGIN_RATE_LIMIT_WINDOW_MS,
      message:
        "Too many login attempts from this connection. Please try again later."
    });

    await consumeSecurityRateLimit({
      scope: "login-account",
      identifier: email,
      maxAttempts:
        LOGIN_MAX_ACCOUNT_ATTEMPTS,
      windowMs:
        LOGIN_RATE_LIMIT_WINDOW_MS,
      message:
        "Too many login attempts for this account. Please try again later."
    });

    let loginResult;

    try {
      loginResult = await signInWithPassword(
        email,
        password
      );
    } catch (error) {
      return res.status(401).json({
        error:
          "Incorrect email or password."
      });
    }

    await clearSecurityRateLimit(
      "login-account",
      email
    );

    const uid =
      loginResult.localId ||
      loginResult.uid;

    if (!uid || !loginResult.idToken) {
      return res.status(500).json({ error: "Could not start login session." });
    }

    const userRecord = await admin.auth().getUser(uid);

    if (!userRecord.emailVerified) {
      return res.status(403).json({
        error: "Please verify your AUC email address before logging in. You can also use an email sign-in code to verify your address."
      });
    }

    const userDoc = await admin.firestore().collection("users").doc(uid).get();
    const userData = userDoc.exists ? userDoc.data() || {} : {};
    const twoFactor = userData.twoFactor && typeof userData.twoFactor === "object" ? userData.twoFactor : {};

    const fullName = userData.fullName || userRecord.displayName || "";
    const emailAddress = userRecord.email || userData.email || email;
    const photoURL = userData.photoURL || userRecord.photoURL || "";
    const appEnabled = Boolean(twoFactor.appEnabled);
    const emailEnabled = Boolean(twoFactor.emailEnabled);

    if (appEnabled || emailEnabled) {
      await createLoginChallenge(uid, res, {
        email: emailAddress,
        authMethod: "password",
        twoFactor: {
          appEnabled,
          emailEnabled
        }
      });

      return res.status(200).json({
        success: true,
        requiresTwoFactor: true,
        method: appEnabled ? "app" : "email",
        emailRecoveryAvailable: emailEnabled
      });
    }

    await createSiteSessionFromIdToken(loginResult.idToken, res, req);

    return res.status(200).json({
      success: true,
      requiresTwoFactor: false,
      user: {
        uid,
        email: emailAddress,
        emailVerified: Boolean(userRecord.emailVerified),
        displayName: fullName,
        fullName,
        photoURL
      }
    });
  } catch (error) {
    if (error.retryAfterSeconds) {
      res.setHeader(
        "Retry-After",
        String(error.retryAfterSeconds)
      );
    }

    return res.status(error.statusCode || 500).json({
      error: error.message || "Could not log in."
    });
  }
};
