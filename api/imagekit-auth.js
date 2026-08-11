const crypto = require("crypto");
const admin = require("../server/_lib/firebaseAdmin");

const { getSiteSessionUser } = require("../server/_lib/securityHelpers");
const {
  consumeSecurityRateLimit
} = require("../server/_lib/securityRateLimits");
const {
  MATERIAL_MAX_FILE_BYTES,
  MATERIAL_USER_QUOTA_BYTES,
  MATERIAL_UPLOAD_AUTH_TTL_SECONDS,
  cleanMaterialFileName,
  getMaterialFileExtension,
  isAllowedMaterialFileName,
  buildImageKitUploadChecks
} = require("../server/_lib/courseMaterialUploadPolicy");

const MATERIAL_UPLOAD_AUTHORIZATION_WINDOW_MS =
  60 * 60 * 1000;
const MATERIAL_UPLOAD_MAX_AUTHORIZATIONS = 20;

const MATERIAL_TYPE_CHOICES = [
  "Notes",
  "Slides",
  "Syllabus",
  "Past exam",
  "Practice sheet",
  "Lab file",
  "Past assignments",
  "Review sheet"
];
const MATERIAL_TYPE_LOOKUP = MATERIAL_TYPE_CHOICES.reduce(
  function (lookup, materialType) {
    lookup[materialType.toLowerCase()] = materialType;
    return lookup;
  },
  {}
);

function createImageKitAuthError(message, statusCode) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

function createImageKitRateLimitError(retryAfterSeconds) {
  const safeRetryAfterSeconds = Math.max(
    1,
    Math.ceil(Number(retryAfterSeconds) || 1)
  );
  const retryAfterMinutes = Math.max(
    1,
    Math.ceil(safeRetryAfterSeconds / 60)
  );
  const error = createImageKitAuthError(
    "Too many course-material uploads. Try again in " +
      retryAfterMinutes +
      (retryAfterMinutes === 1 ? " minute." : " minutes."),
    429
  );

  error.retryAfterSeconds = safeRetryAfterSeconds;
  return error;
}

function cleanString(value, maxLength) {
  return String(value || "")
    .trim()
    .replace(/\s+/g, " ")
    .slice(0, maxLength);
}

function cleanBoolean(value) {
  if (typeof value === "boolean") {
    return value;
  }

  return cleanString(value, 10).toLowerCase() === "true";
}

function cleanMaterialType(value) {
  return MATERIAL_TYPE_LOOKUP[
    cleanString(value, 80).toLowerCase()
  ] || "";
}

function cleanDescriptionPart(value, maxLength) {
  return cleanString(value, maxLength)
    .replace(/\s*\|\s*/g, " ");
}

function slugifyMaterialValue(value) {
  return String(value || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "unknown";
}

function getTimestampMillis(value) {
  if (!value) return 0;
  if (typeof value.toDate === "function") return value.toDate().getTime();
  if (typeof value.seconds === "number") return value.seconds * 1000;
  if (typeof value._seconds === "number") return value._seconds * 1000;

  const parsedDate = new Date(value);
  return Number.isNaN(parsedDate.getTime()) ? 0 : parsedDate.getTime();
}

function getRequestBody(req) {
  if (typeof req.body === "string") {
    try {
      return JSON.parse(req.body || "{}");
    } catch (error) {
      return {};
    }
  }

  return req.body || {};
}

function getStorageConfig() {
  const url = cleanString(
    process.env.COURSE_MATERIAL_STORAGE_URL,
    1000
  ).replace(/\/+$/, "");
  const secret = cleanString(
    process.env.COURSE_MATERIAL_STORAGE_SECRET,
    500
  ).toLowerCase();

  let parsedUrl = null;

  try {
    parsedUrl = new URL(url);
  } catch (error) {
    parsedUrl = null;
  }

  if (
    !parsedUrl ||
    parsedUrl.protocol !== "https:" ||
    parsedUrl.username ||
    parsedUrl.password ||
    !/^[a-f0-9]{64}$/.test(secret)
  ) {
    throw createImageKitAuthError(
      "Course-material storage is not configured.",
      500
    );
  }

  return {
    url: parsedUrl.origin,
    secret
  };
}

function getMaterialMimeType(fileName) {
  const mimeTypes = {
    pdf: "application/pdf",
    doc: "application/msword",
    docx:
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ppt: "application/vnd.ms-powerpoint",
    pptx:
      "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    xls: "application/vnd.ms-excel",
    xlsx:
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    png: "image/png"
  };

  return (
    mimeTypes[getMaterialFileExtension(fileName)] ||
    ""
  );
}

function createStorageSignature(secret, parts) {
  return crypto
    .createHmac("sha256", secret)
    .update(parts.join("\n"))
    .digest("hex");
}

function buildStorageUploadUrl(config, data) {
  const query = new URLSearchParams({
    key: data.storageKey,
    filename: data.fileName,
    size: String(data.fileSize),
    type: data.fileType,
    expires: String(data.expiresAt),
    nonce: data.nonce
  });

  query.set(
    "signature",
    createStorageSignature(
      config.secret,
      [
        "upload",
        data.storageKey,
        data.fileName,
        String(data.fileSize),
        data.fileType,
        String(data.expiresAt),
        data.nonce
      ]
    )
  );

  return (
    config.url +
    "/upload?" +
    query.toString()
  );
}

async function ensureVerifiedAucUser(req) {
  const decodedUser = await getSiteSessionUser(req, {
    checkRevoked: true
  });
  const userRecord = await admin.auth().getUser(decodedUser.uid);
  const email = String(
    userRecord.email ||
    decodedUser.email ||
    ""
  ).trim().toLowerCase();

  if (
    !userRecord.emailVerified ||
    !email.endsWith("@aucegypt.edu")
  ) {
    throw createImageKitAuthError(
      "Please verify your AUC email address before uploading materials.",
      403
    );
  }

  const userDoc = await admin
    .firestore()
    .collection("users")
    .doc(decodedUser.uid)
    .get();
  const userData = userDoc.exists
    ? userDoc.data() || {}
    : {};
  const displayName = String(
    userData.fullName ||
    userRecord.displayName ||
    email.split("@")[0] ||
    "AUC student"
  )
    .trim()
    .replace(/\s+/g, " ")
    .slice(0, 80);
  const photoURL = String(
    userData.photoURL ||
    userRecord.photoURL ||
    ""
  )
    .trim()
    .slice(0, 500);

  return {
    uid: decodedUser.uid,
    displayName: displayName || "AUC student",
    photoURL
  };
}

async function getStoredBytesForUploader(
  uploaderUid
) {
  const snapshot = await admin
    .firestore()
    .collection("courseMaterials")
    .where("uploaderUid", "==", uploaderUid)
    .get();

  let totalBytes = 0;

  snapshot.forEach(function (doc) {
    const data = doc.data() || {};
    const status = cleanString(
      data.status,
      40
    ).toLowerCase();

    if (status === "rejected") {
      return;
    }

    totalBytes += Math.max(
      0,
      Number(data.size) || 0
    );
  });

  return totalBytes;
}

async function reserveMaterialUploadAuthorization(data) {
  const db = admin.firestore();
  const limitRef = db
    .collection("materialUploadLimits")
    .doc(data.uploaderUid);
  const authorizationRef = db
    .collection("materialUploadAuthorizations")
    .doc(data.authorizationId);
  const nowMs = Date.now();

  await db.runTransaction(async function (transaction) {
    const limitDoc = await transaction.get(limitRef);
    const limitData = limitDoc.exists
      ? limitDoc.data() || {}
      : {};
    const activeAuthorizationExpiresAtMs =
      getTimestampMillis(
        limitData.activeAuthorizationExpiresAt
      );

    if (
      cleanString(
        limitData.activeAuthorizationId,
        80
      ) &&
      activeAuthorizationExpiresAtMs > nowMs
    ) {
      throw createImageKitRateLimitError(
        Math.ceil(
          (activeAuthorizationExpiresAtMs - nowMs) /
            1000
        )
      );
    }

    if (
      data.currentStoredBytes + data.fileSize >
      MATERIAL_USER_QUOTA_BYTES
    ) {
      throw createImageKitAuthError(
        "Your course-material storage quota has been reached.",
        413
      );
    }

    transaction.set(
      limitRef,
      {
        uploaderUid: data.uploaderUid,
        activeAuthorizationId:
          data.authorizationId,
        activeAuthorizationExpiresAt:
          admin.firestore.Timestamp.fromDate(
            new Date(data.expiresAtMs)
          ),
        updatedAt:
          admin.firestore.FieldValue.serverTimestamp()
      },
      { merge: true }
    );

    transaction.set(authorizationRef, {
      authorizationId: data.authorizationId,
      uploaderUid: data.uploaderUid,
      courseCode: data.courseCode,
      courseTitle: data.courseTitle,
      professor: data.professor,
      semester: data.semester,
      materialType: data.materialType,
      title: data.title,
      fileName: data.fileName,
      uploadFileName: data.fileName,
      fileSize: data.fileSize,
      fileType: data.fileType,
      storageKey: data.storageKey,
      folder: "",
      isAnonymous: cleanBoolean(data.isAnonymous),
      uploaderDisplayName: data.uploaderDisplayName,
      uploaderPhotoURL: data.uploaderPhotoURL,
      createdAt:
        admin.firestore.FieldValue.serverTimestamp(),
      createdAtIso: new Date(nowMs).toISOString(),
      expiresAt:
        admin.firestore.Timestamp.fromDate(
          new Date(data.expiresAtMs)
        ),
      consumedAt: null,
      cancelledAt: null
    });
  });
}

async function cancelMaterialUploadAuthorization(
  uploaderUid,
  authorizationId
) {
  const safeAuthorizationId = cleanString(
    authorizationId,
    80
  );

  if (!/^[a-f0-9]{36}$/i.test(safeAuthorizationId)) {
    return;
  }

  const db = admin.firestore();
  const limitRef = db
    .collection("materialUploadLimits")
    .doc(uploaderUid);
  const authorizationRef = db
    .collection("materialUploadAuthorizations")
    .doc(safeAuthorizationId);

  await db.runTransaction(async function (transaction) {
    const authorizationDoc =
      await transaction.get(authorizationRef);

    if (!authorizationDoc.exists) {
      return;
    }

    const authorizationData =
      authorizationDoc.data() || {};

    if (
      cleanString(
        authorizationData.uploaderUid,
        160
      ) !== cleanString(uploaderUid, 160) ||
      authorizationData.consumedAt
    ) {
      return;
    }

    const limitDoc = await transaction.get(limitRef);
    const limitData = limitDoc.exists
      ? limitDoc.data() || {}
      : {};

    transaction.update(authorizationRef, {
      cancelledAt:
        admin.firestore.FieldValue.serverTimestamp()
    });

    if (
      cleanString(
        limitData.activeAuthorizationId,
        80
      ) === safeAuthorizationId
    ) {
      transaction.set(
        limitRef,
        {
          activeAuthorizationId: "",
          activeAuthorizationExpiresAt: null,
          updatedAt:
            admin.firestore.FieldValue.serverTimestamp()
        },
        { merge: true }
      );
    }
  });
}

module.exports = async function handler(req, res) {
  try {
    if (req.method !== "POST") {
      res.setHeader("Allow", "POST");
      return res.status(405).json({ error: "Method not allowed" });
    }

    const uploader = await ensureVerifiedAucUser(req);
    const body = getRequestBody(req);
    const action = cleanString(body.action, 40).toLowerCase();

    res.setHeader("Cache-Control", "no-store");

    if (action === "cancel") {
      await cancelMaterialUploadAuthorization(
        uploader.uid,
        body.authorizationId
      );

      return res.status(200).json({ success: true });
    }

    await consumeSecurityRateLimit({
      scope:
        "material-upload-authorization-user",
      identifier: uploader.uid,
      maxAttempts:
        MATERIAL_UPLOAD_MAX_AUTHORIZATIONS,
      windowMs:
        MATERIAL_UPLOAD_AUTHORIZATION_WINDOW_MS,
      message:
        "Too many course-material upload requests. Please try again later."
    });

    const config = getStorageConfig();
    const courseCode = cleanString(
      body.courseCode,
      40
    ).toUpperCase();
    const courseTitle = cleanString(
      body.courseTitle,
      160
    );
    const professor = cleanString(body.professor, 120);
    const semester = cleanString(body.semester, 80);
    const materialType = cleanMaterialType(
      body.materialType ||
      body.type ||
      body.category
    );
    const isAnonymous = cleanBoolean(
      body.isAnonymous
    );
    const title = cleanString(body.title, 160);
    const fileName = cleanMaterialFileName(body.fileName);
    const fileSize = Number(body.fileSize);
    const fileType = getMaterialMimeType(fileName);

    if (
      !courseCode ||
      !professor ||
      !semester ||
      !materialType ||
      !title ||
      !isAllowedMaterialFileName(fileName) ||
      !fileType ||
      !Number.isSafeInteger(fileSize) ||
      fileSize <= 0 ||
      fileSize > MATERIAL_MAX_FILE_BYTES
    ) {
      throw createImageKitAuthError(
        "Choose a supported course-material file up to 25MB.",
        400
      );
    }

    const authorizationId =
      crypto.randomBytes(18).toString("hex");
    const nonce =
      crypto.randomBytes(18).toString("hex");
    const issuedAt =
      Math.floor(Date.now() / 1000);
    const expiresAt =
      issuedAt + MATERIAL_UPLOAD_AUTH_TTL_SECONDS;
    const expiresAtMs = expiresAt * 1000;
    const currentStoredBytes =
      await getStoredBytesForUploader(
        uploader.uid
      );

    await reserveMaterialUploadAuthorization({
      authorizationId,
      uploaderUid: uploader.uid,
      uploaderDisplayName: uploader.displayName,
      uploaderPhotoURL: uploader.photoURL,
      courseCode,
      courseTitle,
      professor,
      semester,
      materialType,
      isAnonymous,
      title,
      fileName,
      fileSize,
      fileType,
      storageKey: authorizationId,
      expiresAtMs,
      currentStoredBytes
    });

    const uploadUrl = buildStorageUploadUrl(
      config,
      {
        storageKey: authorizationId,
        fileName,
        fileSize,
        fileType,
        expiresAt,
        nonce
      }
    );

    return res.status(200).json({
      authorizationId,
      storageKey: authorizationId,
      uploadUrl,
      fileType,
      expiresAt: new Date(expiresAtMs).toISOString(),
      limits: {
        maxFileBytes: MATERIAL_MAX_FILE_BYTES,
        userQuotaBytes: MATERIAL_USER_QUOTA_BYTES
      }
    });
  } catch (error) {
    res.setHeader("Cache-Control", "no-store");

    if (error.retryAfterSeconds) {
      res.setHeader(
        "Retry-After",
        String(error.retryAfterSeconds)
      );
    }

    return res.status(error.statusCode || 500).json({
      error: error.message || "Could not prepare upload."
    });
  }
};
