import "server-only";

import { createHash } from "node:crypto";
import { getMaterialFileExtension } from "@/server/backend/course-material-upload-policy";
import type { BackendError } from "@/server/backend/types";

const PUBLIC_ID_PATTERN = /^auc-atlas\/materials\/[a-f0-9]{36}\.(?:pdf|docx?|pptx?|xlsx?|jpe?g|png)$/i;
const ASSET_ID_PATTERN = /^[A-Za-z0-9_-]{16,160}$/;

function cleanString(value: unknown, maxLength: number): string {
  return String(value || "").trim().slice(0, maxLength);
}
function createError(message: string, statusCode: number): BackendError {
  const error = new Error(message) as BackendError;
  error.statusCode = statusCode;
  return error;
}
function getConfig() {
  let cloudName = cleanString(process.env.CLOUDINARY_CLOUD_NAME || process.env.CLOUDINARY_NAME, 160);
  let apiKey = cleanString(process.env.CLOUDINARY_API_KEY, 160);
  let apiSecret = cleanString(process.env.CLOUDINARY_API_SECRET, 500);
  if ((!cloudName || !apiKey || !apiSecret) && process.env.CLOUDINARY_URL) {
    try {
      const url = new URL(process.env.CLOUDINARY_URL);
      if (url.protocol === "cloudinary:") {
        cloudName ||= url.hostname;
        apiKey ||= decodeURIComponent(url.username || "");
        apiSecret ||= decodeURIComponent(url.password || "");
      }
    } catch {}
  }
  if (!cloudName || !apiKey || !apiSecret) {
    throw createError("Cloudinary course-material storage is not configured.", 500);
  }
  return { cloudName, apiKey, apiSecret };
}
function signParams(params: Record<string, string>, apiSecret: string): string {
  const base = Object.keys(params)
    .filter((key) => params[key] !== undefined && params[key] !== null && params[key] !== "")
    .sort()
    .map((key) => `${key}=${params[key]}`)
    .join("&");
  return createHash("sha1").update(base + apiSecret).digest("hex");
}
export function isCloudinaryMaterialPublicId(value: unknown): boolean {
  return PUBLIC_ID_PATTERN.test(cleanString(value, 80));
}
export function getCloudinaryMaterialPublicId(authorizationId: unknown, fileName: unknown): string {
  const safeAuthorizationId = cleanString(authorizationId, 80);
  const extension = getMaterialFileExtension(fileName);
  if (!/^[a-f0-9]{36}$/i.test(safeAuthorizationId) || !extension) {
    throw createError("Could not prepare the Cloudinary upload.", 400);
  }
  const publicId = `auc-atlas/materials/${safeAuthorizationId}.${extension}`;
  if (!isCloudinaryMaterialPublicId(publicId)) {
    throw createError("Could not prepare the Cloudinary upload.", 400);
  }
  return publicId;
}
export function createCloudinaryUploadAuthorization(authorizationId: unknown, fileName: unknown) {
  const config = getConfig();
  const publicId = getCloudinaryMaterialPublicId(authorizationId, fileName);
  const timestamp = String(Math.floor(Date.now() / 1000));
  const uploadParameters = {
    overwrite: "false",
    public_id: publicId,
    timestamp,
    unique_filename: "false",
  };
  return {
    uploadUrl: `https://api.cloudinary.com/v1_1/${encodeURIComponent(config.cloudName)}/raw/authenticated`,
    apiKey: config.apiKey,
    signature: signParams(uploadParameters, config.apiSecret),
    timestamp,
    publicId,
    uploadParameters,
  };
}
export async function getCloudinaryMaterial(publicId: unknown) {
  const safePublicId = cleanString(publicId, 80);
  if (!isCloudinaryMaterialPublicId(safePublicId)) {
    throw createError("Course material file not found.", 404);
  }
  const config = getConfig();
  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${encodeURIComponent(config.cloudName)}/resources/raw/authenticated/${encodeURIComponent(safePublicId)}`,
    {
      headers: {
        Accept: "application/json",
        Authorization: `Basic ${Buffer.from(`${config.apiKey}:${config.apiSecret}`).toString("base64")}`,
      },
    },
  );
  if (response.status === 404) throw createError("Course material file not found.", 404);
  if (!response.ok) throw createError("Could not verify the Cloudinary course material.", 502);
  const file = (await response.json().catch(() => ({}))) as Record<string, unknown>;
  const assetId = cleanString(file.asset_id, 160);
  const returnedPublicId = cleanString(file.public_id, 80);
  const format = cleanString(file.format, 20).toLowerCase() || getMaterialFileExtension(returnedPublicId);
  if (
    returnedPublicId !== safePublicId ||
    file.resource_type !== "raw" ||
    file.type !== "authenticated" ||
    !ASSET_ID_PATTERN.test(assetId)
  ) {
    throw createError("Course material file not found.", 404);
  }
  return {
    assetId,
    publicId: returnedPublicId,
    resourceType: "raw" as const,
    deliveryType: "authenticated" as const,
    format,
    size: Math.max(0, Number(file.bytes) || 0),
    createdAt: cleanString(file.created_at, 80),
  };
}
export async function deleteCloudinaryMaterial(publicId: unknown): Promise<void> {
  const safePublicId = cleanString(publicId, 80);
  if (!isCloudinaryMaterialPublicId(safePublicId)) return;
  const config = getConfig();
  const timestamp = String(Math.floor(Date.now() / 1000));
  const signedParams = { invalidate: "true", public_id: safePublicId, timestamp };
  const body = new URLSearchParams({
    ...signedParams,
    api_key: config.apiKey,
    signature: signParams(signedParams, config.apiSecret),
  });
  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${encodeURIComponent(config.cloudName)}/raw/authenticated/destroy`,
    {
      method: "POST",
      headers: { Accept: "application/json", "Content-Type": "application/x-www-form-urlencoded" },
      body: body.toString(),
    },
  );
  if (!response.ok) throw createError("Could not delete the Cloudinary course material.", 502);
  const result = (await response.json().catch(() => ({}))) as { result?: unknown };
  if (result.result !== "ok" && result.result !== "not found") {
    throw createError("Could not delete the Cloudinary course material.", 502);
  }
}
export function buildCloudinaryAssetDownloadUrl(
  assetId: unknown,
  dispositionType: "inline" | "attachment",
): string {
  const safeAssetId = cleanString(assetId, 160);
  if (!ASSET_ID_PATTERN.test(safeAssetId)) throw createError("Course material file not found.", 404);
  const config = getConfig();
  const timestamp = Math.floor(Date.now() / 1000);
  const signedParams = {
    asset_id: safeAssetId,
    attachment: dispositionType === "attachment" ? "true" : "false",
    expires_at: String(timestamp + 5 * 60),
    timestamp: String(timestamp),
  };
  const query = new URLSearchParams({
    ...signedParams,
    api_key: config.apiKey,
    signature: signParams(signedParams, config.apiSecret),
  });
  return `https://api.cloudinary.com/v1_1/${encodeURIComponent(config.cloudName)}/asset/download?${query.toString()}`;
}
