const { pipeline } = require("node:stream/promises");
const { Readable } = require("node:stream");
const admin = require("../server/_lib/firebaseAdmin");
const { getSiteSessionUser } = require("../server/_lib/securityHelpers");
const { consumeSecurityRateLimit } = require("../server/_lib/securityRateLimits");
const {
  MATERIAL_MAX_FILE_BYTES,
  cleanMaterialFileName,
  getMaterialFileExtension,
  normalizeMaterialMimeType,
  doesMaterialMimeMatchFileName
} = require("../server/_lib/courseMaterialUploadPolicy");
const {
  getImageKitMaterial,
  buildSignedImageKitMaterialUrl,
  isImageKitMaterialPath,
  isImageKitFileId
} = require("../server/_lib/imageKitCourseMaterials");
const {
  getCloudinaryMaterial,
  buildCloudinaryAssetDownloadUrl,
  isCloudinaryMaterialPublicId
} = require("../server/_lib/cloudinaryCourseMaterials");

const MIME_BY_EXTENSION = {
  pdf: "application/pdf",
  doc: "application/msword",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ppt: "application/vnd.ms-powerpoint",
  pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  xls: "application/vnd.ms-excel",
  xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png"
};

async function getMaterialDownloadSource(material) {
  const storageKey = String(material.storageKey || "");
  if (material.storageProvider === "imagekit") {
    const fileId = String(material.imagekitFileId || material.fileId || "");
    if (!isImageKitFileId(fileId) || !isImageKitMaterialPath(storageKey)) {
      const error = new Error("Course material file not found.");
      error.statusCode = 404;
      throw error;
    }
    const storedFile = await getImageKitMaterial(fileId);
    if (storedFile.filePath !== storageKey || !storedFile.isPrivateFile) {
      const error = new Error("Course material file not found.");
      error.statusCode = 404;
      throw error;
    }
    return {
      url: buildSignedImageKitMaterialUrl(storageKey),
      provider: "imagekit"
    };
  }

  if (!isCloudinaryMaterialPublicId(storageKey)) {
    const error = new Error("Course material file not found.");
    error.statusCode = 404;
    throw error;
  }
  const storedFile = await getCloudinaryMaterial(storageKey);
  return {
    url: buildCloudinaryAssetDownloadUrl(storedFile.assetId, "attachment"),
    inlineUrl: buildCloudinaryAssetDownloadUrl(storedFile.assetId, "inline"),
    provider: "cloudinary"
  };
}

module.exports = async function handler(req, res) {
  res.setHeader("Cache-Control", "private, no-store, max-age=0");
  res.setHeader("X-Content-Type-Options", "nosniff");
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Method not allowed." });
  }

  try {
    const decodedUser = await getSiteSessionUser(req, { checkRevoked: true });
    await consumeSecurityRateLimit({
      scope: "course-material-download-user",
      identifier: decodedUser.uid,
      maxAttempts: 120,
      windowMs: 10 * 60 * 1000,
      message: "Too many course-material requests. Please try again later."
    });

    const id = String(req.query && req.query.id || "").trim();
    if (!/^[A-Za-z0-9_-]{1,160}$/.test(id)) {
      return res.status(400).json({ error: "Invalid course material." });
    }
    const document = await admin.firestore().collection("courseMaterials").doc(id).get();
    if (!document.exists) {
      return res.status(404).json({ error: "Course material not found." });
    }
    const material = document.data() || {};
    if (material.status === "rejected") {
      return res.status(404).json({ error: "Course material not found." });
    }

    const filename = cleanMaterialFileName(material.fileName || "course-material");
    const extension = getMaterialFileExtension(filename);
    const mimeFromRecord = normalizeMaterialMimeType(material.fileType);
    const contentType = doesMaterialMimeMatchFileName(filename, mimeFromRecord)
      ? mimeFromRecord
      : (MIME_BY_EXTENSION[extension] || "application/octet-stream");
    const previewMode = String(req.query.disposition || "").toLowerCase();
    const inline = previewMode === "inline";
    const source = await getMaterialDownloadSource(material);

    // Office's hosted viewer needs a short-lived URL it can retrieve itself.
    // This endpoint is authenticated; no permanent public file link is exposed.
    if (previewMode === "office-url") {
      if (!["ppt", "pptx", "doc", "docx", "xls", "xlsx"].includes(extension)) {
        return res.status(400).json({ error: "Office preview is not supported for this file." });
      }
      return res.status(200).json({ url: source.inlineUrl || source.url });
    }

    const disposition = inline ? "inline" : "attachment";
    const safeAsciiFilename = filename.replace(/[^\x20-\x7e]/g, "_").replace(/["\\]/g, "_");
    if (!inline) {
      const destination = new URL(source.url);
      if (source.provider === "imagekit") {
        destination.searchParams.set("ik-attachment", "true");
      }
      return res.redirect(302, destination.toString());
    }

    res.setHeader(
      "Content-Disposition",
      disposition + '; filename="' + safeAsciiFilename + '"; filename*=UTF-8\'\'' + encodeURIComponent(filename)
    );

    const upstream = await fetch(source.inlineUrl || source.url, {
      redirect: "follow",
      cache: "no-store"
    });
    if (!upstream.ok || !upstream.body) {
      return res.status(502).json({ error: "Could not load course material." });
    }
    const upstreamLength = Number(upstream.headers.get("content-length")) || 0;
    if (upstreamLength > MATERIAL_MAX_FILE_BYTES) {
      return res.status(413).json({ error: "Course material is too large to preview." });
    }

    res.setHeader("Content-Type", contentType);
    await pipeline(Readable.fromWeb(upstream.body), res);
  } catch (error) {
    if (res.headersSent) {
      res.destroy(error);
      return;
    }
    const status = Number(error.statusCode) || 500;
    const safeStatus = [400, 401, 403, 404, 429].includes(status) ? status : 502;
    return res.status(safeStatus).json({
      error: safeStatus === 401 ? "Sign in to access course files."
        : safeStatus === 403 ? "Verify your AUC email to access course files."
        : safeStatus === 404 ? "Course material not found."
        : safeStatus === 429 ? "Too many requests. Please try again later."
        : "Could not load course material."
    });
  }
};
