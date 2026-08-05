const admin = require("../server/_lib/firebaseAdmin");

const { getSiteSessionUser } = require("../server/_lib/securityHelpers");

function cleanString(value, maxLength) {
  return String(value || "").trim().replace(/\s+/g, " ").slice(0, maxLength);
}

function cleanUrl(value) {
  const url = cleanString(value, 1000);
  return /^https?:\/\//i.test(url) ? url : "";
}

const MATERIAL_TYPE_CHOICES = [
  "Notes",
  "Slides",
  "Past exam",
  "Practice sheet",
  "Lab file",
  "Assignment",
  "Project",
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

  return {
    id,
    courseCode: data.courseCode || "",
    courseTitle: data.courseTitle || "",
    professor: data.professor || "",
    semester: data.semester || "",
    materialType: data.materialType || data.type || data.category || "",
    title: data.title || "",
    fileName: data.fileName || "",
    fileUrl: "",
    downloadUrl: id ? "/api/course-material-download?id=" + encodeURIComponent(id) : "",
    filePath: "",
    fileId: "",
    size: Number(data.size || 0),
    fileType: data.fileType || "",
    status: data.status || "pending",
    uploaderUid: data.uploaderUid || "",
    uploaderDisplayName: data.uploaderDisplayName || "AUC student",
    uploaderPhotoURL: data.uploaderPhotoURL || "",
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
    const filePath = cleanString(file && file.filePath, 500);
    const titleFromName = fileName
      .replace(/\.[^.]+$/, "")
      .replace(/[-_]+/g, " ")
      .trim();

    return {
      id:
        "imagekit-" +
        cleanString(file && file.fileId, 160),
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
      downloadUrl: filePath
        ? "/api/course-material-download?path=" +
          encodeURIComponent(filePath)
        : "",
      filePath: "",
      fileId: "",
      size: Number((file && file.size) || 0),
      fileType: cleanString(
        file && (file.mime || file.fileType),
        80
      ),
      status: "pending",
      uploaderUid: descriptionParts[7] || "",
      uploaderDisplayName:
        descriptionParts[5] || "AUC student",
      uploaderPhotoURL: cleanUrl(descriptionParts[6]),
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

    if (material.status !== "rejected") {
      materials.push(material);
    }
  });

  try {
    const imageKitMaterials =
      await getImageKitCourseMaterials(courseCode);

    function getMaterialIdentity(material) {
      return [
        cleanString(material.title, 160).toLowerCase(),
        cleanString(
          material.professor,
          120
        ).toLowerCase(),
        cleanString(
          material.semester,
          80
        ).toLowerCase()
      ].join("|");
    }

    const knownFileNames = new Set(
      materials
        .map(function (material) {
          return cleanString(
            material.fileName,
            240
          ).toLowerCase();
        })
        .filter(Boolean)
    );
    const knownMaterialIdentities = new Set(
      materials
        .map(getMaterialIdentity)
        .filter(Boolean)
    );

    imageKitMaterials.forEach(function (material) {
      const fileName = cleanString(
        material.fileName,
        240
      ).toLowerCase();
      const materialIdentity =
        getMaterialIdentity(material);

      if (
        (fileName && knownFileNames.has(fileName)) ||
        knownMaterialIdentities.has(materialIdentity)
      ) {
        return;
      }

      if (fileName) {
        knownFileNames.add(fileName);
      }

      knownMaterialIdentities.add(materialIdentity);
      materials.push(material);
    });
  } catch (error) {
    // Firestore materials remain available if ImageKit is unavailable.
  }

  materials.sort(function (a, b) {
    return (
      getTimestampMillis(b.createdAt) -
      getTimestampMillis(a.createdAt)
    );
  });

  return materials;
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
    if (req.method === "GET") {
      const decodedUser = await getSiteSessionUser(req, {
        checkRevoked: true
      });

      await ensureVerifiedMaterialUser(decodedUser, "accessing course materials");

      const courseCode = cleanString((req.query || {}).courseCode, 40).toUpperCase();

      if (!courseCode) {
        throw createMaterialError("Course not found.", 400);
      }

      res.setHeader("Cache-Control", "no-store");
      return res.status(200).json({
        materials: await getCourseMaterials(courseCode)
      });
    }

    if (req.method !== "POST") {
      res.setHeader("Allow", "GET, POST");
      return res.status(405).json({ error: "Method not allowed" });
    }

    const decodedUser = await getSiteSessionUser(req, {
      checkRevoked: true
    });
    const userRecord = await ensureVerifiedMaterialUser(decodedUser, "uploading materials");
    const uploader = await getUploaderProfile(decodedUser, userRecord);
    const body = getRequestBody(req);

    const courseCode = cleanString(body.courseCode, 40).toUpperCase();
    const courseTitle = cleanString(body.courseTitle, 160);
    const professor = cleanString(body.professor, 120);
    const semester = cleanString(body.semester, 80);
    const materialType = cleanMaterialType(body.materialType || body.type || body.category);
    const title = cleanString(body.title, 160);
    const fileName = cleanString(body.fileName, 240);
    const fileUrl = cleanUrl(body.fileUrl);
    const filePath = cleanString(body.filePath, 500);
    const fileId = cleanString(body.fileId, 160);
    const size = Number(body.size || 0);
    const fileType = cleanString(body.fileType, 80);
    const createdAtIso = new Date().toISOString();

    if (!courseCode || !title || !materialType || !filePath) {
      throw createMaterialError("Could not save this course material.", 400);
    }

    const materialData = {
      courseCode,
      courseTitle,
      professor,
      semester,
      materialType,
      title,
      fileName,
      fileUrl,
      filePath,
      fileId,
      size: Number.isFinite(size) ? size : 0,
      fileType,
      status: "pending",
      uploaderUid: decodedUser.uid,
      uploaderDisplayName: uploader.displayName,
      uploaderPhotoURL: uploader.photoURL,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      createdAtIso
    };

    const materialRef = await admin.firestore().collection("courseMaterials").add(materialData);

    return res.status(201).json({
      material: serializeMaterialData(materialRef.id, materialData)
    });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      error: error.message || "Could not load course materials."
    });
  }
};
