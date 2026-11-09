"use client";

import { useEffect } from "react";
import { mountGpaCalculator } from "./gpaRuntime";
import "./gpa.css";

const markup = `
    <div class="gpa-inner">
      <section class="gpa-header">
        <div>
          <h1>Calculate your GPA.</h1>
        </div>

        <p>
          Add your courses, credits, and grades to calculate your overall GPA across multiple semesters.
        </p>
      </section>

      <section class="gpa-layout" aria-label="GPA calculator">
        <section class="gpa-panel">
          <div class="gpa-section-heading">
            <h2>Your semesters</h2>
            <p>Organize your courses by term. Your GPA updates as you enter grades.</p>
          </div>

          <div class="gpa-semesters" id="gpa-semesters">
            <div class="gpa-loading" role="status" aria-live="polite">
              <span class="gpa-loading-spinner" aria-hidden="true"></span>
              <span>Loading GPA calculator...</span>
            </div>
          </div>

          <div class="gpa-actions">
            <button class="gpa-action primary" type="button" id="save-gpa-plan">Save GPA Plan</button>
            <button class="gpa-action secondary" type="button" id="add-semester">Add Semester</button>
            <button class="gpa-action subtle" type="button" id="reset-courses">Reset</button>
          </div>

          <p
            class="gpa-save-message"
            id="gpa-save-message"
            aria-live="polite"
          ></p>
        </section>

        <aside class="gpa-summary">
          <span class="summary-label">Overall GPA</span>
          <div class="summary-gpa" id="semester-gpa">0.00</div>

          <div class="summary-items">
            <div class="summary-item">
              <strong>Credits</strong>
              <span id="semester-credits">0</span>
            </div>
            <div class="summary-item">
              <strong>Quality Points</strong>
              <span id="quality-points">0.00</span>
            </div>
            <div class="summary-item">
              <strong>Cumulative GPA</strong>
              <span id="cumulative-gpa">0.00</span>
            </div>
          </div>
        </aside>
      </section>
    </div>
  `;

export default function GPACalculator() {
  useEffect(() => { mountGpaCalculator(); }, []);
  return <main className="gpa-page" dangerouslySetInnerHTML={{ __html: markup }} />;
}
