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
          <div class="gpa-semesters" id="gpa-semesters" aria-live="off">
            <div class="gpa-loading" role="status">
              <span class="gpa-loading-spinner" aria-hidden="true"></span>
              <span>Loading your GPA plan...</span>
            </div>
          </div>
          <button class="gpa-add-semester" type="button" id="add-semester">
            <span class="gpa-add-semester-icon" aria-hidden="true">+</span>
            Add another semester
          </button>
        </section>

        <div class="gpa-sidebar">
        <aside class="gpa-summary" aria-label="GPA overview">
          <span class="summary-label">Your GPA</span>
          <div class="summary-gpa" id="semester-gpa" aria-label="Overall GPA">—</div>
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
          <button class="gpa-action primary gpa-save-button" type="button" id="save-gpa-plan">Save plan</button>
          <div class="gpa-overflow-wrap">
            <button class="gpa-overflow-button" id="gpa-overflow-button" type="button" aria-label="More GPA plan actions" aria-haspopup="menu" aria-controls="gpa-overflow-menu" aria-expanded="false">
              <span aria-hidden="true">•••</span>
            </button>
            <div class="gpa-overflow-menu" id="gpa-overflow-menu" role="menu" hidden>
              <button type="button" id="reset-courses" role="menuitem">Reset plan</button>
            </div>
          </div>
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
