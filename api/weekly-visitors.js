const crypto = require("crypto");
const admin = require("../server/_lib/firebaseAdmin");
const {
  getRequestIp,
  consumeSecurityRateLimit
} = require("../server/_lib/securityRateLimits");

const VISITOR_TIME_ZONE = "Africa/Cairo";
const VISITOR_COOKIE_NAME =
  "aucAtlasUniqueVisitor";
const VISITOR_COOKIE_MAX_AGE_SECONDS =
  365 * 24 * 60 * 60;
const VISITOR_COOKIE_PATTERN =
  /^[A-Za-z0-9_-]{43}$/;
const VISITOR_RATE_LIMIT_WINDOW_MS =
  60 * 60 * 1000;
const VISITOR_MAX_POSTS_PER_WINDOW = 30;
const AUTOMATED_VISITOR_PATTERN =
  /(bot|crawler|spider|slurp|archiver|preview|fetcher|monitor|headless|phantomjs|selenium|playwright|puppeteer|lighthouse|pagespeed|google-extended|chatgpt-user|anthropic-ai|claude-user|cohere-ai|perplexity-user|bytespider|ccbot|diffbot|imagesiftbot|omgilibot|youbot|applebot-extended|meta-externalagent|facebookexternalhit|bingpreview|python-requests|python-urllib|curl\/|wget\/|node-fetch|axios\/|postmanruntime)/i;  

function getRequestUserAgent(req) {
  const headers =
    req && req.headers
      ? req.headers
      : {};
  const value =
    headers["user-agent"] ||
    headers["User-Agent"] ||
    "";

  return Array.isArray(value)
    ? String(value[0] || "")
    : String(value || "");
}

function isAutomatedVisitor(req) {
  const userAgent =
    getRequestUserAgent(req).trim();

  return (
    !userAgent ||
    AUTOMATED_VISITOR_PATTERN.test(
      userAgent
    )
  );
}

function getRequestHeader(req, name) {
  const headers =
    req && req.headers
      ? req.headers
      : {};
  const value =
    headers[
      String(name || "").toLowerCase()
    ] ||
    headers[name] ||
    "";

  return Array.isArray(value)
    ? String(value[0] || "")
    : String(value || "");
}

function getRequestCookie(req, name) {
  const cookieHeader =
    getRequestHeader(req, "cookie");
  const cookiePrefix = `${name}=`;
  const matchingCookie = cookieHeader
    .split(";")
    .map(function (part) {
      return part.trim();
    })
    .find(function (part) {
      return part.startsWith(cookiePrefix);
    });

  return matchingCookie
    ? matchingCookie.slice(
        cookiePrefix.length
      )
    : "";
}

function requestIsSecure(req) {
  const forwardedProtocol =
    getRequestHeader(
      req,
      "x-forwarded-proto"
    )
      .split(",")[0]
      .trim()
      .toLowerCase();

  return (
    forwardedProtocol === "https" ||
    Boolean(
      req &&
      req.socket &&
      req.socket.encrypted
    ) ||
    process.env.NODE_ENV === "production"
  );
}

function setVisitorCookie(
  req,
  res,
  visitorId
) {
  const cookieAttributes = [
    `${VISITOR_COOKIE_NAME}=${visitorId}`,
    "Path=/",
    `Max-Age=${VISITOR_COOKIE_MAX_AGE_SECONDS}`,
    "HttpOnly",
    "SameSite=Lax"
  ];

  if (requestIsSecure(req)) {
    cookieAttributes.push("Secure");
  }

  res.setHeader(
    "Set-Cookie",
    cookieAttributes.join("; ")
  );
}

function getOrCreateVisitorId(req, res) {
  const existingVisitorId =
    getRequestCookie(
      req,
      VISITOR_COOKIE_NAME
    );

  if (
    VISITOR_COOKIE_PATTERN.test(
      existingVisitorId
    )
  ) {
    return existingVisitorId;
  }

  const visitorId = crypto
    .randomBytes(32)
    .toString("base64url");

  setVisitorCookie(req, res, visitorId);

  return visitorId;
}

function getWeeklyVisitorHash(
  visitorId,
  weekStart
) {
  return crypto
    .createHash("sha256")
    .update(`${weekStart}:${visitorId}`)
    .digest("hex");
}

function getCurrentWeekStart() {
  const dateParts = new Intl.DateTimeFormat("en-US", {
    timeZone: VISITOR_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).formatToParts(new Date());

  const calendarDate = {};

  dateParts.forEach(function (part) {
    if (part.type !== "literal") {
      calendarDate[part.type] = Number(part.value);
    }
  });

  const cairoDate = new Date(Date.UTC(
    calendarDate.year,
    calendarDate.month - 1,
    calendarDate.day
  ));
  const daysSinceMonday =
    (cairoDate.getUTCDay() + 6) % 7;

  cairoDate.setUTCDate(
    cairoDate.getUTCDate() - daysSinceMonday
  );

  return cairoDate.toISOString().slice(0, 10);
}

async function getWeeklyVisitCount(countRef) {
  const countSnapshot = await countRef.get();
  const countData = countSnapshot.exists
    ? countSnapshot.data() || {}
    : {};

  return Math.max(0, Number(countData.count) || 0);
}

module.exports = async function handler(req, res) {
  if (req.method !== "GET" && req.method !== "POST") {
    res.setHeader("Allow", "GET, POST");

    return res.status(405).json({
      error: "Method not allowed"
    });
  }

  res.setHeader("Cache-Control", "private, no-store, max-age=0");

  try {
    const db = admin.firestore();
    const weekStart = getCurrentWeekStart();
    const countRef = db
      .collection(
        "weeklyUniqueVisitorCounts"
      )
      .doc(weekStart);

    if (req.method === "GET") {
      const weeklyVisits =
        await getWeeklyVisitCount(countRef);

      return res.status(200).json({
        weeklyVisits,
        weekStart
      });
    }

    if (isAutomatedVisitor(req)) {
      return res.status(200).json({
        weeklyVisits:
          await getWeeklyVisitCount(countRef),
        weekStart,
        counted: false
      });
    }

    const visitorId =
      getOrCreateVisitorId(req, res);
    const visitorRef = countRef
      .collection("visitors")
      .doc(
        getWeeklyVisitorHash(
          visitorId,
          weekStart
        )
      );
    const existingVisitorSnapshot =
      await visitorRef.get();

    if (existingVisitorSnapshot.exists) {
      return res.status(200).json({
        weeklyVisits:
          await getWeeklyVisitCount(countRef),
        weekStart,
        counted: false
      });
    }

    try {
      await consumeSecurityRateLimit({
        scope:
          "weekly-unique-visitors-ip",
        identifier: getRequestIp(req),
        maxAttempts:
          VISITOR_MAX_POSTS_PER_WINDOW,
        windowMs:
          VISITOR_RATE_LIMIT_WINDOW_MS,
        message:
          "Too many visitor-count requests from this connection."
      });
    } catch (error) {
      if (error.statusCode !== 429) {
        throw error;
      }

      return res.status(200).json({
        weeklyVisits:
          await getWeeklyVisitCount(countRef),
        weekStart,
        counted: false
      });
    }

    let weeklyVisits = 0;
    let counted = false;

    await db.runTransaction(
      async function (transaction) {
        const visitorSnapshot =
          await transaction.get(visitorRef);
        const countSnapshot =
          await transaction.get(countRef);
        const countData =
          countSnapshot.exists
            ? countSnapshot.data() || {}
            : {};

        weeklyVisits = Math.max(
          0,
          Number(countData.count) || 0
        );

        if (visitorSnapshot.exists) {
          return;
        }

        weeklyVisits += 1;
        counted = true;

        transaction.set(visitorRef, {
          weekStart,
          firstSeenAt:
            admin.firestore.FieldValue.serverTimestamp()
        });

        transaction.set(
          countRef,
          {
            count: weeklyVisits,
            weekStart,
            timeZone: VISITOR_TIME_ZONE,
            updatedAt:
              admin.firestore.FieldValue.serverTimestamp()
          },
          {
            merge: true
          }
        );
      }
    );

    return res.status(200).json({
      weeklyVisits,
      weekStart,
      counted
    });
  } catch (error) {
    return res.status(500).json({
      error: "Could not process the weekly visit count."
    });
  }
};
