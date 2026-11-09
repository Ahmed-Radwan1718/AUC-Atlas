import { NextRequest, NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { firestore } from "../../../server/firebase";
import { optionalSessionUser } from "../../../server/session";
import { consumeRateLimit, RateLimitError } from "../../../server/security";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const validGrades = new Set(["", "4.0", "3.7", "3.3", "3.0", "2.7", "2.3", "2.0", "1.7", "1.3", "1.0", "0"]);
type RecordValue = Record<string, unknown>;
const object = (value: unknown): RecordValue => value && typeof value === "object" && !Array.isArray(value) ? value as RecordValue : {};
const clean = (value: unknown, max: number) => String(value ?? "").trim().slice(0, max);
function cleanDegree(value: unknown) {
  const source = object(value);
  const completedKeys = Array.isArray(source.completedKeys)
    ? [...new Set(source.completedKeys.map((key: unknown) => clean(key, 40))
      .filter((key: string) => /^\d{1,3}-\d{1,3}$/.test(key)))].slice(0, 500) : [];
  return { major: clean(source.major, 100), completedKeys };
}
function cleanCredits(value: unknown) {
  const raw = String(value ?? "").replace(/[^0-9]/g, "").slice(0, 2);
  return raw ? String(Math.min(30, Math.max(0, Number(raw) || 0))) : "";
}
function cleanGpa(value: unknown) {
  const data = object(value);
  const semesters = Array.isArray(data.semesters) ? data.semesters.slice(0, 24) : [];
  return {
    semesters: semesters.map((entry: unknown, index: number) => {
      const semester = object(entry);
      const courses = Array.isArray(semester.courses) ? semester.courses.slice(0, 30) : [];
      return {
        name: clean(semester.name, 80) || "Semester " + (index + 1),
        courses: courses.map((entry: unknown) => {
          const course = object(entry);
          const grade = clean(course.grade, 4);
          return {
            name: clean(course.name, 120),
            credits: cleanCredits(course.credits),
            grade: validGrades.has(grade) ? grade : ""
          };
        })
      };
    })
  };
}
const denied = () => NextResponse.json({ error: "not-signed-in" }, { status: 401 });
export async function GET(request: NextRequest) {
  const user = await optionalSessionUser(request);
  if (!user) return denied();
  try {
    const tools = firestore().collection("users").doc(user.uid).collection("savedTools");
    const [degree, gpa] = await Promise.all([tools.doc("degree-progress").get(), tools.doc("gpa-calculator").get()]);
    const degreeData = degree.exists ? degree.data() || {} : null;
    const gpaData = gpa.exists ? gpa.data() || {} : null;
    return NextResponse.json({
      success: true,
      degreeProgress: degreeData ? {
        major: degreeData.major || "",
        completedKeys: Array.isArray(degreeData.completedKeys) ? degreeData.completedKeys : []
      } : null,
      gpaCalculator: gpaData ? {
        semesters: Array.isArray(gpaData.semesters) ? gpaData.semesters : []
      } : null
    }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ error: "Could not load academic progress." }, { status: 500 });
  }
}
export async function POST(request: NextRequest) {
  const user = await optionalSessionUser(request);
  if (!user) return denied();
  try {
    await consumeRateLimit({
      scope: "academic-progress-write-user", identifier: user.uid,
      maxAttempts: 120, windowMs: 60 * 60 * 1000,
      message: "Too many academic-progress updates. Please try again later."
    });
    const body = object(await request.json());
    const type = clean(body.type, 30);
    const tools = firestore().collection("users").doc(user.uid).collection("savedTools");
    if (type === "degree") {
      const progress = cleanDegree(body.progress);
      if (!progress.major) return NextResponse.json({ error: "A saved major is required." }, { status: 400 });
      await tools.doc("degree-progress").set({
        ...progress, updatedAt: FieldValue.serverTimestamp()
      });
      return NextResponse.json({ success: true, degreeProgress: progress });
    }
    if (type === "gpa") {
      const calculator = cleanGpa(body.calculator);
      await tools.doc("gpa-calculator").set({
        ...calculator, updatedAt: FieldValue.serverTimestamp()
      });
      return NextResponse.json({ success: true, gpaCalculator: calculator });
    }
    return NextResponse.json({ error: "Choose which academic progress to save." }, { status: 400 });
  } catch (error) {
    return NextResponse.json({
      error: error instanceof Error ? error.message : "Could not save academic progress."
    }, {
      status: error instanceof RateLimitError ? 429 : 500,
      headers: error instanceof RateLimitError ? { "Retry-After": String(error.retryAfterSeconds) } : {}
    });
  }
}
