import { createHash } from "node:crypto";
import type { NextApiHandler } from "next";
import { admin } from "@/server/backend/firebase";
import { getSiteSessionUser } from "@/server/backend/security";
import { consumeSecurityRateLimit } from "@/server/backend/security-rate-limits";
import { asBackendError, asRecord, type BackendError } from "@/server/backend/types";

const REPORT_WINDOW_MS = 60 * 60 * 1000;
const MAX_REPORTS = 10;

function cleanString(value: unknown, maxLength: number): string {
  return String(value || "").trim().replace(/\s+/g, " ").slice(0, maxLength);
}
function cleanReason(value: unknown): string {
  return String(value || "").trim().slice(0, 500);
}
function createError(message: string, statusCode: number): BackendError {
  const error = new Error(message) as BackendError;
  error.statusCode = statusCode;
  return error;
}
async function getVerifiedReporter(req: Parameters<typeof getSiteSessionUser>[0]) {
  const decodedUser = await getSiteSessionUser(req, { checkRevoked: true });
  const userRecord = await admin.auth().getUser(decodedUser.uid);
  const email = cleanString(userRecord.email || decodedUser.email, 240).toLowerCase();
  if (!userRecord.emailVerified || !email.endsWith("@aucegypt.edu")) {
    throw createError("Please verify your AUC email address before reporting content.", 403);
  }
  return { uid: decodedUser.uid, email };
}
async function getReportTarget(targetType: string, targetId: string) {
  const collectionName = targetType === "review" ? "professorReviews" : "courseMaterials";
  const targetDoc = await admin.firestore().collection(collectionName).doc(targetId).get();
  if (!targetDoc.exists) throw createError("The reported content no longer exists.", 404);
  const data = targetDoc.data() || {};
  if (targetType === "material" && cleanString(data.status, 40).toLowerCase() !== "approved") {
    throw createError("The reported content is not available.", 404);
  }
  if (targetType === "review") {
    const professorName = cleanString(data.professorName || "Professor review", 120);
    const courseCode = cleanString(data.courseCode || data.courseTaken, 60);
    return {
      ownerUid: cleanString(data.authorUid || data.authorUserId, 160),
      label: cleanString(`${professorName}${courseCode ? ` · ${courseCode}` : ""}`, 240),
      snapshot: {
        professorName,
        courseCode,
        semesterTaken: cleanString(data.semesterTaken, 60),
        rating: Number(data.rating || 0),
        studentNote: String(data.studentNote || "").slice(0, 360),
        authorUid: cleanString(data.authorUid || data.authorUserId, 160),
        authorName: cleanString(data.authorName || "AUC student", 80),
      },
    };
  }
  const title = cleanString(data.title || data.fileName || "Course material", 240);
  return {
    ownerUid: cleanString(data.uploaderUid, 160),
    label: title,
    snapshot: {
      title,
      fileName: cleanString(data.fileName, 240),
      courseCode: cleanString(data.courseCode, 60),
      professor: cleanString(data.professor, 120),
      semester: cleanString(data.semester, 60),
      materialType: cleanString(data.materialType || data.type || data.category || "Material", 80),
      uploaderUid: cleanString(data.uploaderUid, 160),
      uploaderDisplayName: cleanString(data.uploaderDisplayName || "AUC student", 80),
      fileId: cleanString(data.fileId, 160),
    },
  };
}

const handler: NextApiHandler = async (req, res) => {
  try {
    res.setHeader("Cache-Control", "no-store");
    if (req.method !== "POST") {
      res.setHeader("Allow", "POST");
      return res.status(405).json({ error: "Method not allowed" });
    }
    const reporter = await getVerifiedReporter(req);
    await consumeSecurityRateLimit({
      scope: "content-report-user",
      identifier: reporter.uid,
      maxAttempts: MAX_REPORTS,
      windowMs: REPORT_WINDOW_MS,
      message: "Too many content reports. Please try again later.",
    });
    const body = asRecord(req.body);
    const targetType = cleanString(body.targetType, 20).toLowerCase();
    const targetId = cleanString(body.targetId, 180);
    const reason = cleanReason(body.reason);
    if (!['review', 'material'].includes(targetType)) {
      throw createError("Choose valid content to report.", 400);
    }
    if (!/^[A-Za-z0-9_-]{6,180}$/.test(targetId)) {
      throw createError("The reported content could not be found.", 400);
    }
    if (reason.length < 3) {
      throw createError("Briefly explain why you are reporting this content.", 400);
    }
    const target = await getReportTarget(targetType, targetId);
    if (target.ownerUid && target.ownerUid === reporter.uid) {
      throw createError("You cannot report your own content.", 400);
    }
    const db = admin.firestore();
    const reportId = createHash("sha256")
      .update([reporter.uid, targetType, targetId].join(":"))
      .digest("hex");
    const reportRef = db.collection("contentReports").doc(reportId);
    const createdAtIso = new Date().toISOString();
    await db.runTransaction(async (transaction) => {
      const existingReport = await transaction.get(reportRef);
      const existingData = existingReport.exists ? existingReport.data() || {} : {};
      if (existingReport.exists && existingData.status === "open") {
        throw createError("You have already reported this content.", 409);
      }
      transaction.set(reportRef, {
        targetType,
        targetId,
        targetKey: `${targetType}:${targetId}`,
        targetLabel: target.label,
        targetOwnerUid: target.ownerUid,
        targetSnapshot: target.snapshot,
        reason,
        reporterUid: reporter.uid,
        reporterEmail: reporter.email,
        status: "open",
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        createdAtIso,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAtIso: createdAtIso,
        resolvedAt: null,
        resolvedAtIso: "",
        resolvedByAdminUid: "",
        resolvedByAdminEmail: "",
        resolution: "",
      });
    });
    return res.status(201).json({ success: true, reportId });
  } catch (unknownError) {
    const error = asBackendError(unknownError, "Could not submit the report.");
    return res.status(error.statusCode || 500).json({
      error: error.message || "Could not submit the report.",
    });
  }
};

export default handler;
