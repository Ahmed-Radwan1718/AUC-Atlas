const crypto = require("crypto");

const { getMaterialFileExtension } = require("./courseMaterialUploadPolicy");

const IMAGEKIT_UPLOAD_URL = "https://upload.imagekit.io/api/v1/files/upload";
const IMAGEKIT_API_BASE = "https://api.imagekit.io/v1";
const IMAGEKIT_MATERIAL_FOLDER = "/auc-atlas/materials";
const IMAGEKIT_MATERIAL_PATH_PATTERN =
  /^\/auc-atlas\/materials\/[a-f0-9]{36}\.(?:pdf|docx?|pptx?|xlsx?|jpe?g|png)$/i;
const IMAGEKIT_FILE_ID_PATTERN = /^[a-f0-9]{24}$/i;

function cleanString(value: any, maxLength: any) {
  return String(value || "").trim().slice(0, maxLength);
}

function imageKitError(message: any, statusCode: any) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

function getImageKitConfig() {
  const publicKey = cleanString(process.env.IMAGEKIT_PUBLIC_KEY, 200);
  const privateKey = cleanString(process.env.IMAGEKIT_PRIVATE_KEY, 500);
  const urlEndpoint = cleanString(process.env.IMAGEKIT_URL_ENDPOINT, 500)
    .replace(/\/+$/, "");

  if (!publicKey || !privateKey || !urlEndpoint) {
    throw imageKitError(
      "ImageKit course-material storage is not configured. Add IMAGEKIT_PUBLIC_KEY, IMAGEKIT_PRIVATE_KEY, and IMAGEKIT_URL_ENDPOINT in Vercel Production.",
      500
    );
  }

  let url;
  try {
    url = new URL(urlEndpoint);
  } catch (error: any) {
    throw imageKitError("The ImageKit URL endpoint is invalid.", 500);
  }

  if (url.protocol !== "https:" || url.search || url.hash ||
      url.username || url.password) {
    throw imageKitError("The ImageKit URL endpoint must be an HTTPS delivery URL.", 500);
  }

  return { publicKey, privateKey, urlEndpoint };
}

function isImageKitMaterialPath(path: any) {
  return IMAGEKIT_MATERIAL_PATH_PATTERN.test(cleanString(path, 100));
}

function isImageKitFileId(id: any) {
  return IMAGEKIT_FILE_ID_PATTERN.test(cleanString(id, 100));
}

function imageKitMaterialPath(authorizationId: any, fileName: any) {
  const safeId = cleanString(authorizationId, 80);
  const extension = getMaterialFileExtension(fileName);

  if (!/^[a-f0-9]{36}$/i.test(safeId) || !extension) {
    throw imageKitError("Could not prepare the ImageKit upload.", 400);
  }

  const path = IMAGEKIT_MATERIAL_FOLDER + "/" + safeId + "." + extension;

  if (!isImageKitMaterialPath(path)) {
    throw imageKitError("Could not prepare the ImageKit upload.", 400);
  }

  return path;
}

function createImageKitUploadAuthorization(authorizationId: any, fileName: any, ttlSeconds: any) {
  const config = getImageKitConfig();
  const filePath = imageKitMaterialPath(authorizationId, fileName);
  const token = crypto.randomUUID();
  const expire = Math.floor(Date.now() / 1000) +
    Math.min(1800, Math.max(60, Number(ttlSeconds) || 900));
  const signature = crypto.createHmac("sha1", config.privateKey)
    .update(token + expire)
    .digest("hex");

  return {
    uploadUrl: IMAGEKIT_UPLOAD_URL,
    publicKey: config.publicKey,
    token,
    expire,
    signature,
    filePath,
    uploadParameters: {
      fileName: filePath.split("/").pop(),
      folder: IMAGEKIT_MATERIAL_FOLDER,
      isPrivateFile: "true",
      useUniqueFileName: "false",
      overwriteFile: "false"
    }
  };
}

function imageKitHeaders() {
  const config = getImageKitConfig();

  return {
    Accept: "application/json",
    Authorization: "Basic " +
      Buffer.from(config.privateKey + ":").toString("base64")
  };
}

async function imageKitApi(path: any, options?: any) {
  let response;

  try {
    response = await fetch(IMAGEKIT_API_BASE + path, {
      ...options,
      headers: { ...imageKitHeaders(), ...(options && options.headers) }
    });
  } catch (error: any) {
    throw imageKitError("Could not connect to ImageKit storage.", 502);
  }

  if (response.status === 404) {
    throw imageKitError("Course material file not found.", 404);
  }

  if (!response.ok) {
    const data = await response.json().catch(function () { return {}; });
    // Do not expose API keys, request headers, or provider internals.
    throw imageKitError(
      response.status === 401 || response.status === 403
        ? "ImageKit rejected the server credentials or permissions."
        : cleanString(data.message, 200) || "ImageKit storage request failed.",
      502
    );
  }

  if (response.status === 204) {
    return null;
  }

  return response.json().catch(function () { return null; });
}

async function getImageKitMaterial(fileId: any) {
  const safeId = cleanString(fileId, 80);
  if (!isImageKitFileId(safeId)) {
    throw imageKitError("Course material file not found.", 404);
  }

  const file = await imageKitApi("/files/" + safeId + "/details");
  if (!file || file.fileId !== safeId) {
    throw imageKitError("Course material file not found.", 404);
  }

  return {
    fileId: safeId,
    filePath: cleanString(file.filePath, 100),
    name: cleanString(file.name, 240),
    size: Number(file.size),
    mime: cleanString(file.mime, 160).toLowerCase(),
    isPrivateFile: file.isPrivateFile === true
  };
}

async function findImageKitMaterialByPath(filePath: any) {
  const safePath = cleanString(filePath, 100);
  if (!isImageKitMaterialPath(safePath)) {
    return null;
  }

  const name = safePath.slice(IMAGEKIT_MATERIAL_FOLDER.length + 1);
  const query = new URLSearchParams({
    path: IMAGEKIT_MATERIAL_FOLDER + "/",
    name,
    limit: "100"
  });
  const results = await imageKitApi("/files?" + query.toString());

  if (!Array.isArray(results)) {
    throw imageKitError("Could not search ImageKit materials.", 502);
  }

  const match = results.find(function (item: any) {
    return item && item.filePath === safePath &&
      isImageKitFileId(item.fileId);
  });

  return match ? getImageKitMaterial(match.fileId) : null;
}

async function deleteImageKitMaterial(fileId: any, expectedPath: any) {
  const safeId = cleanString(fileId, 80);
  if (!isImageKitFileId(safeId)) {
    return false;
  }

  const safePath = cleanString(expectedPath, 100);
  if (!isImageKitMaterialPath(safePath)) {
    throw imageKitError("Invalid ImageKit material path.", 400);
  }

  let file;
  try {
    file = await getImageKitMaterial(safeId);
  } catch (error: any) {
    if (error.statusCode === 404) return false;
    throw error;
  }

  if (file.filePath !== safePath) {
    throw imageKitError("ImageKit material identity mismatch.", 409);
  }

  await imageKitApi("/files/" + safeId, { method: "DELETE" });
  return true;
}

async function deletePendingImageKitMaterial(filePath: any) {
  const file = await findImageKitMaterialByPath(filePath);
  if (!file) return false;
  return deleteImageKitMaterial(file.fileId, filePath);
}

function buildSignedImageKitMaterialUrl(filePath: any) {
  const safePath = cleanString(filePath, 100);
  if (!isImageKitMaterialPath(safePath)) {
    throw imageKitError("Course material file not found.", 404);
  }

  const config = getImageKitConfig();
  const relativePath = safePath.replace(/^\//, "");
  const expires = Math.floor(Date.now() / 1000) + 5 * 60;
  const signature = crypto.createHmac("sha1", config.privateKey)
    .update(relativePath + expires)
    .digest("hex");

  return config.urlEndpoint + "/" + relativePath +
    "?ik-t=" + expires + "&ik-s=" + signature;
}

module.exports = {
  createImageKitUploadAuthorization,
  getImageKitMaterial,
  deleteImageKitMaterial,
  deletePendingImageKitMaterial,
  buildSignedImageKitMaterialUrl,
  isImageKitMaterialPath,
  isImageKitFileId
};

// Keep each migrated CommonJS helper scoped to its own TypeScript module.
export {};
