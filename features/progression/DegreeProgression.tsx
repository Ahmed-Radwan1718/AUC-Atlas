"use client";

import { useEffect } from "react";
import { mountDegreeProgression } from "./degreeRuntime";
import "./progression.css";

const markup = `
    <section class="degree-section">
      <div class="degree-inner">
        <div class="degree-header">
          <h1>Degree progression</h1>
        </div>

        <div class="degree-layout">
          <aside class="account-sidebar">
            <a class="account-sidebar-link" href="/accounts#details">
              <span class="account-sidebar-icon account-details-icon" aria-hidden="true"></span>
              <span>Account details</span>
            </a>

            <a class="account-sidebar-link" href="/accounts#security">
              <span class="account-sidebar-icon account-security-icon" aria-hidden="true"></span>
              <span>Security</span>
            </a>

            <a class="account-sidebar-link active" href="/degree-progression" aria-current="page">
              <span class="account-sidebar-icon account-degree-icon" aria-hidden="true"></span>
              <span>Degree progression</span>
            </a>

            <a class="account-sidebar-link" href="/accounts#reviews">
              <span class="account-sidebar-icon account-reviews-icon" aria-hidden="true"></span>
              <span>Activity history</span>
            </a>

            <button class="account-sidebar-link account-logout-link" type="button" id="degree-logout-sidebar">
              <span class="account-logout-icon" aria-hidden="true"></span>
              <span>Log out</span>
            </button>
          </aside>

          <section class="degree-content">
            <article class="degree-panel">
              <div class="degree-panel-header">
                <div>
                  <h2 id="degree-major-name">Loading requirements</h2>
                  <p id="degree-major-copy" hidden></p>
                </div>

                <div class="degree-panel-actions">
                  <button
                    class="degree-save-button"
                    id="degree-save-progress"
                    type="button"
                    disabled
                  >
                    Save progress
                  </button>
                </div>
              </div>

              <div class="degree-summary-grid" aria-label="Degree progress summary">
                <div class="degree-completed-summary">
                  <span>Credits completed</span>
                  <div class="degree-completed-number">
                    <strong id="degree-completed-count">0</strong>
                    <span>/ <span id="degree-total-count">0</span></span>
                  </div>
                </div>
                <strong id="degree-progress-percent" class="degree-percent">0%</strong>
                <div class="degree-progress-track" role="progressbar" aria-label="Degree progress" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0">
                  <div class="degree-progress-bar" id="degree-progress-bar"></div>
                </div>
                <p class="degree-remaining"><span id="degree-remaining-count">0</span> credits remaining</p>
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
