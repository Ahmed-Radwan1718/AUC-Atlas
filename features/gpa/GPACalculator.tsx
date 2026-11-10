"use client";

import { useEffect } from "react";
import { mountGpaCalculator } from "./gpaRuntime";
import "./gpa.css";

const markup = `

    <div class="gpa-inner">
      <header class="gpa-header">
        <div class="gpa-header-copy">
          <h1>GPA Calculator.</h1>
        </div>

      </header>

      <div class="gpa-layout">
        <section class="gpa-panel" aria-label="Your semesters">
          <div class="gpa-semesters" id="gpa-semesters" aria-live="off" aria-busy="true">
            <div class="gpa-loading" role="status" aria-label="Loading your GPA plan">
              <span class="gpa-loading-a11y">Loading your GPA plan...</span>
              <div class="gpa-skeleton-top" aria-hidden="true">
                <span class="gpa-skeleton-shape gpa-skeleton-title"></span>
                <span class="gpa-skeleton-shape gpa-skeleton-count"></span>
              </div>
              <div class="gpa-skeleton-labels" aria-hidden="true">
                <span class="gpa-skeleton-shape"></span>
                <span class="gpa-skeleton-shape"></span>
                <span class="gpa-skeleton-shape"></span>
              </div>
              <div class="gpa-skeleton-rows" aria-hidden="true">
                <div class="gpa-skeleton-row">
                  <span class="gpa-skeleton-shape gpa-skeleton-input"></span>
                  <span class="gpa-skeleton-shape gpa-skeleton-input"></span>
                  <span class="gpa-skeleton-shape gpa-skeleton-input"></span>
                  <span class="gpa-skeleton-shape gpa-skeleton-remove"></span>
                </div>
                <div class="gpa-skeleton-row">
                  <span class="gpa-skeleton-shape gpa-skeleton-input"></span>
                  <span class="gpa-skeleton-shape gpa-skeleton-input"></span>
                  <span class="gpa-skeleton-shape gpa-skeleton-input"></span>
                  <span class="gpa-skeleton-shape gpa-skeleton-remove"></span>
                </div>
                <div class="gpa-skeleton-row">
                  <span class="gpa-skeleton-shape gpa-skeleton-input"></span>
                  <span class="gpa-skeleton-shape gpa-skeleton-input"></span>
                  <span class="gpa-skeleton-shape gpa-skeleton-input"></span>
                  <span class="gpa-skeleton-shape gpa-skeleton-remove"></span>
                </div>
              </div>
              <div class="gpa-skeleton-footer" aria-hidden="true">
                <span class="gpa-skeleton-shape gpa-skeleton-add"></span>
                <span class="gpa-skeleton-shape gpa-skeleton-result"></span>
              </div>
            </div>
          </div>
          <button class="gpa-add-semester" type="button" id="add-semester" hidden>
            <span class="gpa-add-semester-icon" aria-hidden="true">+</span>
            Add semester
          </button>
        </section>

        <div class="gpa-sidebar">
        <aside class="gpa-summary" aria-label="GPA overview">
          <div class="summary-gpa" id="semester-gpa" aria-label="Overall GPA">0</div>
          <p class="summary-caption">Across all graded courses</p>
          <div class="summary-items">
            <div class="summary-item">
              <strong>Graded credits</strong>
              <span id="semester-credits">0</span>
            </div>
            <div class="summary-item">
              <strong>Semesters</strong>
              <span id="semester-count">0</span>
            </div>
            <div class="summary-item">
              <strong>Quality points</strong>
              <span id="quality-points">0.00</span>
            </div>
          </div>
        </aside>
        <div class="gpa-header-tools">
          <button class="gpa-action primary gpa-save-button" type="button" id="save-gpa-plan" disabled>Save plan</button>
          <button class="gpa-action reset-plan" type="button" id="reset-courses" disabled>Reset plan</button>
        </div>
        <span class="gpa-save-message" id="gpa-save-message" role="status" aria-live="polite"></span>
        </div>
      </div>
    </div>

    <div class="gpa-confirm-backdrop" id="gpa-reset-dialog" hidden>
      <div class="gpa-confirm-dialog" role="dialog" aria-modal="true" aria-labelledby="gpa-reset-title" aria-describedby="gpa-reset-description">
        <h2 id="gpa-reset-title">Reset your GPA plan?</h2>
        <p id="gpa-reset-description">This will clear the courses and semesters on this page. Your saved plan won't change unless you save again.</p>
        <div class="gpa-confirm-actions">
          <button class="gpa-action secondary" type="button" id="gpa-cancel-reset">Cancel</button>
          <button class="gpa-action danger" type="button" id="gpa-confirm-reset">Reset plan</button>
        </div>
      </div>
    </div>
`;

export default function GPACalculator() {
  useEffect(() => { mountGpaCalculator(); }, []);
  return <main className="gpa-page" dangerouslySetInnerHTML={{ __html: markup }} />;
}
