"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { trackWeeklyVisit } from "@/lib/weekly-visits";

type AccountUser = {
  photoURL?: string | null;
  [key: string]: unknown;
};

type NotificationSummary = {
  signedIn?: boolean;
  unreadCount?: number;
  notificationIds?: unknown[];
  error?: string;
};

const NOTIFICATION_READ_STORAGE_KEY = "auc-atlas-read-notifications";
const NOTIFICATION_SUMMARY_STORAGE_KEY = "auc-atlas-notification-summary";
const NOTIFICATION_SUMMARY_CACHE_DURATION_MS = 30 * 60 * 1000;

function clearLocalSignedInFlags() {
  try {
    localStorage.removeItem("auc-atlas-signed-in");
    localStorage.removeItem("aucAtlasSignedIn");
    sessionStorage.removeItem("auc-atlas-signed-in");
    sessionStorage.removeItem("aucAtlasSignedIn");
  } catch {
    // Storage is unavailable.
  }
}

function saveLocalSignedInFlags() {
  try {
    localStorage.setItem("auc-atlas-signed-in", "1");
    localStorage.setItem("aucAtlasSignedIn", "true");
  } catch {
    // Storage is unavailable.
  }
}

function getLocalReadNotificationIds() {
  try {
    const saved = JSON.parse(
      localStorage.getItem(NOTIFICATION_READ_STORAGE_KEY) || "[]"
    ) as unknown;

    return new Set(
      Array.isArray(saved)
        ? saved.filter(
            (id): id is string => typeof id === "string" && id.length <= 180
          )
        : []
    );
  } catch {
    return new Set<string>();
  }
}

function getCachedNotificationSummary() {
  try {
    const cached = JSON.parse(
      sessionStorage.getItem(NOTIFICATION_SUMMARY_STORAGE_KEY) || "null"
    ) as { savedAt?: unknown; data?: NotificationSummary } | null;

    if (
      !cached?.data ||
      typeof cached.data !== "object" ||
      Date.now() - Number(cached.savedAt || 0) >
        NOTIFICATION_SUMMARY_CACHE_DURATION_MS
    ) {
      return null;
    }

    return cached.data;
  } catch {
    return null;
  }
}

function cacheNotificationSummary(data: NotificationSummary) {
  try {
    sessionStorage.setItem(
      NOTIFICATION_SUMMARY_STORAGE_KEY,
      JSON.stringify({
        savedAt: Date.now(),
        data
      })
    );
  } catch {
    // Storage is unavailable.
  }
}

function clearNotificationSummaryCache() {
  try {
    sessionStorage.removeItem(NOTIFICATION_SUMMARY_STORAGE_KEY);
  } catch {
    // Storage is unavailable.
  }
}

export function SiteHeader() {
  const [currentUser, setCurrentUser] = useState<AccountUser | null>(null);
  const [menuIsOpen, setMenuIsOpen] = useState(false);
  const [accountMenuVisible, setAccountMenuVisible] = useState(false);
  const [accountMenuIsOpen, setAccountMenuIsOpen] = useState(false);
  const [notificationCount, setNotificationCount] = useState(0);
  const [logoutPending, setLogoutPending] = useState(false);
  const accountButtonRef = useRef<HTMLButtonElement>(null);
  const accountMenuRef = useRef<HTMLDivElement>(null);
  const accountMenuOpenRef = useRef(false);
  const closeTimerRef = useRef<number | null>(null);

  const closeAccountMenu = useCallback(() => {
    accountMenuOpenRef.current = false;
    setAccountMenuIsOpen(false);

    if (closeTimerRef.current !== null) {
      window.clearTimeout(closeTimerRef.current);
    }

    closeTimerRef.current = window.setTimeout(() => {
      if (!accountMenuOpenRef.current) {
        setAccountMenuVisible(false);
      }
      closeTimerRef.current = null;
    }, 180);
  }, []);

  const openAccountMenu = useCallback(() => {
    if (closeTimerRef.current !== null) {
      window.clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }

    accountMenuOpenRef.current = true;
    setAccountMenuVisible(true);
    window.requestAnimationFrame(() => {
      setAccountMenuIsOpen(true);
    });
  }, []);

  const loadAccountState = useCallback(async () => {
    try {
      const response = await fetch("/api/me", {
        method: "GET",
        credentials: "same-origin",
        cache: "no-store",
        headers: {
          Accept: "application/json"
        }
      });
      const data = (await response.json().catch(() => ({}))) as {
        signedIn?: boolean;
        user?: AccountUser;
      };

      if (response.ok && data.signedIn && data.user) {
        window.aucAtlasCurrentUser = data.user;
        saveLocalSignedInFlags();
        setCurrentUser(data.user);
        return data.user;
      }
    } catch {
      // The logged-out state below is the safe fallback.
    }

    window.aucAtlasCurrentUser = null;
    clearLocalSignedInFlags();
    setCurrentUser(null);
    return null;
  }, []);

  const loadNotificationState = useCallback(async (force = false) => {
    try {
      let data = force ? null : getCachedNotificationSummary();

      if (!data) {
        const response = await fetch("/api/notifications?summary=1", {
          method: "GET",
          credentials: "same-origin",
          cache: "no-store",
          headers: {
            Accept: "application/json"
          }
        });

        data = (await response.json().catch(() => ({}))) as NotificationSummary;

        if (!response.ok) {
          throw new Error(data.error || "Could not load notifications.");
        }

        cacheNotificationSummary(data);
      }

      const notificationIds = Array.isArray(data.notificationIds)
        ? data.notificationIds.filter(
            (id): id is string => typeof id === "string" && id.length <= 180
          )
        : [];
      const localReadNotificationIds = getLocalReadNotificationIds();
      const unreadCount = data.signedIn
        ? Math.max(0, Number(data.unreadCount) || 0)
        : notificationIds.filter((id) => !localReadNotificationIds.has(id)).length;

      setNotificationCount(unreadCount);
    } catch {
      setNotificationCount(0);
    }
  }, []);

  useEffect(() => {
    void trackWeeklyVisit();
    void loadAccountState();
    void loadNotificationState();

    const handleNotificationsUpdated = () => {
      clearNotificationSummaryCache();
      void loadNotificationState(true);
    };
    const handleStorage = (event: StorageEvent) => {
      if (event.key === NOTIFICATION_READ_STORAGE_KEY) {
        clearNotificationSummaryCache();
        void loadNotificationState(true);
      }
    };

    window.addEventListener("aucAtlasNotificationsUpdated", handleNotificationsUpdated);
    window.addEventListener("storage", handleStorage);

    return () => {
      window.removeEventListener(
        "aucAtlasNotificationsUpdated",
        handleNotificationsUpdated
      );
      window.removeEventListener("storage", handleStorage);
    };
  }, [loadAccountState, loadNotificationState]);

  useEffect(() => {
    document.body.classList.toggle("nav-menu-open", menuIsOpen);

    return () => {
      document.body.classList.remove("nav-menu-open");
    };
  }, [menuIsOpen]);

  useEffect(() => {
    const handleDocumentClick = (event: MouseEvent) => {
      const target = event.target;

      if (!(target instanceof Node)) {
        return;
      }

      if (
        accountMenuRef.current &&
        !accountMenuRef.current.contains(target) &&
        !accountButtonRef.current?.contains(target)
      ) {
        closeAccountMenu();
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMenuIsOpen(false);
        closeAccountMenu();
      }
    };

    document.addEventListener("click", handleDocumentClick);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("click", handleDocumentClick);
      document.removeEventListener("keydown", handleKeyDown);

      if (closeTimerRef.current !== null) {
        window.clearTimeout(closeTimerRef.current);
      }
    };
  }, [closeAccountMenu]);

  const handleAccountButtonClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    void loadAccountState();

    if (!accountMenuVisible || !accountMenuIsOpen) {
      openAccountMenu();
    } else {
      closeAccountMenu();
    }
  };

  const handleLogout = async () => {
    setLogoutPending(true);

    await fetch("/api/logout", {
      method: "POST",
      credentials: "same-origin",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({})
    }).catch(() => undefined);

    clearLocalSignedInFlags();
    window.aucAtlasCurrentUser = null;
    setCurrentUser(null);
    closeAccountMenu();
    setLogoutPending(false);
    window.location.href = "/";
  };

  const signedIn = currentUser !== null;
  const accountPhoto = String(currentUser?.photoURL || "").trim();
  const notificationLabel = notificationCount
    ? `Notifications, ${notificationCount} unread`
    : "Notifications";

  return (
    <>
      <header className="site-header">
        <a href="/" className="site-header-logo">
          <span className="site-header-logo-auc">AUC</span>
          <span className="site-header-logo-atlas">Atlas</span>
        </a>

        <nav className="site-header-nav" aria-label="Main navigation">
          <a href="/professors.html">Professors</a>
          <a href="/courses.html">Courses</a>
          <a href="/gpa-calculator.html">GPA Calculator</a>
        </nav>

        <div className="site-header-actions">
          <a
            className="site-notification-button"
            id="site-notification-button"
            href="/notifications.html"
            aria-label={notificationLabel}
          >
            <img src="/bell.png" alt="" />
            <span
              className="site-notification-badge"
              id="site-notification-badge"
              hidden={notificationCount === 0}
            >
              {notificationCount > 99 ? "99+" : notificationCount}
            </span>
          </a>

          <div className="floating-account-widget" id="floating-account-widget">
            <button
              ref={accountButtonRef}
              className="floating-account-button"
              id="floating-account-button"
              type="button"
              aria-label="Open account menu"
              aria-expanded={accountMenuIsOpen}
              onClick={handleAccountButtonClick}
            >
              <img
                src={accountPhoto || "/user.png"}
                alt={accountPhoto ? "Account profile photo" : "Account"}
                id="floating-account-photo"
                className={accountPhoto ? "has-profile-photo" : undefined}
              />
            </button>

            <div
              ref={accountMenuRef}
              className={`floating-account-menu${accountMenuIsOpen ? " is-open" : ""}`}
              id="floating-account-menu"
              hidden={!accountMenuVisible}
            >
              <a
                href="/login.html"
                className="floating-account-menu-link"
                id="floating-login-link"
                hidden={signedIn}
                onClick={closeAccountMenu}
              >
                <img src="/user.png" alt="" />
                <span>Login</span>
              </a>

              <a
                href="/accounts.html"
                className="floating-account-menu-link"
                id="floating-account-link"
                hidden={!signedIn}
                onClick={closeAccountMenu}
              >
                <img src="/user.png" alt="" />
                <span>Account</span>
              </a>

              <a
                href="/degree-progression.html"
                className="floating-account-menu-link"
                id="floating-degree-link"
                hidden={!signedIn}
                onClick={closeAccountMenu}
              >
                <span
                  className="floating-account-menu-icon floating-degree-icon"
                  aria-hidden="true"
                />
                <span>Degree Progression</span>
              </a>

              <a
                href="/accounts.html#reviews"
                className="floating-account-menu-link"
                id="floating-reviews-link"
                hidden={!signedIn}
                onClick={closeAccountMenu}
              >
                <span
                  className="floating-account-menu-icon floating-reviews-icon"
                  aria-hidden="true"
                />
                <span>Activity History</span>
              </a>

              <button
                className="floating-account-menu-link floating-account-logout"
                id="floating-logout-button"
                type="button"
                hidden={!signedIn}
                disabled={logoutPending}
                onClick={() => void handleLogout()}
              >
                <span className="floating-logout-icon" aria-hidden="true" />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </div>

        <button
          className="hamburger-toggle"
          type="button"
          aria-label="Open menu"
          aria-expanded={menuIsOpen}
          onClick={() => {
            setMenuIsOpen((isOpen) => !isOpen);
            closeAccountMenu();
          }}
        >
          <span />
          <span />
          <span />
        </button>
      </header>

      <div
        className="nav-menu-overlay"
        aria-hidden={!menuIsOpen}
        onClick={(event) => {
          if (event.target === event.currentTarget) {
            setMenuIsOpen(false);
          }
        }}
      >
        <div className="nav-menu-panel nav-menu-main active">
          <div className="nav-menu-links">
            <a
              href="/professors.html"
              className="nav-menu-link"
              onClick={() => setMenuIsOpen(false)}
            >
              Professors
            </a>
            <a
              href="/courses.html"
              className="nav-menu-link"
              onClick={() => setMenuIsOpen(false)}
            >
              Courses
            </a>
            <a
              href="/gpa-calculator.html"
              className="nav-menu-link"
              onClick={() => setMenuIsOpen(false)}
            >
              GPA Calculator
            </a>
          </div>
        </div>
      </div>
    </>
  );
}

declare global {
  interface Window {
    aucAtlasCurrentUser?: AccountUser | null;
  }

  interface WindowEventMap {
    aucAtlasNotificationsUpdated: Event;
  }
}
