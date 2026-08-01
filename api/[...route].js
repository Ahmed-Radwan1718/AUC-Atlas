const routeLoaders = {
  "authenticator": function () { return require("../server/routes/authenticator"); },
  "login": function () { return require("../server/routes/login"); },
  "logout": function () { return require("../server/routes/logout"); },
  "me": function () { return require("../server/routes/me"); },
  "signup": function () { return require("../server/routes/signup"); },
  "verify-login-authenticator": function () { return require("../server/routes/verify-login-authenticator"); }
};

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
  const routeLoader = routeLoaders[routeName];

  if (!routeLoader) {
    return res.status(404).json({ error: "API route not found." });
  }

  return routeLoader()(req, res);
};
