"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

export default function AccountDashboard() {
  const [user, setUser] = useState(null);
  const [form, setForm] = useState({ fullName: "", major: "" });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState("");

  useEffect(() => {
    let isMounted = true;

    async function loadAccount() {
      try {
        const response = await fetch("/api/me", {
          credentials: "same-origin",
          cache: "no-store",
          headers: { Accept: "application/json" }
        });

        const data = await response.json().catch(() => ({}));

        if (!isMounted) {
          return;
        }

        if (data.signedIn && data.user) {
          setUser(data.user);
          setForm({
            fullName: data.user.fullName || data.user.displayName || "",
            major: data.user.major || ""
          });
        } else {
          setUser(null);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadAccount();

    return () => {
      isMounted = false;
    };
  }, []);

  function updateField(name, value) {
    setForm((current) => ({ ...current, [name]: value }));
  }

  async function handleSave(event) {
    event.preventDefault();

    if (!form.fullName.trim()) {
      setStatus("error");
      setMessage("Please enter your display name.");
      return;
    }

    setIsSaving(true);
    setStatus("");
    setMessage("");

    try {
      const response = await fetch("/api/me", {
        method: "PATCH",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: form.fullName.trim(),
          aucId: user?.aucId || "",
          phone: user?.phone || "",
          major: form.major.trim()
        })
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Could not save account details.");
      }

      setUser(data.user);
      setForm({
        fullName: data.user.fullName || data.user.displayName || "",
        major: data.user.major || ""
      });
      setStatus("success");
      setMessage("Account details saved.");
    } catch (error) {
      setStatus("error");
      setMessage(error.message || "Could not save account details.");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleLogout() {
    await fetch("/api/logout", {
      method: "POST",
      credentials: "same-origin"
    }).catch(() => {});

    try {
      localStorage.removeItem("auc-atlas-signed-in");
      localStorage.removeItem("aucAtlasSignedIn");
    } catch (error) {}

    window.location.href = "/login";
  }

  if (isLoading) {
    return (
      <main className="tool-page-shell">
        <section className="tool-hero">
          <div>
            <p className="section-kicker">My Account</p>
            <h1>Checking your session.</h1>
          </div>
          <p>Loading your AUC Atlas account dashboard.</p>
        </section>

        <section className="account-section-grid">
          <article className="account-section-card account-wide-card">
            <span>Loading</span>
            <h2>Account details</h2>
            <p>Checking whether you are signed in.</p>
          </article>
        </section>
      </main>
    );
  }

  if (!user) {
    return (
      <main className="tool-page-shell">
        <section className="tool-hero">
          <div>
            <p className="section-kicker">My Account</p>
            <h1>Log in to manage your account.</h1>
          </div>
          <p>Your profile, materials, reviews, security, and saved progress live here.</p>
        </section>

        <section className="account-section-grid">
          <article className="account-section-card account-wide-card">
            <span>Signed out</span>
            <h2>Account access required</h2>
            <p>Log in with your AUC Atlas account to view and manage this dashboard.</p>
            <div className="account-actions">
              <Link className="atlas-button" href="/login">Log in</Link>
              <Link className="atlas-button atlas-button-secondary" href="/signup">Create account</Link>
            </div>
          </article>
        </section>
      </main>
    );
  }

  return (
    <main className="tool-page-shell">
      <section className="tool-hero">
        <div>
          <p className="section-kicker">My Account</p>
          <h1>{user.firstName ? `${user.firstName}'s dashboard.` : "Your student dashboard."}</h1>
        </div>
        <p>
          Manage profile details, sign-in state, security status, saved progress,
          reviews, and uploaded materials from one consistent surface.
        </p>
      </section>

      <section className="account-section-grid">
        <article className="account-section-card account-wide-card">
          <span>Profile</span>
          <h2>Account details</h2>
          <p>Update your display name and major. Email, AUC ID, and phone are protected account identifiers.</p>

          <form className="auth-form account-form" onSubmit={handleSave}>
            <div className="account-detail-grid">
              <label>
                <span>Display name</span>
                <input
                  type="text"
                  value={form.fullName}
                  onChange={(event) => updateField("fullName", event.target.value)}
                />
              </label>

              <label>
                <span>Major</span>
                <input
                  type="text"
                  value={form.major}
                  placeholder="Major not set"
                  onChange={(event) => updateField("major", event.target.value)}
                />
              </label>

              <label>
                <span>Email</span>
                <input type="email" value={user.email || ""} readOnly />
              </label>

              <label>
                <span>AUC ID</span>
                <input type="text" value={user.aucId || "Not saved"} readOnly />
              </label>

              <label>
                <span>Phone</span>
                <input type="text" value={user.phone || "Not saved"} readOnly />
              </label>

              <label>
                <span>Provider</span>
                <input type="text" value={user.authProvider || "password"} readOnly />
              </label>
            </div>

            <div className="account-actions">
              <button type="submit" disabled={isSaving}>
                {isSaving ? "Saving..." : "Save details"}
              </button>
              <button className="auth-link-button account-danger-button" type="button" onClick={handleLogout}>
                Log out
              </button>
            </div>

            <p className={`auth-message ${status}`} aria-live="polite">
              {message}
            </p>
          </form>
        </article>

        <article className="account-section-card">
          <span>Security</span>
          <h2>Sign-in security</h2>
          <p>
            {user.twoFactor?.appEnabled
              ? "Authenticator app two-factor authentication is enabled."
              : "Two-factor setup will move into this dashboard in the next pass."}
          </p>
        </article>

        <article className="account-section-card">
          <span>Email</span>
          <h2>{user.emailVerified ? "Email verified" : "Email not verified"}</h2>
          <p>
            {user.emailVerified
              ? "Your AUC email is verified for student-only account features."
              : "Check your inbox for the verification link sent during signup."}
          </p>
        </article>

        <article className="account-section-card">
          <span>Activity</span>
          <h2>Reviews and uploads</h2>
          <p>Review history and course-material uploads will connect here after the data views move over.</p>
        </article>

        <article className="account-section-card">
          <span>Degree progress</span>
          <h2>Saved planning</h2>
          <p>Saved requirement tracking will connect here with the degree progression migration.</p>
        </article>
      </section>
    </main>
  );
}
