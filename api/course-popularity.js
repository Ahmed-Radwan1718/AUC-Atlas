const admin = require("../server/_lib/firebaseAdmin");
const {
  getRequestIp,
  consumeSecurityRateLimit
} = require("../server/_lib/securityRateLimits");

const POPULARITY_TIME_ZONE = "Africa/Cairo";
const POPULARITY_WINDOW_DAYS = 30;
const POPULAR_COURSE_LIMIT = 8;
const COURSE_VIEW_IP_WINDOW_MS =
  60 * 60 * 1000;
const COURSE_VIEW_MAX_POSTS_PER_IP = 120;
const COURSE_VIEW_REPEAT_WINDOW_MS =
  24 * 60 * 60 * 1000;
const COURSE_VIEW_MAX_PER_COURSE_AND_IP = 5;

function cleanString(value, maxLength) {
  return String(value || "").trim().replace(/\s+/g, " ").slice(0, maxLength);
}

function normalizeCourseCode(value) {
  return cleanString(value, 40).toUpperCase();
}

function isValidCourseCode(value) {
  return /^[A-Z0-9]{2,12}(?: [A-Z0-9]{1,12}){1,2}$/.test(value);
}

function getCairoDateKey(date) {
  const dateParts = new Intl.DateTimeFormat("en-US", {
    timeZone: POPULARITY_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).formatToParts(date);
  const calendarDate = {};

  dateParts.forEach(function (part) {
    if (part.type !== "literal") {
      calendarDate[part.type] = Number(part.value);
    }
  });

  return [
    String(calendarDate.year).padStart(4, "0"),
    String(calendarDate.month).padStart(2, "0"),
    String(calendarDate.day).padStart(2, "0")
  ].join("-");
}

function getPopularityWindowStart() {
  const todayParts = getCairoDateKey(new Date())
    .split("-")
    .map(Number);
  const startDate = new Date(Date.UTC(
    todayParts[0],
    todayParts[1] - 1,
    todayParts[2]
  ));

  startDate.setUTCDate(
    startDate.getUTCDate() - (POPULARITY_WINDOW_DAYS - 1)
  );

  return startDate.toISOString().slice(0, 10);
}

function getRequestBody(req) {
  if (typeof req.body === "string") {
    try {
      return JSON.parse(req.body || "{}");
    } catch (error) {
      return {};
    }
  }

  return req.body || {};
}

async function getPopularCourses(db) {
  const periodStart = getPopularityWindowStart();
  const snapshot = await db
    .collection("courseDailyViews")
    .where("date", ">=", periodStart)
    .get();
  const totals = Object.create(null);

  snapshot.forEach(function (doc) {
    const data = doc.data() || {};
    const courseCode = normalizeCourseCode(data.courseCode);
    const count = Math.max(0, Number(data.count) || 0);

    if (!isValidCourseCode(courseCode) || !count) {
      return;
    }

    totals[courseCode] = (totals[courseCode] || 0) + count;
  });

  const popularCourses = Object.keys(totals)
    .map(function (courseCode) {
      return {
        courseCode,
        views: totals[courseCode]
      };
    })
    .sort(function (a, b) {
      return b.views - a.views ||
        a.courseCode.localeCompare(b.courseCode);
    })
    .slice(0, POPULAR_COURSE_LIMIT);

  return {
    periodStart,
    popularCourses
  };
}

module.exports = async function handler(req, res) {
  if (req.method !== "GET" && req.method !== "POST") {
    res.setHeader("Allow", "GET, POST");

    return res.status(405).json({
      error: "Method not allowed"
    });
  }

  try {
    const db = admin.firestore();

    if (req.method === "GET") {
      const popularity = await getPopularCourses(db);

      res.setHeader(
        "Cache-Control",
        "public, max-age=60, s-maxage=300, stale-while-revalidate=600"
      );

      return res.status(200).json({
        periodDays: POPULARITY_WINDOW_DAYS,
        periodStart: popularity.periodStart,
        popularCourses: popularity.popularCourses
      });
    }

    const body = getRequestBody(req);
    const courseCode = normalizeCourseCode(body.courseCode);

    if (!isValidCourseCode(courseCode)) {
      return res.status(400).json({
        error: "Enter a valid course code."
      });
    }

    const date = getCairoDateKey(new Date());
    const requestIp = getRequestIp(req);

    try {
      await consumeSecurityRateLimit({
        scope: "course-popularity-ip",
        identifier: requestIp,
        maxAttempts:
          COURSE_VIEW_MAX_POSTS_PER_IP,
        windowMs:
          COURSE_VIEW_IP_WINDOW_MS,
        message:
          "Too many course-view requests from this connection."
      });

      await consumeSecurityRateLimit({
        scope:
          "course-popularity-course:" +
          date +
          ":" +
          courseCode,
        identifier: requestIp,
        maxAttempts:
          COURSE_VIEW_MAX_PER_COURSE_AND_IP,
        windowMs:
          COURSE_VIEW_REPEAT_WINDOW_MS,
        message:
          "This course has already received several views from this connection."
      });
    } catch (error) {
      if (error.statusCode !== 429) {
        throw error;
      }

      res.setHeader(
        "Cache-Control",
        "private, no-store, max-age=0"
      );

      return res.status(200).json({
        success: true,
        counted: false
      });
    }

    const viewRef = db
      .collection("courseDailyViews")
      .doc(date + "--" + encodeURIComponent(courseCode));

    await viewRef.set(
      {
        courseCode,
        date,
        count:
          admin.firestore.FieldValue.increment(1),
        updatedAt:
          admin.firestore.FieldValue.serverTimestamp()
      },
      {
        merge: true
      }
    );

    res.setHeader(
      "Cache-Control",
      "private, no-store, max-age=0"
    );

    return res.status(200).json({
      success: true,
      counted: true
    });
  } catch (error) {
    res.setHeader("Cache-Control", "private, no-store, max-age=0");

    return res.status(500).json({
      error: "Could not process course popularity."
    });
  }
};
