const crypto = require("crypto");
const admin = require("./firebaseAdmin");

const IS_PRODUCTION =
  process.env.NODE_ENV === "production" || process.env.VERCEL_ENV === "production";

const SITE_SESSION_COOKIE_NAME = IS_PRODUCTION
  ? "__Host-auc_session"
  : "auc_session";

const LOGIN_CHALLENGE_COOKIE_NAME = IS_PRODUCTION
  ? "__Host-auc_login_challenge"
  : "auc_login_challenge";

const LOGIN_2FA_COOKIE_NAME = IS_PRODUCTION
  ? "__Host-auc_login_2fa"
  : "auc_login_2fa";

const ACCOUNT_SESSION_COOKIE_NAME = IS_PRODUCTION
  ? "__Host-auc_account_session"
  : "auc_account_session";

const TRUSTED_DEVICE_COOKIE_NAME = IS_PRODUCTION
  ? "__Host-auc_trusted_device"
  : "auc_trusted_device";

const SITE_SESSION_EXPIRES_MS = 5 * 24 * 60 * 60 * 1000;
const ACCOUNT_SESSION_EXPIRES_MS = SITE_SESSION_EXPIRES_MS;
const ACCOUNT_SESSION_TOUCH_COOLDOWN_MS = 15 * 60 * 1000;
const TRUSTED_DEVICE_EXPIRES_MS = 30 * 24 * 60 * 60 * 1000;
const LOGIN_CHALLENGE_EXPIRES_MS = 10 * 60 * 1000;
const LOGIN_2FA_SESSION_MINUTES = 30;

const MAX_2FA_ATTEMPTS = 3;
const ATTEMPT_WINDOW_MS = 30 * 60 * 1000;
const LOCKOUT_MS = 30 * 60 * 1000;

function getSecuritySecret() {
  if (!process.env.SECURITY_CODE_SECRET) {
    throw new Error("missing-security-code-secret");
  }

  return process.env.SECURITY_CODE_SECRET;
}

function getFirebaseWebApiKey() {
  if (!process.env.FIREBASE_WEB_API_KEY) {
    throw new Error("missing-firebase-web-api-key");
  }

  return process.env.FIREBASE_WEB_API_KEY;
}

function getCodeHash(uid, code, salt) {
  return crypto
    .createHmac("sha256", getSecuritySecret())
    .update(uid + ":" + code + ":" + salt)
    .digest("hex");
}

function getSessionHash(uid, token, salt) {
  return crypto
    .createHmac("sha256", getSecuritySecret())
    .update(uid + ":" + token + ":" + salt)
    .digest("hex");
}

function getLoginTwoFactorSessionHash(uid, token, salt) {
  return crypto
    .createHmac("sha256", getSecuritySecret())
    .update("login-2fa:" + uid + ":" + token + ":" + salt)
    .digest("hex");
}

function getAccountSessionHash(uid, sessionId, token, salt) {
  return crypto
    .createHmac("sha256", getSecuritySecret())
    .update("account-session:" + uid + ":" + sessionId + ":" + token + ":" + salt)
    .digest("hex");
}

function getTrustedDeviceHash(uid, trustedDeviceId, token, salt) {
  return crypto
    .createHmac("sha256", getSecuritySecret())
    .update("trusted-device:" + uid + ":" + trustedDeviceId + ":" + token + ":" + salt)
    .digest("hex");
}

function getLoginChallengeHash(uid, challengeId, token, salt) {
  return crypto
    .createHmac("sha256", getSecuritySecret())
    .update("login-challenge:" + uid + ":" + challengeId + ":" + token + ":" + salt)
    .digest("hex");
}

function createRandomCode() {
  return crypto.randomInt(100000, 1000000).toString();
}

function createRandomToken() {
  return crypto.randomBytes(32).toString("hex");
}

function isExpired(timestamp) {
  if (!timestamp) {
    return true;
  }

  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  return date.getTime() <= Date.now();
}

function getCookie(req, name) {
  const cookieHeader = req.headers.cookie || "";
  const cookies = cookieHeader.split(";");

  for (const cookie of cookies) {
    const parts = cookie.trim().split("=");

    if (parts[0] === name) {
      return decodeURIComponent(parts.slice(1).join("="));
    }
  }

  return "";
}

function appendSetCookie(res, cookieValue) {
  const existing = res.getHeader("Set-Cookie");

  if (!existing) {
    res.setHeader("Set-Cookie", cookieValue);
    return;
  }

  if (Array.isArray(existing)) {
    res.setHeader("Set-Cookie", existing.concat(cookieValue));
    return;
  }

  res.setHeader("Set-Cookie", [existing, cookieValue]);
}

function setCookie(res, name, value, maxAgeSeconds) {
  const secureFlag = IS_PRODUCTION ? "; Secure" : "";

  appendSetCookie(
    res,
    name +
      "=" +
      encodeURIComponent(value) +
      "; Max-Age=" +
      maxAgeSeconds +
      "; Path=/; HttpOnly; SameSite=Lax" +
      secureFlag
  );
}

function clearCookie(res, name) {
  const secureFlag = IS_PRODUCTION ? "; Secure" : "";

  appendSetCookie(
    res,
    name +
      "=; Max-Age=0; Path=/; HttpOnly; SameSite=Lax" +
      secureFlag
  );
}

function isRequestLike(value) {
  return Boolean(value && typeof value === "object" && value.headers);
}

function getSessionClientIp(req) {
  if (!isRequestLike(req)) {
    return "";
  }

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
    ""
  ).trim();
}

function getSessionBrowserLabel(userAgent) {
  const value = String(userAgent || "");

  if (/Edg\//i.test(value)) return "Microsoft Edge";
  if (/OPR\//i.test(value)) return "Opera";
  if (/Firefox\//i.test(value)) return "Firefox";
  if (/Chrome\//i.test(value)) return "Chrome";
  if (/Safari\//i.test(value) && /Version\//i.test(value)) return "Safari";

  return "Browser";
}

function getSessionPlatformLabel(userAgent) {
  const value = String(userAgent || "");

  if (/iPhone|iPad|iPod/i.test(value)) return "iOS";
  if (/Android/i.test(value)) return "Android";
  if (/Windows NT/i.test(value)) return "Windows";
  if (/Mac OS X/i.test(value)) return "macOS";
  if (/Linux/i.test(value)) return "Linux";

  return "Device";
}

function getSessionDetailsFromRequest(req) {
  const userAgent = isRequestLike(req) ? String(req.headers["user-agent"] || "") : "";
  const browserLabel = getSessionBrowserLabel(userAgent);
  const platformLabel = getSessionPlatformLabel(userAgent);

  return {
    userAgent,
    ipAddress: getSessionClientIp(req),
    browserLabel,
    platformLabel,
    deviceLabel: browserLabel + " on " + platformLabel
  };
}

function sessionTimestampToMillis(value) {
  if (!value) return 0;
  if (typeof value.toMillis === "function") return value.toMillis();
  if (typeof value.toDate === "function") return value.toDate().getTime();

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 0 : date.getTime();
}

function serializeSessionTimestamp(value) {
  const millis = sessionTimestampToMillis(value);
  return millis ? new Date(millis).toISOString() : null;
}

function getAccountSessionCookieParts(req) {
  if (!isRequestLike(req)) {
    return null;
  }

  const cookieValue = getCookie(req, ACCOUNT_SESSION_COOKIE_NAME);

  if (!cookieValue || !cookieValue.includes(".")) {
    return null;
  }

  const parts = cookieValue.split(".");
  const sessionId = parts[0];
  const token = parts.slice(1).join(".");

  if (!sessionId || !token) {
    return null;
  }

  return {
    sessionId,
    token
  };
}

async function createAccountSession(uid, res, req) {
  if (!uid || !res) {
    return null;
  }

  const db = admin.firestore();
  const sessionRef = db.collection("accountSessions").doc();
  const sessionId = sessionRef.id;
  const token = createRandomToken();
  const salt = db.collection("_").doc().id;
  const details = getSessionDetailsFromRequest(req);

  const sessionSaved = await Promise.race([
    sessionRef.set({
      uid,
      sessionHash: getAccountSessionHash(uid, sessionId, token, salt),
      salt,
      userAgent: details.userAgent,
      ipAddress: details.ipAddress,
      browserLabel: details.browserLabel,
      platformLabel: details.platformLabel,
      deviceLabel: details.deviceLabel,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      lastSeenAt: admin.firestore.FieldValue.serverTimestamp(),
      expiresAt: admin.firestore.Timestamp.fromDate(
        new Date(Date.now() + ACCOUNT_SESSION_EXPIRES_MS)
      )
    }).then(function () {
      return true;
    }).catch(function () {
      return false;
    }),
    new Promise(function (resolve) {
      setTimeout(function () {
        resolve(false);
      }, 3000);
    })
  ]);

  if (!sessionSaved) {
    clearCookie(res, ACCOUNT_SESSION_COOKIE_NAME);
    return null;
  }

  setCookie(
    res,
    ACCOUNT_SESSION_COOKIE_NAME,
    sessionId + "." + token,
    Math.floor(ACCOUNT_SESSION_EXPIRES_MS / 1000)
  );

  return {
    sessionId
  };
}

function createAccountSessionError(message, revokedReason) {
  const error = new Error(message);
  error.statusCode = 401;
  error.revokedReason = revokedReason || "";
  return error;
}

async function getCurrentAccountSession(req, uid) {
  const parts = getAccountSessionCookieParts(req);

  if (!parts || !uid) {
    return null;
  }

  const sessionRef = admin.firestore().collection("accountSessions").doc(parts.sessionId);
  const sessionDoc = await sessionRef.get();

  if (!sessionDoc.exists) {
    return null;
  }

  const data = sessionDoc.data() || {};

  if (data.uid !== uid) {
    return null;
  }

  if (isExpired(data.expiresAt)) {
    await sessionRef.delete().catch(function () {});
    return null;
  }

  const submittedHash = getAccountSessionHash(uid, parts.sessionId, parts.token, data.salt || "");
  const savedBuffer = Buffer.from(data.sessionHash || "", "hex");
  const submittedBuffer = Buffer.from(submittedHash, "hex");

  if (
    savedBuffer.length !== submittedBuffer.length ||
    !crypto.timingSafeEqual(savedBuffer, submittedBuffer)
  ) {
    return null;
  }

  if (data.revokedAt) {
    throw createAccountSessionError("account-session-revoked", data.revokedReason || "");
  }

  return {
    id: parts.sessionId,
    ref: sessionRef,
    data
  };
}

async function touchCurrentAccountSession(req, uid) {
  const session = await getCurrentAccountSession(req, uid);

  if (!session) {
    return null;
  }

  const lastSeenAt = session.data.lastSeenAt;
  let lastSeenAtMs = 0;

  if (lastSeenAt && typeof lastSeenAt.toMillis === "function") {
    lastSeenAtMs = lastSeenAt.toMillis();
  } else if (lastSeenAt) {
    lastSeenAtMs = new Date(lastSeenAt).getTime() || 0;
  }

  if (lastSeenAtMs && Date.now() - lastSeenAtMs < ACCOUNT_SESSION_TOUCH_COOLDOWN_MS) {
    return session;
  }

  await session.ref.set({
    lastSeenAt: admin.firestore.FieldValue.serverTimestamp(),
    expiresAt: admin.firestore.Timestamp.fromDate(
      new Date(Date.now() + ACCOUNT_SESSION_EXPIRES_MS)
    )
  }, { merge: true });

  return session;
}

async function clearCurrentAccountSession(req) {
  const parts = getAccountSessionCookieParts(req);

  if (!parts) {
    return;
  }

  await admin.firestore().collection("accountSessions").doc(parts.sessionId).delete().catch(function () {});
}

async function listAccountSessions(req, uid) {
  if (!uid) {
    return [];
  }

  const snapshot = await admin.firestore()
    .collection("accountSessions")
    .where("uid", "==", uid)
    .limit(50)
    .get();

  const currentSession = await getCurrentAccountSession(req, uid).catch(function () {
    return null;
  });

  const expiredDeletes = [];
  const sessions = [];

  snapshot.docs.forEach(function (doc) {
    const data = doc.data() || {};

    if (data.revokedAt) {
      return;
    }

    if (isExpired(data.expiresAt)) {
      expiredDeletes.push(doc.ref.delete().catch(function () {}));
      return;
    }

    sessions.push({
      id: doc.id,
      deviceLabel: data.deviceLabel || "Browser session",
      browserLabel: data.browserLabel || "Browser",
      platformLabel: data.platformLabel || "Device",
      ipAddress: data.ipAddress || "",
      createdAt: serializeSessionTimestamp(data.createdAt),
      lastSeenAt: serializeSessionTimestamp(data.lastSeenAt || data.createdAt),
      expiresAt: serializeSessionTimestamp(data.expiresAt),
      current: Boolean(currentSession && currentSession.id === doc.id)
    });
  });

  await Promise.all(expiredDeletes);

  sessions.sort(function (a, b) {
    return sessionTimestampToMillis(b.lastSeenAt) - sessionTimestampToMillis(a.lastSeenAt);
  });

  return sessions;
}

function getTrustedDeviceCookieParts(req) {
  if (!isRequestLike(req)) {
    return null;
  }

  const cookieValue = getCookie(req, TRUSTED_DEVICE_COOKIE_NAME);

  if (!cookieValue || !cookieValue.includes(".")) {
    return null;
  }

  const parts = cookieValue.split(".");
  const trustedDeviceId = parts[0];
  const token = parts.slice(1).join(".");

  if (!trustedDeviceId || !token) {
    return null;
  }

  return {
    trustedDeviceId,
    token
  };
}

function cleanTrustedDeviceId(value) {
  const trustedDeviceId = String(value || "").trim();

  if (!/^[A-Za-z0-9_-]{6,128}$/.test(trustedDeviceId)) {
    return "";
  }

  return trustedDeviceId;
}

function clearTrustedDeviceCookie(res) {
  clearCookie(res, TRUSTED_DEVICE_COOKIE_NAME);
}

async function createTrustedDevice(uid, res, req) {
  if (!uid || !res) {
    return null;
  }

  const db = admin.firestore();
  const trustedDeviceRef = db.collection("trustedDevices").doc();
  const trustedDeviceId = trustedDeviceRef.id;
  const token = createRandomToken();
  const salt = db.collection("_").doc().id;
  const details = getSessionDetailsFromRequest(req);

  await trustedDeviceRef.set({
    uid,
    userId: uid,
    trustedDeviceId,
    trustedDeviceHash: getTrustedDeviceHash(uid, trustedDeviceId, token, salt),
    salt,
    deviceName: details.deviceLabel,
    browserName: details.browserLabel,
    platform: details.platformLabel,
    userAgent: details.userAgent,
    ipAddress: details.ipAddress,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    lastTrustedAt: admin.firestore.FieldValue.serverTimestamp(),
    lastUsedAt: admin.firestore.FieldValue.serverTimestamp(),
    expiresAt: admin.firestore.Timestamp.fromDate(
      new Date(Date.now() + TRUSTED_DEVICE_EXPIRES_MS)
    )
  });

  setCookie(
    res,
    TRUSTED_DEVICE_COOKIE_NAME,
    trustedDeviceId + "." + token,
    Math.floor(TRUSTED_DEVICE_EXPIRES_MS / 1000)
  );

  return {
    trustedDeviceId
  };
}

async function getCurrentTrustedDevice(req, uid, options) {
  const settings = options || {};
  const parts = getTrustedDeviceCookieParts(req);

  if (!parts || !uid) {
    return null;
  }

  const trustedDeviceRef = admin.firestore().collection("trustedDevices").doc(parts.trustedDeviceId);
  const trustedDeviceDoc = await trustedDeviceRef.get();

  if (!trustedDeviceDoc.exists) {
    return null;
  }

  const data = trustedDeviceDoc.data() || {};
  const ownerId = data.userId || data.uid || "";

  if (ownerId !== uid) {
    return null;
  }

  if (data.revokedAt || isExpired(data.expiresAt)) {
    return null;
  }

  const submittedHash = getTrustedDeviceHash(uid, parts.trustedDeviceId, parts.token, data.salt || "");
  const savedBuffer = Buffer.from(data.trustedDeviceHash || "", "hex");
  const submittedBuffer = Buffer.from(submittedHash, "hex");

  if (
    savedBuffer.length !== submittedBuffer.length ||
    !crypto.timingSafeEqual(savedBuffer, submittedBuffer)
  ) {
    return null;
  }

  if (settings.touch !== false) {
    await trustedDeviceRef.set({
      lastUsedAt: admin.firestore.FieldValue.serverTimestamp(),
      expiresAt: admin.firestore.Timestamp.fromDate(
        new Date(Date.now() + TRUSTED_DEVICE_EXPIRES_MS)
      )
    }, { merge: true });
  }

  return {
    id: parts.trustedDeviceId,
    ref: trustedDeviceRef,
    data
  };
}

async function listTrustedDevices(req, uid) {
  if (!uid) {
    return [];
  }

  const snapshot = await admin.firestore()
    .collection("trustedDevices")
    .where("uid", "==", uid)
    .limit(50)
    .get();

  const currentTrustedDevice = await getCurrentTrustedDevice(req, uid, { touch: false }).catch(function () {
    return null;
  });

  const expiredDeletes = [];
  const trustedDevices = [];

  snapshot.docs.forEach(function (doc) {
    const data = doc.data() || {};

    if (data.revokedAt) {
      return;
    }

    if (isExpired(data.expiresAt)) {
      expiredDeletes.push(doc.ref.delete().catch(function () {}));
      return;
    }

    trustedDevices.push({
      id: doc.id,
      trustedDeviceId: data.trustedDeviceId || doc.id,
      deviceName: data.deviceName || data.browserName || "Trusted device",
      browserName: data.browserName || "Browser",
      platform: data.platform || "Device",
      createdAt: serializeSessionTimestamp(data.createdAt),
      lastTrustedAt: serializeSessionTimestamp(data.lastTrustedAt || data.createdAt),
      lastUsedAt: serializeSessionTimestamp(data.lastUsedAt),
      expiresAt: serializeSessionTimestamp(data.expiresAt),
      current: Boolean(currentTrustedDevice && currentTrustedDevice.id === doc.id)
    });
  });

  await Promise.all(expiredDeletes);

  trustedDevices.sort(function (a, b) {
    return sessionTimestampToMillis(b.lastUsedAt || b.lastTrustedAt) - sessionTimestampToMillis(a.lastUsedAt || a.lastTrustedAt);
  });

  return trustedDevices;
}

async function revokeTrustedDevice(req, res, uid, trustedDeviceId, revokedReason) {
  const cleanId = cleanTrustedDeviceId(trustedDeviceId);

  if (!uid || !cleanId) {
    const error = new Error("Trusted device not found.");
    error.statusCode = 400;
    throw error;
  }

  const trustedDeviceRef = admin.firestore().collection("trustedDevices").doc(cleanId);
  const trustedDeviceDoc = await trustedDeviceRef.get();

  if (!trustedDeviceDoc.exists) {
    const error = new Error("Trusted device not found.");
    error.statusCode = 404;
    throw error;
  }

  const data = trustedDeviceDoc.data() || {};
  const ownerId = data.userId || data.uid || "";

  if (ownerId !== uid) {
    const error = new Error("You cannot remove this trusted device.");
    error.statusCode = 403;
    throw error;
  }

  if (data.revokedAt || isExpired(data.expiresAt)) {
    const error = new Error("Trusted device not found.");
    error.statusCode = 404;
    throw error;
  }

  await trustedDeviceRef.set({
    revokedAt: admin.firestore.FieldValue.serverTimestamp(),
    revokedBy: uid,
    revokedReason: revokedReason || "trusted_device_removed"
  }, { merge: true });

  const currentTrustedDevice = await getCurrentTrustedDevice(req, uid, { touch: false }).catch(function () {
    return null;
  });

  if (currentTrustedDevice && currentTrustedDevice.id === cleanId && res) {
    clearTrustedDeviceCookie(res);
  }

  return {
    trustedDeviceId: cleanId
  };
}

async function revokeAllTrustedDevices(uid, revokedBy, revokedReason) {
  if (!uid) {
    return;
  }

  const snapshot = await admin.firestore()
    .collection("trustedDevices")
    .where("uid", "==", uid)
    .get();

  if (snapshot.empty) {
    return;
  }

  const batch = admin.firestore().batch();

  snapshot.docs.forEach(function (doc) {
    batch.set(doc.ref, {
      revokedAt: admin.firestore.FieldValue.serverTimestamp(),
      revokedBy: revokedBy || uid,
      revokedReason: revokedReason || "trusted_devices_revoked"
    }, { merge: true });
  });

  await batch.commit();
}

async function firebaseAuthRest(endpoint, payload) {
  const controller = new AbortController();
  const timeout = setTimeout(function () {
    controller.abort();
  }, 15000);

  let response;

  try {
    response = await fetch(
      "https://identitytoolkit.googleapis.com/v1/" +
        endpoint +
        "?key=" +
        encodeURIComponent(getFirebaseWebApiKey()),
      {
        method: "POST",
        signal: controller.signal,
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      }
    );
  } catch (error) {
    if (error && error.name === "AbortError") {
      const timeoutError = new Error("Authentication took too long. Please try again.");
      timeoutError.statusCode = 504;
      throw timeoutError;
    }

    throw error;
  } finally {
    clearTimeout(timeout);
  }

  const data = await response.json().catch(function () {
    return {};
  });

  if (!response.ok) {
    const error = new Error("firebase-auth-rest-error");
    error.statusCode = response.status;
    error.firebaseError = data;
    throw error;
  }

  return data;
}

async function signInWithPassword(email, password) {
  return await firebaseAuthRest("accounts:signInWithPassword", {
    email,
    password,
    returnSecureToken: true
  });
}

async function signInWithCustomToken(customToken) {
  return await firebaseAuthRest("accounts:signInWithCustomToken", {
    token: customToken,
    returnSecureToken: true
  });
}

function normalizeSessionCreationArgs(firstArg, secondArg, thirdArg) {
  if (isRequestLike(firstArg)) {
    return {
      req: firstArg,
      res: secondArg,
      value: thirdArg
    };
  }

  return {
    req: isRequestLike(thirdArg) ? thirdArg : null,
    res: secondArg,
    value: firstArg
  };
}

function decodeUidFromIdToken(idToken) {
  try {
    const payloadPart = String(idToken || "").split(".")[1] || "";
    const normalizedPayload = payloadPart.replace(/-/g, "+").replace(/_/g, "/");
    const paddedPayload = normalizedPayload + "=".repeat((4 - normalizedPayload.length % 4) % 4);
    const payload = JSON.parse(Buffer.from(paddedPayload, "base64").toString("utf8"));

    return String(payload.user_id || payload.sub || "").trim();
  } catch (error) {
    return "";
  }
}

async function createSiteSessionFromIdToken(firstArg, secondArg, thirdArg) {
  const args = normalizeSessionCreationArgs(firstArg, secondArg, thirdArg);
  const idToken = args.value;
  const res = args.res;
  const req = args.req;
  const decodedUid = decodeUidFromIdToken(idToken);
  const fallbackSessionPrefix = "idtoken.";
  let sessionCookie = "";
  let sessionMaxAgeSeconds = Math.floor(SITE_SESSION_EXPIRES_MS / 1000);

  try {
    sessionCookie = await Promise.race([
      admin.auth().createSessionCookie(idToken, {
        expiresIn: SITE_SESSION_EXPIRES_MS
      }),
      new Promise(function (_, reject) {
        setTimeout(function () {
          const error = new Error("session-cookie-timeout");
          error.sessionCookieTimeout = true;
          reject(error);
        }, 2500);
      })
    ]);
  } catch (error) {
    if (!error || !error.sessionCookieTimeout) {
      throw error;
    }

    sessionCookie = fallbackSessionPrefix + idToken;
    sessionMaxAgeSeconds = 55 * 60;
  }

  setCookie(
    res,
    SITE_SESSION_COOKIE_NAME,
    sessionCookie,
    sessionMaxAgeSeconds
  );

  const accountSession = decodedUid ? await createAccountSession(decodedUid, res, req) : null;

  return {
    sessionCookie,
    accountSessionId: accountSession && accountSession.sessionId ? accountSession.sessionId : ""
  };
}

async function createSiteSessionForUid(firstArg, secondArg, thirdArg) {
  const args = normalizeSessionCreationArgs(firstArg, secondArg, thirdArg);
  const uid = args.value;
  const res = args.res;
  const req = args.req;
  const customToken = await admin.auth().createCustomToken(uid);
  const signInData = await signInWithCustomToken(customToken);
  const sessionData = await createSiteSessionFromIdToken(signInData.idToken, res, req);

  return Object.assign({}, signInData, {
    sessionCookie: sessionData && sessionData.sessionCookie ? sessionData.sessionCookie : "",
    accountSessionId: sessionData && sessionData.accountSessionId ? sessionData.accountSessionId : ""
  });
}

async function clearSiteSessionCookie(firstArg, secondArg) {
  const req = isRequestLike(firstArg) && secondArg ? firstArg : null;
  const res = secondArg || firstArg;

  if (req) {
    await Promise.race([
      clearCurrentAccountSession(req).catch(function () {}),
      new Promise(function (resolve) {
        setTimeout(resolve, 3000);
      })
    ]);
  }

  clearCookie(res, SITE_SESSION_COOKIE_NAME);
  clearCookie(res, ACCOUNT_SESSION_COOKIE_NAME);
}

async function getSiteSessionUser(req, options) {
  const settings = options || {};
  const sessionCookie = getCookie(req, SITE_SESSION_COOKIE_NAME);
  const fallbackSessionPrefix = "idtoken.";

  if (!sessionCookie) {
    const error = new Error("not-signed-in");
    error.statusCode = 401;
    throw error;
  }

  const usesFallbackIdToken = sessionCookie.startsWith(fallbackSessionPrefix);
  const cookieToken = usesFallbackIdToken
    ? sessionCookie.slice(fallbackSessionPrefix.length)
    : sessionCookie;

  const decodedUser = usesFallbackIdToken
    ? await admin.auth().verifyIdToken(cookieToken, false)
    : await admin.auth().verifySessionCookie(cookieToken, false);

  try {
    await Promise.race([
      touchCurrentAccountSession(req, decodedUser.uid),
      new Promise(function (resolve) {
        setTimeout(function () {
          resolve(null);
        }, 3000);
      })
    ]);
  } catch (error) {
    if (error && error.message === "account-session-revoked") {
      throw error;
    }
  }

  if (settings.checkRevoked !== false) {
    if (usesFallbackIdToken) {
      await admin.auth().verifyIdToken(cookieToken, true);
    } else {
      await admin.auth().verifySessionCookie(cookieToken, true);
    }
  }

  return decodedUser;
}

async function getOptionalSiteSessionUser(req, options) {
  try {
    return await getSiteSessionUser(req, options);
  } catch (error) {
    if (error && error.message === "account-session-revoked") {
      throw error;
    }

    return null;
  }
}

async function createLoginChallenge(uid, res, details) {
  const db = admin.firestore();
  const challengeRef = db.collection("loginChallenges").doc();
  const challengeId = challengeRef.id;
  const token = createRandomToken();
  const salt = db.collection("_").doc().id;
  const challengeHash = getLoginChallengeHash(uid, challengeId, token, salt);

  await challengeRef.set({
    uid,
    challengeHash,
    salt,
    email: details && details.email ? details.email : "",
    idToken: details && details.idToken ? details.idToken : "",
    mode: details && details.mode ? details.mode : "",
    twoFactor: details && details.twoFactor ? details.twoFactor : {},
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    expiresAt: admin.firestore.Timestamp.fromDate(
      new Date(Date.now() + LOGIN_CHALLENGE_EXPIRES_MS)
    )
  });

  setCookie(
    res,
    LOGIN_CHALLENGE_COOKIE_NAME,
    challengeId + "." + token,
    Math.floor(LOGIN_CHALLENGE_EXPIRES_MS / 1000)
  );

  return {
    challengeId
  };
}

async function getLoginChallenge(req) {
  const cookieValue = getCookie(req, LOGIN_CHALLENGE_COOKIE_NAME);

  if (!cookieValue || !cookieValue.includes(".")) {
    const error = new Error("login-challenge-required");
    error.statusCode = 401;
    throw error;
  }

  const parts = cookieValue.split(".");
  const challengeId = parts[0];
  const token = parts.slice(1).join(".");

  if (!challengeId || !token) {
    const error = new Error("login-challenge-required");
    error.statusCode = 401;
    throw error;
  }

  const db = admin.firestore();
  const challengeRef = db.collection("loginChallenges").doc(challengeId);
  const challengeDoc = await challengeRef.get();

  if (!challengeDoc.exists) {
    const error = new Error("login-challenge-expired");
    error.statusCode = 401;
    throw error;
  }

  const data = challengeDoc.data();

  if (isExpired(data.expiresAt)) {
    await challengeRef.delete().catch(function () {});

    const error = new Error("login-challenge-expired");
    error.statusCode = 401;
    throw error;
  }

  const submittedHash = getLoginChallengeHash(
    data.uid,
    challengeId,
    token,
    data.salt
  );

  const savedBuffer = Buffer.from(data.challengeHash || "", "hex");
  const submittedBuffer = Buffer.from(submittedHash, "hex");

  const matches =
    savedBuffer.length === submittedBuffer.length &&
    crypto.timingSafeEqual(savedBuffer, submittedBuffer);

  if (!matches) {
    const error = new Error("invalid-login-challenge");
    error.statusCode = 401;
    throw error;
  }

  return {
    challengeId,
    ref: challengeRef,
    data,
    uid: data.uid || "",
    email: data.email || "",
    idToken: data.idToken || "",
    mode: data.mode || "",
    twoFactor: data.twoFactor || {}
  };
}

async function clearLoginChallenge(req, res) {
  clearCookie(res, LOGIN_CHALLENGE_COOKIE_NAME);

  try {
    await Promise.race([
      getLoginChallenge(req).then(function (challenge) {
        return challenge.ref.delete().catch(function () {});
      }),
      new Promise(function (resolve) {
        setTimeout(resolve, 1000);
      })
    ]);
  } catch (error) {}
}

function setLoginTwoFactorCookie(res, value, maxAgeSeconds) {
  setCookie(res, LOGIN_2FA_COOKIE_NAME, value, maxAgeSeconds);
}

function clearLoginTwoFactorCookie(res) {
  clearCookie(res, LOGIN_2FA_COOKIE_NAME);
}

async function createLoginTwoFactorSession(uid, res) {
  const db = admin.firestore();
  const sessionId = db.collection("_").doc().id;
  const sessionToken = createRandomToken();
  const salt = db.collection("_").doc().id;

  const sessionHash = getLoginTwoFactorSessionHash(uid, sessionToken, salt);

  await db.collection("loginTwoFactorSessions").doc(sessionId).set({
    uid,
    sessionHash,
    salt,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    expiresAt: admin.firestore.Timestamp.fromDate(
      new Date(Date.now() + LOGIN_2FA_SESSION_MINUTES * 60 * 1000)
    )
  });

  setLoginTwoFactorCookie(
    res,
    sessionId + "." + sessionToken,
    LOGIN_2FA_SESSION_MINUTES * 60
  );

  return {
    sessionId
  };
}

async function hasValidLoginTwoFactorSession(req, uid) {
  const cookieValue = getCookie(req, LOGIN_2FA_COOKIE_NAME);

  if (!cookieValue || !cookieValue.includes(".")) {
    return false;
  }

  const parts = cookieValue.split(".");
  const sessionId = parts[0];
  const sessionToken = parts.slice(1).join(".");

  if (!sessionId || !sessionToken) {
    return false;
  }

  const db = admin.firestore();
  const sessionRef = db.collection("loginTwoFactorSessions").doc(sessionId);
  const sessionDoc = await sessionRef.get();

  if (!sessionDoc.exists) {
    return false;
  }

  const data = sessionDoc.data();

  if (data.uid !== uid) {
    return false;
  }

  if (isExpired(data.expiresAt)) {
    await sessionRef.delete().catch(function () {});
    return false;
  }

  const submittedHash = getLoginTwoFactorSessionHash(uid, sessionToken, data.salt);

  const savedBuffer = Buffer.from(data.sessionHash || "", "hex");
  const submittedBuffer = Buffer.from(submittedHash, "hex");

  return (
    savedBuffer.length === submittedBuffer.length &&
    crypto.timingSafeEqual(savedBuffer, submittedBuffer)
  );
}

async function userRequiresTwoFactor(uid) {
  const db = admin.firestore();
  const userDoc = await db.collection("users").doc(uid).get();

  if (!userDoc.exists) {
    return false;
  }

  const twoFactor = userDoc.data().twoFactor || {};

  return Boolean(twoFactor.appEnabled || twoFactor.emailEnabled);
}

async function getUserFromRequest(req, options) {
  const settings = options || {};
  const authHeader = req.headers.authorization || "";

  if (authHeader.startsWith("Bearer ")) {
    const idToken = authHeader.replace("Bearer ", "");

    const decodedUser = await admin.auth().verifyIdToken(
      idToken,
      Boolean(settings.checkRevoked)
    );

    if (settings.requireCompletedTwoFactor) {
      const needsTwoFactor = await userRequiresTwoFactor(decodedUser.uid);

      if (needsTwoFactor) {
        const hasCompletedTwoFactor = await hasValidLoginTwoFactorSession(
          req,
          decodedUser.uid
        );

        if (!hasCompletedTwoFactor) {
          const error = new Error("two-factor-required");
          error.statusCode = 403;
          throw error;
        }
      }
    }

    return decodedUser;
  }

  return await getSiteSessionUser(req, {
    checkRevoked: settings.checkRevoked !== false
  });
}

function getAttemptRef(db, uid, purpose) {
  return db.collection("twoFactorAttempts").doc(uid + "_" + purpose);
}

async function checkAttemptLock(db, uid, purpose) {
  const ref = getAttemptRef(db, uid, purpose);
  const doc = await ref.get();

  if (!doc.exists) {
    return;
  }

  const data = doc.data();
  const lockedUntil =
    data.lockedUntil && data.lockedUntil.toDate
      ? data.lockedUntil.toDate()
      : null;

  const resetAt =
    data.resetAt && data.resetAt.toDate
      ? data.resetAt.toDate()
      : null;

  if (lockedUntil && lockedUntil.getTime() > Date.now()) {
    const error = new Error(
      "Too many incorrect codes. Please wait 30 minutes before trying again."
    );
    error.statusCode = 429;
    throw error;
  }

  if (resetAt && resetAt.getTime() <= Date.now()) {
    await ref.delete().catch(function () {});
  }
}

async function recordAttemptFailure(db, uid, purpose) {
  const ref = getAttemptRef(db, uid, purpose);
  const doc = await ref.get();

  let attempts = 1;

  if (doc.exists) {
    const data = doc.data();
    const resetAt =
      data.resetAt && data.resetAt.toDate
        ? data.resetAt.toDate()
        : null;

    if (resetAt && resetAt.getTime() > Date.now()) {
      attempts = Number(data.attempts || 0) + 1;
    }
  }

  const updateData = {
    attempts,
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    resetAt: admin.firestore.Timestamp.fromDate(
      new Date(Date.now() + ATTEMPT_WINDOW_MS)
    )
  };

  if (attempts >= MAX_2FA_ATTEMPTS) {
    updateData.lockedUntil = admin.firestore.Timestamp.fromDate(
      new Date(Date.now() + LOCKOUT_MS)
    );
  }

  await ref.set(updateData, { merge: true });

  return attempts >= MAX_2FA_ATTEMPTS;
}

async function clearAttemptFailures(db, uid, purpose) {
  await getAttemptRef(db, uid, purpose).delete().catch(function () {});
}

async function getAuthenticatorSecret(db, uid, userData) {
  const secretRef = db.collection("twoFactorSecrets").doc(uid);
  const secretDoc = await secretRef.get();

  if (secretDoc.exists && secretDoc.data().appSecret) {
    return secretDoc.data().appSecret;
  }

  const legacySecret =
    userData &&
    userData.twoFactor &&
    userData.twoFactor.appSecret
      ? userData.twoFactor.appSecret
      : "";

  if (legacySecret) {
    await secretRef.set(
      {
        appSecret: legacySecret,
        migratedAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      },
      { merge: true }
    );

    await db
      .collection("users")
      .doc(uid)
      .update({
        "twoFactor.appSecret": admin.firestore.FieldValue.delete(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      })
      .catch(function () {});

    return legacySecret;
  }

  return "";
}

module.exports = {
  getCodeHash,
  getSessionHash,
  createRandomCode,
  createRandomToken,
  getUserFromRequest,
  isExpired,

  signInWithPassword,
  signInWithCustomToken,
  createSiteSessionFromIdToken,
  createSiteSessionForUid,
  createAccountSession,
  clearSiteSessionCookie,
  getSiteSessionUser,
  getOptionalSiteSessionUser,
  listAccountSessions,
  getCurrentAccountSession,
  clearCurrentAccountSession,

  createTrustedDevice,
  getCurrentTrustedDevice,
  listTrustedDevices,
  revokeTrustedDevice,
  revokeAllTrustedDevices,
  clearTrustedDeviceCookie,

  createLoginChallenge,
  getLoginChallenge,
  clearLoginChallenge,

  createLoginTwoFactorSession,
  clearLoginTwoFactorCookie,
  hasValidLoginTwoFactorSession,

  checkAttemptLock,
  recordAttemptFailure,
  clearAttemptFailures,
  getAuthenticatorSecret
};
