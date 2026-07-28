const admin = require("../_lib/firebaseAdmin");
const { authenticator } = require("otplib");

const {
  getCodeHash,
  getUserFromRequest,
  getAuthenticatorSecret
} = require("../_lib/securityHelpers");

const {
  createSecurityUnlockSession
} = require("../_lib/securityUnlockHelpers");

const LOCKOUT_MS = 30 * 60 * 1000;

function cleanCode(value) {
  return String(value || "").trim().replace(/\D/g, "");
}

function timestampToMillis(value) {
  if (!value) return 0;
  if (typeof value.toMillis === "function") return value.toMillis();
  if (typeof value.toDate === "function") return value.toDate().getTime();

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 0 : date.getTime();
}

async function createCompatibleSecurityUnlock(req, res, uid) {
  const safeUid = String(uid || "").trim();

  if (!safeUid) {
    const error = new Error("Please log in again.");
    error.statusCode = 401;
    throw error;
  }

  return await createSecurityUnlockSession(safeUid, res);
}

async function getSecurityPanelMethod(db, uid) {
  const userDoc = await db.collection("users").doc(uid).get();
  const userData = userDoc.exists ? userDoc.data() || {} : {};
  const twoFactor = userData.twoFactor || {};

  if (twoFactor.appEnabled && typeof getAuthenticatorSecret === "function") {
    const secret = await getAuthenticatorSecret(db, uid, userData);

    if (secret) {
      return {
        method: "authenticator",
        secret
      };
    }
  }

  return {
    method: "email",
    secret: ""
  };
}

function getAuthenticatorAttemptRef(uid) {
  return admin.firestore().collection("twoFactorAttempts").doc(uid + "_security_panel_app");
}

async function checkAuthenticatorAttemptLock(uid) {
  const ref = getAuthenticatorAttemptRef(uid);
  const doc = await ref.get();

  if (!doc.exists) {
    return;
  }

  const data = doc.data() || {};
  const lockedUntilMs = timestampToMillis(data.lockedUntil);

  if (lockedUntilMs && lockedUntilMs > Date.now()) {
    const error = new Error("Too many wrong authenticator codes. Please try again later.");
    error.statusCode = 429;
    throw error;
  }
}

async function recordAuthenticatorFailure(uid) {
  const ref = getAuthenticatorAttemptRef(uid);
  const doc = await ref.get();
  const data = doc.exists ? doc.data() || {} : {};
  const attempts = Number(data.attempts || 0) + 1;

  await ref.set({
    attempts,
    lockedUntil: attempts >= 3
      ? admin.firestore.Timestamp.fromDate(new Date(Date.now() + LOCKOUT_MS))
      : null,
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  }, { merge: true });
}

async function clearAuthenticatorFailures(uid) {
  await getAuthenticatorAttemptRef(uid).delete().catch(function () {});
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

    const code = cleanCode((req.body || {}).code);

    if (!/^\d{6}$/.test(code)) {
      return res.status(400).json({ error: "Please enter the 6-digit verification code." });
    }

    const db = admin.firestore();
    const verification = await getSecurityPanelMethod(db, decodedUser.uid);

    if (verification.method === "authenticator") {
      await checkAuthenticatorAttemptLock(decodedUser.uid);

      authenticator.options = { window: 1 };

      const valid = authenticator.check(code, verification.secret);

      if (!valid) {
        await recordAuthenticatorFailure(decodedUser.uid);
        return res.status(401).json({ error: "Invalid authenticator code." });
      }

      await clearAuthenticatorFailures(decodedUser.uid);
      await db.collection("securityPasswordCodes").doc(decodedUser.uid).delete().catch(function () {});

      const unlockResult = await createCompatibleSecurityUnlock(req, res, decodedUser.uid);

      return res.status(200).json({
        success: true,
        method: "authenticator",
        unlockUntil: unlockResult && unlockResult.unlockUntil ? unlockResult.unlockUntil : null
      });
    }

    const codeRef = db.collection("securityPasswordCodes").doc(decodedUser.uid);
    const codeDoc = await codeRef.get();

    if (!codeDoc.exists) {
      return res.status(400).json({ error: "Please request a new security code." });
    }

    const data = codeDoc.data() || {};
    const expiresAtMs = timestampToMillis(data.expiresAt);
    const lockedUntilMs = timestampToMillis(data.lockedUntil);

    if (lockedUntilMs && lockedUntilMs > Date.now()) {
      return res.status(429).json({ error: "Too many wrong codes. Please try again later." });
    }

    if (!expiresAtMs || expiresAtMs < Date.now()) {
      await codeRef.delete().catch(function () {});
      return res.status(400).json({ error: "This code expired. Please request a new one." });
    }

    const expectedHash = getCodeHash(decodedUser.uid, code, data.salt || "");

    if (!code || expectedHash !== data.codeHash) {
      const attempts = Number(data.attempts || 0) + 1;

      await codeRef.set({
        attempts,
        lockedUntil: attempts >= 3
          ? admin.firestore.Timestamp.fromDate(new Date(Date.now() + LOCKOUT_MS))
          : null,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      }, { merge: true });

      return res.status(401).json({ error: "Invalid security code." });
    }

    await codeRef.delete().catch(function () {});

    const unlockResult = await createCompatibleSecurityUnlock(req, res, decodedUser.uid);

    return res.status(200).json({
      success: true,
      method: "email",
      unlockUntil: unlockResult && unlockResult.unlockUntil ? unlockResult.unlockUntil : null
    });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      error: error.message || "Could not verify security code."
    });
  }
};
