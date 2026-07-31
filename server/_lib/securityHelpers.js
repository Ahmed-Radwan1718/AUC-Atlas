const admin = require("./firebaseAdmin");

const IS_PRODUCTION =
  process.env.NODE_ENV === "production" || process.env.VERCEL_ENV === "production";

const SITE_SESSION_COOKIE_NAME = IS_PRODUCTION
  ? "__Host-auc_atlas_session"
  : "auc_atlas_session";

const SITE_SESSION_EXPIRES_MS = 5 * 24 * 60 * 60 * 1000;

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

  return await admin.auth().verifySessionCookie(
    sessionCookie,
    settings.checkRevoked !== false
  );
}

async function getOptionalSiteSessionUser(req, options) {
  try {
    return await getSiteSessionUser(req, options);
  } catch (error) {
    return null;
  }
}

module.exports = {
  signInWithPassword,
  signInWithCustomToken,
  createSiteSessionFromIdToken,
  createSiteSessionForUid,
  clearSiteSessionCookie,
  getSiteSessionUser,
  getOptionalSiteSessionUser
};
