import { NextResponse } from "next/server";
import {
  buildCloudinaryAssetDownloadUrl,
  getCloudinaryMaterial,
  isCloudinaryMaterialPublicId,
} from "@/lib/server/cloudinary-materials";
import {
  ApiError,
  cleanString,
  getErrorMessage,
  getErrorStatus,
} from "@/lib/server/backend-utils";
import { getAdminAuth, getAdminFirestore } from "@/lib/server/firebase-admin";
import { consumeSecurityRateLimit } from "@/lib/server/rate-limit";
import { getSiteSessionUser } from "@/lib/server/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MATERIAL_DOWNLOAD_WINDOW_MS = 60 * 60 * 1000;
const MATERIAL_DOWNLOAD_MAX_REQUESTS = 60;

function encodeDownloadFileName(fileName: string): string {
  return encodeURIComponent(fileName).replace(/['()*]/g, (character) =>
    `%${character.charCodeAt(0).toString(16).toUpperCase()}`,
  );
}

export async function GET(request: Request) {
  try {
    const decodedUser = await getSiteSessionUser(request, { checkRevoked: true });
    const userRecord = await getAdminAuth().getUser(decodedUser.uid);
    const email = String(userRecord.email || decodedUser.email || "").trim().toLowerCase();

    if (!userRecord.emailVerified || !email.endsWith("@aucegypt.edu")) {
      throw new ApiError(
        "Please verify your AUC email address before downloading materials.",
        403,
      );
    }

    await consumeSecurityRateLimit({
      scope: "course-material-download-user",
      identifier: decodedUser.uid,
      maxAttempts: MATERIAL_DOWNLOAD_MAX_REQUESTS,
      windowMs: MATERIAL_DOWNLOAD_WINDOW_MS,
      message: "Too many course-material downloads. Please try again later.",
    });

    const query = new URL(request.url).searchParams;
    const materialId = cleanString(query.get("id"), 160);
    if (!/^[A-Za-z0-9_-]{6,160}$/.test(materialId)) {
      throw new ApiError("Course material file not found.", 404);
    }

    const materialDoc = await getAdminFirestore()
      .collection("courseMaterials")
      .doc(materialId)
      .get();
    if (!materialDoc.exists) {
      throw new ApiError("Course material file not found.", 404);
    }

    const material = materialDoc.data() || {};
    const status = cleanString(material.status, 40).toLowerCase();
    const canDownload = !status || status === "approved" || status === "pending";
    const storageKey = cleanString(material.storageKey, 80);
    const fileId = cleanString(material.fileId, 160);
    const dispositionType =
      cleanString(query.get("disposition"), 20).toLowerCase() === "inline"
        ? "inline"
        : "attachment";

    if (
      !canDownload ||
      material.storageProvider !== "cloudinary" ||
      !isCloudinaryMaterialPublicId(storageKey) ||
      !/^[A-Za-z0-9_-]{16,160}$/.test(fileId)
    ) {
      throw new ApiError("Course material file not found.", 404);
    }

    const cloudinaryFile = await getCloudinaryMaterial(storageKey);
    if (cloudinaryFile.assetId !== fileId) {
      throw new ApiError("Course material file not found.", 404);
    }

    const downloadFileName = cleanString(material.fileName || "course-material", 240).replace(
      /[\r\n]/g,
      " ",
    );
    const signedUrl = buildCloudinaryAssetDownloadUrl(
      cloudinaryFile.assetId,
      dispositionType,
    );
    const rangeHeader = String(request.headers.get("range") || "").trim();
    const upstreamHeaders: Record<string, string> = {};
    if (/^bytes=\d*-\d*$/i.test(rangeHeader)) upstreamHeaders.Range = rangeHeader;

    const fileResponse = await fetch(signedUrl, {
      method: "GET",
      headers: upstreamHeaders,
      cache: "no-store",
    });

    if (![200, 206].includes(fileResponse.status) || !fileResponse.body) {
      throw new ApiError("Could not load this course material.", 502);
    }

    const safeAsciiFileName = downloadFileName
      .replace(/[^\x20-\x7E]/g, "_")
      .replace(/["\\]/g, "_");
    const responseHeaders = new Headers({
      "Cache-Control": "private, no-store",
      "Content-Type":
        fileResponse.headers.get("content-type") || "application/octet-stream",
      "Content-Disposition": `${dispositionType}; filename="${safeAsciiFileName}"; filename*=UTF-8''${encodeDownloadFileName(downloadFileName)}`,
    });

    const contentLength = fileResponse.headers.get("content-length");
    const contentRange = fileResponse.headers.get("content-range");
    const acceptRanges = fileResponse.headers.get("accept-ranges");
    if (contentLength && /^\d+$/.test(contentLength)) {
      responseHeaders.set("Content-Length", contentLength);
    }
    if (contentRange) responseHeaders.set("Content-Range", contentRange);
    if (acceptRanges) responseHeaders.set("Accept-Ranges", acceptRanges);

    return new Response(fileResponse.body, {
      status: fileResponse.status,
      headers: responseHeaders,
    });
  } catch (error) {
    return NextResponse.json(
      { error: getErrorMessage(error, "Could not download this course material.") },
      { status: getErrorStatus(error), headers: { "Cache-Control": "no-store" } },
    );
  }
}
