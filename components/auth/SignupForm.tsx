"use client";

import { type FormEvent, useState } from "react";
import { PasswordField } from "@/components/auth/PasswordField";

type SignupResponse = {
  success?: boolean;
  error?: string;
  message?: string;
};

export function SignupForm() {
  const [fullName, setFullName] = useState("");
  const [aucId, setAucId] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [consentAccepted, setConsentAccepted] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"error" | "success" | "">("");
  const [submitting, setSubmitting] = useState(false);

  function showMessage(nextMessage: string, type: "error" | "success" | "" = "") {
    setMessage(nextMessage);
    setMessageType(type);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const cleanFullName = fullName.trim();
    const cleanAucId = aucId.replace(/\D/g, "");
    const cleanEmail = email.trim().toLowerCase();

    if (!cleanFullName || !cleanAucId || !cleanEmail || !password || !confirmPassword) {
      showMessage("Please complete all required fields.", "error");
      return;
    }

    if (!/^900\d{6}$/.test(cleanAucId)) {
      showMessage("Incorrect ID number.", "error");
      return;
    }

    if (!/^[^@\s]+@aucegypt\.edu$/.test(cleanEmail)) {
      showMessage("Please use your AUC email address (@aucegypt.edu).", "error");
      return;
    }

    if (password !== confirmPassword) {
      showMessage("Passwords do not match.", "error");
      return;
    }

    if (
      password.length < 10 ||
      password.length > 48 ||
      !/[A-Z]/.test(password) ||
      !/[a-z]/.test(password) ||
      !/[0-9]/.test(password) ||
      !/[^A-Za-z0-9\s]/.test(password)
    ) {
      showMessage(
        "Password must be 10 to 48 characters and include uppercase, lowercase, special, and numeric characters.",
        "error",
      );
      return;
    }

    setSubmitting(true);
    showMessage("");

    try {
      const response = await fetch("/api/signup", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: cleanFullName,
          aucId: cleanAucId,
          email: cleanEmail,
          password,
          confirmPassword,
          consentAccepted,
        }),
      });

      const data = (await response.json().catch(() => ({}))) as SignupResponse;

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Could not create account. Please try again.");
      }

      setFullName("");
      setAucId("");
      setEmail("");
      setPassword("");
      setConfirmPassword("");
      setConsentAccepted(false);

      showMessage(
        data.message || "Account created successfully. Verify your AUC email before logging in.",
        "success",
      );

      window.setTimeout(() => {
        window.location.href = "/login";
      }, 2500);
    } catch (error) {
      showMessage(
        error instanceof Error ? error.message : "Something went wrong. Please try again.",
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
          <label htmlFor="signup-name">Full Name</label>
          <input
            type="text"
            id="signup-name"
            autoComplete="name"
            value={fullName}
            onChange={(event) => setFullName(event.target.value)}
          />
        </div>

        <div className="auth-field">
          <label htmlFor="signup-auc-id">AUC ID Number</label>
          <input
            type="text"
            id="signup-auc-id"
            inputMode="numeric"
            autoComplete="off"
            maxLength={9}
            value={aucId}
            onChange={(event) => setAucId(event.target.value)}
          />
        </div>

        <div className="auth-field">
          <label htmlFor="signup-email">AUC Email Address</label>
          <input
            type="email"
            id="signup-email"
            autoComplete="email"
            placeholder="name@aucegypt.edu"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
        </div>

        <PasswordField
          id="signup-password"
          label="Password"
          autoComplete="new-password"
          value={password}
          onChange={setPassword}
        />

        <PasswordField
          id="signup-confirm-password"
          label="Confirm Password"
          autoComplete="new-password"
          value={confirmPassword}
          onChange={setConfirmPassword}
          confirmLabel
        />

        <p className="auth-small-note">
          Use 10 to 48 characters with uppercase, lowercase, special, and numeric characters.
        </p>

        <label className="auth-consent" htmlFor="signup-consent">
          <input
            type="checkbox"
            id="signup-consent"
            required
            checked={consentAccepted}
            onChange={(event) => setConsentAccepted(event.target.checked)}
          />
          <span>
            By signing up, you agree to the site&apos;s{" "}
            <a href="/terms" target="_blank" rel="noopener noreferrer">
              Terms of Service
            </a>{" "}
            and confirm that you have read the{" "}
            <a href="/privacy" target="_blank" rel="noopener noreferrer">
              Privacy Policy
            </a>
            .
          </span>
        </label>

        <button className="auth-button" type="submit" disabled={submitting}>
          {submitting ? "Creating Account..." : "Create Account"}
        </button>

        <p className={`auth-message${messageType ? ` ${messageType}` : ""}`} aria-live="polite">
          {message}
        </p>
      </form>

      <div className="auth-panel-footer">
        <span>Already have an account?</span>
        <a href="/login">Log in</a>
      </div>
    </>
  );
}
