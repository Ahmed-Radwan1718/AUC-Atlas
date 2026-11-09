// @ts-nocheck
import { courses } from "../../data/courses";

const escapeHtml = (value) => String(value ?? "").replace(/&/g,"&amp;")
  .replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#39;");
if (typeof window !== "undefined") window.aucAtlasCourses = courses;

function getReviewDateLabel(value) {
    const date = new Date(value);

    if (!value || Number.isNaN(date.getTime())) {
      return "Just now";
    }

    return date.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric"
    });
  }

  function getReviewAuthorInitials(name) {
    const initials = String(name || "AUC student")
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map(function (part) {
        return part.charAt(0).toUpperCase();
      })
      .join("");

    return initials || "A";
  }

  function renderReviewAvatar(review) {
    const authorName = review.authorName || "AUC student";

    if (review.authorPhotoURL) {
      return '<img class="professor-review-avatar" src="' + escapeHtml(review.authorPhotoURL) + '" alt="' + escapeHtml(authorName) + ' profile photo">';
    }

    return '<span class="professor-review-avatar-fallback">' + escapeHtml(getReviewAuthorInitials(authorName)) + '</span>';
  }

  function getReviewStatRows(reviews) {
    const safeReviews = Array.isArray(reviews) ? reviews : [];
    const configs = [
      {
        key: "recommendation",
        label: "Would take again",
        options: ["Yes", "Depends", "No"],
        sentence: function (answer) {
          if (answer.value === "Yes") return answer.percent + "% of students would take this course with this professor again.";
          if (answer.value === "Depends") return answer.percent + "% of students say it depends on the course or situation.";
          return answer.percent + "% of students would not take this course with this professor again.";
        }
      },
      { key: "attendancePolicy", label: "Attendance policy", options: ["Required", "Sometimes checked", "Not important", "Not sure"], sentence: function (answer) { return answer.percent + "% of students report attendance policy is " + answer.value.toLowerCase() + "."; } },
      { key: "workload", label: "Workload", options: ["Light", "Moderate", "Heavy"], sentence: function (answer) { return answer.percent + "% of students report workload is " + answer.value.toLowerCase() + "."; } },
      { key: "lectureUsefulness", label: "Lecture usefulness", options: ["Essential", "Helpful", "Attending means less work at home", "Skippable", "Not lecture-based"], sentence: function (answer) { return answer.percent + "% of students report lecture usefulness is " + answer.value.toLowerCase() + "."; } },
      { key: "officeHours", label: "Office hours/help", options: ["Helpful", "Available but limited", "Hard to reach", "Did not use"], sentence: function (answer) { return answer.percent + "% of students report office hours/help is " + answer.value.toLowerCase() + "."; } },
      { key: "gradingStyle", label: "Grading style", options: ["Exams-heavy", "Projects-heavy", "Assignments-heavy", "Participation-heavy", "Mixed"], sentence: function (answer) { return answer.percent + "% of students report grading style is " + answer.value.replace(/-/g, " ").toLowerCase() + "."; } },
      { key: "examDifficulty", label: "Exam difficulty", options: ["Easier than class material", "Matches class material", "Harder than class material", "No exams"], sentence: function (answer) { return answer.percent + "% of students report exam difficulty is " + answer.value.toLowerCase() + "."; } },
      { key: "gradingTransparency", label: "Grading transparency", options: ["Rubric is clear", "Somewhat clear", "Unclear"], sentence: function (answer) { return answer.percent + "% of students report grading transparency is " + answer.value.toLowerCase() + "."; } },
      { key: "feedbackQuality", label: "Feedback quality", options: ["Helpful", "Minimal", "None", "Not applicable"], sentence: function (answer) { return answer.percent + "% of students report feedback quality is " + answer.value.toLowerCase() + "."; } }
    ];

    return configs.map(function (config) {
      const values = safeReviews.map(function (review) {
        return String(review[config.key] || "").trim();
      }).filter(Boolean);
      const counts = values.reduce(function (result, value) {
        result[value] = (result[value] || 0) + 1;
        return result;
      }, {});

      if (!values.length) {
        return null;
      }

      const optionValues = config.options.slice();

      Object.keys(counts).forEach(function (value) {
        if (!optionValues.includes(value)) {
          optionValues.push(value);
        }
      });

      const answers = optionValues.map(function (value, index) {
        const count = counts[value] || 0;
        const rawPercent = values.length ? (count / values.length) * 100 : 0;

        return {
          value,
          count,
          colorIndex: index,
          percent: Math.round(rawPercent),
          width: Number(rawPercent.toFixed(2))
        };
      });
      const topAnswer = answers.slice().sort(function (a, b) {
        return b.count - a.count || a.colorIndex - b.colorIndex;
      })[0];

      return {
        label: config.label,
        total: values.length,
        topAnswer,
        summary: config.sentence(topAnswer),
        answers
      };
    }).filter(function (row) {
      return row && row.topAnswer && row.topAnswer.count > 0;
    });
  }

  function renderReviewInsightSummary(summary) {
    const safeSummary = String(summary || "");
    const reportMatch = safeSummary.match(/^(\d+% of students report\s+)(.*)$/);
    const studentMatch = safeSummary.match(/^(\d+% of students\s+)(.*)$/);
    const parts = reportMatch || studentMatch;

    if (!parts) {
      return escapeHtml(safeSummary);
    }

    return escapeHtml(parts[1]) + "<strong>" + escapeHtml(parts[2]) + "</strong>";
  }

  function renderProfessorReviewStatsSkeleton() {
    // Reserves the same compact bar-chart structure as loaded Class patterns.
    return '<div class="professor-review-stat-skeleton" aria-hidden="true">' +
      Array.from({ length: 3 }, function () {
        return [
          '<div class="professor-review-stat-skeleton-row">',
            '<div class="professor-review-stat-skeleton-head">',
              '<span class="professor-review-stat-skeleton-line"></span>',
              '<span class="professor-review-stat-skeleton-line is-value"></span>',
            '</div>',
            '<span class="professor-review-stat-skeleton-track"></span>',
          '</div>'
        ].join("");
      }).join("") +
      '</div>';
  }

  function renderProfessorReviewStats(reviews) {
    const panel = document.getElementById("professor-review-stats");
    const statsCount = document.getElementById("professor-review-stats-count");
    const safeReviews = Array.isArray(reviews) ? reviews : [];
    const priorityLabels = ["Would take again", "Workload", "Exam difficulty", "Grading style", "Grading transparency", "Lecture usefulness", "Attendance policy", "Office hours/help", "Feedback quality"];
    const rows = getReviewStatRows(safeReviews).slice().sort(function (a, b) {
      const aPriority = priorityLabels.includes(a.label) ? priorityLabels.indexOf(a.label) : priorityLabels.length;
      const bPriority = priorityLabels.includes(b.label) ? priorityLabels.indexOf(b.label) : priorityLabels.length;

      return aPriority - bPriority || b.topAnswer.percent - a.topAnswer.percent || a.label.localeCompare(b.label);
    });

    function getCompactStatValue(value) {
      const compactValues = {
        "Matches class material": "Matches class",
        "Easier than class material": "Easier than class",
        "Harder than class material": "Harder than class",
        "Sometimes checked": "Sometimes",
        "Available but limited": "Limited",
        "Did not use": "Not used",
        "Attending means less work at home": "Worth attending",
        "Rubric is clear": "Clear rubric"
      };

      return compactValues[value] || String(value || "").replace(/-/g, " ");
    }

    function renderStatBreakdown(row) {
      const answers = Array.isArray(row.answers) ? row.answers : [];
      const hasZeroOptions = answers.some(function (answer) {
        return Number(answer.count || 0) === 0;
      });
      const answerMarkup = answers.map(function (answer) {
        const answerValue = getCompactStatValue(answer.value);
        const answerPercent = Number(answer.percent || 0);
        const answerWidth = Math.max(0, Math.min(100, Number(answer.width || 0)));
        const answerMeta = answerPercent + "%";

        return `
          <div class="professor-review-stat-answer${Number(answer.count || 0) === 0 ? " is-zero-answer" : ""}">
            <div class="professor-review-stat-answer-head">
              <span>${escapeHtml(answerValue)}</span>
              <span>${escapeHtml(answerMeta)}</span>
            </div>

            <div
              class="professor-review-stat-answer-track"
              role="img"
              aria-label="${escapeHtml(row.label + ": " + answerValue + ", " + answerMeta)}"
            >
              <span
                class="professor-review-stat-answer-fill"
                style="--stat-width: ${escapeHtml(String(answerWidth))}%;"
              ></span>
            </div>
          </div>
        `;
      }).join("");

      return answerMarkup + (hasZeroOptions
        ? '<button class="professor-review-stat-show-zeros" type="button" aria-expanded="false">Show all options</button>'
        : "");
    }

    function renderStatRow(row, index) {
      const displayValue = getCompactStatValue(row.topAnswer.value);
      const delay = Math.min(index * 55, 275);

      return `
        <div class="professor-review-stat-row">
          <button class="professor-review-stat-details-toggle" type="button"
                  aria-expanded="false" aria-controls="professor-review-stat-breakdown-${index}">
            <div class="professor-review-stat-head">
              <span class="professor-review-stat-label">${escapeHtml(row.label)}</span>

              <div class="professor-review-stat-value">
                <strong>${escapeHtml(displayValue)}</strong>
                <span aria-hidden="true">·</span>
                <span>${escapeHtml(row.topAnswer.percent + "%")}</span>
              </div>
              <span class="professor-review-stat-chevron" aria-hidden="true"></span>
            </div>

            <div
              class="professor-review-stat-track"
              role="img"
              aria-label="${escapeHtml(row.label + ": " + displayValue + ", selected by " + row.topAnswer.percent + "% of responses")}"
            >
              <span
                class="professor-review-stat-fill"
                style="--stat-width: ${escapeHtml(String(row.topAnswer.width))}%; --stat-delay: ${delay}ms;"
              ></span>
            </div>
          </button>

          <div id="professor-review-stat-breakdown-${index}" class="professor-review-stat-breakdown" aria-hidden="true">
            ${renderStatBreakdown(row)}
          </div>
        </div>
      `;
    }

    if (statsCount) {
      statsCount.classList.remove("is-loading");
      statsCount.removeAttribute("aria-label");
      statsCount.textContent = safeReviews.length
        ? "Based on " + safeReviews.length + " student " +
          (safeReviews.length === 1 ? "review" : "reviews")
        : "No student reviews yet";
    }

    if (!panel) {
      return;
    }

    panel.removeAttribute("aria-busy");
    panel.removeAttribute("role");
    panel.removeAttribute("aria-label");

    if (!rows.length) {
      panel.innerHTML = '<p class="professor-review-status">Review stats will appear after students answer the review choices.</p>';
      return;
    }

    const visibleRows = rows.slice(0, 5);
    const hiddenRows = rows.slice(5);

    const hiddenMarkup = hiddenRows.length
      ? `
        <details class="professor-review-insights-more">
          <summary class="professor-review-insights-more-toggle">
            <span class="professor-review-insights-more-more">Show more</span>
            <span class="professor-review-insights-more-less">Show less</span>
          </summary>

          <div class="professor-review-insights-hidden">
            ${hiddenRows.map(function (row, index) {
              return renderStatRow(row, index + visibleRows.length);
            }).join("")}
          </div>
        </details>
      `
      : "";

    panel.innerHTML = visibleRows.map(renderStatRow).join("") + hiddenMarkup;

    panel
      .querySelectorAll(".professor-review-stat-row")
      .forEach(setupProfessorReviewStatAnimation);

    panel
      .querySelectorAll(".professor-review-insights-more")
      .forEach(setupProfessorReviewDetailAnimation);
  }

  // Match the Department filter: toggling a class drives a max-height/opacity transition.
  function setupProfessorReviewStatAnimation(row) {
    const button = row.querySelector(".professor-review-stat-details-toggle");
    const breakdown = row.querySelector(".professor-review-stat-breakdown");

    if (!button || !breakdown) {
      return;
    }

    function updateExpandedHeight() {
      // Recalculate after hiding/showing options so the existing CSS transition
      // expands to the content rather than clipping it.
      breakdown.style.setProperty(
        "--stat-expanded-height",
        (breakdown.scrollHeight + 16) + "px"
      );
    }

    button.addEventListener("click", function () {
      updateExpandedHeight();
      const open = row.classList.toggle("open");
      button.setAttribute("aria-expanded", String(open));
      breakdown.setAttribute("aria-hidden", String(!open));
    });

    const showZeros = breakdown.querySelector(".professor-review-stat-show-zeros");
    if (showZeros) {
      showZeros.addEventListener("click", function () {
        const showingAll = breakdown.classList.toggle("show-zero-options");
        showZeros.textContent = showingAll ? "Hide zero-percent options" : "Show all options";
        showZeros.setAttribute("aria-expanded", String(showingAll));
        updateExpandedHeight();
      });
    }
  }

  function setupProfessorReviewDetailAnimation(details) {
    const summary = details.querySelector("summary");
    const content = details.querySelector(".professor-review-insights-hidden");

    if (!summary || !content || details.dataset.reviewAnimationReady === "true") {
      return;
    }

    let closeTimer = null;
    details.dataset.reviewAnimationReady = "true";

    if (!details.open) {
      content.style.height = "0px";
      content.style.opacity = "0";
      content.style.transform = "translateY(-6px)";
    }

    summary.addEventListener("click", function (event) {
      event.preventDefault();

      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        if (closeTimer) {
          window.clearTimeout(closeTimer);
          closeTimer = null;
        }
        details.open = !details.open;
        content.style.height = "";
        content.style.opacity = "";
        content.style.transform = "";
        return;
      }

      if (closeTimer) {
        window.clearTimeout(closeTimer);
        closeTimer = null;
      }

      if (details.open) {
        content.style.height = content.scrollHeight + "px";
        content.style.opacity = "1";
        content.style.transform = "translateY(0)";

        window.requestAnimationFrame(function () {
          content.style.height = "0px";
          content.style.opacity = "0";
          content.style.transform = "translateY(-6px)";
        });

        closeTimer = window.setTimeout(function () {
          details.open = false;
        }, 280);

        return;
      }

      details.open = true;
      content.style.height = "0px";
      content.style.opacity = "0";
      content.style.transform = "translateY(-6px)";

      window.requestAnimationFrame(function () {
        content.style.height = content.scrollHeight + "px";
        content.style.opacity = "1";
        content.style.transform = "translateY(0)";
      });
    });

    content.addEventListener("transitionend", function (event) {
      if (
        event.propertyName === "height" &&
        details.open &&
        content.style.height !== "0px"
      ) {
        content.style.height = "auto";
        content.style.opacity = "";
        content.style.transform = "";
      }
    });
  }

  function renderReviewStars(rating) {
    const safeRating = Math.max(0, Math.min(5, Math.round(Number(rating || 0))));

    if (!safeRating) {
      return '<span class="professor-review-rating-text">Not rated</span>';
    }

    const stars = Array.from({ length: 5 }, function (_, index) {
      return '<span class="professor-review-star' + (index < safeRating ? ' is-filled' : '') + '">&#9733;</span>';
    }).join("");

    return '<span class="professor-review-stars" aria-label="' + safeRating + ' out of 5 stars">' + stars + '</span>';
  }

  function getReviewedProfessorCourses(reviews) {
    const safeReviews = Array.isArray(reviews) ? reviews : [];
    const availableCourses = Array.isArray(window.aucAtlasCourses)
      ? window.aucAtlasCourses
      : [];
    const coursesByCode = new Map();
    const reviewedCourses = new Map();

    availableCourses.forEach(function (course) {
      const courseCode = String(course && course.code ? course.code : "")
        .replace(/\s+/g, " ")
        .trim()
        .toUpperCase();

      if (courseCode) {
        coursesByCode.set(courseCode, course);
      }
    });

    safeReviews.forEach(function (review) {
      const courseCode = String(review.courseCode || review.courseTaken || "")
        .replace(/\s+/g, " ")
        .trim()
        .toUpperCase();
      const course = coursesByCode.get(courseCode);

      if (course) {
        reviewedCourses.set(courseCode, course);
      }
    });

    return Array.from(reviewedCourses.values()).sort(function (firstCourse, secondCourse) {
      return firstCourse.code.localeCompare(secondCourse.code);
    });
  }

  function renderProfessorCourses(reviews) {
    const row = document.getElementById("professor-teaches-row");
    const list = document.getElementById("professor-teaches-list");

    if (!row || !list) {
      return;
    }

    const reviewedCourses = getReviewedProfessorCourses(reviews);

    row.hidden = !reviewedCourses.length;

    if (!reviewedCourses.length) {
      list.textContent = "";
      return;
    }

    list.textContent = reviewedCourses.map(function (course) {
      return course.title || course.code;
    }).join(", ");
  }

  
export { renderProfessorReviewStats, renderProfessorCourses, renderReviewStars,
  renderReviewAvatar, getReviewDateLabel };
