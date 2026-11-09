// @ts-nocheck
import { courses } from "../../data/courses";
import { professors } from "../../data/professors";
import { getCourseUrl, getProfessorProfileUrl, normalizeCourseCode, escapeMaterialText, recordCourseView } from "./courseDiscovery";
import { setupCourseMaterialsAccess } from "./courseMaterialsUI";
import { summarizeCoursePrerequisite } from "./prerequisiteDisplay";

function setCourseDetailText(id, value) {
    const element = document.getElementById(id);

    if (element) {
      element.textContent = value;
    }
  }

  function getReviewedCourseProfessor(review) {
    const professorId = String(review && review.professorId ? review.professorId : "").trim();
    const professorName = String(review && review.professorName ? review.professorName : "").trim();
    const professorSource = professors;
    const knownProfessor = professorSource.find(function (professor) {
      return String(professor && professor.id ? professor.id : "").trim().toLowerCase() === professorId.toLowerCase();
    });

    return {
      id: knownProfessor ? knownProfessor.id : professorId,
      name: knownProfessor ? knownProfessor.name : professorName,
      image: knownProfessor ? knownProfessor.image : "",
      department: knownProfessor
        ? (knownProfessor.displayDepartment || knownProfessor.department || "AUC")
        : "AUC"
    };
  }

  function renderCourseProfessors(course, reviews) {
    const list = document.getElementById("course-professor-list");

    if (!list) {
      return;
    }

    const professorRow = list.closest(".course-detail-professors");
    const detailsGrid = document.getElementById("course-detail-grid");
    const prerequisiteRow = document.getElementById("course-detail-prerequisite-row");
    const professorsById = new Map();
    const safeReviews = Array.isArray(reviews) ? reviews : [];

    safeReviews.forEach(function (review) {
      const professor = getReviewedCourseProfessor(review);
      const professorKey = String(professor.id || professor.name || "").trim().toLowerCase();

      if (professorKey && professor.name) {
        professorsById.set(professorKey, professor);
      }
    });

    const professors = Array.from(professorsById.values()).sort(function (firstProfessor, secondProfessor) {
      return firstProfessor.name.localeCompare(secondProfessor.name);
    });

    if (professorRow) professorRow.hidden = !professors.length;
    if (detailsGrid) detailsGrid.hidden =
      !professors.length && (!prerequisiteRow || prerequisiteRow.hidden);

    if (!professors.length) {
      list.innerHTML = "";
      return;
    }

    if (list.dataset.avatarFallbackReady !== "true") {
      list.addEventListener("error", function (event) {
        if (event.target.matches(".course-professor-avatar img")) event.target.remove();
      }, true);
      list.dataset.avatarFallbackReady = "true";
    }

    list.innerHTML = professors.map(function (professor) {
      const photo = String(professor.image || "").trim();
      const initials = professor.name.split(/\s+/).slice(0, 2).map(function (part) {
        return part.charAt(0).toUpperCase();
      }).join("");
      return `
        <a class="course-professor-link" href="${getProfessorProfileUrl(professor.id)}">
          <span class="course-professor-avatar" aria-hidden="true">
            ${escapeMaterialText(initials)}
            ${photo && photo !== "user.png" ? '<img src="' + escapeMaterialText(photo) + '" alt="" loading="lazy">' : ""}
          </span>
          <strong>${escapeMaterialText(professor.name)}</strong>
        </a>
      `;
    }).join("");
  }

  async function loadCourseProfessors(course) {
    const list = document.getElementById("course-professor-list");
    const professorRow = list ? list.closest(".course-detail-professors") : null;

    if (professorRow) {
      professorRow.hidden = true;
    }

    if (list) {
      list.innerHTML = "";
    }

    try {
      const response = await fetch(
        "/api/professor-reviews?courseCode=" + encodeURIComponent(course.code),
        {
          credentials: "same-origin",
          cache: "no-store",
          headers: {
            "Accept": "application/json"
          }
        }
      );

      const data = await response.json().catch(function () {
        return {};
      });

      if (!response.ok) {
        throw new Error(data.error || "Could not load course professors.");
      }

      renderCourseProfessors(course, data.reviews || []);
    } catch (error) {
      renderCourseProfessors(course, []);
    }
  }

  
function renderCoursePrerequisites(value) {
    const source = summarizeCoursePrerequisite(value);
    const target = document.getElementById("course-detail-prerequisite");
    if (!target) return Boolean(source);

    const existing = new Set(courses.map(function (course) {
      return normalizeCourseCode(course.code);
    }));
    let result = "", cursor = 0;
    for (const match of source.matchAll(/\b[A-Z]{2,5}\s*\d{4}[A-Z]?\b/gi)) {
      result += escapeMaterialText(source.slice(cursor, match.index));
      const code = normalizeCourseCode(match[0]);
      result += existing.has(code)
        ? '<a class="course-detail-prereq-link" href="' + getCourseUrl(code) +
          '">' + escapeMaterialText(match[0]) + '</a>'
        : escapeMaterialText(match[0]);
      cursor = match.index + match[0].length;
    }
    target.innerHTML = result + escapeMaterialText(source.slice(cursor));
    return Boolean(source);
  }

  function renderCourseDetail(courseCode) {
    const listView = document.getElementById("courses-list-view");
    const detailView = document.getElementById("course-detail-view");
    const prerequisiteRow = document.getElementById(
      "course-detail-prerequisite-row"
    );
    const detailsGrid = document.getElementById("course-detail-grid");

    if (!courseCode || !detailView) {
      return false;
    }

    const selectedCourse = courses.find(function (course) {
      return normalizeCourseCode(course.code) === courseCode;
    });

    if (listView) {
      listView.hidden = true;
    }

    detailView.hidden = false;

    if (!selectedCourse) {
      document.title = "Course not found | AUC Atlas";
      setCourseDetailText("course-detail-code", "Course not found");
      setCourseDetailText("course-detail-title", "Course not found.");
      setCourseDetailText(
        "course-detail-description",
        "Go back to courses and choose a course from the search results."
      );
      setCourseDetailText("course-detail-level", "Unavailable");

      if (prerequisiteRow) prerequisiteRow.hidden = true;
      if (detailsGrid) detailsGrid.hidden = true;

      renderCourseProfessors({ code: "" }, []);
      return true;
    }

    document.title = selectedCourse.code + " | AUC Atlas";
    setCourseDetailText("course-detail-code", selectedCourse.code);
    setCourseDetailText("course-detail-title", selectedCourse.title);
    setCourseDetailText(
      "course-detail-description",
      selectedCourse.description ||
        "Course description coming soon."
    );
    setCourseDetailText("course-detail-level", selectedCourse.level);
    const hasDisplayedPrerequisite = renderCoursePrerequisites(selectedCourse.prerequisite);

    if (prerequisiteRow) prerequisiteRow.hidden = !hasDisplayedPrerequisite;
    if (detailsGrid) detailsGrid.hidden = !hasDisplayedPrerequisite;

    recordCourseView(selectedCourse.code);
    loadCourseProfessors(selectedCourse);
    setupCourseMaterialsAccess(selectedCourse);

    return true;
  }

  
export { renderCourseDetail };
