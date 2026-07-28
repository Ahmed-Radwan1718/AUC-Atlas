const admin = require("../_lib/firebaseAdmin");

const {
  getUserFromRequest,
  signInWithCustomToken
} = require("../_lib/securityHelpers");

const {
  getClientIp,
  consumeRateLimit,
  THIRTY_MINUTES_MS,
  ONE_HOUR_MS
} = require("../_lib/rateLimitHelpers");

function getFirebaseWebApiKey() {
  const apiKey = String(process.env.FIREBASE_WEB_API_KEY || "").trim();

  if (!apiKey) {
    const error = new Error("Firebase email verification is not configured.");
    error.statusCode = 500;
    throw error;
  }

  return apiKey;
}

async function sendFirebaseEmailVerification(uid) {
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
    const error = new Error("Could not send verification email.");
    error.statusCode = response.status || 500;
    error.firebaseErrorCode = data && data.error && data.error.message ? data.error.message : "";
    throw error;
  }
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

    const userRecord = await admin.auth().getUser(decodedUser.uid);
    const email = userRecord.email || decodedUser.email || "";

    if (!email) {
      return res.status(400).json({ error: "No email address found on this account." });
    }

    if (userRecord.emailVerified) {
      return res.status(200).json({
        success: true,
        alreadyVerified: true
      });
    }

    const db = admin.firestore();
    const sendRef = db.collection("emailVerificationAttempts").doc(decodedUser.uid);
    const sendDoc = await sendRef.get();

    if (sendDoc.exists) {
      const data = sendDoc.data() || {};
      const lastSentAt = data.lastSentAt && data.lastSentAt.toDate ? data.lastSentAt.toDate() : null;

      if (lastSentAt && Date.now() - lastSentAt.getTime() < 60 * 1000) {
        return res.status(429).json({ error: "Please wait before requesting another verification email." });
      }
    }

    await consumeRateLimit({
      bucket: "email-verification-send",
      keyParts: [decodedUser.uid, getClientIp(req)],
      firstLimit: 5,
      secondLimit: 10,
      firstLockMs: THIRTY_MINUTES_MS,
      secondLockMs: ONE_HOUR_MS,
      errorMessage: "Too many verification emails requested."
    });

    await sendFirebaseEmailVerification(decodedUser.uid);

    await sendRef.set({
      email,
      lastSentAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    }, { merge: true });

    return res.status(200).json({
      success: true,
      alreadyVerified: false
    });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      error: error.message || "Could not send verification email."
    });
  }
};
