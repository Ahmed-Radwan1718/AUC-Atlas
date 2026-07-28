const crypto = require("crypto");
const admin = require("./firebaseAdmin");

const IS_PRODUCTION =
  process.env.NODE_ENV === "production" || process.env.VERCEL_ENV === "production";

const SECURITY_UNLOCK_COOKIE_NAME = IS_PRODUCTION
  ? "__Host-auc_security_unlock"
  : "auc_security_unlock";

const SECURITY_UNLOCK_EXPIRES_MS = 60 * 60 * 1000;

function getSecuritySecret() {
  if (!process.env.SECURITY_CODE_SECRET) {
    throw new Error("missing-security-code-secret");
  }

  return process.env.SECURITY_CODE_SECRET;
}

function createRandomToken() {
  return crypto.randomBytes(32).toString("hex");
}

function getUnlockHash(uid, sessionId, token, salt) {
  return crypto
    .createHmac("sha256", getSecuritySecret())
    .update("security-unlock:" + uid + ":" + sessionId + ":" + token + ":" + salt)
    .digest("hex");
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
      "; Path=/; HttpOnly; SameSite=Strict" +
      secureFlag
  );
}

function clearCookie(res, name) {
  const secureFlag = IS_PRODUCTION ? "; Secure" : "";

  appendSetCookie(
    res,
    name +
      "=; Max-Age=0; Path=/; HttpOnly; SameSite=Strict" +
      secureFlag
  );
}

function isExpired(timestamp) {
  if (!timestamp) return true;

  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  return date.getTime() <= Date.now();
}

async function createSecurityUnlockSession(uid, res) {
  const db = admin.firestore();
  const sessionId = db.collection("_").doc().id;
  const token = createRandomToken();
  const salt = db.collection("_").doc().id;
  const sessionHash = getUnlockHash(uid, sessionId, token, salt);
  const expiresAtDate = new Date(Date.now() + SECURITY_UNLOCK_EXPIRES_MS);

  await db.collection("securityPasswordSessions").doc(sessionId).set({
    uid,
    sessionHash,
    salt,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    expiresAt: admin.firestore.Timestamp.fromDate(expiresAtDate)
  });

  setCookie(
    res,
    SECURITY_UNLOCK_COOKIE_NAME,
    sessionId + "." + token,
    Math.floor(SECURITY_UNLOCK_EXPIRES_MS / 1000)
  );

  return {
    sessionId,
    unlockUntil: expiresAtDate.toISOString()
  };
}

async function hasValidSecurityUnlockSession(req, uid) {
  const cookieValue = getCookie(req, SECURITY_UNLOCK_COOKIE_NAME);

  if (!cookieValue || !cookieValue.includes(".")) return false;

  const parts = cookieValue.split(".");
  const sessionId = parts[0];
  const token = parts.slice(1).join(".");

  if (!sessionId || !token) return false;

  const db = admin.firestore();
  const sessionRef = db.collection("securityPasswordSessions").doc(sessionId);
  const sessionDoc = await sessionRef.get();

  if (!sessionDoc.exists) return false;

  const data = sessionDoc.data();

  if (data.uid !== uid) return false;

  if (isExpired(data.expiresAt)) {
    await sessionRef.delete().catch(function () {});
    return false;
  }

  const submittedHash = getUnlockHash(uid, sessionId, token, data.salt);
  const savedBuffer = Buffer.from(data.sessionHash || "", "hex");
  const submittedBuffer = Buffer.from(submittedHash, "hex");

  return (
    savedBuffer.length === submittedBuffer.length &&
    crypto.timingSafeEqual(savedBuffer, submittedBuffer)
  );
}

async function clearSecurityUnlockSession(req, res) {
  const cookieValue = getCookie(req, SECURITY_UNLOCK_COOKIE_NAME);

  if (cookieValue && cookieValue.includes(".")) {
    const sessionId = cookieValue.split(".")[0];

    if (sessionId) {
      await admin.firestore()
        .collection("securityPasswordSessions")
        .doc(sessionId)
        .delete()
        .catch(function () {});
    }
  }

  clearCookie(res, SECURITY_UNLOCK_COOKIE_NAME);
}

module.exports = {
  createSecurityUnlockSession,
  hasValidSecurityUnlockSession,
  clearSecurityUnlockSession
};
