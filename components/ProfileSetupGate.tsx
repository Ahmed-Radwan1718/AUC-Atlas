"use client";

import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { usePathname } from "next/navigation";
import { AUC_MAJOR_OPTIONS } from "../data/major-options";
import { enrollmentTermOptions } from "../lib/enrollmentTerm";
import "./profile-setup-gate.css";

type Profile = {
  signedIn: boolean;
  major?: string;
  enrollmentTerm?: string;
  complete?: boolean;
};

export default function ProfileSetupGate() {
  const pathname = usePathname();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [major, setMajor] = useState("");
  const [enrollmentTerm, setEnrollmentTerm] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const terms = useMemo(() => enrollmentTermOptions(), []);

  const authPage = /^\/(login|signup|forgot-password)(\/|$)/.test(pathname || "");
  const needsMajor = Boolean(profile?.signedIn && !profile.major?.trim());
  const needsTerm = Boolean(profile?.signedIn && !profile.enrollmentTerm?.trim());
  const needsSetup = !authPage && (needsMajor || needsTerm);

  useEffect(() => {
    if (authPage) return;
    const controller = new AbortController();

    void fetch("/api/profile-onboarding", {
      method: "GET",
      credentials: "same-origin",
      cache: "no-store",
      headers: { Accept: "application/json" },
      signal: controller.signal
    }).then(async response => {
      if (!response.ok) throw new Error("Profile setup could not be loaded.");
      return response.json() as Promise<Profile>;
    }).then(data => {
      if (controller.signal.aborted) return;
      setProfile(data);
      setMajor(data.major || "");
      setEnrollmentTerm(data.enrollmentTerm || "");
      setError("");
    }).catch(() => {
      if (!controller.signal.aborted) setError("Could not check your profile. Refresh to try again.");
    });

    return () => controller.abort();
  }, [authPage, pathname]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (needsSetup) {
      if (!dialog.open) dialog.showModal();
      document.body.classList.add("atlas-profile-setup-open");
    } else {
      if (dialog.open) dialog.close();
      document.body.classList.remove("atlas-profile-setup-open");
    }
    return () => document.body.classList.remove("atlas-profile-setup-open");
  }, [needsSetup]);

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saving || !needsSetup) return;
    if (!major || !enrollmentTerm) {
      setError("Choose your major and the semester you first enrolled.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const response = await fetch("/api/profile-onboarding", {
        method: "POST",
        credentials: "same-origin",
        cache: "no-store",
        headers: { Accept: "application/json", "Content-Type": "application/json" },
        body: JSON.stringify({ major, enrollmentTerm })
      });
      const data = await response.json();
      if (!response.ok || !data.complete) {
        throw new Error(data.error || "Could not save your information.");
      }
      setProfile(data);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not save your information.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <dialog className="atlas-profile-setup" ref={dialogRef}
      aria-labelledby="atlas-profile-setup-title"
      aria-describedby="atlas-profile-setup-description"
      onCancel={event => event.preventDefault()}>
      <form onSubmit={save} className="atlas-profile-setup-form">
        <span className="atlas-profile-setup-kicker">AUC Atlas</span>
        <h2 id="atlas-profile-setup-title">Complete your student profile</h2>
        <p id="atlas-profile-setup-description">
          Tell us when you first enrolled and what you study so we can tailor your academic experience.
        </p>
        <div className="atlas-profile-setup-fields">
          {needsTerm ? (
            <label className="atlas-profile-setup-field">
              <span>Semester you enrolled at AUC</span>
              <select value={enrollmentTerm} onChange={event => setEnrollmentTerm(event.target.value)}
                required disabled={saving}>
                <option value="">Select your enrollment semester</option>
                {terms.map(term => <option key={term} value={term}>{term}</option>)}
              </select>
            </label>
          ) : (
            <div className="atlas-profile-setup-saved">
              <span>Enrollment semester</span><strong>{profile?.enrollmentTerm}</strong>
            </div>
          )}
          {needsMajor ? (
            <label className="atlas-profile-setup-field">
              <span>Your major</span>
              <select value={major} onChange={event => setMajor(event.target.value)}
                required disabled={saving}>
                <option value="">Select your major</option>
                {AUC_MAJOR_OPTIONS.map(option => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
            </label>
          ) : (
            <div className="atlas-profile-setup-saved">
              <span>Your major</span><strong>{profile?.major}</strong>
            </div>
          )}
        </div>
        {error && <p className="atlas-profile-setup-error" role="alert">{error}</p>}
        <button type="submit" disabled={saving || !major || !enrollmentTerm}>
          {saving ? "Saving..." : "Save and continue"}
        </button>
        <p className="atlas-profile-setup-footnote">
          This setup is required once. Your information is saved to your account.
        </p>
      </form>
    </dialog>
  );
}
