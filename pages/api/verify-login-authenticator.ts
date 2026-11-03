import type { NextApiHandler } from "next";
import { authenticator } from "otplib";
import {
  clearAuthenticatorAttempts,
  clearLoginChallenge,
  consumeAuthenticatorAttempt,
  consumeLoginChallenge,
  createSiteSessionForUid,
  getAuthenticatorSecret,
  getLoginChallenge,
} from "@/server/backend/security";
import { asBackendError, asRecord } from "@/server/backend/types";

const handler: NextApiHandler = async (req, res) => {
  try {
    if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
    const challenge = await getLoginChallenge(req);
    if (!challenge.uid || !challenge.twoFactor.appEnabled) {
      return res.status(401).json({ error: "Please log in again." });
    }
    const code = String(asRecord(req.body).code || "").trim().replace(/\D/g, "");
    if (!/^\d{6}$/.test(code)) {
      return res.status(400).json({ error: "Please enter your 6-digit authenticator code." });
    }
    const secret = await getAuthenticatorSecret(challenge.uid);
    if (!secret) {
      return res.status(400).json({ error: "Authenticator app is not enabled for this account." });
    }
    await consumeAuthenticatorAttempt(challenge.uid, "login");
    authenticator.options = { window: 1 };
    if (!authenticator.check(code, secret)) {
      return res.status(401).json({ error: "Invalid authenticator code." });
    }
    await consumeLoginChallenge(challenge);
    await clearAuthenticatorAttempts(challenge.uid, "login");
    await createSiteSessionForUid(challenge.uid, res, req);
    await clearLoginChallenge(req, res);
    return res.status(200).json({
      success: true,
      requiresTwoFactor: false,
      user: {
        uid: challenge.uid,
        email: challenge.email || "",
        emailVerified: false,
        displayName: "",
        fullName: "",
        photoURL: "",
      },
    });
  } catch (unknownError) {
    const error = asBackendError(unknownError, "Could not verify authenticator code.");
    if (error.retryAfterSeconds) res.setHeader("Retry-After", String(error.retryAfterSeconds));
    return res.status(error.statusCode || 500).json({
      error: error.message || "Could not verify authenticator code.",
    });
  }
};

export default handler;
