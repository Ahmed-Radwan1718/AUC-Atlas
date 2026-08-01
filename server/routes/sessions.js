const {
  clearSiteSessionCookie,
  ensureSiteSessionRecord,
  getCurrentSiteSessionHash,
  getSiteSessionUser,
  getUserSiteSessions,
  revokeUserSiteSession
} = require("../_lib/securityHelpers");

function getRequestBody(req) {
  if (req.body && typeof req.body === "object") {
    return req.body;
  }

  if (typeof req.body === "string") {
    try {
      return JSON.parse(req.body);
    } catch (error) {
      return {};
    }
  }

  return {};
}

module.exports = async function handler(req, res) {
  try {
    if (req.method !== "GET" && req.method !== "DELETE") {
      return res.status(405).json({ error: "Method not allowed" });
    }

    const decodedUser = await getSiteSessionUser(req, {
      checkRevoked: true
    });

    if (req.method === "GET") {
      const currentSession = await ensureSiteSessionRecord(decodedUser, req, res);
      const sessions = await getUserSiteSessions(decodedUser.uid, currentSession.id);

      return res.status(200).json({
        success: true,
        sessions
      });
    }

    const body = getRequestBody(req);
    const sessionId = String(body.sessionId || "").trim();

    if (!sessionId) {
      return res.status(400).json({ error: "Session not found." });
    }

    const currentSessionHash = getCurrentSiteSessionHash(req);
    const revokedSession = await revokeUserSiteSession(decodedUser.uid, sessionId, "signed_out_from_account");
    const currentSignedOut = Boolean(currentSessionHash && revokedSession.id === currentSessionHash);

    if (currentSignedOut) {
      clearSiteSessionCookie(res);

      return res.status(200).json({
        success: true,
        currentSignedOut: true,
        sessions: []
      });
    }

    const sessions = await getUserSiteSessions(decodedUser.uid, currentSessionHash);

    return res.status(200).json({
      success: true,
      currentSignedOut: false,
      sessions
    });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      error: error.message || "Could not update sessions."
    });
  }
};
