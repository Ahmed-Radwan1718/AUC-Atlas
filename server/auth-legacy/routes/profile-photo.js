const crypto = require("crypto");
const admin = require("../_lib/firebaseAdmin");

const {
  getSiteSessionUser
} = require("../_lib/securityHelpers");
const {
  consumeSecurityRateLimit
} = require("../_lib/securityRateLimits");

const PROFILE_PHOTO_PUBLIC_ID_PREFIX = "auc-atlas/profile-photos";
const PROFILE_PHOTO_UPLOAD_PRESET = String(
  process.env.CLOUDINARY_PROFILE_PHOTO_UPLOAD_PRESET ||
  "auc_atlas_profile_photos"
).trim();
const PROFILE_PHOTO_MAX_BYTES = 4 * 1024 * 1024;
const PROFILE_PHOTO_ALLOWED_FORMATS = [
  "jpg",
  "jpeg",
  "png",
  "webp"
];
const PROFILE_PHOTO_UPLOADS_PER_HOUR = 5;
const PROFILE_PHOTO_UPLOAD_WINDOW_MS = 60 * 60 * 1000;
const PROFILE_PHOTO_MUTATIONS_PER_HOUR = 10;
const PROFILE_PHOTO_MUTATION_WINDOW_MS = 60 * 60 * 1000;

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

function createProfilePhotoRateLimitError(retryAfterSeconds) {
  const safeRetryAfterSeconds = Math.max(
    1,
    Math.ceil(Number(retryAfterSeconds) || 1)
  );
  const retryAfterMinutes = Math.max(
    1,
    Math.ceil(safeRetryAfterSeconds / 60)
  );
  const error = createProfilePhotoError(
    "Too many profile-photo uploads. Try again in " +
      retryAfterMinutes +
      (retryAfterMinutes === 1 ? " minute." : " minutes."),
    429
  );

  error.retryAfterSeconds = safeRetryAfterSeconds;
  return error;
}

function getTimestampMillis(value) {
  if (!value) return 0;
  if (typeof value.toDate === "function") return value.toDate().getTime();
  if (typeof value.seconds === "number") return value.seconds * 1000;
  if (typeof value._seconds === "number") return value._seconds * 1000;

  const parsedDate = new Date(value);
  return Number.isNaN(parsedDate.getTime()) ? 0 : parsedDate.getTime();
}

function getSafePublicIdPart(value) {
  return String(value || "").replace(/[^\w-]/g, "_");
}

function getProfilePhotoPublicIdPrefix(uid) {
  return PROFILE_PHOTO_PUBLIC_ID_PREFIX + "/" + getSafePublicIdPart(uid);
}

function createProfilePhotoPublicId(uid) {
  return (
    getProfilePhotoPublicIdPrefix(uid) +
    "/" +
    Date.now() +
    "-" +
    crypto.randomBytes(8).toString("hex")
  );
}

function isExpectedProfilePhotoPublicId(uid, publicId) {
  const prefix = getProfilePhotoPublicIdPrefix(uid) + "/";
  const suffix = String(publicId || "").slice(prefix.length);

  return (
    String(publicId || "").indexOf(prefix) === 0 &&
    /^\d{10,16}-[a-f0-9]{16}$/i.test(suffix)
  );
}

function signCloudinaryParams(params, apiSecret) {
  const signatureBase = Object.keys(params).sort().map(function (key) {
    return key + "=" + params[key];
  }).join("&");

  return crypto.createHash("sha1").update(signatureBase + apiSecret).digest("hex");
}

async function consumeProfilePhotoUploadAttempt(uid) {
  const db = admin.firestore();
  const limitRef = db
    .collection("profilePhotoUploadLimits")
    .doc(uid);
  const nowMs = Date.now();

  await db.runTransaction(async function (transaction) {
    const limitDoc = await transaction.get(limitRef);
    const data = limitDoc.exists
      ? limitDoc.data() || {}
      : {};
    const windowStartedAtMs = getTimestampMillis(
      data.windowStartedAt
    );
    const hasActiveWindow =
      windowStartedAtMs > 0 &&
      nowMs <
        windowStartedAtMs +
          PROFILE_PHOTO_UPLOAD_WINDOW_MS;
    const uploadCount = hasActiveWindow
      ? Math.max(0, Number(data.uploadCount) || 0)
      : 0;
    const activeWindowStartedAtMs = hasActiveWindow
      ? windowStartedAtMs
      : nowMs;

    if (uploadCount >= PROFILE_PHOTO_UPLOADS_PER_HOUR) {
      throw createProfilePhotoRateLimitError(
        Math.ceil(
          (
            activeWindowStartedAtMs +
            PROFILE_PHOTO_UPLOAD_WINDOW_MS -
            nowMs
          ) / 1000
        )
      );
    }

    transaction.set(
      limitRef,
      {
        uid,
        uploadCount: uploadCount + 1,
        windowStartedAt:
          admin.firestore.Timestamp.fromDate(
            new Date(activeWindowStartedAtMs)
          ),
        updatedAt:
          admin.firestore.FieldValue.serverTimestamp()
      },
      { merge: true }
    );
  });
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

async function getCloudinaryPhotoDetails(config, publicId) {
  const response = await fetch(
    "https://api.cloudinary.com/v1_1/" +
      encodeURIComponent(config.cloudName) +
      "/resources/image/upload/" +
      encodeURIComponent(publicId),
    {
      headers: {
        Accept: "application/json",
        Authorization:
          "Basic " +
          Buffer.from(
            config.apiKey + ":" + config.apiSecret
          ).toString("base64")
      }
    }
  );

  if (response.status === 404) {
    throw createProfilePhotoError(
      "Could not verify uploaded profile photo.",
      400
    );
  }

  if (!response.ok) {
    throw createProfilePhotoError(
      "Could not verify the stored profile photo.",
      502
    );
  }

  return response.json().catch(function () {
    return {};
  });
}

async function verifyCloudinaryPhoto(
  config,
  publicId,
  submittedVersion
) {
  const asset = await getCloudinaryPhotoDetails(
    config,
    publicId
  );
  const format = String(asset.format || "")
    .trim()
    .toLowerCase();
  const bytes = Math.max(0, Number(asset.bytes) || 0);
  const version = Number(asset.version);
  const isValid =
    asset.public_id === publicId &&
    asset.resource_type === "image" &&
    asset.type === "upload" &&
    PROFILE_PHOTO_ALLOWED_FORMATS.includes(format) &&
    bytes > 0 &&
    bytes <= PROFILE_PHOTO_MAX_BYTES &&
    Number.isSafeInteger(version) &&
    version === Number(submittedVersion) &&
    isExpectedCloudinaryPhotoUrl(
      asset.secure_url,
      config,
      publicId
    );

  if (!isValid) {
    throw createProfilePhotoError(
      "The uploaded profile photo type or size is not allowed.",
      400
    );
  }

  return String(asset.secure_url || "").trim();
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
    major: userData.major || "",
    authProvider: userData.authProvider || "password",
    twoFactor: {
      appEnabled: Boolean(twoFactorData.appEnabled),
      emailEnabled: Boolean(twoFactorData.emailEnabled)
    }
  };
}

async function saveProfilePhoto(
  uid,
  decodedUser,
  photoURL,
  publicId,
  config
) {
  const userRef = admin.firestore().collection("users").doc(uid);
  const userDoc = await userRef.get();
  const userData = userDoc.exists
    ? userDoc.data() || {}
    : {};
  const previousPublicId = String(
    userData.photoPublicId ||
    (userData.photoURL
      ? getProfilePhotoPublicIdPrefix(uid)
      : "")
  ).trim();
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

  if (
    previousPublicId &&
    previousPublicId !== publicId
  ) {
    await destroyCloudinaryPhoto(
      config,
      previousPublicId
    );
  }

  return getAccountUser(uid, decodedUser.email || "");
}

async function removeProfilePhoto(uid, decodedUser, config) {
  const userRef = admin.firestore().collection("users").doc(uid);
  const userDoc = await userRef.get();
  const userData = userDoc.exists
    ? userDoc.data() || {}
    : {};
  const publicId = String(
    userData.photoPublicId ||
    getProfilePhotoPublicIdPrefix(uid)
  ).trim();

  await destroyCloudinaryPhoto(config, publicId);

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

    res.setHeader("Cache-Control", "no-store");

    if (action === "save" || action === "remove") {
      await consumeSecurityRateLimit({
        scope: "profile-photo-mutation-user",
        identifier: decodedUser.uid,
        maxAttempts:
          PROFILE_PHOTO_MUTATIONS_PER_HOUR,
        windowMs:
          PROFILE_PHOTO_MUTATION_WINDOW_MS,
        message:
          "Too many profile photo changes. Please try again later."
      });
    }

    if (action === "signature") {
      await consumeProfilePhotoUploadAttempt(
        decodedUser.uid
      );

      const timestamp = String(Math.floor(Date.now() / 1000));
      const publicId = createProfilePhotoPublicId(
        decodedUser.uid
      );
      const allowedFormats =
        PROFILE_PHOTO_ALLOWED_FORMATS.join(",");
      const signedParams = {
        allowed_formats: allowedFormats,
        invalidate: "true",
        overwrite: "false",
        public_id: publicId,
        timestamp,
        upload_preset: PROFILE_PHOTO_UPLOAD_PRESET
      };

      return res.status(200).json({
        success: true,
        cloudName: config.cloudName,
        apiKey: config.apiKey,
        timestamp,
        publicId,
        overwrite: "false",
        invalidate: "true",
        allowedFormats,
        uploadPreset: PROFILE_PHOTO_UPLOAD_PRESET,
        signature: signCloudinaryParams(
          signedParams,
          config.apiSecret
        )
      });
    }

    if (action === "save") {
      const submittedPublicId = String(
        body.publicId || ""
      ).trim();
      const submittedVersion = Number(body.version);

      if (
        !isExpectedProfilePhotoPublicId(
          decodedUser.uid,
          submittedPublicId
        ) ||
        !Number.isSafeInteger(submittedVersion) ||
        submittedVersion <= 0
      ) {
        throw createProfilePhotoError(
          "Could not verify uploaded profile photo.",
          400
        );
      }

      const photoURL = await verifyCloudinaryPhoto(
        config,
        submittedPublicId,
        submittedVersion
      );
      const user = await saveProfilePhoto(
        decodedUser.uid,
        decodedUser,
        photoURL,
        submittedPublicId,
        config
      );

      return res.status(200).json({
        success: true,
        user
      });
    }

    if (action === "remove") {
      const user = await removeProfilePhoto(
        decodedUser.uid,
        decodedUser,
        config
      );

      return res.status(200).json({
        success: true,
        user
      });
    }

    throw createProfilePhotoError("Unsupported profile photo action.", 400);
  } catch (error) {
    res.setHeader("Cache-Control", "no-store");

    if (error.retryAfterSeconds) {
      res.setHeader(
        "Retry-After",
        String(error.retryAfterSeconds)
      );
    }

    return res.status(error.statusCode || 500).json({
      error: error.message || "Could not update profile photo."
    });
  }
};
