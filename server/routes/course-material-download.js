const crypto = require("crypto");
const admin = require("../_lib/firebaseAdmin");

const { getSiteSessionUser } = require("../_lib/securityHelpers");

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
}

function getImageKitPath(data) {
  const filePath = cleanString(data.filePath, 800);

  if (filePath) {
    return filePath;
  }

  const fileUrl = cleanString(data.fileUrl, 1200);
  const urlEndpoint = String(process.env.IMAGEKIT_URL_ENDPOINT || "").trim().replace(/\/+$/, "");

  if (fileUrl && urlEndpoint && fileUrl.indexOf(urlEndpoint + "/") === 0) {
    const pathFromUrl = fileUrl.split("?")[0].slice(urlEndpoint.length + 1);

    try {
      return decodeURIComponent(pathFromUrl);
    } catch (error) {
      return pathFromUrl;
    }
  }

  return "";
}

function getSignedImageKitUrl(filePath) {
  const privateKey = process.env.IMAGEKIT_PRIVATE_KEY;
  const urlEndpoint = String(process.env.IMAGEKIT_URL_ENDPOINT || "").trim().replace(/\/+$/, "");

  if (!privateKey || !urlEndpoint) {
    throw createDownloadError("ImageKit downloads are not configured.", 500);
  }

  const cleanPath = String(filePath || "").replace(/^\/+/, "");

  if (!cleanPath) {
    throw createDownloadError("Course material file not found.", 404);
  }

  const encodedPath = cleanPath.split("/").map(encodeURIComponent).join("/");
  const expiresAt = Math.floor(Date.now() / 1000) + 5 * 60;
  const signature = crypto
    .createHmac("sha1", privateKey)
    .update(encodedPath + expiresAt)
    .digest("hex");

  return urlEndpoint + "/" + encodedPath + "?ik-t=" + expiresAt + "&ik-s=" + signature;
}

module.exports = async function handler(req, res) {
  try {
    if (req.method !== "GET") {
      res.setHeader("Allow", "GET");
      return res.status(405).json({ error: "Method not allowed" });
    }

    await ensureVerifiedAucUser(req);

    const requestedPath = cleanString(
      getQueryValue(req, "path"),
      800
    );

    let filePath = "";

    if (requestedPath) {
      const normalizedPath =
        requestedPath.charAt(0) === "/"
          ? requestedPath
          : "/" + requestedPath;

      if (
        normalizedPath.indexOf("/auc-atlas/materials/") !== 0 ||
        normalizedPath.indexOf("..") !== -1 ||
        normalizedPath.indexOf("\\") !== -1
      ) {
        throw createDownloadError(
          "Course material file not found.",
          404
        );
      }

      filePath = normalizedPath;
    } else {
      const materialId = cleanString(
        getQueryValue(req, "id"),
        160
      );

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

      if (material.status === "rejected") {
        throw createDownloadError(
          "Course material file not found.",
          404
        );
      }

      filePath = getImageKitPath(material);
    }

    const signedUrl = getSignedImageKitUrl(filePath);
    const responseFormat = cleanString(
      getQueryValue(req, "format"),
      20
    ).toLowerCase();

    res.setHeader("Cache-Control", "no-store");

    if (responseFormat === "json") {
      return res.status(200).json({
        url: signedUrl
      });
    }

    res.statusCode = 302;
    res.setHeader("Location", signedUrl);
    return res.end();
  } catch (error) {
    res.setHeader("Cache-Control", "no-store");
    return res.status(error.statusCode || 500).json({
      error: error.message || "Could not download this course material."
    });
  }
};
