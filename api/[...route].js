const routeLoaders = {
  "academic-progress": function () { return require("../server/routes/academic-progress"); },
  "authenticator": function () { return require("../server/routes/authenticator"); },
  "change-password": function () { return require("../server/routes/change-password"); },
  "course-material-download": function () { return require("../server/routes/course-material-download"); },
  "delete-account": function () { return require("../server/routes/delete-account"); },
  "forgot-password": function () { return require("../server/routes/forgot-password"); },
  "gemini-chat": function () { return require("../server/routes/gemini-chat"); },
  "login": function () { return require("../server/routes/login"); },
  "login-code": function () { return require("../server/routes/login-code"); },
  "logout": function () { return require("../server/routes/logout"); },
  "me": function () { return require("../server/routes/me"); },
  "profile-photo": function () { return require("../server/routes/profile-photo"); },
  "professor-reviews": function () { return require("../server/routes/professor-reviews"); },
  "sessions": function () { return require("../server/routes/sessions"); },
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
