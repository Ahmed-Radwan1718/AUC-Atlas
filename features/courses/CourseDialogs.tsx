// Original AUC Atlas course upload, preview, and reporting dialogs.
const dialogsMarkup = `

  <div
    class="quick-material-upload-modal"
    id="quick-material-upload-modal"
    hidden
  >
    <button
      class="quick-material-upload-backdrop"
      type="button"
      aria-label="Close upload form"
      data-close-quick-material-upload
    ></button>

    <section
      class="quick-material-upload-dialog"
      role="dialog"
      aria-modal="true"
      aria-labelledby="quick-material-upload-title"
    >
      <header class="quick-material-upload-header">
        <h2 id="quick-material-upload-title">Upload material</h2>
        <p class="quick-material-upload-copy">
          Share notes, slides, assignments, and other course resources with your classmates.
        </p>
      </header>

      <form
        class="material-upload-form"
        id="quick-material-upload-form"
      >
        <div class="material-upload-grid">
          <label class="material-upload-field quick-material-course-field">
            <span>Course</span>
            <select
              class="material-native-select"
              id="quick-material-course"
              data-material-role="course"
              data-material-search-placeholder="Search courses"
              required
            >
              <option value="">Choose course</option>
            </select>
          </label>

          <label class="material-upload-field">
            <span>Professor</span>
            <select
              class="material-native-select"
              id="quick-material-professor"
              data-material-role="professor"
              data-material-search-placeholder="Search professors"
              required
            >
              <option value="">Choose professor</option>
            </select>
          </label>

          <label class="material-upload-field">
            <span>Material type</span>
            <select
              class="material-native-select"
              id="quick-material-type"
              data-material-role="type"
              required
            >
              <option value="">Choose material type</option>
              <option value="Notes">Notes</option>
              <option value="Slides">Slides</option>
              <option value="Syllabus">Syllabus</option>
              <option value="Past exam">Past exam</option>
              <option value="Practice sheet">Practice sheet</option>
              <option value="Lab file">Lab file</option>
              <option value="Past assignments">Past assignments</option>
              <option value="Review sheet">Review sheet</option>
            </select>
          </label>

          <label class="material-upload-field">
            <span>Semester</span>
            <select
              class="material-native-select"
              id="quick-material-semester"
              data-material-role="semester"
              required
            >
              <option value="">Choose semester</option>
              <option value="Fall 2026">Fall 2026</option>
              <option value="Summer 2026">Summer 2026</option>
              <option value="Spring 2026">Spring 2026</option>
              <option value="Winter 2026">Winter 2026</option>
              <option value="Fall 2025">Fall 2025</option>
              <option value="Summer 2025">Summer 2025</option>
              <option value="Spring 2025">Spring 2025</option>
              <option value="Winter 2025">Winter 2025</option>
              <option value="Fall 2024">Fall 2024</option>
              <option value="Summer 2024">Summer 2024</option>
              <option value="Spring 2024">Spring 2024</option>
              <option value="Winter 2024">Winter 2024</option>
              <option value="Fall 2023">Fall 2023</option>
              <option value="Summer 2023">Summer 2023</option>
              <option value="Spring 2023">Spring 2023</option>
              <option value="Winter 2023">Winter 2023</option>
              <option value="Fall 2022">Fall 2022</option>
              <option value="Summer 2022">Summer 2022</option>
              <option value="Spring 2022">Spring 2022</option>
              <option value="Winter 2022">Winter 2022</option>
              <option value="Fall 2021">Fall 2021</option>
              <option value="Summer 2021">Summer 2021</option>
              <option value="Spring 2021">Spring 2021</option>
              <option value="Winter 2021">Winter 2021</option>
              <option value="Fall 2020">Fall 2020</option>
              <option value="Summer 2020">Summer 2020</option>
              <option value="Spring 2020">Spring 2020</option>
              <option value="Winter 2020">Winter 2020</option>
              <option value="Fall 2019">Fall 2019</option>
              <option value="Summer 2019">Summer 2019</option>
              <option value="Spring 2019">Spring 2019</option>
              <option value="Winter 2019">Winter 2019</option>
              <option value="Fall 2018">Fall 2018</option>
              <option value="Summer 2018">Summer 2018</option>
              <option value="Spring 2018">Spring 2018</option>
              <option value="Winter 2018">Winter 2018</option>
            </select>
          </label>

          <label class="material-upload-field">
            <span>Material title</span>
            <input
              id="quick-material-title"
              data-material-role="title"
              type="text"
              placeholder="Midterm notes, lab sheet, final review..."
              required
            >
          </label>
        </div>

        <label class="material-upload-field material-file-field">
          <span>Files</span>
          <input
            class="material-file-input"
            id="quick-material-file"
            data-material-role="file"
            type="file"
            accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.jpg,.jpeg,.png"
            multiple
            required
          >

          <span class="material-file-control">
            <span class="material-file-icon" aria-hidden="true">
              <img src="/upload.png" alt="">
            </span>
            <span class="material-file-copy">
              <strong>Choose files or drag them here</strong>
              <small>PDF, Word, PowerPoint, Excel, JPG or PNG</small>
              <small class="material-file-limit">Maximum 25 MB per file</small>
            </span>
          </span>
        </label>

        <div
          class="material-file-selection"
          id="quick-material-file-selection"
          data-material-role="file-selection"
          hidden
          aria-live="polite"
        ></div>

                <label class="material-anonymous-option">
          <span>
            <strong>Upload anonymously</strong>
            <small>Hide your name from other students</small>
          </span>
          <input
            id="quick-material-anonymous"
            data-material-role="anonymous"
            type="checkbox"
            value="true"
          >
        </label>

        <button
          class="material-upload-button"
          id="quick-material-upload-button"
          data-material-role="submit"
          type="submit"
        >
          Upload material
        </button>

        <div
          class="material-upload-progress"
          id="quick-material-upload-progress"
          data-material-role="progress"
          hidden
        >
          <div class="material-upload-progress-head">
            <span
              id="quick-material-upload-progress-label"
              data-material-role="progress-label"
            >Uploading files</span>

            <strong
              id="quick-material-upload-progress-value"
              data-material-role="progress-value"
            >0%</strong>
          </div>

          <div
            class="material-upload-progress-track"
            id="quick-material-upload-progress-track"
            data-material-role="progress-track"
            role="progressbar"
            aria-label="Material upload progress"
            aria-valuemin="0"
            aria-valuemax="100"
            aria-valuenow="0"
          >
            <span
              class="material-upload-progress-fill"
              id="quick-material-upload-progress-fill"
              data-material-role="progress-fill"
            ></span>
          </div>
        </div>

        <p
          class="material-upload-status"
          id="quick-material-upload-status"
          data-material-role="status"
          aria-live="polite"
        ></p>

        <button
          class="quick-material-upload-cancel"
          type="button"
          data-close-quick-material-upload
        >Cancel</button>
      </form>
    </section>
  </div>

  <div
    class="course-material-preview-modal"
    id="course-material-preview-modal"
    hidden
  >
    <button
      class="course-material-preview-backdrop"
      type="button"
      aria-label="Close file preview"
      data-close-material-preview
    ></button>

    <section
      class="course-material-preview-dialog"
      role="dialog"
      aria-modal="true"
      aria-labelledby="course-material-preview-title"
    >
      <header class="course-material-preview-header">
        <div class="course-material-preview-header-copy">
          <h2 id="course-material-preview-title">File preview</h2>
          <p id="course-material-preview-meta">Preparing preview</p>
        </div>

        <button
          class="course-material-preview-close"
          id="course-material-preview-close"
          type="button"
          aria-label="Close file preview"
          data-close-material-preview
        >×</button>
      </header>

      <div class="course-material-preview-viewer">
        <div
          class="course-material-preview-loading"
          id="course-material-preview-loading"
        >
          Preparing a secure preview...
        </div>

        <iframe
          class="course-material-preview-frame"
          id="course-material-preview-frame"
          title="Course material preview"
          hidden
        ></iframe>

        <img
          class="course-material-preview-image"
          id="course-material-preview-image"
          alt="Course material preview"
          hidden
        >

        <div
          class="course-material-preview-fallback"
          id="course-material-preview-fallback"
          hidden
        ></div>
      </div>

      <footer class="course-material-preview-footer">
        <a
          class="course-material-preview-download"
          id="course-material-preview-download"
          href="#"
          target="_blank"
          rel="noopener"
        >Download original</a>
      </footer>
    </section>
  </div>

  <div
    class="course-report-modal"
    id="course-report-modal"
    hidden
  >
    <button
      class="course-report-backdrop"
      type="button"
      aria-label="Close report panel"
      data-close-course-report
    ></button>

    <section
      class="course-report-dialog"
      role="dialog"
      aria-modal="true"
      aria-labelledby="course-report-title"
    >
      <header class="course-report-header">
        <div class="course-report-header-copy">
          <p class="course-report-kicker">Content moderation</p>
          <h2 id="course-report-title">Report material</h2>
          <p id="course-report-copy">
            Tell us what is wrong with this course material. Our moderators will review your report.
          </p>
        </div>

        <button
          class="course-report-close"
          type="button"
          aria-label="Close report panel"
          data-close-course-report
        >×</button>
      </header>

      <form
        class="course-report-form"
        id="course-report-form"
      >
        <label class="course-report-field">
          <span>Reason for report</span>
          <textarea
            id="course-report-reason"
            name="reason"
            maxlength="1000"
            placeholder="Describe the issue with this material..."
            required
          ></textarea>
        </label>

        <p
          class="course-report-status"
          id="course-report-status"
          aria-live="polite"
        ></p>

        <div class="course-report-actions">
          <button
            class="course-report-cancel"
            type="button"
            data-close-course-report
          >Cancel</button>

          <button
            class="course-report-submit"
            id="course-report-submit"
            type="submit"
          >Submit report</button>
        </div>
      </form>
    </section>
  </div>

  `;

export default function CourseDialogs() {
  return <div dangerouslySetInnerHTML={{ __html: dialogsMarkup }} />;
}
