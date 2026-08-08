"use client";

import Link from "next/link";
import { useState } from "react";

export default function LoginForm() {
  const [form, setForm] = useState({ email: "", password: "", code: "" });
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [needsAuthenticator, setNeedsAuthenticator] = useState(false);

  function updateField(name, value) {
    setForm((current) => ({ ...current, [name]: value }));
  }

  function finishLogin() {
    try {
      localStorage.setItem("auc-atlas-signed-in", "1");
      localStorage.setItem("aucAtlasSignedIn", "true");
    } catch (error) {}

    window.location.href = "/accounts";
  }

  async function handleLogin(event) {
    event.preventDefault();

    const email = form.email.trim().toLowerCase();
    const password = form.password;

    if (!email || !password) {
      setStatus("error");
      setMessage("Please enter your email and password.");
      return;
    }

    setIsSubmitting(true);
    setStatus("");
    setMessage("");

    try {
      const response = await fetch("/api/login", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Could not log in.");
      }

      if (data.requiresTwoFactor) {
        setNeedsAuthenticator(true);
        setMessage("Enter your authenticator code to finish signing in.");
        return;
      }

      finishLogin();
    } catch (error) {
      setStatus("error");
      setMessage(error.message || "Could not log in.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleAuthenticator(event) {
    event.preventDefault();

    const code = form.code.replace(/\D/g, "").slice(0, 6);

    if (!/^\d{6}$/.test(code)) {
      setStatus("error");
      setMessage("Please enter your 6-digit authenticator code.");
      return;
    }

    setIsSubmitting(true);
    setStatus("");
    setMessage("");

    try {
      const response = await fetch("/api/verify-login-authenticator", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code })
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Could not verify authenticator code.");
      }

      finishLogin();
    } catch (error) {
      setStatus("error");
      setMessage(error.message || "Could not verify authenticator code.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="auth-page-shell">
      <section className="auth-card">
        <p className="section-kicker">Account access</p>
        <h1>Log in to AUC Atlas.</h1>
        <p>
          Access course materials, degree progress, account settings, saved
          history, and student-only features.
        </p>

        <form className="auth-form" onSubmit={handleLogin}>
          <label>
            <span>Email</span>
            <input
              type="email"
              autoComplete="email"
              placeholder="name@aucegypt.edu"
              value={form.email}
              onChange={(event) => updateField("email", event.target.value)}
            />
          </label>

          <label>
            <span>Password</span>
            <input
              type="password"
              autoComplete="current-password"
              placeholder="Enter your password"
              value={form.password}
              onChange={(event) => updateField("password", event.target.value)}
            />
          </label>

          <div className="auth-secondary-links">
            <Link href="/forgot-password">Forgot password?</Link>
          </div>

          <button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Logging in..." : "Log in"}
          </button>

          <p className={`auth-message ${status}`} aria-live="polite">
            {message}
          </p>
        </form>

        <div className="auth-switch">
          <span>New to AUC Atlas?</span>
          <Link href="/signup">Create account</Link>
        </div>
      </section>

      {needsAuthenticator ? (
        <div className="auth-two-factor-panel" role="dialog" aria-modal="true">
          <section className="auth-two-factor-card">
            <p className="section-kicker">Two-factor authentication</p>
            <h2>Enter authenticator code</h2>
            <p>Open your authenticator app and enter the 6-digit code for AUC Atlas.</p>

            <form className="auth-form" onSubmit={handleAuthenticator}>
              <label>
                <span>Authenticator code</span>
                <input
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={6}
                  value={form.code}
                  onChange={(event) => updateField("code", event.target.value.replace(/\D/g, ""))}
                />
              </label>

              <div className="auth-two-factor-actions">
                <button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Verifying..." : "Verify code"}
                </button>
                <button
                  className="auth-link-button"
                  type="button"
                  onClick={() => {
                    setNeedsAuthenticator(false);
                    updateField("code", "");
                  }}
                >
                  Back to login
                </button>
              </div>
            </form>
          </section>
        </div>
      ) : null}
    </main>
  );
}
