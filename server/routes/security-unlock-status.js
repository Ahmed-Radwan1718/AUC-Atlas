const {
  getUserFromRequest
} = require("../_lib/securityHelpers");

const {
  hasValidSecurityUnlockSession
} = require("../_lib/securityUnlockHelpers");

async function hasSecurityUnlock(req, uid) {
  if (hasValidSecurityUnlockSession.length >= 2) {
    return await hasValidSecurityUnlockSession(req, uid);
  }

  return await hasValidSecurityUnlockSession(req);
}

module.exports = async function handler(req, res) {
  try {
    if (req.method !== "GET") {
      return res.status(405).json({ error: "Method not allowed" });
    }

    const decodedUser = await getUserFromRequest(req, {
      checkRevoked: true,
      requireCompletedTwoFactor: true
    });

    const unlocked = await hasSecurityUnlock(req, decodedUser.uid);

    return res.status(200).json({
      success: true,
      unlocked: Boolean(unlocked)
    });
  } catch (error) {
    return res.status(200).json({
      success: true,
      unlocked: false
    });
  }
};
