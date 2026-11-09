"use client";

import { useEffect } from "react";
import CourseDialogs from "./CourseDialogs";
import { initializeCourses } from "./courseController";
import "./courses-1.css";
import "./courses-2.css";
import "./courses-3.css";
import "./courses-4.css";
import "./courses-5.css";

const markup = `
    <div class="courses-inner">
      <div class="courses-list-view" id="courses-list-view">
        <section class="courses-browser" aria-label="Course search and discovery">
          <section class="courses-results">
            <div class="courses-search-box">
              <input
                id="course-search-input"
                type="search"
                placeholder="Search courses..."
                aria-label="Search courses"
                aria-controls="course-search-dropdown"
                aria-expanded="false"
                autocomplete="off"
              >

              <div
                class="courses-search-dropdown"
                id="course-search-dropdown"
                hidden
              >
                <div class="courses-result-count" id="courses-result-count">
                  0 matches
                </div>

                <section
                  class="courses-grid"
                  id="courses-grid"
                  aria-label="Course search results"
                ></section>
              </div>
            </div>

            <div class="courses-home-content" id="courses-home-content">
              <section class="course-home-section" aria-labelledby="popular-courses-title">
                <div class="course-section-heading course-popular-heading">
                  <div>
                    <h2 id="popular-courses-title">Popular courses</h2>
                  </div>

                  <p>
                    Quick access to the foundational courses students search for most across AUC.
                  </p>
                </div>

                <div
                  class="course-popular-grid"
                  id="course-popular-grid"
                  aria-label="Popular courses"
                ></div>
              </section>

              <section class="course-home-section" aria-labelledby="recent-materials-title">
                <div class="course-section-heading">
                  <h2 id="recent-materials-title">Explore course materials</h2>
                  <p>
                    Discover a rotating selection of notes, review sheets, slides, and practice files shared by students.
                  </p>
                </div>

                <div
                  class="course-recent-grid"
                  id="course-recent-materials"
                  aria-live="polite"
                  aria-busy="true"
                  role="status"
                  aria-label="Loading course materials"
                >
                  <article class="course-recent-skeleton" aria-hidden="true">
                    <div class="course-recent-skeleton-icon-shell">
                      <span class="course-recent-skeleton-icon"></span>
                    </div>
                    <div class="course-recent-skeleton-copy">
                      <span class="course-recent-skeleton-line is-type"></span>
                      <span class="course-recent-skeleton-line is-title"></span>
                      <span class="course-recent-skeleton-line is-course"></span>
                    </div>
                    <div class="course-recent-skeleton-footer">
                      <span class="course-recent-skeleton-uploader">
                        <span class="course-recent-skeleton-avatar"></span>
                        <span class="course-recent-skeleton-line is-uploader"></span>
                      </span>
                      <span class="course-recent-skeleton-line is-date"></span>
                    </div>
                  </article>
                  <article class="course-recent-skeleton" aria-hidden="true">
                    <div class="course-recent-skeleton-icon-shell">
                      <span class="course-recent-skeleton-icon"></span>
                    </div>
                    <div class="course-recent-skeleton-copy">
                      <span class="course-recent-skeleton-line is-type"></span>
                      <span class="course-recent-skeleton-line is-title"></span>
                      <span class="course-recent-skeleton-line is-course"></span>
                    </div>
                    <div class="course-recent-skeleton-footer">
                      <span class="course-recent-skeleton-uploader">
                        <span class="course-recent-skeleton-avatar"></span>
                        <span class="course-recent-skeleton-line is-uploader"></span>
                      </span>
                      <span class="course-recent-skeleton-line is-date"></span>
                    </div>
                  </article>
                  <article class="course-recent-skeleton" aria-hidden="true">
                    <div class="course-recent-skeleton-icon-shell">
                      <span class="course-recent-skeleton-icon"></span>
                    </div>
                    <div class="course-recent-skeleton-copy">
                      <span class="course-recent-skeleton-line is-type"></span>
                      <span class="course-recent-skeleton-line is-title"></span>
                      <span class="course-recent-skeleton-line is-course"></span>
                    </div>
                    <div class="course-recent-skeleton-footer">
                      <span class="course-recent-skeleton-uploader">
                        <span class="course-recent-skeleton-avatar"></span>
                        <span class="course-recent-skeleton-line is-uploader"></span>
                      </span>
                      <span class="course-recent-skeleton-line is-date"></span>
                    </div>
                  </article>
                  <article class="course-recent-skeleton" aria-hidden="true">
                    <div class="course-recent-skeleton-icon-shell">
                      <span class="course-recent-skeleton-icon"></span>
                    </div>
                    <div class="course-recent-skeleton-copy">
                      <span class="course-recent-skeleton-line is-type"></span>
                      <span class="course-recent-skeleton-line is-title"></span>
                      <span class="course-recent-skeleton-line is-course"></span>
                    </div>
                    <div class="course-recent-skeleton-footer">
                      <span class="course-recent-skeleton-uploader">
                        <span class="course-recent-skeleton-avatar"></span>
                        <span class="course-recent-skeleton-line is-uploader"></span>
                      </span>
                      <span class="course-recent-skeleton-line is-date"></span>
                    </div>
                  </article>
                  <article class="course-recent-skeleton" aria-hidden="true">
                    <div class="course-recent-skeleton-icon-shell">
                      <span class="course-recent-skeleton-icon"></span>
                    </div>
                    <div class="course-recent-skeleton-copy">
                      <span class="course-recent-skeleton-line is-type"></span>
                      <span class="course-recent-skeleton-line is-title"></span>
                      <span class="course-recent-skeleton-line is-course"></span>
                    </div>
                    <div class="course-recent-skeleton-footer">
                      <span class="course-recent-skeleton-uploader">
                        <span class="course-recent-skeleton-avatar"></span>
                        <span class="course-recent-skeleton-line is-uploader"></span>
                      </span>
                      <span class="course-recent-skeleton-line is-date"></span>
                    </div>
                  </article>
                  <article class="course-recent-skeleton" aria-hidden="true">
                    <div class="course-recent-skeleton-icon-shell">
                      <span class="course-recent-skeleton-icon"></span>
                    </div>
                    <div class="course-recent-skeleton-copy">
                      <span class="course-recent-skeleton-line is-type"></span>
                      <span class="course-recent-skeleton-line is-title"></span>
                      <span class="course-recent-skeleton-line is-course"></span>
                    </div>
                    <div class="course-recent-skeleton-footer">
                      <span class="course-recent-skeleton-uploader">
                        <span class="course-recent-skeleton-avatar"></span>
                        <span class="course-recent-skeleton-line is-uploader"></span>
                      </span>
                      <span class="course-recent-skeleton-line is-date"></span>
                    </div>
                  </article>
                </div>
              </section>

            </div>
          </section>
        </section>
      </div>

      <section class="course-detail-view" id="course-detail-view" aria-label="Course details" hidden>
        <div class="course-profile-layout">
          <article class="course-profile-card">
            <section class="course-detail-hero">
              <div class="course-detail-heading-meta">
                <span class="course-detail-kicker" id="course-detail-code">Course</span>
              </div>
              <h1 id="course-detail-title">Course title</h1>
              <p class="course-detail-description" id="course-detail-description">
                Course description coming soon.
              </p>
            </section>

            <section class="course-detail-grid" id="course-detail-grid" aria-label="Course facts" hidden>
              <div
                class="course-detail-stat"
                id="course-detail-prerequisite-row"
                hidden
              >
                <span>Prerequisite</span>
                <strong id="course-detail-prerequisite">Prerequisite</strong>
              </div>

              <div class="course-detail-stat course-detail-professors" hidden>
                <span>Professors</span>
                <div class="course-professor-list" id="course-professor-list"></div>
              </div>
            </section>
          </article>

          <aside class="course-action-stack is-loading" id="course-materials-access" aria-busy="true">
            <div class="course-materials-loading" id="course-materials-loading" role="status" aria-live="polite">
              <div class="course-materials-loading-spinner" aria-hidden="true"></div>
              <p>Loading course materials</p>
            </div>

            <section class="course-material-summary course-material-downloads" aria-label="Course materials">
              <div>
                <h2>Course files</h2>
              </div>

              <div class="course-material-library-toolbar">
                <button
                  class="course-upload-start course-detail-upload-trigger"
                  id="course-upload-start"
                  type="button"
                  aria-haspopup="dialog"
                  aria-controls="quick-material-upload-modal"
                  aria-expanded="false"
                >Upload material</button>
                <div
                  class="material-choice course-material-filter-list course-material-filter-choice"
                  id="course-material-filter"
                >
                  <button
                    class="material-choice-button"
                    type="button"
                    data-material-filter-button
                    data-material-filter-value="all"
                    aria-haspopup="listbox"
                    aria-expanded="false"
                  >
                    All materials
                  </button>

                  <div
                    class="material-choice-menu"
                    data-material-filter-menu
                    role="listbox"
                    aria-label="Filter course materials"
                  >
                    <button class="material-choice-option" type="button" data-material-filter-option="all" aria-selected="true">All materials</button>
                    <button class="material-choice-option" type="button" data-material-filter-option="notes" aria-selected="false">Notes</button>
                    <button class="material-choice-option" type="button" data-material-filter-option="slides" aria-selected="false">Slides</button>
                    <button class="material-choice-option" type="button" data-material-filter-option="syllabus" aria-selected="false">Syllabus</button>
                    <button class="material-choice-option" type="button" data-material-filter-option="past-exam" aria-selected="false">Past exam</button>
                    <button class="material-choice-option" type="button" data-material-filter-option="practice-sheet" aria-selected="false">Practice sheet</button>
                    <button class="material-choice-option" type="button" data-material-filter-option="lab-file" aria-selected="false">Lab file</button>
                    <button class="material-choice-option" type="button" data-material-filter-option="past-assignment" aria-selected="false">Past assignments</button>
                    <button class="material-choice-option" type="button" data-material-filter-option="review-sheet" aria-selected="false">Review sheet</button>
                  </div>
                </div>
              </div>

              <div class="course-materials-list" id="course-materials-list" aria-label="Downloadable course files">
                <p class="course-material-status">Loading course files...</p>
              </div>

              <div class="course-material-access-lock" aria-hidden="true">
                <div class="course-material-access-lock-card">
                  <strong>Log in to view content</strong>
                  <p>Sign in with a verified AUC email to view, preview, and download course files.</p>
                  <a href="/login">Log in</a>
                </div>
              </div>
            </section>

          </aside>
        </div>
      </section>
    </div>
  `;

export default function Courses({ courseSlug = "" }: { courseSlug?: string }) {
  useEffect(() => { initializeCourses(courseSlug); }, [courseSlug]);
  return (
    <>
      <main className="courses-page" dangerouslySetInnerHTML={{ __html: markup }} />
      <CourseDialogs />
    </>
  );
}
