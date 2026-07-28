const admin = require("../_lib/firebaseAdmin");
const { Resend } = require("resend");

const {
  getCodeHash,
  createRandomCode,
  getUserFromRequest,
  getAuthenticatorSecret
} = require("../_lib/securityHelpers");

const {
  getClientIp,
  consumeRateLimit,
  THIRTY_MINUTES_MS,
  ONE_HOUR_MS
} = require("../_lib/rateLimitHelpers");

const resend = new Resend(process.env.RESEND_API_KEY);

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

    const userRecord = await admin.auth().getUser(decodedUser.uid);
    const email = userRecord.email || decodedUser.email || "";

    if (!email) {
      return res.status(400).json({ error: "No email address found on this account." });
    }

    const codeRef = db.collection("securityPasswordCodes").doc(decodedUser.uid);
    const existingCode = await codeRef.get();

    if (existingCode.exists) {
      const data = existingCode.data() || {};
      const lastSentAt = data.lastSentAt && data.lastSentAt.toDate ? data.lastSentAt.toDate() : null;

      if (lastSentAt && Date.now() - lastSentAt.getTime() < 60 * 1000) {
        return res.status(429).json({ error: "Please wait before requesting another code." });
      }
    }

    await consumeRateLimit({
      bucket: "security-code-send",
      keyParts: [decodedUser.uid, getClientIp(req)],
      firstLimit: 5,
      secondLimit: 10,
      firstLockMs: THIRTY_MINUTES_MS,
      secondLockMs: ONE_HOUR_MS,
      errorMessage: "Too many security codes requested."
    });

    const code = createRandomCode();
    const salt = db.collection("_").doc().id;
    const codeHash = getCodeHash(decodedUser.uid, code, salt);

    await codeRef.set({
      codeHash,
      salt,
      attempts: 0,
      email,
      reason: "security-panel",
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      lastSentAt: admin.firestore.FieldValue.serverTimestamp(),
      expiresAt: admin.firestore.Timestamp.fromDate(new Date(Date.now() + 10 * 60 * 1000))
    });

    await resend.emails.send({
      from: process.env.SECURITY_EMAIL_FROM,
      to: email,
      subject: "Your AUC Atlas security code",
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.6;">
          <h2>Your AUC Atlas security code</h2>
          <p>Use this code to unlock your Security panel:</p>
          <p style="font-size: 28px; font-weight: bold; letter-spacing: 6px;">${code}</p>
          <p>This code expires in 10 minutes.</p>
          <p>If you did not request this, you can ignore this email.</p>
        </div>
      `
    });

    return res.status(200).json({
      success: true,
      method: "email"
    });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      error: error.message || "Could not start security verification."
    });
  }
};
