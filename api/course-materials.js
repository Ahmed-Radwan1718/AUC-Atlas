const admin = require("../server/_lib/firebaseAdmin");

const { getSiteSessionUser } = require("../server/_lib/securityHelpers");
const {
  consumeSecurityRateLimit
} = require("../server/_lib/securityRateLimits");
const {
  MATERIAL_MAX_FILE_BYTES,
  cleanMaterialFileName,
  getMaterialFileExtension,
  normalizeMaterialMimeType,
  isAllowedMaterialMimeType,
  doesMaterialMimeMatchFileName
} = require("../server/_lib/courseMaterialUploadPolicy");
const {
  getCloudinaryMaterial,
  deleteCloudinaryMaterial,
  isCloudinaryMaterialPublicId
} = require("../server/_lib/cloudinaryCourseMaterials");

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

async function verifyCloudinaryMaterialUpload(data) {
  const publicId = cleanString(
    data.publicId,
    80
  );
  const assetId = cleanString(
    data.assetId,
    160
  );
  const expectedFileName =
    cleanMaterialFileName(data.fileName);
  const expectedFileSize =
    Number(data.fileSize);
  const expectedFileType =
    normalizeMaterialMimeType(data.fileType);
  const expectedExtension =
    getMaterialFileExtension(expectedFileName);

  if (
    !isCloudinaryMaterialPublicId(publicId) ||
    !/^[A-Za-z0-9_-]{16,160}$/.test(assetId)
  ) {
    throw createMaterialError(
      "Could not verify the uploaded course material.",
      400
    );
  }

  const file =
    await getCloudinaryMaterial(publicId);

  if (
    file.publicId !== publicId ||
    file.assetId !== assetId ||
    file.resourceType !== "raw" ||
    file.deliveryType !== "authenticated" ||
    file.format !== expectedExtension ||
    file.size !== expectedFileSize ||
    file.size <= 0 ||
    file.size > MATERIAL_MAX_FILE_BYTES ||
    !isAllowedMaterialMimeType(
      expectedFileType
    ) ||
    !doesMaterialMimeMatchFileName(
      expectedFileName,
      expectedFileType
    )
  ) {
    await deleteCloudinaryMaterial(
      publicId
    ).catch(function () {});

    throw createMaterialError(
      "The uploaded file type or size is not allowed.",
      400
    );
  }

  return {
    storageKey: publicId,
    fileId: assetId,
    cloudinaryPublicId: publicId,
    cloudinaryAssetId: assetId,
    cloudinaryFormat: file.format,
    fileName: expectedFileName,
    fileUrl: "",
    filePath: "",
    size: file.size,
    fileType: expectedFileType
  };
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
    authorizationData.cancelledAt ||
    authorizationData.cleanupStartedAt
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

async function verifyStorageMaterialUpload(data) {
  const safeStorageKey = cleanString(
    data.storageKey,
    80
  );
  const file = await getStorageFileDetails(
    safeStorageKey
  );

  const verifiedFileName =
    cleanMaterialFileName(file.fileName);
  const actualSize = Math.max(
    0,
    Number(file.size) || 0
  );
  const actualMimeType =
    normalizeMaterialMimeType(file.fileType);

  if (
    file.storageKey !== safeStorageKey ||
    verifiedFileName !==
      cleanMaterialFileName(data.fileName) ||
    actualSize !== Number(data.fileSize) ||
    actualSize <= 0 ||
    actualSize > MATERIAL_MAX_FILE_BYTES ||
    !isAllowedMaterialMimeType(actualMimeType) ||
    !doesMaterialMimeMatchFileName(
      verifiedFileName,
      actualMimeType
    )
  ) {
    await deleteStorageMaterial(
      safeStorageKey
    ).catch(function () {});

    throw createMaterialError(
      "The uploaded file type or size is not allowed.",
      400
    );
  }

  return {
    storageKey: safeStorageKey,
    fileId: safeStorageKey,
    fileName: verifiedFileName,
    fileUrl: "",
    filePath: "",
    size: actualSize,
    fileType: actualMimeType
  };
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
        await deleteCloudinaryMaterial(
          ownedMaterial.data.storageKey
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
    const submittedPublicId = cleanString(
      body.cloudinaryPublicId,
      80
    );
    const submittedAssetId = cleanString(
      body.cloudinaryAssetId,
      160
    );
    const requestedUploadGroupId = cleanString(
      body.uploadGroupId,
      80
    );

    if (
      !uploadAuthorizationId ||
      !submittedPublicId ||
      !submittedAssetId
    ) {
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
    const fileType = normalizeMaterialMimeType(
      authorizationData.fileType
    );
    const storageKey = cleanString(
      authorizationData.storageKey,
      80
    );

    if (
      !courseCode ||
      !professor ||
      !semester ||
      !materialType ||
      !title ||
      !fileName ||
      !isCloudinaryMaterialPublicId(
        storageKey
      ) ||
      submittedPublicId !== storageKey ||
      !/^[A-Za-z0-9_-]{16,160}$/.test(
        submittedAssetId
      ) ||
      !Number.isSafeInteger(fileSize) ||
      fileSize <= 0 ||
      fileSize > MATERIAL_MAX_FILE_BYTES ||
      !isAllowedMaterialMimeType(fileType) ||
      !doesMaterialMimeMatchFileName(
        fileName,
        fileType
      )
    ) {
      throw createMaterialError(
        "Could not verify this upload authorization.",
        400
      );
    }

    const verifiedFile =
      await verifyCloudinaryMaterialUpload({
        publicId: storageKey,
        assetId: submittedAssetId,
        fileName,
        fileSize,
        fileType
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
      fileUrl: "",
      filePath: "",
      fileId: verifiedFile.fileId,
      storageKey: verifiedFile.storageKey,
      storageProvider: "cloudinary",
      cloudinaryPublicId:
        verifiedFile.cloudinaryPublicId,
      cloudinaryAssetId:
        verifiedFile.cloudinaryAssetId,
      cloudinaryFormat:
        verifiedFile.cloudinaryFormat,
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
      .doc("cloudinary-" + verifiedFile.fileId);
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
        registeredStorageKey:
          verifiedFile.storageKey,
        registeredCloudinaryAssetId:
          verifiedFile.cloudinaryAssetId,
        registeredCloudinaryPublicId:
          verifiedFile.cloudinaryPublicId,
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
