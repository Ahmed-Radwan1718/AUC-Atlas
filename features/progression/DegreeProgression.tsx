"use client";

import { useEffect } from "react";
import { mountDegreeProgression } from "./degreeRuntime";
import "./progression.css";

const markup = `
    <section class="degree-section">
      <div class="degree-inner">
        <div class="degree-header">
          <h1>Degree Progression</h1>
          <p>Track your academic progress and remaining requirements.</p>
        </div>

        <div class="degree-layout">
          <aside class="account-sidebar">
            <a class="account-sidebar-link" href="/accounts#details">
              <span class="account-sidebar-icon account-details-icon" aria-hidden="true"></span>
              <span>Account Details</span>
            </a>

            <a class="account-sidebar-link" href="/accounts#security">
              <span class="account-sidebar-icon account-security-icon" aria-hidden="true"></span>
              <span>Security</span>
            </a>

            <a class="account-sidebar-link active" href="/degree-progression">
              <span class="account-sidebar-icon account-degree-icon" aria-hidden="true"></span>
              <span>Degree Progression</span>
            </a>

            <a class="account-sidebar-link" href="/accounts#reviews">
              <span class="account-sidebar-icon account-reviews-icon" aria-hidden="true"></span>
              <span>Activity History</span>
            </a>

            <button class="account-sidebar-link account-logout-link" type="button" id="degree-logout-sidebar">
              <span class="account-logout-icon" aria-hidden="true"></span>
              <span>Logout</span>
            </button>
          </aside>

          <section class="degree-content">
            <article class="degree-panel">
              <div class="degree-panel-header">
                <div>
                  <h2 id="degree-major-name">Loading Requirements</h2>
                  <p id="degree-major-copy">Your saved major will load here.</p>
                </div>

                <div class="degree-panel-actions">
                  <button
                    class="degree-save-button"
                    id="degree-save-progress"
                    type="button"
                    disabled
                  >
                    Save Progress
                  </button>
                </div>
              </div>

              <div class="degree-summary-grid" aria-label="Degree progress summary">
                <div class="degree-stat-card">
                  <span>Completed Credits</span>
                  <strong id="degree-completed-count">0</strong>
                </div>

                <div class="degree-stat-card">
                  <span>Remaining Credits</span>
                  <strong id="degree-remaining-count">0</strong>
                </div>

                <div class="degree-stat-card">
                  <span>Progress</span>
                  <strong id="degree-progress-percent">0%</strong>
                </div>

                <div class="degree-progress-track" aria-hidden="true">
                  <div class="degree-progress-bar" id="degree-progress-bar"></div>
                </div>
              </div>

              <p
                class="degree-save-message"
                id="degree-save-message"
                aria-live="polite"
              ></p>

              <div class="degree-requirements-grid" id="degree-requirements-root" aria-live="polite">
                <div class="degree-empty-state">
                  <h3>Loading requirements</h3>
                  <p>Checking your saved account major.</p>
                </div>
              </div>

              <p class="degree-note" id="degree-plan-note" hidden></p>
            </article>
          </section>
        </div>
      </div>
    </section>
  `;

export default function DegreeProgression() {
  useEffect(() => { mountDegreeProgression(); }, []);
  return <main className="degree-page" dangerouslySetInnerHTML={{ __html: markup }} />;
}
