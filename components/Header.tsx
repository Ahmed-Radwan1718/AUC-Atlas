"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import "./header.css";
import { monthlyVisits } from "../lib/monthlyVisits";

type AtlasUser = { photoURL?: string };
type SessionResponse = { signedIn?: boolean; user?: AtlasUser };

const navLinks = [
  { href: "/professors", label: "Professors" },
  { href: "/courses", label: "Courses" },
  { href: "/gpa-calculator", label: "GPA Calculator" },
];

function clearSignedInFlags() {
  try {
    localStorage.removeItem("auc-atlas-signed-in");
    localStorage.removeItem("aucAtlasSignedIn");
    sessionStorage.removeItem("auc-atlas-signed-in");
    sessionStorage.removeItem("aucAtlasSignedIn");
  } catch {}
}

export default function Header() {
  const router = useRouter();
  const pathname = usePathname();
  const widgetRef = useRef<HTMLDivElement>(null);
  const [navOpen, setNavOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [user, setUser] = useState<AtlasUser | null>(null);
  const [sessionReady, setSessionReady] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const loadAccountState = useCallback(async () => {
    try {
      const response = await fetch("/api/me", {
        method: "GET", credentials: "same-origin", cache: "no-store",
        headers: { Accept: "application/json" }
      });
      const data: SessionResponse = await response.json();
      if (response.ok && data.signedIn && data.user) {
        setUser(data.user);
        try {
          localStorage.setItem("auc-atlas-signed-in", "1");
          localStorage.setItem("aucAtlasSignedIn", "true");
        } catch {}
        setSessionReady(true);
        return;
      }
    } catch {}
    setUser(null);
    clearSignedInFlags();
    setSessionReady(true);
  }, []);

  useEffect(() => { void loadAccountState(); }, [loadAccountState]);
  useEffect(() => { void monthlyVisits(); }, []);
  useEffect(() => {
    setNavOpen(false);
    setAccountOpen(false);
  }, [pathname]);
  useEffect(() => {
    document.body.classList.toggle("nav-menu-open", navOpen);
    return () => document.body.classList.remove("nav-menu-open");
  }, [navOpen]);
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") { setNavOpen(false); setAccountOpen(false); }
    };
    const onPointerDown = (event: PointerEvent) => {
      if (widgetRef.current && !widgetRef.current.contains(event.target as Node)) {
        setAccountOpen(false);
      }
    };
    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("pointerdown", onPointerDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("pointerdown", onPointerDown);
    };
  }, []);

  async function logout() {
    setLoggingOut(true);
    try {
      await fetch("/api/logout", {
        method: "POST", credentials: "same-origin",
        headers: { "Content-Type": "application/json" }, body: "{}"
      });
    } catch {}
    clearSignedInFlags();
    setUser(null);
    setAccountOpen(false);
    setLoggingOut(false);
    router.push("/");
    router.refresh();
  }

  return (
    <>
      <header className="site-header">
        <a href="/" className="site-header-logo">
          <span className="site-header-logo-auc">AUC</span>
          <span className="site-header-logo-atlas">Atlas</span>
        </a>
        <nav className="site-header-nav" aria-label="Main navigation">
          {navLinks.map(({ href, label }) => <a href={href} key={href}>{label}</a>)}
        </nav>
        <div className="site-header-actions">
          <div className="floating-account-widget" id="floating-account-widget" ref={widgetRef}>
            <button className="floating-account-button" id="floating-account-button"
              type="button" aria-label="Open account menu" aria-expanded={accountOpen}
              onClick={() => {
                void loadAccountState();
                setNavOpen(false);
                setAccountOpen(value => !value);
              }}>
              <img src={user?.photoURL || "/user.png"} alt={user?.photoURL ? "Account profile photo" : "Account"}
                id="floating-account-photo" className={user?.photoURL ? "has-profile-photo" : ""}/>
            </button>
            <div className={`floating-account-menu ${accountOpen ? "is-open" : ""}`}
              id="floating-account-menu" hidden={!accountOpen}>
              {sessionReady && !user && <a href="/login" className="floating-account-menu-link" id="floating-login-link" onClick={() => setAccountOpen(false)}>
                <img src="/user.png" alt=""/><span>Login</span>
              </a>}
              {user && <>
                <a href="/accounts" className="floating-account-menu-link" id="floating-account-link" onClick={() => setAccountOpen(false)}>
                  <img src="/user.png" alt=""/><span>Account</span>
                </a>
                <a href="/degree-progression" className="floating-account-menu-link" id="floating-degree-link" onClick={() => setAccountOpen(false)}>
                  <span className="floating-account-menu-icon floating-degree-icon" aria-hidden="true"/><span>Degree Progression</span>
                </a>
                <a href="/accounts#reviews" className="floating-account-menu-link" id="floating-reviews-link" onClick={() => setAccountOpen(false)}>
                  <span className="floating-account-menu-icon floating-reviews-icon" aria-hidden="true"/><span>Activity History</span>
                </a>
                <button className="floating-account-menu-link floating-account-logout"
                  id="floating-logout-button" type="button" disabled={loggingOut} onClick={() => void logout()}>
                  <span className="floating-logout-icon" aria-hidden="true"/><span>Logout</span>
                </button>
              </>}
            </div>
          </div>
        </div>
        <button className="hamburger-toggle" type="button" aria-label="Open menu" aria-expanded={navOpen}
          onClick={() => { setNavOpen(value => !value); setAccountOpen(false); }}>
          <span/><span/><span/>
        </button>
      </header>
      <div className="nav-menu-overlay" aria-hidden={!navOpen}
        onClick={event => { if (event.target === event.currentTarget) setNavOpen(false); }}>
        <div className="nav-menu-panel nav-menu-main active">
          <div className="nav-menu-links">
            {navLinks.map(({ href, label }) => <a href={href} className="nav-menu-link" key={href} onClick={() => setNavOpen(false)}>{label}</a>)}
          </div>
        </div>
      </div>
    </>
  );
}
