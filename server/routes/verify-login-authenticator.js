const admin = require("../_lib/firebaseAdmin");
const { authenticator } = require("otplib");

const {
  getLoginChallenge,
  clearLoginChallenge,
  createSiteSessionFromIdToken,
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

    authenticator.options = { window: 1 };

    if (!authenticator.check(code, secret)) {
      return res.status(401).json({ error: "Invalid authenticator code." });
    }

    if (challenge.idToken) {
      await createSiteSessionFromIdToken(challenge.idToken, res, req);
    } else {
      await createSiteSessionForUid(challenge.uid, res, req);
    }

    await clearLoginChallenge(req, res);

    const userRecord = await admin.auth().getUser(challenge.uid);
    const userDoc = await admin.firestore().collection("users").doc(challenge.uid).get();
    const userData = userDoc.exists ? userDoc.data() || {} : {};
    const fullName = userData.fullName || userRecord.displayName || "";
    const email = userRecord.email || userData.email || challenge.email || "";
    const photoURL = userData.photoURL || userRecord.photoURL || "";

    return res.status(200).json({
      success: true,
      requiresTwoFactor: false,
      user: {
        uid: challenge.uid,
        email,
        emailVerified: Boolean(userRecord.emailVerified || userData.emailVerified),
        displayName: fullName,
        fullName,
        photoURL
      }
    });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      error: error.message || "Could not verify authenticator code."
    });
  }
};
