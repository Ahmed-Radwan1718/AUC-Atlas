const crypto = require("crypto");
const admin = require("../_lib/firebaseAdmin");

const {
  signInWithPassword,
  createSiteSessionFromIdToken,
  createLoginChallenge,
  createLoginTwoFactorSession,
  getCurrentTrustedDevice
} = require("../_lib/securityHelpers");

const LOGIN_ATTEMPT_WINDOW_MS = 24 * 60 * 60 * 1000;
const THIRTY_MINUTES_MS = 30 * 60 * 1000;
const ONE_HOUR_MS = 60 * 60 * 1000;
const LOGIN_OPTIONAL_TASK_TIMEOUT_MS = 1200;

async function runOptionalLoginTask(task, fallbackValue) {
  let timeoutId;

  try {
    return await Promise.race([
      Promise.resolve().then(task),
      new Promise(function (resolve) {
        timeoutId = setTimeout(function () {
          resolve(fallbackValue);
        }, LOGIN_OPTIONAL_TASK_TIMEOUT_MS);
      })
    ]);
  } catch (error) {
    if (error && error.statusCode) {
      throw error;
    }

    return fallbackValue;
  } finally {
    clearTimeout(timeoutId);
  }
}

function cleanEmail(value) {
  return String(value || "").trim().toLowerCase();
}

function cleanPassword(value) {
  return String(value || "");
}

function getClientIp(req) {
  const forwardedFor = req.headers["x-forwarded-for"];

  if (typeof forwardedFor === "string" && forwardedFor.trim()) {
    return forwardedFor.split(",")[0].trim();
  }

  if (Array.isArray(forwardedFor) && forwardedFor[0]) {
    return String(forwardedFor[0]).split(",")[0].trim();
  }

  return String(
    req.headers["cf-connecting-ip"] ||
    req.headers["x-real-ip"] ||
    req.socket?.remoteAddress ||
    "unknown-ip"
  ).trim();
}

function getHash(value) {
  const secret = process.env.SECURITY_CODE_SECRET || process.env.FIREBASE_PRIVATE_KEY || "auc-atlas-login-rate-limit-secret";

  return crypto
    .createHmac("sha256", secret)
    .update(String(value))
    .digest("hex");
}

function getLoginAttemptRef(email, ipAddress) {
  const emailHash = getHash("email:" + email);
  const ipHash = getHash("ip:" + ipAddress);
  const comboHash = getHash("login:" + email + ":" + ipAddress);

  return {
    ref: admin.firestore().collection("loginAttempts").doc(comboHash),
    emailHash,
    ipHash,
    comboHash
  };
}

function timestampToMillis(value) {
  if (!value) {
    return 0;
  }

  if (typeof value.toMillis === "function") {
    return value.toMillis();
  }

  if (typeof value.toDate === "function") {
    return value.toDate().getTime();
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 0 : date.getTime();
}

function minutesLeft(timestampMs) {
  return Math.max(1, Math.ceil((timestampMs - Date.now()) / 60000));
}

function createLockError(lockedUntilMs) {
  const error = new Error("Too many failed login attempts. Try again in " + minutesLeft(lockedUntilMs) + " minutes.");
  error.statusCode = 429;
  return error;
}

async function checkLoginRateLimit(email, ipAddress) {
  const attempt = getLoginAttemptRef(email, ipAddress);
  const attemptDoc = await attempt.ref.get();

  if (!attemptDoc.exists) {
    return;
  }

  const data = attemptDoc.data() || {};
  const lockedUntilMs = timestampToMillis(data.lockedUntil);
  const windowStartedAtMs = timestampToMillis(data.windowStartedAt);

  if (lockedUntilMs > Date.now()) {
    throw createLockError(lockedUntilMs);
  }

  if (windowStartedAtMs && Date.now() - windowStartedAtMs > LOGIN_ATTEMPT_WINDOW_MS) {
    await attempt.ref.delete().catch(function () {});
  }
}

async function recordFailedLoginAttempt(email, ipAddress) {
  const db = admin.firestore();
  const attempt = getLoginAttemptRef(email, ipAddress);

  let result = {
    failedCount: 1,
    lockedUntilMs: 0
  };

  await db.runTransaction(async function (transaction) {
    const now = Date.now();
    const nowTimestamp = admin.firestore.Timestamp.fromMillis(now);
    const attemptDoc = await transaction.get(attempt.ref);
    const data = attemptDoc.exists ? attemptDoc.data() || {} : {};

    const windowStartedAtMs = timestampToMillis(data.windowStartedAt);
    const oldWindow = !windowStartedAtMs || now - windowStartedAtMs > LOGIN_ATTEMPT_WINDOW_MS;

    const failedCount = (oldWindow ? 0 : Number(data.failedCount || 0)) + 1;

    let lockedUntil = null;
    let lockedUntilMs = 0;
    let lockLevel = 0;

    if (failedCount >= 20) {
      lockedUntilMs = now + ONE_HOUR_MS;
      lockedUntil = admin.firestore.Timestamp.fromMillis(lockedUntilMs);
      lockLevel = 20;
    } else if (failedCount >= 10) {
      lockedUntilMs = now + THIRTY_MINUTES_MS;
      lockedUntil = admin.firestore.Timestamp.fromMillis(lockedUntilMs);
      lockLevel = 10;
    }

    transaction.set(attempt.ref, {
      emailHash: attempt.emailHash,
      ipHash: attempt.ipHash,
      comboHash: attempt.comboHash,
      failedCount,
      lockLevel,
      lockedUntil,
      windowStartedAt: oldWindow ? nowTimestamp : data.windowStartedAt,
      lastFailedAt: nowTimestamp,
      updatedAt: nowTimestamp
    }, { merge: true });

    result = {
      failedCount,
      lockedUntilMs
    };
  });

  return result;
}

async function clearFailedLoginAttempts(email, ipAddress) {
  const attempt = getLoginAttemptRef(email, ipAddress);
  await attempt.ref.delete().catch(function () {});
}

async function createCompatibleSiteSession(req, res, idToken) {
  return await createSiteSessionFromIdToken(idToken, res, req);
}

async function createCompatibleTwoFactorSession(req, res, uid) {
  if (typeof createLoginTwoFactorSession !== "function") {
    return;
  }

  return await createLoginTwoFactorSession(uid, res);
}

async function createCompatibleLoginChallenge(req, res, payload) {
  return await createLoginChallenge(payload.uid, res, payload);
}

function getSafeTwoFactorSettings(userData) {
  const twoFactor = userData && userData.twoFactor && typeof userData.twoFactor === "object"
    ? userData.twoFactor
    : {};

  return {
    appEnabled: Boolean(twoFactor.appEnabled),
    emailEnabled: Boolean(twoFactor.emailEnabled)
  };
}

module.exports = async function handler(req, res) {
  try {
    if (req.method !== "POST") {
      return res.status(405).json({ error: "Method not allowed" });
    }

    const email = cleanEmail((req.body || {}).email);
    const password = cleanPassword((req.body || {}).password);
    const ipAddress = getClientIp(req);

    if (!email || !password) {
      return res.status(400).json({ error: "Please enter your email and password." });
    }

    await runOptionalLoginTask(function () {
      return checkLoginRateLimit(email, ipAddress);
    }, null);

    let loginResult;

    try {
      loginResult = await signInWithPassword(email, password);
    } catch (error) {
      if (error && error.statusCode === 504) {
        return res.status(504).json({
          error: error.message || "Login took too long. Please try again."
        });
      }

      const failedAttempt = await runOptionalLoginTask(function () {
        return recordFailedLoginAttempt(email, ipAddress);
      }, {
        failedCount: 0,
        lockedUntilMs: 0
      });

      if (failedAttempt.lockedUntilMs) {
        return res.status(429).json({
          error: "Too many failed login attempts. Try again in " + minutesLeft(failedAttempt.lockedUntilMs) + " minutes."
        });
      }

      return res.status(401).json({
        error: "Incorrect email or password."
      });
    }

    await runOptionalLoginTask(function () {
      return clearFailedLoginAttempts(email, ipAddress);
    }, null);

    const uid = loginResult.localId || loginResult.uid;

    if (!uid || !loginResult.idToken) {
      return res.status(500).json({ error: "Could not start login session." });
    }

    const fallbackUserRecord = {
      email: loginResult.email || email,
      emailVerified: Boolean(loginResult.emailVerified),
      displayName: loginResult.displayName || ""
    };
    const userRecord = await runOptionalLoginTask(function () {
      return admin.auth().getUser(uid);
    }, fallbackUserRecord);
    const userDoc = await runOptionalLoginTask(function () {
      return admin.firestore().collection("users").doc(uid).get();
    }, null);
    const userData = userDoc && userDoc.exists ? userDoc.data() || {} : {};
    const twoFactor = getSafeTwoFactorSettings(userData);
    const requiresTwoFactor = twoFactor.appEnabled || twoFactor.emailEnabled;

    if (requiresTwoFactor) {
      const trustedDevice = typeof getCurrentTrustedDevice === "function"
        ? await runOptionalLoginTask(function () {
            return getCurrentTrustedDevice(req, uid, { touch: true });
          }, null)
        : null;

      if (trustedDevice) {
        await createCompatibleSiteSession(req, res, loginResult.idToken);
        await createCompatibleTwoFactorSession(req, res, uid);

        return res.status(200).json({
          success: true,
          requiresTwoFactor: false,
          twoFactorRequired: false,
          trustedDevice: true,
          user: {
            uid,
            email: userRecord.email || email,
            emailVerified: Boolean(userRecord.emailVerified),
            displayName: userRecord.displayName || userData.fullName || ""
          }
        });
      }

      await createCompatibleLoginChallenge(req, res, {
        uid,
        email: userRecord.email || email,
        twoFactor
      });

      return res.status(200).json({
        success: true,
        requiresTwoFactor: true,
        twoFactorRequired: true,
        twoFactor,
        methods: {
          app: twoFactor.appEnabled,
          email: twoFactor.emailEnabled
        },
        user: {
          uid,
          email: userRecord.email || email,
          emailVerified: Boolean(userRecord.emailVerified),
          displayName: userRecord.displayName || userData.fullName || ""
        }
      });
    }

    await createCompatibleSiteSession(req, res, loginResult.idToken);

    return res.status(200).json({
      success: true,
      requiresTwoFactor: false,
      twoFactorRequired: false,
      user: {
        uid,
        email: userRecord.email || email,
        emailVerified: Boolean(userRecord.emailVerified),
        displayName: userRecord.displayName || userData.fullName || ""
      }
    });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      error: error.message || "Could not log in."
    });
  }
};
