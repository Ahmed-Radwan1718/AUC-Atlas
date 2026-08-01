const admin = require("../_lib/firebaseAdmin");

const {
  getSiteSessionUser,
  signInWithPassword,
  createSiteSessionForUid
} = require("../_lib/securityHelpers");

function isStrongPassword(password) {
  return typeof password === "string" &&
    password.length >= 10 &&
    password.length <= 48 &&
    /[A-Z]/.test(password) &&
    /[a-z]/.test(password) &&
    /[0-9]/.test(password) &&
    /[^A-Za-z0-9\s]/.test(password);
}

module.exports = async function handler(req, res) {
  try {
    if (req.method !== "POST") {
      return res.status(405).json({ error: "Method not allowed" });
    }

    const decodedUser = await getSiteSessionUser(req, {
      checkRevoked: true
    });

    const currentPassword = String((req.body || {}).currentPassword || "");
    const newPassword = String((req.body || {}).newPassword || "");
    const confirmPassword = String((req.body || {}).confirmPassword || "");

    if (!currentPassword || !newPassword || !confirmPassword) {
      return res.status(400).json({ error: "Please complete all password fields." });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({ error: "New passwords do not match." });
    }

    if (currentPassword === newPassword) {
      return res.status(400).json({ error: "New password must be different from your current password." });
    }

    if (!isStrongPassword(newPassword)) {
      return res.status(400).json({ error: "Password must be 10 to 48 characters and include uppercase, lowercase, special, and numeric characters." });
    }

    const userRecord = await admin.auth().getUser(decodedUser.uid);
    const email = userRecord.email || decodedUser.email || "";

    if (!email) {
      return res.status(400).json({ error: "No email address found on this account." });
    }

    try {
      await signInWithPassword(email, currentPassword);
    } catch (error) {
      return res.status(401).json({ error: "Current password is incorrect." });
    }

    await admin.auth().updateUser(decodedUser.uid, {
      password: newPassword
    });

    await admin.firestore().collection("users").doc(decodedUser.uid).set({
      passwordLastChangedAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    }, { merge: true });

    await admin.auth().revokeRefreshTokens(decodedUser.uid);
    await createSiteSessionForUid(decodedUser.uid, res);

    return res.status(200).json({
      success: true
    });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      error: error.message || "Could not change password."
    });
  }
};
