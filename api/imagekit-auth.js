const crypto = require("crypto");
const admin = require("../server/_lib/firebaseAdmin");

const { getSiteSessionUser } = require("../server/_lib/securityHelpers");
const {
  MATERIAL_MAX_FILE_BYTES,
  MATERIAL_USER_QUOTA_BYTES,
  MATERIAL_UPLOAD_AUTH_TTL_SECONDS,
  cleanMaterialFileName,
  getMaterialFileExtension,
  isAllowedMaterialFileName,
  buildImageKitUploadChecks
} = require("../server/_lib/courseMaterialUploadPolicy");

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

function getImageKitConfig() {
  const privateKey = cleanString(
    process.env.IMAGEKIT_PRIVATE_KEY,
    500
  );
  const publicKey = cleanString(
    process.env.IMAGEKIT_PUBLIC_KEY,
    500
  );
  const urlEndpoint = cleanString(
    process.env.IMAGEKIT_URL_ENDPOINT,
    1000
  );

  if (!privateKey || !publicKey || !urlEndpoint) {
    throw createImageKitAuthError(
      "ImageKit environment variables are missing.",
      500
    );
  }

  return { privateKey, publicKey, urlEndpoint };
}

function getImageKitAuthorizationHeader(privateKey) {
  return "Basic " +
    Buffer.from(privateKey + ":").toString("base64");
}

function buildImageKitFileName(fileName) {
  const safeFileName = cleanMaterialFileName(fileName);
  const extension = getMaterialFileExtension(safeFileName);
  const baseName = safeFileName
    .replace(/\.[A-Za-z0-9]+$/, "")
    .replace(/[^A-Za-z0-9-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 180) || "course-material";

  return baseName + "." + extension;
}

function base64UrlEncode(value) {
  const buffer = Buffer.from(
    typeof value === "string"
      ? value
      : JSON.stringify(value)
  );

  return buffer
    .toString("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
}

function createImageKitV2Token(
  uploadPayload,
  publicKey,
  privateKey,
  issuedAt,
  expiresAt
) {
  const encodedHeader = base64UrlEncode({
    alg: "HS256",
    typ: "JWT",
    kid: publicKey
  });
  const encodedPayload = base64UrlEncode(
    Object.assign({}, uploadPayload, {
      iat: issuedAt,
      exp: expiresAt
    })
  );
  const signature = crypto
    .createHmac("sha256", privateKey)
    .update(encodedHeader + "." + encodedPayload)
    .digest("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");

  return encodedHeader + "." + encodedPayload + "." + signature;
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

async function getImageKitStoredBytesForUploader(
  privateKey,
  uploaderTag
) {
  const pageSize = 1000;
  let skip = 0;
  let totalBytes = 0;

  while (true) {
    const query = new URLSearchParams({
      tags: uploaderTag,
      type: "file",
      limit: String(pageSize),
      skip: String(skip),
      sort: "DESC_CREATED"
    });
    const response = await fetch(
      "https://api.imagekit.io/v1/files?" +
        query.toString(),
      {
        headers: {
          Accept: "application/json",
          Authorization:
            getImageKitAuthorizationHeader(privateKey)
        }
      }
    );

    if (!response.ok) {
      throw createImageKitAuthError(
        "Could not verify your current upload quota.",
        502
      );
    }

    const files = await response.json().catch(
      function () {
        return [];
      }
    );
    const safeFiles = Array.isArray(files)
      ? files
      : [];

    totalBytes += safeFiles.reduce(
      function (pageBytes, file) {
        return pageBytes +
          Math.max(
            0,
            Number(file && file.size) || 0
          );
      },
      0
    );

    if (safeFiles.length < pageSize) {
      return totalBytes;
    }

    skip += pageSize;
  }
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
      uploadFileName: data.uploadFileName,
      fileSize: data.fileSize,
      folder: data.folder,
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

    const config = getImageKitConfig();
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

    if (
      !courseCode ||
      !professor ||
      !semester ||
      !materialType ||
      !title ||
      !isAllowedMaterialFileName(fileName) ||
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
    const courseSlug = slugifyMaterialValue(courseCode);
    const professorSlug = slugifyMaterialValue(professor);
    const semesterSlug = slugifyMaterialValue(semester);
    const uploaderTag =
      "uploader-" +
      slugifyMaterialValue(uploader.uid);
    const folder =
      "/auc-atlas/materials/" +
      courseSlug +
      "/" +
      professorSlug +
      "/" +
      semesterSlug;
    const tags = [
      "auc-atlas-material",
      "status-pending",
      "course-" + courseSlug,
      "professor-" + professorSlug,
      "semester-" + semesterSlug,
      "material-type-" +
        slugifyMaterialValue(materialType),
      uploaderTag,
      "upload-auth-" + authorizationId
    ];

    const description = [
      cleanDescriptionPart(title, 160),
      cleanDescriptionPart(courseCode, 40),
      cleanDescriptionPart(professor, 120),
      cleanDescriptionPart(semester, 80),
      cleanDescriptionPart(materialType, 80),
      cleanDescriptionPart(
        uploader.displayName,
        80
      ),
      cleanDescriptionPart(uploader.photoURL, 500),
      cleanDescriptionPart(uploader.uid, 160),
      cleanDescriptionPart(fileName, 240)
    ].join(" | ");
    const uploadFileName =
      buildImageKitFileName(fileName);
    const checks = buildImageKitUploadChecks(fileSize);
    const issuedAt = Math.floor(Date.now() / 1000);
    const expiresAt =
      issuedAt + MATERIAL_UPLOAD_AUTH_TTL_SECONDS;
    const expiresAtMs = expiresAt * 1000;
    const uploadPayload = {
      fileName: uploadFileName,
      useUniqueFileName: "true",
      folder,
      isPrivateFile: "true",
      tags: tags.join(","),
      checks,
      description
    };
    const currentStoredBytes =
      await getImageKitStoredBytesForUploader(
        config.privateKey,
        uploaderTag
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
      uploadFileName,
      fileSize,
      folder,
      expiresAtMs,
      currentStoredBytes
    });

    return res.status(200).json({
      token: createImageKitV2Token(
        uploadPayload,
        config.publicKey,
        config.privateKey,
        issuedAt,
        expiresAt
      ),
      authorizationId,
      uploadPayload,
      urlEndpoint: config.urlEndpoint,
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
