"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import "./header.css";
import { SEARCH_REVIEW_SESSION_ENDED } from "../features/home/searchReviewCounts";
import { readSharedHomepageJson, cancelSharedHomepageReads } from "../lib/sharedHomepageReads";

type AtlasUser = { photoURL?: string; isAdmin?: boolean };
type SessionResponse = { signedIn?: boolean; user?: AtlasUser };

const drawerLinks = [
  { href: "/", label: "Home", icon: "home" },
  { href: "/professors", label: "Professors", icon: "professors" },
  { href: "/gpa-calculator", label: "GPA calculator", icon: "calculator" },
  { href: "/degree-progression", label: "Degree progression", icon: "progress" },
  { href: "/campus-map", label: "Campus map", icon: "map" },
  { href: "/activity-history", label: "Activity history", icon: "history" },
] as const;

type DrawerIconName = (typeof drawerLinks)[number]["icon"] | "help";

function DrawerIcon({ name }: { name: DrawerIconName }) {
  return (
    <svg viewBox="0 0 24 24" width="21" height="21" fill="none" stroke="currentColor"
      strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {name === "home" && <><path d="m3 10 9-7 9 7"/><path d="M5 9v11h5v-6h4v6h5V9"/></>}
      {name === "professors" && <><circle cx="9" cy="8" r="3"/><path d="M3 20v-2a6 6 0 0 1 12 0v2M16 5a3 3 0 0 1 0 6m2 3a5 5 0 0 1 3 4v2"/></>}
      {name === "calculator" && <><rect x="5" y="3" width="14" height="18" rx="2"/><path d="M8 7h8M9 12h.01M15 12h.01M9 16h.01M15 16h.01" strokeWidth="2.2"/></>}
      {name === "progress" && <path d="M4 4v16h16M8 16v-4m5 4V9m5 7V5"/>}
      {name === "map" && <><path d="m3 6 6-3 6 3 6-3v15l-6 3-6-3-6 3zM9 3v15M15 6v15"/></>}
      {name === "history" && <><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/><path d="M12 7v5l4 2"/></>}
      {name === "help" && <><circle cx="12" cy="12" r="9"/><path d="M9.2 9a2.8 2.8 0 0 1 5.6 0c0 2-2.8 2.1-2.8 4m0 3h.01"/></>}
    </svg>
  );
}

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
  const usesNewNavbar = pathname === "/" || pathname === "/accounts" || pathname === "/campus-map" || pathname === "/activity-history" || pathname === "/degree-progression" || pathname === "/gpa-calculator" || pathname === "/faq" || pathname === "/privacy" || pathname === "/terms" || pathname === "/professors" || pathname.startsWith("/professors/");
  const widgetRef = useRef<HTMLDivElement>(null);
  const drawerRef = useRef<HTMLDialogElement>(null);
  const [navOpen, setNavOpen] = useState(false);
  const [homeScrolled, setHomeScrolled] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [user, setUser] = useState<AtlasUser | null>(null);
  const [sessionReady, setSessionReady] = useState(false);
  const [loadedPhotoUrl, setLoadedPhotoUrl] = useState<string | null>(null);
  const [failedPhotoUrl, setFailedPhotoUrl] = useState<string | null>(null);
  const [loggingOut, setLoggingOut] = useState(false);
  const photoUrl = user?.photoURL?.trim() || "";
  const hasUsablePhoto = Boolean(photoUrl) && failedPhotoUrl !== photoUrl;
  const showPhotoSkeleton = usesNewNavbar &&
    (!sessionReady || (hasUsablePhoto && loadedPhotoUrl !== photoUrl));

  const loadAccountState = useCallback(async () => {
    try {
      const { response, data } = await readSharedHomepageJson<SessionResponse>("/api/me");
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
  useEffect(() => {
    setNavOpen(false);
    setAccountOpen(false);
  }, [pathname]);

  // At the top of the homepage, let its ambient background show through the header.
  useEffect(() => {
    if (pathname !== "/") return;
    const update = () => setHomeScrolled(window.scrollY > 12);
    update();
    window.addEventListener("scroll", update, { passive: true });
    return () => window.removeEventListener("scroll", update);
  }, [pathname]);

  // Native modal semantics provide a focus trap and make the page behind inert.
  // Keep the modal mounted during its exit animation before releasing focus.
  useEffect(() => {
    const drawer = drawerRef.current;
    if (!drawer) return;
    if (navOpen) {
      if (!drawer.open) drawer.showModal();
      return;
    }
    if (!drawer.open) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      drawer.close();
      return;
    }
    const timeout = window.setTimeout(() => {
      if (drawer.open) drawer.close();
    }, 250);
    return () => window.clearTimeout(timeout);
  }, [navOpen]);
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setAccountOpen(false);
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
    cancelSharedHomepageReads();
    window.dispatchEvent(new Event(SEARCH_REVIEW_SESSION_ENDED));
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
      <header className={usesNewNavbar ? "site-header site-header--homepagenew" : "site-header"}
        data-home-at-top={pathname === "/" && !homeScrolled ? "true" : undefined}
        data-campus-map={pathname === "/campus-map" ? "true" : undefined}>
        <button className="hamburger-toggle" type="button"
          aria-label="Open navigation menu" aria-haspopup="dialog"
          aria-controls="atlas-navigation-drawer" aria-expanded={navOpen}
          onClick={() => { void loadAccountState(); setNavOpen(true); setAccountOpen(false); }}>
          <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor"
            strokeWidth="1.6" strokeLinecap="round" aria-hidden="true">
            <path d="M3 6h18M3 12h18M3 18h18"/>
          </svg>
        </button>
        <a href="/" className="site-header-logo" aria-label="AUC Atlas home">
          <span className="site-header-logo-auc">AUC</span>
          <span className="site-header-logo-atlas">Atlas</span>
        </a>
        <div className="site-header-actions">
          <div className="floating-account-widget" id="floating-account-widget" ref={widgetRef}>
            <button className="floating-account-button" id="floating-account-button"
              type="button" aria-label="Open account menu" aria-expanded={accountOpen}
              onClick={() => {
                void loadAccountState();
                setNavOpen(false);
                setAccountOpen(value => !value);
              }}>
              {usesNewNavbar ? (
                <>
                  {showPhotoSkeleton && (
                    <span className="floating-account-photo-skeleton" aria-hidden="true" />
                  )}
                  {hasUsablePhoto ? (
                    <img src={photoUrl} alt="Account profile photo"
                      id="floating-account-photo"
                      className={`has-profile-photo${loadedPhotoUrl === photoUrl ? "" : " is-photo-pending"}`}
                      onLoad={() => setLoadedPhotoUrl(photoUrl)}
                      onError={() => setFailedPhotoUrl(photoUrl)} />
                  ) : !showPhotoSkeleton ? (
                    <svg viewBox="0 0 24 24" width="22" height="22" fill="none"
                      stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"
                      aria-hidden="true">
                      <circle cx="12" cy="8" r="3.5"/>
                      <path d="M5 20c0-3.8 3.1-6 7-6s7 2.2 7 6"/>
                    </svg>
                  ) : null}
                </>
              ) : (
                <img src={photoUrl || "/user.png"}
                  alt={photoUrl ? "Account profile photo" : "Account"}
                  id="floating-account-photo"
                  className={photoUrl ? "has-profile-photo" : ""} />
              )}

            </button>
            <div className={`floating-account-menu ${accountOpen ? "is-open" : ""}`}
              id="floating-account-menu" hidden={!usesNewNavbar && !accountOpen}>
              {sessionReady && !user && <a href="/login" className="floating-account-menu-link" id="floating-login-link" onClick={() => setAccountOpen(false)}>
                <img src="/user.png" alt=""/><span>Login</span>
              </a>}
              {user && <>
                <a href="/accounts" className="floating-account-menu-link" id="floating-account-link" onClick={() => setAccountOpen(false)}>
                  <img src="/user.png" alt=""/><span>Account</span>
                </a>
                <button className="floating-account-menu-link floating-account-logout"
                  id="floating-logout-button" type="button" disabled={loggingOut} onClick={() => void logout()}>
                  <span className="floating-logout-icon" aria-hidden="true"/><span>Logout</span>
                </button>
              </>}
            </div>
          </div>
        </div>
      </header>
      <dialog ref={drawerRef} id="atlas-navigation-drawer"
        className={`atlas-nav-drawer ${navOpen ? "is-open" : "is-closing"}`}
        aria-labelledby="atlas-navigation-title"
        onCancel={event => { event.preventDefault(); setNavOpen(false); }}
        onClose={() => setNavOpen(false)}
        onClick={event => { if (event.target === event.currentTarget) setNavOpen(false); }}>
        <div className="atlas-nav-panel">
          <div className="atlas-nav-heading">
            <h2 id="atlas-navigation-title">Explore Atlas</h2>
            <button className="atlas-nav-close" type="button" aria-label="Close navigation menu"
              onClick={() => setNavOpen(false)}>
              <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor"
                strokeWidth="1.6" strokeLinecap="round" aria-hidden="true">
                <path d="m6 6 12 12M18 6 6 18"/>
              </svg>
            </button>
          </div>
          <nav className="atlas-nav-links" aria-label="Main navigation">
            {drawerLinks.filter(({ href }) => href !== "/campus-map" || user?.isAdmin === true).map(({ href, label, icon }) => {
              const isCurrent = pathname === href || (href !== "/" && pathname.startsWith(href + "/"));
              return (
                <a href={href} className="atlas-nav-link" key={href}
                  aria-current={isCurrent ? "page" : undefined} onClick={() => setNavOpen(false)}>
                  <DrawerIcon name={icon} />
                  <span>{label}</span>
                </a>
              );
            })}
            <div className="atlas-nav-support">
              <a href="/faq" className="atlas-nav-link" aria-current={pathname === "/faq" ? "page" : undefined}
                onClick={() => setNavOpen(false)}>
                <DrawerIcon name="help" />
                <span>Help &amp; FAQ</span>
              </a>
            </div>
          </nav>
        </div>
      </dialog>
    </>
  );
}
