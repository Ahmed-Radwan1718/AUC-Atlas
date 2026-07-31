const admin = require("../_lib/firebaseAdmin");

const {
  signInWithPassword,
  createSiteSessionFromIdToken,
  ensureAllowedAucEmail
} = require("../_lib/securityHelpers");

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

    let loginResult;

    try {
      loginResult = await signInWithPassword(email, password);
    } catch (error) {
      return res.status(401).json({ error: "Incorrect email or password." });
    }

    const uid = loginResult.localId || loginResult.uid;

    if (!uid || !loginResult.idToken) {
      return res.status(500).json({ error: "Could not start login session." });
    }

    await createSiteSessionFromIdToken(loginResult.idToken, res);

    const userRecord = await admin.auth().getUser(uid);
    const userDoc = await admin.firestore().collection("users").doc(uid).get();
    const userData = userDoc.exists ? userDoc.data() || {} : {};

    const fullName = userData.fullName || userRecord.displayName || "";
    const emailAddress = userRecord.email || userData.email || email;
    const photoURL = userData.photoURL || userRecord.photoURL || "";

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
    return res.status(error.statusCode || 500).json({
      error: error.message || "Could not log in."
    });
  }
};
