import type { NextApiHandler } from "next";
import { admin } from "@/server/backend/firebase";
import { getSiteSessionUser } from "@/server/backend/security";
import { consumeSecurityRateLimit } from "@/server/backend/security-rate-limits";
import { asBackendError, asRecord } from "@/server/backend/types";

const WRITE_WINDOW_MS = 60 * 60 * 1000;
const MAX_WRITES = 120;
const VALID_GPA_GRADES = new Set(["", "4.0", "3.7", "3.3", "3.0", "2.7", "2.3", "2.0", "1.7", "1.3", "1.0", "0"]);

function cleanString(value: unknown, maxLength: number): string {
  return String(value || "").trim().slice(0, maxLength);
}
function cleanDegreeProgress(value: unknown) {
  const source = asRecord(value);
  const major = cleanString(source.major, 100);
  const completedKeys = Array.isArray(source.completedKeys)
    ? Array.from(new Set(source.completedKeys.map((key) => cleanString(key, 40)).filter((key) => /^\d{1,3}-\d{1,3}$/.test(key)))).slice(0, 500)
    : [];
  return { major, completedKeys };
}
function cleanGpaCredits(value: unknown): string {
  const rawCredits = String(value == null ? "" : value).replace(/[^0-9]/g, "").slice(0, 2);
  if (!rawCredits) return "";
  return String(Math.min(30, Math.max(0, Number(rawCredits) || 0)));
}
function cleanGpaCalculator(value: unknown) {
  const source = asRecord(value);
  const semesters = Array.isArray(source.semesters) ? source.semesters.slice(0, 24) : [];
  return {
    semesters: semesters.map((semester, semesterIndex) => {
      const safeSemester = asRecord(semester);
      const courses = Array.isArray(safeSemester.courses)
        ? safeSemester.courses.slice(0, 30).map((course) => {
            const safeCourse = asRecord(course);
            const grade = cleanString(safeCourse.grade, 4);
            return {
              name: cleanString(safeCourse.name, 120),
              credits: cleanGpaCredits(safeCourse.credits),
              grade: VALID_GPA_GRADES.has(grade) ? grade : "",
            };
          })
        : [];
      return {
        name: cleanString(safeSemester.name, 80) || `Semester ${semesterIndex + 1}`,
        courses,
      };
    }),
  };
}

const handler: NextApiHandler = async (req, res) => {
  try {
    const decodedUser = await getSiteSessionUser(req, { checkRevoked: true });
    const savedTools = admin.firestore().collection("users").doc(decodedUser.uid).collection("savedTools");
    if (req.method === "GET") {
      const [degreeDocument, gpaDocument] = await Promise.all([
        savedTools.doc("degree-progress").get(),
        savedTools.doc("gpa-calculator").get(),
      ]);
      const degreeData = degreeDocument.exists ? degreeDocument.data() || {} : null;
      const gpaData = gpaDocument.exists ? gpaDocument.data() || {} : null;
      return res.status(200).json({
        success: true,
        degreeProgress: degreeData
          ? {
              major: degreeData.major || "",
              completedKeys: Array.isArray(degreeData.completedKeys) ? degreeData.completedKeys : [],
            }
          : null,
        gpaCalculator: gpaData
          ? { semesters: Array.isArray(gpaData.semesters) ? gpaData.semesters : [] }
          : null,
      });
    }
    if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
    await consumeSecurityRateLimit({
      scope: "academic-progress-write-user",
      identifier: decodedUser.uid,
      maxAttempts: MAX_WRITES,
      windowMs: WRITE_WINDOW_MS,
      message: "Too many academic-progress updates. Please try again later.",
    });
    const body = asRecord(req.body);
    const type = cleanString(body.type, 30);
    if (type === "degree") {
      const progress = cleanDegreeProgress(body.progress);
      if (!progress.major) return res.status(400).json({ error: "A saved major is required." });
      await savedTools.doc("degree-progress").set({
        major: progress.major,
        completedKeys: progress.completedKeys,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
      return res.status(200).json({ success: true, degreeProgress: progress });
    }
    if (type === "gpa") {
      const calculator = cleanGpaCalculator(body.calculator);
      await savedTools.doc("gpa-calculator").set({
        semesters: calculator.semesters,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
      return res.status(200).json({ success: true, gpaCalculator: calculator });
    }
    return res.status(400).json({ error: "Choose which academic progress to save." });
  } catch (unknownError) {
    const error = asBackendError(unknownError, "Could not save academic progress.");
    return res.status(error.statusCode || 500).json({ error: error.message || "Could not save academic progress." });
  }
};

export default handler;
