const admin = require("../_lib/firebaseAdmin");
const QRCode = require("qrcode");
const { authenticator } = require("otplib");

const {
  getSiteSessionUser,
  getAuthenticatorSecret,
  consumeAuthenticatorAttempt,
  clearAuthenticatorAttempts,
  issueSecurityPanelAccess,
  requireSecurityPanelAccess
} = require("../_lib/securityHelpers");
const {
  encryptTotpSecret,
  decryptTotpSecret
} = require("../_lib/totpEncryption");

const SETUP_EXPIRES_MS =
  10 * 60 * 1000;
const RECENT_SETUP_AUTH_MAX_AGE_MS =
  10 * 60 * 1000;

function cleanCode(value) {
  return String(value || "")
    .trim()
    .replace(/\D/g, "");
}

function requireRecentAuthenticatorSetup(
  decodedUser
) {
  const authenticationTimeSeconds =
    Number(
      decodedUser &&
      decodedUser.auth_time
        ? decodedUser.auth_time
        : 0
    );
  const authenticationTimeMs =
    Number.isFinite(
      authenticationTimeSeconds
    )
      ? authenticationTimeSeconds *
        1000
      : 0;
  const authenticationAgeMs =
    Date.now() -
    authenticationTimeMs;

  if (
    !authenticationTimeMs ||
    authenticationAgeMs < 0 ||
    authenticationAgeMs >
      RECENT_SETUP_AUTH_MAX_AGE_MS
  ) {
    const error = new Error(
      "For your security, log out and log back in before setting up an authenticator app."
    );

    error.statusCode = 403;
    error.code =
      "recent-authentication-required";

    throw error;
  }
}

async function verifyAuthenticatorCode(
  uid,
  scope,
  code,
  secret
) {
  await consumeAuthenticatorAttempt(
    uid,
    scope
  );

  authenticator.options = { window: 1 };

  if (!authenticator.check(code, secret)) {
    return false;
  }

  await clearAuthenticatorAttempts(
    uid,
    scope
  );

  return true;
}

function timestampToMillis(value) {
  if (!value) return 0;
  if (typeof value.toMillis === "function") return value.toMillis();
  if (typeof value.toDate === "function") return value.toDate().getTime();

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 0 : date.getTime();
}

async function getTwoFactorState(uid) {
  const userRef = admin.firestore().collection("users").doc(uid);
  const userDoc = await userRef.get();
  const userData = userDoc.exists ? userDoc.data() || {} : {};
  const twoFactor = userData.twoFactor && typeof userData.twoFactor === "object"
    ? userData.twoFactor
    : {};

  return { userRef, userData, twoFactor };
}

async function handleSetup(res, decodedUser) {
  const state = await getTwoFactorState(decodedUser.uid);

  if (state.twoFactor.appEnabled) {
    return res.status(409).json({ error: "Authenticator app is already enabled." });
  }

  const userRecord = await admin.auth().getUser(decodedUser.uid);
  const email = userRecord.email || decodedUser.email || state.userData.email || "";

  if (!email) {
    return res.status(400).json({ error: "No email address found on this account." });
  }

  const secret = authenticator.generateSecret();
  const otpauthUrl = authenticator.keyuri(email, "AUC Atlas", secret);
  const qrDataUrl = await QRCode.toDataURL(otpauthUrl, {
    margin: 1,
    width: 220
  });
  const secretEncrypted =
    encryptTotpSecret(
      secret,
      "authenticator-setup:" +
        decodedUser.uid
    );

  await admin.firestore()
    .collection(
      "authenticatorSetupSessions"
    )
    .doc(decodedUser.uid)
    .set({
      secretEncrypted,
      email,
      createdAt:
        admin.firestore.FieldValue
          .serverTimestamp(),
      expiresAt:
        admin.firestore.Timestamp
          .fromDate(
            new Date(
              Date.now() +
              SETUP_EXPIRES_MS
            )
          )
    });

  return res.status(200).json({
    success: true,
    secret,
    qrDataUrl
  });
}

async function handleVerifySetup(req, res, decodedUser) {
  const code = cleanCode((req.body || {}).code);

  if (!/^\d{6}$/.test(code)) {
    return res.status(400).json({ error: "Please enter the 6-digit authenticator code." });
  }

  const setupRef = admin.firestore().collection("authenticatorSetupSessions").doc(decodedUser.uid);
  const setupDoc = await setupRef.get();

  if (!setupDoc.exists) {
    return res.status(400).json({ error: "Please restart authenticator setup." });
  }

  const setupData = setupDoc.data() || {};
  const expiresAtMs = timestampToMillis(setupData.expiresAt);

  if (!expiresAtMs || expiresAtMs < Date.now()) {
    await setupRef.delete().catch(function () {});
    return res.status(400).json({ error: "Authenticator setup expired. Please restart setup." });
  }

  const setupSecret =
    setupData.secretEncrypted
      ? decryptTotpSecret(
          setupData.secretEncrypted,
          "authenticator-setup:" +
            decodedUser.uid
        )
      : String(
          setupData.secret || ""
        ).trim();

  if (!setupSecret) {
    await setupRef
      .delete()
      .catch(function () {});

    return res.status(400).json({
      error:
        "Please restart authenticator setup."
    });
  }

  const validCode =
    await verifyAuthenticatorCode(
      decodedUser.uid,
      "setup",
      code,
      setupSecret
    );

  if (!validCode) {
    return res.status(401).json({
      error: "Invalid authenticator code."
    });
  }

  const state = await getTwoFactorState(decodedUser.uid);
  const nextTwoFactor = Object.assign({}, state.twoFactor, {
    appEnabled: true,
    appEnabledAt: state.twoFactor.appEnabledAt || admin.firestore.FieldValue.serverTimestamp(),
    appUpdatedAt: admin.firestore.FieldValue.serverTimestamp()
  });

  delete nextTwoFactor.appSecret;

  await admin.firestore()
    .collection("twoFactorSecrets")
    .doc(decodedUser.uid)
    .set({
      appSecretEncrypted:
        encryptTotpSecret(
          setupSecret,
          "authenticator-account:" +
            decodedUser.uid
        ),
      appSecret:
        admin.firestore.FieldValue
          .delete(),
      updatedAt:
        admin.firestore.FieldValue
          .serverTimestamp()
    }, { merge: true });

  await state.userRef.set({
    twoFactor: nextTwoFactor,
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  }, { merge: true });

  await state.userRef.update({
    "twoFactor.appSecret": admin.firestore.FieldValue.delete()
  }).catch(function () {});

  await setupRef.delete().catch(function () {});

  const securityAccess = await issueSecurityPanelAccess(
    decodedUser
  );

  return res.status(200).json({
    success: true,
    twoFactor: {
      appEnabled: true,
      emailEnabled: Boolean(nextTwoFactor.emailEnabled)
    },
    securityAccessToken: securityAccess.token,
    securityAccessExpiresAt: securityAccess.expiresAt
  });
}

async function handleVerifySecurityPanel(req, res, decodedUser) {
  const code = cleanCode((req.body || {}).code);
  const state = await getTwoFactorState(decodedUser.uid);

  if (!state.twoFactor.appEnabled) {
    return res.status(200).json({
      success: true,
      securityAccessRequired: false,
      securityAccessToken: ""
    });
  }

  if (!/^\d{6}$/.test(code)) {
    return res.status(400).json({
      error: "Please enter your 6-digit authenticator code."
    });
  }

  const secret = await getAuthenticatorSecret(decodedUser.uid);

  if (!secret) {
    return res.status(400).json({
      error: "Authenticator app is not configured correctly."
    });
  }

  const validCode =
    await verifyAuthenticatorCode(
      decodedUser.uid,
      "account",
      code,
      secret
    );

  if (!validCode) {
    return res.status(401).json({
      error: "Invalid authenticator code."
    });
  }

  const securityAccess = await issueSecurityPanelAccess(
    decodedUser
  );

  return res.status(200).json({
    success: true,
    securityAccessRequired: true,
    securityAccessToken: securityAccess.token,
    securityAccessExpiresAt: securityAccess.expiresAt
  });
}

async function handleDisable(req, res, decodedUser) {
  const code = cleanCode((req.body || {}).code);

  if (!/^\d{6}$/.test(code)) {
    return res.status(400).json({ error: "Please enter your 6-digit authenticator code." });
  }

  const secret = await getAuthenticatorSecret(decodedUser.uid);

  if (!secret) {
    return res.status(400).json({ error: "Authenticator app is not enabled." });
  }

  const validCode =
    await verifyAuthenticatorCode(
      decodedUser.uid,
      "account",
      code,
      secret
    );

  if (!validCode) {
    return res.status(401).json({
      error: "Invalid authenticator code."
    });
  }

  const state = await getTwoFactorState(decodedUser.uid);
  const nextTwoFactor = Object.assign({}, state.twoFactor, {
    appEnabled: false,
    appDisabledAt: admin.firestore.FieldValue.serverTimestamp(),
    appUpdatedAt: admin.firestore.FieldValue.serverTimestamp()
  });

  delete nextTwoFactor.appSecret;

  await admin.firestore().collection("twoFactorSecrets").doc(decodedUser.uid).delete().catch(function () {});

  await state.userRef.set({
    twoFactor: nextTwoFactor,
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  }, { merge: true });

  await state.userRef.update({
    "twoFactor.appSecret": admin.firestore.FieldValue.delete()
  }).catch(function () {});

  return res.status(200).json({
    success: true,
    twoFactor: {
      appEnabled: false,
      emailEnabled: Boolean(nextTwoFactor.emailEnabled)
    }
  });
}

module.exports = async function handler(req, res) {
  try {
    if (req.method !== "POST") {
      return res.status(405).json({ error: "Method not allowed" });
    }

    const decodedUser = await getSiteSessionUser(req, {
      checkRevoked: true
    });

    const action = String((req.body || {}).action || "").trim();

    if (action === "setup") {
      requireRecentAuthenticatorSetup(
        decodedUser
      );

      return await handleSetup(
        res,
        decodedUser
      );
    }

    if (action === "verify-setup") {
      return await handleVerifySetup(req, res, decodedUser);
    }

    if (action === "verify-security-panel") {
      return await handleVerifySecurityPanel(
        req,
        res,
        decodedUser
      );
    }

    if (action === "disable") {
      await requireSecurityPanelAccess(req, decodedUser);
      return await handleDisable(req, res, decodedUser);
    }

    return res.status(400).json({ error: "Unknown authenticator action." });
  } catch (error) {
    if (error.retryAfterSeconds) {
      res.setHeader(
        "Retry-After",
        String(error.retryAfterSeconds)
      );
    }

    return res
      .status(error.statusCode || 500)
      .json({
        error:
          error.message ||
          "Could not update authenticator app."
      });
  }
};
