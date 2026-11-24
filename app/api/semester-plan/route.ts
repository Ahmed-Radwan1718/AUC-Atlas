import { NextRequest, NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { courses } from "../../../data/courses";
import { SEMESTER_COURSE_LIMIT, semesterCreditViolation } from "../../../lib/semesterCredits";
import { firestore } from "../../../server/firebase";
import { optionalSessionUser } from "../../../server/session";
import { consumeRateLimit, RateLimitError } from "../../../server/security";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Semester = { name: string; courses: string[] };
const validCodes = new Set(courses.map(course => course.code));
const semesterNamePattern = /^(Spring|Summer|Fall|Winter) 20\d{2}$/;
const denied = () => NextResponse.json({ error: "not-signed-in" }, { status: 401 });

function cleanPlan(value: unknown): Semester[] | null {
  if (!Array.isArray(value) || value.length > 16) return null;
  const names = new Set<string>();
  const plannedCodes = new Set<string>();
  const result: Semester[] = [];

  for (const entry of value) {
    if (!entry || typeof entry !== "object" || Array.isArray(entry)) return null;
    const item = entry as Record<string, unknown>;
    const name = String(item.name ?? "").trim();
    if (!semesterNamePattern.test(name) || names.has(name)) return null;
    if (!Array.isArray(item.courses) || item.courses.length > SEMESTER_COURSE_LIMIT) return null;
    names.add(name);

    const selected: string[] = [];
    for (const value of item.courses) {
      if (typeof value !== "string") return null;
      const code = value.trim().toUpperCase().replace(/\s+/g, " ");
      if (!validCodes.has(code) || plannedCodes.has(code)) return null;
      plannedCodes.add(code);
      selected.push(code);
    }
    result.push({ name, courses: selected });
  }
  return result;
}

export async function GET(request: NextRequest) {
  const user = await optionalSessionUser(request);
  if (!user) return denied();
  try {
    const document = await firestore().collection("users").doc(user.uid)
      .collection("savedTools").doc("semester-plan").get();
    const savedPlan = cleanPlan(document.data()?.semesters);
    const semesters = savedPlan || [];
    return NextResponse.json({ semesters, hasSavedPlan: savedPlan !== null }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ error: "Could not load semester plan." }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const user = await optionalSessionUser(request);
  if (!user) return denied();
  try {
    await consumeRateLimit({
      scope: "semester-plan-write-user", identifier: user.uid,
      maxAttempts: 120, windowMs: 60 * 60 * 1000,
      message: "Too many semester plan updates. Please try again later."
    });
    const body = await request.json();
    const semesters = cleanPlan(body && typeof body === "object" ? body.semesters : null);
    if (!semesters) {
      return NextResponse.json({ error: "Invalid semester plan." }, { status: 400 });
    }
    const db = firestore();
    const ref = db.collection("users").doc(user.uid).collection("savedTools").doc("semester-plan");
    const violation = await db.runTransaction(async tx => {
      const existing = await tx.get(ref);
      const previous = cleanPlan(existing.data()?.semesters) || [];
      const error = semesterCreditViolation(semesters, previous);
      if (error) return error;
      tx.set(ref, { semesters, updatedAt: FieldValue.serverTimestamp() });
      return null;
    });
    if (violation) return NextResponse.json({ error: violation }, { status: 400 });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({
      error: error instanceof Error ? error.message : "Could not save semester plan."
    }, {
      status: error instanceof RateLimitError ? 429 : 500,
      headers: error instanceof RateLimitError ? { "Retry-After": String(error.retryAfterSeconds) } : {}
    });
  }
}
