const admin = require("../_lib/firebaseAdmin");
const { authenticator } = require("otplib");
const QRCode = require("qrcode");
const { Resend } = require("resend");

const {
  signInWithPassword,
  createSiteSessionForUid,
  createLoginTwoFactorSession,
  createTrustedDevice,
  getLoginChallenge,
  clearLoginChallenge,
  clearLoginTwoFactorCookie,
  clearSiteSessionCookie,
  getUserFromRequest,
  getAuthenticatorSecret,
  checkAttemptLock,
  recordAttemptFailure,
  clearAttemptFailures,
  createRandomCode,
  getCodeHash,
  listAccountSessions,
  listTrustedDevices,
  getCurrentAccountSession,
  revokeTrustedDevice,
  revokeAllTrustedDevices,
  clearTrustedDeviceCookie
} = require("../_lib/securityHelpers");

const {
  hasValidSecurityUnlockSession,
  clearSecurityUnlockSession
} = require("../_lib/securityUnlockHelpers");

const resend = new Resend(process.env.RESEND_API_KEY);

const LOGIN_EMAIL_CODE_EXPIRES_MS = 10 * 60 * 1000;
const AUTHENTICATOR_SETUP_EXPIRES_MS = 10 * 60 * 1000;
const LOCKOUT_MS = 30 * 60 * 1000;
const AUTHENTICATOR_ISSUER = "AUC Atlas";

function createHttpError(message, statusCode) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

function cleanCode(value) {
  return String(value || "").trim().replace(/\D/g, "").slice(0, 6);
}

function cleanString(value, maxLength) {
  return String(value || "").trim().slice(0, maxLength || 200);
}

function normalizeEmail(value) {
  return String(value || "").trim().toLowerCase();
}

function timestampToMillis(value) {
  if (!value) return 0;
  if (typeof value.toMillis === "function") return value.toMillis();
  if (typeof value.toDate === "function") return value.toDate().getTime();

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 0 : date.getTime();
}

function serializeTimestamp(value) {
  const millis = timestampToMillis(value);
  return millis ? new Date(millis).toISOString() : null;
}

function getSafeTwoFactor(userData) {
  const twoFactor = userData && userData.twoFactor && typeof userData.twoFactor === "object"
    ? userData.twoFactor
    : {};

  return {
    appEnabled: Boolean(twoFactor.appEnabled),
    emailEnabled: Boolean(twoFactor.emailEnabled),
    appUpdatedAt: serializeTimestamp(twoFactor.appUpdatedAt),
    emailUpdatedAt: serializeTimestamp(twoFactor.emailUpdatedAt)
  };
}

function hasTwoFactorEnabled(twoFactor) {
  return Boolean(twoFactor && (twoFactor.appEnabled || twoFactor.emailEnabled));
}

function getPasswordError(password) {
  if (password.length < 10 || password.length > 48) return "Use 10 to 48 characters.";
  if (!/[A-Z]/.test(password)) return "Use at least 1 uppercase character.";
  if (!/[a-z]/.test(password)) return "Use at least 1 lowercase character.";
  if (!/\d/.test(password)) return "Use at least 1 numeric character.";
  if (!/[^A-Za-z0-9]/.test(password)) return "Use at least 1 special character.";
  return "";
}

function maskEmail(email) {
  const cleanEmail = normalizeEmail(email);
  const parts = cleanEmail.split("@");

  if (parts.length !== 2) {
    return cleanEmail || "your email";
  }

  const name = parts[0];
  const domain = parts[1];

  if (name.length <= 2) {
    return name.charAt(0) + "***@" + domain;
  }

  return name.charAt(0) + "***" + name.charAt(name.length - 1) + "@" + domain;
}

async function getAuthenticatedUser(req) {
  return await getUserFromRequest(req, {
    checkRevoked: true,
    requireCompletedTwoFactor: true
  });
}

async function getUserSecurityData(uid) {
  const userRef = admin.firestore().collection("users").doc(uid);
  const userDoc = await userRef.get();
  const userData = userDoc.exists ? userDoc.data() || {} : {};

  return {
    userRef,
    userData,
    twoFactor: getSafeTwoFactor(userData)
  };
}

async function requireSecurityUnlockIfNeeded(req, uid) {
  const securityData = await getUserSecurityData(uid);

  if (!hasTwoFactorEnabled(securityData.twoFactor)) {
    return securityData;
  }

  const unlocked = await hasValidSecurityUnlockSession(req, uid);

  if (!unlocked) {
    throw createHttpError("Security verification required.", 403);
  }

  return securityData;
}

async function getAccountSecurityUser(req, uid, decodedUser) {
  const userRecord = await admin.auth().getUser(uid);
  const securityData = await getUserSecurityData(uid);
  const userData = securityData.userData;
  const fullName = userData.fullName || userRecord.displayName || "";
  const email = userRecord.email || userData.email || decodedUser.email || "";

  return {
    uid,
    email,
    emailVerified: Boolean(userRecord.emailVerified),
    displayName: fullName,
    fullName,
    passwordLastChangedAt: serializeTimestamp(userData.passwordLastChangedAt),
    twoFactor: securityData.twoFactor,
    sessions: await listAccountSessions(req, uid).catch(function () { return []; }),
    trustedDevices: await listTrustedDevices(req, uid).catch(function () { return []; })
  };
}

async function sendEmailCode(email, subject, heading, message, code) {
  await resend.emails.send({
    from: process.env.SECURITY_EMAIL_FROM,
    to: email,
    subject,
    html: `
      <div style="font-family: Arial, sans-serif; color: #1d1f1f; line-height: 1.6;">
        <h2 style="margin: 0 0 12px;">${heading}</h2>
        <p style="margin: 0 0 16px;">${message}</p>
        <p style="font-size: 28px; font-weight: 700; letter-spacing: 6px; margin: 0 0 16px;">${code}</p>
        <p style="margin: 0; color: #6f766f;">This code expires in 10 minutes.</p>
      </div>
    `
  });
}

async function revokeOtherAccountSessions(req, uid, revokedReason) {
  const db = admin.firestore();
  const currentSession = await getCurrentAccountSession(req, uid).catch(function () {
    return null;
  });
  const currentSessionId = currentSession && currentSession.id ? currentSession.id : "";
  const snapshot = await db.collection("accountSessions").where("uid", "==", uid).get();

  if (snapshot.empty) return;

  const batch = db.batch();

  snapshot.docs.forEach(function (doc) {
    if (doc.id === currentSessionId) return;

    batch.set(doc.ref, {
      revokedAt: admin.firestore.FieldValue.serverTimestamp(),
      revokedBy: uid,
      revokedReason: revokedReason || "security_action"
    }, { merge: true });
  });

  await batch.commit();
}

async function revokeAllAccountSessions(uid, revokedReason) {
  const snapshot = await admin.firestore().collection("accountSessions").where("uid", "==", uid).get();

  if (snapshot.empty) return;

  const batch = admin.firestore().batch();

  snapshot.docs.forEach(function (doc) {
    batch.set(doc.ref, {
      revokedAt: admin.firestore.FieldValue.serverTimestamp(),
      revokedBy: uid,
      revokedReason: revokedReason || "sign_out_everywhere"
    }, { merge: true });
  });

  await batch.commit();
}

async function changePassword(req, res) {
  try {
    if (req.method !== "POST") {
      return res.status(405).json({ error: "Method not allowed" });
    }

    const decodedUser = await getAuthenticatedUser(req);
    const uid = decodedUser.uid;
    const body = req.body || {};
    const currentPassword = String(body.currentPassword || "");
    const newPassword = String(body.newPassword || "");
    const passwordError = getPasswordError(newPassword);

    if (!currentPassword) {
      return res.status(400).json({ error: "Please enter your current password." });
    }

    if (passwordError) {
      return res.status(400).json({ error: passwordError });
    }

    await requireSecurityUnlockIfNeeded(req, uid);

    const userRecord = await admin.auth().getUser(uid);
    const email = normalizeEmail(userRecord.email || decodedUser.email || "");

    if (!email) {
      return res.status(400).json({ error: "No email address found on this account." });
    }

    try {
      await signInWithPassword(email, currentPassword);
    } catch (error) {
      return res.status(401).json({ error: "The current password is incorrect." });
    }

    await admin.auth().updateUser(uid, {
      password: newPassword
    });

    await admin.firestore().collection("users").doc(uid).set({
      passwordLastChangedAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    }, { merge: true });

    await revokeOtherAccountSessions(req, uid, "password_changed");
    await clearSecurityUnlockSession(req, res).catch(function () {});

    return res.status(200).json({
      success: true,
      message: "Password changed successfully.",
      user: await getAccountSecurityUser(req, uid, decodedUser)
    });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      error: error.message || "Could not change password."
    });
  }
}

async function setupAuthenticator(req, res) {
  try {
    if (req.method !== "POST") {
      return res.status(405).json({ error: "Method not allowed" });
    }

    const decodedUser = await getAuthenticatedUser(req);
    const uid = decodedUser.uid;
    const securityData = await requireSecurityUnlockIfNeeded(req, uid);
    const userRecord = await admin.auth().getUser(uid);
    const email = normalizeEmail(userRecord.email || decodedUser.email || "");

    if (securityData.twoFactor.appEnabled) {
      return res.status(400).json({ error: "Authenticator app 2FA is already enabled." });
    }

    const secret = authenticator.generateSecret();
    const keyUri = authenticator.keyuri(email || uid, AUTHENTICATOR_ISSUER, secret);
    const qrDataUrl = await QRCode.toDataURL(keyUri, {
      margin: 1,
      width: 220
    });

    await admin.firestore().collection("authenticatorSetupSecrets").doc(uid).set({
      uid,
      appSecret: secret,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      expiresAt: admin.firestore.Timestamp.fromDate(new Date(Date.now() + AUTHENTICATOR_SETUP_EXPIRES_MS))
    });

    return res.status(200).json({
      success: true,
      secret,
      qrDataUrl
    });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      error: error.message || "Could not start authenticator setup."
    });
  }
}

async function verifyAuthenticatorSetup(req, res) {
  try {
    if (req.method !== "POST") {
      return res.status(405).json({ error: "Method not allowed" });
    }

    const decodedUser = await getAuthenticatedUser(req);
    const uid = decodedUser.uid;
    const code = cleanCode((req.body || {}).code);

    if (!/^\d{6}$/.test(code)) {
      return res.status(400).json({ error: "Please enter the 6-digit authenticator code." });
    }

    const db = admin.firestore();
    const setupRef = db.collection("authenticatorSetupSecrets").doc(uid);
    const setupDoc = await setupRef.get();

    if (!setupDoc.exists) {
      return res.status(400).json({ error: "Please restart authenticator setup." });
    }

    const setupData = setupDoc.data() || {};

    if (timestampToMillis(setupData.expiresAt) <= Date.now()) {
      await setupRef.delete().catch(function () {});
      return res.status(400).json({ error: "Authenticator setup expired. Please start again." });
    }

    await checkAttemptLock(db, uid, "setup_authenticator");

    authenticator.options = { window: 1 };

    if (!authenticator.check(code, setupData.appSecret || "")) {
      await recordAttemptFailure(db, uid, "setup_authenticator");
      return res.status(401).json({ error: "Invalid authenticator code." });
    }

    await clearAttemptFailures(db, uid, "setup_authenticator");

    await db.collection("twoFactorSecrets").doc(uid).set({
      appSecret: setupData.appSecret,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    }, { merge: true });

    await db.collection("users").doc(uid).set({
      twoFactor: {
        appEnabled: true,
        appUpdatedAt: admin.firestore.FieldValue.serverTimestamp()
      },
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    }, { merge: true });

    await setupRef.delete().catch(function () {});
    await createLoginTwoFactorSession(uid, res).catch(function () {});

    const refreshed = await getUserSecurityData(uid);

    return res.status(200).json({
      success: true,
      twoFactor: refreshed.twoFactor
    });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      error: error.message || "Could not verify authenticator setup."
    });
  }
}

async function disableAuthenticator(req, res) {
  try {
    if (req.method !== "POST") {
      return res.status(405).json({ error: "Method not allowed" });
    }

    const decodedUser = await getAuthenticatedUser(req);
    const uid = decodedUser.uid;
    const code = cleanCode((req.body || {}).code);

    if (!/^\d{6}$/.test(code)) {
      return res.status(400).json({ error: "Please enter the 6-digit authenticator code." });
    }

    const db = admin.firestore();
    const securityData = await getUserSecurityData(uid);

    if (!securityData.twoFactor.appEnabled) {
      return res.status(400).json({ error: "Authenticator app 2FA is already disabled." });
    }

    const secret = await getAuthenticatorSecret(db, uid, securityData.userData);

    if (!secret) {
      return res.status(400).json({ error: "Authenticator app is not set up." });
    }

    await checkAttemptLock(db, uid, "disable_authenticator");

    authenticator.options = { window: 1 };

    if (!authenticator.check(code, secret)) {
      await recordAttemptFailure(db, uid, "disable_authenticator");
      return res.status(401).json({ error: "Invalid authenticator code." });
    }

    await clearAttemptFailures(db, uid, "disable_authenticator");
    await db.collection("twoFactorSecrets").doc(uid).delete().catch(function () {});

    await securityData.userRef.set({
      "twoFactor.appEnabled": false,
      "twoFactor.appUpdatedAt": admin.firestore.FieldValue.serverTimestamp(),
      "twoFactor.appSecret": admin.firestore.FieldValue.delete(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    }, { merge: true });

    const refreshed = await getUserSecurityData(uid);

    return res.status(200).json({
      success: true,
      twoFactor: refreshed.twoFactor
    });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      error: error.message || "Could not disable authenticator app."
    });
  }
}

async function setEmail2fa(req, res) {
  try {
    if (req.method !== "POST") {
      return res.status(405).json({ error: "Method not allowed" });
    }

    const decodedUser = await getAuthenticatedUser(req);
    const uid = decodedUser.uid;
    const enabled = Boolean((req.body || {}).enabled);
    const securityData = await requireSecurityUnlockIfNeeded(req, uid);
    const userRecord = await admin.auth().getUser(uid);
    const email = normalizeEmail(userRecord.email || decodedUser.email || "");

    if (enabled && !email) {
      return res.status(400).json({ error: "No email address found on this account." });
    }

    await securityData.userRef.set({
      "twoFactor.emailEnabled": enabled,
      "twoFactor.emailUpdatedAt": admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    }, { merge: true });

    if (enabled) {
      await createLoginTwoFactorSession(uid, res).catch(function () {});
    }

    const refreshed = await getUserSecurityData(uid);

    return res.status(200).json({
      success: true,
      twoFactor: refreshed.twoFactor
    });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      error: error.message || "Could not update email 2FA."
    });
  }
}

async function loginSendEmailCode(req, res) {
  try {
    if (req.method !== "POST") {
      return res.status(405).json({ error: "Method not allowed" });
    }

    const challenge = await getLoginChallenge(req);

    if (!challenge.twoFactor || !challenge.twoFactor.emailEnabled) {
      return res.status(400).json({ error: "Email 2FA is not available for this login." });
    }

    const userRecord = await admin.auth().getUser(challenge.uid);
    const email = normalizeEmail(userRecord.email || challenge.email || "");

    if (!email) {
      return res.status(400).json({ error: "No email address found on this account." });
    }

    const db = admin.firestore();
    const code = createRandomCode();
    const salt = db.collection("_").doc().id + ":" + challenge.challengeId;

    await db.collection("loginEmailCodes").doc(challenge.challengeId).set({
      uid: challenge.uid,
      challengeId: challenge.challengeId,
      codeHash: getCodeHash(challenge.uid, code, salt),
      salt,
      attempts: 0,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      expiresAt: admin.firestore.Timestamp.fromDate(new Date(Date.now() + LOGIN_EMAIL_CODE_EXPIRES_MS))
    });

    await sendEmailCode(
      email,
      "Your AUC Atlas login code",
      "Your AUC Atlas login code",
      "Use this code to finish signing in.",
      code
    );

    return res.status(200).json({
      success: true,
      method: "email",
      maskedEmail: maskEmail(email)
    });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      error: error.message || "Could not send login code."
    });
  }
}

async function finishLoginChallenge(req, res, challenge, trustDevice) {
  await createSiteSessionForUid(req, res, challenge.uid);
  await createLoginTwoFactorSession(challenge.uid, res);

  if (trustDevice) {
    await createTrustedDevice(challenge.uid, res, req);
  }

  await clearLoginChallenge(req, res);

  const userRecord = await admin.auth().getUser(challenge.uid);

  return {
    success: true,
    user: {
      uid: challenge.uid,
      email: userRecord.email || challenge.email || "",
      emailVerified: Boolean(userRecord.emailVerified),
      displayName: userRecord.displayName || ""
    }
  };
}

async function loginVerifyEmailCode(req, res) {
  try {
    if (req.method !== "POST") {
      return res.status(405).json({ error: "Method not allowed" });
    }

    const challenge = await getLoginChallenge(req);
    const code = cleanCode((req.body || {}).code);
    const trustDevice = Boolean((req.body || {}).trustDevice);

    if (!/^\d{6}$/.test(code)) {
      return res.status(400).json({ error: "Please enter the 6-digit code." });
    }

    const codeRef = admin.firestore().collection("loginEmailCodes").doc(challenge.challengeId);
    const codeDoc = await codeRef.get();

    if (!codeDoc.exists) {
      return res.status(400).json({ error: "Please request a new login code." });
    }

    const codeData = codeDoc.data() || {};

    if (timestampToMillis(codeData.expiresAt) <= Date.now()) {
      await codeRef.delete().catch(function () {});
      return res.status(400).json({ error: "This code expired. Please request a new one." });
    }

    if (timestampToMillis(codeData.lockedUntil) > Date.now()) {
      return res.status(429).json({ error: "Too many wrong codes. Please try again later." });
    }

    const expectedHash = getCodeHash(challenge.uid, code, codeData.salt || "");

    if (expectedHash !== codeData.codeHash) {
      const attempts = Number(codeData.attempts || 0) + 1;

      await codeRef.set({
        attempts,
        lockedUntil: attempts >= 3
          ? admin.firestore.Timestamp.fromDate(new Date(Date.now() + LOCKOUT_MS))
          : null,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      }, { merge: true });

      return res.status(401).json({ error: "Invalid login code." });
    }

    await codeRef.delete().catch(function () {});

    const result = await finishLoginChallenge(req, res, challenge, trustDevice);
    return res.status(200).json(result);
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      error: error.message || "Could not verify login code."
    });
  }
}

async function loginVerifyAuthenticator(req, res) {
  try {
    if (req.method !== "POST") {
      return res.status(405).json({ error: "Method not allowed" });
    }

    const challenge = await getLoginChallenge(req);
    const code = cleanCode((req.body || {}).code);
    const trustDevice = Boolean((req.body || {}).trustDevice);

    if (!/^\d{6}$/.test(code)) {
      return res.status(400).json({ error: "Please enter the 6-digit authenticator code." });
    }

    if (!challenge.twoFactor || !challenge.twoFactor.appEnabled) {
      return res.status(400).json({ error: "Authenticator app 2FA is not available for this login." });
    }

    const db = admin.firestore();
    const userDoc = await db.collection("users").doc(challenge.uid).get();
    const userData = userDoc.exists ? userDoc.data() || {} : {};
    const secret = await getAuthenticatorSecret(db, challenge.uid, userData);

    if (!secret) {
      return res.status(400).json({ error: "Authenticator app is not set up." });
    }

    await checkAttemptLock(db, challenge.uid, "login_authenticator");

    authenticator.options = { window: 1 };

    if (!authenticator.check(code, secret)) {
      await recordAttemptFailure(db, challenge.uid, "login_authenticator");
      return res.status(401).json({ error: "Invalid authenticator code." });
    }

    await clearAttemptFailures(db, challenge.uid, "login_authenticator");

    const result = await finishLoginChallenge(req, res, challenge, trustDevice);
    return res.status(200).json(result);
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      error: error.message || "Could not verify authenticator code."
    });
  }
}

async function signOutSession(req, res) {
  try {
    if (req.method !== "POST") {
      return res.status(405).json({ error: "Method not allowed" });
    }

    const decodedUser = await getAuthenticatedUser(req);
    const uid = decodedUser.uid;
    const sessionId = cleanString((req.body || {}).sessionId, 128);

    if (!sessionId) {
      return res.status(400).json({ error: "Session not found." });
    }

    await requireSecurityUnlockIfNeeded(req, uid);

    const currentSession = await getCurrentAccountSession(req, uid).catch(function () {
      return null;
    });

    if (currentSession && currentSession.id === sessionId) {
      return res.status(400).json({ error: "Use Sign out everywhere to sign out this session." });
    }

    const sessionRef = admin.firestore().collection("accountSessions").doc(sessionId);
    const sessionDoc = await sessionRef.get();

    if (!sessionDoc.exists) {
      return res.status(404).json({ error: "Session not found." });
    }

    const sessionData = sessionDoc.data() || {};

    if (sessionData.uid !== uid) {
      return res.status(403).json({ error: "You cannot sign out this session." });
    }

    await sessionRef.set({
      revokedAt: admin.firestore.FieldValue.serverTimestamp(),
      revokedBy: uid,
      revokedReason: "signed_out_from_account"
    }, { merge: true });

    return res.status(200).json({
      success: true,
      sessions: await listAccountSessions(req, uid)
    });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      error: error.message || "Could not sign out this session."
    });
  }
}

async function trustedDevices(req, res) {
  try {
    if (req.method !== "POST" && req.method !== "DELETE") {
      return res.status(405).json({ error: "Method not allowed" });
    }

    const decodedUser = await getAuthenticatedUser(req);
    const uid = decodedUser.uid;
    const trustedDeviceId = cleanString((req.body || {}).trustedDeviceId, 128);

    if (!trustedDeviceId) {
      return res.status(400).json({ error: "Trusted device not found." });
    }

    await requireSecurityUnlockIfNeeded(req, uid);
    await revokeTrustedDevice(req, res, uid, trustedDeviceId, "trusted_device_removed");

    return res.status(200).json({
      success: true,
      trustedDevices: await listTrustedDevices(req, uid)
    });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      error: error.message || "Could not remove trusted device."
    });
  }
}

async function signOutEverywhere(req, res) {
  try {
    if (req.method !== "POST") {
      return res.status(405).json({ error: "Method not allowed" });
    }

    const decodedUser = await getAuthenticatedUser(req);
    const uid = decodedUser.uid;

    await requireSecurityUnlockIfNeeded(req, uid);
    await revokeAllAccountSessions(uid, "sign_out_everywhere");
    await admin.auth().revokeRefreshTokens(uid).catch(function () {});
    await clearSecurityUnlockSession(req, res).catch(function () {});
    clearLoginTwoFactorCookie(res);
    await clearSiteSessionCookie(req, res).catch(function () {});

    return res.status(200).json({
      success: true
    });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      error: error.message || "Could not sign out from all devices."
    });
  }
}

async function deleteCollectionByField(db, collectionName, fieldName, value) {
  while (true) {
    const snapshot = await db.collection(collectionName)
      .where(fieldName, "==", value)
      .limit(400)
      .get();

    if (snapshot.empty) {
      return;
    }

    const batch = db.batch();

    snapshot.docs.forEach(function (doc) {
      batch.delete(doc.ref);
    });

    await batch.commit();

    if (snapshot.size < 400) {
      return;
    }
  }
}

async function deleteKnownTwoFactorAttemptDocs(db, uid) {
  const batch = db.batch();

  [
    "login_authenticator",
    "setup_authenticator",
    "disable_authenticator",
    "security_panel_app"
  ].forEach(function (purpose) {
    batch.delete(db.collection("twoFactorAttempts").doc(uid + "_" + purpose));
  });

  await batch.commit();
}

async function deleteAccount(req, res) {
  try {
    if (req.method !== "POST") {
      return res.status(405).json({ error: "Method not allowed" });
    }

    const decodedUser = await getAuthenticatedUser(req);
    const uid = decodedUser.uid;
    const confirmation = cleanString((req.body || {}).confirmation, 12).toUpperCase();

    if (confirmation !== "DELETE") {
      return res.status(400).json({ error: "Type DELETE to confirm." });
    }

    await requireSecurityUnlockIfNeeded(req, uid);

    const db = admin.firestore();

    await Promise.all([
      deleteCollectionByField(db, "accountSessions", "uid", uid),
      deleteCollectionByField(db, "trustedDevices", "uid", uid),
      deleteCollectionByField(db, "securityPasswordSessions", "uid", uid),
      deleteCollectionByField(db, "loginTwoFactorSessions", "uid", uid),
      deleteCollectionByField(db, "loginChallenges", "uid", uid),
      deleteCollectionByField(db, "loginEmailCodes", "uid", uid)
    ]);

    await Promise.all([
      db.collection("users").doc(uid).delete().catch(function () {}),
      db.collection("twoFactorSecrets").doc(uid).delete().catch(function () {}),
      db.collection("authenticatorSetupSecrets").doc(uid).delete().catch(function () {}),
      db.collection("securityPasswordCodes").doc(uid).delete().catch(function () {}),
      deleteKnownTwoFactorAttemptDocs(db, uid).catch(function () {})
    ]);

    await revokeAllTrustedDevices(uid, uid, "account_deleted").catch(function () {});
    await clearSecurityUnlockSession(req, res).catch(function () {});
    clearLoginTwoFactorCookie(res);
    clearTrustedDeviceCookie(res);
    await clearSiteSessionCookie(req, res).catch(function () {});
    await admin.auth().deleteUser(uid);

    return res.status(200).json({
      success: true
    });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      error: error.message || "Could not delete your account."
    });
  }
}

module.exports = {
  changePassword,
  setupAuthenticator,
  verifyAuthenticatorSetup,
  disableAuthenticator,
  setEmail2fa,
  loginSendEmailCode,
  loginVerifyEmailCode,
  loginVerifyAuthenticator,
  signOutSession,
  trustedDevices,
  signOutEverywhere,
  deleteAccount
};
