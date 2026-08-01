const crypto = require("crypto");
const admin = require("./firebaseAdmin");

const IS_PRODUCTION =
  process.env.NODE_ENV === "production" || process.env.VERCEL_ENV === "production";

const SITE_SESSION_COOKIE_NAME = IS_PRODUCTION
  ? "__Host-auc_atlas_session"
  : "auc_atlas_session";

const LOGIN_CHALLENGE_COOKIE_NAME = IS_PRODUCTION
  ? "__Host-auc_atlas_login_challenge"
  : "auc_atlas_login_challenge";

const SITE_SESSION_EXPIRES_MS = 5 * 24 * 60 * 60 * 1000;
const LOGIN_CHALLENGE_EXPIRES_MS = 10 * 60 * 1000;
const ALLOWED_AUC_EMAIL_DOMAIN = "aucegypt.edu";

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

async function createSiteSessionFromIdToken(idToken, res) {
  const decodedToken = await admin.auth().verifyIdToken(idToken);
  await ensureDecodedUserHasAllowedAucEmail(decodedToken, "continue");

  const sessionCookie = await admin.auth().createSessionCookie(idToken, {
    expiresIn: SITE_SESSION_EXPIRES_MS
  });

  setCookie(
    res,
    SITE_SESSION_COOKIE_NAME,
    sessionCookie,
    Math.floor(SITE_SESSION_EXPIRES_MS / 1000)
  );

  return sessionCookie;
}

async function createSiteSessionForUid(uid, res) {
  const customToken = await admin.auth().createCustomToken(uid);
  const signInData = await signInWithCustomToken(customToken);
  const sessionCookie = await createSiteSessionFromIdToken(signInData.idToken, res);

  return Object.assign({}, signInData, {
    sessionCookie
  });
}

function clearSiteSessionCookie(res) {
  clearCookie(res, SITE_SESSION_COOKIE_NAME);
}

async function getSiteSessionUser(req, options) {
  const settings = options || {};
  const sessionCookie = getCookie(req, SITE_SESSION_COOKIE_NAME);

  if (!sessionCookie) {
    const error = new Error("not-signed-in");
    error.statusCode = 401;
    throw error;
  }

  const decodedUser = await admin.auth().verifySessionCookie(
    sessionCookie,
    settings.checkRevoked !== false
  );

  await ensureDecodedUserHasAllowedAucEmail(decodedUser, "continue");

  return decodedUser;
}

async function getOptionalSiteSessionUser(req, options) {
  try {
    return await getSiteSessionUser(req, options);
  } catch (error) {
    return null;
  }
}

async function createLoginChallenge(uid, res, details) {
  const db = admin.firestore();
  const challengeRef = db.collection("loginChallenges").doc();
  const challengeId = challengeRef.id;
  const token = createRandomToken();
  const salt = db.collection("_").doc().id;

  await challengeRef.set({
    uid,
    challengeHash: getLoginChallengeHash(uid, challengeId, token, salt),
    salt,
    email: details && details.email ? details.email : "",
    idToken: details && details.idToken ? details.idToken : "",
    twoFactor: details && details.twoFactor ? details.twoFactor : {},
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    expiresAt: admin.firestore.Timestamp.fromDate(new Date(Date.now() + LOGIN_CHALLENGE_EXPIRES_MS))
  });

  setCookie(res, LOGIN_CHALLENGE_COOKIE_NAME, challengeId + "." + token, Math.floor(LOGIN_CHALLENGE_EXPIRES_MS / 1000));

  return { challengeId };
}

async function getLoginChallenge(req) {
  const cookieValue = getCookie(req, LOGIN_CHALLENGE_COOKIE_NAME);

  if (!cookieValue || !cookieValue.includes(".")) {
    const error = new Error("Please log in again.");
    error.statusCode = 401;
    throw error;
  }

  const parts = cookieValue.split(".");
  const challengeId = parts[0];
  const token = parts.slice(1).join(".");
  const challengeRef = admin.firestore().collection("loginChallenges").doc(challengeId);
  const challengeDoc = await challengeRef.get();

  if (!challengeDoc.exists) {
    const error = new Error("Please log in again.");
    error.statusCode = 401;
    throw error;
  }

  const data = challengeDoc.data() || {};

  if (isExpired(data.expiresAt)) {
    await challengeRef.delete().catch(function () {});
    const error = new Error("Authenticator login expired. Please log in again.");
    error.statusCode = 401;
    throw error;
  }

  const submittedHash = getLoginChallengeHash(data.uid, challengeId, token, data.salt || "");
  const savedBuffer = Buffer.from(data.challengeHash || "", "hex");
  const submittedBuffer = Buffer.from(submittedHash, "hex");

  if (savedBuffer.length !== submittedBuffer.length || !crypto.timingSafeEqual(savedBuffer, submittedBuffer)) {
    const error = new Error("Please log in again.");
    error.statusCode = 401;
    throw error;
  }

  return {
    challengeId,
    ref: challengeRef,
    uid: data.uid || "",
    email: data.email || "",
    idToken: data.idToken || "",
    twoFactor: data.twoFactor || {}
  };
}

async function clearLoginChallenge(req, res) {
  clearCookie(res, LOGIN_CHALLENGE_COOKIE_NAME);

  try {
    const challenge = await getLoginChallenge(req);
    await challenge.ref.delete().catch(function () {});
  } catch (error) {}
}

async function getAuthenticatorSecret(uid) {
  const db = admin.firestore();
  const secretDoc = await db.collection("twoFactorSecrets").doc(uid).get();

  if (secretDoc.exists) {
    const data = secretDoc.data() || {};
    return data.appSecret || "";
  }

  const userDoc = await db.collection("users").doc(uid).get();
  const userData = userDoc.exists ? userDoc.data() || {} : {};
  const twoFactor = userData.twoFactor || {};

  return twoFactor.appSecret || "";
}

module.exports = {
  isAllowedAucEmail,
  ensureAllowedAucEmail,
  signInWithPassword,
  signInWithCustomToken,
  createSiteSessionFromIdToken,
  createSiteSessionForUid,
  clearSiteSessionCookie,
  getSiteSessionUser,
  getOptionalSiteSessionUser,
  createLoginChallenge,
  getLoginChallenge,
  clearLoginChallenge,
  getAuthenticatorSecret
};
