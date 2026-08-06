"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

function createUniqueVisitorId() {
  if (
    typeof window !== "undefined" &&
    window.crypto &&
    typeof window.crypto.randomUUID === "function"
  ) {
    return window.crypto.randomUUID();
  }

  return (
    "visitor-" +
    Date.now().toString(36) +
    "-" +
    Math.random().toString(36).slice(2) +
    Math.random().toString(36).slice(2)
  );
}

function getUniqueVisitorId() {
  const storageKey = "aucAtlasVisitorId";

  try {
    let visitorId = window.localStorage.getItem(storageKey);

    if (!visitorId) {
      visitorId = createUniqueVisitorId();
      window.localStorage.setItem(storageKey, visitorId);
    }

    return visitorId;
  } catch {
    try {
      let visitorId = window.sessionStorage.getItem(storageKey);

      if (!visitorId) {
        visitorId = createUniqueVisitorId();
        window.sessionStorage.setItem(storageKey, visitorId);
      }

      return visitorId;
    } catch {
      return createUniqueVisitorId();
    }
  }
}

function clearLocalSignedInFlags() {
  try {
    localStorage.removeItem("auc-atlas-signed-in");
    localStorage.removeItem("aucAtlasSignedIn");
    sessionStorage.removeItem("auc-atlas-signed-in");
    sessionStorage.removeItem("aucAtlasSignedIn");
  } catch {}
}

function saveLocalSignedInFlags() {
  try {
    localStorage.setItem("auc-atlas-signed-in", "1");
    localStorage.setItem("aucAtlasSignedIn", "true");
  } catch {}
}

export default function SiteHeader() {
  const router = useRouter();
  const accountWidgetRef = useRef(null);
  const accountCloseTimerRef = useRef(null);

  const [isNavOpen, setIsNavOpen] = useState(false);
  const [isAccountMenuOpen, setIsAccountMenuOpen] = useState(false);
  const [isAccountMenuMounted, setIsAccountMenuMounted] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const closeNavMenu = useCallback(() => {
    setIsNavOpen(false);
  }, []);

  const closeAccountMenu = useCallback(() => {
    setIsAccountMenuOpen(false);

    window.clearTimeout(accountCloseTimerRef.current);

    accountCloseTimerRef.current = window.setTimeout(() => {
      setIsAccountMenuMounted(false);
    }, 180);
  }, []);

  const openAccountMenu = useCallback(() => {
    window.clearTimeout(accountCloseTimerRef.current);
    setIsAccountMenuMounted(true);

    window.requestAnimationFrame(() => {
      setIsAccountMenuOpen(true);
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

      const data = await response.json().catch(() => ({}));

      if (response.ok && data.signedIn && data.user) {
        window.aucAtlasCurrentUser = data.user;
        saveLocalSignedInFlags();
        setCurrentUser(data.user);
        return data.user;
      }
    } catch {}

    window.aucAtlasCurrentUser = null;
    clearLocalSignedInFlags();
    setCurrentUser(null);

    return null;
  }, []);

  useEffect(() => {
    document.body.classList.toggle("nav-menu-open", isNavOpen);

    return () => {
      document.body.classList.remove("nav-menu-open");
    };
  }, [isNavOpen]);

  useEffect(() => {
    loadAccountState();
  }, [loadAccountState]);

  useEffect(() => {
    const isAdminPage = /\/admin\/?$/.test(window.location.pathname);

    if (isAdminPage || typeof window.fetch !== "function") {
      window.aucAtlasUniqueVisitorsPromise = Promise.resolve(null);
      return;
    }

    const visitorPromise = fetch("/api/weekly-visitors", {
      method: "POST",
      credentials: "same-origin",
      cache: "no-store",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        visitorId: getUniqueVisitorId()
      })
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error("Could not update unique visitors.");
        }

        return response.json();
      })
      .then((data) => {
        const uniqueVisitors = Math.max(
          0,
          Number(data.uniqueVisitors) || 0
        );

        window.aucAtlasUniqueVisitors = uniqueVisitors;

        return uniqueVisitors;
      })
      .catch(() => null);

    window.aucAtlasUniqueVisitorsPromise = visitorPromise;
  }, []);

  useEffect(() => {
    function handleDocumentClick(event) {
      if (
        accountWidgetRef.current &&
        !accountWidgetRef.current.contains(event.target)
      ) {
        closeAccountMenu();
      }
    }

    function handleKeyDown(event) {
      if (event.key === "Escape") {
        closeNavMenu();
        closeAccountMenu();
      }
    }

    document.addEventListener("click", handleDocumentClick);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("click", handleDocumentClick);
      document.removeEventListener("keydown", handleKeyDown);
      window.clearTimeout(accountCloseTimerRef.current);
    };
  }, [closeAccountMenu, closeNavMenu]);

  async function handleAccountButtonClick(event) {
    event.stopPropagation();

    await loadAccountState();

    if (isAccountMenuMounted && isAccountMenuOpen) {
      closeAccountMenu();
    } else {
      openAccountMenu();
    }
  }

  async function handleLogout() {
    if (isLoggingOut) {
      return;
    }

    setIsLoggingOut(true);

    await fetch("/api/logout", {
      method: "POST",
      credentials: "same-origin",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({})
    }).catch(() => {});

    clearLocalSignedInFlags();
    window.aucAtlasCurrentUser = null;
    setCurrentUser(null);
    closeAccountMenu();
    setIsLoggingOut(false);

    router.push("/");
    router.refresh();
  }

  const profilePhoto = String(currentUser?.photoURL || "").trim();

  return (
    <>
      <header className="site-header">
        <Link href="/" className="site-header-logo">
          <span className="site-header-logo-auc">AUC</span>
          <span className="site-header-logo-atlas">Atlas</span>
        </Link>

        <nav className="site-header-nav" aria-label="Main navigation">
          <Link href="/professors">Professors</Link>
          <Link href="/courses">Courses</Link>
          <Link href="/gpa-calculator">GPA Calculator</Link>
        </nav>

        <div className="site-header-actions">
          <div
            className="floating-account-widget"
            id="floating-account-widget"
            ref={accountWidgetRef}
          >
            <button
              className="floating-account-button"
              id="floating-account-button"
              type="button"
              aria-label="Open account menu"
              aria-expanded={isAccountMenuOpen}
              onClick={handleAccountButtonClick}
            >
              <img
                src={profilePhoto || "/user.png"}
                alt={profilePhoto ? "Account profile photo" : "Account"}
                id="floating-account-photo"
                className={profilePhoto ? "has-profile-photo" : undefined}
              />
            </button>

            <div
              className={
                "floating-account-menu" +
                (isAccountMenuOpen ? " is-open" : "")
              }
              id="floating-account-menu"
              hidden={!isAccountMenuMounted}
            >
              {!currentUser && (
                <Link
                  href="/login"
                  className="floating-account-menu-link"
                  id="floating-login-link"
                  onClick={closeAccountMenu}
                >
                  <img src="/user.png" alt="" />
                  <span>Login</span>
                </Link>
              )}

              {currentUser && (
                <>
                  <Link
                    href="/accounts"
                    className="floating-account-menu-link"
                    id="floating-account-link"
                    onClick={closeAccountMenu}
                  >
                    <img src="/user.png" alt="" />
                    <span>Account</span>
                  </Link>

                  <Link
                    href="/degree-progression"
                    className="floating-account-menu-link"
                    id="floating-degree-link"
                    onClick={closeAccountMenu}
                  >
                    <span
                      className="floating-account-menu-icon floating-degree-icon"
                      aria-hidden="true"
                    />
                    <span>Degree Progression</span>
                  </Link>

                  <Link
                    href="/accounts#reviews"
                    className="floating-account-menu-link"
                    id="floating-reviews-link"
                    onClick={closeAccountMenu}
                  >
                    <span
                      className="floating-account-menu-icon floating-reviews-icon"
                      aria-hidden="true"
                    />
                    <span>Activity History</span>
                  </Link>

                  <button
                    className="floating-account-menu-link floating-account-logout"
                    id="floating-logout-button"
                    type="button"
                    disabled={isLoggingOut}
                    onClick={handleLogout}
                  >
                    <span
                      className="floating-logout-icon"
                      aria-hidden="true"
                    />
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
          aria-expanded={isNavOpen}
          onClick={() => {
            setIsNavOpen((open) => !open);
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
        aria-hidden={!isNavOpen}
        onClick={(event) => {
          if (event.target === event.currentTarget) {
            closeNavMenu();
          }
        }}
      >
        <div className="nav-menu-panel nav-menu-main active">
          <div className="nav-menu-links">
            <Link
              href="/professors"
              className="nav-menu-link"
              onClick={closeNavMenu}
            >
              Professors
            </Link>

            <Link
              href="/courses"
              className="nav-menu-link"
              onClick={closeNavMenu}
            >
              Courses
            </Link>

            <Link
              href="/gpa-calculator"
              className="nav-menu-link"
              onClick={closeNavMenu}
            >
              GPA Calculator
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
