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

function hashVisitorId(visitorId) {
  return crypto
    .createHash("sha256")
    .update(visitorId)
    .digest("hex");
}

async function getUniqueVisitorCount(countRef) {
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
    const countRef = db
      .collection("uniqueVisitorCounts")
      .doc("all-time");

    if (req.method === "GET") {
      const uniqueVisitors =
        await getUniqueVisitorCount(countRef);

      return res.status(200).json({
        uniqueVisitors
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
      .collection("uniqueVisitors")
      .doc(visitorHash);

    let uniqueVisitors = 0;

    await db.runTransaction(async function (transaction) {
      const visitorSnapshot =
        await transaction.get(visitorRef);
      const countSnapshot =
        await transaction.get(countRef);
      const countData = countSnapshot.exists
        ? countSnapshot.data() || {}
        : {};

      uniqueVisitors = Math.max(
        0,
        Number(countData.count) || 0
      );

      if (visitorSnapshot.exists) {
        return;
      }

      uniqueVisitors += 1;

      transaction.create(visitorRef, {
        visitorHash,
        firstSeenAt:
          admin.firestore.FieldValue.serverTimestamp()
      });

      transaction.set(
        countRef,
        {
          count: uniqueVisitors,
          updatedAt:
            admin.firestore.FieldValue.serverTimestamp()
        },
        {
          merge: true
        }
      );
    });

    return res.status(200).json({
      uniqueVisitors
    });
  } catch (error) {
    return res.status(500).json({
      error: "Could not update the unique visitor count."
    });
  }
};
