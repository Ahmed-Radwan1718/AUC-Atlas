const admin = require("../_lib/firebaseAdmin");

const {
  getUserFromRequest
} = require("../_lib/securityHelpers");

const USERNAME_COOLDOWN_MS = 14 * 24 * 60 * 60 * 1000;

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

function createInvalidPhoneError() {
  const error = new Error("Please enter a valid phone number.");
  error.statusCode = 400;
  return error;
}

function createPhoneInUseError() {
  const error = new Error("This phone number is already used by another account.");
  error.statusCode = 409;
  return error;
}

function getFirstName(fullName, email) {
  const name = String(fullName || "").trim();

  if (name) {
    return name.split(/\s+/)[0];
  }

  return String(email || "").split("@")[0] || "there";
}

function serializeTimestamp(value) {
  if (!value) {
    return null;
  }

  if (typeof value.toDate === "function") {
    return value.toDate().toISOString();
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function timestampToMillis(value) {
  if (!value) {
    return 0;
  }

  if (typeof value.toMillis === "function") {
    return value.toMillis();
  }

  if (typeof value.toDate === "function") {
    return value.toDate().getTime();
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 0 : date.getTime();
}

function snapshotHasDifferentUser(snapshot, uid) {
  return Boolean(snapshot && snapshot.docs && snapshot.docs.some(function (doc) {
    return doc.id !== uid;
  }));
}

async function ensurePhoneCanBeUsedByUser(uid, phone, phoneLookupKey) {
  const db = admin.firestore();

  const [phoneReservationDoc, exactPhoneSnapshot, normalizedPhoneSnapshot] = await Promise.all([
    db.collection("accountPhoneNumbers").doc(phoneLookupKey).get(),
    db.collection("users").where("phone", "==", phone).limit(1).get(),
    db.collection("users").where("phoneLookupKey", "==", phoneLookupKey).limit(1).get()
  ]);

  const phoneReservation = phoneReservationDoc.exists ? phoneReservationDoc.data() || {} : {};

  if (
    phoneReservationDoc.exists && phoneReservation.uid !== uid ||
    snapshotHasDifferentUser(exactPhoneSnapshot, uid) ||
    snapshotHasDifferentUser(normalizedPhoneSnapshot, uid)
  ) {
    throw createPhoneInUseError();
  }
}

async function syncPhoneReservation(uid, oldPhoneLookupKey, phone, phoneLookupKey) {
  const db = admin.firestore();
  const phoneReservations = db.collection("accountPhoneNumbers");
  const newPhoneRef = phoneReservations.doc(phoneLookupKey);
  const oldPhoneRef = oldPhoneLookupKey ? phoneReservations.doc(oldPhoneLookupKey) : null;

  await db.runTransaction(async function (transaction) {
    const newPhoneDoc = await transaction.get(newPhoneRef);
    let oldPhoneDoc = null;

    if (newPhoneDoc.exists) {
      const newPhoneData = newPhoneDoc.data() || {};

      if (newPhoneData.uid !== uid) {
        throw createPhoneInUseError();
      }
    }

    if (oldPhoneRef && oldPhoneRef.path !== newPhoneRef.path) {
      oldPhoneDoc = await transaction.get(oldPhoneRef);
    }

    const timestamp = admin.firestore.FieldValue.serverTimestamp();
    const phoneData = {
      uid,
      phone,
      phoneLookupKey,
      updatedAt: timestamp
    };

    if (!newPhoneDoc.exists) {
      phoneData.createdAt = timestamp;
    }

    transaction.set(newPhoneRef, phoneData, { merge: true });

    if (oldPhoneDoc && oldPhoneDoc.exists) {
      const oldPhoneData = oldPhoneDoc.data() || {};

      if (oldPhoneData.uid === uid) {
        transaction.delete(oldPhoneRef);
      }
    }
  });
}

async function getAccountUser(uid, decodedUser) {
  const userRecord = await admin.auth().getUser(uid);
  const userDoc = await admin.firestore().collection("users").doc(uid).get();
  const userData = userDoc.exists ? userDoc.data() || {} : {};
  const fullName = userData.fullName || userRecord.displayName || "";
  const email = userRecord.email || userData.email || decodedUser.email || "";
  const providerIds = (userRecord.providerData || [])
    .map((provider) => provider && provider.providerId ? provider.providerId : "")
    .filter(Boolean);

  return {
    uid,
    email,
    emailVerified: Boolean(userRecord.emailVerified),
    displayName: fullName,
    fullName,
    phone: userData.phone || "",
    usernameLastChangedAt: serializeTimestamp(userData.usernameLastChangedAt),
    photoURL: userData.photoURL || userRecord.photoURL || "",
    authProvider: userData.authProvider || "",
    providers: {
      password: providerIds.includes("password") || userData.authProvider === "password",
      google: providerIds.includes("google.com") || userData.authProvider === "google",
      github: providerIds.includes("github.com") || userData.authProvider === "github",
      facebook: providerIds.includes("facebook.com") || userData.authProvider === "facebook"
    },
    firstName: getFirstName(fullName, email)
  };
}

async function handlePatch(req, res, uid, decodedUser) {
  const db = admin.firestore();
  const userRef = db.collection("users").doc(uid);
  const userRecord = await admin.auth().getUser(uid);
  const userDoc = await userRef.get();
  const userData = userDoc.exists ? userDoc.data() || {} : {};
  const fullName = cleanString((req.body || {}).fullName, 80) || userData.fullName || userRecord.displayName || "";
  const oldFullName = cleanString(userData.fullName || userRecord.displayName, 80);
  const nameChanged = fullName !== oldFullName;
  const phone = cleanPhone((req.body || {}).phone);
  const phoneLookupKey = getPhoneLookupKey(phone);

  if (!fullName) {
    const error = new Error("Please enter your display name.");
    error.statusCode = 400;
    throw error;
  }

  if (nameChanged && userData.usernameLastChangedAt) {
    const lastChangedMs = timestampToMillis(userData.usernameLastChangedAt);

    if (lastChangedMs && Date.now() - lastChangedMs < USERNAME_COOLDOWN_MS) {
      const error = new Error("You can change your username once every 14 days.");
      error.statusCode = 429;
      throw error;
    }
  }

  if (!phoneLookupKey) {
    throw createInvalidPhoneError();
  }

  await ensurePhoneCanBeUsedByUser(uid, phone, phoneLookupKey);

  const oldPhoneLookupKey = cleanString(userData.phoneLookupKey, 40) || getPhoneLookupKey(userData.phone || "");

  await syncPhoneReservation(uid, oldPhoneLookupKey, phone, phoneLookupKey);

  const updateData = {
    fullName,
    phone,
    phoneLookupKey,
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  };

  if (nameChanged) {
    updateData.usernameLastChangedAt = admin.firestore.FieldValue.serverTimestamp();
  }

  await userRef.set(updateData, { merge: true });

  if (nameChanged) {
    await admin.auth().updateUser(uid, {
      displayName: fullName
    });
  }

  const user = await getAccountUser(uid, decodedUser);

  return res.status(200).json({
    success: true,
    user
  });
}

module.exports = async function handler(req, res) {
  try {
    const decodedUser = await getUserFromRequest(req, {
      checkRevoked: true,
      requireCompletedTwoFactor: true
    });

    if (req.method === "GET") {
      const user = await getAccountUser(decodedUser.uid, decodedUser);

      return res.status(200).json({
        success: true,
        user
      });
    }

    if (req.method === "PATCH") {
      return await handlePatch(req, res, decodedUser.uid, decodedUser);
    }

    return res.status(405).json({ error: "Method not allowed" });
  } catch (error) {
    const sessionRevoked = Boolean(error && (
      error.message === "account-session-revoked" ||
      error.message === "account-session-invalid"
    ));

    return res.status(error.statusCode || 500).json({
      error: error.message || "Could not update account details.",
      sessionRevoked,
      sessionRevokedReason: sessionRevoked && error && error.revokedReason ? error.revokedReason : ""
    });
  }
};
