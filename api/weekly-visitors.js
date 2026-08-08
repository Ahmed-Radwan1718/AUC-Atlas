const admin = require("../server/_lib/firebaseAdmin");

const VISITOR_TIME_ZONE = "Africa/Cairo";

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
      .collection("weeklyVisitCounts")
      .doc(weekStart);

    if (req.method === "GET") {
      const weeklyVisits =
        await getWeeklyVisitCount(countRef);

      return res.status(200).json({
        weeklyVisits,
        weekStart
      });
    }

    let weeklyVisits = 0;

    await db.runTransaction(async function (transaction) {
      const countSnapshot =
        await transaction.get(countRef);
      const countData = countSnapshot.exists
        ? countSnapshot.data() || {}
        : {};

      weeklyVisits =
        Math.max(
          0,
          Number(countData.count) || 0
        ) + 1;

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
    });

    return res.status(200).json({
      weeklyVisits,
      weekStart
    });
  } catch (error) {
    return res.status(500).json({
      error: "Could not process the weekly visit count."
    });
  }
};
