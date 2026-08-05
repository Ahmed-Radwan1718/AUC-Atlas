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

function cleanAucId(value) {
  return String(value || "").replace(/\D/g, "").slice(0, 9);
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

function hasValidAucIdFormat(value) {
  return /^900\d{6}$/.test(cleanAucId(value));
}

function getPhoneLookupKey(value) {
  const phone = cleanPhone(value);

  return hasValidPhoneFormat(phone) ? phone.replace(/\D/g, "") : "";
}

function getAucIdLookupKey(value) {
  const aucId = cleanAucId(value);

  return hasValidAucIdFormat(aucId) ? aucId : "";
}

function createProfileError(message, statusCode) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

const DISPLAY_NAME_CHANGE_COOLDOWN_MS = 30 * 24 * 60 * 60 * 1000;
const AUC_ID_CHANGE_COOLDOWN_MS = 30 * 24 * 60 * 60 * 1000;

function getDateFromStoredValue(value) {
  if (!value) {
    return null;
  }

  if (typeof value.toDate === "function") {
    return value.toDate();
  }

  if (typeof value.seconds === "number") {
    return new Date(value.seconds * 1000);
  }

  if (typeof value._seconds === "number") {
    return new Date(value._seconds * 1000);
  }

  const parsedDate = new Date(value);
  return Number.isNaN(parsedDate.getTime()) ? null : parsedDate;
}

function getUnlockDateText(unlockDate) {
  if (!unlockDate) {
    return "";
  }

  return unlockDate.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric"
  });
}

function getDisplayNameUnlockDate(value) {
  const lastChangeDate = getDateFromStoredValue(value);

  if (!lastChangeDate) {
    return null;
  }

  return new Date(lastChangeDate.getTime() + DISPLAY_NAME_CHANGE_COOLDOWN_MS);
}

function getAucIdUnlockDate(value) {
  const lastChangeDate = getDateFromStoredValue(value);

  if (!lastChangeDate) {
    return null;
  }

  return new Date(lastChangeDate.getTime() + AUC_ID_CHANGE_COOLDOWN_MS);
}

function getDisplayNameUnlockDateText(value) {
  return getUnlockDateText(getDisplayNameUnlockDate(value));
}

function getAucIdUnlockDateText(value) {
  return getUnlockDateText(getAucIdUnlockDate(value));
}

async function getTwoFactorResponse(uid, userData) {
  const twoFactorData = userData && userData.twoFactor && typeof userData.twoFactor === "object"
    ? userData.twoFactor
    : {};
  let hasAuthenticatorApp = Boolean(twoFactorData.appEnabled || twoFactorData.appSecret);

  if (!hasAuthenticatorApp) {
    const secretDoc = await admin.firestore().collection("twoFactorSecrets").doc(uid).get().catch(function () {
      return null;
    });
    const secretData = secretDoc && secretDoc.exists ? secretDoc.data() || {} : {};
    hasAuthenticatorApp = Boolean(secretData.appSecret);
  }

  return {
    appEnabled: hasAuthenticatorApp,
    emailEnabled: Boolean(twoFactorData.emailEnabled)
  };
}

module.exports = async function handler(req, res) {
  try {
    if (req.method === "PATCH") {
      const decodedUser = await getSiteSessionUser(req, {
        checkRevoked: true
      });
      const db = admin.firestore();
      const userRef = db.collection("users").doc(decodedUser.uid);
      const storedUserDoc = await userRef.get();
      const storedUserData = storedUserDoc.exists
        ? storedUserDoc.data() || {}
        : {};
      const requestBody = req.body || {};
      const fullName = cleanString(requestBody.fullName, 80);
      const aucId = cleanAucId(
        storedUserData.aucId ||
        storedUserData.aucIdLookupKey ||
        ""
      );
      const aucIdWasSubmitted =
        Object.prototype.hasOwnProperty.call(
          requestBody,
          "aucId"
        );
      const requestedAucId = aucIdWasSubmitted
        ? cleanAucId(requestBody.aucId)
        : "";
      const phone = cleanPhone(
        storedUserData.phone ||
        (
          storedUserData.phoneLookupKey
            ? "+" + storedUserData.phoneLookupKey
            : ""
        )
      );
      const phoneWasSubmitted =
        Object.prototype.hasOwnProperty.call(
          requestBody,
          "phone"
        );
      const requestedPhone = phoneWasSubmitted
        ? cleanPhone(requestBody.phone)
        : "";
      const major = cleanString(requestBody.major, 100);

      if (!fullName) {
        throw createProfileError("Please enter your display name.", 400);
      }

      if (
        aucIdWasSubmitted &&
        requestedAucId !== aucId
      ) {
        throw createProfileError(
          "AUC ID cannot be changed.",
          400
        );
      }

      if (
        phoneWasSubmitted &&
        getPhoneLookupKey(requestedPhone) !==
          getPhoneLookupKey(phone)
      ) {
        throw createProfileError(
          "Phone number cannot be changed.",
          400
        );
      }

      if (aucId && !hasValidAucIdFormat(aucId)) {
        throw createProfileError(
          "The saved AUC ID is invalid.",
          500
        );
      }

      if (phone && !hasValidPhoneFormat(phone)) {
        throw createProfileError(
          "The saved phone number is invalid.",
          500
        );
      }

      const phoneLookupKey = phone ? getPhoneLookupKey(phone) : "";
      const aucIdLookupKey = getAucIdLookupKey(aucId);
      const phoneReservations = db.collection("accountPhoneNumbers");
      const aucIdReservations = db.collection("accountAucIds");
      const existingUserRecord = await admin.auth().getUser(decodedUser.uid);
      let displayNameChanged = false;
      let aucIdChanged = false;

      await db.runTransaction(async function (transaction) {
        const userDoc = await transaction.get(userRef);
        const userData = userDoc.exists ? userDoc.data() || {} : {};
        const currentPhoneLookupKey = userData.phoneLookupKey || getPhoneLookupKey(userData.phone || "");
        const oldPhoneRef = currentPhoneLookupKey ? phoneReservations.doc(currentPhoneLookupKey) : null;
        const nextPhoneRef = phoneLookupKey ? phoneReservations.doc(phoneLookupKey) : null;
        const currentAucIdLookupKey = userData.aucIdLookupKey || getAucIdLookupKey(userData.aucId || "");
        const oldAucIdRef = currentAucIdLookupKey ? aucIdReservations.doc(currentAucIdLookupKey) : null;
        const nextAucIdRef = aucIdLookupKey ? aucIdReservations.doc(aucIdLookupKey) : null;
        const currentFullName = cleanString(userData.fullName || existingUserRecord.displayName || "", 80);
        const currentAucId = cleanAucId(userData.aucId || currentAucIdLookupKey || "");
        const lastDisplayNameChangedAt = userData.displayNameLastChangedAt || userData.usernameLastChangedAt || null;
        const lastAucIdChangedAt = userData.aucIdLastChangedAt || null;
        const requestedDisplayNameChanged = fullName !== currentFullName;
        const requestedAucIdChanged = aucId !== currentAucId;

        displayNameChanged = requestedDisplayNameChanged;
        aucIdChanged = requestedAucIdChanged;

        if (requestedDisplayNameChanged) {
          const unlockDate = getDisplayNameUnlockDate(lastDisplayNameChangedAt);

          if (unlockDate && unlockDate.getTime() > Date.now()) {
            throw createProfileError("You can change your display name again on " + getDisplayNameUnlockDateText(lastDisplayNameChangedAt) + ".", 429);
          }
        }

        if (requestedAucIdChanged) {
          const unlockDate = getAucIdUnlockDate(lastAucIdChangedAt);

          if (unlockDate && unlockDate.getTime() > Date.now()) {
            throw createProfileError("You can change your AUC ID again on " + getAucIdUnlockDateText(lastAucIdChangedAt) + ".", 429);
          }
        }

        if (nextPhoneRef && phoneLookupKey !== currentPhoneLookupKey) {
          const phoneDoc = await transaction.get(nextPhoneRef);
          const phoneData = phoneDoc.exists ? phoneDoc.data() || {} : {};

          if (phoneDoc.exists && (phoneData.uid || "") !== decodedUser.uid) {
            throw createProfileError("This phone number is already used by another account.", 409);
          }
        }

        if (nextAucIdRef && aucIdLookupKey !== currentAucIdLookupKey) {
          const aucIdDoc = await transaction.get(nextAucIdRef);
          const aucIdData = aucIdDoc.exists ? aucIdDoc.data() || {} : {};

          if (aucIdDoc.exists && (aucIdData.uid || "") !== decodedUser.uid) {
            throw createProfileError("This AUC ID number is already used by another account.", 409);
          }
        }

        const now = admin.firestore.FieldValue.serverTimestamp();
        const updateData = {
          fullName,
          aucId,
          aucIdLookupKey,
          phone,
          phoneLookupKey,
          major,
          updatedAt: now
        };

        if (displayNameChanged) {
          updateData.displayNameLastChangedAt = now;
        }

        if (aucIdChanged) {
          updateData.aucIdLastChangedAt = now;
        }

        if (!userDoc.exists) {
          updateData.email = decodedUser.email || "";
          updateData.authProvider = "password";
          updateData.createdAt = now;
        }

        transaction.set(userRef, updateData, { merge: true });

        if (oldPhoneRef && currentPhoneLookupKey !== phoneLookupKey) {
          transaction.delete(oldPhoneRef);
        }

        if (oldAucIdRef && currentAucIdLookupKey !== aucIdLookupKey) {
          transaction.delete(oldAucIdRef);
        }

        if (nextPhoneRef) {
          transaction.set(nextPhoneRef, {
            uid: decodedUser.uid,
            phone,
            phoneLookupKey,
            updatedAt: now
          }, { merge: true });
        }

        if (nextAucIdRef) {
          transaction.set(nextAucIdRef, {
            uid: decodedUser.uid,
            aucId,
            aucIdLookupKey,
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
      const savedAucId = userData.aucId || userData.aucIdLookupKey || "";
      const authProvider = userData.authProvider || "password";
      const displayNameLastChangedAt = userData.displayNameLastChangedAt || userData.usernameLastChangedAt || null;
      const aucIdLastChangedAt = userData.aucIdLastChangedAt || null;
      const twoFactor = await getTwoFactorResponse(decodedUser.uid, userData);

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
          aucId: savedAucId,
          authProvider,
          twoFactor,
          displayNameLastChangedAt,
          aucIdLastChangedAt
        }
      });
    }

    if (req.method !== "GET") {
      return res.status(405).json({ error: "Method not allowed" });
    }

    const decodedUser = await getSiteSessionUser(req, {
      checkRevoked: true
    });

    const userRecord = await admin.auth().getUser(decodedUser.uid);
    const userDoc = await admin.firestore().collection("users").doc(decodedUser.uid).get();
    const userData = userDoc.exists ? userDoc.data() || {} : {};

    const fullName = userData.fullName || userRecord.displayName || "";
    const email = userRecord.email || userData.email || decodedUser.email || "";
    const photoURL = userData.photoURL || userRecord.photoURL || "";
    const phone = userData.phone || "";
    const major = userData.major || "";
    const aucId = userData.aucId || userData.aucIdLookupKey || "";
    const authProvider = userData.authProvider || "password";
    const displayNameLastChangedAt = userData.displayNameLastChangedAt || userData.usernameLastChangedAt || null;
    const aucIdLastChangedAt = userData.aucIdLastChangedAt || null;
    const twoFactor = await getTwoFactorResponse(decodedUser.uid, userData);

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
        aucId,
        authProvider,
        twoFactor,
        displayNameLastChangedAt,
        aucIdLastChangedAt
      }
    });
  } catch (error) {
    console.error("AUC Atlas /api/me failed:", {
      message: error && error.message ? error.message : "",
      code: error && error.code ? error.code : "",
      statusCode: error && error.statusCode ? error.statusCode : 500,
      hasCookieHeader: Boolean(req.headers && req.headers.cookie)
    });

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
