const admin = require("../_lib/firebaseAdmin");

const {
  getOptionalSiteSessionUser
} = require("../_lib/securityHelpers");

function getFirstName(fullName, email) {
  const name = String(fullName || "").trim();

  if (name) {
    return name.split(/\s+/)[0];
  }

  return String(email || "").split("@")[0] || "there";
}

module.exports = async function handler(req, res) {
  try {
    if (req.method !== "GET") {
      return res.status(405).json({ error: "Method not allowed" });
    }

    const decodedUser = await getOptionalSiteSessionUser(req, {
      checkRevoked: true
    });

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
    const phone = userData.phone || "";
    const major = userData.major || "";
    const authProvider = userData.authProvider || "password";

    return res.status(200).json({
      signedIn: true,
      authenticated: true,
      loggedIn: true,
      user: {
        uid: decodedUser.uid,
        email,
        emailVerified: Boolean(userRecord.emailVerified || userData.emailVerified),
        displayName: fullName,
        fullName,
        photoURL,
        firstName: getFirstName(fullName, email),
        phone,
        major,
        authProvider
      }
    });
  } catch (error) {
    return res.status(200).json({
      signedIn: false,
      authenticated: false,
      loggedIn: false,
      user: null
    });
  }
};
