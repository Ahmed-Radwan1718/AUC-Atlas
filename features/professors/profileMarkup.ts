import type { Professor } from "../../data/professors";

const escapeHtml = (value: unknown) => String(value ?? "")
  .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
  .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
const getProfessorId = (professor: Professor) =>
  String(professor.id || professor.name || "").trim().toLowerCase()
    .replace(/&/g,"and").replace(/[^a-z0-9]+/g,"-").replace(/^-+|-+$/g,"");
function renderProfessorReviewLoadingCards(): string {
  return Array.from({length:3},()=>[
    '<article class="professor-review-loading-card" aria-hidden="true">',
    '<div class="professor-review-loading-top"><span class="professor-review-loading-avatar"></span>',
    '<span class="professor-review-loading-line"></span>',
    '<span class="professor-review-loading-rating professor-review-loading-line"></span></div>',
    '<div class="professor-review-loading-detail">',
    '<span class="professor-review-loading-line is-context"></span>',
    '<span class="professor-review-loading-line is-note"></span>',
    '<span class="professor-review-loading-line is-note-short"></span></div></article>'
  ].join("")).join("");
}
function renderProfessorReviewStatsSkeleton(): string {
  return '<div class="professor-review-stat-skeleton" aria-hidden="true">' +
    Array.from({length:3},()=>'<div class="professor-review-stat-skeleton-row">' +
      '<div class="professor-review-stat-skeleton-head">' +
      '<span class="professor-review-stat-skeleton-line"></span>' +
      '<span class="professor-review-stat-skeleton-line is-value"></span></div>' +
      '<span class="professor-review-stat-skeleton-track"></span></div>').join("") + '</div>';
}
export function buildProfileMarkup(professor: Professor): string {
  const professorEmail = professor.email || "";
  const professorEmailMarkup = professorEmail
    ? '<span class="professor-profile-email">' + escapeHtml(professorEmail) + '</span>'
    : '<span class="professor-profile-email is-empty">Email coming soon</span>';
  return `
      <div class="professor-profile-main">
      <article class="professor-profile-card">
        <div class="professor-profile-image${getProfessorId(professor) === "ahmed-moustafa" ? " professor-profile-image--ahmed-moustafa" : ""}">
          <img src="${escapeHtml(professor.image && professor.image !== "user.png" ? professor.image : "/user.png")}" alt="${escapeHtml(professor.name)}">
        </div>
        <div class="professor-profile-body">
          <div class="professor-profile-info">
            <div class="professor-profile-identity">
              <h1 class="professor-profile-name">${escapeHtml(professor.name)}</h1>
              <p class="professor-profile-department">${escapeHtml(professor.department || "Department coming soon")}</p>
            </div>

            <div>
              <span>Email</span>
              ${professorEmailMarkup}
            </div>

            <div id="professor-teaches-row" hidden>
              <span>Teaches</span>
              <span class="professor-profile-value professor-profile-course-list" id="professor-teaches-list"></span>
            </div>
          </div>

          <details class="professor-review-panel">
            <summary class="professor-review-toggle">Leave a review</summary>

            <div class="review-modal-backdrop" aria-hidden="true"></div>

            <form class="professor-review-form" role="dialog" aria-modal="true" aria-labelledby="review-drawer-title" tabindex="-1">

              <div class="review-modal-header">
                <h2 id="review-drawer-title">Leave a review</h2>
              </div>

              <input type="hidden" name="professorId" value="${escapeHtml(getProfessorId(professor))}">
              <input type="hidden" name="professorName" value="${escapeHtml(professor.name)}">

              <div class="review-drawer-body">
              <section class="review-core-section" aria-labelledby="review-core-heading">
                <h3 id="review-core-heading">Course &amp; rating</h3>
                <div class="review-core-grid">
              <div class="review-field">
                <label for="review-course-search">Course taken</label>
                <select id="review-course" name="courseTaken" class="review-native-select" required>
                  <option value="" selected disabled>Choose course</option>
                </select>
                <div class="review-course-search-wrap">
                  <input
                    id="review-course-search"
                    class="review-course-search-input"
                    type="search"
                    placeholder="Search courses by code or title"
                    autocomplete="off"
                    autocapitalize="off"
                    spellcheck="false"
                    role="combobox"
                    aria-autocomplete="list"
                    aria-controls="review-course-suggestions"
                    aria-expanded="false"
                  >
                  <div id="review-course-suggestions" class="review-course-suggestions" role="listbox" aria-label="Matching courses" hidden></div>
                </div>
              </div>

              <div class="review-field">
                <label for="review-semester-search">Semester taken</label>
                <select id="review-semester" name="semesterTaken" class="review-native-select" required>
                  <option value="" selected disabled>Choose semester</option>
                  <option>Fall 2026</option>
                  <option>Summer 2026</option>
                  <option>Spring 2026</option>
                  <option>Winter 2026</option>
                  <option>Fall 2025</option>
                  <option>Summer 2025</option>
                  <option>Spring 2025</option>
                  <option>Winter 2025</option>
                  <option>Fall 2024</option>
                  <option>Summer 2024</option>
                  <option>Spring 2024</option>
                  <option>Winter 2024</option>
                  <option>Fall 2023</option>
                  <option>Summer 2023</option>
                  <option>Spring 2023</option>
                  <option>Winter 2023</option>
                  <option>Fall 2022</option>
                  <option>Summer 2022</option>
                  <option>Spring 2022</option>
                  <option>Winter 2022</option>
                  <option>Fall 2021</option>
                  <option>Summer 2021</option>
                  <option>Spring 2021</option>
                  <option>Winter 2021</option>
                  <option>Fall 2020</option>
                  <option>Summer 2020</option>
                  <option>Spring 2020</option>
                  <option>Winter 2020</option>
                  <option>Fall 2019</option>
                  <option>Summer 2019</option>
                  <option>Spring 2019</option>
                  <option>Winter 2019</option>
                  <option>Fall 2018</option>
                  <option>Summer 2018</option>
                  <option>Spring 2018</option>
                  <option>Winter 2018</option>
                </select>
                <div class="review-course-search-wrap">
                  <input
                    id="review-semester-search"
                    class="review-course-search-input"
                    type="search"
                    placeholder="Search semesters (e.g. Fall 2026)"
                    autocomplete="off"
                    autocapitalize="off"
                    spellcheck="false"
                    role="combobox"
                    aria-autocomplete="list"
                    aria-controls="review-semester-suggestions"
                    aria-expanded="false"
                  >
                  <div id="review-semester-suggestions" class="review-course-suggestions" role="listbox" aria-label="Matching semesters" hidden></div>
                </div>
              </div>
                </div>

              <div class="review-field review-rating-field">
                <label id="review-rating-label" for="review-rating">Overall rating</label>
                <select id="review-rating" class="review-native-select" name="rating" required>
                  <option value="" selected disabled>Choose rating</option>
                  <option value="5">5 stars</option>
                  <option value="4">4 stars</option>
                  <option value="3">3 stars</option>
                  <option value="2">2 stars</option>
                  <option value="1">1 star</option>
                </select>
                <div class="review-rating-stars" role="group" aria-labelledby="review-rating-label">
                  <button type="button" class="review-rating-star" data-review-rating="1" aria-label="1 star" aria-pressed="false">★</button>
                  <button type="button" class="review-rating-star" data-review-rating="2" aria-label="2 stars" aria-pressed="false">★</button>
                  <button type="button" class="review-rating-star" data-review-rating="3" aria-label="3 stars" aria-pressed="false">★</button>
                  <button type="button" class="review-rating-star" data-review-rating="4" aria-label="4 stars" aria-pressed="false">★</button>
                  <button type="button" class="review-rating-star" data-review-rating="5" aria-label="5 stars" aria-pressed="false">★</button>
                </div>
              </div>

              <div class="review-field review-recommend-field">
                <label id="review-recommend-label" for="review-recommend">Would you recommend this professor?</label>
                <select id="review-recommend" class="review-native-select" name="recommendation">
                  <option value="" selected>Choose recommendation</option>
                  <option>Yes</option>
                  <option>Depends</option>
                  <option>No</option>
                </select>
                <div class="review-recommend-options" role="group" aria-labelledby="review-recommend-label">
                  <button type="button" data-review-recommend="Yes" aria-pressed="false">Yes</button>
                  <button type="button" data-review-recommend="Depends" aria-pressed="false">Depends</button>
                  <button type="button" data-review-recommend="No" aria-pressed="false">No</button>
                </div>
              </div>

              <div class="review-field full" data-depends-reason hidden>
                <label for="review-recommend-reason">If your answer depends, what does it depend on?</label>
                <input id="review-recommend-reason" name="recommendationReason" type="text" maxlength="220" placeholder="Example: Great for lectures, harder for exams">
              </div>
              </section>

              <details class="review-accordion" data-review-section="experience">
                <summary>
                  <span class="review-accordion-label">
                    <strong>Class experience</strong>
                    <small>Attendance, workload, lectures &amp; office hours</small>
                  </span>
                  <span class="review-accordion-meta" data-review-count>0/4 answered</span>
                </summary>
                <div class="review-accordion-body">

              <div class="review-field">
                <label for="review-attendance">Attendance policy</label>
                <select id="review-attendance" name="attendancePolicy">
                  <option value="" selected>Choose attendance policy</option>
                  <option>Required</option>
                  <option>Sometimes checked</option>
                  <option>Not important</option>
                  <option>Not sure</option>
                </select>
              </div>

              <div class="review-field">
                <label for="review-workload">Workload</label>
                <select id="review-workload" name="workload">
                  <option value="" selected>Choose workload</option>
                  <option>Light</option>
                  <option>Moderate</option>
                  <option>Heavy</option>
                </select>
              </div>

              <div class="review-field">
                <label for="review-lecture">Lecture usefulness</label>
                <select id="review-lecture" name="lectureUsefulness">
                  <option value="" selected>Choose lecture usefulness</option>
                  <option>Essential</option>
                  <option>Helpful</option>
                  <option>Skippable</option>
                  <option>Not lecture-based</option>
                </select>
              </div>

              <div class="review-field">
                <label for="review-office-hours">Office hours/help</label>
                <select id="review-office-hours" name="officeHours">
                  <option value="" selected>Choose an option</option>
                  <option>Helpful</option>
                  <option>Available but limited</option>
                  <option>Hard to reach</option>
                  <option>Did not use</option>
                </select>
              </div>
                </div>
              </details>

              <details class="review-accordion" data-review-section="grading">
                <summary>
                  <span class="review-accordion-label">
                    <strong>Grading &amp; advice</strong>
                    <small>Exams, marking, feedback &amp; comments</small>
                  </span>
                  <span class="review-accordion-meta" data-review-count>0/4 answered</span>
                </summary>
                <div class="review-accordion-body">

              <div class="review-field">
                <label for="review-grading-style">Grading style</label>
                <select id="review-grading-style" name="gradingStyle">
                  <option value="" selected>Choose grading style</option>
                  <option>Exams-heavy</option>
                  <option>Projects-heavy</option>
                  <option>Assignments-heavy</option>
                  <option>Participation-heavy</option>
                  <option>Mixed</option>
                </select>
              </div>

              <div class="review-field">
                <label for="review-exam-difficulty">Exam difficulty</label>
                <select id="review-exam-difficulty" name="examDifficulty">
                  <option value="" selected>Choose exam difficulty</option>
                  <option>Easier than class material</option>
                  <option>Matches class material</option>
                  <option>Harder than class material</option>
                  <option>No exams</option>
                </select>
              </div>

              <div class="review-field">
                <label for="review-transparency">Grading transparency</label>
                <select id="review-transparency" name="gradingTransparency">
                  <option value="" selected>Choose grading transparency</option>
                  <option>Rubric is clear</option>
                  <option>Somewhat clear</option>
                  <option>Unclear</option>
                </select>
              </div>

              <div class="review-field">
                <label for="review-feedback">Feedback quality</label>
                <select id="review-feedback" name="feedbackQuality">
                  <option value="" selected>Choose feedback quality</option>
                  <option>Helpful</option>
                  <option>Minimal</option>
                  <option>None</option>
                  <option>Not applicable</option>
                </select>
              </div>

              <div class="review-field full">
                <label for="review-note">Additional comments (optional)</label>
                <textarea id="review-note" name="studentNote" maxlength="5000"></textarea>
              </div>
                </div>
              </details>

              <label class="review-anonymous-option">
                <span class="review-anonymous-copy">
                  <strong>Post anonymously</strong>
                  <small>Your name and profile photo won’t appear with this review.</small>
                </span>
                <input name="isAnonymous" type="checkbox" value="true">
              </label>

              </div>

              <div class="review-drawer-footer">
                <button class="review-submit-button" type="submit">Submit Review</button>
                <p class="review-form-message" aria-live="polite"></p>
                <button class="review-cancel-button" type="button">Cancel</button>
              </div>
            </form>
          </details>
        </div>
      </article>

      <section class="professor-reviews-section" aria-label="Student reviews for ${escapeHtml(professor.name)}">
        <div class="professor-reviews-header">
          <div>
            <h2>What students said</h2>
          </div>
          <p id="professor-reviews-count" class="is-loading" aria-label="Loading reviews"><span class="professor-review-count-loading" aria-hidden="true"></span></p>
        </div>

        <div class="professor-reviews-list" id="professor-reviews-list" role="status" aria-busy="true" aria-label="Loading student reviews">
          ${renderProfessorReviewLoadingCards()}
        </div>
      </section>
      </div>

      <section class="professor-review-insights" aria-label="Review stats for ${escapeHtml(professor.name)}">
        <div class="professor-review-insights-header">
          <div>
            <h2>Class patterns</h2>
          </div>
          <p id="professor-review-stats-count" class="is-loading" aria-label="Loading review count"><span class="professor-review-stats-count-loading" aria-hidden="true"></span></p>
        </div>

        <div class="professor-review-stats" id="professor-review-stats" role="status" aria-busy="true" aria-label="Loading class patterns">
          ${renderProfessorReviewStatsSkeleton()}
        </div>
      </section>
    `;
}
