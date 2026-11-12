import type { NextRequest } from "next/server";
import type { DecodedIdToken } from "firebase-admin/auth";
import { FieldValue, Timestamp } from "firebase-admin/firestore";
import { firebaseAuth, firestore } from "./firebase";
import { sessionHash } from "./security";
import { isProfessorEmail } from "./professorEmails";

const production = process.env.NODE_ENV === "production" || process.env.VERCEL_ENV === "production";
const sessionCookieName = production ? "__Host-auc_atlas_session" : "auc_atlas_session";
const sessionIdCookieName = production ? "__Host-auc_atlas_session_id" : "auc_atlas_session_id";
const touchCooldown = 5 * 60 * 1000;

function millis(value: unknown): number {
  if (!value) return 0;
  if (value instanceof Timestamp) return value.toMillis();
  if (typeof value === "object" && "seconds" in value && typeof value.seconds === "number") return value.seconds * 1000;
  const parsed = new Date(value as string).getTime();
  return Number.isFinite(parsed) ? parsed : 0;
}
function isAllowedAucEmail(value: unknown): boolean {
  const email = String(value || "").trim().toLowerCase();
  const at = email.indexOf("@");
  return at > 0 && at === email.lastIndexOf("@") && email.slice(at + 1) === "aucegypt.edu";
}

/** Verify original two-cookie session scheme, revocation, user status and AUC-domain email. */
export async function optionalSessionUser(request: NextRequest): Promise<DecodedIdToken | null> {
  try {
    const tokenCookie = request.cookies.get(sessionCookieName)?.value || "";
    const sessionId = request.cookies.get(sessionIdCookieName)?.value || "";
    if (!tokenCookie || !/^[a-f0-9]{64}$/i.test(sessionId)) return null;
    const idTokenFallback = tokenCookie.startsWith("idtoken.");
    const auth = firebaseAuth();
    const decoded = idTokenFallback
      ? await auth.verifyIdToken(tokenCookie.slice("idtoken.".length), true)
      : await auth.verifySessionCookie(tokenCookie, true);
    if (!decoded?.uid || !isAllowedAucEmail(decoded.email) || isProfessorEmail(decoded.email)) return null;
    const user = await auth.getUser(decoded.uid);
    const accountEmail = user.email || decoded.email;
    if (!user.emailVerified || !isAllowedAucEmail(accountEmail) || isProfessorEmail(accountEmail)) return null;

    const hash = sessionHash(sessionId);
    const ref = firestore().collection("users").doc(decoded.uid).collection("sessions").doc(hash);
    const snapshot = await ref.get();
    if (!snapshot.exists) return null;
    const data = snapshot.data() || {};
    if (data.revokedAt || !millis(data.expiresAt) || millis(data.expiresAt) <= Date.now()
      || String(data.uid || "").trim() !== decoded.uid || String(data.sessionId || "").trim() !== hash) return null;

    const lastSeen = millis(data.lastSeenAt || data.createdAt);
    if (!lastSeen || Date.now() - lastSeen > touchCooldown) {
      await ref.set({ lastSeenAt: FieldValue.serverTimestamp() }, { merge: true });
    }
    return decoded;
  } catch {
    return null;
  }
}
