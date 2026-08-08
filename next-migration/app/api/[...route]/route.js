import { createRequire } from "node:module";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const require = createRequire(import.meta.url);

const routeLoaders = {
  "academic-progress": () => require("../../../../server/routes/academic-progress"),
  "authenticator": () => require("../../../../server/routes/authenticator"),
  "change-password": () => require("../../../../server/routes/change-password"),
  "course-material-download": () => require("../../../../server/routes/course-material-download"),
  "delete-account": () => require("../../../../server/routes/delete-account"),
  "forgot-password": () => require("../../../../server/routes/forgot-password"),
  "login": () => require("../../../../server/routes/login"),
  "login-code": () => require("../../../../server/routes/login-code"),
  "logout": () => require("../../../../server/routes/logout"),
  "me": () => require("../../../../server/routes/me"),
  "profile-photo": () => require("../../../../server/routes/profile-photo"),
  "professor-reviews": () => require("../../../../server/routes/professor-reviews"),
  "sessions": () => require("../../../../server/routes/sessions"),
  "signup": () => require("../../../../server/routes/signup"),
  "verify-login-authenticator": () => require("../../../../server/routes/verify-login-authenticator")
};

async function readBody(request) {
  if (request.method === "GET" || request.method === "HEAD") {
    return {};
  }

  const contentType = request.headers.get("content-type") || "";

  if (contentType.includes("application/json")) {
    return request.json().catch(() => ({}));
  }

  if (contentType.includes("application/x-www-form-urlencoded")) {
    const text = await request.text().catch(() => "");
    return Object.fromEntries(new URLSearchParams(text));
  }

  const text = await request.text().catch(() => "");
  return text ? { rawBody: text } : {};
}

function createNodeResponse() {
  let statusCode = 200;
  let body = "";
  const headers = [];

  const response = {
    status(code) {
      statusCode = Number(code) || statusCode;
      return response;
    },
    setHeader(name, value) {
      headers.push([name, value]);
      return response;
    },
    getHeader(name) {
      const target = String(name || "").toLowerCase();
      const found = [...headers].reverse().find(([key]) => String(key).toLowerCase() === target);
      return found ? found[1] : undefined;
    },
    removeHeader(name) {
      const target = String(name || "").toLowerCase();

      for (let index = headers.length - 1; index >= 0; index -= 1) {
        if (String(headers[index][0]).toLowerCase() === target) {
          headers.splice(index, 1);
        }
      }

      return response;
    },
    writeHead(code, extraHeaders = {}) {
      statusCode = Number(code) || statusCode;
      Object.entries(extraHeaders).forEach(([name, value]) => response.setHeader(name, value));
      return response;
    },
    json(value) {
      response.setHeader("Content-Type", "application/json; charset=utf-8");
      body = JSON.stringify(value);
      return response;
    },
    send(value) {
      body = typeof value === "string" ? value : JSON.stringify(value ?? "");
      return response;
    },
    end(value) {
      if (value !== undefined) {
        body = String(value);
      }

      return response;
    },
    redirect(first, second) {
      statusCode = typeof first === "number" ? first : 302;
      response.setHeader("Location", typeof first === "string" ? first : second);
      body = "";
      return response;
    },
    toWebResponse() {
      const webHeaders = new Headers();

      headers.forEach(([name, value]) => {
        if (Array.isArray(value)) {
          value.forEach((item) => webHeaders.append(name, String(item)));
          return;
        }

        if (String(name).toLowerCase() === "set-cookie") {
          webHeaders.append(name, String(value));
          return;
        }

        webHeaders.set(name, String(value));
      });

      return new Response(body, {
        status: statusCode,
        headers: webHeaders
      });
    }
  };

  Object.defineProperty(response, "statusCode", {
    get() {
      return statusCode;
    },
    set(value) {
      statusCode = Number(value) || statusCode;
    }
  });

  return response;
}

async function handleApiRequest(request, context) {
  const params = context && context.params ? await context.params : {};
  const routeParts = Array.isArray(params.route) ? params.route : params.route ? [params.route] : [];
  const routeName = routeParts.join("/");
  const routeLoader = routeLoaders[routeName];

  if (!routeLoader) {
    return Response.json({ error: "API route not found." }, { status: 404 });
  }

  const url = new URL(request.url);
  const headers = Object.fromEntries(request.headers.entries());
  const query = Object.fromEntries(url.searchParams.entries());

  query.route = routeParts;

  const nodeRequest = {
    method: request.method,
    url: url.pathname + url.search,
    headers,
    query,
    body: await readBody(request),
    socket: {
      remoteAddress: headers["x-forwarded-for"] || headers["x-real-ip"] || ""
    }
  };

  const nodeResponse = createNodeResponse();

  try {
    await routeLoader()(nodeRequest, nodeResponse);
    return nodeResponse.toWebResponse();
  } catch (error) {
    return Response.json(
      { error: error.message || "API route failed." },
      { status: error.statusCode || 500 }
    );
  }
}

export function GET(request, context) {
  return handleApiRequest(request, context);
}

export function POST(request, context) {
  return handleApiRequest(request, context);
}

export function PATCH(request, context) {
  return handleApiRequest(request, context);
}

export function PUT(request, context) {
  return handleApiRequest(request, context);
}

export function DELETE(request, context) {
  return handleApiRequest(request, context);
}

export function OPTIONS(request, context) {
  return handleApiRequest(request, context);
}
