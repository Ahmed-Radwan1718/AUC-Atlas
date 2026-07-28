const admin = require("../_lib/firebaseAdmin");

const WINDOW_MS = 30 * 60 * 1000;
const MAX_ATTEMPTS = 5;

function cleanEmail(value) {
  return String(value || "").trim().toLowerCase().slice(0, 160);
}

function getFirebaseWebApiKey() {
  const apiKey = String(process.env.FIREBASE_WEB_API_KEY || "").trim();

  if (!apiKey) {
    const error = new Error("Firebase password reset email is not configured.");
    error.statusCode = 500;
    throw error;
  }

  return apiKey;
}

async function sendFirebasePasswordResetEmail(email) {
  const response = await fetch(
    "https://identitytoolkit.googleapis.com/v1/accounts:sendOobCode?key=" + encodeURIComponent(getFirebaseWebApiKey()),
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        requestType: "PASSWORD_RESET",
        email
      })
    }
  );

  const data = await response.json().catch(function () {
    return {};
  });

  const firebaseErrorCode = data && data.error && data.error.message ? data.error.message : "";

  if (!response.ok) {
    if (firebaseErrorCode === "EMAIL_NOT_FOUND") {
      return;
    }

    const error = new Error("Could not send password reset email.");
    error.statusCode = response.status || 500;
    error.firebaseErrorCode = firebaseErrorCode;
    throw error;
  }
}

function timestampToMillis(value) {
  if (!value) return 0;
  if (typeof value.toMillis === "function") return value.toMillis();
  if (typeof value.toDate === "function") return value.toDate().getTime();

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 0 : date.getTime();
}

async function checkRateLimit(email) {
  const db = admin.firestore();
  const ref = db.collection("passwordResetAttempts").doc(email.replace(/[^\w.-]/g, "_"));
  const doc = await ref.get();
  const data = doc.exists ? doc.data() || {} : {};

  const windowStartedAtMs = timestampToMillis(data.windowStartedAt);

  if (windowStartedAtMs && Date.now() - windowStartedAtMs < WINDOW_MS && Number(data.count || 0) >= MAX_ATTEMPTS) {
    const error = new Error("Too many reset requests. Please try again later.");
    error.statusCode = 429;
    throw error;
  }

  const oldWindow = !windowStartedAtMs || Date.now() - windowStartedAtMs >= WINDOW_MS;

  await ref.set({
    count: oldWindow ? 1 : Number(data.count || 0) + 1,
    windowStartedAt: oldWindow ? admin.firestore.FieldValue.serverTimestamp() : data.windowStartedAt,
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  }, { merge: true });
}

module.exports = async function handler(req, res) {
  try {
    if (req.method !== "POST") {
      return res.status(405).json({ error: "Method not allowed" });
    }

    const email = cleanEmail((req.body || {}).email);

    if (!email) {
      return res.status(400).json({ error: "Please enter your email address." });
    }

    await checkRateLimit(email);

    await sendFirebasePasswordResetEmail(email);

    return res.status(200).json({
      success: true,
      message: "If an account exists with that email, a reset link has been sent."
    });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      error: error.message || "Could not send password reset email."
    });
  }
};
