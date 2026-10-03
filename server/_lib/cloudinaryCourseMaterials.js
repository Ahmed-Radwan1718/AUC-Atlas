const crypto = require("crypto");

const {
  getMaterialFileExtension
} = require("./courseMaterialUploadPolicy");

const CLOUDINARY_MATERIAL_PUBLIC_ID_PATTERN =
  /^auc-atlas\/materials\/[a-f0-9]{36}\.(?:pdf|docx?|pptx?|xlsx?|jpe?g|png)$/i;
const CLOUDINARY_ASSET_ID_PATTERN =
  /^[A-Za-z0-9_-]{16,160}$/;

function cleanString(value, maxLength) {
  return String(value || "")
    .trim()
    .slice(0, maxLength);
}

function createCloudinaryMaterialError(
  message,
  statusCode
) {
  const error = new Error(message);

  error.statusCode = statusCode;
  return error;
}

function getCloudinaryConfig() {
  let cloudName = cleanString(
    process.env.CLOUDINARY_CLOUD_NAME ||
      process.env.CLOUDINARY_NAME,
    160
  );
  let apiKey = cleanString(
    process.env.CLOUDINARY_API_KEY,
    160
  );
  let apiSecret = cleanString(
    process.env.CLOUDINARY_API_SECRET,
    500
  );

  if (
    (!cloudName || !apiKey || !apiSecret) &&
    process.env.CLOUDINARY_URL
  ) {
    try {
      const cloudinaryUrl = new URL(
        process.env.CLOUDINARY_URL
      );

      if (cloudinaryUrl.protocol === "cloudinary:") {
        cloudName =
          cloudName || cloudinaryUrl.hostname;
        apiKey =
          apiKey ||
          decodeURIComponent(
            cloudinaryUrl.username || ""
          );
        apiSecret =
          apiSecret ||
          decodeURIComponent(
            cloudinaryUrl.password || ""
          );
      }
    } catch (error) {}
  }

  if (!cloudName || !apiKey || !apiSecret) {
    throw createCloudinaryMaterialError(
      "Cloudinary course-material storage is not configured.",
      500
    );
  }

  return {
    cloudName,
    apiKey,
    apiSecret
  };
}

function signCloudinaryParams(
  params,
  apiSecret
) {
  const signatureBase = Object.keys(params)
    .filter(function (key) {
      return (
        params[key] !== undefined &&
        params[key] !== null &&
        params[key] !== ""
      );
    })
    .sort()
    .map(function (key) {
      return key + "=" + String(params[key]);
    })
    .join("&");

  return crypto
    .createHash("sha1")
    .update(signatureBase + apiSecret)
    .digest("hex");
}

function isCloudinaryMaterialPublicId(value) {
  return CLOUDINARY_MATERIAL_PUBLIC_ID_PATTERN.test(
    cleanString(value, 80)
  );
}

function getCloudinaryMaterialPublicId(
  authorizationId,
  fileName
) {
  const safeAuthorizationId = cleanString(
    authorizationId,
    80
  );
  const extension =
    getMaterialFileExtension(fileName);

  if (
    !/^[a-f0-9]{36}$/i.test(
      safeAuthorizationId
    ) ||
    !extension
  ) {
    throw createCloudinaryMaterialError(
      "Could not prepare the Cloudinary upload.",
      400
    );
  }

  const publicId =
    "auc-atlas/materials/" +
    safeAuthorizationId +
    "." +
    extension;

  if (!isCloudinaryMaterialPublicId(publicId)) {
    throw createCloudinaryMaterialError(
      "Could not prepare the Cloudinary upload.",
      400
    );
  }

  return publicId;
}

function createCloudinaryUploadAuthorization(
  authorizationId,
  fileName
) {
  const config = getCloudinaryConfig();
  const publicId =
    getCloudinaryMaterialPublicId(
      authorizationId,
      fileName
    );
  const timestamp = String(
    Math.floor(Date.now() / 1000)
  );
  const uploadParameters = {
    overwrite: "false",
    public_id: publicId,
    timestamp,
    unique_filename: "false"
  };
  const signature = signCloudinaryParams(
    uploadParameters,
    config.apiSecret
  );

  return {
    uploadUrl:
      "https://api.cloudinary.com/v1_1/" +
      encodeURIComponent(config.cloudName) +
      "/raw/authenticated",
    apiKey: config.apiKey,
    signature,
    timestamp,
    publicId,
    uploadParameters
  };
}

async function getCloudinaryMaterial(publicId) {
  const safePublicId = cleanString(
    publicId,
    80
  );

  if (!isCloudinaryMaterialPublicId(safePublicId)) {
    throw createCloudinaryMaterialError(
      "Course material file not found.",
      404
    );
  }

  const config = getCloudinaryConfig();
  const response = await fetch(
    "https://api.cloudinary.com/v1_1/" +
      encodeURIComponent(config.cloudName) +
      "/resources/raw/authenticated/" +
      encodeURIComponent(safePublicId),
    {
      headers: {
        Accept: "application/json",
        Authorization:
          "Basic " +
          Buffer.from(
            config.apiKey +
              ":" +
              config.apiSecret
          ).toString("base64")
      }
    }
  );

  if (response.status === 404) {
    throw createCloudinaryMaterialError(
      "Course material file not found.",
      404
    );
  }

  if (!response.ok) {
    throw createCloudinaryMaterialError(
      "Could not verify the Cloudinary course material.",
      502
    );
  }

  const file = await response
    .json()
    .catch(function () {
      return {};
    });
  const assetId = cleanString(
    file.asset_id,
    160
  );
  const returnedPublicId = cleanString(
    file.public_id,
    80
  );
  const format =
    cleanString(file.format, 20).toLowerCase() ||
    getMaterialFileExtension(returnedPublicId);

  if (
    returnedPublicId !== safePublicId ||
    file.resource_type !== "raw" ||
    file.type !== "authenticated" ||
    !CLOUDINARY_ASSET_ID_PATTERN.test(assetId)
  ) {
    throw createCloudinaryMaterialError(
      "Course material file not found.",
      404
    );
  }

  return {
    assetId,
    publicId: returnedPublicId,
    resourceType: "raw",
    deliveryType: "authenticated",
    format,
    size: Math.max(
      0,
      Number(file.bytes) || 0
    ),
    createdAt: cleanString(
      file.created_at,
      80
    )
  };
}

async function deleteCloudinaryMaterial(
  publicId
) {
  const safePublicId = cleanString(
    publicId,
    80
  );

  if (!isCloudinaryMaterialPublicId(safePublicId)) {
    return;
  }

  const config = getCloudinaryConfig();
  const timestamp = String(
    Math.floor(Date.now() / 1000)
  );
  const signedParams = {
    invalidate: "true",
    public_id: safePublicId,
    timestamp
  };
  const body = new URLSearchParams({
    ...signedParams,
    api_key: config.apiKey,
    signature: signCloudinaryParams(
      signedParams,
      config.apiSecret
    )
  });
  const response = await fetch(
    "https://api.cloudinary.com/v1_1/" +
      encodeURIComponent(config.cloudName) +
      "/raw/authenticated/destroy",
    {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type":
          "application/x-www-form-urlencoded"
      },
      body: body.toString()
    }
  );

  if (!response.ok) {
    throw createCloudinaryMaterialError(
      "Could not delete the Cloudinary course material.",
      502
    );
  }

  const result = await response
    .json()
    .catch(function () {
      return {};
    });

  if (
    result.result !== "ok" &&
    result.result !== "not found"
  ) {
    throw createCloudinaryMaterialError(
      "Could not delete the Cloudinary course material.",
      502
    );
  }
}

function buildCloudinaryAssetDownloadUrl(
  assetId,
  dispositionType
) {
  const safeAssetId = cleanString(
    assetId,
    160
  );

  if (
    !CLOUDINARY_ASSET_ID_PATTERN.test(
      safeAssetId
    )
  ) {
    throw createCloudinaryMaterialError(
      "Course material file not found.",
      404
    );
  }

  const config = getCloudinaryConfig();
  const timestamp = Math.floor(
    Date.now() / 1000
  );
  const signedParams = {
    asset_id: safeAssetId,
    attachment:
      dispositionType === "attachment"
        ? "true"
        : "false",
    expires_at: String(timestamp + 5 * 60),
    timestamp: String(timestamp)
  };
  const query = new URLSearchParams({
    ...signedParams,
    api_key: config.apiKey,
    signature: signCloudinaryParams(
      signedParams,
      config.apiSecret
    )
  });

  return (
    "https://api.cloudinary.com/v1_1/" +
    encodeURIComponent(config.cloudName) +
    "/asset/download?" +
    query.toString()
  );
}

module.exports = {
  createCloudinaryUploadAuthorization,
  getCloudinaryMaterial,
  deleteCloudinaryMaterial,
  buildCloudinaryAssetDownloadUrl,
  isCloudinaryMaterialPublicId
};
