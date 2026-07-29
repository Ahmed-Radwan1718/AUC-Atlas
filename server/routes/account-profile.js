const admin = require("../_lib/firebaseAdmin");
const { v2: cloudinary } = require("cloudinary");

const {
  getUserFromRequest
} = require("../_lib/securityHelpers");

const USERNAME_COOLDOWN_MS = 14 * 24 * 60 * 60 * 1000;
const PROFILE_PHOTO_MAX_BYTES = 4 * 1024 * 1024;
const PROFILE_PHOTO_ALLOWED_MIME_TYPES = new Set(["image/jpeg", "image/jpg", "image/png", "image/webp"]);
const PROFILE_PHOTO_MODERATION_MODEL = "omni-moderation-latest";
const PROFILE_PHOTO_BLOCKED_MODERATION_CATEGORIES = new Set(["sexual", "sexual/minors", "violence/graphic"]);
const PROFILE_PHOTO_MODERATION_SCORE_LIMITS = {
  sexual: 0.35,
  "sexual/minors": 0.01,
  "violence/graphic": 0.45
};

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

function configureCloudinary() {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  if (!cloudName || !apiKey || !apiSecret) {
    const error = new Error("Profile photo uploads are not configured.");
    error.statusCode = 500;
    throw error;
  }

  cloudinary.config({
    cloud_name: cloudName,
    api_key: apiKey,
    api_secret: apiSecret,
    secure: true
  });
}

function getProfilePhotoDataUrl(value) {
  const dataUrl = String(value || "").trim();

  if (!dataUrl) {
    return "";
  }

  const match = dataUrl.match(/^data:(image\/(?:jpeg|jpg|png|webp));base64,([A-Za-z0-9+/]+={0,2})$/i);

  if (!match || !PROFILE_PHOTO_ALLOWED_MIME_TYPES.has(match[1].toLowerCase())) {
    const error = new Error("Please upload a JPG, PNG, or WEBP image.");
    error.statusCode = 400;
    throw error;
  }

  const mimeType = match[1].toLowerCase() === "image/jpg" ? "image/jpeg" : match[1].toLowerCase();
  const base64Data = match[2];
  const padding = base64Data.endsWith("==") ? 2 : base64Data.endsWith("=") ? 1 : 0;
  const byteLength = Math.floor((base64Data.length * 3) / 4) - padding;

  if (byteLength > PROFILE_PHOTO_MAX_BYTES) {
    const error = new Error("Profile photo must be 4MB or smaller.");
    error.statusCode = 413;
    throw error;
  }

  return "data:" + mimeType + ";base64," + base64Data;
}

function getOpenAiApiKey() {
  let apiKey = String(process.env.OPENAI_API_KEY || "").trim();

  if (
    apiKey.length >= 2 &&
    (apiKey.startsWith("\"") && apiKey.endsWith("\"") ||
    apiKey.startsWith("'") && apiKey.endsWith("'"))
  ) {
    apiKey = apiKey.slice(1, -1).trim();
  }

  if (!apiKey) {
    const error = new Error("Profile photo moderation is not configured.");
    error.statusCode = 500;
    throw error;
  }

  return apiKey;
}

async function moderateProfilePhoto(dataUrl) {
  if (!dataUrl) {
    return;
  }

  const response = await fetch("https://api.openai.com/v1/moderations", {
    method: "POST",
    headers: {
      "Authorization": "Bearer " + getOpenAiApiKey(),
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: PROFILE_PHOTO_MODERATION_MODEL,
      input: [
        {
          type: "image_url",
          image_url: {
            url: dataUrl
          }
        }
      ]
    })
  });

  if (!response.ok) {
    const details = await response.json().catch(function () {
      return {};
    });
    const apiMessage = details && details.error && details.error.message ? String(details.error.message) : "";

    if (response.status === 401 || response.status === 403) {
      const error = new Error("OpenAI API key for profile photo moderation was rejected.");
      error.statusCode = 502;
      throw error;
    }

    if (response.status === 429) {
      const error = new Error("OpenAI API quota or billing is not active for profile photo moderation.");
      error.statusCode = 502;
      throw error;
    }

    const error = new Error(apiMessage || "Could not verify this profile photo. Please try again.");
    error.statusCode = 502;
    throw error;
  }

  const moderation = await response.json();
  const results = Array.isArray(moderation.results) ? moderation.results : [];
  const blocked = results.some(function (result) {
    const categories = result.categories || {};
    const scores = result.category_scores || {};

    return Array.from(PROFILE_PHOTO_BLOCKED_MODERATION_CATEGORIES).some(function (category) {
      return Boolean(categories[category]) || Number(scores[category] || 0) >= PROFILE_PHOTO_MODERATION_SCORE_LIMITS[category];
    });
  });

  if (blocked) {
    const error = new Error("This profile photo cannot be used. Please choose a non-explicit image.");
    error.statusCode = 400;
    throw error;
  }
}

async function uploadProfilePhoto(uid, dataUrl) {
  const safeDataUrl = getProfilePhotoDataUrl(dataUrl);

  if (!safeDataUrl) {
    return "";
  }

  configureCloudinary();

  const result = await cloudinary.uploader.upload(safeDataUrl, {
    folder: "auc-atlas/profile-photos",
    public_id: uid,
    overwrite: true,
    invalidate: true,
    unique_filename: false,
    resource_type: "image"
  });

  if (!result || !result.secure_url) {
    const error = new Error("Could not upload profile photo.");
    error.statusCode = 500;
    throw error;
  }

  return result.secure_url;
}

async function deleteProfilePhoto(uid) {
  configureCloudinary();

  await cloudinary.uploader.destroy("auc-atlas/profile-photos/" + uid, {
    invalidate: true,
    resource_type: "image"
  });
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
  const body = req.body || {};
  const fullName = cleanString(body.fullName, 80) || userData.fullName || userRecord.displayName || "";
  const oldFullName = cleanString(userData.fullName || userRecord.displayName, 80);
  const nameChanged = fullName !== oldFullName;
  const phone = cleanPhone(body.phone);
  const phoneLookupKey = getPhoneLookupKey(phone);
  const profilePhotoDataUrl = getProfilePhotoDataUrl(body.profilePhotoDataUrl);
  const removeProfilePhoto = Boolean(body.removeProfilePhoto);

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

  let photoURL = userData.photoURL || userRecord.photoURL || "";

  if (profilePhotoDataUrl) {
    await moderateProfilePhoto(profilePhotoDataUrl);
    photoURL = await uploadProfilePhoto(uid, profilePhotoDataUrl);
  } else if (removeProfilePhoto) {
    await deleteProfilePhoto(uid);
    photoURL = "";
  }

  const oldPhoneLookupKey = cleanString(userData.phoneLookupKey, 40) || getPhoneLookupKey(userData.phone || "");

  await syncPhoneReservation(uid, oldPhoneLookupKey, phone, phoneLookupKey);

  const updateData = {
    fullName,
    phone,
    phoneLookupKey,
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  };

  if (profilePhotoDataUrl && photoURL) {
    updateData.photoURL = photoURL;
    updateData.profilePhotoUpdatedAt = admin.firestore.FieldValue.serverTimestamp();
  } else if (removeProfilePhoto) {
    updateData.photoURL = admin.firestore.FieldValue.delete();
    updateData.profilePhotoDeletedAt = admin.firestore.FieldValue.serverTimestamp();
  }

  if (nameChanged) {
    updateData.usernameLastChangedAt = admin.firestore.FieldValue.serverTimestamp();
  }

  await userRef.set(updateData, { merge: true });

  const authUpdateData = {};

  if (nameChanged) {
    authUpdateData.displayName = fullName;
  }

  if (profilePhotoDataUrl && photoURL) {
    authUpdateData.photoURL = photoURL;
  } else if (removeProfilePhoto) {
    authUpdateData.photoURL = null;
  }

  if (Object.keys(authUpdateData).length) {
    await admin.auth().updateUser(uid, authUpdateData);
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
