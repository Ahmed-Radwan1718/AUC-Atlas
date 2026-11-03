"use client";

import { type FormEvent, useRef, useState } from "react";

type ForgotPasswordResponse = {
  success?: boolean;
  error?: string;
  message?: string;
};

export function ForgotPasswordForm() {
  const emailRef = useRef<HTMLInputElement>(null);
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"error" | "success" | "">("");
  const [submitting, setSubmitting] = useState(false);

  function showMessage(nextMessage: string, type: "error" | "success" | "" = "") {
    setMessage(nextMessage);
    setMessageType(type);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const cleanEmail = email.trim();

    if (!cleanEmail) {
      showMessage("Please enter your email address.", "error");
      emailRef.current?.focus();
      return;
    }

    if (!emailRef.current?.checkValidity()) {
      showMessage("Please enter a valid email address.", "error");
      emailRef.current?.focus();
      return;
    }

    setSubmitting(true);
    showMessage("");

    try {
      const response = await fetch("/api/forgot-password", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: cleanEmail }),
      });

      const data = (await response.json().catch(() => ({}))) as ForgotPasswordResponse;

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Could not send the password reset email.");
      }

      showMessage(
        data.message ||
          "If an AUC Atlas account exists for this email, a password reset link has been sent.",
        "success",
      );
    } catch (error) {
      showMessage(
        error instanceof Error
          ? error.message
          : "Could not send the password reset email. Please try again.",
        "error",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <form className="auth-form" onSubmit={handleSubmit}>
        <div className="auth-field">
          <label htmlFor="reset-email">Email Address</label>
          <input
            ref={emailRef}
            type="email"
            id="reset-email"
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
        </div>

        <button className="auth-button" type="submit" disabled={submitting}>
          {submitting ? "Sending..." : "Send Reset Link"}
        </button>

        <p className={`auth-message${messageType ? ` ${messageType}` : ""}`} aria-live="polite">
          {message}
        </p>
      </form>

      <div className="auth-panel-footer">
        <span>Remembered your password?</span>
        <a href="/login">Log in</a>
      </div>

      <div className="auth-panel-footer">
        <span>Do not have an account?</span>
        <a href="/signup">Create one</a>
      </div>
    </>
  );
}
