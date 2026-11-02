"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

export default function SiteHeader() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const accountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    document.body.classList.toggle("nav-menu-open", mobileOpen);
    return () => document.body.classList.remove("nav-menu-open");
  }, [mobileOpen]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMobileOpen(false);
        setAccountOpen(false);
      }
    };

    const onPointerDown = (event: MouseEvent) => {
      if (accountRef.current && !accountRef.current.contains(event.target as Node)) {
        setAccountOpen(false);
      }
    };

    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("mousedown", onPointerDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("mousedown", onPointerDown);
    };
  }, []);

  const closeMenus = () => {
    setMobileOpen(false);
    setAccountOpen(false);
  };

  return (
    <>
      <header className="site-header">
        <Link href="/" className="site-header-logo" aria-label="AUC Atlas home">
          <span className="site-header-logo-auc">AUC</span>
          <span className="site-header-logo-atlas">Atlas</span>
        </Link>

        <nav className="site-header-nav" aria-label="Main navigation">
          <Link href="/professors">Professors</Link>
          <Link href="/courses">Courses</Link>
          <Link href="/gpa-calculator">GPA Calculator</Link>
        </nav>

        <div className="site-header-actions">
          <Link className="site-notification-button" href="/notifications" aria-label="Notifications">
            <img src="/bell.png" alt="" />
            <span className="site-notification-badge" hidden>0</span>
          </Link>

          <div className="floating-account-widget" ref={accountRef}>
            <button
              className="floating-account-button"
              type="button"
              aria-label="Open account menu"
              aria-expanded={accountOpen}
              onClick={() => setAccountOpen((open) => !open)}
            >
              <img src="/user.png" alt="Account" />
            </button>

            <div
              className={`floating-account-menu${accountOpen ? " is-open" : ""}`}
              hidden={!accountOpen}
            >
              <Link href="/login" className="floating-account-menu-link" onClick={closeMenus}>
                <img src="/user.png" alt="" />
                <span>Login</span>
              </Link>
            </div>
          </div>
        </div>

        <button
          className="hamburger-toggle"
          type="button"
          aria-label={mobileOpen ? "Close menu" : "Open menu"}
          aria-expanded={mobileOpen}
          onClick={() => {
            setMobileOpen((open) => !open);
            setAccountOpen(false);
          }}
        >
          <span />
          <span />
          <span />
        </button>
      </header>

      <div
        className="nav-menu-overlay"
        aria-hidden={!mobileOpen}
        onClick={(event) => {
          if (event.target === event.currentTarget) setMobileOpen(false);
        }}
      >
        <div className={`nav-menu-panel nav-menu-main${mobileOpen ? " active" : ""}`}>
          <div className="nav-menu-links">
            <Link href="/professors" className="nav-menu-link" onClick={closeMenus}>Professors</Link>
            <Link href="/courses" className="nav-menu-link" onClick={closeMenus}>Courses</Link>
            <Link href="/gpa-calculator" className="nav-menu-link" onClick={closeMenus}>GPA Calculator</Link>
          </div>
        </div>
      </div>
    </>
  );
}
