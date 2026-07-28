const {
  clearSiteSessionCookie,
  clearLoginChallenge,
  clearLoginTwoFactorCookie
} = require("../_lib/securityHelpers");

const {
  clearSecurityUnlockSession
} = require("../_lib/securityUnlockHelpers");

async function clearCompatibleSiteSession(req, res) {
  if (typeof clearSiteSessionCookie !== "function") return;

  if (clearSiteSessionCookie.length >= 2) {
    return await clearSiteSessionCookie(req, res);
  }

  return await clearSiteSessionCookie(res);
}

async function clearCompatibleLoginChallenge(req, res) {
  if (typeof clearLoginChallenge !== "function") return;

  if (clearLoginChallenge.length >= 2) {
    return await clearLoginChallenge(req, res);
  }

  return await clearLoginChallenge(res);
}

async function clearCompatibleLoginTwoFactor(req, res) {
  if (typeof clearLoginTwoFactorCookie !== "function") return;

  if (clearLoginTwoFactorCookie.length >= 2) {
    return await clearLoginTwoFactorCookie(req, res);
  }

  return await clearLoginTwoFactorCookie(res);
}

async function clearCompatibleSecurityUnlock(req, res) {
  if (typeof clearSecurityUnlockSession !== "function") return;

  if (clearSecurityUnlockSession.length >= 2) {
    return await clearSecurityUnlockSession(req, res);
  }

  return await clearSecurityUnlockSession(res);
}

module.exports = async function handler(req, res) {
  try {
    if (req.method !== "POST" && req.method !== "GET") {
      return res.status(405).json({ error: "Method not allowed" });
    }

    await clearCompatibleLoginChallenge(req, res);
    await clearCompatibleSecurityUnlock(req, res);
    await clearCompatibleLoginTwoFactor(req, res);
    await clearCompatibleSiteSession(req, res);

    return res.status(200).json({
      success: true
    });
  } catch (error) {
    return res.status(200).json({
      success: true
    });
  }
};
