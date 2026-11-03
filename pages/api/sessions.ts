import type { NextApiHandler } from "next";
import {
  clearSiteSessionCookie,
  ensureSiteSessionRecord,
  getCurrentSiteSessionHash,
  getSiteSessionUser,
  getUserSiteSessions,
  requireSecurityPanelAccess,
  revokeUserSiteSession,
} from "@/server/backend/security";
import { consumeSecurityRateLimit } from "@/server/backend/security-rate-limits";
import { asBackendError, asRecord } from "@/server/backend/types";

const WINDOW_MS = 60 * 60 * 1000;
const MAX_REVOCATIONS = 20;

const handler: NextApiHandler = async (req, res) => {
  try {
    if (req.method !== "GET" && req.method !== "DELETE") {
      return res.status(405).json({ error: "Method not allowed" });
    }
    const decodedUser = await getSiteSessionUser(req, { checkRevoked: true });
    await requireSecurityPanelAccess(req, decodedUser);
    if (req.method === "GET") {
      const currentSession = await ensureSiteSessionRecord(decodedUser, req, res);
      const sessions = await getUserSiteSessions(decodedUser.uid, currentSession.id);
      return res.status(200).json({ success: true, sessions });
    }
    await consumeSecurityRateLimit({
      scope: "session-revocation-user",
      identifier: decodedUser.uid,
      maxAttempts: MAX_REVOCATIONS,
      windowMs: WINDOW_MS,
      message: "Too many session revocations. Please try again later.",
    });
    const sessionId = String(asRecord(req.body).sessionId || "").trim();
    if (!sessionId) return res.status(400).json({ error: "Session not found." });
    const currentSessionHash = getCurrentSiteSessionHash(req);
    const revokedSession = await revokeUserSiteSession(
      decodedUser.uid,
      sessionId,
      "signed_out_from_account",
    );
    const currentSignedOut = Boolean(
      currentSessionHash && revokedSession.id === currentSessionHash,
    );
    if (currentSignedOut) {
      clearSiteSessionCookie(res);
      return res.status(200).json({ success: true, currentSignedOut: true, sessions: [] });
    }
    const sessions = await getUserSiteSessions(decodedUser.uid, currentSessionHash);
    return res.status(200).json({ success: true, currentSignedOut: false, sessions });
  } catch (unknownError) {
    const error = asBackendError(unknownError, "Could not update sessions.");
    return res.status(error.statusCode || 500).json({ error: error.message || "Could not update sessions." });
  }
};

export default handler;
