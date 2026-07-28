const admin = require("../_lib/firebaseAdmin");

const {
  getUserFromRequest,
  getAuthenticatorSecret
} = require("../_lib/securityHelpers");

async function getSecurityPanelMethod(db, uid) {
  const userDoc = await db.collection("users").doc(uid).get();
  const userData = userDoc.exists ? userDoc.data() || {} : {};
  const twoFactor = userData.twoFactor || {};

  if (twoFactor.appEnabled && typeof getAuthenticatorSecret === "function") {
    const secret = await getAuthenticatorSecret(db, uid, userData);

    if (secret) {
      return "authenticator";
    }
  }

  return "email";
}

module.exports = async function handler(req, res) {
  try {
    if (req.method !== "POST") {
      return res.status(405).json({ error: "Method not allowed" });
    }

    const decodedUser = await getUserFromRequest(req, {
      checkRevoked: true,
      requireCompletedTwoFactor: true
    });

    const reason = String((req.body || {}).reason || "").trim();

    if (reason && reason !== "security-panel") {
      return res.status(400).json({ error: "Invalid security code request." });
    }

    const db = admin.firestore();
    const method = await getSecurityPanelMethod(db, decodedUser.uid);

    if (method === "authenticator") {
      return res.status(200).json({
        success: true,
        method: "authenticator"
      });
    }

    return res.status(503).json({
      error: "Email security codes are unavailable right now.",
      method: "email"
    });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      error: error.message || "Could not start security verification."
    });
  }
};
