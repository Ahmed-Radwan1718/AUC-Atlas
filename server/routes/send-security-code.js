const admin = require("../_lib/firebaseAdmin");
const { Resend } = require("resend");

const {
  createRandomCode,
  getCodeHash,
  getUserFromRequest,
  getAuthenticatorSecret
} = require("../_lib/securityHelpers");

const resend = new Resend(process.env.RESEND_API_KEY);

function maskEmail(email) {
  const cleanValue = String(email || "").trim().toLowerCase();
  const parts = cleanValue.split("@");

  if (parts.length !== 2) {
    return cleanValue || "your email";
  }

  const name = parts[0];
  const domain = parts[1];
  const visibleName = name.length <= 2 ? name.charAt(0) : name.slice(0, 2);

  return visibleName + "***@" + domain;
}

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

  if (twoFactor.emailEnabled) {
    return "email";
  }

  return "none";
}

async function sendEmailSecurityCode(db, uid, email) {
  const code = createRandomCode();
  const salt = db.collection("_").doc().id;

  await db.collection("securityPasswordCodes").doc(uid).set({
    uid,
    codeHash: getCodeHash(uid, code, salt),
    salt,
    attempts: 0,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    expiresAt: admin.firestore.Timestamp.fromDate(new Date(Date.now() + 10 * 60 * 1000))
  });

  await resend.emails.send({
    from: process.env.SECURITY_EMAIL_FROM,
    to: email,
    subject: "Your AUC Atlas security code",
    html: `
      <div style="font-family: Arial, sans-serif; color: #1d1f1f; line-height: 1.6;">
        <h2 style="margin: 0 0 12px;">Your AUC Atlas security code</h2>
        <p style="margin: 0 0 16px;">Use this code to unlock protected account settings.</p>
        <p style="font-size: 28px; font-weight: 700; letter-spacing: 6px; margin: 0 0 16px;">${code}</p>
        <p style="margin: 0; color: #6f766f;">This code expires in 10 minutes.</p>
      </div>
    `
  });
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
      return res.status(400).json({ error: "Invalid security verification request." });
    }

    const db = admin.firestore();
    const method = await getSecurityPanelMethod(db, decodedUser.uid);

    if (method === "authenticator") {
      return res.status(200).json({
        success: true,
        method: "authenticator"
      });
    }

    if (method === "email") {
      const userRecord = await admin.auth().getUser(decodedUser.uid);
      const email = userRecord.email || decodedUser.email || "";

      if (!email) {
        return res.status(400).json({ error: "No email address found on this account." });
      }

      await sendEmailSecurityCode(db, decodedUser.uid, email);

      return res.status(200).json({
        success: true,
        method: "email",
        maskedEmail: maskEmail(email)
      });
    }

    return res.status(400).json({
      error: "Set up two-factor authentication before using protected security actions."
    });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      error: error.message || "Could not start security verification."
    });
  }
};
