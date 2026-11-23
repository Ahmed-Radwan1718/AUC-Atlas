"use client";

import { useEffect, useState } from "react";
import { DEGREE_REQUIREMENTS } from "../../data/degree-requirements";
import {
  calculateDegreeProgress,
  formatDegreeCredits,
  type DegreeProgressSummary,
  type DegreeRequirementGroup
} from "./degreeProgressSummary";

type View =
  | { status: "loading" }
  | { status: "signed-out" }
  | { status: "no-major" }
  | { status: "unsupported"; major: string }
  | { status: "ready"; major: string; progress: DegreeProgressSummary }
  | { status: "error" };

type MeResponse = { signedIn?: boolean; user?: { major?: string } };
type ProgressResponse = { degreeProgress?: { major?: string; completedKeys?: string[] } | null };

async function readJson<T>(url: string, signal: AbortSignal): Promise<{ response: Response; data: T }> {
  const response = await fetch(url, {
    credentials: "same-origin",
    cache: "no-store",
    headers: { Accept: "application/json" },
    signal
  });
  const data = await response.json().catch(() => ({} as T));
  return { response, data: data as T };
}

export default function DegreeProgressPreview() {
  const [view, setView] = useState<View>({ status: "loading" });
  const [revision, setRevision] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    async function load() {
      setView({ status: "loading" });
      try {
        const me = await readJson<MeResponse>("/api/me", controller.signal);
        if (me.response.status === 401 || (me.response.ok && !me.data.signedIn)) {
          setView({ status: "signed-out" });
          return;
        }
        if (!me.response.ok || !me.data.user) throw new Error("Account unavailable.");

        const major = String(me.data.user.major || "").trim();
        if (!major) {
          setView({ status: "no-major" });
          return;
        }
        const plan = Object.prototype.hasOwnProperty.call(DEGREE_REQUIREMENTS, major)
          ? (DEGREE_REQUIREMENTS as Record<string, { groups?: DegreeRequirementGroup[] }>)[major]
          : undefined;
        if (!plan || !Array.isArray(plan.groups)) {
          setView({ status: "unsupported", major });
          return;
        }

        const saved = await readJson<ProgressResponse>("/api/academic-progress", controller.signal);
        if (saved.response.status === 401) {
          setView({ status: "signed-out" });
          return;
        }
        if (!saved.response.ok) throw new Error("Saved progress unavailable.");

        const completedKeys = saved.data.degreeProgress?.major === major &&
          Array.isArray(saved.data.degreeProgress.completedKeys)
          ? saved.data.degreeProgress.completedKeys
          : [];
        const progress = calculateDegreeProgress(plan.groups, completedKeys);
        if (progress.totalCredits <= 0) {
          setView({ status: "unsupported", major });
          return;
        }
        setView({ status: "ready", major, progress });
      } catch {
        if (!controller.signal.aborted) setView({ status: "error" });
      }
    }

    void load();
    return () => controller.abort();
  }, [revision]);

  return (
    <section className="new-homepage-degree" aria-labelledby="new-homepage-degree-title">
      <div className="new-homepage-degree-head">
        <div>
          <h2 id="new-homepage-degree-title">Degree Progression</h2>
        </div>
        {view.status === "ready" && (
          <a href="/degree-progression" className="new-homepage-degree-link">
            View requirements <span aria-hidden="true">↗</span>
          </a>
        )}
      </div>

      {view.status === "ready" ? (
        <div className="new-homepage-degree-body">
          <div className="new-homepage-degree-summary">
            <div className="new-homepage-degree-major">
              <p>{view.major}</p>
              <span>Based on the courses you have marked complete</span>
            </div>
            <div className="new-homepage-degree-percentage">
              <strong>{view.progress.percent}%</strong>
              <span>complete</span>
            </div>
          </div>

          <div
            className="new-homepage-degree-track"
            role="progressbar"
            aria-label={`${view.major} degree progress`}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={view.progress.percent}
          >
            <div className="new-homepage-degree-fill" style={{ width: `${view.progress.percent}%` }} />
          </div>

          <div className="new-homepage-degree-foot">
            <span><strong>{formatDegreeCredits(view.progress.completedCredits)}</strong> credits completed</span>
            <span><strong>{formatDegreeCredits(view.progress.remainingCredits)}</strong> credits remaining</span>
          </div>
        </div>
      ) : (
        <div className="new-homepage-degree-empty" aria-live="polite">
          {view.status === "loading" ? (
            <>
              <div className="new-homepage-degree-loading" aria-hidden="true" />
              <div className="new-homepage-degree-track is-empty" aria-hidden="true" />
              <p>Loading your saved degree progress...</p>
            </>
          ) : (
            <>
              <p className="new-homepage-degree-empty-title">
                {view.status === "signed-out" ? "See how far you've come."
                  : view.status === "no-major" ? "Start tracking your degree."
                  : view.status === "unsupported" ? "Your degree plan isn't available yet."
                  : "We couldn't load your progress."}
              </p>
              <p className="new-homepage-degree-empty-copy">
                {view.status === "signed-out"
                  ? "Sign in to see your completed credits and progress toward graduation."
                  : view.status === "no-major"
                    ? "Choose your major in Account Details to get started."
                    : view.status === "unsupported"
                      ? `We don't have a requirements plan for ${view.major} yet.`
                      : "Your saved progress hasn't changed. Try loading it again."}
              </p>
              <div className="new-homepage-degree-track is-empty" aria-hidden="true" />
              {view.status === "error" ? (
                <button className="new-homepage-degree-cta" type="button" onClick={() => setRevision(value => value + 1)}>
                  Try again
                </button>
              ) : (
                <a className="new-homepage-degree-cta" href={view.status === "signed-out" ? "/login" : "/accounts#details"}>
                  {view.status === "signed-out" ? "Sign in" : "Account details"}
                  <span aria-hidden="true">↗</span>
                </a>
              )}
            </>
          )}
        </div>
      )}
    </section>
  );
}
