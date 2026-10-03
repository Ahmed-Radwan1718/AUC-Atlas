const admin = require("../_lib/firebaseAdmin");

const { getSiteSessionUser } = require("../_lib/securityHelpers");
const {
  consumeSecurityRateLimit
} = require("../_lib/securityRateLimits");
const {
  getCloudinaryMaterial,
  buildCloudinaryAssetDownloadUrl,
  isCloudinaryMaterialPublicId
} = require("../_lib/cloudinaryCourseMaterials");

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

    if (
      !canDownload ||
      material.storageProvider !== "cloudinary" ||
      !isCloudinaryMaterialPublicId(storageKey) ||
      !/^[A-Za-z0-9_-]{16,160}$/.test(fileId)
    ) {
      throw createDownloadError(
        "Course material file not found.",
        404
      );
    }

    const cloudinaryFile =
      await getCloudinaryMaterial(
        storageKey
      );

    if (cloudinaryFile.assetId !== fileId) {
      throw createDownloadError(
        "Course material file not found.",
        404
      );
    }

    downloadFileName = cleanString(
      material.fileName ||
      "course-material",
      240
    ).replace(/[\r\n]/g, " ");

    const signedUrl =
      buildCloudinaryAssetDownloadUrl(
        cloudinaryFile.assetId,
        dispositionType
      );

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
