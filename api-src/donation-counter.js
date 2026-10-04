const admin = require("../server/_lib/firebaseAdmin");

function getTimestampIso(value) {
  if (!value) return "";
  if (typeof value.toDate === "function") return value.toDate().toISOString();
  if (typeof value.seconds === "number") return new Date(value.seconds * 1000).toISOString();
  if (typeof value._seconds === "number") return new Date(value._seconds * 1000).toISOString();

  const parsedDate = new Date(value);
  return Number.isNaN(parsedDate.getTime()) ? "" : parsedDate.toISOString();
}

function cleanAmount(value, fallbackValue) {
  const amount = Number(value);
  return Number.isFinite(amount) && amount >= 0
    ? Math.round(amount * 100) / 100
    : fallbackValue;
}

module.exports = async function handler(req, res) {
  try {
    if (req.method !== "GET") {
      res.setHeader("Allow", "GET");
      return res.status(405).json({ error: "Method not allowed" });
    }

    const counterDoc = await admin.firestore()
      .collection("siteSettings")
      .doc("donationCounter")
      .get();
    const counterData = counterDoc.exists ? counterDoc.data() || {} : {};

    res.setHeader(
      "Cache-Control",
      "public, max-age=300, s-maxage=3600, stale-while-revalidate=86400"
    );
    return res.status(200).json({
      currentAmount: cleanAmount(counterData.currentAmount, 0),
      goalAmount: cleanAmount(counterData.goalAmount, 100),
      currency: counterData.currency === "EGP" ? "EGP" : "USD",
      updatedAt: getTimestampIso(counterData.updatedAt)
    });
  } catch (error) {
    res.setHeader("Cache-Control", "no-store");
    return res.status(500).json({
      error: "Could not load the donation counter."
    });
  }
};
