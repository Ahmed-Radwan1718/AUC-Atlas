const admin = require("./firebaseAdmin");
const { getSiteSessionUser } = require("./securityHelpers");

function createAdminError(message, statusCode) {
  const error = new Error(message);
  error.statusCode = statusCode;
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
    const userRecord = await admin.auth().getUser(safeUid);
    return userRecordHasAdminClaim(userRecord);
  } catch (error) {
    if (error && error.code === "auth/user-not-found") {
      return false;
    }

    throw error;
  }
}

async function ensureAdminUser(req) {
  const decodedUser = await getSiteSessionUser(req, {
    checkRevoked: true
  });
  const userRecord = await admin.auth().getUser(decodedUser.uid);
  const allowedByEnvironment = getConfiguredAdminUids().has(decodedUser.uid);
  const allowedByClaim = decodedUser.admin === true || userRecordHasAdminClaim(userRecord);

  if (!allowedByEnvironment && !allowedByClaim) {
    throw createAdminError("Administrator access is required.", 403);
  }

  return {
    uid: decodedUser.uid,
    email: String(userRecord.email || decodedUser.email || "").trim().toLowerCase(),
    displayName: String(userRecord.displayName || "AUC Atlas Admin").trim(),
    decodedUser,
    userRecord
  };
}

module.exports = {
  createAdminError,
  ensureAdminUser,
  isAdminUid
};
