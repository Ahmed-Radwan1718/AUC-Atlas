const crypto = require("crypto");
const admin = require("../_lib/firebaseAdmin");

const { getSiteSessionUser } = require("../_lib/securityHelpers");
const {
  consumeSecurityRateLimit
} = require("../_lib/securityRateLimits");

const MATERIAL_DOWNLOAD_WINDOW_MS =
  60 * 60 * 1000;
const MATERIAL_DOWNLOAD_MAX_REQUESTS = 60;

function createDownloadError(message, statusCode) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

function cleanString(value, maxLength) {
  return String(value || "").trim().replace(/\s+/g, " ").slice(0, maxLength);
}

function getQueryValue(req, name) {
  const value = req.query && req.query[name];

  return Array.isArray(value) ? value[0] : value;
}

async function ensureVerifiedAucUser(req) {
  const decodedUser = await getSiteSessionUser(req, {
    checkRevoked: true
  });
  const userRecord = await admin.auth().getUser(decodedUser.uid);
  const email = String(userRecord.email || decodedUser.email || "").trim().toLowerCase();

  if (!userRecord.emailVerified || !email.endsWith("@aucegypt.edu")) {
    throw createDownloadError("Please verify your AUC email address before downloading materials.", 403);
  }

  return decodedUser;
}

function slugifyMaterialValue(value) {
  return String(value || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "unknown";
}

function getImageKitAuthorizationHeader() {
  const privateKey = cleanString(
    process.env.IMAGEKIT_PRIVATE_KEY,
    500
  );

  return privateKey
    ? "Basic " + Buffer.from(privateKey + ":").toString("base64")
    : "";
}

function normalizeImageKitPath(value) {
  let normalizedPath = String(value || "").trim();

  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      const decodedPath = decodeURIComponent(normalizedPath);

      if (decodedPath === normalizedPath) {
        break;
      }

      normalizedPath = decodedPath;
    } catch (error) {
      break;
    }
  }

  normalizedPath = normalizedPath.replace(/\\/g, "/");

  if (normalizedPath.charAt(0) !== "/") {
    normalizedPath = "/" + normalizedPath;
  }

  return normalizedPath.replace(/\/{2,}/g, "/");
}

function getExpectedImageKitMaterialFolder(data) {
  return (
    "/auc-atlas/materials/" +
    slugifyMaterialValue(data.courseCode) +
    "/" +
    slugifyMaterialValue(data.professor) +
    "/" +
    slugifyMaterialValue(data.semester) +
    "/"
  );
}

function getImageKitDescriptionParts(file) {
  return String(
    file && file.description ? file.description : ""
  )
    .split(" | ")
    .map(function (part) {
      return cleanString(part, 500);
    });
}

async function getImageKitFileDetails(fileId) {
  const authorization = getImageKitAuthorizationHeader();
  const safeFileId = cleanString(fileId, 160);

  if (
    !authorization ||
    !/^[A-Za-z0-9_-]{6,160}$/.test(safeFileId)
  ) {
    throw createDownloadError(
      "Course material file not found.",
      404
    );
  }

  const response = await fetch(
    "https://api.imagekit.io/v1/files/" +
      encodeURIComponent(safeFileId) +
      "/details",
    {
      headers: {
        Accept: "application/json",
        Authorization: authorization
      }
    }
  );

  if (response.status === 404) {
    throw createDownloadError(
      "Course material file not found.",
      404
    );
  }

  if (!response.ok) {
    throw createDownloadError(
      "Could not verify this course material.",
      502
    );
  }

  const file = await response.json().catch(function () {
    return {};
  });

  if (
    !file ||
    file.type !== "file" ||
    cleanString(file.fileId, 160) !== safeFileId
  ) {
    throw createDownloadError(
      "Course material file not found.",
      404
    );
  }

  return file;
}

async function ensureImageKitFileIsNotRejected(fileId) {
  const safeFileId = cleanString(fileId, 160);

  if (!/^[A-Za-z0-9_-]{6,160}$/.test(safeFileId)) {
    throw createDownloadError(
      "Course material file not found.",
      404
    );
  }

  const snapshot = await admin.firestore()
    .collection("courseMaterials")
    .where("fileId", "==", safeFileId)
    .limit(10)
    .get();
  let hasActiveRecord = false;
  let hasRejectedRecord = false;

  snapshot.forEach(function (doc) {
    const data = doc.data() || {};

    if (data.status === "rejected") {
      hasRejectedRecord = true;
    } else {
      hasActiveRecord = true;
    }
  });

  if (hasRejectedRecord && !hasActiveRecord) {
    throw createDownloadError(
      "Course material file not found.",
      404
    );
  }
}

function validateImageKitMaterialFile(file, material) {
  const filePath = normalizeImageKitPath(file.filePath);
  const pathParts = filePath.split("/");
  const actualFolder = filePath.slice(
    0,
    filePath.lastIndexOf("/") + 1
  );
  const tags = new Set(
    (Array.isArray(file.tags) ? file.tags : []).map(
      function (tag) {
        return cleanString(tag, 160);
      }
    )
  );

  if (
    filePath.indexOf("/auc-atlas/materials/") !== 0 ||
    pathParts.includes(".") ||
    pathParts.includes("..") ||
    /%2e/i.test(filePath) ||
    filePath.endsWith("/") ||
    !tags.has("auc-atlas-material")
  ) {
    throw createDownloadError(
      "Course material file not found.",
      404
    );
  }

  if (material) {
    const expectedFolder =
      getExpectedImageKitMaterialFolder(material);
    const descriptionParts =
      getImageKitDescriptionParts(file);
    const expectedTags = [
      "course-" +
        slugifyMaterialValue(material.courseCode),
      "professor-" +
        slugifyMaterialValue(material.professor),
      "semester-" +
        slugifyMaterialValue(material.semester),
      "uploader-" +
        slugifyMaterialValue(material.uploaderUid)
    ];
    const metadataMatches =
      cleanString(descriptionParts[1], 40).toUpperCase() ===
        cleanString(
          material.courseCode,
          40
        ).toUpperCase() &&
      cleanString(descriptionParts[2], 120) ===
        cleanString(material.professor, 120) &&
      cleanString(descriptionParts[3], 80) ===
        cleanString(material.semester, 80) &&
      cleanString(descriptionParts[7], 160) ===
        cleanString(material.uploaderUid, 160);

    if (
      actualFolder !== expectedFolder ||
      cleanString(file.fileId, 160) !==
        cleanString(material.fileId, 160) ||
      !expectedTags.every(function (tag) {
        return tags.has(tag);
      }) ||
      !metadataMatches
    ) {
      throw createDownloadError(
        "Course material file not found.",
        404
      );
    }
  }

  return filePath;
}

function getSignedImageKitUrl(filePath) {
  const privateKey = process.env.IMAGEKIT_PRIVATE_KEY;
  const urlEndpoint = String(
    process.env.IMAGEKIT_URL_ENDPOINT || ""
  ).trim().replace(/\/+$/, "");

  if (!privateKey || !urlEndpoint) {
    throw createDownloadError(
      "ImageKit downloads are not configured.",
      500
    );
  }

  const normalizedPath =
    normalizeImageKitPath(filePath);
  const pathParts = normalizedPath.split("/");

  if (
    normalizedPath.indexOf(
      "/auc-atlas/materials/"
    ) !== 0 ||
    pathParts.includes(".") ||
    pathParts.includes("..") ||
    /%2e/i.test(normalizedPath)
  ) {
    throw createDownloadError(
      "Course material file not found.",
      404
    );
  }

  const cleanPath = normalizedPath.replace(/^\/+/, "");
  const encodedPath = cleanPath
    .split("/")
    .map(encodeURIComponent)
    .join("/");
  const expiresAt =
    Math.floor(Date.now() / 1000) + 5 * 60;
  const signature = crypto
    .createHmac("sha1", privateKey)
    .update(encodedPath + expiresAt)
    .digest("hex");

  return (
    urlEndpoint +
    "/" +
    encodedPath +
    "?ik-t=" +
    expiresAt +
    "&ik-s=" +
    signature
  );
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
    throw createDownloadError(
      "Course-material storage is not configured.",
      500
    );
  }

  return {
    url: parsedUrl.origin,
    secret
  };
}

function getSignedStorageUrl(
  storageKey,
  dispositionType
) {
  const safeStorageKey = cleanString(
    storageKey,
    80
  );
  const disposition =
    dispositionType === "inline"
      ? "inline"
      : "attachment";

  if (!/^[a-f0-9]{36}$/i.test(safeStorageKey)) {
    throw createDownloadError(
      "Course material file not found.",
      404
    );
  }

  const config = getStorageConfig();
  const expiresAt =
    Math.floor(Date.now() / 1000) + 5 * 60;
  const signature = crypto
    .createHmac(
      "sha256",
      config.secret
    )
    .update(
      [
        "download",
        safeStorageKey,
        String(expiresAt),
        disposition
      ].join("\n")
    )
    .digest("hex");

  const query = new URLSearchParams({
    key: safeStorageKey,
    expires: String(expiresAt),
    disposition,
    signature
  });

  return (
    config.url +
    "/download?" +
    query.toString()
  );
}

module.exports = async function handler(req, res) {
  try {
    if (req.method !== "GET") {
      res.setHeader("Allow", "GET");
      return res.status(405).json({ error: "Method not allowed" });
    }

    const decodedUser =
      await ensureVerifiedAucUser(req);

    await consumeSecurityRateLimit({
      scope: "course-material-download-user",
      identifier: decodedUser.uid,
      maxAttempts:
        MATERIAL_DOWNLOAD_MAX_REQUESTS,
      windowMs:
        MATERIAL_DOWNLOAD_WINDOW_MS,
      message:
        "Too many course-material downloads. Please try again later."
    });

    const materialId = cleanString(
      getQueryValue(req, "id"),
      160
    );
    let filePath = "";
    let downloadFileName = "course-material";

    if (!/^[A-Za-z0-9_-]{6,160}$/.test(materialId)) {
      throw createDownloadError(
        "Course material file not found.",
        404
      );
    }

    const materialDoc = await admin
      .firestore()
      .collection("courseMaterials")
      .doc(materialId)
      .get();

    if (!materialDoc.exists) {
      throw createDownloadError(
        "Course material file not found.",
        404
      );
    }

    const material = materialDoc.data() || {};
    const status = cleanString(
      material.status,
      40
    ).toLowerCase();
    const canDownload =
      !status ||
      status === "approved" ||
      status === "pending";
    const storageKey = cleanString(
      material.storageKey,
      80
    );
    const fileId = cleanString(
      material.fileId,
      160
    );
    const dispositionType =
      cleanString(
        getQueryValue(req, "disposition"),
        20
      ).toLowerCase() === "inline"
        ? "inline"
        : "attachment";

    if (!canDownload) {
      throw createDownloadError(
        "Course material file not found.",
        404
      );
    }

    let signedUrl = "";

    if (
      /^[a-f0-9]{36}$/i.test(storageKey)
    ) {
      downloadFileName = cleanString(
        material.fileName ||
        "course-material",
        240
      ).replace(/[\r\n]/g, " ");

      signedUrl = getSignedStorageUrl(
        storageKey,
        dispositionType
      );
    } else {
      if (
        !/^[A-Za-z0-9_-]{6,160}$/.test(
          fileId
        )
      ) {
        throw createDownloadError(
          "Course material file not found.",
          404
        );
      }

      const file = await getImageKitFileDetails(
        fileId
      );

      filePath = validateImageKitMaterialFile(
        file,
        material
      );

      downloadFileName = cleanString(
        material.fileName ||
        file.name ||
        "course-material",
        240
      ).replace(/[\r\n]/g, " ");

      signedUrl = getSignedImageKitUrl(
        filePath
      );
    }

    const rangeHeader = String(
      req.headers && req.headers.range
        ? req.headers.range
        : ""
    ).trim();
    const upstreamHeaders = {};

    if (/^bytes=\d*-\d*$/i.test(rangeHeader)) {
      upstreamHeaders.Range = rangeHeader;
    }

    const fileResponse = await fetch(
      signedUrl,
      {
        method: "GET",
        headers: upstreamHeaders
      }
    );

    if (
      ![200, 206].includes(fileResponse.status) ||
      !fileResponse.body
    ) {
      throw createDownloadError(
        "Could not load this course material.",
        502
      );
    }
    const safeAsciiFileName = downloadFileName
      .replace(/[^\x20-\x7E]/g, "_")
      .replace(/["\\]/g, "_");
    const encodedFileName = encodeURIComponent(
      downloadFileName
    ).replace(
      /['()*]/g,
      function (character) {
        return "%" +
          character.charCodeAt(0)
            .toString(16)
            .toUpperCase();
      }
    );
    const contentType =
      fileResponse.headers.get("content-type") ||
      "application/octet-stream";
    const contentLength =
      fileResponse.headers.get("content-length");
    const contentRange =
      fileResponse.headers.get("content-range");
    const acceptRanges =
      fileResponse.headers.get("accept-ranges");

    res.statusCode = fileResponse.status;
    res.setHeader("Cache-Control", "private, no-store");
    res.setHeader("Content-Type", contentType);
    res.setHeader(
      "Content-Disposition",
      dispositionType +
        '; filename="' +
        safeAsciiFileName +
        '"; filename*=UTF-8\'\'' +
        encodedFileName
    );

    if (
      contentLength &&
      /^\d+$/.test(contentLength)
    ) {
      res.setHeader("Content-Length", contentLength);
    }

    if (contentRange) {
      res.setHeader("Content-Range", contentRange);
    }

    if (acceptRanges) {
      res.setHeader("Accept-Ranges", acceptRanges);
    }

    const reader = fileResponse.body.getReader();

    try {
      while (true) {
        const result = await reader.read();

        if (result.done) {
          break;
        }

        if (res.destroyed) {
          await reader.cancel();
          return;
        }

        if (!res.write(Buffer.from(result.value))) {
          await new Promise(function (resolve) {
            res.once("drain", resolve);
          });
        }
      }
    } finally {
      reader.releaseLock();
    }

    return res.end();
  } catch (error) {
    if (res.headersSent) {
      if (!res.writableEnded) {
        res.end();
      }

      return;
    }

    res.setHeader("Cache-Control", "no-store");

    return res.status(error.statusCode || 500).json({
      error: error.message ||
        "Could not download this course material."
    });
  }
};
