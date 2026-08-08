"use client";

import Link from "next/link";
import { useState } from "react";

const initialForm = {
  fullName: "",
  aucId: "",
  phone: "",
  email: "",
  password: "",
  confirmPassword: "",
  consentAccepted: false
};

export default function SignupForm() {
  const [form, setForm] = useState(initialForm);
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  function updateField(name, value) {
    setForm((current) => ({ ...current, [name]: value }));
  }

  function showError(text) {
    setStatus("error");
    setMessage(text);
  }

  async function handleSubmit(event) {
    event.preventDefault();

    const fullName = form.fullName.trim();
    const aucId = form.aucId.replace(/\D/g, "").slice(0, 9);
    const phone = form.phone.trim();
    const email = form.email.trim().toLowerCase();
    const phoneDigits = phone.replace(/\D/g, "");

    if (!fullName || !aucId || !phone || !email || !form.password || !form.confirmPassword) {
      showError("Please complete all required fields.");
      return;
    }

    if (!/^900\d{6}$/.test(aucId)) {
      showError("AUC ID number must start with 900 and be 9 digits total.");
      return;
    }

    if (!/^[^@\s]+@aucegypt\.edu$/.test(email)) {
      showError("Please use your AUC email address (@aucegypt.edu).");
      return;
    }

    if (
      !/^\+?[0-9][0-9\s().-]{7,28}$/.test(phone) ||
      phoneDigits.length < 10 ||
      phoneDigits.length > 15 ||
      /^(\d)\1+$/.test(phoneDigits)
    ) {
      showError("Please enter a valid phone number.");
      return;
    }

    if (form.password !== form.confirmPassword) {
      showError("Passwords do not match.");
      return;
    }

    if (
      form.password.length < 10 ||
      form.password.length > 48 ||
      !/[A-Z]/.test(form.password) ||
      !/[a-z]/.test(form.password) ||
      !/[0-9]/.test(form.password) ||
      !/[^A-Za-z0-9\s]/.test(form.password)
    ) {
      showError("Password must be 10 to 48 characters and include uppercase, lowercase, special, and numeric characters.");
      return;
    }

    if (!form.consentAccepted) {
      showError("Please agree to the Terms of Service and confirm that you have read the Privacy Notice.");
      return;
    }

    setIsSubmitting(true);
    setStatus("");
    setMessage("");

    try {
      const response = await fetch("/api/signup", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName,
          aucId,
          phone,
          email,
          password: form.password,
          confirmPassword: form.confirmPassword,
          consentAccepted: form.consentAccepted
        })
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Could not create account.");
      }

      try {
        localStorage.setItem("auc-atlas-signed-in", "1");
        localStorage.setItem("aucAtlasSignedIn", "true");
      } catch (error) {}

      setStatus("success");
      setMessage(data.message || "Account created successfully. Check your inbox to verify your email.");

      window.setTimeout(() => {
        window.location.href = "/accounts";
      }, 900);
    } catch (error) {
      showError(error.message || "Could not create account.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="auth-page-shell">
      <section className="auth-card">
        <p className="section-kicker">Create account</p>
        <h1>Start with your AUC email.</h1>
        <p>
          A verified account keeps materials, reviews, degree progress, and
          student-only tools connected to the right community.
        </p>

        <form className="auth-form" onSubmit={handleSubmit}>
          <label>
            <span>Full name</span>
            <input
              type="text"
              autoComplete="name"
              placeholder="Your name"
              value={form.fullName}
              onChange={(event) => updateField("fullName", event.target.value)}
            />
          </label>

          <label>
            <span>AUC ID number</span>
            <input
              type="text"
              inputMode="numeric"
              maxLength={9}
              placeholder="900000000"
              value={form.aucId}
              onChange={(event) => updateField("aucId", event.target.value.replace(/\D/g, ""))}
            />
          </label>

          <label>
            <span>Phone number</span>
            <input
              type="tel"
              autoComplete="tel"
              placeholder="+20..."
              value={form.phone}
              onChange={(event) => updateField("phone", event.target.value)}
            />
          </label>

          <label>
            <span>AUC email</span>
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
              autoComplete="new-password"
              placeholder="Create a password"
              value={form.password}
              onChange={(event) => updateField("password", event.target.value)}
            />
          </label>

          <label>
            <span>Confirm password</span>
            <input
              type="password"
              autoComplete="new-password"
              placeholder="Repeat your password"
              value={form.confirmPassword}
              onChange={(event) => updateField("confirmPassword", event.target.value)}
            />
          </label>

          <p className="auth-form-note">
            Use 10 to 48 characters with uppercase, lowercase, numeric, and special characters.
          </p>

          <label className="auth-consent">
            <input
              type="checkbox"
              checked={form.consentAccepted}
              onChange={(event) => updateField("consentAccepted", event.target.checked)}
            />
            <span>
              I agree to the <Link href="/terms">Terms of Service</Link> and confirm that I have read the{" "}
              <Link href="/privacy">Privacy Notice</Link>.
            </span>
          </label>

          <button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Creating account..." : "Create account"}
          </button>

          <p className={`auth-message ${status}`} aria-live="polite">
            {message}
          </p>
        </form>

        <div className="auth-switch">
          <span>Already have an account?</span>
          <Link href="/login">Log in</Link>
        </div>
      </section>
    </main>
  );
}
