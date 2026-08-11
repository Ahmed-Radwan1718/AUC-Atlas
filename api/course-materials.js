const admin = require("../server/_lib/firebaseAdmin");

const { getSiteSessionUser } = require("../server/_lib/securityHelpers");
const {
  consumeSecurityRateLimit
} = require("../server/_lib/securityRateLimits");
const {
  MATERIAL_MAX_FILE_BYTES,
  cleanMaterialFileName,
  normalizeMaterialMimeType,
  isAllowedMaterialMimeType,
  doesMaterialMimeMatchFileName
} = require("../server/_lib/courseMaterialUploadPolicy");

const MATERIAL_RANDOM_READ_WINDOW_MS =
  10 * 60 * 1000;
const MATERIAL_RANDOM_READ_MAX_REQUESTS = 30;
const MATERIAL_MUTATION_WINDOW_MS =
  60 * 60 * 1000;
const MATERIAL_MUTATION_MAX_REQUESTS = 30;

function cleanString(value, maxLength) {
  return String(value || "").trim().replace(/\s+/g, " ").slice(0, maxLength);
}

function cleanUrl(value) {
  const url = cleanString(value, 1000);
  return /^https?:\/\//i.test(url) ? url : "";
}

function cleanBoolean(value) {
  if (typeof value === "boolean") {
    return value;
  }

  return cleanString(value, 10).toLowerCase() === "true";
}

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

const MATERIAL_TYPE_LOOKUP = MATERIAL_TYPE_CHOICES.reduce(function (lookup, materialType) {
  lookup[materialType.toLowerCase()] = materialType;
  return lookup;
}, {});

function cleanMaterialType(value) {
  return MATERIAL_TYPE_LOOKUP[cleanString(value, 80).toLowerCase()] || "";
}

function getTimestampMillis(value) {
  if (!value) return 0;
  if (typeof value.toDate === "function") return value.toDate().getTime();
  if (typeof value.seconds === "number") return value.seconds * 1000;
  if (typeof value._seconds === "number") return value._seconds * 1000;

  const parsedDate = new Date(value);
  return Number.isNaN(parsedDate.getTime()) ? 0 : parsedDate.getTime();
}

function serializeMaterialData(id, data) {
  const createdAtMillis = getTimestampMillis(data.createdAt || data.createdAtIso);
  const isAnonymous = cleanBoolean(data.isAnonymous);

  return {
    id,
    courseCode: data.courseCode || "",
    courseTitle: data.courseTitle || "",
    professor: data.professor || "",
    semester: data.semester || "",
    materialType: data.materialType || data.type || data.category || "",
    uploadGroupId: data.uploadGroupId || "",
    title: data.title || "",
    fileName: data.fileName || "",
    fileUrl: "",
    downloadUrl: id ? "/api/course-material-download?id=" + encodeURIComponent(id) : "",
    fileId: "",
    size: Number(data.size || 0),
    fileType: data.fileType || "",
    status:
      data.status === "rejected"
        ? "rejected"
        : "approved",
    isAnonymous,
    uploaderUid: isAnonymous
      ? ""
      : (data.uploaderUid || ""),
    uploaderDisplayName: isAnonymous
      ? "Anonymous student"
      : (data.uploaderDisplayName || "AUC student"),
    uploaderPhotoURL: isAnonymous
      ? ""
      : (data.uploaderPhotoURL || ""),
    createdAt: createdAtMillis ? new Date(createdAtMillis).toISOString() : (data.createdAtIso || "")
  };
}

function serializeMaterial(doc) {
  return serializeMaterialData(doc.id, doc.data() || {});
}

function createMaterialError(message, statusCode) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

async function ensureVerifiedMaterialUser(decodedUser, action) {
  const userRecord = await admin.auth().getUser(decodedUser.uid);
  const email = String(userRecord.email || decodedUser.email || "").trim().toLowerCase();

  if (!userRecord.emailVerified || !email.endsWith("@aucegypt.edu")) {
    throw createMaterialError("Please verify your AUC email address before " + (action || "accessing course materials") + ".", 403);
  }

  return userRecord;
}

async function getUploaderProfile(decodedUser, userRecord) {
  const userDoc = await admin.firestore().collection("users").doc(decodedUser.uid).get();
  const userData = userDoc.exists ? userDoc.data() || {} : {};
  const email = userRecord.email || userData.email || decodedUser.email || "";
  const displayName = userData.fullName || userRecord.displayName || email.split("@")[0] || "AUC student";
  const photoURL = userData.photoURL || userRecord.photoURL || "";

  return {
    displayName: cleanString(displayName, 80),
    photoURL: cleanString(photoURL, 500)
  };
}

function slugifyMaterialValue(value) {
  return String(value || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "unknown";
}

function getImageKitDescriptionParts(file) {
  return String(file && file.description ? file.description : "")
    .split(" | ")
    .map(function (part) {
      return cleanString(part, 240);
    });
}

function getImageKitMaterialType(file, descriptionParts) {
  const descriptionType = cleanMaterialType(descriptionParts[4]);

  if (descriptionType) {
    return descriptionType;
  }

  const tags = Array.isArray(file && file.tags) ? file.tags : [];
  const typeTag = tags.find(function (tag) {
    return String(tag || "").indexOf("material-type-") === 0;
  });

  if (!typeTag) {
    return "Material";
  }

  const normalizedType = String(typeTag)
    .replace(/^material-type-/, "")
    .replace(/-/g, " ");

  return cleanMaterialType(normalizedType) || "Material";
}

async function getImageKitCourseMaterials(courseCode) {
  const privateKey = String(
    process.env.IMAGEKIT_PRIVATE_KEY || ""
  ).trim();

  if (!privateKey) {
    return [];
  }

  const courseTag = "course-" + slugifyMaterialValue(courseCode);
  const query = new URLSearchParams({
    tags: courseTag,
    type: "file",
    limit: "1000",
    sort: "DESC_CREATED"
  });

  const response = await fetch(
    "https://api.imagekit.io/v1/files?" + query.toString(),
    {
      headers: {
        Accept: "application/json",
        Authorization:
          "Basic " +
          Buffer.from(privateKey + ":").toString("base64")
      }
    }
  );

  if (!response.ok) {
    throw new Error("Could not load ImageKit course materials.");
  }

  const files = await response.json();

  if (!Array.isArray(files)) {
    return [];
  }

  return files.map(function (file) {
    const descriptionParts = getImageKitDescriptionParts(file);
    const imageKitFileName = cleanString(
      file && file.name,
      240
    );
    const legacyFileName = imageKitFileName.replace(
      /_[a-z0-9]{6,}(\.[^.]+)$/i,
      "$1"
    );
    const fileName = cleanString(
      descriptionParts[8] ||
      legacyFileName ||
      imageKitFileName,
      240
    );
    const fileId = cleanString(file && file.fileId, 160);
    const isAnonymous =
      cleanBoolean(descriptionParts[9]) ||
      (
        Array.isArray(file && file.tags) &&
        file.tags.includes("anonymous-upload")
      );
    const titleFromName = fileName
      .replace(/\.[^.]+$/, "")
      .replace(/[-_]+/g, " ")
      .trim();

    return {
      id: "imagekit-" + fileId,
      courseCode,
      courseTitle: "",
      professor:
        descriptionParts[2] || "Professor not listed",
      semester:
        descriptionParts[3] || "Semester not listed",
      materialType: getImageKitMaterialType(
        file,
        descriptionParts
      ),
      title:
        descriptionParts[0] ||
        titleFromName ||
        "Course material",
      fileName,
      fileUrl: "",
      downloadUrl: fileId
        ? "/api/course-material-download?imageKitFileId=" +
          encodeURIComponent(fileId)
        : "",
      filePath: "",
      fileId: "",
      size: Number((file && file.size) || 0),
      fileType: cleanString(
        file && (file.mime || file.fileType),
        80
      ),
      status: "pending",
      isAnonymous,
      uploaderUid: isAnonymous
        ? ""
        : (descriptionParts[7] || ""),
      uploaderDisplayName: isAnonymous
        ? "Anonymous student"
        : (descriptionParts[5] || "AUC student"),
      uploaderPhotoURL: isAnonymous
        ? ""
        : cleanUrl(descriptionParts[6]),
      createdAt: cleanString(file && file.createdAt, 80)
    };
  });
}

async function getCourseMaterials(courseCode) {
  const snapshot = await admin.firestore()
    .collection("courseMaterials")
    .where("courseCode", "==", courseCode)
    .limit(100)
    .get();

  const materials = [];

  snapshot.forEach(function (doc) {
    const material = serializeMaterial(doc);
    const status = cleanString(
      material.status,
      40
    ).toLowerCase();

    if (status === "rejected") {
      return;
    }

    materials.push(material);
  });

  materials.sort(function (a, b) {
    return (
      getTimestampMillis(b.createdAt) -
      getTimestampMillis(a.createdAt)
    );
  });

  return materials;
}

async function getRandomCourseMaterials(limit) {
  const safeLimit = Math.max(
    1,
    Math.min(
      12,
      Math.floor(Number(limit) || 6)
    )
  );

  const snapshot = await admin.firestore()
    .collection("courseMaterials")
    .get();

  const groupsByKey = new Map();

  snapshot.forEach(function (doc) {
    const material = serializeMaterial(doc);
    const status = cleanString(
      material.status,
      40
    ).toLowerCase();

    if (status === "rejected") {
      return;
    }

    const groupKey =
      cleanString(material.uploadGroupId, 80) ||
      material.id;
    const currentMaterial =
      groupsByKey.get(groupKey);

    if (
      !currentMaterial ||
      getTimestampMillis(material.createdAt) >
        getTimestampMillis(currentMaterial.createdAt)
    ) {
      groupsByKey.set(groupKey, material);
    }
  });

  const groupedMaterials =
    Array.from(groupsByKey.values());

  for (
    let index = groupedMaterials.length - 1;
    index > 0;
    index -= 1
  ) {
    const randomIndex = Math.floor(
      Math.random() * (index + 1)
    );
    const randomMaterial =
      groupedMaterials[randomIndex];

    groupedMaterials[randomIndex] =
      groupedMaterials[index];
    groupedMaterials[index] =
      randomMaterial;
  }

  return groupedMaterials.slice(0, safeLimit);
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

async function getImageKitFileDetails(fileId) {
  const authorization = getImageKitAuthorizationHeader();
  const safeFileId = cleanString(fileId, 160);

  if (
    !authorization ||
    !/^[A-Za-z0-9_-]{6,160}$/.test(safeFileId)
  ) {
    throw createMaterialError(
      "Could not verify the uploaded course material.",
      400
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
    throw createMaterialError(
      "Could not verify the uploaded course material.",
      400
    );
  }

  if (!response.ok) {
    throw createMaterialError(
      "Could not verify the stored ImageKit file.",
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
    throw createMaterialError(
      "Could not verify the uploaded course material.",
      400
    );
  }

  return file;
}

function validateMaterialUploadAuthorizationData(
  data,
  authorizationId,
  uploaderUid
) {
  const authorizationData = data || {};
  const expiresAtMs = getTimestampMillis(
    authorizationData.expiresAt
  );
  const registrationGraceMs = 5 * 60 * 1000;

  if (
    cleanString(
      authorizationData.authorizationId,
      80
    ) !== cleanString(authorizationId, 80) ||
    cleanString(
      authorizationData.uploaderUid,
      160
    ) !== cleanString(uploaderUid, 160)
  ) {
    throw createMaterialError(
      "Could not verify this upload authorization.",
      403
    );
  }

  if (
    authorizationData.consumedAt ||
    authorizationData.cancelledAt
  ) {
    throw createMaterialError(
      "This upload authorization has already been used.",
      409
    );
  }

  if (
    !expiresAtMs ||
    expiresAtMs + registrationGraceMs <= Date.now()
  ) {
    throw createMaterialError(
      "This upload authorization has expired.",
      410
    );
  }

  return authorizationData;
}

async function getMaterialUploadAuthorization(
  authorizationId,
  uploaderUid
) {
  const safeAuthorizationId = cleanString(
    authorizationId,
    80
  );

  if (!/^[a-f0-9]{36}$/i.test(safeAuthorizationId)) {
    throw createMaterialError(
      "Could not verify this upload authorization.",
      400
    );
  }

  const ref = admin.firestore()
    .collection("materialUploadAuthorizations")
    .doc(safeAuthorizationId);
  const doc = await ref.get();

  if (!doc.exists) {
    throw createMaterialError(
      "Could not verify this upload authorization.",
      400
    );
  }

  return {
    ref,
    data: validateMaterialUploadAuthorizationData(
      doc.data() || {},
      safeAuthorizationId,
      uploaderUid
    )
  };
}

async function verifyImageKitMaterialUpload(data) {
  const file = await getImageKitFileDetails(data.fileId);
  const filePath = normalizeImageKitPath(file.filePath);
  const expectedFolder =
    getExpectedImageKitMaterialFolder(data);
  const pathParts = filePath.split("/");
  const actualFolder = filePath.slice(
    0,
    filePath.lastIndexOf("/") + 1
  );
  const descriptionParts =
    getImageKitDescriptionParts(file);
  const tags = new Set(
    (Array.isArray(file.tags) ? file.tags : []).map(
      function (tag) {
        return cleanString(tag, 160);
      }
    )
  );
  const expectedTags = [
    "auc-atlas-material",
    "status-approved",
    "course-" + slugifyMaterialValue(data.courseCode),
    "professor-" + slugifyMaterialValue(data.professor),
    "semester-" + slugifyMaterialValue(data.semester),
    "material-type-" +
      slugifyMaterialValue(data.materialType),
    "uploader-" + slugifyMaterialValue(data.uploaderUid),
    "upload-auth-" + data.uploadAuthorizationId
  ];

  const verifiedFileName = cleanMaterialFileName(
    descriptionParts[8]
  );
  const actualSize = Math.max(
    0,
    Number(file.size) || 0
  );
  const actualMimeType = normalizeMaterialMimeType(
    file.mime
  );
  const metadataMatches =
    cleanString(descriptionParts[0], 160) ===
      cleanString(data.title, 160) &&
    cleanString(descriptionParts[1], 40).toUpperCase() ===
      cleanString(data.courseCode, 40).toUpperCase() &&
    cleanString(descriptionParts[2], 120) ===
      cleanString(data.professor, 120) &&
    cleanString(descriptionParts[3], 80) ===
      cleanString(data.semester, 80) &&
    cleanString(descriptionParts[4], 80) ===
      cleanString(data.materialType, 80) &&
    cleanString(descriptionParts[7], 160) ===
      cleanString(data.uploaderUid, 160) &&
    verifiedFileName ===
      cleanMaterialFileName(data.fileName);

  if (
    actualFolder !== expectedFolder ||
    pathParts.includes(".") ||
    pathParts.includes("..") ||
    /%2e/i.test(filePath) ||
    filePath.endsWith("/") ||
    file.isPrivateFile !== true ||
    !expectedTags.every(function (tag) {
      return tags.has(tag);
    }) ||
    !metadataMatches
  ) {
    throw createMaterialError(
      "Could not verify ownership of the uploaded course material.",
      403
    );
  }

  if (
    actualSize !== Number(data.fileSize) ||
    actualSize <= 0 ||
    actualSize > MATERIAL_MAX_FILE_BYTES ||
    !isAllowedMaterialMimeType(actualMimeType) ||
    !doesMaterialMimeMatchFileName(
      verifiedFileName,
      actualMimeType
    )
  ) {
    await deleteImageKitMaterial(file.fileId).catch(
      function () {}
    );

    throw createMaterialError(
      "The uploaded file type or size is not allowed.",
      400
    );
  }

  return {
    fileId: cleanString(file.fileId, 160),
    fileName: verifiedFileName,
    fileUrl: cleanUrl(file.url),
    filePath,
    size: actualSize,
    fileType: actualMimeType
  };
}

function cleanImageKitDescriptionPart(value, maxLength) {
  return cleanString(value, maxLength)
    .replace(/\s*\|\s*/g, " ");
}

function buildImageKitMaterialDescription(data) {
  return [
    cleanImageKitDescriptionPart(data.title, 160),
    cleanImageKitDescriptionPart(data.courseCode, 40),
    cleanImageKitDescriptionPart(data.professor, 120),
    cleanImageKitDescriptionPart(data.semester, 80),
    cleanImageKitDescriptionPart(data.materialType, 80),
    cleanImageKitDescriptionPart(data.uploaderDisplayName, 80),
    cleanImageKitDescriptionPart(data.uploaderPhotoURL, 500),
    cleanImageKitDescriptionPart(data.uploaderUid, 160),
    cleanImageKitDescriptionPart(data.fileName, 240),
    cleanImageKitDescriptionPart(
      String(cleanBoolean(data.isAnonymous)),
      10
    )
  ].join(" | ");
}

function buildImageKitMaterialTags(data) {
  return [
    "auc-atlas-material",
    "status-" + slugifyMaterialValue(data.status || "approved"),
    data.courseCode
      ? "course-" + slugifyMaterialValue(data.courseCode)
      : "",
    data.professor
      ? "professor-" + slugifyMaterialValue(data.professor)
      : "",
    data.semester
      ? "semester-" + slugifyMaterialValue(data.semester)
      : "",
    data.materialType
      ? "material-type-" + slugifyMaterialValue(data.materialType)
      : "",
    data.uploaderUid
      ? "uploader-" + slugifyMaterialValue(data.uploaderUid)
      : "",
    cleanBoolean(data.isAnonymous)
      ? "anonymous-upload"
      : ""
  ].filter(Boolean);
}

async function updateImageKitMaterial(fileId, data) {
  const authorization = getImageKitAuthorizationHeader();
  const safeFileId = cleanString(fileId, 160);

  if (!authorization || !safeFileId) {
    return;
  }

  const response = await fetch(
    "https://api.imagekit.io/v1/files/" +
      encodeURIComponent(safeFileId) +
      "/details",
    {
      method: "PATCH",
      headers: {
        Accept: "application/json",
        Authorization: authorization,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        description: buildImageKitMaterialDescription(data),
        tags: buildImageKitMaterialTags(data)
      })
    }
  );

  if (!response.ok) {
    throw createMaterialError(
      "Could not update the stored course material.",
      502
    );
  }
}

async function deleteImageKitMaterial(fileId) {
  const authorization = getImageKitAuthorizationHeader();
  const safeFileId = cleanString(fileId, 160);

  if (!authorization || !safeFileId) {
    return;
  }

  const response = await fetch(
    "https://api.imagekit.io/v1/files/" +
      encodeURIComponent(safeFileId),
    {
      method: "DELETE",
      headers: {
        Accept: "application/json",
        Authorization: authorization
      }
    }
  );

  if (!response.ok && response.status !== 404) {
    throw createMaterialError(
      "Could not delete the stored course material.",
      502
    );
  }
}

async function getUserMaterials(uploaderUid) {
  const snapshot = await admin.firestore()
    .collection("courseMaterials")
    .where("uploaderUid", "==", uploaderUid)
    .limit(200)
    .get();
  const materials = [];

  snapshot.forEach(function (doc) {
    const material = serializeMaterial(doc);

    if (material.status !== "rejected") {
      materials.push(material);
    }
  });

  materials.sort(function (a, b) {
    return (
      getTimestampMillis(b.createdAt) -
      getTimestampMillis(a.createdAt)
    );
  });

  return materials;
}

async function getOwnedMaterial(materialId, uploaderUid) {
  const safeMaterialId = cleanString(materialId, 160);

  if (!safeMaterialId) {
    throw createMaterialError("Course material not found.", 404);
  }

  const materialRef = admin.firestore()
    .collection("courseMaterials")
    .doc(safeMaterialId);
  const materialDoc = await materialRef.get();

  if (!materialDoc.exists) {
    throw createMaterialError("Course material not found.", 404);
  }

  const materialData = materialDoc.data() || {};

  if (
    cleanString(materialData.uploaderUid, 160) !==
    cleanString(uploaderUid, 160)
  ) {
    throw createMaterialError(
      "You cannot manage this course material.",
      403
    );
  }

  if (materialData.status === "rejected") {
    throw createMaterialError("Course material not found.", 404);
  }

  return {
    ref: materialRef,
    data: materialData
  };
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

module.exports = async function handler(req, res) {
  try {
    const allowedMethods = ["GET", "POST", "PATCH", "DELETE"];

    if (!allowedMethods.includes(req.method)) {
      res.setHeader("Allow", allowedMethods.join(", "));
      return res.status(405).json({ error: "Method not allowed" });
    }

    const decodedUser = await getSiteSessionUser(req, {
      checkRevoked: true
    });
    const userRecord = await ensureVerifiedMaterialUser(
      decodedUser,
      req.method === "POST"
        ? "uploading materials"
        : "managing course materials"
    );

    res.setHeader("Cache-Control", "no-store");

    if (req.method === "GET") {
      const query = req.query || {};
      const mine = String(query.mine || "").toLowerCase() === "true";
      const random = String(query.random || "").toLowerCase() === "true";

      if (mine) {
        return res.status(200).json({
          materials: await getUserMaterials(decodedUser.uid)
        });
      }

      if (random) {
        await consumeSecurityRateLimit({
          scope: "course-material-random-user",
          identifier: decodedUser.uid,
          maxAttempts:
            MATERIAL_RANDOM_READ_MAX_REQUESTS,
          windowMs:
            MATERIAL_RANDOM_READ_WINDOW_MS,
          message:
            "Too many random course-material requests. Please try again later."
        });

        return res.status(200).json({
          materials: await getRandomCourseMaterials(query.limit)
        });
      }

      const courseCode = cleanString(
        query.courseCode,
        40
      ).toUpperCase();

      if (!courseCode) {
        throw createMaterialError("Course not found.", 400);
      }

      return res.status(200).json({
        materials: await getCourseMaterials(courseCode)
      });
    }

    if (
      req.method === "PATCH" ||
      req.method === "DELETE"
    ) {
      await consumeSecurityRateLimit({
        scope: "course-material-mutation-user",
        identifier: decodedUser.uid,
        maxAttempts:
          MATERIAL_MUTATION_MAX_REQUESTS,
        windowMs:
          MATERIAL_MUTATION_WINDOW_MS,
        message:
          "Too many course-material changes. Please try again later."
      });
    }

    const body = getRequestBody(req);

    if (req.method === "PATCH") {
      const materialId = cleanString(body.materialId, 160);
      const title = cleanString(body.title, 160);
      const materialType = cleanMaterialType(
        body.materialType ||
        body.type ||
        body.category
      );

      if (!materialId || !title || !materialType) {
        throw createMaterialError(
          "Enter a material name and choose a valid category.",
          400
        );
      }

      const ownedMaterial = await getOwnedMaterial(
        materialId,
        decodedUser.uid
      );
      const updatedAtIso = new Date().toISOString();
      const currentStatus =
        cleanString(
          ownedMaterial.data.status || "approved",
          40
        ).toLowerCase() || "approved";
      const nextStatus =
        currentStatus === "rejected"
          ? "rejected"
          : "approved";
      const updatedData = Object.assign(
        {},
        ownedMaterial.data,
        {
          title,
          materialType,
          status: nextStatus,
          updatedAtIso
        }
      );
      const firestoreUpdate = {
        title,
        materialType,
        status: nextStatus,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAtIso
      };

      await ownedMaterial.ref.update(
        firestoreUpdate
      );

      try {
        await updateImageKitMaterial(
          ownedMaterial.data.fileId,
          updatedData
        );
      } catch (error) {
        // The Firestore record remains the source used by the site.
      }

      return res.status(200).json({
        success: true,
        materials: await getUserMaterials(decodedUser.uid)
      });
    }

    if (req.method === "DELETE") {
      const materialId = cleanString(body.materialId, 160);
      const ownedMaterial = await getOwnedMaterial(
        materialId,
        decodedUser.uid
      );
      const deletedAtIso = new Date().toISOString();

      try {
        await deleteImageKitMaterial(
          ownedMaterial.data.fileId
        );
      } catch (error) {
        // The rejected Firestore record prevents the file from returning.
      }

      await ownedMaterial.ref.update({
        status: "rejected",
        deletedAt: admin.firestore.FieldValue.serverTimestamp(),
        deletedAtIso
      });

      return res.status(200).json({
        success: true,
        materials: await getUserMaterials(decodedUser.uid)
      });
    }

    const uploader = await getUploaderProfile(
      decodedUser,
      userRecord
    );
    const uploadAuthorizationId = cleanString(
      body.uploadAuthorizationId,
      80
    );
    const submittedFileId = cleanString(
      body.fileId,
      160
    );
    const requestedUploadGroupId = cleanString(
      body.uploadGroupId,
      80
    );

    if (!uploadAuthorizationId || !submittedFileId) {
      throw createMaterialError(
        "Could not save this course material.",
        400
      );
    }

    const uploadGroupId =
      /^[A-Za-z0-9-]{8,80}$/.test(requestedUploadGroupId)
        ? requestedUploadGroupId
        : "single-" + uploadAuthorizationId;

    const authorization =
      await getMaterialUploadAuthorization(
        uploadAuthorizationId,
        decodedUser.uid
      );
    const authorizationData = authorization.data;
    const courseCode = cleanString(
      authorizationData.courseCode,
      40
    ).toUpperCase();
    const courseTitle = cleanString(
      authorizationData.courseTitle,
      160
    );
    const professor = cleanString(
      authorizationData.professor,
      120
    );
    const semester = cleanString(
      authorizationData.semester,
      80
    );
    const materialType = cleanMaterialType(
      authorizationData.materialType
    );
    const isAnonymous = cleanBoolean(
      authorizationData.isAnonymous
    );
    const title = cleanString(
      authorizationData.title,
      160
    );
    const fileName = cleanMaterialFileName(
      authorizationData.fileName
    );
    const fileSize = Number(
      authorizationData.fileSize
    );

    if (
      !courseCode ||
      !professor ||
      !semester ||
      !materialType ||
      !title ||
      !fileName ||
      !Number.isSafeInteger(fileSize) ||
      fileSize <= 0 ||
      fileSize > MATERIAL_MAX_FILE_BYTES
    ) {
      throw createMaterialError(
        "Could not verify this upload authorization.",
        400
      );
    }

    const verifiedFile =
      await verifyImageKitMaterialUpload({
        fileId: submittedFileId,
        uploadAuthorizationId,
        uploaderUid: decodedUser.uid,
        courseCode,
        professor,
        semester,
        materialType,
        isAnonymous,
        title,
        fileName,
        fileSize
      });
    const createdAtIso = new Date().toISOString();
    const materialData = {
      courseCode,
      courseTitle,
      professor,
      semester,
      materialType,
      uploadGroupId,
      isAnonymous,
      title,
      fileName: verifiedFile.fileName,
      fileUrl: verifiedFile.fileUrl,
      filePath: verifiedFile.filePath,
      fileId: verifiedFile.fileId,
      size: verifiedFile.size,
      fileType: verifiedFile.fileType,
      status: "approved",
      uploaderUid: decodedUser.uid,
      uploaderDisplayName: uploader.displayName,
      uploaderPhotoURL: uploader.photoURL,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      createdAtIso
    };
    const db = admin.firestore();
    const materialRef = db
      .collection("courseMaterials")
      .doc("imagekit-" + verifiedFile.fileId);
    const uploadLimitRef = db
      .collection("materialUploadLimits")
      .doc(decodedUser.uid);
    let existingMaterialData = null;

    await db.runTransaction(async function (transaction) {
      const currentAuthorizationDoc =
        await transaction.get(authorization.ref);

      if (!currentAuthorizationDoc.exists) {
        throw createMaterialError(
          "Could not verify this upload authorization.",
          400
        );
      }

      validateMaterialUploadAuthorizationData(
        currentAuthorizationDoc.data() || {},
        uploadAuthorizationId,
        decodedUser.uid
      );

      const existingMaterialDoc =
        await transaction.get(materialRef);
      const uploadLimitDoc =
        await transaction.get(uploadLimitRef);

      if (existingMaterialDoc.exists) {
        const existingData =
          existingMaterialDoc.data() || {};

        if (
          cleanString(existingData.uploaderUid, 160) !==
          cleanString(decodedUser.uid, 160) ||
          existingData.status === "rejected"
        ) {
          throw createMaterialError(
            "This uploaded file is already registered.",
            409
          );
        }

        existingMaterialData = existingData;
      } else {
        transaction.set(materialRef, materialData);
      }

      transaction.update(authorization.ref, {
        consumedAt:
          admin.firestore.FieldValue.serverTimestamp(),
        registeredFileId: verifiedFile.fileId,
        registeredMaterialId: materialRef.id
      });

      const uploadLimitData = uploadLimitDoc.exists
        ? uploadLimitDoc.data() || {}
        : {};

      if (
        cleanString(
          uploadLimitData.activeAuthorizationId,
          80
        ) === uploadAuthorizationId
      ) {
        transaction.set(
          uploadLimitRef,
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

    return res
      .status(existingMaterialData ? 200 : 201)
      .json({
        material: serializeMaterialData(
          materialRef.id,
          existingMaterialData || materialData
        ),
        alreadySaved: Boolean(existingMaterialData)
      });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      error:
        error.message ||
        "Could not load course materials."
    });
  }
};
