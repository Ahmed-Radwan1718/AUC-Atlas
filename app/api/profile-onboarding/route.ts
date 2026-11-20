import { NextRequest, NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { firestore } from "../../../server/firebase";
import { optionalSessionUser } from "../../../server/session";
import { AUC_MAJOR_OPTIONS } from "../../../data/major-options";
import { isValidEnrollmentTerm } from "../../../lib/enrollmentTerm";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const headers = { "Cache-Control": "private, no-store" };
const json = (data: Record<string, unknown>, status = 200) =>
  NextResponse.json(data, { status, headers });

function profileFields(data: Record<string, unknown>) {
  const major = String(data.major || "").trim();
  const rawTerm = String(data.enrollmentTerm || "").trim();
  const enrollmentTerm = isValidEnrollmentTerm(rawTerm) ? rawTerm : "";
  return { major, enrollmentTerm, complete: Boolean(major && enrollmentTerm) };
}

export async function GET(request: NextRequest) {
  const user = await optionalSessionUser(request);
  if (!user) return json({ signedIn: false });

  try {
    const doc = await firestore().collection("users").doc(user.uid).get();
    return json({ signedIn: true, ...profileFields(doc.data() || {}) });
  } catch (error) {
    console.error("Profile onboarding load failed", error);
    return json({ error: "Could not load profile setup." }, 500);
  }
}

export async function POST(request: NextRequest) {
  const user = await optionalSessionUser(request);
  if (!user) return json({ error: "Sign in to complete your profile." }, 401);

  let body: Record<string, unknown>;
  try {
    body = await request.json();
    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return json({ error: "Please provide your major and enrollment term." }, 400);
    }
  } catch {
    return json({ error: "Invalid profile setup data." }, 400);
  }

  try {
    const ref = firestore().collection("users").doc(user.uid);
    const result = await firestore().runTransaction(async transaction => {
      const snapshot = await transaction.get(ref);
      const original = profileFields(snapshot.data() || {});
      const major = original.major || (typeof body.major === "string" ? body.major.trim() : "");
      const enrollmentTerm = original.enrollmentTerm
        || (typeof body.enrollmentTerm === "string" ? body.enrollmentTerm.trim() : "");

      if (!major || !enrollmentTerm
        || (!original.major && !AUC_MAJOR_OPTIONS.includes(major))
        || !isValidEnrollmentTerm(enrollmentTerm)) {
        return { error: "Select a valid major and enrollment term." };
      }

      if (!original.complete) {
        transaction.set(ref, {
          ...(!original.major ? { major } : {}),
          ...(!original.enrollmentTerm ? { enrollmentTerm } : {}),
          updatedAt: FieldValue.serverTimestamp()
        }, { merge: true });
      }
      return { signedIn: true, major, enrollmentTerm, complete: true };
    });

    if ("error" in result) return json(result, 400);
    return json(result);
  } catch (error) {
    console.error("Profile onboarding save failed", error);
    return json({ error: "Could not save profile setup. Please try again." }, 500);
  }
}
