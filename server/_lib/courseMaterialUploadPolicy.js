function getPositiveInteger(value, fallbackValue, maximumValue) {
  const parsedValue = Number(value);

  if (!Number.isSafeInteger(parsedValue) || parsedValue <= 0) {
    return fallbackValue;
  }

  return maximumValue
    ? Math.min(parsedValue, maximumValue)
    : parsedValue;
}

const MATERIAL_MAX_FILE_BYTES = getPositiveInteger(
  process.env.COURSE_MATERIAL_MAX_FILE_BYTES,
  25 * 1024 * 1024,
  100 * 1024 * 1024
);
const MATERIAL_USER_QUOTA_BYTES = getPositiveInteger(
  process.env.COURSE_MATERIAL_USER_QUOTA_BYTES,
  250 * 1024 * 1024,
  5 * 1024 * 1024 * 1024
);
const MATERIAL_UPLOAD_AUTH_TTL_SECONDS = getPositiveInteger(
  process.env.COURSE_MATERIAL_UPLOAD_AUTH_TTL_SECONDS,
  15 * 60,
  30 * 60
);

const MATERIAL_ALLOWED_MIME_TYPES = Object.freeze([
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "image/jpeg",
  "image/png"
]);

const MATERIAL_MIME_TYPES_BY_EXTENSION = Object.freeze({
  pdf: ["application/pdf"],
  doc: ["application/msword"],
  docx: [
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  ],
  ppt: ["application/vnd.ms-powerpoint"],
  pptx: [
    "application/vnd.openxmlformats-officedocument.presentationml.presentation"
  ],
  xls: ["application/vnd.ms-excel"],
  xlsx: [
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
  ],
  jpg: ["image/jpeg"],
  jpeg: ["image/jpeg"],
  png: ["image/png"]
});

function cleanMaterialFileName(value) {
  const fileName = String(value || "")
    .split(/[\\/]/)
    .pop()
    .replace(/\s*\|\s*/g, " ")
    .replace(/[\u0000-\u001f\u007f]/g, "")
    .trim()
    .slice(0, 240);

  return fileName;
}

function getMaterialFileExtension(fileName) {
  const safeFileName = cleanMaterialFileName(fileName);
  const match = safeFileName.match(/\.([A-Za-z0-9]+)$/);

  return match ? match[1].toLowerCase() : "";
}

function normalizeMaterialMimeType(value) {
  return String(value || "")
    .split(";")[0]
    .trim()
    .toLowerCase()
    .slice(0, 160);
}

function isAllowedMaterialFileName(fileName) {
  return Boolean(
    MATERIAL_MIME_TYPES_BY_EXTENSION[
      getMaterialFileExtension(fileName)
    ]
  );
}

function isAllowedMaterialMimeType(mimeType) {
  return MATERIAL_ALLOWED_MIME_TYPES.includes(
    normalizeMaterialMimeType(mimeType)
  );
}

function doesMaterialMimeMatchFileName(fileName, mimeType) {
  const allowedMimeTypes = MATERIAL_MIME_TYPES_BY_EXTENSION[
    getMaterialFileExtension(fileName)
  ];

  return Boolean(
    allowedMimeTypes &&
    allowedMimeTypes.includes(
      normalizeMaterialMimeType(mimeType)
    )
  );
}

function buildImageKitUploadChecks(fileSize) {
  const safeFileSize = Number(fileSize);

  if (
    !Number.isSafeInteger(safeFileSize) ||
    safeFileSize <= 0 ||
    safeFileSize > MATERIAL_MAX_FILE_BYTES
  ) {
    return "";
  }

  const allowedMimeTypes = MATERIAL_ALLOWED_MIME_TYPES
    .map(function (mimeType) {
      return JSON.stringify(mimeType);
    })
    .join(", ");

  return (
    '"file.size" = ' +
    safeFileSize +
    ' AND "file.size" <= ' +
    MATERIAL_MAX_FILE_BYTES +
    ' AND "file.mime" IN [' +
    allowedMimeTypes +
    "]"
  );
}

module.exports = {
  MATERIAL_MAX_FILE_BYTES,
  MATERIAL_USER_QUOTA_BYTES,
  MATERIAL_UPLOAD_AUTH_TTL_SECONDS,
  MATERIAL_ALLOWED_MIME_TYPES,
  cleanMaterialFileName,
  getMaterialFileExtension,
  normalizeMaterialMimeType,
  isAllowedMaterialFileName,
  isAllowedMaterialMimeType,
  doesMaterialMimeMatchFileName,
  buildImageKitUploadChecks
};
