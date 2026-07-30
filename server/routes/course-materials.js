const crypto = require("crypto");
const path = require("path");
const admin = require("../_lib/firebaseAdmin");
const { v2: cloudinary } = require("cloudinary");
const courseDetailsByCode = require("../../courses-data.js");

const {
  getUserFromRequest
} = require("../_lib/securityHelpers");

const {
  getClientIp,
  consumeRateLimit,
  THIRTY_MINUTES_MS,
  ONE_HOUR_MS
} = require("../_lib/rateLimitHelpers");

const MATERIALS_COLLECTION = "courseMaterials";
const MAX_PUBLIC_MATERIALS = 300;
const MAX_ADMIN_MATERIALS = 600;
const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;
const MAX_REQUEST_BYTES = MAX_UPLOAD_BYTES + 1024 * 1024;
const CLOUDINARY_MATERIAL_FOLDER = "auc-atlas/course-materials";
const SIGNED_DOWNLOAD_SECONDS = 10 * 60;

const SEMESTER_OPTIONS = [
  { value: "fall-2024", label: "Fall 2024" },
  { value: "spring-2025", label: "Spring 2025" },
  { value: "summer-2025", label: "Summer 2025" },
  { value: "fall-2025", label: "Fall 2025" },
  { value: "spring-2026", label: "Spring 2026" },
  { value: "summer-2026", label: "Summer 2026" },
  { value: "fall-2026", label: "Fall 2026" },
  { value: "spring-2027", label: "Spring 2027" },
  { value: "summer-2027", label: "Summer 2027" }
];

const MATERIAL_TYPE_OPTIONS = [
  { value: "lecture-notes", label: "Lecture notes" },
  { value: "study-guide", label: "Study guide" },
  { value: "summary", label: "Summary" },
  { value: "practice-questions", label: "Practice questions" },
  { value: "past-exam", label: "Past exam" },
  { value: "past-quiz", label: "Past quiz" },
  { value: "assignment", label: "Assignment" },
  { value: "lab-material", label: "Lab material" },
  { value: "formula-sheet", label: "Formula sheet" },
  { value: "syllabus", label: "Syllabus" },
  { value: "reading-notes", label: "Reading notes" },
  { value: "project-example", label: "Project example" },
  { value: "other", label: "Other" }
];

const FILE_TYPES = {
  pdf: {
    label: "PDF",
    mimeTypes: new Set(["application/pdf"])
  },
  docx: {
    label: "DOCX",
    mimeTypes: new Set(["application/vnd.openxmlformats-officedocument.wordprocessingml.document"])
  },
  pptx: {
    label: "PPTX",
    mimeTypes: new Set(["application/vnd.openxmlformats-officedocument.presentationml.presentation"])
  },
  xlsx: {
    label: "XLSX",
    mimeTypes: new Set(["application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"])
  },
  txt: {
    label: "TXT",
    mimeTypes: new Set(["text/plain"])
  },
  png: {
    label: "PNG",
    mimeTypes: new Set(["image/png"])
  },
  jpg: {
    label: "JPG",
    mimeTypes: new Set(["image/jpeg", "image/jpg"])
  },
  jpeg: {
    label: "JPEG",
    mimeTypes: new Set(["image/jpeg", "image/jpg"])
  }
};

function cleanString(value, maxLength) {
  return String(value || "").trim().slice(0, maxLength);
}

function normalizeEmail(value) {
  return cleanString(value, 180).toLowerCase();
}

function normalizeCourseKey(value) {
  return String(value || "").toLowerCase().replace(/[^a-z0-9]/g, "");
}

function cleanCourseCode(value) {
  const compact = cleanString(value, 40).toUpperCase().replace(/[^A-Z0-9]/g, "");
  const match = compact.match(/^([A-Z]{3,4})([0-9]{4}[A-Z]?)$/);

  return match ? match[1] + " " + match[2] : "";
}

function cleanProfessorId(value) {
  const professorId = cleanString(value, 80).toLowerCase();

  return /^[a-z0-9-]+$/.test(professorId) ? professorId : "";
}

function cleanMaterialId(value) {
  const materialId = cleanString(value, 120);

  return materialId && /^[A-Za-z0-9_-]+$/.test(materialId) && !materialId.includes("/")
    ? materialId
    : "";
}

function cleanMaterialType(value) {
  const requestedValue = cleanString(value, 80).toLowerCase();

  return MATERIAL_TYPE_OPTIONS.find(function (type) {
    return type.value === requestedValue || type.label.toLowerCase() === requestedValue;
  }) || null;
}

function getSemesterOption(value) {
  const normalizedValue = cleanString(value, 80).toLowerCase();

  return SEMESTER_OPTIONS.find(function (semester) {
    return semester.value === normalizedValue || semester.label.toLowerCase() === normalizedValue;
  }) || null;
}

function getConfiguredAdminEmails() {
  return String(process.env.AUC_ATLAS_ADMIN_EMAILS || "")
    .split(",")
    .map(normalizeEmail)
    .filter(Boolean);
}

function rolesIncludeAdmin(value) {
  if (Array.isArray(value)) {
    return value.map(function (role) {
      return String(role || "").trim().toLowerCase();
    }).includes("admin");
  }

  return String(value || "")
    .split(",")
    .map(function (role) {
      return role.trim().toLowerCase();
    })
    .includes("admin");
}

async function getSignedInUser(req) {
  return await getUserFromRequest(req, {
    checkRevoked: true,
    requireCompletedTwoFactor: true
  });
}

async function requireAdmin(decodedUser) {
  const db = admin.firestore();
  const userRecord = await admin.auth().getUser(decodedUser.uid);
  const customClaims = userRecord.customClaims || {};
  const email = normalizeEmail(userRecord.email || decodedUser.email || "");
  const adminDoc = await db.collection("adminUsers").doc(decodedUser.uid).get();
  const adminData = adminDoc.exists ? adminDoc.data() || {} : {};
  const assignedByClaim = customClaims.admin === true ||
    customClaims.role === "admin" ||
    rolesIncludeAdmin(customClaims.roles);
  const assignedByAdminDoc = adminDoc.exists && adminData.active === true;
  const assignedByEnvironment = getConfiguredAdminEmails().includes(email);

  if (!assignedByClaim && !assignedByAdminDoc && !assignedByEnvironment) {
    const error = new Error("You do not have permission to manage materials.");
    error.statusCode = 403;
    throw error;
  }

  return {
    uid: decodedUser.uid,
    email
  };
}

function getCourseByCodeForListing(value) {
  const courseCode = cleanCourseCode(value);

  if (!courseCode) {
    return null;
  }

  const details = courseDetailsByCode[courseCode] || {};

  return {
    code: courseCode,
    title: cleanString(details.title || "", 140)
  };
}

function getRecordedCourseForProfessor(professorId, requestedCourseCode) {
  const requestedKey = normalizeCourseKey(requestedCourseCode);

  if (!professorId || !requestedKey) {
    return null;
  }

  const courseCode = Object.keys(courseDetailsByCode || {}).find(function (code) {
    const details = courseDetailsByCode[code] || {};
    const professorsForCourse = Array.isArray(details.professors) ? details.professors : [];
    const courseMatches = normalizeCourseKey(code) === requestedKey;
    const professorMatches = professorsForCourse.some(function (entry) {
      const professorEntry = typeof entry === "string" ? { id: entry } : entry || {};
      return professorEntry.id === professorId;
    });

    return courseMatches && professorMatches;
  });

  if (!courseCode) {
    return null;
  }

  const details = courseDetailsByCode[courseCode] || {};

  return {
    code: courseCode,
    title: cleanString(details.title || courseCode, 140)
  };
}

function timestampToMillis(value) {
  if (!value) return 0;
  if (typeof value.toMillis === "function") return value.toMillis();
  if (typeof value.toDate === "function") return value.toDate().getTime();

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 0 : date.getTime();
}

function serializeTimestamp(value) {
  const millis = timestampToMillis(value);
  return millis ? new Date(millis).toISOString() : null;
}

function getMaterialTime(material) {
  const date = new Date(material.createdAt || 0);
  return Number.isNaN(date.getTime()) ? 0 : date.getTime();
}

function serializeMaterial(materialDoc, options) {
  const settings = options || {};
  const data = materialDoc.data() || {};
  const viewerUid = settings.viewerUid || "";
  const isAdmin = Boolean(settings.isAdmin);

  return {
    id: materialDoc.id,
    materialId: data.materialId || materialDoc.id,
    courseCode: data.courseCode || "",
    courseTitle: data.courseTitle || "",
    courseKey: data.courseKey || "",
    professorId: data.professorId || "",
    professorName: data.professorName || "",
    semester: data.semester || "",
    semesterLabel: data.semesterLabel || "",
    materialType: data.materialType || "",
    materialTypeLabel: data.materialTypeLabel || data.type || "",
    type: data.materialTypeLabel || data.type || "",
    title: data.title || "",
    description: data.description || "",
    originalFilename: data.originalFilename || "",
    fileType: data.fileType || "",
    fileExtension: data.fileExtension || data.cloudinaryFormat || "",
    fileSize: Number(data.fileSize || 0),
    uploaderDisplayLabel: data.uploaderDisplayLabel || "Anonymous AUC student",
    uploaderUid: isAdmin ? data.uploaderUid || "" : "",
    uploaderEmail: isAdmin ? data.uploaderEmail || "" : "",
    status: data.status || "available",
    createdAt: serializeTimestamp(data.createdAt),
    updatedAt: serializeTimestamp(data.updatedAt),
    canDelete: isAdmin || Boolean(viewerUid && data.uploaderUid === viewerUid)
  };
}

function configureCloudinary() {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  if (!cloudName || !apiKey || !apiSecret) {
    const error = new Error("Material storage is not configured.");
    error.statusCode = 500;
    throw error;
  }

  cloudinary.config({
    cloud_name: cloudName,
    api_key: apiKey,
    api_secret: apiSecret,
    secure: true
  });
}

function createRequestTooLargeError() {
  const error = new Error("Material files must be 10MB or smaller.");
  error.statusCode = 413;
  return error;
}

function readRequestBuffer(req, maxBytes) {
  return new Promise(function (resolve, reject) {
    const chunks = [];
    let total = 0;
    let settled = false;

    function fail(error) {
      if (!settled) {
        settled = true;
        reject(error);
      }
    }

    req.on("data", function (chunk) {
      total += chunk.length;

      if (total > maxBytes) {
        fail(createRequestTooLargeError());
        return;
      }

      chunks.push(chunk);
    });

    req.on("end", function () {
      if (!settled) {
        settled = true;
        resolve(Buffer.concat(chunks));
      }
    });

    req.on("error", fail);
  });
}

function parseHeaderValue(headers, name) {
  const headerLine = headers.split(/\r?\n/).find(function (line) {
    return line.toLowerCase().startsWith(name.toLowerCase() + ":");
  });

  return headerLine ? headerLine.slice(headerLine.indexOf(":") + 1).trim() : "";
}

function parseMultipartForm(req) {
  return readRequestBuffer(req, MAX_REQUEST_BYTES).then(function (bodyBuffer) {
    const contentType = String(req.headers["content-type"] || "");
    const boundaryMatch = contentType.match(/boundary=([^;]+)/i);
    const boundary = boundaryMatch ? boundaryMatch[1].replace(/^"|"$/g, "") : "";

    if (!boundary) {
      const error = new Error("Upload form is missing a boundary.");
      error.statusCode = 400;
      throw error;
    }

    const boundaryBuffer = Buffer.from("--" + boundary);
    const fields = {};
    let file = null;
    let boundaryIndex = bodyBuffer.indexOf(boundaryBuffer);

    while (boundaryIndex !== -1) {
      let partStart = boundaryIndex + boundaryBuffer.length;

      if (bodyBuffer.slice(partStart, partStart + 2).toString("utf8") === "--") {
        break;
      }

      if (bodyBuffer.slice(partStart, partStart + 2).toString("utf8") === "\r\n") {
        partStart += 2;
      }

      const nextBoundaryIndex = bodyBuffer.indexOf(boundaryBuffer, partStart);

      if (nextBoundaryIndex === -1) {
        break;
      }

      let partEnd = nextBoundaryIndex;

      if (bodyBuffer[partEnd - 2] === 13 && bodyBuffer[partEnd - 1] === 10) {
        partEnd -= 2;
      }

      const partBuffer = bodyBuffer.slice(partStart, partEnd);
      const headerEnd = partBuffer.indexOf(Buffer.from("\r\n\r\n"));

      if (headerEnd !== -1) {
        const headers = partBuffer.slice(0, headerEnd).toString("utf8");
        const content = partBuffer.slice(headerEnd + 4);
        const disposition = parseHeaderValue(headers, "content-disposition");
        const contentTypeHeader = parseHeaderValue(headers, "content-type");
        const nameMatch = disposition.match(/name="([^"]+)"/i);
        const filenameMatch = disposition.match(/filename="([^"]*)"/i);
        const fieldName = nameMatch ? nameMatch[1] : "";

        if (fieldName) {
          if (filenameMatch) {
            file = {
              fieldName,
              originalFilename: filenameMatch[1] || "",
              mimeType: cleanString(contentTypeHeader, 120).toLowerCase(),
              buffer: content
            };
          } else {
            fields[fieldName] = content.toString("utf8");
          }
        }
      }

      boundaryIndex = nextBoundaryIndex;
    }

    return {
      fields,
      file
    };
  });
}

function parseDataUrlFile(body) {
  const dataUrl = cleanString(body.fileDataUrl, MAX_REQUEST_BYTES * 2);
  const match = dataUrl.match(/^data:([^;,]+);base64,([A-Za-z0-9+/]+={0,2})$/);

  if (!match) {
    return null;
  }

  return {
    fieldName: "file",
    originalFilename: cleanString(body.originalFilename, 180),
    mimeType: cleanString(match[1], 120).toLowerCase(),
    buffer: Buffer.from(match[2], "base64")
  };
}

async function getRequestBody(req) {
  const contentType = String(req.headers["content-type"] || "").toLowerCase();

  if (contentType.includes("multipart/form-data")) {
    return await parseMultipartForm(req);
  }

  if (req.body && typeof req.body === "object" && !Buffer.isBuffer(req.body)) {
    return {
      fields: req.body,
      file: parseDataUrlFile(req.body)
    };
  }

  if (typeof req.body === "string") {
    try {
      const parsed = JSON.parse(req.body);
      return {
        fields: parsed,
        file: parseDataUrlFile(parsed)
      };
    } catch (error) {
      return {
        fields: Object.fromEntries(new URLSearchParams(req.body)),
        file: null
      };
    }
  }

  const rawBody = await readRequestBuffer(req, 1024 * 1024).catch(function () {
    return Buffer.alloc(0);
  });

  if (!rawBody.length) {
    return {
      fields: {},
      file: null
    };
  }

  const rawText = rawBody.toString("utf8");

  try {
    const parsed = JSON.parse(rawText);
    return {
      fields: parsed,
      file: parseDataUrlFile(parsed)
    };
  } catch (error) {
    return {
      fields: Object.fromEntries(new URLSearchParams(rawText)),
      file: null
    };
  }
}

function sanitizeOriginalFilename(value) {
  const normalized = String(value || "material")
    .replace(/\\/g, "/")
    .split("/")
    .pop();

  return cleanString(normalized.replace(/[^\w .()\-]/g, "").trim() || "material", 180);
}

function getFileExtension(filename) {
  const extension = path.extname(filename || "").replace(".", "").toLowerCase();

  return FILE_TYPES[extension] ? extension : "";
}

function bufferStartsWith(buffer, bytes) {
  if (!buffer || buffer.length < bytes.length) {
    return false;
  }

  return bytes.every(function (byte, index) {
    return buffer[index] === byte;
  });
}

function isZipBuffer(buffer) {
  return bufferStartsWith(buffer, [0x50, 0x4b, 0x03, 0x04]) ||
    bufferStartsWith(buffer, [0x50, 0x4b, 0x05, 0x06]) ||
    bufferStartsWith(buffer, [0x50, 0x4b, 0x07, 0x08]);
}

function validateOoxmlBuffer(buffer, extension) {
  const bodyText = buffer.toString("latin1");
  const expectedFolder = {
    docx: "word/",
    pptx: "ppt/",
    xlsx: "xl/"
  }[extension];

  return bodyText.includes("[Content_Types].xml") && bodyText.includes(expectedFolder);
}

function validateTxtBuffer(buffer) {
  return !buffer.includes(0) && buffer.length <= MAX_UPLOAD_BYTES;
}

function validateFileMagic(buffer, extension) {
  if (bufferStartsWith(buffer, [0x4d, 0x5a])) {
    return false;
  }

  if (extension === "pdf") {
    return buffer.slice(0, 5).toString("utf8") === "%PDF-";
  }

  if (extension === "png") {
    return bufferStartsWith(buffer, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  }

  if (extension === "jpg" || extension === "jpeg") {
    return bufferStartsWith(buffer, [0xff, 0xd8, 0xff]);
  }

  if (extension === "docx" || extension === "pptx" || extension === "xlsx") {
    return isZipBuffer(buffer) && validateOoxmlBuffer(buffer, extension);
  }

  if (extension === "txt") {
    return validateTxtBuffer(buffer);
  }

  return false;
}

function validateMaterialFile(file) {
  if (!file || !file.buffer || !file.buffer.length) {
    const error = new Error("Choose a file to upload.");
    error.statusCode = 400;
    throw error;
  }

  if (file.buffer.length > MAX_UPLOAD_BYTES) {
    throw createRequestTooLargeError();
  }

  const originalFilename = sanitizeOriginalFilename(file.originalFilename);
  const extension = getFileExtension(originalFilename);
  const fileConfig = FILE_TYPES[extension];

  if (!extension || !fileConfig) {
    const error = new Error("Upload a supported PDF, DOCX, PPTX, XLSX, TXT, PNG, JPG, or JPEG file.");
    error.statusCode = 400;
    throw error;
  }

  const mimeType = cleanString(file.mimeType, 120).toLowerCase();

  if (
    mimeType &&
    mimeType !== "application/octet-stream" &&
    !fileConfig.mimeTypes.has(mimeType)
  ) {
    const error = new Error("This file type does not match the selected file extension.");
    error.statusCode = 400;
    throw error;
  }

  if (!validateFileMagic(file.buffer, extension)) {
    const error = new Error("This file could not be verified as a supported academic document.");
    error.statusCode = 400;
    throw error;
  }

  return {
    buffer: file.buffer,
    originalFilename,
    extension,
    fileType: mimeType || Array.from(fileConfig.mimeTypes)[0],
    fileTypeLabel: fileConfig.label,
    fileSize: file.buffer.length
  };
}

async function uploadBufferToCloudinary(file, assetId) {
  configureCloudinary();

  return await new Promise(function (resolve, reject) {
    const uploadStream = cloudinary.uploader.upload_stream({
      folder: CLOUDINARY_MATERIAL_FOLDER,
      public_id: assetId + "." + file.extension,
      resource_type: "raw",
      type: "authenticated",
      access_mode: "authenticated",
      overwrite: false,
      unique_filename: false,
      use_filename: false
    }, function (error, result) {
      if (error) {
        reject(error);
        return;
      }

      resolve(result || {});
    });

    uploadStream.end(file.buffer);
  });
}

async function destroyCloudinaryMaterial(materialData) {
  configureCloudinary();

  const publicId = materialData.cloudinaryPublicId || "";
  const resourceType = materialData.cloudinaryResourceType || "raw";
  const deliveryType = materialData.cloudinaryDeliveryType || materialData.cloudinaryType || "authenticated";

  if (!publicId) {
    const error = new Error("Material storage metadata is missing.");
    error.statusCode = 500;
    throw error;
  }

  const result = await cloudinary.uploader.destroy(publicId, {
    resource_type: resourceType,
    type: deliveryType,
    invalidate: true
  });

  if (result && result.result && result.result !== "ok" && result.result !== "not found") {
    const error = new Error("Could not remove the stored file.");
    error.statusCode = 502;
    throw error;
  }
}

function getDownloadFilename(materialData) {
  const extension = cleanString(materialData.fileExtension || materialData.cloudinaryFormat || "", 16).toLowerCase();
  const baseName = cleanString(materialData.title || materialData.originalFilename || "auc-atlas-material", 120)
    .replace(/[^\w .()\-]/g, "")
    .trim()
    .replace(/\s+/g, "-") || "auc-atlas-material";

  return extension && !baseName.toLowerCase().endsWith("." + extension)
    ? baseName + "." + extension
    : baseName;
}

function getSignedDownloadUrl(materialData) {
  configureCloudinary();

  const options = {
    resource_type: materialData.cloudinaryResourceType || "raw",
    type: materialData.cloudinaryDeliveryType || materialData.cloudinaryType || "authenticated",
    secure: true,
    sign_url: true,
    expires_at: Math.floor(Date.now() / 1000) + SIGNED_DOWNLOAD_SECONDS,
    attachment: getDownloadFilename(materialData)
  };

  if (materialData.cloudinaryVersion) {
    options.version = materialData.cloudinaryVersion;
  }

  return cloudinary.url(materialData.cloudinaryPublicId, options);
}

async function getUploaderProfile(decodedUser) {
  const db = admin.firestore();
  const userRecord = await admin.auth().getUser(decodedUser.uid);
  const userDoc = await db.collection("users").doc(decodedUser.uid).get();
  const userData = userDoc.exists ? userDoc.data() || {} : {};
  const email = userRecord.email || userData.email || decodedUser.email || "";
  const displayName = userData.fullName || userRecord.displayName || decodedUser.name || "";

  return {
    uploaderEmail: cleanString(email, 180),
    uploaderDisplayLabel: cleanString(displayName || "Anonymous AUC student", 120)
  };
}

async function handleListMaterials(req, res, decodedUser) {
  const course = getCourseByCodeForListing((req.query || {}).courseCode || "");

  if (!course) {
    return res.status(400).json({ error: "Choose a valid course." });
  }

  const snapshot = await admin.firestore()
    .collection(MATERIALS_COLLECTION)
    .where("courseCode", "==", course.code)
    .limit(MAX_PUBLIC_MATERIALS)
    .get();

  const materials = snapshot.docs
    .map(function (doc) {
      return serializeMaterial(doc, { viewerUid: decodedUser.uid });
    })
    .filter(function (material) {
      return material.status === "available";
    })
    .sort(function (a, b) {
      return getMaterialTime(b) - getMaterialTime(a);
    });

  return res.status(200).json({
    success: true,
    materials
  });
}

async function handleAdminMaterials(req, res, decodedUser) {
  const adminUser = await requireAdmin(decodedUser);
  const snapshot = await admin.firestore()
    .collection(MATERIALS_COLLECTION)
    .limit(MAX_ADMIN_MATERIALS)
    .get();

  const materials = snapshot.docs
    .map(function (doc) {
      return serializeMaterial(doc, {
        viewerUid: decodedUser.uid,
        isAdmin: true
      });
    })
    .filter(function (material) {
      return material.status !== "deleted";
    })
    .sort(function (a, b) {
      return getMaterialTime(b) - getMaterialTime(a);
    });

  return res.status(200).json({
    success: true,
    admin: adminUser.email,
    materials
  });
}

async function handleCreateMaterial(req, res) {
  const parsedBody = await getRequestBody(req);
  const body = parsedBody.fields || {};
  const file = validateMaterialFile(parsedBody.file);
  const professorId = cleanProfessorId(body.professorId);
  const course = getRecordedCourseForProfessor(professorId, cleanCourseCode(body.courseCode));
  const semester = getSemesterOption(body.semester);
  const materialType = cleanMaterialType(body.materialType || body.type);
  const title = cleanString(body.title, 140);
  const description = cleanString(body.description, 500);
  const confirmedRights = String(body.confirmRights || "").toLowerCase() === "true" || body.confirmRights === "on";

  if (!course || !professorId || !semester || !materialType || !title || !confirmedRights) {
    return res.status(400).json({ error: "Choose a recorded professor, standard semester, material type, title, file, and sharing confirmation." });
  }

  const decodedUser = await getSignedInUser(req);

  await consumeRateLimit({
    bucket: "course-material-upload",
    keyParts: [decodedUser.uid, course.code, professorId, semester.value, getClientIp(req)],
    firstLimit: 6,
    secondLimit: 12,
    firstLockMs: THIRTY_MINUTES_MS,
    secondLockMs: ONE_HOUR_MS,
    errorMessage: "Too many material uploads."
  });

  const db = admin.firestore();
  const materialRef = db.collection(MATERIALS_COLLECTION).doc();
  const materialId = materialRef.id;
  const cloudinaryAssetId = materialId + "_" + crypto.randomBytes(8).toString("hex");
  let uploadResult = null;

  try {
    uploadResult = await uploadBufferToCloudinary(file, cloudinaryAssetId);
    const uploader = await getUploaderProfile(decodedUser);

    await materialRef.set({
      materialId,
      courseCode: course.code,
      courseKey: normalizeCourseKey(course.code),
      courseTitle: course.title,
      professorId,
      professorName: cleanString(body.professorName, 120),
      semester: semester.value,
      semesterLabel: semester.label,
      materialType: materialType.value,
      materialTypeLabel: materialType.label,
      type: materialType.label,
      title,
      description,
      cloudinaryPublicId: uploadResult.public_id || "",
      cloudinaryResourceType: uploadResult.resource_type || "raw",
      cloudinaryDeliveryType: uploadResult.type || "authenticated",
      cloudinaryType: uploadResult.type || "authenticated",
      cloudinaryFormat: uploadResult.format || file.extension,
      cloudinaryVersion: uploadResult.version || null,
      originalFilename: file.originalFilename,
      fileType: file.fileType,
      fileExtension: file.extension,
      fileSize: file.fileSize,
      uploaderUid: decodedUser.uid,
      uploaderEmail: uploader.uploaderEmail,
      uploaderDisplayLabel: uploader.uploaderDisplayLabel || "Anonymous AUC student",
      status: "available",
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    const savedMaterial = await materialRef.get();

    return res.status(200).json({
      success: true,
      material: serializeMaterial(savedMaterial, { viewerUid: decodedUser.uid })
    });
  } catch (error) {
    if (uploadResult && uploadResult.public_id) {
      await destroyCloudinaryMaterial({
        cloudinaryPublicId: uploadResult.public_id,
        cloudinaryResourceType: uploadResult.resource_type || "raw",
        cloudinaryDeliveryType: uploadResult.type || "authenticated"
      }).catch(function () {});
    }

    throw error;
  }
}

async function handleDownloadMaterial(req, res) {
  const parsedBody = await getRequestBody(req);
  const body = parsedBody.fields || {};
  const materialId = cleanMaterialId(body.materialId);
  const decodedUser = await getSignedInUser(req);

  if (!materialId) {
    return res.status(400).json({ error: "Missing material id." });
  }

  const materialDoc = await admin.firestore().collection(MATERIALS_COLLECTION).doc(materialId).get();

  if (!materialDoc.exists) {
    return res.status(404).json({ error: "Material not found." });
  }

  const materialData = materialDoc.data() || {};

  if ((materialData.status || "available") !== "available") {
    return res.status(404).json({ error: "Material is not available." });
  }

  return res.status(200).json({
    success: true,
    materialId,
    expiresInSeconds: SIGNED_DOWNLOAD_SECONDS,
    downloadUrl: getSignedDownloadUrl(materialData),
    user: decodedUser.uid
  });
}

async function handleDeleteMaterial(req, res) {
  const parsedBody = await getRequestBody(req);
  const body = parsedBody.fields || {};
  const materialId = cleanMaterialId(body.materialId);
  const decodedUser = await getSignedInUser(req);

  if (!materialId) {
    return res.status(400).json({ error: "Missing material id." });
  }

  const db = admin.firestore();
  const materialRef = db.collection(MATERIALS_COLLECTION).doc(materialId);
  const materialDoc = await materialRef.get();

  if (!materialDoc.exists) {
    return res.status(404).json({ error: "Material not found." });
  }

  const materialData = materialDoc.data() || {};
  const isOwner = materialData.uploaderUid === decodedUser.uid;
  let adminUser = null;

  if (!isOwner) {
    adminUser = await requireAdmin(decodedUser);
  }

  if ((materialData.status || "available") !== "available") {
    return res.status(404).json({ error: "Material is not available." });
  }

  await materialRef.set({
    status: "deleting",
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    deletingByUid: decodedUser.uid
  }, { merge: true });

  try {
    await destroyCloudinaryMaterial(materialData);

    const batch = db.batch();

    if (adminUser) {
      batch.set(db.collection("adminMaterialDeletions").doc(materialId), {
        materialId,
        title: materialData.title || "",
        courseCode: materialData.courseCode || "",
        courseTitle: materialData.courseTitle || "",
        professorId: materialData.professorId || "",
        professorName: materialData.professorName || "",
        semester: materialData.semester || "",
        semesterLabel: materialData.semesterLabel || "",
        materialType: materialData.materialType || "",
        materialTypeLabel: materialData.materialTypeLabel || "",
        originalFilename: materialData.originalFilename || "",
        fileType: materialData.fileType || "",
        fileExtension: materialData.fileExtension || "",
        fileSize: Number(materialData.fileSize || 0),
        uploaderUid: materialData.uploaderUid || "",
        uploaderEmail: materialData.uploaderEmail || "",
        cloudinaryPublicId: materialData.cloudinaryPublicId || "",
        cloudinaryResourceType: materialData.cloudinaryResourceType || "",
        cloudinaryDeliveryType: materialData.cloudinaryDeliveryType || "",
        deletedByUid: adminUser.uid,
        deletedByEmail: adminUser.email,
        deletedAt: admin.firestore.FieldValue.serverTimestamp()
      });
    }

    batch.delete(materialRef);
    await batch.commit();

    return res.status(200).json({
      success: true,
      materialId
    });
  } catch (error) {
    await materialRef.set({
      status: "available",
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      deletingByUid: admin.firestore.FieldValue.delete()
    }, { merge: true }).catch(function () {});

    throw error;
  }
}

module.exports = async function handler(req, res) {
  try {
    res.setHeader("Cache-Control", "no-store");

    if (req.method === "GET") {
      const decodedUser = await getSignedInUser(req);
      const scope = cleanString((req.query || {}).scope || "", 40);
      const adminMode = scope === "admin" || String((req.query || {}).admin || "") === "1";

      if (adminMode) {
        return await handleAdminMaterials(req, res, decodedUser);
      }

      return await handleListMaterials(req, res, decodedUser);
    }

    if (req.method === "POST") {
      const contentType = String(req.headers["content-type"] || "").toLowerCase();

      if (contentType.includes("multipart/form-data")) {
        return await handleCreateMaterial(req, res);
      }

      const parsedBody = await getRequestBody(req);
      const action = cleanString((parsedBody.fields || {}).action || "create", 40);

      req.body = parsedBody.fields || {};

      if (action === "download") {
        return await handleDownloadMaterial(req, res);
      }

      if (action === "delete") {
        return await handleDeleteMaterial(req, res);
      }

      return await handleCreateMaterial(req, res);
    }

    return res.status(405).json({ error: "Method not allowed" });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      error: error.message || "Could not process material request."
    });
  }
};
