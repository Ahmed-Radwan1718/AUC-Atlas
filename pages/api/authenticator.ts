import type { NextApiHandler, NextApiRequest, NextApiResponse } from "next";
import QRCode from "qrcode";
import { authenticator } from "otplib";
import { admin } from "@/server/backend/firebase";
import {
  clearAuthenticatorAttempts,
  consumeAuthenticatorAttempt,
  getAuthenticatorSecret,
  getSiteSessionUser,
  issueSecurityPanelAccess,
  requireSecurityPanelAccess,
} from "@/server/backend/security";
import { decryptTotpSecret, encryptTotpSecret } from "@/server/backend/totp-encryption";
import { asBackendError, asRecord, type BackendError } from "@/server/backend/types";

const SETUP_EXPIRES_MS = 10 * 60 * 1000;
const RECENT_SETUP_AUTH_MAX_AGE_MS = 90 * 60 * 1000;

type SiteUser = Awaited<ReturnType<typeof getSiteSessionUser>>;

function cleanCode(value: unknown): string {
  return String(value || "").trim().replace(/\D/g, "");
}

function requireRecentAuthenticatorSetup(decodedUser: SiteUser): void {
  const authenticationTimeSeconds = Number(decodedUser.auth_time || 0);
  const authenticationTimeMs = Number.isFinite(authenticationTimeSeconds)
    ? authenticationTimeSeconds * 1000
    : 0;
  const authenticationAgeMs = Date.now() - authenticationTimeMs;
  if (
    !authenticationTimeMs ||
    authenticationAgeMs < 0 ||
    authenticationAgeMs > RECENT_SETUP_AUTH_MAX_AGE_MS
  ) {
    const error = new Error(
      "For your security, log out and log back in before setting up an authenticator app.",
    ) as BackendError;
    error.statusCode = 403;
    error.code = "recent-authentication-required";
    throw error;
  }
}

async function verifyAuthenticatorCode(
  uid: string,
  scope: string,
  code: string,
  secret: string,
): Promise<boolean> {
  await consumeAuthenticatorAttempt(uid, scope);
  authenticator.options = { window: 1 };
  if (!authenticator.check(code, secret)) return false;
  await clearAuthenticatorAttempts(uid, scope);
  return true;
}

function timestampToMillis(value: unknown): number {
  if (!value) return 0;
  const timestamp = value as { toMillis?: () => number; toDate?: () => Date };
  if (typeof timestamp.toMillis === "function") return timestamp.toMillis();
  if (typeof timestamp.toDate === "function") return timestamp.toDate().getTime();
  const date = new Date(String(value));
  return Number.isNaN(date.getTime()) ? 0 : date.getTime();
}

async function getTwoFactorState(uid: string) {
  const userRef = admin.firestore().collection("users").doc(uid);
  const userDoc = await userRef.get();
  const userData = userDoc.exists ? userDoc.data() || {} : {};
  const twoFactor = asRecord(userData.twoFactor);
  return { userRef, userData, twoFactor };
}

async function handleSetup(res: NextApiResponse, decodedUser: SiteUser) {
  const state = await getTwoFactorState(decodedUser.uid);
  if (state.twoFactor.appEnabled) {
    return res.status(409).json({ error: "Authenticator app is already enabled." });
  }
  const userRecord = await admin.auth().getUser(decodedUser.uid);
  const email = String(userRecord.email || decodedUser.email || state.userData.email || "");
  if (!email) return res.status(400).json({ error: "No email address found on this account." });

  const secret = authenticator.generateSecret();
  const otpauthUrl = authenticator.keyuri(email, "AUC Atlas", secret);
  const qrDataUrl = await QRCode.toDataURL(otpauthUrl, { margin: 1, width: 220 });
  const secretEncrypted = encryptTotpSecret(
    secret,
    `authenticator-setup:${decodedUser.uid}`,
  );
  await admin.firestore().collection("authenticatorSetupSessions").doc(decodedUser.uid).set({
    secretEncrypted,
    email,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    expiresAt: admin.firestore.Timestamp.fromDate(new Date(Date.now() + SETUP_EXPIRES_MS)),
  });
  return res.status(200).json({ success: true, secret, qrDataUrl });
}

async function handleVerifySetup(
  req: NextApiRequest,
  res: NextApiResponse,
  decodedUser: SiteUser,
) {
  const code = cleanCode(asRecord(req.body).code);
  if (!/^\d{6}$/.test(code)) {
    return res.status(400).json({ error: "Please enter the 6-digit authenticator code." });
  }
  const setupRef = admin.firestore().collection("authenticatorSetupSessions").doc(decodedUser.uid);
  const setupDoc = await setupRef.get();
  if (!setupDoc.exists) return res.status(400).json({ error: "Please restart authenticator setup." });
  const setupData = setupDoc.data() || {};
  const expiresAtMs = timestampToMillis(setupData.expiresAt);
  if (!expiresAtMs || expiresAtMs < Date.now()) {
    await setupRef.delete().catch(() => undefined);
    return res.status(400).json({ error: "Authenticator setup expired. Please restart setup." });
  }
  const setupSecret = setupData.secretEncrypted
    ? decryptTotpSecret(setupData.secretEncrypted, `authenticator-setup:${decodedUser.uid}`)
    : String(setupData.secret || "").trim();
  if (!setupSecret) {
    await setupRef.delete().catch(() => undefined);
    return res.status(400).json({ error: "Please restart authenticator setup." });
  }
  const validCode = await verifyAuthenticatorCode(decodedUser.uid, "setup", code, setupSecret);
  if (!validCode) return res.status(401).json({ error: "Invalid authenticator code." });

  const state = await getTwoFactorState(decodedUser.uid);
  const nextTwoFactor: Record<string, unknown> = {
    ...state.twoFactor,
    appEnabled: true,
    appEnabledAt:
      state.twoFactor.appEnabledAt || admin.firestore.FieldValue.serverTimestamp(),
    appUpdatedAt: admin.firestore.FieldValue.serverTimestamp(),
  };
  delete nextTwoFactor.appSecret;
  await admin.firestore().collection("twoFactorSecrets").doc(decodedUser.uid).set(
    {
      appSecretEncrypted: encryptTotpSecret(
        setupSecret,
        `authenticator-account:${decodedUser.uid}`,
      ),
      appSecret: admin.firestore.FieldValue.delete(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    },
    { merge: true },
  );
  await state.userRef.set(
    { twoFactor: nextTwoFactor, updatedAt: admin.firestore.FieldValue.serverTimestamp() },
    { merge: true },
  );
  await state.userRef
    .update({ "twoFactor.appSecret": admin.firestore.FieldValue.delete() })
    .catch(() => undefined);
  await setupRef.delete().catch(() => undefined);
  const securityAccess = await issueSecurityPanelAccess(decodedUser);
  return res.status(200).json({
    success: true,
    twoFactor: {
      appEnabled: true,
      emailEnabled: Boolean(nextTwoFactor.emailEnabled),
    },
    securityAccessToken: securityAccess.token,
    securityAccessExpiresAt: securityAccess.expiresAt,
  });
}

async function handleVerifySecurityPanel(
  req: NextApiRequest,
  res: NextApiResponse,
  decodedUser: SiteUser,
) {
  const code = cleanCode(asRecord(req.body).code);
  const state = await getTwoFactorState(decodedUser.uid);
  if (!state.twoFactor.appEnabled) {
    return res.status(200).json({
      success: true,
      securityAccessRequired: false,
      securityAccessToken: "",
    });
  }
  if (!/^\d{6}$/.test(code)) {
    return res.status(400).json({ error: "Please enter your 6-digit authenticator code." });
  }
  const secret = await getAuthenticatorSecret(decodedUser.uid);
  if (!secret) {
    return res.status(400).json({ error: "Authenticator app is not configured correctly." });
  }
  if (!(await verifyAuthenticatorCode(decodedUser.uid, "account", code, secret))) {
    return res.status(401).json({ error: "Invalid authenticator code." });
  }
  const securityAccess = await issueSecurityPanelAccess(decodedUser);
  return res.status(200).json({
    success: true,
    securityAccessRequired: true,
    securityAccessToken: securityAccess.token,
    securityAccessExpiresAt: securityAccess.expiresAt,
  });
}

async function handleDisable(
  req: NextApiRequest,
  res: NextApiResponse,
  decodedUser: SiteUser,
) {
  const code = cleanCode(asRecord(req.body).code);
  if (!/^\d{6}$/.test(code)) {
    return res.status(400).json({ error: "Please enter your 6-digit authenticator code." });
  }
  const secret = await getAuthenticatorSecret(decodedUser.uid);
  if (!secret) return res.status(400).json({ error: "Authenticator app is not enabled." });
  if (!(await verifyAuthenticatorCode(decodedUser.uid, "account", code, secret))) {
    return res.status(401).json({ error: "Invalid authenticator code." });
  }
  const state = await getTwoFactorState(decodedUser.uid);
  const nextTwoFactor: Record<string, unknown> = {
    ...state.twoFactor,
    appEnabled: false,
    appDisabledAt: admin.firestore.FieldValue.serverTimestamp(),
    appUpdatedAt: admin.firestore.FieldValue.serverTimestamp(),
  };
  delete nextTwoFactor.appSecret;
  await admin.firestore().collection("twoFactorSecrets").doc(decodedUser.uid).delete().catch(() => undefined);
  await state.userRef.set(
    { twoFactor: nextTwoFactor, updatedAt: admin.firestore.FieldValue.serverTimestamp() },
    { merge: true },
  );
  await state.userRef
    .update({ "twoFactor.appSecret": admin.firestore.FieldValue.delete() })
    .catch(() => undefined);
  return res.status(200).json({
    success: true,
    twoFactor: {
      appEnabled: false,
      emailEnabled: Boolean(nextTwoFactor.emailEnabled),
    },
  });
}

async function handleEmailTwoFactor(
  req: NextApiRequest,
  res: NextApiResponse,
  decodedUser: SiteUser,
  enabled: boolean,
) {
  const state = await getTwoFactorState(decodedUser.uid);
  if (state.twoFactor.appEnabled) await requireSecurityPanelAccess(req, decodedUser);
  if (enabled) {
    const userRecord = await admin.auth().getUser(decodedUser.uid);
    const email = String(userRecord.email || decodedUser.email || state.userData.email || "").trim();
    if (!email || !userRecord.emailVerified) {
      return res.status(400).json({
        error: "Verify your AUC email address before enabling email two-factor authentication.",
      });
    }
    if (
      !String(process.env.RESEND_API_KEY || "").trim() ||
      !String(process.env.RESEND_FROM_EMAIL || "").trim()
    ) {
      return res.status(503).json({ error: "Email verification codes are not configured." });
    }
  }
  const nextTwoFactor: Record<string, unknown> = {
    ...state.twoFactor,
    emailEnabled: enabled,
    emailUpdatedAt: admin.firestore.FieldValue.serverTimestamp(),
  };
  if (enabled) {
    nextTwoFactor.emailEnabledAt =
      state.twoFactor.emailEnabledAt || admin.firestore.FieldValue.serverTimestamp();
  } else {
    nextTwoFactor.emailDisabledAt = admin.firestore.FieldValue.serverTimestamp();
  }
  await state.userRef.set(
    { twoFactor: nextTwoFactor, updatedAt: admin.firestore.FieldValue.serverTimestamp() },
    { merge: true },
  );
  return res.status(200).json({
    success: true,
    twoFactor: {
      appEnabled: Boolean(nextTwoFactor.appEnabled),
      emailEnabled: Boolean(nextTwoFactor.emailEnabled),
    },
  });
}

const handler: NextApiHandler = async (req, res) => {
  try {
    if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
    const decodedUser = await getSiteSessionUser(req, { checkRevoked: true });
    const action = String(asRecord(req.body).action || "").trim();
    if (action === "setup") {
      await consumeAuthenticatorAttempt(decodedUser.uid, "setup-initiation");
      requireRecentAuthenticatorSetup(decodedUser);
      return handleSetup(res, decodedUser);
    }
    if (action === "verify-setup") return handleVerifySetup(req, res, decodedUser);
    if (action === "verify-security-panel") {
      return handleVerifySecurityPanel(req, res, decodedUser);
    }
    if (action === "disable") {
      await requireSecurityPanelAccess(req, decodedUser);
      return handleDisable(req, res, decodedUser);
    }
    if (action === "enable-email") return handleEmailTwoFactor(req, res, decodedUser, true);
    if (action === "disable-email") return handleEmailTwoFactor(req, res, decodedUser, false);
    return res.status(400).json({ error: "Unknown two-factor authentication action." });
  } catch (unknownError) {
    const error = asBackendError(unknownError, "Could not update two-factor authentication.");
    if (error.retryAfterSeconds) res.setHeader("Retry-After", String(error.retryAfterSeconds));
    return res.status(error.statusCode || 500).json({
      error: error.message || "Could not update two-factor authentication.",
    });
  }
};

export default handler;
