import type { NextApiHandler } from "next";
import type { QueryDocumentSnapshot } from "firebase-admin/firestore";
import { admin } from "@/server/backend/firebase";
import { getOptionalSiteSessionUser, getSiteSessionUser } from "@/server/backend/security";
import { consumeSecurityRateLimit } from "@/server/backend/security-rate-limits";
import { asBackendError, asRecord } from "@/server/backend/types";

const WRITE_WINDOW_MS = 60 * 60 * 1000;
const MAX_WRITES = 240;

function cleanString(value: unknown, maxLength: number): string {
  return String(value || "").trim().slice(0, maxLength);
}

function getTimestampMillis(value: unknown): number {
  if (!value) return 0;
  const timestamp = value as {
    toMillis?: () => number;
    toDate?: () => Date;
    seconds?: number;
    _seconds?: number;
  };
  if (typeof timestamp.toMillis === "function") return timestamp.toMillis();
  if (typeof timestamp.toDate === "function") return timestamp.toDate().getTime();
  if (typeof timestamp.seconds === "number") return timestamp.seconds * 1000;
  if (typeof timestamp._seconds === "number") return timestamp._seconds * 1000;
  const parsed = new Date(String(value));
  return Number.isNaN(parsed.getTime()) ? 0 : parsed.getTime();
}

function getTimestampIso(value: unknown): string {
  const millis = getTimestampMillis(value);
  return millis ? new Date(millis).toISOString() : "";
}

function cleanNotificationType(value: unknown): string {
  const type = cleanString(value, 20).toLowerCase();
  return ["info", "important", "maintenance"].includes(type) ? type : "info";
}

function cleanInternalLink(value: unknown): string {
  const link = cleanString(value, 500);
  if (!link) return "";
  const normalized = link.replace(/^\/+/, "");
  if (
    !normalized ||
    /^(?:[a-z][a-z0-9+.-]*:|\/\/)/i.test(link) ||
    /[\s\\]/.test(link) ||
    !/^[A-Za-z0-9][A-Za-z0-9._~!$&'()*+,;=:@%/?#-]*$/.test(normalized)
  ) {
    return "";
  }
  return normalized;
}

function isNotificationActive(data: Record<string, unknown>): boolean {
  const expiresAtMillis = getTimestampMillis(data.expiresAt || data.expiresAtIso);
  return data.published !== false && (!expiresAtMillis || expiresAtMillis > Date.now());
}

function serializeNotification(
  doc: QueryDocumentSnapshot,
  readNotificationIds: Set<string>,
) {
  const data = doc.data() || {};
  return {
    id: doc.id,
    title: cleanString(data.title, 120),
    message: cleanString(data.message, 1600),
    type: cleanNotificationType(data.type),
    linkUrl: cleanInternalLink(data.linkUrl),
    linkLabel: cleanString(data.linkLabel, 60),
    createdAt: getTimestampIso(data.createdAt || data.createdAtIso),
    expiresAt: getTimestampIso(data.expiresAt || data.expiresAtIso),
    read: readNotificationIds.has(doc.id),
  };
}

async function getActiveNotifications() {
  const snapshot = await admin
    .firestore()
    .collection("siteNotifications")
    .orderBy("createdAtIso", "desc")
    .limit(20)
    .get();
  return snapshot.docs.filter((doc) => {
    const data = doc.data() || {};
    return (
      isNotificationActive(data) &&
      Boolean(cleanString(data.title, 120)) &&
      Boolean(cleanString(data.message, 1600))
    );
  });
}

async function getReadNotificationIds(uid: string, notificationIds: string[]) {
  const safeIds = Array.from(
    new Set(
      notificationIds
        .map((id) => cleanString(id, 180))
        .filter((id) => /^[A-Za-z0-9_-]{6,180}$/.test(id)),
    ),
  ).slice(0, 20);
  if (!uid || !safeIds.length) return new Set<string>();
  const snapshot = await admin
    .firestore()
    .collection("users")
    .doc(uid)
    .collection("notificationReads")
    .where(admin.firestore.FieldPath.documentId(), "in", safeIds)
    .get();
  return new Set(snapshot.docs.map((doc) => doc.id));
}

const handler: NextApiHandler = async (req, res) => {
  try {
    res.setHeader("Cache-Control", "no-store");
    if (req.method === "GET") {
      const viewer = await getOptionalSiteSessionUser(req, { checkRevoked: true });
      const activeNotifications = await getActiveNotifications();
      const readNotificationIds = await getReadNotificationIds(
        viewer?.uid || "",
        activeNotifications.map((doc) => doc.id),
      );
      const summaryOnly = String(req.query.summary || "") === "1";
      const notifications = activeNotifications.map((doc) =>
        serializeNotification(doc, readNotificationIds),
      );
      return res.status(200).json({
        success: true,
        signedIn: Boolean(viewer),
        unreadCount: notifications.filter((notification) => !notification.read).length,
        notificationIds: notifications.map((notification) => notification.id),
        notifications: summaryOnly ? [] : notifications,
      });
    }

    if (req.method !== "POST") {
      res.setHeader("Allow", "GET, POST");
      return res.status(405).json({ error: "Method not allowed" });
    }

    const viewer = await getSiteSessionUser(req, { checkRevoked: true });
    await consumeSecurityRateLimit({
      scope: "notification-read-write-user",
      identifier: viewer.uid,
      maxAttempts: MAX_WRITES,
      windowMs: WRITE_WINDOW_MS,
      message: "Too many notification updates. Please try again later.",
    });

    const body = asRecord(req.body);
    const action = cleanString(body.action, 40);
    const readCollection = admin
      .firestore()
      .collection("users")
      .doc(viewer.uid)
      .collection("notificationReads");

    if (action === "markRead") {
      const notificationId = cleanString(body.notificationId, 180);
      if (!/^[A-Za-z0-9_-]{6,180}$/.test(notificationId)) {
        return res.status(400).json({ error: "Notification not found." });
      }
      const notificationDoc = await admin
        .firestore()
        .collection("siteNotifications")
        .doc(notificationId)
        .get();
      if (!notificationDoc.exists || !isNotificationActive(notificationDoc.data() || {})) {
        return res.status(404).json({ error: "Notification not found." });
      }
      await readCollection.doc(notificationId).set(
        { readAt: admin.firestore.FieldValue.serverTimestamp() },
        { merge: true },
      );
      return res.status(200).json({ success: true });
    }

    if (action === "markAllRead") {
      const activeNotifications = await getActiveNotifications();
      if (activeNotifications.length) {
        const batch = admin.firestore().batch();
        for (const doc of activeNotifications) {
          batch.set(
            readCollection.doc(doc.id),
            { readAt: admin.firestore.FieldValue.serverTimestamp() },
            { merge: true },
          );
        }
        await batch.commit();
      }
      return res.status(200).json({ success: true });
    }

    return res.status(400).json({ error: "Choose a valid notification action." });
  } catch (unknownError) {
    const error = asBackendError(unknownError, "Could not update notifications.");
    if (error.retryAfterSeconds) res.setHeader("Retry-After", String(error.retryAfterSeconds));
    return res.status(error.statusCode || 500).json({
      error: error.message || "Could not update notifications.",
    });
  }
};

export default handler;
