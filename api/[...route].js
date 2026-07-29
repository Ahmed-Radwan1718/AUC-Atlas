const securityActions = require("../server/routes/security-actions");

const routeLoaders = {
  "account-profile": function () { return require("../server/routes/account-profile"); },
  "change-email": function () { return require("../server/routes/change-email"); },
  "change-password": function () { return securityActions.changePassword; },
  "client-token": function () { return require("../server/routes/client-token"); },
  "delete-account": function () { return securityActions.deleteAccount; },
  "disable-authenticator": function () { return securityActions.disableAuthenticator; },
  "forgot-password": function () { return require("../server/routes/forgot-password"); },
  "login": function () { return require("../server/routes/login"); },
  "login-send-email-code": function () { return securityActions.loginSendEmailCode; },
  "login-verify-authenticator": function () { return securityActions.loginVerifyAuthenticator; },
  "login-verify-email-code": function () { return securityActions.loginVerifyEmailCode; },
  "logout": function () { return require("../server/routes/logout"); },
  "me": function () { return require("../server/routes/me"); },
  "security-unlock-status": function () { return require("../server/routes/security-unlock-status"); },
  "send-email-verification": function () { return require("../server/routes/send-email-verification"); },
  "send-security-code": function () { return require("../server/routes/send-security-code"); },
  "set-email-2fa": function () { return securityActions.setEmail2fa; },
  "setup-authenticator": function () { return securityActions.setupAuthenticator; },
  "sign-out-everywhere": function () { return securityActions.signOutEverywhere; },
  "sign-out-session": function () { return securityActions.signOutSession; },
  "trusted-devices": function () { return securityActions.trustedDevices; },
  "signup": function () { return require("../server/routes/signup"); },
  "verify-authenticator-setup": function () { return securityActions.verifyAuthenticatorSetup; },
  "verify-login-authenticator": function () { return securityActions.loginVerifyAuthenticator; },
  "verify-security-code": function () { return require("../server/routes/verify-security-code"); }
};

const routeCache = {};

function getRouteHandler(routeName) {
  const routeLoader = routeLoaders[routeName];

  if (!routeLoader) {
    return null;
  }

  if (!Object.prototype.hasOwnProperty.call(routeCache, routeName)) {
    routeCache[routeName] = routeLoader();
  }

  return routeCache[routeName];
}

function getRouteName(req) {
  if (req.query && req.query.route) {
    return Array.isArray(req.query.route)
      ? req.query.route.join("/")
      : String(req.query.route || "");
  }

  const rawUrl = String(req.url || "");
  const pathOnly = rawUrl.split("?")[0];

  return decodeURIComponent(pathOnly)
    .replace(/^\/api\/?/, "")
    .replace(/^\/+/, "")
    .replace(/\/+$/, "");
}

module.exports = async function handler(req, res) {
  const routeName = getRouteName(req);
  const routeHandler = getRouteHandler(routeName);

  if (!routeHandler) {
    return res.status(404).json({
      error: "API route not found.",
      route: routeName || "missing",
      url: req.url || "",
      query: req.query || {}
    });
  }

  return routeHandler(req, res);
};
