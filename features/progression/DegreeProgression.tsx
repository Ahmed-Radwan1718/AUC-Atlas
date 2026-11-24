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
          <section class="degree-content">
            <article class="degree-panel" id="degree-panel" aria-busy="true">
              <div class="degree-loading" id="degree-loading" role="status" aria-label="Loading degree progression">
                <div aria-hidden="true">
                  <div class="degree-panel-header">
                    <span class="degree-skeleton degree-skeleton-major"></span>
                    <span class="degree-skeleton degree-skeleton-save"></span>
                  </div>
                  <div class="degree-summary-grid">
                    <div class="degree-completed-summary">
                      <span class="degree-skeleton degree-skeleton-label"></span>
                      <span class="degree-skeleton degree-skeleton-number"></span>
                    </div>
                    <span class="degree-skeleton degree-skeleton-percent"></span>
                    <span class="degree-skeleton degree-skeleton-track"></span>
                    <span class="degree-skeleton degree-skeleton-remaining"></span>
                  </div>
                  <div class="degree-requirement-group">
                    <div class="degree-requirement-group-head">
                      <div class="degree-group-title-row">
                        <span class="degree-skeleton degree-skeleton-group-title"></span>
                        <span class="degree-skeleton degree-skeleton-chevron"></span>
                      </div>
                      <div class="degree-group-progress-copy">
                        <span class="degree-skeleton degree-skeleton-group-label"></span>
                        <span class="degree-skeleton degree-skeleton-group-percent"></span>
                      </div>
                      <span class="degree-skeleton degree-skeleton-group-track"></span>
                    </div>
                    <div class="degree-group-body">
                      <div class="degree-requirement-list">
                        <div class="degree-requirement-item"><span class="degree-skeleton degree-skeleton-circle"></span><div class="degree-requirement-text"><span class="degree-skeleton degree-skeleton-code"></span><span class="degree-skeleton degree-skeleton-course" style="--skeleton-course-width:140px"></span></div><span class="degree-skeleton degree-skeleton-credit"></span></div>
                        <div class="degree-requirement-item"><span class="degree-skeleton degree-skeleton-circle"></span><div class="degree-requirement-text"><span class="degree-skeleton degree-skeleton-code"></span><span class="degree-skeleton degree-skeleton-course" style="--skeleton-course-width:210px"></span></div><span class="degree-skeleton degree-skeleton-credit"></span></div>
                        <div class="degree-requirement-item"><span class="degree-skeleton degree-skeleton-circle"></span><div class="degree-requirement-text"><span class="degree-skeleton degree-skeleton-code"></span><span class="degree-skeleton degree-skeleton-course" style="--skeleton-course-width:260px"></span></div><span class="degree-skeleton degree-skeleton-credit"></span></div>
                        <div class="degree-requirement-item"><span class="degree-skeleton degree-skeleton-circle"></span><div class="degree-requirement-text"><span class="degree-skeleton degree-skeleton-code"></span><span class="degree-skeleton degree-skeleton-course" style="--skeleton-course-width:190px"></span></div><span class="degree-skeleton degree-skeleton-credit"></span></div>
                        <div class="degree-requirement-item"><span class="degree-skeleton degree-skeleton-circle"></span><div class="degree-requirement-text"><span class="degree-skeleton degree-skeleton-code"></span><span class="degree-skeleton degree-skeleton-course" style="--skeleton-course-width:235px"></span></div><span class="degree-skeleton degree-skeleton-credit"></span></div>
                        <div class="degree-requirement-item"><span class="degree-skeleton degree-skeleton-circle"></span><div class="degree-requirement-text"><span class="degree-skeleton degree-skeleton-code"></span><span class="degree-skeleton degree-skeleton-course" style="--skeleton-course-width:165px"></span></div><span class="degree-skeleton degree-skeleton-credit"></span></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div id="degree-live-content" hidden>
              <div class="degree-panel-header">
                <div>
                  <h2 id="degree-major-name"></h2>
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
              </div>

              <p class="degree-note" id="degree-plan-note" hidden></p>
              </div>
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
