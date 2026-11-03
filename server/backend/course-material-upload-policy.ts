import "server-only";

function getPositiveInteger(value: unknown, fallbackValue: number, maximumValue?: number): number {
  const parsedValue = Number(value);
  if (!Number.isSafeInteger(parsedValue) || parsedValue <= 0) return fallbackValue;
  return maximumValue ? Math.min(parsedValue, maximumValue) : parsedValue;
}

export const MATERIAL_MAX_FILE_BYTES = getPositiveInteger(
  process.env.COURSE_MATERIAL_MAX_FILE_BYTES,
  25 * 1024 * 1024,
  100 * 1024 * 1024,
);
export const MATERIAL_USER_QUOTA_BYTES = getPositiveInteger(
  process.env.COURSE_MATERIAL_USER_QUOTA_BYTES,
  250 * 1024 * 1024,
  5 * 1024 * 1024 * 1024,
);
export const MATERIAL_UPLOAD_AUTH_TTL_SECONDS = getPositiveInteger(
  process.env.COURSE_MATERIAL_UPLOAD_AUTH_TTL_SECONDS,
  15 * 60,
  30 * 60,
);

export const MATERIAL_ALLOWED_MIME_TYPES = Object.freeze([
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "image/jpeg",
  "image/png",
]);

const MIME_TYPES_BY_EXTENSION: Readonly<Record<string, readonly string[]>> = Object.freeze({
  pdf: ["application/pdf"],
  doc: ["application/msword"],
  docx: ["application/vnd.openxmlformats-officedocument.wordprocessingml.document"],
  ppt: ["application/vnd.ms-powerpoint"],
  pptx: ["application/vnd.openxmlformats-officedocument.presentationml.presentation"],
  xls: ["application/vnd.ms-excel"],
  xlsx: ["application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"],
  jpg: ["image/jpeg"],
  jpeg: ["image/jpeg"],
  png: ["image/png"],
});

export function cleanMaterialFileName(value: unknown): string {
  return String(value || "")
    .split(/[\\/]/)
    .pop()!
    .replace(/\s*\|\s*/g, " ")
    .replace(/[\u0000-\u001f\u007f]/g, "")
    .trim()
    .slice(0, 240);
}

export function getMaterialFileExtension(fileName: unknown): string {
  const match = cleanMaterialFileName(fileName).match(/\.([A-Za-z0-9]+)$/);
  return match ? match[1].toLowerCase() : "";
}

export function normalizeMaterialMimeType(value: unknown): string {
  return String(value || "").split(";")[0].trim().toLowerCase().slice(0, 160);
}

export function isAllowedMaterialFileName(fileName: unknown): boolean {
  return Boolean(MIME_TYPES_BY_EXTENSION[getMaterialFileExtension(fileName)]);
}

export function isAllowedMaterialMimeType(mimeType: unknown): boolean {
  return MATERIAL_ALLOWED_MIME_TYPES.includes(normalizeMaterialMimeType(mimeType));
}

export function doesMaterialMimeMatchFileName(fileName: unknown, mimeType: unknown): boolean {
  const allowedMimeTypes = MIME_TYPES_BY_EXTENSION[getMaterialFileExtension(fileName)];
  return Boolean(allowedMimeTypes?.includes(normalizeMaterialMimeType(mimeType)));
}
