import type { LegacyRequest, LegacyReply } from "../legacyTypes";
import { randomUUID } from "node:crypto";
import { TextEncoder } from "node:util";
import {
  generateRegistrationOptions,
  verifyRegistrationResponse,
  generateAuthenticationOptions,
  verifyAuthenticationResponse,
} from "@simplewebauthn/server";
import type {
  AuthenticationResponseJSON,
  RegistrationResponseJSON,
} from "@simplewebauthn/server";

const admin = require("../_lib/firebaseAdmin").default;
const {
  getSiteSessionUser,
  requireSecurityPanelAccess,
  createLoginChallenge,
  createSiteSessionForUid,
  ensureAllowedAucEmail,
} = require("../_lib/securityHelpers");
const {
  getRequestIp,
  consumeSecurityRateLimit,
} = require("../_lib/securityRateLimits");

const CHALLENGE_EXPIRES_MS = 5 * 60 * 1000;
const MAX_KEYS_PER_USER = 10;
const RP_ID = String(process.env.PASSKEY_RP_ID || "aucatlas.com").trim().toLowerCase();

function error(message: string, statusCode = 400): Error & { statusCode: number } {
  return Object.assign(new Error(message), { statusCode });
}

function verifiedOrigin(req: LegacyRequest): { origin: string; rpID: string } {
  const origin = String(req.headers.origin || "").trim();
  const productionAllowed = ["https://" + RP_ID, "https://www." + RP_ID];
  if (productionAllowed.includes(origin)) return { origin, rpID: RP_ID };
  if (process.env.NODE_ENV !== "production" &&
      /^http:\/\/localhost(?::\d{1,5})?$/.test(origin)) {
    return { origin, rpID: "localhost" };
  }
  throw error(
    "Passkeys must be created and used on the AUC Atlas website (" +
      productionAllowed[1] + ").", 403
  );
}

function validCredentialId(id: unknown): string {
  const value = String(id || "").trim();
  if (!/^[A-Za-z0-9_-]{1,1024}$/.test(value)) throw error("Invalid passkey.", 400);
  return value;
}

function challengeRef(collection: string, id: unknown) {
  const challengeId = String(id || "").trim();
  if (!/^[a-f0-9-]{36}$/.test(challengeId)) throw error("Invalid or expired passkey challenge.");
  return admin.firestore().collection(collection).doc(challengeId);
}

async function consumeChallenge(collection: string, id: unknown) {
  const ref = challengeRef(collection, id);
  return admin.firestore().runTransaction(async (tx: any) => {
    const snap = await tx.get(ref);
    const data = snap.exists ? snap.data() || {} : {};
    const expires = typeof data.expiresAt?.toMillis === "function"
      ? data.expiresAt.toMillis() : 0;
    if (!snap.exists || data.consumedAt || !expires || expires <= Date.now())
      throw error("This passkey request expired. Please try again.", 410);
    tx.update(ref, { consumedAt: admin.firestore.FieldValue.serverTimestamp() });
    return data;
  });
}

function requireRecentLogin(decoded: any) {
  const authTime = Number(decoded?.auth_time || 0) * 1000;
  if (!authTime || authTime > Date.now() + 60_000 ||
      Date.now() - authTime > 30 * 60_000)
    throw error("For security, log out and log back in before managing passkeys.", 403);
}

async function authorizedAccount(req: LegacyRequest, recent = false) {
  const decoded = await getSiteSessionUser(req, { checkRevoked: true });
  await requireSecurityPanelAccess(req, decoded);
  if (recent) requireRecentLogin(decoded);
  const user = await admin.auth().getUser(decoded.uid);
  const email = String(user.email || "").trim().toLowerCase();
  ensureAllowedAucEmail(email, "manage passkeys");
  if (!user.emailVerified) throw error("Verify your AUC email first.", 403);
  return { decoded, user, email };
}

function keyCollection(uid: string) {
  return admin.firestore().collection("users").doc(uid).collection("passkeys");
}

function publicMetadata(snap: any) {
  const data = snap.data() || {};
  return {
    id: snap.id,
    label: String(data.label || "Passkey").slice(0, 80),
    backedUp: Boolean(data.backedUp),
    createdAt: data.createdAt?.toDate?.()?.toISOString?.() || "",
    lastUsedAt: data.lastUsedAt?.toDate?.()?.toISOString?.() || "",
  };
}

async function listKeys(req: LegacyRequest, res: LegacyReply) {
  const { decoded } = await authorizedAccount(req);
  const snaps = await keyCollection(decoded.uid).limit(MAX_KEYS_PER_USER + 1).get();
  return res.status(200).json({
    success: true,
    passkeys: snaps.docs.map(publicMetadata),
  });
}

async function beginRegistration(req: LegacyRequest, res: LegacyReply) {
  const { decoded, user, email } = await authorizedAccount(req, true);
  await consumeSecurityRateLimit({
    scope: "passkey-register-user", identifier: decoded.uid,
    maxAttempts: 12, windowMs: 15 * 60_000,
    message: "Too many passkey requests. Please try again later."
  });
  const snaps = await keyCollection(decoded.uid).limit(MAX_KEYS_PER_USER + 1).get();
  if (snaps.size >= MAX_KEYS_PER_USER)
    throw error("You have reached the limit of 10 passkeys.", 409);
  const { origin, rpID } = verifiedOrigin(req);
  const options = await generateRegistrationOptions({
    rpName: "AUC Atlas", rpID,
    userID: new TextEncoder().encode(decoded.uid),
    userName: email,
    userDisplayName: String(user.displayName || email),
    attestationType: "none",
    excludeCredentials: snaps.docs.map((doc: any) => ({
      id: doc.id, transports: doc.data().transports || [],
    })),
    authenticatorSelection: {
      residentKey: "required", requireResidentKey: true,
      userVerification: "required", authenticatorAttachment: "platform",
    },
    // COSE ES256 and RS256 are widely supported by Apple Passwords.
    supportedAlgorithmIDs: [-7, -257],
  });
  const challengeId = randomUUID();
  await challengeRef("passkeyRegistrationChallenges", challengeId).set({
    uid: decoded.uid,
    challenge: options.challenge,
    origin, rpID,
    consumedAt: null,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    expiresAt: admin.firestore.Timestamp.fromDate(new Date(Date.now() + CHALLENGE_EXPIRES_MS)),
  });
  return res.status(200).json({ success: true, challengeId, options });
}

async function finishRegistration(req: LegacyRequest, res: LegacyReply) {
  const { decoded } = await authorizedAccount(req, true);
  const data = await consumeChallenge(
    "passkeyRegistrationChallenges", req.body?.challengeId
  );
  if (data.uid !== decoded.uid) throw error("Passkey request belongs to another account.", 403);
  const currentOrigin = verifiedOrigin(req);
  if (data.origin !== currentOrigin.origin || data.rpID !== currentOrigin.rpID)
    throw error("Passkey request was initiated on another domain.", 403);
  const response = req.body?.response as RegistrationResponseJSON;
  if (!response || typeof response !== "object")
    throw error("The passkey response is missing.");
  let result;
  try {
    result = await verifyRegistrationResponse({
      response,
      expectedChallenge: data.challenge,
      expectedOrigin: data.origin,
      expectedRPID: data.rpID,
      requireUserVerification: true,
      supportedAlgorithmIDs: [-7, -257],
    });
  } catch {
    throw error("The device could not verify this passkey. Please try again.");
  }
  if (!result.verified || !result.registrationInfo)
    throw error("Passkey verification failed.", 401);
  const { credential, credentialBackedUp, credentialDeviceType } = result.registrationInfo;
  const credentialId = validCredentialId(credential.id);
  const userKeyRef = keyCollection(decoded.uid).doc(credentialId);
  const globalKeyRef = admin.firestore().collection("passkeyCredentials").doc(credentialId);
  await admin.firestore().runTransaction(async (tx: any) => {
    const [existing, countSnap] = await Promise.all([
      tx.get(globalKeyRef),
      tx.get(keyCollection(decoded.uid).limit(MAX_KEYS_PER_USER + 1)),
    ]);
    if (existing.exists) throw error("This passkey is already registered.", 409);
    if (countSnap.size >= MAX_KEYS_PER_USER)
      throw error("You have reached the passkey limit.", 409);
    const createdAt = admin.firestore.FieldValue.serverTimestamp();
    tx.create(userKeyRef, {
      id: credentialId,
      publicKey: Buffer.from(credential.publicKey).toString("base64url"),
      counter: credential.counter,
      transports: credential.transports || [],
      deviceType: credentialDeviceType,
      backedUp: credentialBackedUp,
      label: "Passkey",
      rpID: data.rpID,
      createdAt,
      lastUsedAt: null,
    });
    tx.create(globalKeyRef, { uid: decoded.uid, rpID: data.rpID, createdAt });
  });
  return res.status(200).json({ success: true, id: credentialId });
}

async function removePasskey(req: LegacyRequest, res: LegacyReply) {
  const { decoded } = await authorizedAccount(req, true);
  const credentialId = validCredentialId(req.body?.id);
  const ref = keyCollection(decoded.uid).doc(credentialId);
  const global = admin.firestore().collection("passkeyCredentials").doc(credentialId);
  await admin.firestore().runTransaction(async (tx: any) => {
    const [keySnap, ownerSnap] = await Promise.all([tx.get(ref), tx.get(global)]);
    if (!keySnap.exists || !ownerSnap.exists || ownerSnap.data()?.uid !== decoded.uid)
      throw error("Passkey not found.", 404);
    tx.delete(ref);
    tx.delete(global);
  });
  return res.status(200).json({ success: true });
}

async function beginLogin(req: LegacyRequest, res: LegacyReply) {
  const { origin, rpID } = verifiedOrigin(req);
  await consumeSecurityRateLimit({
    scope: "passkey-login-start-ip", identifier: getRequestIp(req),
    maxAttempts: 100, windowMs: 15 * 60_000,
    message: "Too many login attempts. Please try again later."
  });
  const options = await generateAuthenticationOptions({
    rpID, userVerification: "required", allowCredentials: []
  });
  const challengeId = randomUUID();
  await challengeRef("passkeyAuthenticationChallenges", challengeId).set({
    challenge: options.challenge, origin, rpID,
    consumedAt: null,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    expiresAt: admin.firestore.Timestamp.fromDate(new Date(Date.now() + CHALLENGE_EXPIRES_MS)),
  });
  return res.status(200).json({ success: true, options, challengeId });
}

async function finishLogin(req: LegacyRequest, res: LegacyReply) {
  await consumeSecurityRateLimit({
    scope: "passkey-login-verify-ip", identifier: getRequestIp(req),
    maxAttempts: 30, windowMs: 15 * 60_000,
    message: "Too many login attempts. Please try again later."
  });
  const data = await consumeChallenge(
    "passkeyAuthenticationChallenges", req.body?.challengeId
  );
  const currentOrigin = verifiedOrigin(req);
  if (data.origin !== currentOrigin.origin || data.rpID !== currentOrigin.rpID)
    throw error("Passkey request was initiated on another domain.", 403);
  const response = req.body?.response as AuthenticationResponseJSON;
  if (!response || typeof response !== "object") throw error("Missing passkey response.");
  const credentialId = validCredentialId(response.id);
  const globalSnap = await admin.firestore().collection("passkeyCredentials").doc(credentialId).get();
  const uid = String(globalSnap.data()?.uid || "");
  if (!uid) throw error("Passkey is not registered.", 401);
  const keyRef = keyCollection(uid).doc(credentialId);
  const keySnap = await keyRef.get();
  if (!keySnap.exists || keySnap.data()?.rpID !== data.rpID)
    throw error("Passkey is no longer registered.", 401);
  const key = keySnap.data() || {};
  let result;
  try {
    result = await verifyAuthenticationResponse({
      response, expectedChallenge: data.challenge,
      expectedOrigin: data.origin, expectedRPID: data.rpID,
      requireUserVerification: true,
      credential: {
        id: credentialId,
        publicKey: Uint8Array.from(Buffer.from(key.publicKey, "base64url")),
        counter: Number(key.counter || 0),
        transports: key.transports || [],
      }
    });
  } catch {
    throw error("This passkey could not be verified.", 401);
  }
  if (!result.verified) throw error("Passkey verification failed.", 401);
  const user = await admin.auth().getUser(uid);
  const email = String(user.email || "").toLowerCase();
  ensureAllowedAucEmail(email, "sign in with a passkey");
  if (!user.emailVerified || user.disabled)
    throw error("This AUC account cannot sign in.", 403);
  await admin.firestore().runTransaction(async (tx: any) => {
    const latest = await tx.get(keyRef);
    if (!latest.exists) throw error("Passkey has been removed.", 401);
    // A parallel login must not overwrite a newer authenticator counter.
    if (Number(latest.data()?.counter || 0) !== Number(key.counter || 0))
      throw error("Passkey state changed; retry sign in.", 409);
    tx.update(keyRef, {
      counter: result.authenticationInfo.newCounter,
      lastUsedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
  });
  const userDoc = await admin.firestore().collection("users").doc(uid).get();
  const profile = userDoc.data() || {};
  const twoFactor = profile.twoFactor || {};
  const appEnabled = Boolean(twoFactor.appEnabled);
  const emailEnabled = Boolean(twoFactor.emailEnabled);
  if (appEnabled || emailEnabled) {
    await createLoginChallenge(uid, res, {
      email, authMethod: "passkey",
      twoFactor: { appEnabled, emailEnabled }
    });
    return res.status(200).json({
      success: true, requiresTwoFactor: true,
      method: appEnabled ? "app" : "email",
      emailRecoveryAvailable: emailEnabled,
    });
  }
  await createSiteSessionForUid(uid, res, req);
  return res.status(200).json({
    success: true, requiresTwoFactor: false,
    user: {
      uid, email, emailVerified: true,
      displayName: profile.fullName || user.displayName || "",
      fullName: profile.fullName || user.displayName || "",
      photoURL: profile.photoURL || user.photoURL || "",
    }
  });
}

export default async function handler(req: LegacyRequest, res: LegacyReply) {
  try {
    if (req.method === "GET") return await listKeys(req, res);
    if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
    const action = String(req.body?.action || "").trim();
    if (action === "begin-registration") return await beginRegistration(req, res);
    if (action === "finish-registration") return await finishRegistration(req, res);
    if (action === "remove") return await removePasskey(req, res);
    if (action === "begin-login") return await beginLogin(req, res);
    if (action === "finish-login") return await finishLogin(req, res);
    return res.status(400).json({ error: "Unknown passkey action." });
  } catch (caught: any) {
    if (caught.retryAfterSeconds)
      res.setHeader("Retry-After", String(caught.retryAfterSeconds));
    const code = Number(caught.statusCode);
    return res.status([400, 401, 403, 404, 409, 410, 429].includes(code) ? code : 500)
      .json({ error: [400, 401, 403, 404, 409, 410, 429].includes(code)
        ? caught.message : "Could not complete this passkey request." });
  }
}
