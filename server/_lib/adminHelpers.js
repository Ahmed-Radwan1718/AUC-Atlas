const crypto = require("crypto");
const admin = require("./firebaseAdmin");
const { authenticator } = require("otplib");

const {
  getSiteSessionUser,
  signInWithPassword,
  getAuthenticatorSecret,
  consumeAuthenticatorAttempt,
  clearAuthenticatorAttempts
} = require("./securityHelpers");

const ADMIN_ACCESS_EXPIRES_MS =
  10 * 60 * 1000;
const ADMIN_ACCESS_HEADER_NAME =
  "x-auc-admin-access";

function createAdminError(
  message,
  statusCode,
  code
) {
  const error = new Error(message);

  error.statusCode = statusCode;

  if (code) {
    error.code = code;
  }

  return error;
}

function getConfiguredAdminUids() {
  return new Set(
    String(process.env.ADMIN_UIDS || "")
      .split(/[\s,]+/)
      .map(function (uid) {
        return uid.trim();
      })
      .filter(Boolean)
  );
}

function userRecordHasAdminClaim(userRecord) {
  return Boolean(
    userRecord &&
    userRecord.customClaims &&
    userRecord.customClaims.admin === true
  );
}

async function isAdminUid(uid) {
  const safeUid = String(uid || "").trim();

  if (!safeUid) {
    return false;
  }

  if (getConfiguredAdminUids().has(safeUid)) {
    return true;
  }

  try {
    const userRecord =
      await admin.auth().getUser(safeUid);

    return userRecordHasAdminClaim(
      userRecord
    );
  } catch (error) {
    if (
      error &&
      error.code === "auth/user-not-found"
    ) {
      return false;
    }

    throw error;
  }
}

async function ensureAdminUser(req) {
  const decodedUser =
    await getSiteSessionUser(req, {
      checkRevoked: true
    });
  const userRecord =
    await admin.auth().getUser(
      decodedUser.uid
    );
  const allowedByEnvironment =
    getConfiguredAdminUids().has(
      decodedUser.uid
    );
  const allowedByClaim =
    decodedUser.admin === true ||
    userRecordHasAdminClaim(userRecord);

  if (
    !allowedByEnvironment &&
    !allowedByClaim
  ) {
    throw createAdminError(
      "Administrator access is required.",
      403,
      "administrator-required"
    );
  }

  return {
    uid: decodedUser.uid,
    email: String(
      userRecord.email ||
      decodedUser.email ||
      ""
    ).trim().toLowerCase(),
    displayName: String(
      userRecord.displayName ||
      "AUC Atlas Admin"
    ).trim(),
    decodedUser,
    userRecord
  };
}

function timestampToMillis(value) {
  if (!value) {
    return 0;
  }

  if (
    typeof value.toMillis === "function"
  ) {
    return value.toMillis();
  }

  if (
    typeof value.toDate === "function"
  ) {
    return value.toDate().getTime();
  }

  if (typeof value.seconds === "number") {
    return value.seconds * 1000;
  }

  if (
    typeof value._seconds === "number"
  ) {
    return value._seconds * 1000;
  }

  const date = new Date(value);

  return Number.isNaN(date.getTime())
    ? 0
    : date.getTime();
}

function getRequestHeader(req, name) {
  const headers =
    req && req.headers ? req.headers : {};
  const lowerName =
    String(name || "").toLowerCase();
  const value =
    headers[name] ||
    headers[lowerName];

  return Array.isArray(value)
    ? String(value[0] || "")
    : String(value || "");
}

function createAdminAccessError(message) {
  return createAdminError(
    message ||
      "Enter your administrator password to continue.",
    403,
    "admin-fresh-auth-required"
  );
}

function getAdminSessionId(actor) {
  const siteSessionId = String(
    actor &&
    actor.decodedUser &&
    actor.decodedUser.siteSessionId
      ? actor.decodedUser.siteSessionId
      : ""
  ).trim();

  if (
    !/^[a-f0-9]{64}$/i.test(
      siteSessionId
    )
  ) {
    throw createAdminAccessError(
      "Your administrator session is invalid. Log in again."
    );
  }

  return siteSessionId;
}

function getAdminAccessHash(
  uid,
  siteSessionId,
  token
) {
  return crypto
    .createHash("sha256")
    .update(
      "admin-access:" +
      uid +
      ":" +
      siteSessionId +
      ":" +
      token
    )
    .digest("hex");
}

function safeEqualHex(
  savedValue,
  submittedValue
) {
  const saved = String(savedValue || "");
  const submitted = String(
    submittedValue || ""
  );

  if (
    !/^[a-f0-9]{64}$/i.test(saved) ||
    !/^[a-f0-9]{64}$/i.test(submitted)
  ) {
    return false;
  }

  const savedBuffer = Buffer.from(
    saved,
    "hex"
  );
  const submittedBuffer = Buffer.from(
    submitted,
    "hex"
  );

  return (
    savedBuffer.length ===
      submittedBuffer.length &&
    crypto.timingSafeEqual(
      savedBuffer,
      submittedBuffer
    )
  );
}

function getAdminAccessRef(actor) {
  const siteSessionId =
    getAdminSessionId(actor);

  return admin.firestore()
    .collection("users")
    .doc(actor.uid)
    .collection("adminAccess")
    .doc(siteSessionId);
}

async function getAdminTwoFactorState(uid) {
  const userRef = admin.firestore()
    .collection("users")
    .doc(uid);
  const results = await Promise.all([
    userRef.get(),
    getAuthenticatorSecret(uid)
  ]);
  const userDoc = results[0];
  const secret = String(
    results[1] || ""
  ).trim();
  const userData = userDoc.exists
    ? userDoc.data() || {}
    : {};
  const twoFactor =
    userData.twoFactor &&
    typeof userData.twoFactor === "object"
      ? userData.twoFactor
      : {};

  return {
    requiresTwoFactor: Boolean(
      twoFactor.appEnabled ||
      secret
    ),
    secret
  };
}

async function getAdminAuthenticationRequirements(
  actor
) {
  const twoFactor =
    await getAdminTwoFactorState(
      actor.uid
    );

  return {
    requiresPassword: true,
    requiresTwoFactor:
      twoFactor.requiresTwoFactor,
    admin: {
      uid: actor.uid,
      email: actor.email,
      displayName: actor.displayName
    }
  };
}

function createAdminChallengeError(
  message
) {
  const error = createAdminError(
    message ||
      "Administrator verification expired. Enter your password again.",
    401,
    "admin-auth-challenge-invalid"
  );

  error.requiresTwoFactor = true;

  return error;
}

function getAdminChallengeHash(
  uid,
  siteSessionId,
  token
) {
  return crypto
    .createHash("sha256")
    .update(
      "admin-auth-challenge:" +
      uid +
      ":" +
      siteSessionId +
      ":" +
      token
    )
    .digest("hex");
}

async function createAdminAccess(
  actor,
  authenticatorVerified
) {
  const siteSessionId =
    getAdminSessionId(actor);
  const token = crypto
    .randomBytes(32)
    .toString("hex");
  const expiresAt = new Date(
    Date.now() +
      ADMIN_ACCESS_EXPIRES_MS
  );
  const accessRef =
    getAdminAccessRef(actor);

  await accessRef.set({
    uid: actor.uid,
    siteSessionId,
    tokenHash: getAdminAccessHash(
      actor.uid,
      siteSessionId,
      token
    ),
    passwordVerified: true,
    authenticatorVerified:
      Boolean(
        authenticatorVerified
      ),
    createdAt:
      admin.firestore.FieldValue
        .serverTimestamp(),
    expiresAt:
      admin.firestore.Timestamp
        .fromDate(expiresAt)
  });

  return {
    success: true,
    adminAccessToken: token,
    adminAccessExpiresAt:
      expiresAt.toISOString(),
    requiresTwoFactor:
      Boolean(
        authenticatorVerified
      )
  };
}

async function createAdminChallenge(
  actor
) {
  const siteSessionId =
    getAdminSessionId(actor);
  const token = crypto
    .randomBytes(32)
    .toString("hex");
  const expiresAt = new Date(
    Date.now() +
      ADMIN_ACCESS_EXPIRES_MS
  );
  const accessRef =
    getAdminAccessRef(actor);

  await accessRef.set({
    uid: actor.uid,
    siteSessionId,
    challengeTokenHash:
      getAdminChallengeHash(
        actor.uid,
        siteSessionId,
        token
      ),
    passwordVerified: true,
    authenticatorVerified: false,
    createdAt:
      admin.firestore.FieldValue
        .serverTimestamp(),
    expiresAt:
      admin.firestore.Timestamp
        .fromDate(expiresAt)
  });

  return {
    token,
    expiresAt
  };
}

async function requireAdminChallenge(
  actor,
  tokenValue
) {
  const token = String(
    tokenValue || ""
  ).trim();

  if (
    !/^[a-f0-9]{64}$/i.test(token)
  ) {
    throw createAdminChallengeError();
  }

  const siteSessionId =
    getAdminSessionId(actor);
  const accessRef =
    getAdminAccessRef(actor);
  const accessDoc =
    await accessRef.get();

  if (!accessDoc.exists) {
    throw createAdminChallengeError();
  }

  const accessData =
    accessDoc.data() || {};
  const expiresAtMs =
    timestampToMillis(
      accessData.expiresAt
    );

  if (
    !expiresAtMs ||
    expiresAtMs <= Date.now()
  ) {
    await accessRef
      .delete()
      .catch(function () {});

    throw createAdminChallengeError(
      "Administrator verification expired. Enter your password again."
    );
  }

  if (
    String(accessData.uid || "") !==
      actor.uid ||
    String(
      accessData.siteSessionId || ""
    ) !== siteSessionId ||
    accessData.passwordVerified !==
      true ||
    accessData.authenticatorVerified ===
      true
  ) {
    throw createAdminChallengeError();
  }

  const savedHash = String(
    accessData.challengeTokenHash || ""
  );
  const submittedHash =
    getAdminChallengeHash(
      actor.uid,
      siteSessionId,
      token
    );

  if (
    !safeEqualHex(
      savedHash,
      submittedHash
    )
  ) {
    throw createAdminChallengeError();
  }

  return {
    token,
    siteSessionId,
    accessRef
  };
}

async function consumeAdminChallenge(
  actor,
  tokenValue
) {
  const validated =
    await requireAdminChallenge(
      actor,
      tokenValue
    );

  await admin.firestore()
    .runTransaction(
      async function (transaction) {
        const accessDoc =
          await transaction.get(
            validated.accessRef
          );

        if (!accessDoc.exists) {
          throw createAdminChallengeError();
        }

        const accessData =
          accessDoc.data() || {};
        const expiresAtMs =
          timestampToMillis(
            accessData.expiresAt
          );
        const savedHash = String(
          accessData.challengeTokenHash ||
          ""
        );
        const submittedHash =
          getAdminChallengeHash(
            actor.uid,
            validated.siteSessionId,
            validated.token
          );

        if (
          !expiresAtMs ||
          expiresAtMs <= Date.now() ||
          String(
            accessData.uid || ""
          ) !== actor.uid ||
          String(
            accessData.siteSessionId ||
            ""
          ) !==
            validated.siteSessionId ||
          accessData.passwordVerified !==
            true ||
          accessData.authenticatorVerified ===
            true ||
          !safeEqualHex(
            savedHash,
            submittedHash
          )
        ) {
          throw createAdminChallengeError();
        }

        transaction.delete(
          validated.accessRef
        );
      }
    );
}

async function authenticateAdminPassword(
  actor,
  passwordValue
) {
  const password = String(
    passwordValue || ""
  ).slice(0, 1024);

  if (!password) {
    throw createAdminError(
      "Enter your administrator account password.",
      400,
      "admin-password-required"
    );
  }

  await consumeAuthenticatorAttempt(
    actor.uid,
    "admin-password"
  );

  let passwordResult;

  try {
    passwordResult =
      await signInWithPassword(
        actor.email,
        password
      );
  } catch (error) {
    throw createAdminError(
      "Incorrect administrator password.",
      401,
      "admin-password-invalid"
    );
  }

  if (
    String(
      passwordResult.localId || ""
    ) !== actor.uid
  ) {
    throw createAdminError(
      "Incorrect administrator password.",
      401,
      "admin-password-invalid"
    );
  }

  await clearAuthenticatorAttempts(
    actor.uid,
    "admin-password"
  );

  const twoFactor =
    await getAdminTwoFactorState(
      actor.uid
    );

  if (!twoFactor.requiresTwoFactor) {
    return createAdminAccess(
      actor,
      false
    );
  }

  if (!twoFactor.secret) {
    const error = createAdminError(
      "Authenticator app is not configured correctly.",
      500,
      "admin-authenticator-misconfigured"
    );

    error.requiresTwoFactor = true;
    throw error;
  }

  const challenge =
    await createAdminChallenge(actor);

  return {
    success: true,
    requiresTwoFactor: true,
    adminChallengeToken:
      challenge.token,
    adminChallengeExpiresAt:
      challenge.expiresAt
        .toISOString()
  };
}

async function verifyAdminAuthenticator(
  actor,
  challengeTokenValue,
  codeValue
) {
  const code = String(
    codeValue || ""
  )
    .replace(/\D/g, "")
    .slice(0, 6);

  if (!/^\d{6}$/.test(code)) {
    const error = createAdminError(
      "Enter your 6-digit authenticator code.",
      400,
      "admin-authenticator-required"
    );

    error.requiresTwoFactor = true;
    throw error;
  }

  await requireAdminChallenge(
    actor,
    challengeTokenValue
  );

  const twoFactor =
    await getAdminTwoFactorState(
      actor.uid
    );

  if (
    !twoFactor.requiresTwoFactor ||
    !twoFactor.secret
  ) {
    const error = createAdminError(
      "Authenticator app is not configured correctly.",
      500,
      "admin-authenticator-misconfigured"
    );

    error.requiresTwoFactor = true;
    throw error;
  }

  await consumeAuthenticatorAttempt(
    actor.uid,
    "admin-two-factor"
  );

  authenticator.options = {
    window: 1
  };

  if (
    !authenticator.check(
      code,
      twoFactor.secret
    )
  ) {
    const error = createAdminError(
      "Invalid authenticator code.",
      401,
      "admin-authenticator-invalid"
    );

    error.requiresTwoFactor = true;
    throw error;
  }

  await consumeAdminChallenge(
    actor,
    challengeTokenValue
  );

  await clearAuthenticatorAttempts(
    actor.uid,
    "admin-two-factor"
  );

  return createAdminAccess(
    actor,
    true
  );
}

async function requireFreshAdminAccess(
  req,
  actor
) {
  const token = getRequestHeader(
    req,
    ADMIN_ACCESS_HEADER_NAME
  ).trim();

  if (
    !/^[a-f0-9]{64}$/i.test(token)
  ) {
    throw createAdminAccessError();
  }

  const siteSessionId =
    getAdminSessionId(actor);
  const accessRef =
    getAdminAccessRef(actor);
  const accessDoc =
    await accessRef.get();

  if (!accessDoc.exists) {
    throw createAdminAccessError();
  }

  const accessData =
    accessDoc.data() || {};
  const expiresAtMs =
    timestampToMillis(
      accessData.expiresAt
    );

  if (
    !expiresAtMs ||
    expiresAtMs <= Date.now()
  ) {
    await accessRef
      .delete()
      .catch(function () {});

    throw createAdminAccessError(
      "Administrator authentication expired. Enter your password again."
    );
  }

  if (
    String(accessData.uid || "") !==
      actor.uid ||
    String(
      accessData.siteSessionId || ""
    ) !== siteSessionId ||
    accessData.passwordVerified !==
      true
  ) {
    throw createAdminAccessError();
  }

  const savedHash = String(
    accessData.tokenHash || ""
  );
  const submittedHash =
    getAdminAccessHash(
      actor.uid,
      siteSessionId,
      token
    );

  if (
    !safeEqualHex(
      savedHash,
      submittedHash
    )
  ) {
    throw createAdminAccessError();
  }

  const twoFactor =
    await getAdminTwoFactorState(
      actor.uid
    );

  if (
    twoFactor.requiresTwoFactor &&
    accessData.authenticatorVerified !==
      true
  ) {
    throw createAdminAccessError(
      "Authenticator verification is required."
    );
  }

  return true;
}

module.exports = {
  createAdminError,
  ensureAdminUser,
  isAdminUid,
  getAdminAuthenticationRequirements,
  authenticateAdminPassword,
  verifyAdminAuthenticator,
  requireFreshAdminAccess
};
