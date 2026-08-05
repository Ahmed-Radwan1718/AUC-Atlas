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

module.exports = async function handler(req, res) {
  try {
    if (req.method !== "GET") {
      res.setHeader("Allow", "GET");
      return res.status(405).json({ error: "Method not allowed" });
    }

    const decodedUser =
      await ensureVerifiedAucUser(req);

    const materialId = cleanString(
      getQueryValue(req, "id"),
      160
    );
    let filePath = "";

    if (materialId) {
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
      const isOwner =
        cleanString(
          material.uploaderUid,
          160
        ) ===
        cleanString(
          decodedUser.uid,
          160
        );
      const canDownload =
        status === "approved" ||
        (
          status === "pending" &&
          isOwner
        );

      if (
        !canDownload ||
        !/^[A-Za-z0-9_-]{6,160}$/.test(
          cleanString(material.fileId, 160)
        )
      ) {
        throw createDownloadError(
          "Course material file not found.",
          404
        );
      }

      const file = await getImageKitFileDetails(
        material.fileId
      );

      filePath = validateImageKitMaterialFile(
        file,
        material
      );
    } else {
      throw createDownloadError(
        "Course material file not found.",
        404
      );
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
