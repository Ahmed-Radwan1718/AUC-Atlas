const admin = require("../_lib/firebaseAdmin");

const {
  getOptionalSiteSessionUser
} = require("../_lib/securityHelpers");

function cleanString(value) {
  return String(value || "").trim();
}

async function getFirebaseAccountToken(req) {
  const decodedUser = await getOptionalSiteSessionUser(req, {
    checkRevoked: true,
    requireCompletedTwoFactor: true
  });

  if (!decodedUser || !decodedUser.uid) {
    return "";
  }

  return await admin.auth().createCustomToken(decodedUser.uid);
}

module.exports = async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const projectId = cleanString(process.env.FIREBASE_PROJECT_ID);
  const apiKey = cleanString(process.env.FIREBASE_WEB_API_KEY);
  const authDomain = cleanString(process.env.FIREBASE_AUTH_DOMAIN) || (projectId ? projectId + ".firebaseapp.com" : "");
  const appId = cleanString(process.env.FIREBASE_APP_ID);

  if (!projectId || !apiKey || !authDomain || !appId) {
    return res.status(500).json({ error: "Firebase client configuration is not complete." });
  }

  const customToken = await getFirebaseAccountToken(req);

  res.setHeader("Cache-Control", "private, no-store");

  return res.status(200).json({
    firebase: {
      apiKey,
      authDomain,
      projectId,
      appId,
      storageBucket: cleanString(process.env.FIREBASE_STORAGE_BUCKET),
      messagingSenderId: cleanString(process.env.FIREBASE_MESSAGING_SENDER_ID),
      measurementId: cleanString(process.env.FIREBASE_MEASUREMENT_ID)
    },
    customToken
  });
};
