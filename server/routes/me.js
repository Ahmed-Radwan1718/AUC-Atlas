const admin = require("../_lib/firebaseAdmin");

const {
  getOptionalSiteSessionUser,
  getUserFromRequest
} = require("../_lib/securityHelpers");

function getFirstName(fullName, email) {
  const name = String(fullName || "").trim();

  if (name) {
    return name.split(/\s+/)[0];
  }

  return String(email || "").split("@")[0] || "there";
}

async function getSessionUser(req) {
  if (typeof getOptionalSiteSessionUser === "function") {
    return await getOptionalSiteSessionUser(req, {
      checkRevoked: true,
      requireCompletedTwoFactor: true
    });
  }

  try {
    return await getUserFromRequest(req, {
      checkRevoked: true,
      requireCompletedTwoFactor: true
    });
  } catch (error) {
    return null;
  }
}

module.exports = async function handler(req, res) {
  try {
    if (req.method !== "GET") {
      return res.status(405).json({ error: "Method not allowed" });
    }

    const decodedUser = await getSessionUser(req);

    if (!decodedUser || !decodedUser.uid) {
return res.status(200).json({
  signedIn: false,
  authenticated: false,
  loggedIn: false,
  user: null
});
    }

    const userRecord = await admin.auth().getUser(decodedUser.uid);
    const userDoc = await admin.firestore().collection("users").doc(decodedUser.uid).get();
    const userData = userDoc.exists ? userDoc.data() || {} : {};

    const fullName = userData.fullName || userRecord.displayName || "";
    const email = userRecord.email || userData.email || decodedUser.email || "";
    const photoURL = userData.photoURL || userRecord.photoURL || "";
    const firstName = getFirstName(fullName, email);

return res.status(200).json({
  signedIn: true,
  authenticated: true,
  loggedIn: true,
  user: {
        uid: decodedUser.uid,
        email,
        emailVerified: Boolean(userRecord.emailVerified),
        displayName: fullName,
        fullName,
        photoURL,
        firstName
      }
    });
  } catch (error) {
    const sessionRevoked = Boolean(error && (
      error.message === "account-session-revoked" ||
      error.message === "account-session-invalid"
    ));

return res.status(200).json({
  signedIn: false,
  authenticated: false,
  loggedIn: false,
  sessionRevoked,
  sessionRevokedReason: sessionRevoked && error && error.revokedReason ? error.revokedReason : "",
  user: null
});
  }
};
