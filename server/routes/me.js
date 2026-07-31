const admin = require("../_lib/firebaseAdmin");

const {
  getOptionalSiteSessionUser,
  getSiteSessionUser
} = require("../_lib/securityHelpers");

function getFirstName(fullName, email) {
  const name = String(fullName || "").trim();

  if (name) {
    return name.split(/\s+/)[0];
  }

  return String(email || "").split("@")[0] || "there";
}

function cleanString(value, maxLength) {
  return String(value || "").trim().slice(0, maxLength);
}

function cleanPhone(value) {
  return cleanString(value, 30);
}

function hasValidPhoneFormat(value) {
  const phone = cleanPhone(value);
  const phoneDigits = phone.replace(/\D/g, "");

  return Boolean(
    phone &&
    /^\+?[0-9][0-9\s().-]{7,28}$/.test(phone) &&
    phoneDigits.length >= 10 &&
    phoneDigits.length <= 15 &&
    !/^(\d)\1+$/.test(phoneDigits)
  );
}

function getPhoneLookupKey(value) {
  const phone = cleanPhone(value);

  return hasValidPhoneFormat(phone) ? phone.replace(/\D/g, "") : "";
}

function createProfileError(message, statusCode) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

module.exports = async function handler(req, res) {
  try {
    if (req.method === "PATCH") {
      const decodedUser = await getSiteSessionUser(req, {
        checkRevoked: true
      });
      const fullName = cleanString((req.body || {}).fullName, 80);
      const phone = cleanPhone((req.body || {}).phone);
      const major = cleanString((req.body || {}).major, 100);

      if (!fullName) {
        throw createProfileError("Please enter your display name.", 400);
      }

      if (phone && !hasValidPhoneFormat(phone)) {
        throw createProfileError("Please enter a valid phone number.", 400);
      }

      const phoneLookupKey = phone ? getPhoneLookupKey(phone) : "";
      const db = admin.firestore();
      const userRef = db.collection("users").doc(decodedUser.uid);
      const phoneReservations = db.collection("accountPhoneNumbers");

      await db.runTransaction(async function (transaction) {
        const userDoc = await transaction.get(userRef);
        const userData = userDoc.exists ? userDoc.data() || {} : {};
        const currentPhoneLookupKey = userData.phoneLookupKey || getPhoneLookupKey(userData.phone || "");
        const oldPhoneRef = currentPhoneLookupKey ? phoneReservations.doc(currentPhoneLookupKey) : null;
        const nextPhoneRef = phoneLookupKey ? phoneReservations.doc(phoneLookupKey) : null;

        if (nextPhoneRef && phoneLookupKey !== currentPhoneLookupKey) {
          const phoneDoc = await transaction.get(nextPhoneRef);
          const phoneData = phoneDoc.exists ? phoneDoc.data() || {} : {};

          if (phoneDoc.exists && (phoneData.uid || "") !== decodedUser.uid) {
            throw createProfileError("This phone number is already used by another account.", 409);
          }
        }

        const now = admin.firestore.FieldValue.serverTimestamp();
        const updateData = {
          fullName,
          phone,
          phoneLookupKey,
          major,
          updatedAt: now
        };

        if (!userDoc.exists) {
          updateData.email = decodedUser.email || "";
          updateData.authProvider = "password";
          updateData.createdAt = now;
        }

        transaction.set(userRef, updateData, { merge: true });

        if (oldPhoneRef && currentPhoneLookupKey !== phoneLookupKey) {
          transaction.delete(oldPhoneRef);
        }

        if (nextPhoneRef) {
          transaction.set(nextPhoneRef, {
            uid: decodedUser.uid,
            phone,
            phoneLookupKey,
            updatedAt: now
          }, { merge: true });
        }
      });

      const userRecord = await admin.auth().updateUser(decodedUser.uid, {
        displayName: fullName
      });
      const updatedUserDoc = await userRef.get();
      const userData = updatedUserDoc.exists ? updatedUserDoc.data() || {} : {};
      const savedFullName = userData.fullName || userRecord.displayName || fullName;
      const email = userRecord.email || userData.email || decodedUser.email || "";
      const photoURL = userData.photoURL || userRecord.photoURL || "";
      const savedPhone = userData.phone || "";
      const savedMajor = userData.major || "";
      const authProvider = userData.authProvider || "password";

      return res.status(200).json({
        success: true,
        signedIn: true,
        authenticated: true,
        loggedIn: true,
        user: {
          uid: decodedUser.uid,
          email,
          emailVerified: Boolean(userRecord.emailVerified || userData.emailVerified),
          displayName: savedFullName,
          fullName: savedFullName,
          photoURL,
          firstName: getFirstName(savedFullName, email),
          phone: savedPhone,
          major: savedMajor,
          authProvider
        }
      });
    }

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
    if (req.method !== "GET") {
      return res.status(error.statusCode || 500).json({
        error: error.message || "Could not save account details."
      });
    }

    return res.status(200).json({
      signedIn: false,
      authenticated: false,
      loggedIn: false,
      user: null
    });
  }
};
