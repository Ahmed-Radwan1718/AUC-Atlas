import type { NextApiHandler } from "next";
import type { DocumentReference } from "firebase-admin/firestore";
import { admin } from "@/server/backend/firebase";
import { ensureAllowedAucEmail, signInWithCustomToken } from "@/server/backend/security";
import { consumeSecurityRateLimit, getRequestIp } from "@/server/backend/security-rate-limits";
import { asBackendError, asRecord, type BackendError } from "@/server/backend/types";

const SIGNUP_RATE_LIMIT_WINDOW_MS = 30 * 60 * 1000;
const SIGNUP_MAX_EMAIL_ATTEMPTS = 5;
const SIGNUP_MAX_IP_ATTEMPTS = 20;

function cleanString(value: unknown, maxLength: number): string {
  return String(value || "").trim().slice(0, maxLength);
}
function cleanEmail(value: unknown): string {
  return cleanString(value, 160).toLowerCase();
}
function cleanAucId(value: unknown): string {
  return String(value || "").replace(/\D/g, "").slice(0, 9);
}
function hasValidAucIdFormat(value: unknown): boolean {
  return /^900\d{6}$/.test(cleanAucId(value));
}
function getAucIdLookupKey(value: unknown): string {
  const aucId = cleanAucId(value);
  return hasValidAucIdFormat(aucId) ? aucId : "";
}
function createInvalidAucIdError(): BackendError {
  const error = new Error("AUC ID number must start with 900 and be 9 digits total.") as BackendError;
  error.statusCode = 400;
  return error;
}
function createAucIdInUseError(): BackendError {
  const error = new Error("This AUC ID number is already used by another account.") as BackendError;
  error.statusCode = 409;
  return error;
}

async function ensureAucIdCanCreateAccount(aucId: string): Promise<string> {
  const aucIdLookupKey = getAucIdLookupKey(aucId);
  if (!aucIdLookupKey) throw createInvalidAucIdError();
  const db = admin.firestore();
  const reservationDoc = await db.collection("accountAucIds").doc(aucIdLookupKey).get();
  if (reservationDoc.exists) throw createAucIdInUseError();
  const [exact, normalized] = await Promise.all([
    db.collection("users").where("aucId", "==", aucIdLookupKey).limit(1).get(),
    db.collection("users").where("aucIdLookupKey", "==", aucIdLookupKey).limit(1).get(),
  ]);
  if (!exact.empty || !normalized.empty) throw createAucIdInUseError();
  return aucIdLookupKey;
}

async function reserveAccountAucId(
  aucId: string,
  uid: string,
): Promise<{ aucIdLookupKey: string; aucIdRef: DocumentReference }> {
  const aucIdLookupKey = await ensureAucIdCanCreateAccount(aucId);
  const aucIdRef = admin.firestore().collection("accountAucIds").doc(aucIdLookupKey);
  try {
    await aucIdRef.create({
      uid,
      aucId: aucIdLookupKey,
      aucIdLookupKey,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });
  } catch (unknownError) {
    const error = asBackendError(unknownError);
    if (
      String(error.code) === "6" ||
      error.code === "already-exists" ||
      /already exists/i.test(error.message || "")
    ) {
      throw createAucIdInUseError();
    }
    throw error;
  }
  return { aucIdLookupKey, aucIdRef };
}

async function ensureEmailCanCreateAccount(email: string): Promise<void> {
  try {
    await admin.auth().getUserByEmail(email);
    const error = new Error("This email is already used by another account.") as BackendError;
    error.statusCode = 409;
    throw error;
  } catch (unknownError) {
    const error = asBackendError(unknownError);
    if (error.code === "auth/user-not-found") return;
    throw error;
  }
}

function getFirebaseWebApiKey(): string {
  const apiKey = String(process.env.FIREBASE_WEB_API_KEY || "").trim();
  if (!apiKey) {
    const error = new Error("Firebase signup email verification is not configured.") as BackendError;
    error.statusCode = 500;
    throw error;
  }
  return apiKey;
}

async function sendFirebaseSignupVerificationEmail(uid: string): Promise<void> {
  const apiKey = getFirebaseWebApiKey();
  const customToken = await admin.auth().createCustomToken(uid);
  const signInData = await signInWithCustomToken(customToken);
  const idToken = String(signInData.idToken || "");
  if (!idToken) {
    const error = new Error("Could not create email verification session.") as BackendError;
    error.statusCode = 500;
    throw error;
  }
  const response = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:sendOobCode?key=${encodeURIComponent(apiKey)}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ requestType: "VERIFY_EMAIL", idToken }),
    },
  );
  const data = asRecord(await response.json().catch(() => ({})));
  if (!response.ok) {
    const error = new Error("Could not send signup verification email.") as BackendError;
    error.statusCode = response.status || 500;
    const firebaseError = asRecord(data.error);
    error.firebaseErrorCode = String(firebaseError.message || "");
    throw error;
  }
}

const handler: NextApiHandler = async (req, res) => {
  try {
    if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
    const body = asRecord(req.body);
    const fullName = cleanString(body.fullName, 80);
    const aucId = cleanAucId(body.aucId);
    const email = cleanEmail(body.email);
    const password = String(body.password || "");
    const confirmPassword = String(body.confirmPassword || "");
    const consentAccepted = body.consentAccepted === true;

    if (!fullName || !aucId || !email || !password || !confirmPassword) {
      return res.status(400).json({ error: "Please complete all required fields." });
    }
    if (!consentAccepted) {
      return res.status(400).json({
        error:
          "You must agree to the Terms of Service and confirm that you have read the Privacy Policy before creating an account.",
      });
    }
    ensureAllowedAucEmail(email, "create an account");
    if (!hasValidAucIdFormat(aucId)) throw createInvalidAucIdError();
    if (password !== confirmPassword) {
      return res.status(400).json({ error: "Passwords do not match." });
    }
    if (
      password.length < 10 ||
      password.length > 48 ||
      !/[A-Z]/.test(password) ||
      !/[a-z]/.test(password) ||
      !/[0-9]/.test(password) ||
      !/[^A-Za-z0-9\s]/.test(password)
    ) {
      return res.status(400).json({
        error:
          "Password must be 10 to 48 characters and include uppercase, lowercase, special, and numeric characters.",
      });
    }

    await consumeSecurityRateLimit({
      scope: "signup-ip",
      identifier: getRequestIp(req),
      maxAttempts: SIGNUP_MAX_IP_ATTEMPTS,
      windowMs: SIGNUP_RATE_LIMIT_WINDOW_MS,
      message: "Too many signup attempts from this connection. Please try again later.",
    });
    await consumeSecurityRateLimit({
      scope: "signup-email",
      identifier: email,
      maxAttempts: SIGNUP_MAX_EMAIL_ATTEMPTS,
      windowMs: SIGNUP_RATE_LIMIT_WINDOW_MS,
      message: "Too many signup attempts for this email. Please try again later.",
    });
    await ensureAucIdCanCreateAccount(aucId);
    await ensureEmailCanCreateAccount(email);

    const userRecord = await admin.auth().createUser({
      email,
      password,
      displayName: fullName,
      emailVerified: false,
    });
    let aucIdReservation: { aucIdLookupKey: string; aucIdRef: DocumentReference } | null = null;
    const userRef = admin.firestore().collection("users").doc(userRecord.uid);
    try {
      aucIdReservation = await reserveAccountAucId(aucId, userRecord.uid);
      await userRef.set({
        fullName,
        aucId,
        aucIdLookupKey: aucIdReservation.aucIdLookupKey,
        email,
        authProvider: "password",
        emailVerified: false,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
      await sendFirebaseSignupVerificationEmail(userRecord.uid);
    } catch (error) {
      if (aucIdReservation) await aucIdReservation.aucIdRef.delete().catch(() => undefined);
      await userRef.delete().catch(() => undefined);
      await admin.auth().deleteUser(userRecord.uid).catch(() => undefined);
      throw error;
    }

    return res.status(200).json({
      success: true,
      requiresEmailVerification: true,
      message: "Account created. Verify your AUC email before logging in.",
      user: {
        uid: userRecord.uid,
        email,
        aucId,
        displayName: fullName,
        emailVerified: false,
      },
    });
  } catch (unknownError) {
    const error = asBackendError(unknownError, "Could not create account.");
    if (error.code === "auth/email-already-exists") {
      return res.status(409).json({ error: "This email is already used by another account." });
    }
    if (error.retryAfterSeconds) res.setHeader("Retry-After", String(error.retryAfterSeconds));
    return res.status(error.statusCode || 500).json({
      error: error.message || "Could not create account.",
    });
  }
};

export default handler;
