const crypto = require("crypto");
const admin = require("../server/_lib/firebaseAdmin");

function cleanString(value, maxLength) {
  return String(value || "")
    .trim()
    .replace(/\s+/g, " ")
    .slice(0, maxLength);
}

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

function getCurrentWeekKey(date) {
  const currentDate = new Date(date);
  const day = currentDate.getUTCDay() || 7;
  const weekStart = new Date(
    Date.UTC(
      currentDate.getUTCFullYear(),
      currentDate.getUTCMonth(),
      currentDate.getUTCDate()
    )
  );

  weekStart.setUTCDate(weekStart.getUTCDate() - day + 1);

  return weekStart.toISOString().slice(0, 10);
}

function hashVisitorId(visitorId) {
  return crypto
    .createHash("sha256")
    .update(visitorId)
    .digest("hex");
}

async function getWeeklyVisitorCount(countRef) {
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
    const weekKey = getCurrentWeekKey(new Date());
    const countRef = db
      .collection("weeklyVisitorCounts")
      .doc(weekKey);

    if (req.method === "GET") {
      const weeklyVisitors =
        await getWeeklyVisitorCount(countRef);

      return res.status(200).json({
        weekKey,
        weeklyVisitors
      });
    }

    const body = getRequestBody(req);
    const visitorId = cleanString(body.visitorId, 160);

    if (
      !visitorId ||
      !/^[A-Za-z0-9._:-]{16,160}$/.test(visitorId)
    ) {
      return res.status(400).json({
        error: "A valid visitor ID is required."
      });
    }

    const visitorHash = hashVisitorId(visitorId);
    const visitorRef = db
      .collection("weeklyVisitors")
      .doc(weekKey + "_" + visitorHash);

    let weeklyVisitors = 0;

    await db.runTransaction(async function (transaction) {
      const visitorSnapshot =
        await transaction.get(visitorRef);
      const countSnapshot =
        await transaction.get(countRef);
      const countData = countSnapshot.exists
        ? countSnapshot.data() || {}
        : {};

      weeklyVisitors = Math.max(
        0,
        Number(countData.count) || 0
      );

      if (visitorSnapshot.exists) {
        return;
      }

      weeklyVisitors += 1;

      transaction.create(visitorRef, {
        weekKey,
        visitorHash,
        firstSeenAt:
          admin.firestore.FieldValue.serverTimestamp()
      });

      transaction.set(
        countRef,
        {
          weekKey,
          count: weeklyVisitors,
          updatedAt:
            admin.firestore.FieldValue.serverTimestamp()
        },
        {
          merge: true
        }
      );
    });

    return res.status(200).json({
      weekKey,
      weeklyVisitors
    });
  } catch (error) {
    return res.status(500).json({
      error: "Could not update the weekly visitor count."
    });
  }
};
