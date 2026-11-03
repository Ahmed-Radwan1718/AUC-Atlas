import "server-only";

import { createHash } from "node:crypto";
import { ApiError, cleanString } from "@/lib/server/backend-utils";

const CLOUDINARY_MATERIAL_PUBLIC_ID_PATTERN =
  /^auc-atlas\/materials\/[a-f0-9]{36}\.(?:pdf|docx?|pptx?|xlsx?|jpe?g|png)$/i;
const CLOUDINARY_ASSET_ID_PATTERN = /^[A-Za-z0-9_-]{16,160}$/;

type CloudinaryConfig = {
  cloudName: string;
  apiKey: string;
  apiSecret: string;
};

function getCloudinaryConfig(): CloudinaryConfig {
  let cloudName = cleanString(
    process.env.CLOUDINARY_CLOUD_NAME || process.env.CLOUDINARY_NAME,
    160,
  );
  let apiKey = cleanString(process.env.CLOUDINARY_API_KEY, 160);
  let apiSecret = cleanString(process.env.CLOUDINARY_API_SECRET, 500);

  if ((!cloudName || !apiKey || !apiSecret) && process.env.CLOUDINARY_URL) {
    try {
      const cloudinaryUrl = new URL(process.env.CLOUDINARY_URL);
      if (cloudinaryUrl.protocol === "cloudinary:") {
        cloudName ||= cloudinaryUrl.hostname;
        apiKey ||= decodeURIComponent(cloudinaryUrl.username || "");
        apiSecret ||= decodeURIComponent(cloudinaryUrl.password || "");
      }
    } catch {
      // Fall through to the configuration error below.
    }
  }

  if (!cloudName || !apiKey || !apiSecret) {
    throw new ApiError("Cloudinary course-material storage is not configured.", 500);
  }

  return { cloudName, apiKey, apiSecret };
}

function signCloudinaryParams(
  params: Record<string, string>,
  apiSecret: string,
): string {
  const signatureBase = Object.keys(params)
    .filter((key) => params[key] !== undefined && params[key] !== null && params[key] !== "")
    .sort()
    .map((key) => `${key}=${params[key]}`)
    .join("&");

  return createHash("sha1")
    .update(signatureBase + apiSecret)
    .digest("hex");
}

export function isCloudinaryMaterialPublicId(value: unknown): boolean {
  return CLOUDINARY_MATERIAL_PUBLIC_ID_PATTERN.test(cleanString(value, 80));
}

export async function getCloudinaryMaterial(publicId: string) {
  const safePublicId = cleanString(publicId, 80);

  if (!isCloudinaryMaterialPublicId(safePublicId)) {
    throw new ApiError("Course material file not found.", 404);
  }

  const config = getCloudinaryConfig();
  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${encodeURIComponent(config.cloudName)}/resources/raw/authenticated/${encodeURIComponent(safePublicId)}`,
    {
      headers: {
        Accept: "application/json",
        Authorization: `Basic ${Buffer.from(`${config.apiKey}:${config.apiSecret}`).toString("base64")}`,
      },
      cache: "no-store",
    },
  );

  if (response.status === 404) {
    throw new ApiError("Course material file not found.", 404);
  }

  if (!response.ok) {
    throw new ApiError("Could not verify the Cloudinary course material.", 502);
  }

  const file = (await response.json().catch(() => ({}))) as Record<string, unknown>;
  const assetId = cleanString(file.asset_id, 160);
  const returnedPublicId = cleanString(file.public_id, 80);
  const fallbackFormat = returnedPublicId.split(".").pop() || "";
  const format = cleanString(file.format, 20).toLowerCase() || fallbackFormat.toLowerCase();

  if (
    returnedPublicId !== safePublicId ||
    file.resource_type !== "raw" ||
    file.type !== "authenticated" ||
    !CLOUDINARY_ASSET_ID_PATTERN.test(assetId)
  ) {
    throw new ApiError("Course material file not found.", 404);
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

export function buildCloudinaryAssetDownloadUrl(
  assetId: string,
  dispositionType: "inline" | "attachment",
): string {
  const safeAssetId = cleanString(assetId, 160);

  if (!CLOUDINARY_ASSET_ID_PATTERN.test(safeAssetId)) {
    throw new ApiError("Course material file not found.", 404);
  }

  const config = getCloudinaryConfig();
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
    signature: signCloudinaryParams(signedParams, config.apiSecret),
  });

  return `https://api.cloudinary.com/v1_1/${encodeURIComponent(config.cloudName)}/asset/download?${query.toString()}`;
}
