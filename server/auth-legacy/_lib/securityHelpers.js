const crypto = require("crypto");
const admin = require("./firebaseAdmin");
const {
  encryptTotpSecret,
  decryptTotpSecret
} = require("./totpEncryption");

const IS_PRODUCTION =
  process.env.NODE_ENV === "production" || process.env.VERCEL_ENV === "production";

const SITE_SESSION_COOKIE_NAME = IS_PRODUCTION
  ? "__Host-auc_atlas_session"
  : "auc_atlas_session";

const SITE_SESSION_ID_COOKIE_NAME = IS_PRODUCTION
  ? "__Host-auc_atlas_session_id"
  : "auc_atlas_session_id";

const LOGIN_CHALLENGE_COOKIE_NAME = IS_PRODUCTION
  ? "__Host-auc_atlas_login_challenge"
  : "auc_atlas_login_challenge";

const SITE_SESSION_EXPIRES_MS =
  5 * 24 * 60 * 60 * 1000;
const SITE_SESSION_TOUCH_COOLDOWN_MS =
  5 * 60 * 1000;
const LOGIN_CHALLENGE_EXPIRES_MS =
  10 * 60 * 1000;
const SECURITY_PANEL_ACCESS_EXPIRES_MS =
  15 * 60 * 1000;
const AUTHENTICATOR_ATTEMPT_WINDOW_MS =
  15 * 60 * 1000;
const AUTHENTICATOR_MAX_ATTEMPTS = 5;
const ALLOWED_AUC_EMAIL_DOMAIN =
  "aucegypt.edu";

function getSecuritySecret() {
  return String(process.env.SECURITY_CODE_SECRET || process.env.FIREBASE_PRIVATE_KEY || process.env.FIREBASE_CLIENT_EMAIL || "auc-atlas-security-secret");
}

function createRandomToken() {
  return crypto.randomBytes(32).toString("hex");
}

function isExpired(timestamp) {
  if (!timestamp) return true;
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  return date.getTime() <= Date.now();
}

function getLoginChallengeHash(uid, challengeId, token, salt) {
  return crypto
    .createHmac("sha256", getSecuritySecret())
    .update("login-challenge:" + uid + ":" + challengeId + ":" + token + ":" + salt)
    .digest("hex");
}

function getSiteSessionHash(sessionId) {
  return crypto
    .createHmac("sha256", getSecuritySecret())
    .update("site-session:" + sessionId)
    .digest("hex");
}

function getSecurityPanelAccessHash(uid, siteSessionId, token) {
  return crypto
    .createHmac("sha256", getSecuritySecret())
    .update("security-panel:" + uid + ":" + siteSessionId + ":" + token)
    .digest("hex");
}

function getRequestHeader(req, name) {
  const headers = req && req.headers ? req.headers : {};
  const value = headers[name] || headers[String(name || "").toLowerCase()];

  return Array.isArray(value) ? String(value[0] || "") : String(value || "");
}

function getSessionClientIp(req) {
  const forwardedFor = getRequestHeader(req, "x-forwarded-for").split(",")[0].trim();
  const realIp = getRequestHeader(req, "x-real-ip").trim();
  const socketIp = req && req.socket && req.socket.remoteAddress ? req.socket.remoteAddress : "";

  return String(forwardedFor || realIp || socketIp || "").slice(0, 80);
}

function getBrowserVersion(match) {
  return match && match[1] ? String(match[1]).split(".")[0] : "";
}

function getSessionBrowserDetails(userAgent) {
  const value = String(userAgent || "");
  let match = value.match(/EdgA?\/([\d.]+)/) || value.match(/EdgiOS\/([\d.]+)/);

  if (match) {
    return { key: "chrome", name: "Microsoft Edge", version: getBrowserVersion(match) };
  }

  match = value.match(/OPR\/([\d.]+)/) || value.match(/Opera\/([\d.]+)/);

  if (match) {
    return { key: "opera", name: "Opera", version: getBrowserVersion(match) };
  }

  match = value.match(/CriOS\/([\d.]+)/) || value.match(/Chrome\/([\d.]+)/);

  if (match) {
    return { key: "chrome", name: "Chrome", version: getBrowserVersion(match) };
  }

  match = value.match(/FxiOS\/([\d.]+)/) || value.match(/Firefox\/([\d.]+)/);

  if (match) {
    return { key: "firefox", name: "Firefox", version: getBrowserVersion(match) };
  }

  match = value.match(/Version\/([\d.]+).*Safari\//);

  if (match || /Safari\//.test(value)) {
    return { key: "safari", name: "Safari", version: getBrowserVersion(match) };
  }

  return { key: "chrome", name: "Browser", version: "" };
}

function getSessionPlatformLabel(userAgent) {
  const value = String(userAgent || "");

  if (/iPad/.test(value)) return "iPadOS";
  if (/iPhone|iPod/.test(value)) return "iOS";
  if (/Android/.test(value)) return "Android";
  if (/Windows NT/.test(value)) return "Windows";
  if (/Mac OS X|Macintosh/.test(value)) return "macOS";
  if (/Linux/.test(value)) return "Linux";

  return "Device";
}

function getSessionDeviceType(userAgent) {
  const value = String(userAgent || "");

  if (/iPad|Tablet/.test(value)) return "Tablet";
  if (/Mobi|iPhone|iPod|Android/.test(value)) return "Mobile";

  return "Desktop";
}

function getSessionDetailsFromRequest(req) {
  const userAgent = getRequestHeader(req, "user-agent").slice(0, 600);
  const browser = getSessionBrowserDetails(userAgent);
  const osName = getSessionPlatformLabel(userAgent);
  const deviceType = getSessionDeviceType(userAgent);
  const browserLabel = browser.name;

  return {
    userAgent,
    ipAddress: getSessionClientIp(req),
    browserKey: browser.key,
    browserName: browser.name,
    browserVersion: browser.version,
    browserLabel,
    osName,
    deviceType,
    deviceLabel: browser.name + " on " + osName
  };
}

function sessionTimestampToMillis(value) {
  if (!value) return 0;
  if (typeof value.toDate === "function") return value.toDate().getTime();
  if (typeof value.seconds === "number") return value.seconds * 1000;
  if (typeof value._seconds === "number") return value._seconds * 1000;

  const parsedDate = new Date(value);
  return Number.isNaN(parsedDate.getTime()) ? 0 : parsedDate.getTime();
}

function serializeSessionTimestamp(value) {
  const millis = sessionTimestampToMillis(value);

  return millis
    ? new Date(millis).toISOString()
    : "";
}

function createAuthenticatorAttemptLimitError(
  retryAfterSeconds
) {
  const safeRetryAfterSeconds = Math.max(
    1,
    Math.ceil(Number(retryAfterSeconds) || 1)
  );
  const retryAfterMinutes = Math.max(
    1,
    Math.ceil(safeRetryAfterSeconds / 60)
  );
  const error = new Error(
    "Too many authenticator attempts. Try again in " +
      retryAfterMinutes +
      (
        retryAfterMinutes === 1
          ? " minute."
          : " minutes."
      )
  );

  error.statusCode = 429;
  error.retryAfterSeconds =
    safeRetryAfterSeconds;

  return error;
}

function getAuthenticatorAttemptDocumentId(scope) {
  return String(scope || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

async function consumeAuthenticatorAttempt(
  uid,
  scope
) {
  const safeUid = String(uid || "").trim();
  const documentId =
    getAuthenticatorAttemptDocumentId(scope);

  if (!safeUid || !documentId) {
    const error = new Error(
      "Could not verify authenticator attempt."
    );

    error.statusCode = 400;
    throw error;
  }

  const db = admin.firestore();
  const attemptRef = db
    .collection("users")
    .doc(safeUid)
    .collection("authenticatorAttempts")
    .doc(documentId);
  const nowMs = Date.now();

  await db.runTransaction(
    async function (transaction) {
      const attemptDoc =
        await transaction.get(attemptRef);
      const data = attemptDoc.exists
        ? attemptDoc.data() || {}
        : {};
      const windowStartedAtMs =
        sessionTimestampToMillis(
          data.windowStartedAt
        );
      const windowEndsAtMs =
        windowStartedAtMs +
        AUTHENTICATOR_ATTEMPT_WINDOW_MS;
      const hasActiveWindow =
        windowStartedAtMs > 0 &&
        nowMs < windowEndsAtMs;
      const attemptCount = hasActiveWindow
        ? Math.max(
            0,
            Number(data.count || 0)
          )
        : 0;

      if (
        hasActiveWindow &&
        attemptCount >=
          AUTHENTICATOR_MAX_ATTEMPTS
      ) {
        throw createAuthenticatorAttemptLimitError(
          Math.ceil(
            (windowEndsAtMs - nowMs) / 1000
          )
        );
      }

      const activeWindowStartedAtMs =
        hasActiveWindow
          ? windowStartedAtMs
          : nowMs;

      transaction.set(attemptRef, {
        count: attemptCount + 1,
        windowStartedAt:
          admin.firestore.Timestamp.fromDate(
            new Date(activeWindowStartedAtMs)
          ),
        lastAttemptAt:
          admin.firestore.FieldValue
            .serverTimestamp(),
        expiresAt:
          admin.firestore.Timestamp.fromDate(
            new Date(
              activeWindowStartedAtMs +
                AUTHENTICATOR_ATTEMPT_WINDOW_MS
            )
          )
      });
    }
  );
}

async function clearAuthenticatorAttempts(
  uid,
  scope
) {
  const safeUid = String(uid || "").trim();
  const documentId =
    getAuthenticatorAttemptDocumentId(scope);

  if (!safeUid || !documentId) {
    return;
  }

  await admin.firestore()
    .collection("users")
    .doc(safeUid)
    .collection("authenticatorAttempts")
    .doc(documentId)
    .delete()
    .catch(function () {});
}

function isSiteSessionActive(data) {
  return Boolean(
    data &&
    !data.revokedAt &&
    !isExpired(data.expiresAt)
  );
}

function cleanAuthEmail(value) {
  return String(value || "").trim().toLowerCase();
}

function isAllowedAucEmail(email) {
  const normalizedEmail = cleanAuthEmail(email);
  const atIndex = normalizedEmail.indexOf("@");

  if (atIndex <= 0 || atIndex !== normalizedEmail.lastIndexOf("@")) {
    return false;
  }

  return normalizedEmail.slice(atIndex + 1) === ALLOWED_AUC_EMAIL_DOMAIN;
}

function createAucEmailRequiredError(action) {
  const error = new Error("Please use your AUC email address (@aucegypt.edu) to " + (action || "continue") + ".");
  error.statusCode = 403;
  return error;
}

function ensureAllowedAucEmail(email, action) {
  const normalizedEmail = cleanAuthEmail(email);

  if (!isAllowedAucEmail(normalizedEmail)) {
    throw createAucEmailRequiredError(action);
  }

  return normalizedEmail;
}

async function getDecodedUserEmail(decodedUser) {
  const tokenEmail = cleanAuthEmail(decodedUser && decodedUser.email);

  if (tokenEmail) {
    return tokenEmail;
  }

  if (decodedUser && decodedUser.uid) {
    const userRecord = await admin.auth().getUser(decodedUser.uid);
    return cleanAuthEmail(userRecord.email);
  }

  return "";
}

async function ensureDecodedUserHasAllowedAucEmail(decodedUser, action) {
  const email = await getDecodedUserEmail(decodedUser);
  return ensureAllowedAucEmail(email, action);
}

function appendSetCookie(res, cookieValue) {
  const existing = res.getHeader("Set-Cookie");

  if (!existing) {
    res.setHeader("Set-Cookie", cookieValue);
    return;
  }

  res.setHeader("Set-Cookie", Array.isArray(existing) ? existing.concat(cookieValue) : [existing, cookieValue]);
}

function setCookie(res, name, value, maxAgeSeconds) {
  appendSetCookie(
    res,
    name + "=" + encodeURIComponent(value) + "; Max-Age=" + maxAgeSeconds + "; Path=/; HttpOnly; SameSite=Lax" + (IS_PRODUCTION ? "; Secure" : "")
  );
}

function clearCookie(res, name) {
  appendSetCookie(
    res,
    name + "=; Max-Age=0; Path=/; HttpOnly; SameSite=Lax" + (IS_PRODUCTION ? "; Secure" : "")
  );
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

function getFirebaseWebApiKey() {
  const apiKey = String(process.env.FIREBASE_WEB_API_KEY || "").trim();

  if (!apiKey) {
    const error = new Error("Firebase login is not configured.");
    error.statusCode = 500;
    throw error;
  }

  return apiKey;
}

async function firebaseAuthRest(endpoint, payload) {
  const response = await fetch(
    "https://identitytoolkit.googleapis.com/v1/" + endpoint + "?key=" + encodeURIComponent(getFirebaseWebApiKey()),
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    }
  );

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

function getCurrentSiteSessionHash(req) {
  const sessionId = getCookie(
    req,
    SITE_SESSION_ID_COOKIE_NAME
  );

  if (!/^[a-f0-9]{64}$/i.test(sessionId)) {
    return "";
  }

  return getSiteSessionHash(sessionId);
}

async function saveSiteSession(uid, sessionHash, req, options) {
  const details = getSessionDetailsFromRequest(req);
  const sessionRef = admin.firestore().collection("users").doc(uid).collection("sessions").doc(sessionHash);
  const now = admin.firestore.FieldValue.serverTimestamp();
  const updateData = Object.assign({}, details, {
    uid,
    sessionId: sessionHash,
    lastSeenAt: now
  });

  if (options && options.create) {
    updateData.createdAt = now;
    updateData.expiresAt = admin.firestore.Timestamp.fromDate(new Date(Date.now() + SITE_SESSION_EXPIRES_MS));
    updateData.revokedAt = null;
  }

  await sessionRef.set(updateData, { merge: true });

  return {
    id: sessionHash,
    ref: sessionRef
  };
}

async function createSiteSessionRecord(decodedUser, req, res) {
  if (!decodedUser || !decodedUser.uid) {
    return { id: "" };
  }

  const sessionId = createRandomToken();
  const sessionHash = getSiteSessionHash(sessionId);

  await saveSiteSession(decodedUser.uid, sessionHash, req, { create: true });
  getUserSiteSessions(decodedUser.uid, sessionHash).catch(function () {});

  if (res) {
    setCookie(
      res,
      SITE_SESSION_ID_COOKIE_NAME,
      sessionId,
      Math.floor(SITE_SESSION_EXPIRES_MS / 1000)
    );
  }

  return { id: sessionHash };
}

async function ensureSiteSessionRecord(decodedUser, req, res) {
  const currentSessionHash = getCurrentSiteSessionHash(req);

  if (decodedUser && decodedUser.uid && currentSessionHash) {
    decodedUser.siteSessionId = currentSessionHash;
    return { id: currentSessionHash };
  }

  return await createSiteSessionRecord(decodedUser, req, res);
}

function getSiteSessionDisplayKey(session) {
  const userAgent = String(session.userAgent || "").trim().toLowerCase();
  const ipAddress = String(session.ipAddress || "").trim().toLowerCase();

  if (userAgent) {
    return [userAgent, ipAddress].join("|");
  }

  return [
    String(session.browserName || session.browserLabel || "Browser").trim().toLowerCase(),
    String(session.browserVersion || "").trim().toLowerCase(),
    String(session.osName || "Device").trim().toLowerCase(),
    String(session.deviceType || "").trim().toLowerCase(),
    ipAddress
  ].join("|");
}

async function getUserSiteSessions(uid, currentSessionHash) {
  const snapshot = await admin.firestore().collection("users").doc(uid).collection("sessions").get();
  const sessions = [];
  const sessionsByKey = new Map();
  const cleanup = [];

  snapshot.forEach(function (doc) {
    const data = doc.data() || {};

    if (data.revokedAt) {
      return;
    }

    if (!isSiteSessionActive(data)) {
      cleanup.push(doc.ref.delete().catch(function () {}));
      return;
    }

    const lastSeenAt = data.lastSeenAt || data.createdAt;
    const session = {
      id: doc.id,
      browserKey: data.browserKey || "chrome",
      browserName: data.browserName || "Browser",
      browserVersion: data.browserVersion || "",
      browserLabel: data.browserLabel || data.browserName || "Browser",
      osName: data.osName || "Device",
      deviceType: data.deviceType || "",
      deviceLabel: data.deviceLabel || "Browser session",
      ipAddress: data.ipAddress || "",
      userAgent: data.userAgent || "",
      createdAt: serializeSessionTimestamp(data.createdAt),
      lastSeenAt: serializeSessionTimestamp(lastSeenAt),
      expiresAt: serializeSessionTimestamp(data.expiresAt),
      current: Boolean(currentSessionHash && doc.id === currentSessionHash),
      ref: doc.ref,
      groupKey: "",
      lastSeenAtMs: sessionTimestampToMillis(lastSeenAt)
    };

    session.groupKey = getSiteSessionDisplayKey(session);

    const existingSession = sessionsByKey.get(session.groupKey);

    if (!existingSession) {
      sessionsByKey.set(session.groupKey, session);
      return;
    }

    const shouldReplaceExisting = session.current || (!existingSession.current && session.lastSeenAtMs > existingSession.lastSeenAtMs);
    const duplicateSession = shouldReplaceExisting ? existingSession : session;

    cleanup.push(duplicateSession.ref.delete().catch(function () {}));

    if (shouldReplaceExisting) {
      sessionsByKey.set(session.groupKey, session);
    }
  });

  sessionsByKey.forEach(function (session) {
    sessions.push(session);
  });

  await Promise.all(cleanup.slice(0, 20));

  sessions.sort(function (a, b) {
    if (a.current !== b.current) {
      return a.current ? -1 : 1;
    }

    return b.lastSeenAtMs - a.lastSeenAtMs;
  });

  return sessions.map(function (session) {
    return {
      id: session.id,
      browserKey: session.browserKey,
      browserName: session.browserName,
      browserVersion: session.browserVersion,
      browserLabel: session.browserLabel,
      osName: session.osName,
      deviceType: session.deviceType,
      deviceLabel: session.deviceLabel,
      ipAddress: session.ipAddress,
      userAgent: session.userAgent,
      createdAt: session.createdAt,
      lastSeenAt: session.lastSeenAt,
      expiresAt: session.expiresAt,
      current: session.current
    };
  });
}

async function revokeUserSiteSession(uid, sessionId, revokedReason) {
  const cleanSessionId = String(sessionId || "").trim();

  if (!/^[a-f0-9]{64}$/i.test(cleanSessionId)) {
    const error = new Error("Session not found.");
    error.statusCode = 404;
    throw error;
  }

  const sessionRef = admin.firestore().collection("users").doc(uid).collection("sessions").doc(cleanSessionId);
  const sessionDoc = await sessionRef.get();

  if (!sessionDoc.exists || !isSiteSessionActive(sessionDoc.data() || {})) {
    const error = new Error("Session not found.");
    error.statusCode = 404;
    throw error;
  }

  await sessionRef.set({
    revokedAt: admin.firestore.FieldValue.serverTimestamp(),
    revokedReason: revokedReason || "signed_out"
  }, { merge: true });

  return { id: cleanSessionId };
}

async function createSiteSessionFromIdToken(idToken, res, req) {
  const decodedToken = await admin.auth().verifyIdToken(idToken);
  await ensureDecodedUserHasAllowedAucEmail(decodedToken, "continue");

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

  await createSiteSessionRecord(decodedToken, req, res);

  return sessionCookie;
}

async function createSiteSessionForUid(uid, res, req) {
  const customToken = await admin.auth().createCustomToken(uid);
  const signInData = await signInWithCustomToken(customToken);
  const sessionCookie = await createSiteSessionFromIdToken(signInData.idToken, res, req);

  return Object.assign({}, signInData, {
    sessionCookie
  });
}

function clearSiteSessionCookie(res) {
  clearCookie(res, SITE_SESSION_COOKIE_NAME);
  clearCookie(res, SITE_SESSION_ID_COOKIE_NAME);
}

async function getSiteSessionUser(req, options) {
  const settings = options || {};
  const sessionCookie = getCookie(
    req,
    SITE_SESSION_COOKIE_NAME
  );
  const sessionHash =
    getCurrentSiteSessionHash(req);
  const fallbackSessionPrefix = "idtoken.";

  if (!sessionCookie) {
    const error = new Error("not-signed-in");
    error.statusCode = 401;
    throw error;
  }

  if (!sessionHash) {
    const error = new Error(
      "account-session-invalid"
    );
    error.statusCode = 401;
    throw error;
  }

  const usesFallbackIdToken =
    sessionCookie.startsWith(
      fallbackSessionPrefix
    );
  const cookieToken = usesFallbackIdToken
    ? sessionCookie.slice(
        fallbackSessionPrefix.length
      )
    : sessionCookie;
  const decodedUser = usesFallbackIdToken
    ? await admin.auth().verifyIdToken(
        cookieToken,
        settings.checkRevoked !== false
      )
    : await admin.auth().verifySessionCookie(
        cookieToken,
        settings.checkRevoked !== false
      );

  await ensureDecodedUserHasAllowedAucEmail(
    decodedUser,
    "continue"
  );

  const userRecord = await admin.auth()
    .getUser(decodedUser.uid);
  const authoritativeEmail = cleanAuthEmail(
    userRecord.email ||
    decodedUser.email
  );

  if (
    !userRecord.emailVerified ||
    !isAllowedAucEmail(authoritativeEmail)
  ) {
    const error = new Error(
      "Please verify your AUC email address before continuing."
    );

    error.statusCode = 403;
    error.code =
      "email-verification-required";

    throw error;
  }

  const sessionRef = admin.firestore()
    .collection("users")
    .doc(decodedUser.uid)
    .collection("sessions")
    .doc(sessionHash);
  const sessionDoc = await sessionRef.get();
  const sessionData = sessionDoc.exists
    ? sessionDoc.data() || {}
    : {};
  const storedSessionUid = String(
    sessionData.uid || ""
  ).trim();
  const storedSessionId = String(
    sessionData.sessionId || ""
  ).trim();

  if (
    !sessionDoc.exists ||
    !isSiteSessionActive(sessionData) ||
    storedSessionUid !== decodedUser.uid ||
    storedSessionId !== sessionHash
  ) {
    const error = new Error(
      "account-session-invalid"
    );
    error.statusCode = 401;
    error.revokedReason =
      sessionData.revokedReason || "";
    throw error;
  }

  const lastSeenAtMs = sessionTimestampToMillis(
    sessionData.lastSeenAt ||
      sessionData.createdAt
  );

  if (
    !lastSeenAtMs ||
    Date.now() - lastSeenAtMs >
      SITE_SESSION_TOUCH_COOLDOWN_MS
  ) {
    await saveSiteSession(
      decodedUser.uid,
      sessionHash,
      req,
      { create: false }
    );
  }

  decodedUser.siteSessionId = sessionHash;

  return decodedUser;
}

async function getOptionalSiteSessionUser(req, options) {
  try {
    return await getSiteSessionUser(req, options);
  } catch (error) {
    return null;
  }
}

async function clearCurrentSiteSession(req, res) {
  const sessionHash = getCurrentSiteSessionHash(req);
  const decodedUser = await getOptionalSiteSessionUser(req, {
    checkRevoked: false
  });

  if (decodedUser && decodedUser.uid && sessionHash) {
    await revokeUserSiteSession(decodedUser.uid, sessionHash, "signed_out").catch(function () {});
  }

  clearSiteSessionCookie(res);
}

async function createLoginChallenge(
  uid,
  res,
  details
) {
  const db = admin.firestore();
  const challengeRef = db
    .collection("loginChallenges")
    .doc();
  const challengeId = challengeRef.id;
  const token = createRandomToken();
  const salt = db.collection("_").doc().id;

  await challengeRef.set({
    uid,
    challengeHash: getLoginChallengeHash(
      uid,
      challengeId,
      token,
      salt
    ),
    salt,
    email:
      details && details.email
        ? details.email
        : "",
    authMethod:
      details && details.authMethod
        ? String(details.authMethod).slice(0, 40)
        : "",
    twoFactor:
      details && details.twoFactor
        ? details.twoFactor
        : {},
    consumedAt: null,
    createdAt:
      admin.firestore.FieldValue
        .serverTimestamp(),
    expiresAt:
      admin.firestore.Timestamp.fromDate(
        new Date(
          Date.now() +
            LOGIN_CHALLENGE_EXPIRES_MS
        )
      )
  });

  setCookie(
    res,
    LOGIN_CHALLENGE_COOKIE_NAME,
    challengeId + "." + token,
    Math.floor(
      LOGIN_CHALLENGE_EXPIRES_MS / 1000
    )
  );

  return { challengeId };
}

async function getLoginChallenge(req) {
  const cookieValue = getCookie(
    req,
    LOGIN_CHALLENGE_COOKIE_NAME
  );

  if (
    !cookieValue ||
    !cookieValue.includes(".")
  ) {
    const error = new Error(
      "Please log in again."
    );

    error.statusCode = 401;
    throw error;
  }

  const parts = cookieValue.split(".");
  const challengeId = parts[0];
  const token = parts.slice(1).join(".");

  if (
    !/^[A-Za-z0-9_-]{6,160}$/.test(
      challengeId
    )
  ) {
    const error = new Error(
      "Please log in again."
    );

    error.statusCode = 401;
    throw error;
  }

  const challengeRef = admin.firestore()
    .collection("loginChallenges")
    .doc(challengeId);
  const challengeDoc =
    await challengeRef.get();

  if (!challengeDoc.exists) {
    const error = new Error(
      "Please log in again."
    );

    error.statusCode = 401;
    throw error;
  }

  const data = challengeDoc.data() || {};

  if (data.consumedAt) {
    const error = new Error(
      "Please log in again."
    );

    error.statusCode = 401;
    throw error;
  }

  if (isExpired(data.expiresAt)) {
    await challengeRef
      .delete()
      .catch(function () {});

    const error = new Error(
      "Authenticator login expired. Please log in again."
    );

    error.statusCode = 401;
    throw error;
  }

  const submittedHash =
    getLoginChallengeHash(
      data.uid,
      challengeId,
      token,
      data.salt || ""
    );
  const savedBuffer = Buffer.from(
    data.challengeHash || "",
    "hex"
  );
  const submittedBuffer = Buffer.from(
    submittedHash,
    "hex"
  );

  if (
    savedBuffer.length !==
      submittedBuffer.length ||
    !crypto.timingSafeEqual(
      savedBuffer,
      submittedBuffer
    )
  ) {
    const error = new Error(
      "Please log in again."
    );

    error.statusCode = 401;
    throw error;
  }

  return {
    challengeId,
    ref: challengeRef,
    uid: data.uid || "",
    email: data.email || "",
    authMethod: data.authMethod || "",
    twoFactor: data.twoFactor || {}
  };
}

async function consumeLoginChallenge(
  challenge
) {
  if (
    !challenge ||
    !challenge.ref ||
    !challenge.uid
  ) {
    const error = new Error(
      "Please log in again."
    );

    error.statusCode = 401;
    throw error;
  }

  const db = admin.firestore();

  await db.runTransaction(
    async function (transaction) {
      const challengeDoc =
        await transaction.get(
          challenge.ref
        );

      if (!challengeDoc.exists) {
        const error = new Error(
          "Please log in again."
        );

        error.statusCode = 401;
        throw error;
      }

      const data =
        challengeDoc.data() || {};

      if (
        data.consumedAt ||
        isExpired(data.expiresAt) ||
        String(data.uid || "") !==
          String(challenge.uid || "")
      ) {
        const error = new Error(
          "Please log in again."
        );

        error.statusCode = 401;
        throw error;
      }

      transaction.update(
        challenge.ref,
        {
          consumedAt:
            admin.firestore.FieldValue
              .serverTimestamp(),
          consumedReason: "authenticated"
        }
      );
    }
  );

  return challenge;
}

async function clearLoginChallenge(req, res) {
  const cookieValue = getCookie(
    req,
    LOGIN_CHALLENGE_COOKIE_NAME
  );

  clearCookie(
    res,
    LOGIN_CHALLENGE_COOKIE_NAME
  );

  if (
    !cookieValue ||
    !cookieValue.includes(".")
  ) {
    return;
  }

  const challengeId =
    cookieValue.split(".")[0];

  if (
    !/^[A-Za-z0-9_-]{6,160}$/.test(
      challengeId
    )
  ) {
    return;
  }

  await admin.firestore()
    .collection("loginChallenges")
    .doc(challengeId)
    .delete()
    .catch(function () {});
}

async function getAuthenticatorSecret(uid) {
  const safeUid = String(
    uid || ""
  ).trim();

  if (!safeUid) {
    return "";
  }

  const db = admin.firestore();
  const secretRef = db
    .collection("twoFactorSecrets")
    .doc(safeUid);
  const secretDoc =
    await secretRef.get();
  const encryptionContext =
    "authenticator-account:" +
    safeUid;

  if (secretDoc.exists) {
    const data =
      secretDoc.data() || {};

    if (data.appSecretEncrypted) {
      return decryptTotpSecret(
        data.appSecretEncrypted,
        encryptionContext
      );
    }

    const legacySecret = String(
      data.appSecret || ""
    ).trim();

    if (legacySecret) {
      await secretRef.set({
        appSecretEncrypted:
          encryptTotpSecret(
            legacySecret,
            encryptionContext
          ),
        appSecret:
          admin.firestore.FieldValue
            .delete(),
        encryptionUpdatedAt:
          admin.firestore.FieldValue
            .serverTimestamp()
      }, { merge: true });

      return legacySecret;
    }
  }

  const userRef = db
    .collection("users")
    .doc(safeUid);
  const userDoc =
    await userRef.get();
  const userData = userDoc.exists
    ? userDoc.data() || {}
    : {};
  const twoFactor =
    userData.twoFactor &&
    typeof userData.twoFactor ===
      "object"
      ? userData.twoFactor
      : {};
  const legacyUserSecret = String(
    twoFactor.appSecret || ""
  ).trim();

  if (!legacyUserSecret) {
    return "";
  }

  await Promise.all([
    secretRef.set({
      appSecretEncrypted:
        encryptTotpSecret(
          legacyUserSecret,
          encryptionContext
        ),
      appSecret:
        admin.firestore.FieldValue
          .delete(),
      encryptionUpdatedAt:
        admin.firestore.FieldValue
          .serverTimestamp()
    }, { merge: true }),
    userRef.update({
      "twoFactor.appSecret":
        admin.firestore.FieldValue
          .delete()
    }).catch(function () {})
  ]);

  return legacyUserSecret;
}

function getSecurityPanelAccessDocumentId(decodedUser) {
  const siteSessionId = String(
    decodedUser && decodedUser.siteSessionId
      ? decodedUser.siteSessionId
      : ""
  );

  return siteSessionId
    .replace(/[^a-zA-Z0-9_-]/g, "")
    .slice(0, 180) || "legacy-session";
}

function createSecurityPanelAccessError(message) {
  const error = new Error(
    message || "Enter your authenticator code to open the Security panel."
  );

  error.statusCode = 403;
  return error;
}

async function issueSecurityPanelAccess(decodedUser) {
  if (!decodedUser || !decodedUser.uid) {
    throw createSecurityPanelAccessError("Please log in again.");
  }

  const token = createRandomToken();
  const siteSessionId = String(decodedUser.siteSessionId || "");
  const expiresAt = new Date(
    Date.now() + SECURITY_PANEL_ACCESS_EXPIRES_MS
  );

  const accessRef = admin.firestore()
    .collection("users")
    .doc(decodedUser.uid)
    .collection("securityPanelAccess")
    .doc(getSecurityPanelAccessDocumentId(decodedUser));

  await accessRef.set({
    tokenHash: getSecurityPanelAccessHash(
      decodedUser.uid,
      siteSessionId,
      token
    ),
    siteSessionId,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    expiresAt: admin.firestore.Timestamp.fromDate(expiresAt)
  });

  return {
    token,
    expiresAt: expiresAt.toISOString()
  };
}

async function requireSecurityPanelAccess(req, decodedUser) {
  if (!decodedUser || !decodedUser.uid) {
    throw createSecurityPanelAccessError("Please log in again.");
  }

  const userRef = admin.firestore()
    .collection("users")
    .doc(decodedUser.uid);

  const userDoc = await userRef.get();
  const userData = userDoc.exists ? userDoc.data() || {} : {};
  const twoFactor = userData.twoFactor &&
    typeof userData.twoFactor === "object"
    ? userData.twoFactor
    : {};

  if (!twoFactor.appEnabled) {
    return true;
  }

  const token = getRequestHeader(
    req,
    "x-auc-security-access"
  ).trim();

  if (!token) {
    throw createSecurityPanelAccessError();
  }

  const siteSessionId = String(decodedUser.siteSessionId || "");
  const accessRef = userRef
    .collection("securityPanelAccess")
    .doc(getSecurityPanelAccessDocumentId(decodedUser));

  const accessDoc = await accessRef.get();

  if (!accessDoc.exists) {
    throw createSecurityPanelAccessError();
  }

  const accessData = accessDoc.data() || {};

  if (isExpired(accessData.expiresAt)) {
    await accessRef.delete().catch(function () {});
    throw createSecurityPanelAccessError(
      "Security access expired. Enter a new authenticator code."
    );
  }

  if (
    String(accessData.siteSessionId || "") !==
    siteSessionId
  ) {
    throw createSecurityPanelAccessError();
  }

  const savedHash = String(accessData.tokenHash || "");
  const submittedHash = getSecurityPanelAccessHash(
    decodedUser.uid,
    siteSessionId,
    token
  );

  const savedBuffer = Buffer.from(savedHash, "hex");
  const submittedBuffer = Buffer.from(submittedHash, "hex");

  if (
    !savedHash ||
    savedBuffer.length !== submittedBuffer.length ||
    !crypto.timingSafeEqual(savedBuffer, submittedBuffer)
  ) {
    throw createSecurityPanelAccessError();
  }

  return true;
}

module.exports = {
  isAllowedAucEmail,
  ensureAllowedAucEmail,
  signInWithPassword,
  signInWithCustomToken,
  createSiteSessionFromIdToken,
  createSiteSessionForUid,
  clearSiteSessionCookie,
  clearCurrentSiteSession,
  getSiteSessionUser,
  getOptionalSiteSessionUser,
  ensureSiteSessionRecord,
  getCurrentSiteSessionHash,
  getUserSiteSessions,
  revokeUserSiteSession,
  createLoginChallenge,
  getLoginChallenge,
  consumeLoginChallenge,
  clearLoginChallenge,
  consumeAuthenticatorAttempt,
  clearAuthenticatorAttempts,
  getAuthenticatorSecret,
  issueSecurityPanelAccess,
  requireSecurityPanelAccess
};
