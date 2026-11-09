const admin = require("../_lib/firebaseAdmin");
const { authenticator } = require("otplib");

const {
  getLoginChallenge,
  consumeLoginChallenge,
  clearLoginChallenge,
  consumeAuthenticatorAttempt,
  clearAuthenticatorAttempts,
  createSiteSessionForUid,
  getAuthenticatorSecret
} = require("../_lib/securityHelpers");

function cleanCode(value) {
  return String(value || "").trim().replace(/\D/g, "");
}

module.exports = async function handler(req, res) {
  try {
    if (req.method !== "POST") {
      return res.status(405).json({ error: "Method not allowed" });
    }

    const challenge = await getLoginChallenge(req);

    if (!challenge || !challenge.uid || !challenge.twoFactor || !challenge.twoFactor.appEnabled) {
      return res.status(401).json({ error: "Please log in again." });
    }

    const code = cleanCode((req.body || {}).code);

    if (!/^\d{6}$/.test(code)) {
      return res.status(400).json({ error: "Please enter your 6-digit authenticator code." });
    }

    const secret = await getAuthenticatorSecret(challenge.uid);

    if (!secret) {
      return res.status(400).json({ error: "Authenticator app is not enabled for this account." });
    }

    await consumeAuthenticatorAttempt(
      challenge.uid,
      "login"
    );

    authenticator.options = { window: 1 };

    if (!authenticator.check(code, secret)) {
      return res.status(401).json({
        error: "Invalid authenticator code."
      });
    }

    await consumeLoginChallenge(challenge);

    await clearAuthenticatorAttempts(
      challenge.uid,
      "login"
    );

    await createSiteSessionForUid(
      challenge.uid,
      res,
      req
    );

    await clearLoginChallenge(req, res);

    return res.status(200).json({
      success: true,
      requiresTwoFactor: false,
      user: {
        uid: challenge.uid,
        email: challenge.email || "",
        emailVerified: false,
        displayName: "",
        fullName: "",
        photoURL: ""
      }
    });
  } catch (error) {
    if (error.retryAfterSeconds) {
      res.setHeader(
        "Retry-After",
        String(error.retryAfterSeconds)
      );
    }

    return res
      .status(error.statusCode || 500)
      .json({
        error:
          error.message ||
          "Could not verify authenticator code."
      });
  }
};
