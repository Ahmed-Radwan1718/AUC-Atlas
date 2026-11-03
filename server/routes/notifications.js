const admin = require("../_lib/firebaseAdmin");
const {
  getOptionalSiteSessionUser,
  getSiteSessionUser
} = require("../_lib/securityHelpers");
const {
  consumeSecurityRateLimit
} = require("../_lib/securityRateLimits");

const NOTIFICATION_WRITE_WINDOW_MS =
  60 * 60 * 1000;
const NOTIFICATION_MAX_WRITES = 240;

function cleanString(value, maxLength) {
  return String(value || "")
    .trim()
    .slice(0, maxLength);
}

function getRequestBody(req) {
  if (
    req.body &&
    typeof req.body === "object"
  ) {
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

function getTimestampMillis(value) {
  if (!value) {
    return 0;
  }

  if (
    typeof value.toMillis === "function"
  ) {
    return value.toMillis();
  }

  if (
    typeof value.toDate === "function"
  ) {
    return value.toDate().getTime();
  }

  if (typeof value.seconds === "number") {
    return value.seconds * 1000;
  }

  if (
    typeof value._seconds === "number"
  ) {
    return value._seconds * 1000;
  }

  const parsedDate = new Date(value);

  return Number.isNaN(parsedDate.getTime())
    ? 0
    : parsedDate.getTime();
}

function getTimestampIso(value) {
  const millis = getTimestampMillis(value);

  return millis
    ? new Date(millis).toISOString()
    : "";
}

function cleanNotificationType(value) {
  const type = cleanString(
    value,
    20
  ).toLowerCase();

  return [
    "info",
    "important",
    "maintenance"
  ].includes(type)
    ? type
    : "info";
}

function cleanInternalLink(value) {
  const link = cleanString(value, 500);

  if (!link) {
    return "";
  }

  const normalized = link.replace(
    /^\/+/,
    ""
  );

  if (
    !normalized ||
    /^(?:[a-z][a-z0-9+.-]*:|\/\/)/i.test(
      link
    ) ||
    /[\s\\]/.test(link) ||
    !/^[A-Za-z0-9][A-Za-z0-9._~!$&'()*+,;=:@%/?#-]*$/.test(
      normalized
    )
  ) {
    return "";
  }

  return normalized;
}

function isNotificationActive(data) {
  const source = data || {};
  const expiresAtMillis =
    getTimestampMillis(
      source.expiresAt ||
      source.expiresAtIso
    );

  return (
    source.published !== false &&
    (
      !expiresAtMillis ||
      expiresAtMillis > Date.now()
    )
  );
}

function serializeNotification(
  doc,
  readNotificationIds
) {
  const data = doc.data() || {};

  return {
    id: doc.id,
    title: cleanString(data.title, 120),
    message: cleanString(
      data.message,
      1600
    ),
    type: cleanNotificationType(
      data.type
    ),
    linkUrl: cleanInternalLink(
      data.linkUrl
    ),
    linkLabel: cleanString(
      data.linkLabel,
      60
    ),
    createdAt: getTimestampIso(
      data.createdAt ||
      data.createdAtIso
    ),
    expiresAt: getTimestampIso(
      data.expiresAt ||
      data.expiresAtIso
    ),
    read: Boolean(
      readNotificationIds &&
      readNotificationIds.has(doc.id)
    )
  };
}

async function getActiveNotifications() {
  const snapshot = await admin
    .firestore()
    .collection("siteNotifications")
    .orderBy("createdAtIso", "desc")
    .limit(20)
    .get();
  const notifications = [];

  snapshot.forEach(function (doc) {
    const data = doc.data() || {};

    if (
      isNotificationActive(data) &&
      cleanString(data.title, 120) &&
      cleanString(data.message, 1600)
    ) {
      notifications.push({
        doc,
        data
      });
    }
  });

  return notifications;
}

async function getReadNotificationIds(
  uid,
  notificationIds
) {
  const safeNotificationIds =
    Array.from(
      new Set(
        (
          Array.isArray(notificationIds)
            ? notificationIds
            : []
        )
          .map(function (id) {
            return cleanString(id, 180);
          })
          .filter(function (id) {
            return /^[A-Za-z0-9_-]{6,180}$/.test(
              id
            );
          })
      )
    ).slice(0, 20);

  if (
    !uid ||
    !safeNotificationIds.length
  ) {
    return new Set();
  }

  const snapshot = await admin
    .firestore()
    .collection("users")
    .doc(uid)
    .collection("notificationReads")
    .where(
      admin.firestore.FieldPath.documentId(),
      "in",
      safeNotificationIds
    )
    .get();
  const ids = new Set();

  snapshot.forEach(function (doc) {
    ids.add(doc.id);
  });

  return ids;
}

module.exports = async function handler(
  req,
  res
) {
  try {
    res.setHeader(
      "Cache-Control",
      "no-store"
    );

    if (req.method === "GET") {
      const viewer =
        await getOptionalSiteSessionUser(
          req,
          {
            checkRevoked: true
          }
        );
      const activeNotifications =
        await getActiveNotifications();
      const activeNotificationIds =
        activeNotifications.map(
          function (entry) {
            return entry.doc.id;
          }
        );
      const readNotificationIds =
        await getReadNotificationIds(
          viewer ? viewer.uid : "",
          activeNotificationIds
        );
      const summaryOnly =
        String(
          (
            req.query &&
            req.query.summary
          ) ||
          ""
        ) === "1";
      const notifications =
        activeNotifications.map(
          function (entry) {
            return serializeNotification(
              entry.doc,
              readNotificationIds
            );
          }
        );
      const unreadCount =
        notifications.filter(
          function (notification) {
            return !notification.read;
          }
        ).length;

      return res.status(200).json({
        success: true,
        signedIn: Boolean(viewer),
        unreadCount,
        notificationIds:
          notifications.map(
            function (notification) {
              return notification.id;
            }
          ),
        notifications:
          summaryOnly
            ? []
            : notifications
      });
    }

    if (req.method !== "POST") {
      res.setHeader("Allow", "GET, POST");

      return res.status(405).json({
        error: "Method not allowed"
      });
    }

    const viewer =
      await getSiteSessionUser(req, {
        checkRevoked: true
      });

    await consumeSecurityRateLimit({
      scope:
        "notification-read-write-user",
      identifier: viewer.uid,
      maxAttempts:
        NOTIFICATION_MAX_WRITES,
      windowMs:
        NOTIFICATION_WRITE_WINDOW_MS,
      message:
        "Too many notification updates. Please try again later."
    });

    const body = getRequestBody(req);
    const action = cleanString(
      body.action,
      40
    );
    const readCollection = admin
      .firestore()
      .collection("users")
      .doc(viewer.uid)
      .collection("notificationReads");

    if (action === "markRead") {
      const notificationId =
        cleanString(
          body.notificationId,
          180
        );

      if (
        !/^[A-Za-z0-9_-]{6,180}$/.test(
          notificationId
        )
      ) {
        return res.status(400).json({
          error:
            "Notification not found."
        });
      }

      const notificationDoc =
        await admin
          .firestore()
          .collection(
            "siteNotifications"
          )
          .doc(notificationId)
          .get();

      if (
        !notificationDoc.exists ||
        !isNotificationActive(
          notificationDoc.data() || {}
        )
      ) {
        return res.status(404).json({
          error:
            "Notification not found."
        });
      }

      await readCollection
        .doc(notificationId)
        .set(
          {
            readAt:
              admin.firestore
                .FieldValue
                .serverTimestamp()
          },
          {
            merge: true
          }
        );

      return res.status(200).json({
        success: true
      });
    }

    if (action === "markAllRead") {
      const activeNotifications =
        await getActiveNotifications();

      if (activeNotifications.length) {
        const batch =
          admin.firestore().batch();

        activeNotifications.forEach(
          function (entry) {
            batch.set(
              readCollection.doc(
                entry.doc.id
              ),
              {
                readAt:
                  admin.firestore
                    .FieldValue
                    .serverTimestamp()
              },
              {
                merge: true
              }
            );
          }
        );

        await batch.commit();
      }

      return res.status(200).json({
        success: true
      });
    }

    return res.status(400).json({
      error:
        "Choose a valid notification action."
    });
  } catch (error) {
    if (error.retryAfterSeconds) {
      res.setHeader(
        "Retry-After",
        String(
          error.retryAfterSeconds
        )
      );
    }

    return res
      .status(error.statusCode || 500)
      .json({
        error:
          error.message ||
          "Could not update notifications."
      });
  }
};
