import type { LegacyRequest, LegacyReply } from "../legacyTypes";

const admin = require("../_lib/firebaseAdmin").default;

const {
  signInWithCustomToken,
  ensureAllowedAucEmail
} = require("../_lib/securityHelpers");
const {
  getRequestIp,
  consumeSecurityRateLimit
} = require("../_lib/securityRateLimits");
const { ensureAucIdCanCreateAccount } = require("../_lib/aucIdClaims");

const SIGNUP_RATE_LIMIT_WINDOW_MS =
  30 * 60 * 1000;
const SIGNUP_MAX_EMAIL_ATTEMPTS = 5;
const SIGNUP_MAX_IP_ATTEMPTS = 20;

function cleanString(value: any, maxLength: any) {
  return String(value || "").trim().slice(0, maxLength);
}

function cleanEmail(value: any) {
  return cleanString(value, 160).toLowerCase();
}

function cleanPassword(value: any) {
  return String(value || "");
}

function cleanAucId(value: any) {
  return String(value || "").replace(/\D/g, "").slice(0, 9);
}

function hasValidAucIdFormat(value: any) {
  return /^900\d{6}$/.test(cleanAucId(value));
}

function createInvalidAucIdError() {
  return Object.assign(new Error("AUC ID number must start with 900 and be 9 digits total."), { statusCode: 400 });
}

async function consumeSignupRateLimits(
  req: any,
  email: any
) {
  await consumeSecurityRateLimit({
    scope: "signup-ip",
    identifier: getRequestIp(req),
    maxAttempts:
      SIGNUP_MAX_IP_ATTEMPTS,
    windowMs:
      SIGNUP_RATE_LIMIT_WINDOW_MS,
    message:
      "Too many signup attempts from this connection. Please try again later."
  });

  await consumeSecurityRateLimit({
    scope: "signup-email",
    identifier: email,
    maxAttempts:
      SIGNUP_MAX_EMAIL_ATTEMPTS,
    windowMs:
      SIGNUP_RATE_LIMIT_WINDOW_MS,
    message:
      "Too many signup attempts for this email. Please try again later."
  });
}

async function ensureEmailCanCreateAccount(email: any) {
  try {
    await admin.auth().getUserByEmail(email);

    const error = new Error("This email is already used by another account.");
    error.statusCode = 409;
    throw error;
  } catch (error: any) {
    if (error.code === "auth/user-not-found") {
      return;
    }

    throw error;
  }
}

function getFirebaseWebApiKey() {
  const apiKey = String(process.env.FIREBASE_WEB_API_KEY || "").trim();

  if (!apiKey) {
    const error = new Error("Firebase signup email verification is not configured.");
    error.statusCode = 500;
    throw error;
  }

  return apiKey;
}

async function sendFirebaseSignupVerificationEmail(uid: any) {
  const apiKey = getFirebaseWebApiKey();
  const customToken = await admin.auth().createCustomToken(uid);
  const signInData = await signInWithCustomToken(customToken);
  const idToken = signInData && signInData.idToken ? signInData.idToken : "";

  if (!idToken) {
    const error = new Error("Could not create email verification session.");
    error.statusCode = 500;
    throw error;
  }

  const response = await fetch(
    "https://identitytoolkit.googleapis.com/v1/accounts:sendOobCode?key=" + encodeURIComponent(apiKey),
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        requestType: "VERIFY_EMAIL",
        idToken
      })
    }
  );

  const data = await response.json().catch(function () {
    return {};
  });

  if (!response.ok) {
    const error = new Error("Could not send signup verification email.");
    error.statusCode = response.status || 500;
    error.firebaseErrorCode = data && data.error && data.error.message ? data.error.message : "";
    throw error;
  }
}

export default async function handler(req: LegacyRequest, res: LegacyReply) {
  try {
    if (req.method !== "POST") {
      return res.status(405).json({ error: "Method not allowed" });
    }

    const fullName = cleanString((req.body || {}).fullName, 80);
    const aucId = cleanAucId((req.body || {}).aucId);
    const email = cleanEmail((req.body || {}).email);
    const password = cleanPassword((req.body || {}).password);
    const confirmPassword = cleanPassword((req.body || {}).confirmPassword);
    const consentAccepted = (req.body || {}).consentAccepted === true;

    if (!fullName || !aucId || !email || !password || !confirmPassword) {
      return res.status(400).json({ error: "Please complete all required fields." });
    }

    if (!consentAccepted) {
      return res.status(400).json({
        error: "You must agree to the Terms of Service and confirm that you have read the Privacy Policy before creating an account."
      });
    }

    ensureAllowedAucEmail(email, "create an account");

    if (!hasValidAucIdFormat(aucId)) {
      throw createInvalidAucIdError();
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ error: "Passwords do not match." });
    }

    if (
      password.length < 10 ||
      password.length > 48 ||
      !/[A-Z]/.test(password) ||
      !/[a-z]/.test(password) ||
      !/[0-9]/.test(password) ||
      !/[^A-Za-z0-9\s]/.test(password)
    ) {
      return res.status(400).json({ error: "Password must be 10 to 48 characters and include uppercase, lowercase, special, and numeric characters." });
    }

    await consumeSignupRateLimits(
      req,
      email
    );
    await ensureAucIdCanCreateAccount(aucId);
    await ensureEmailCanCreateAccount(email);

    const userRecord = await admin.auth().createUser({
      email,
      password,
      displayName: fullName,
      emailVerified: false
    });

    const userRef = admin.firestore().collection("users").doc(userRecord.uid);
    try {
      // An unverified registration does not reserve or block the student ID.
      // All verified login methods claim it atomically on their first session.
      await userRef.set({
        fullName,
        aucId,
        aucIdLookupKey: aucId,
        aucIdClaimStatus: "pending_verification",
        email,
        authProvider: "password",
        emailVerified: false,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });

      await sendFirebaseSignupVerificationEmail(userRecord.uid);
    } catch (error: any) {
      await userRef.delete().catch(function () {});
      await admin.auth().deleteUser(userRecord.uid).catch(function () {});
      throw error;
    }

    return res.status(200).json({
      success: true,
      requiresEmailVerification: true,
      message: "Account created. Verify your AUC email before logging in.",
      user: {
        uid: userRecord.uid,
        email,
        aucId,
        displayName: fullName,
        emailVerified: false
      }
    });
  } catch (error: any) {
    if (
      error.code ===
      "auth/email-already-exists"
    ) {
      return res.status(409).json({
        error:
          "This email is already used by another account."
      });
    }

    if (error.retryAfterSeconds) {
      res.setHeader(
        "Retry-After",
        String(error.retryAfterSeconds)
      );
    }

    return res.status(error.statusCode || 500).json({
      error: error.message || "Could not create account."
    });
  }
};
