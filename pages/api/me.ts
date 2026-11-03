import type { NextApiHandler } from "next";
import { admin } from "@/server/backend/firebase";
import { getAuthenticatorSecret, getSiteSessionUser } from "@/server/backend/security";
import { consumeSecurityRateLimit } from "@/server/backend/security-rate-limits";
import { asBackendError, asRecord, type BackendError } from "@/server/backend/types";

const PROFILE_UPDATE_WINDOW_MS = 60 * 60 * 1000;
const PROFILE_MAX_UPDATES = 20;
const DISPLAY_NAME_CHANGE_COOLDOWN_MS = 30 * 24 * 60 * 60 * 1000;

function getFirstName(fullName: unknown, email: unknown): string {
  const name = String(fullName || "").trim();
  return name ? name.split(/\s+/)[0] : String(email || "").split("@")[0] || "there";
}
function cleanString(value: unknown, maxLength: number): string {
  return String(value || "").trim().slice(0, maxLength);
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
function createProfileError(message: string, statusCode: number): BackendError {
  const error = new Error(message) as BackendError;
  error.statusCode = statusCode;
  return error;
}
function getDateFromStoredValue(value: unknown): Date | null {
  if (!value) return null;
  const stored = value as { toDate?: () => Date; seconds?: number; _seconds?: number };
  if (typeof stored.toDate === "function") return stored.toDate();
  if (typeof stored.seconds === "number") return new Date(stored.seconds * 1000);
  if (typeof stored._seconds === "number") return new Date(stored._seconds * 1000);
  const parsed = new Date(String(value));
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}
function getDisplayNameUnlockDate(value: unknown): Date | null {
  const last = getDateFromStoredValue(value);
  return last ? new Date(last.getTime() + DISPLAY_NAME_CHANGE_COOLDOWN_MS) : null;
}
function getUnlockDateText(value: unknown): string {
  const unlockDate = getDisplayNameUnlockDate(value);
  return unlockDate
    ? unlockDate.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })
    : "";
}
async function getTwoFactorResponse(uid: string, userData: Record<string, unknown>) {
  const twoFactorData = asRecord(userData.twoFactor);
  let hasAuthenticatorApp = Boolean(twoFactorData.appEnabled || twoFactorData.appSecret);
  if (!hasAuthenticatorApp) {
    hasAuthenticatorApp = Boolean(await getAuthenticatorSecret(uid).catch(() => ""));
  }
  return { appEnabled: hasAuthenticatorApp, emailEnabled: Boolean(twoFactorData.emailEnabled) };
}
async function serializeAccount(uid: string, decodedEmail: unknown) {
  const [userRecord, userDoc] = await Promise.all([
    admin.auth().getUser(uid),
    admin.firestore().collection("users").doc(uid).get(),
  ]);
  const userData = userDoc.exists ? userDoc.data() || {} : {};
  const fullName = String(userData.fullName || userRecord.displayName || "");
  const email = String(userData.email || userRecord.email || decodedEmail || "");
  return {
    uid,
    email,
    emailVerified: Boolean(userRecord.emailVerified || userData.emailVerified),
    displayName: fullName,
    fullName,
    photoURL: String(userData.photoURL || userRecord.photoURL || ""),
    firstName: getFirstName(fullName, email),
    major: String(userData.major || ""),
    aucId: String(userData.aucId || userData.aucIdLookupKey || ""),
    authProvider: String(userData.authProvider || "password"),
    twoFactor: await getTwoFactorResponse(uid, userData),
    displayNameLastChangedAt: userData.displayNameLastChangedAt || userData.usernameLastChangedAt || null,
    aucIdLastChangedAt: userData.aucIdLastChangedAt || null,
  };
}

const handler: NextApiHandler = async (req, res) => {
  try {
    if (req.method === "PATCH") {
      const decodedUser = await getSiteSessionUser(req, { checkRevoked: true });
      await consumeSecurityRateLimit({
        scope: "profile-update-user",
        identifier: decodedUser.uid,
        maxAttempts: PROFILE_MAX_UPDATES,
        windowMs: PROFILE_UPDATE_WINDOW_MS,
        message: "Too many profile updates. Please try again later.",
      });
      const db = admin.firestore();
      const userRef = db.collection("users").doc(decodedUser.uid);
      const storedUserDoc = await userRef.get();
      const storedUserData = storedUserDoc.exists ? storedUserDoc.data() || {} : {};
      const requestBody = asRecord(req.body);
      const fullName = cleanString(requestBody.fullName, 80);
      const aucId = cleanAucId(storedUserData.aucId || storedUserData.aucIdLookupKey || "");
      const aucIdWasSubmitted = Object.prototype.hasOwnProperty.call(requestBody, "aucId");
      const requestedAucId = aucIdWasSubmitted ? cleanAucId(requestBody.aucId) : "";
      const major = cleanString(requestBody.major, 100);
      if (!fullName) throw createProfileError("Please enter your display name.", 400);
      if (aucIdWasSubmitted && requestedAucId !== aucId) {
        throw createProfileError("AUC ID cannot be changed.", 400);
      }
      if (aucId && !hasValidAucIdFormat(aucId)) {
        throw createProfileError("The saved AUC ID is invalid.", 500);
      }
      const aucIdLookupKey = getAucIdLookupKey(aucId);
      const reservations = db.collection("accountAucIds");
      const existingUserRecord = await admin.auth().getUser(decodedUser.uid);

      await db.runTransaction(async (transaction) => {
        const userDoc = await transaction.get(userRef);
        const userData = userDoc.exists ? userDoc.data() || {} : {};
        const currentAucIdLookupKey = String(userData.aucIdLookupKey || getAucIdLookupKey(userData.aucId || ""));
        const oldAucIdRef = currentAucIdLookupKey ? reservations.doc(currentAucIdLookupKey) : null;
        const nextAucIdRef = aucIdLookupKey ? reservations.doc(aucIdLookupKey) : null;
        const currentFullName = cleanString(userData.fullName || existingUserRecord.displayName || "", 80);
        const requestedDisplayNameChanged = fullName !== currentFullName;
        if (requestedDisplayNameChanged) {
          const unlockDate = getDisplayNameUnlockDate(userData.displayNameLastChangedAt || userData.usernameLastChangedAt || null);
          if (unlockDate && unlockDate.getTime() > Date.now()) {
            throw createProfileError(
              `You can change your display name again on ${getUnlockDateText(userData.displayNameLastChangedAt || userData.usernameLastChangedAt)}.`,
              429,
            );
          }
        }
        if (nextAucIdRef && aucIdLookupKey !== currentAucIdLookupKey) {
          const aucIdDoc = await transaction.get(nextAucIdRef);
          const aucIdData = aucIdDoc.exists ? aucIdDoc.data() || {} : {};
          if (aucIdDoc.exists && String(aucIdData.uid || "") !== decodedUser.uid) {
            throw createProfileError("This AUC ID number is already used by another account.", 409);
          }
        }
        const now = admin.firestore.FieldValue.serverTimestamp();
        const updateData: Record<string, unknown> = {
          fullName,
          aucId,
          aucIdLookupKey,
          major,
          updatedAt: now,
        };
        if (requestedDisplayNameChanged) updateData.displayNameLastChangedAt = now;
        if (!userDoc.exists) {
          updateData.email = decodedUser.email || "";
          updateData.authProvider = "password";
          updateData.createdAt = now;
        }
        transaction.set(userRef, updateData, { merge: true });
        if (oldAucIdRef && currentAucIdLookupKey !== aucIdLookupKey) transaction.delete(oldAucIdRef);
        if (nextAucIdRef) {
          transaction.set(nextAucIdRef, { uid: decodedUser.uid, aucId, aucIdLookupKey, updatedAt: now }, { merge: true });
        }
      });
      await admin.auth().updateUser(decodedUser.uid, { displayName: fullName });
      const user = await serializeAccount(decodedUser.uid, decodedUser.email);
      return res.status(200).json({ success: true, signedIn: true, authenticated: true, loggedIn: true, user });
    }

    if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });
    const decodedUser = await getSiteSessionUser(req, { checkRevoked: true });
    const user = await serializeAccount(decodedUser.uid, decodedUser.email);
    return res.status(200).json({ signedIn: true, authenticated: true, loggedIn: true, user });
  } catch (unknownError) {
    const error = asBackendError(unknownError);
    console.error("AUC Atlas /api/me failed:", {
      message: error.message || "",
      code: error.code || "",
      statusCode: error.statusCode || 500,
      hasCookieHeader: Boolean(req.headers.cookie),
    });
    if (req.method !== "GET") {
      return res.status(error.statusCode || 500).json({ error: error.message || "Could not save account details." });
    }
    return res.status(200).json({ signedIn: false, authenticated: false, loggedIn: false, user: null });
  }
};

export default handler;
