const routeLoaders = {
  "account-profile": function () { return require("../server/routes/account-profile"); },
  "change-email": function () { return require("../server/routes/change-email"); },
  "change-password": function () { return require("../server/routes/change-password"); },
  "client-token": function () { return require("../server/routes/client-token"); },
  "delete-account": function () { return require("../server/routes/sign-out-everywhere").deleteAccount; },
  "disable-authenticator": function () { return require("../server/routes/disable-authenticator"); },
  "forgot-password": function () { return require("../server/routes/forgot-password"); },
  "login": function () { return require("../server/routes/login"); },
  "login-send-email-code": function () { return require("../server/routes/login-send-email-code"); },
  "login-verify-authenticator": function () { return require("../server/routes/login-verify-authenticator"); },
  "login-verify-email-code": function () { return require("../server/routes/login-verify-email-code"); },
  "logout": function () { return require("../server/routes/logout"); },
  "me": function () { return require("../server/routes/me"); },
  "security-unlock-status": function () { return require("../server/routes/security-unlock-status"); },
  "send-email-verification": function () { return require("../server/routes/send-email-verification"); },
  "send-security-code": function () { return require("../server/routes/send-security-code"); },
  "set-email-2fa": function () { return require("../server/routes/set-email-2fa"); },
  "setup-authenticator": function () { return require("../server/routes/setup-authenticator"); },
  "sign-out-everywhere": function () { return require("../server/routes/sign-out-everywhere"); },
  "sign-out-session": function () { return require("../server/routes/sign-out-everywhere").signOutSession; },
  "trusted-devices": function () { return require("../server/routes/sign-out-everywhere").trustedDevices; },
  "signup": function () { return require("../server/routes/signup"); },
  "verify-authenticator-setup": function () { return require("../server/routes/verify-authenticator-setup"); },
  "verify-login-authenticator": function () { return require("../server/routes/verify-login-authenticator"); },
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
