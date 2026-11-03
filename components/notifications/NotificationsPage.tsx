"use client";

import { useEffect, useMemo, useState } from "react";

const READ_STORAGE_KEY = "auc-atlas-read-notifications";
const LEGACY_ORIGIN = "https://aucatlas.com";

type NotificationKind = "info" | "important" | "maintenance";

type SiteNotification = {
  id: string;
  title: string;
  message: string;
  type: NotificationKind;
  linkUrl: string;
  linkLabel: string;
  createdAt: string;
  expiresAt: string;
  read: boolean;
};

type NotificationsResponse = {
  signedIn?: boolean;
  notifications?: unknown;
  error?: string;
};

const migratedHtmlRoutes: Record<string, string> = {
  "index.html": "/",
  "professors.html": "/professors",
  "courses.html": "/courses",
  "gpa-calculator.html": "/gpa-calculator",
  "degree-progression.html": "/degree-progression",
  "notifications.html": "/notifications",
  "faq.html": "/faq",
  "privacy.html": "/privacy",
  "terms.html": "/terms",
  "login.html": "/login",
  "signup.html": "/signup",
  "forgot-password.html": "/forgot-password",
};

function cleanNotification(value: unknown): SiteNotification | null {
  if (!value || typeof value !== "object") return null;
  const source = value as Record<string, unknown>;
  const id = typeof source.id === "string" ? source.id : "";
  if (!id) return null;

  const rawType = typeof source.type === "string" ? source.type : "info";
  const type: NotificationKind =
    rawType === "important" || rawType === "maintenance" ? rawType : "info";

  return {
    id,
    title: typeof source.title === "string" ? source.title : "",
    message: typeof source.message === "string" ? source.message : "",
    type,
    linkUrl: typeof source.linkUrl === "string" ? source.linkUrl : "",
    linkLabel: typeof source.linkLabel === "string" ? source.linkLabel : "",
    createdAt: typeof source.createdAt === "string" ? source.createdAt : "",
    expiresAt: typeof source.expiresAt === "string" ? source.expiresAt : "",
    read: Boolean(source.read),
  };
}

function formatDate(value: string) {
  const date = new Date(value || "");
  if (Number.isNaN(date.getTime())) return "Date unavailable";

  return date.toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function getGuestReadIds() {
  try {
    const saved = JSON.parse(localStorage.getItem(READ_STORAGE_KEY) || "[]") as unknown;
    return new Set(
      Array.isArray(saved)
        ? saved.filter((id): id is string => typeof id === "string" && id.length <= 180)
        : [],
    );
  } catch {
    return new Set<string>();
  }
}

function saveGuestReadIds(ids: Set<string>) {
  try {
    localStorage.setItem(READ_STORAGE_KEY, JSON.stringify(Array.from(ids).slice(-500)));
  } catch {}
}

function dispatchNotificationUpdate() {
  window.dispatchEvent(new CustomEvent("aucAtlasNotificationsUpdated"));
}

function resolveNotificationHref(linkUrl: string) {
  const raw = linkUrl.replace(/^\/+/, "");
  if (!raw) return "";

  const match = raw.match(/^([^?#]+)([?#].*)?$/);
  const pathname = match?.[1] || raw;
  const suffix = match?.[2] || "";
  const migrated = migratedHtmlRoutes[pathname];

  if (migrated) return `${migrated}${suffix}`;
  if (!pathname.endsWith(".html")) return `/${raw}`;
  return `${LEGACY_ORIGIN}/${raw}`;
}

async function requestNotifications(init?: RequestInit) {
  const response = await fetch("/api/notifications", {
    credentials: "same-origin",
    cache: "no-store",
    headers: {
      Accept: "application/json",
      ...(init?.headers || {}),
    },
    ...init,
  });
  const data = (await response.json().catch(() => ({}))) as NotificationsResponse;

  if (!response.ok) {
    throw new Error(data.error || "Could not update notifications.");
  }

  return data;
}

export function NotificationsPage() {
  const [signedIn, setSignedIn] = useState(false);
  const [notifications, setNotifications] = useState<SiteNotification[]>([]);
  const [status, setStatus] = useState("Loading notifications...");
  const [statusError, setStatusError] = useState(false);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState("");
  const [markingAll, setMarkingAll] = useState(false);

  const unreadCount = useMemo(
    () => notifications.filter((notification) => !notification.read).length,
    [notifications],
  );

  useEffect(() => {
    let active = true;

    async function loadNotifications() {
      setLoading(true);
      setStatusError(false);
      setStatus("Loading notifications...");

      try {
        const data = await requestNotifications();
        if (!active) return;

        const isSignedIn = Boolean(data.signedIn);
        const guestReadIds = getGuestReadIds();
        const nextNotifications = (Array.isArray(data.notifications) ? data.notifications : [])
          .map(cleanNotification)
          .filter((notification): notification is SiteNotification => Boolean(notification))
          .map((notification) => ({
            ...notification,
            read: isSignedIn ? notification.read : guestReadIds.has(notification.id),
          }));

        setSignedIn(isSignedIn);
        setNotifications(nextNotifications);
        setStatus("");
        setLoading(false);
      } catch (error) {
        if (!active) return;
        setNotifications([]);
        setStatusError(true);
        setStatus(error instanceof Error ? error.message : "Could not load notifications.");
        setLoading(false);
      }
    }

    void loadNotifications();
    return () => {
      active = false;
    };
  }, []);

  async function markNotificationRead(notificationId: string) {
    setBusyId(notificationId);
    setStatusError(false);

    try {
      if (signedIn) {
        await requestNotifications({
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "markRead", notificationId }),
        });
      } else {
        const guestReadIds = getGuestReadIds();
        guestReadIds.add(notificationId);
        saveGuestReadIds(guestReadIds);
      }

      setNotifications((current) =>
        current.map((notification) =>
          notification.id === notificationId ? { ...notification, read: true } : notification,
        ),
      );
      setStatus("");
      dispatchNotificationUpdate();
    } catch (error) {
      setStatusError(true);
      setStatus(
        error instanceof Error ? error.message : "Could not mark the notification as read.",
      );
    } finally {
      setBusyId("");
    }
  }

  async function markAllRead() {
    setMarkingAll(true);
    setStatusError(false);

    try {
      if (signedIn) {
        await requestNotifications({
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "markAllRead" }),
        });
      } else {
        const guestReadIds = getGuestReadIds();
        notifications.forEach((notification) => guestReadIds.add(notification.id));
        saveGuestReadIds(guestReadIds);
      }

      setNotifications((current) => current.map((notification) => ({ ...notification, read: true })));
      setStatus("");
      dispatchNotificationUpdate();
    } catch (error) {
      setStatusError(true);
      setStatus(error instanceof Error ? error.message : "Could not mark all notifications as read.");
    } finally {
      setMarkingAll(false);
    }
  }

  function markLinkedNotification(notificationId: string) {
    if (signedIn) {
      void fetch("/api/notifications", {
        method: "POST",
        credentials: "same-origin",
        keepalive: true,
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ action: "markRead", notificationId }),
      }).catch(() => {});
      return;
    }

    const guestReadIds = getGuestReadIds();
    guestReadIds.add(notificationId);
    saveGuestReadIds(guestReadIds);
  }

  const countText = loading
    ? "Loading notifications..."
    : statusError && notifications.length === 0
      ? "Unavailable"
      : `${unreadCount} unread · ${notifications.length} ${notifications.length === 1 ? "notification" : "notifications"}`;

  return (
    <main className="notifications-page">
      <div className="notifications-inner">
        <header className="notifications-header">
          <div>
            <p className="notifications-kicker">AUC Atlas updates</p>
            <h1>Notifications</h1>
          </div>

          <p className="notifications-header-copy">
            Announcements, important updates, and scheduled maintenance from the AUC Atlas team.
          </p>
        </header>

        <section className="notifications-toolbar" aria-label="Notification controls">
          <div className="notifications-summary">
            <span>Inbox</span>
            <strong>{countText}</strong>
          </div>

          <button
            className="notifications-button"
            type="button"
            disabled={loading || unreadCount === 0 || markingAll}
            onClick={() => void markAllRead()}
          >
            Mark all as read
          </button>
        </section>

        {status ? (
          <p className={`notifications-status${statusError ? " is-error" : ""}`} aria-live="polite">
            {status}
          </p>
        ) : null}

        <section className="notifications-list" aria-live="polite">
          {!loading && !statusError && notifications.length === 0 ? (
            <div className="notifications-empty">There are no active notifications right now.</div>
          ) : null}

          {notifications.map((notification) => {
            const typeLabel =
              notification.type === "important"
                ? "Important"
                : notification.type === "maintenance"
                  ? "Maintenance"
                  : "Information";
            const typeClass = notification.type === "info" ? "" : ` is-${notification.type}`;
            const href = resolveNotificationHref(notification.linkUrl);

            return (
              <article
                className={`notification-card${notification.read ? "" : " is-unread"}`}
                key={notification.id}
              >
                <div className="notification-card-heading">
                  <h2 className="notification-card-title">
                    {notification.title || "AUC Atlas update"}
                  </h2>
                  <span className={`notification-type${typeClass}`}>{typeLabel}</span>
                </div>

                <p className="notification-message">{notification.message}</p>

                <div className="notification-card-footer">
                  <span className="notification-date">{formatDate(notification.createdAt)}</span>

                  {!notification.read || href ? (
                    <div className="notification-actions">
                      {!notification.read ? (
                        <button
                          className="notification-read-button"
                          type="button"
                          disabled={busyId === notification.id}
                          onClick={() => void markNotificationRead(notification.id)}
                        >
                          Mark as read
                        </button>
                      ) : null}

                      {href ? (
                        <a
                          className="notification-link"
                          href={href}
                          onClick={() => markLinkedNotification(notification.id)}
                        >
                          {notification.linkLabel || "View details"}
                        </a>
                      ) : null}
                    </div>
                  ) : null}
                </div>
              </article>
            );
          })}
        </section>
      </div>
    </main>
  );
}
