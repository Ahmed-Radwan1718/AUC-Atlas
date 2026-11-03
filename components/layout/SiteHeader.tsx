"use client";

import { useEffect, useRef, useState } from "react";

const ASSET_BASE = "https://aucatlas.com";
const NOTIFICATION_READ_STORAGE_KEY = "auc-atlas-read-notifications";
const NOTIFICATION_SUMMARY_STORAGE_KEY = "auc-atlas-notification-summary";
const NOTIFICATION_SUMMARY_CACHE_DURATION_MS = 30 * 60 * 1000;

type CurrentUser = {
  photoURL?: string;
};

type NotificationSummary = {
  signedIn?: boolean;
  unreadCount?: number;
  notificationIds?: unknown;
};

function getLocalReadNotificationIds() {
  try {
    const saved = JSON.parse(localStorage.getItem(NOTIFICATION_READ_STORAGE_KEY) || "[]") as unknown;
    return new Set(
      Array.isArray(saved)
        ? saved.filter((id): id is string => typeof id === "string" && id.length <= 180)
        : [],
    );
  } catch {
    return new Set<string>();
  }
}

function getCachedNotificationSummary(): NotificationSummary | null {
  try {
    const cached = JSON.parse(
      sessionStorage.getItem(NOTIFICATION_SUMMARY_STORAGE_KEY) || "null",
    ) as { savedAt?: unknown; data?: unknown } | null;

    if (
      !cached ||
      !cached.data ||
      typeof cached.data !== "object" ||
      Date.now() - Number(cached.savedAt || 0) > NOTIFICATION_SUMMARY_CACHE_DURATION_MS
    ) {
      return null;
    }

    return cached.data as NotificationSummary;
  } catch {
    return null;
  }
}

function cacheNotificationSummary(data: NotificationSummary) {
  try {
    sessionStorage.setItem(
      NOTIFICATION_SUMMARY_STORAGE_KEY,
      JSON.stringify({ savedAt: Date.now(), data }),
    );
  } catch {}
}

function clearNotificationSummaryCache() {
  try {
    sessionStorage.removeItem(NOTIFICATION_SUMMARY_STORAGE_KEY);
  } catch {}
}

export function SiteHeader() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const accountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let active = true;

    fetch("/api/me", {
      credentials: "same-origin",
      cache: "no-store",
      headers: { Accept: "application/json" },
    })
      .then((response) => response.json())
      .then((data) => {
        if (active && data?.signedIn && data?.user) setUser(data.user);
      })
      .catch(() => {});

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;
    const isNotificationsPage = /^\/notifications\/?$/.test(window.location.pathname);

    async function loadNotificationState(force = false) {
      if (isNotificationsPage) return;

      try {
        let data = force ? null : getCachedNotificationSummary();

        if (!data) {
          const response = await fetch("/api/notifications?summary=1", {
            method: "GET",
            credentials: "same-origin",
            cache: "no-store",
            headers: { Accept: "application/json" },
          });
          data = (await response.json().catch(() => ({}))) as NotificationSummary;
          if (!response.ok) throw new Error("Could not load notifications.");
          cacheNotificationSummary(data);
        }

        if (!active) return;
        const notificationIds = Array.isArray(data.notificationIds)
          ? data.notificationIds.filter(
              (id): id is string => typeof id === "string" && id.length <= 180,
            )
          : [];
        const localReadIds = getLocalReadNotificationIds();
        const count = data.signedIn
          ? Math.max(0, Number(data.unreadCount) || 0)
          : notificationIds.filter((id) => !localReadIds.has(id)).length;

        setUnreadCount(count);
      } catch {
        if (active) setUnreadCount(0);
      }
    }

    function handleNotificationsUpdated() {
      clearNotificationSummaryCache();
      void loadNotificationState(true);
    }

    function handleStorage(event: StorageEvent) {
      if (event.key === NOTIFICATION_READ_STORAGE_KEY) handleNotificationsUpdated();
    }

    void loadNotificationState();
    window.addEventListener("aucAtlasNotificationsUpdated", handleNotificationsUpdated);
    window.addEventListener("storage", handleStorage);

    return () => {
      active = false;
      window.removeEventListener("aucAtlasNotificationsUpdated", handleNotificationsUpdated);
      window.removeEventListener("storage", handleStorage);
    };
  }, []);

  useEffect(() => {
    function onPointerDown(event: MouseEvent) {
      if (
        accountOpen &&
        accountRef.current &&
        !accountRef.current.contains(event.target as Node)
      ) {
        setAccountOpen(false);
      }
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setAccountOpen(false);
        setMobileOpen(false);
      }
    }

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [accountOpen]);

  useEffect(() => {
    document.body.classList.toggle("nav-menu-open", mobileOpen);
    return () => document.body.classList.remove("nav-menu-open");
  }, [mobileOpen]);

  async function logout() {
    try {
      await fetch("/api/logout", { method: "POST", credentials: "same-origin" });
    } catch {}

    setUser(null);
    setAccountOpen(false);
  }

  return (
    <>
      <header className="site-header">
        <a href="/" className="site-header-logo" aria-label="AUC Atlas home">
          <span className="site-header-logo-auc">AUC</span>
          <span className="site-header-logo-atlas">Atlas</span>
        </a>

        <nav className="site-header-nav" aria-label="Main navigation">
          <a href="/professors">Professors</a>
          <a href="/courses">Courses</a>
          <a href="/gpa-calculator">GPA Calculator</a>
        </nav>

        <div className="site-header-actions">
          <a
            className="site-notification-button"
            href="/notifications"
            aria-label={
              unreadCount ? `Notifications, ${unreadCount} unread` : "Notifications"
            }
          >
            <img src={`${ASSET_BASE}/bell.png`} alt="" />
            {unreadCount > 0 ? (
              <span className="site-notification-badge">
                {unreadCount > 99 ? "99+" : unreadCount}
              </span>
            ) : null}
          </a>

          <div className="floating-account-widget" ref={accountRef}>
            <button
              className="floating-account-button"
              type="button"
              aria-label="Open account menu"
              aria-expanded={accountOpen}
              onClick={() => setAccountOpen((value) => !value)}
            >
              <img
                src={user?.photoURL || `${ASSET_BASE}/user.png`}
                alt={user?.photoURL ? "Account profile photo" : "Account"}
                className={user?.photoURL ? "has-profile-photo" : undefined}
              />
            </button>

            <div
              className={`floating-account-menu${accountOpen ? " is-open" : ""}`}
              hidden={!accountOpen}
            >
              {!user ? (
                <a href="/login" className="floating-account-menu-link">
                  <img src={`${ASSET_BASE}/user.png`} alt="" />
                  <span>Login</span>
                </a>
              ) : (
                <>
                  <a href="/accounts" className="floating-account-menu-link">
                    <img src={`${ASSET_BASE}/user.png`} alt="" />
                    <span>Account</span>
                  </a>
                  <a href="/degree-progression" className="floating-account-menu-link">
                    <span
                      className="floating-account-menu-icon floating-degree-icon"
                      aria-hidden="true"
                    />
                    <span>Degree Progression</span>
                  </a>
                  <a href="/accounts#reviews" className="floating-account-menu-link">
                    <span
                      className="floating-account-menu-icon floating-reviews-icon"
                      aria-hidden="true"
                    />
                    <span>Activity History</span>
                  </a>
                  <button
                    className="floating-account-menu-link floating-account-logout"
                    type="button"
                    onClick={logout}
                  >
                    <span className="floating-logout-icon" aria-hidden="true" />
                    <span>Logout</span>
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        <button
          className="hamburger-toggle"
          type="button"
          aria-label="Open menu"
          aria-expanded={mobileOpen}
          onClick={() => setMobileOpen((value) => !value)}
        >
          <span />
          <span />
          <span />
        </button>
      </header>

      <div
        className="nav-menu-overlay"
        aria-hidden={!mobileOpen}
        onClick={() => setMobileOpen(false)}
      >
        <div
          className="nav-menu-panel nav-menu-main active"
          onClick={(event) => event.stopPropagation()}
        >
          <div className="nav-menu-links">
            <a href="/professors" className="nav-menu-link">Professors</a>
            <a href="/courses" className="nav-menu-link">Courses</a>
            <a href="/gpa-calculator" className="nav-menu-link">GPA Calculator</a>
          </div>
        </div>
      </div>
    </>
  );
}
