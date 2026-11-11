const admin = require("./firebaseAdmin").default;

// AUC IDs must never be claimed before the student's university email is verified.
// New signups hold the requested ID only in their private, unverified profile.
const normalizedId = (value: unknown): string =>
  String(value ?? "").replace(/\D/g, "").slice(0, 9);
const validId = (value: string): boolean => /^900\d{6}$/.test(value);
type AccountError = Error & { statusCode: number };

function accountError(message: string, statusCode: number): AccountError {
  return Object.assign(new Error(message), { statusCode });
}
function idInUse(): AccountError {
  return accountError(
    "This AUC ID is already associated with a verified account. Contact support if it belongs to you.",
    409
  );
}
async function isVerifiedOwner(uid: string): Promise<boolean> {
  if (!uid) return false;
  try {
    const record = await admin.auth().getUser(uid);
    return Boolean(record.emailVerified);
  } catch (error: any) {
    if (error?.code === "auth/user-not-found") return false;
    throw error;
  }
}

/** Signup checks only verified owners; unverified/abandoned accounts never block IDs. */
export async function ensureAucIdCanCreateAccount(value: unknown): Promise<string> {
  const id = normalizedId(value);
  if (!validId(id)) throw accountError("AUC ID number must start with 900 and be 9 digits total.", 400);
  const db = admin.firestore();
  const reservation = await db.collection("accountAucIds").doc(id).get();
  const reservationData = reservation.data() || {};
  if (reservation.exists &&
    (reservationData.verifiedAt || await isVerifiedOwner(String(reservationData.uid || "")))) {
    throw idInUse();
  }

  // Backward compatibility for verified legacy accounts without an ID reservation.
  const [byId, byLookupKey] = await Promise.all([
    db.collection("users").where("aucId", "==", id).limit(25).get(),
    db.collection("users").where("aucIdLookupKey", "==", id).limit(25).get()
  ]);
  const candidates = new Set<string>(
    [...byId.docs, ...byLookupKey.docs].map((doc: any) => doc.id)
  );
  for (const uid of candidates) {
    if (await isVerifiedOwner(uid)) throw idInUse();
  }
  return id;
}

/** Called by every successful login method before any site session cookie is issued. */
export async function claimVerifiedAucId(uid: string): Promise<void> {
  const authRecord = await admin.auth().getUser(uid);
  if (!authRecord.emailVerified) {
    throw accountError("Verify your AUC email before completing registration.", 403);
  }
  const db = admin.firestore();
  const userRef = db.collection("users").doc(uid);
  const userSnapshot = await userRef.get();
  // Keep accounts migrated from old systems without an AUC ID working normally.
  if (!userSnapshot.exists) return;
  const profile = userSnapshot.data() || {};
  const id = normalizedId(profile.aucIdLookupKey || profile.aucId);
  if (!id) return;
  if (!validId(id)) throw accountError("The AUC ID saved on your account is invalid. Contact support.", 400);

  const reservationRef = db.collection("accountAucIds").doc(id);
  const before = await reservationRef.get();
  const priorUid = String((before.data() || {}).uid || "");
  // Older signup flows wrote reservations before verification. Such unverified
  // reservations are reclaimable; verified ones remain protected.
  const priorVerified = priorUid && priorUid !== uid ? await isVerifiedOwner(priorUid) : false;
  await db.runTransaction(async (tx: any) => {
    const [freshUser, current] = await Promise.all([tx.get(userRef), tx.get(reservationRef)]);
    const currentProfile = freshUser.data() || {};
    if (!freshUser.exists || normalizedId(currentProfile.aucIdLookupKey || currentProfile.aucId) !== id) {
      throw accountError("Your account details changed. Please try logging in again.", 409);
    }
    const existing = current.data() || {};
    const owner = String(existing.uid || "");
    if (current.exists && owner !== uid &&
      (existing.verifiedAt || owner !== priorUid || priorVerified)) {
      throw idInUse();
    }
    if (current.exists && owner === uid && existing.verifiedAt) {
      // Already claimed (including normal subsequent sign-ins).
      return;
    }
    tx.set(reservationRef, {
      uid, aucId: id, aucIdLookupKey: id,
      verifiedAt: admin.firestore.FieldValue.serverTimestamp()
    });
    tx.set(userRef, {
      aucIdClaimStatus: "verified",
      aucIdClaimedAt: admin.firestore.FieldValue.serverTimestamp()
    }, { merge: true });
  });
}
