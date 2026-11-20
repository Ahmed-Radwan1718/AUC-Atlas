// @ts-nocheck
import { renderProfessorReviewStats, renderProfessorCourses, renderReviewStars, renderReviewAvatar } from "./professorInsights";
import { setupProfessorReviewReports } from "./reviewReporting";

const escapeHtml = (value) => String(value ?? "").replace(/&/g,"&amp;")
  .replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#39;");

/**
 * Read-more previews are measured after layout, so the link appears only when
 * the real text exceeds five rendered lines at the current card width.
 */
function updateProfessorReviewPreviews(list) {
  if (!list.isConnected) return;
  list.querySelectorAll(".professor-review-card").forEach(function (card) {
    const note = card.querySelector(".professor-review-note");
    const button = card.querySelector("[data-read-professor-review]");
    if (!note || !button) return;

    const wasExpanded = card.classList.contains("is-expanded");
    // Compare natural height against the five-line height at the actual card width.
    note.classList.remove("is-clamped", "is-truncated");
    const fullHeight = note.scrollHeight;
    note.classList.add("is-clamped");
    const isLong = fullHeight > note.clientHeight + 2;

    const expanded = isLong && wasExpanded;
    card.classList.toggle("is-expanded", expanded);
    note.classList.toggle("is-clamped", !expanded);
    note.classList.toggle("is-truncated", isLong && !expanded);
    button.hidden = !isLong;
    button.textContent = expanded ? "Show less" : "Read more";
    button.setAttribute("aria-expanded", String(expanded));
  });
}

function setupProfessorReviewReadMore(list) {
  if (list.dataset.readMoreReady === "true") return;
  list.dataset.readMoreReady = "true";

  list.addEventListener("click", function (event) {
    const button = event.target.closest("[data-read-professor-review]");
    if (!button || !list.contains(button)) return;
    const card = button.closest(".professor-review-card");
    const note = card?.querySelector(".professor-review-note");
    if (!card || !note) return;

    const expanded = !card.classList.contains("is-expanded");
    card.classList.toggle("is-expanded", expanded);
    note.classList.toggle("is-clamped", !expanded);
    note.classList.toggle("is-truncated", !expanded);
    button.textContent = expanded ? "Show less" : "Read more";
    button.setAttribute("aria-expanded", String(expanded));
  });

  // Re-check on responsive column changes, without observing card height:
  // showing a button changes height, but must not create resize loops.
  if (typeof ResizeObserver !== "undefined") {
    let previousWidth = -1;
    const observer = new ResizeObserver(function (entries) {
      const width = entries[0]?.contentRect.width || 0;
      if (Math.abs(width - previousWidth) < 1) return;
      previousWidth = width;
      requestAnimationFrame(function () { updateProfessorReviewPreviews(list); });
    });
    observer.observe(list);
  } else {
    window.addEventListener("resize", function () {
      requestAnimationFrame(function () { updateProfessorReviewPreviews(list); });
    });
  }
}

function renderProfessorReviews(reviews) {
    const list = document.getElementById("professor-reviews-list");
    const count = document.getElementById("professor-reviews-count");
    const safeReviews = Array.isArray(reviews) ? reviews : [];

    renderProfessorReviewStats(safeReviews);
    renderProfessorCourses(safeReviews);

    if (!list) {
      return;
    }

    list.removeAttribute("aria-busy");
    list.removeAttribute("role");
    list.removeAttribute("aria-label");

    setupProfessorReviewReports(
      list
    );

    setupProfessorReviewReadMore(list);

    if (count) {
      count.classList.remove("is-loading");
      count.removeAttribute("aria-label");
      count.textContent = safeReviews.length + " " + (safeReviews.length === 1 ? "review" : "reviews");
    }

    if (!safeReviews.length) {
      list.innerHTML = '<p class="professor-review-empty">No reviews yet. Be the first to leave one.</p>';
      return;
    }

    list.innerHTML = safeReviews.map(function (review) {
      const rating = Number(review.rating || 0);
      const reviewId = escapeHtml(review.id || "");
      const reportLabel = escapeHtml(
        [
          review.professorName ||
            "professor review",
          review.courseTaken ||
            review.courseCode
        ]
          .filter(Boolean)
          .join(" · ")
      );
      const reportButton = reviewId
        ? `
          <div class="professor-review-card-actions">
            <button
              class="professor-review-report-button"
              type="button"
              data-report-review="${reviewId}"
              data-report-label="${reportLabel}"
            >Report</button>
          </div>
        `
        : "";

      return `
        <article class="professor-review-card">
          <div class="professor-review-card-top">
            <div class="professor-review-author">
              ${renderReviewAvatar(review)}
              <div>
                <strong>${escapeHtml(review.authorName || "AUC student")}</strong>
              </div>
            </div>

            <div class="professor-review-rating">${renderReviewStars(rating)}</div>
          </div>

          <div class="professor-review-context">
            <span>${escapeHtml(review.courseTaken || "Course not listed")}</span>
            <span aria-hidden="true">·</span>
            <span>${escapeHtml(review.semesterTaken || "Semester not listed")}</span>
          </div>

          <div class="professor-review-note-preview">
            <p class="professor-review-note is-clamped">${escapeHtml(review.studentNote || "No written note.")}</p>
            <button class="professor-review-read-more" type="button"
              data-read-professor-review aria-expanded="false" hidden>Read more</button>
          </div>

          ${reportButton}
        </article>
      `;
    }).join("");

    requestAnimationFrame(function () { updateProfessorReviewPreviews(list); });
    if (document.fonts) {
      void document.fonts.ready.then(function () {
        updateProfessorReviewPreviews(list);
      });
    }
  }


// The API returns no review data for unsigned or unverified visitors.
// Replace skeletons without treating protected reviews as an empty dataset.
function renderProfessorReviewAccessMessage(locked) {
  const list = document.getElementById("professor-reviews-list");
  const count = document.getElementById("professor-reviews-count");
  const stats = document.getElementById("professor-review-stats");
  const statsCount = document.getElementById("professor-review-stats-count");
  const form = document.querySelector(".professor-review-panel");
  const message = locked
    ? 'Sign in with a verified AUC account to read professor reviews. <a href="/login">Sign in</a>'
    : "Professor reviews are temporarily unavailable. Please try again.";
  if (form) form.hidden = locked;
  for (const element of [list, stats]) {
    if (!element) continue;
    element.removeAttribute("aria-busy");
    element.removeAttribute("role");
    element.removeAttribute("aria-label");
    element.innerHTML = '<p class="professor-review-empty">' + message + "</p>";
  }
  for (const element of [count, statsCount]) {
    if (!element) continue;
    element.classList.remove("is-loading");
    element.removeAttribute("aria-label");
    element.textContent = locked ? "Sign in to view" : "Unavailable";
  }
}

function renderProfessorReviewsLocked() {
  renderProfessorReviewAccessMessage(true);
}
function renderProfessorReviewsUnavailable() {
  renderProfessorReviewAccessMessage(false);
}

export { renderProfessorReviews, renderProfessorReviewsLocked, renderProfessorReviewsUnavailable };
