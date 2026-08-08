"use client";

import Link from "next/link";
import { useState } from "react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState("");
  const [isSending, setIsSending] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();

    if (!email.trim()) {
      setStatus("error");
      setMessage("Please enter your email address.");
      return;
    }

    setIsSending(true);
    setStatus("");
    setMessage("");

    try {
      const response = await fetch("/api/forgot-password", {
        method: "POST",
        credentials: "same-origin",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ email: email.trim() })
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Could not send the password reset email.");
      }

      setStatus("success");
      setMessage(
        data.message ||
          "If an AUC Atlas account exists for this email, a password reset link has been sent."
      );
    } catch (error) {
      setStatus("error");
      setMessage(error.message || "Could not send the password reset email. Please try again.");
    } finally {
      setIsSending(false);
    }
  }

  return (
    <main className="auth-page-shell">
      <section className="auth-card">
        <p className="section-kicker">Account recovery</p>
        <h1>Forgot password</h1>
        <p>Enter your account email address and AUC Atlas will send a password reset link.</p>

        <form className="auth-form" onSubmit={handleSubmit}>
          <label>
            <span>Email address</span>
            <input
              type="email"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
          </label>

          <button type="submit" disabled={isSending}>
            {isSending ? "Sending..." : "Send reset link"}
          </button>

          <p className={`auth-message ${status}`} aria-live="polite">
            {message}
          </p>
        </form>

        <div className="auth-switch">
          <span>Remembered your password?</span>
          <Link href="/login">Log in</Link>
        </div>

        <div className="auth-switch">
          <span>Do not have an account?</span>
          <Link href="/signup">Create one</Link>
        </div>
      </section>
    </main>
  );
}
