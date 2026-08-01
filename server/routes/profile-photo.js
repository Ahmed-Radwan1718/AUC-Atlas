const crypto = require("crypto");
const admin = require("../_lib/firebaseAdmin");

const {
  getSiteSessionUser
} = require("../_lib/securityHelpers");

const PROFILE_PHOTO_PUBLIC_ID_PREFIX = "auc-atlas/profile-photos";

function getFirstName(fullName, email) {
  const name = String(fullName || "").trim();

  if (name) {
    return name.split(/\s+/)[0];
  }

  return String(email || "").split("@")[0] || "there";
}

function getCloudinaryConfig() {
  let cloudName = String(process.env.CLOUDINARY_CLOUD_NAME || process.env.CLOUDINARY_NAME || "").trim();
  let apiKey = String(process.env.CLOUDINARY_API_KEY || "").trim();
  let apiSecret = String(process.env.CLOUDINARY_API_SECRET || "").trim();

  if ((!cloudName || !apiKey || !apiSecret) && process.env.CLOUDINARY_URL) {
    try {
      const cloudinaryUrl = new URL(process.env.CLOUDINARY_URL);
      cloudName = cloudName || cloudinaryUrl.hostname;
      apiKey = apiKey || decodeURIComponent(cloudinaryUrl.username || "");
      apiSecret = apiSecret || decodeURIComponent(cloudinaryUrl.password || "");
    } catch (error) {}
  }

  if (!cloudName || !apiKey || !apiSecret) {
    const error = new Error("Cloudinary is not configured.");
    error.statusCode = 500;
    throw error;
  }

  return { cloudName, apiKey, apiSecret };
}

function createProfilePhotoError(message, statusCode) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

function getSafePublicIdPart(value) {
  return String(value || "").replace(/[^\w-]/g, "_");
}

function getProfilePhotoPublicId(uid) {
  return PROFILE_PHOTO_PUBLIC_ID_PREFIX + "/" + getSafePublicIdPart(uid);
}

function signCloudinaryParams(params, apiSecret) {
  const signatureBase = Object.keys(params).sort().map(function (key) {
    return key + "=" + params[key];
  }).join("&");

  return crypto.createHash("sha1").update(signatureBase + apiSecret).digest("hex");
}

function isExpectedCloudinaryPhotoUrl(photoURL, config, publicId) {
  try {
    const parsedUrl = new URL(String(photoURL || ""));
    const pathname = decodeURIComponent(parsedUrl.pathname || "");

    return (
      parsedUrl.protocol === "https:" &&
      parsedUrl.hostname === "res.cloudinary.com" &&
      pathname.indexOf("/" + config.cloudName + "/image/upload/") === 0 &&
      pathname.indexOf("/" + publicId) !== -1
    );
  } catch (error) {
    return false;
  }
}

async function destroyCloudinaryPhoto(config, publicId) {
  const timestamp = String(Math.floor(Date.now() / 1000));
  const signedParams = {
    invalidate: "true",
    public_id: publicId,
    timestamp
  };

  const signature = signCloudinaryParams(signedParams, config.apiSecret);
  const body = new URLSearchParams(Object.assign({}, signedParams, {
    api_key: config.apiKey,
    signature
  }));

  await fetch("https://api.cloudinary.com/v1_1/" + encodeURIComponent(config.cloudName) + "/image/destroy", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body: body.toString()
  }).catch(function () {});
}

async function getAccountUser(uid, fallbackEmail) {
  const userRecord = await admin.auth().getUser(uid);
  const userDoc = await admin.firestore().collection("users").doc(uid).get();
  const userData = userDoc.exists ? userDoc.data() || {} : {};
  const fullName = userData.fullName || userRecord.displayName || "";
  const email = userRecord.email || userData.email || fallbackEmail || "";
  const twoFactorData = userData.twoFactor && typeof userData.twoFactor === "object" ? userData.twoFactor : {};

  return {
    uid,
    email,
    emailVerified: Boolean(userRecord.emailVerified || userData.emailVerified),
    displayName: fullName,
    fullName,
    photoURL: userData.photoURL || userRecord.photoURL || "",
    firstName: getFirstName(fullName, email),
    phone: userData.phone || "",
    major: userData.major || "",
    authProvider: userData.authProvider || "password",
    twoFactor: {
      appEnabled: Boolean(twoFactorData.appEnabled),
      emailEnabled: Boolean(twoFactorData.emailEnabled)
    }
  };
}

async function saveProfilePhoto(uid, decodedUser, photoURL, publicId) {
  const userRef = admin.firestore().collection("users").doc(uid);
  const now = admin.firestore.FieldValue.serverTimestamp();

  await admin.auth().updateUser(uid, {
    photoURL
  });

  await userRef.set({
    email: decodedUser.email || "",
    photoURL,
    photoPublicId: publicId,
    updatedAt: now
  }, { merge: true });

  return getAccountUser(uid, decodedUser.email || "");
}

async function removeProfilePhoto(uid, decodedUser, publicId, config) {
  await destroyCloudinaryPhoto(config, publicId);

  const userRef = admin.firestore().collection("users").doc(uid);
  const now = admin.firestore.FieldValue.serverTimestamp();

  await admin.auth().updateUser(uid, {
    photoURL: null
  });

  await userRef.set({
    email: decodedUser.email || "",
    photoURL: "",
    photoPublicId: "",
    updatedAt: now
  }, { merge: true });

  return getAccountUser(uid, decodedUser.email || "");
}

module.exports = async function handler(req, res) {
  try {
    if (req.method !== "POST") {
      return res.status(405).json({ error: "Method not allowed" });
    }

    const decodedUser = await getSiteSessionUser(req, {
      checkRevoked: true
    });
    const body = req.body || {};
    const action = String(body.action || "").trim();
    const config = getCloudinaryConfig();
    const publicId = getProfilePhotoPublicId(decodedUser.uid);

    if (action === "signature") {
      const timestamp = String(Math.floor(Date.now() / 1000));
      const signedParams = {
        invalidate: "true",
        overwrite: "true",
        public_id: publicId,
        timestamp
      };

      return res.status(200).json({
        success: true,
        cloudName: config.cloudName,
        apiKey: config.apiKey,
        timestamp,
        publicId,
        overwrite: "true",
        invalidate: "true",
        signature: signCloudinaryParams(signedParams, config.apiSecret)
      });
    }

    if (action === "save") {
      const photoURL = String(body.photoURL || "").trim();
      const submittedPublicId = String(body.publicId || "").trim();

      if (submittedPublicId !== publicId || !isExpectedCloudinaryPhotoUrl(photoURL, config, publicId)) {
        throw createProfilePhotoError("Could not verify uploaded profile photo.", 400);
      }

      const user = await saveProfilePhoto(decodedUser.uid, decodedUser, photoURL, publicId);

      return res.status(200).json({
        success: true,
        user
      });
    }

    if (action === "remove") {
      const user = await removeProfilePhoto(decodedUser.uid, decodedUser, publicId, config);

      return res.status(200).json({
        success: true,
        user
      });
    }

    throw createProfilePhotoError("Unsupported profile photo action.", 400);
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      error: error.message || "Could not update profile photo."
    });
  }
};
