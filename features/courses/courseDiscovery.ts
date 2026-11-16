// @ts-nocheck
import { courses } from "../../data/courses";
import { searchCatalogCourses } from "./courseSearch";
// Catalog discovery behavior ported directly from the original AUC Atlas runtime.
function escapeMaterialText(value) {
    return String(value || "").replace(/[&<>"']/g, function (character) {
      return {
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        "\"": "&quot;",
        "'": "&#39;"
      }[character];
    });
  }

  function getMaterialFileExtension(fileName, fileType) {
    const name = String(fileName || "").trim().toLowerCase();
    const extensionMatch = name.match(/\.([a-z0-9]{1,8})$/);

    if (extensionMatch) {
      return extensionMatch[1];
    }

    const type = String(fileType || "").toLowerCase();

    if (type.indexOf("pdf") !== -1) return "pdf";
    if (type.indexOf("word") !== -1) return "docx";
    if (type.indexOf("presentation") !== -1) return "pptx";
    if (type.indexOf("spreadsheet") !== -1) return "xlsx";
    if (type.indexOf("jpeg") !== -1) return "jpg";
    if (type.indexOf("png") !== -1) return "png";
    if (type.indexOf("webp") !== -1) return "webp";

    return "file";
  }

  function formatMaterialUploadDate(value) {
    const date = new Date(value || "");

    if (Number.isNaN(date.getTime())) {
      return "Upload date unavailable";
    }

    return "Uploaded " + date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric"
    });
  }

  
function normalize(value) {
    return String(value || "").toLowerCase().trim();
  }

  function getCheckedSubjects() {
    return Array.from(document.querySelectorAll("[data-course-subject]:checked")).map(function (input) {
      return input.value;
    });
  }

  function getCourseSearchQuery() {
    const searchInput = document.getElementById("course-search-input");
    return normalize(searchInput ? searchInput.value : "");
  }

  function getSubjects() {
    const subjectsByCode = {};

    courses.forEach(function (course) {
      subjectsByCode[course.subject] = course.department;
    });

    return Object.keys(subjectsByCode).map(function (code) {
      return {
        code: code,
        label: subjectsByCode[code]
      };
    }).sort(function (firstSubject, secondSubject) {
      return firstSubject.label.localeCompare(secondSubject.label);
    });
  }

  function renderCourseStats() {
    const totalCount = document.getElementById("course-total-count");
    const subjectCount = document.getElementById("course-subject-count");

    if (totalCount) {
      totalCount.textContent = courses.length;
    }

    if (subjectCount) {
      subjectCount.textContent = getSubjects().length;
    }
  }

  function renderSubjectFilters() {
    const filtersRoot = document.getElementById("course-subject-filters");

    if (!filtersRoot) {
      return;
    }

    filtersRoot.innerHTML = getSubjects().map(function (subject) {
      return `
        <button
          class="course-department-button"
          type="button"
          data-course-department="${subject.label}"
        >
          <span>${subject.code}</span>
          <strong>${subject.label}</strong>
        </button>
      `;
    }).join("");

    filtersRoot.querySelectorAll("[data-course-department]").forEach(function (button) {
      button.addEventListener("click", function () {
        const searchInput = document.getElementById("course-search-input");

        if (!searchInput) {
          return;
        }

        searchInput.value = button.dataset.courseDepartment || "";
        renderCourses();

        searchInput.scrollIntoView({
          behavior: "smooth",
          block: "center"
        });
      });
    });
  }

  function getCourseByCode(courseCode) {
    const normalizedCode = normalizeCourseCode(courseCode);

    return courses.find(function (course) {
      return normalizeCourseCode(course.code) === normalizedCode;
    });
  }


  // The catalog is local data: no Firestore query or popularity tracking needed.
  // Pick courses from different departments so discovery is not dominated by one subject.
  function shuffled(items) {
    const result = items.slice();
    for (let index = result.length - 1; index > 0; index--) {
      const pick = Math.floor(Math.random() * (index + 1));
      [result[index], result[pick]] = [result[pick], result[index]];
    }
    return result;
  }

  function selectBrowseCourses() {
    const byDepartment = new Map();
    courses.forEach(function (course) {
      const department = course.department || course.subject || course.code;
      if (!byDepartment.has(department)) byDepartment.set(department, []);
      byDepartment.get(department).push(course);
    });

    const selected = shuffled([...byDepartment.values()]).slice(0, 8)
      .map(function (departmentCourses) {
        return departmentCourses[Math.floor(Math.random() * departmentCourses.length)];
      });

    if (selected.length >= 8) return selected;

    const selectedCodes = new Set(selected.map(function (course) { return course.code; }));
    return selected.concat(shuffled(courses.filter(function (course) {
      return !selectedCodes.has(course.code);
    })).slice(0, 8 - selected.length));
  }

  function renderBrowseCourseCards(root, browseCourses) {
    root.innerHTML = browseCourses.map(function (course) {
      return `
<a
  class="course-feature-card"
  href="${getCourseUrl(course.code)}"
  aria-label="Open ${escapeMaterialText(course.code)} course page"
>
          <span class="course-feature-code">${escapeMaterialText(course.code)}</span>
          <h3>${escapeMaterialText(course.title)}</h3>

          <div class="course-feature-meta">
            <span>${escapeMaterialText(course.department)}</span>
            <span>${escapeMaterialText(course.level)}</span>
          </div>
        </a>
      `;
    }).join("");
  }

  function renderBrowseCourses() {
    const root = document.getElementById("course-browse-grid");
    if (!root) return;
    // Called once during catalog initialization, keeping cards stable on the page.
    renderBrowseCourseCards(root, selectBrowseCourses());
  }

  function renderRecentMaterialSkeletons() {
    // Keep the placeholder grid aligned with the six-card materials layout.
    return Array.from({ length: 6 }, function () {
      return [
        '<article class="course-recent-skeleton" aria-hidden="true">',
          '<div class="course-recent-skeleton-icon-shell">',
            '<span class="course-recent-skeleton-icon"></span>',
          '</div>',
          '<div class="course-recent-skeleton-copy">',
            '<span class="course-recent-skeleton-line is-title"></span>',
            '<span class="course-recent-skeleton-line is-course"></span>',
          '</div>',
          '<div class="course-recent-skeleton-footer">',
            '<span class="course-recent-skeleton-line is-date"></span>',
          '</div>',
        '</article>'
      ].join("");
    }).join("");
  }

  function renderRecentMaterials(materials) {
    const root = document.getElementById("course-recent-materials");
    const safeMaterials = Array.isArray(materials)
      ? materials.slice(0, 6)
      : [];

    if (!root) {
      return;
    }

    if (!safeMaterials.length) {
      root.innerHTML = `
        <div class="course-recent-status">
          <strong>No course materials yet.</strong>
          <p>New uploads will appear here as soon as students share them.</p>
        </div>
      `;
      return;
    }

    root.innerHTML = safeMaterials.map(function (material) {
      const courseCode = String(material.courseCode || "").trim();
      const courseTitle = String(material.courseTitle || "").trim();
      const courseLabel = [courseCode, courseTitle]
        .filter(Boolean)
        .join(" — ");
const href = courseCode
  ? getCourseUrl(
      courseCode,
      "#course-materials-access"
    )
  : "/courses";
      const fileName = String(
        material.fileName ||
        material.title ||
        "Course material"
      ).trim();
      const fileExtension =
        getMaterialFileExtension(
          fileName,
          material.fileType
        );
      const fileIconMap = {
        pdf: "PDF.svg",
        doc: "MSWord.svg",
        docx: "MSWord.svg",
        xls: "Excel.svg",
        xlsx: "Excel.svg",
        ppt: "PPTX.svg",
        pptx: "PPTX.svg",
        png: "png.png",
        jpg: "jpg.png",
        jpeg: "jpg.png"
      };
      const fileIconUrl =
        fileIconMap[fileExtension] ? "/" + fileIconMap[fileExtension] : "";
      const extensionLabel =
        fileExtension === "file"
          ? "FILE"
          : fileExtension
              .slice(0, 5)
              .toUpperCase();
      const fileIconMarkup = fileIconUrl
        ? `
          <img
            class="course-recent-file-icon-image"
            src="${escapeMaterialText(fileIconUrl)}"
            alt=""
            aria-hidden="true"
          >
        `
        : `
          <span
            class="course-recent-file-icon-fallback"
            aria-hidden="true"
          >
            <strong>${escapeMaterialText(extensionLabel)}</strong>
          </span>
        `;
      return `
        <a class="course-recent-card" href="${href}">
          <div class="course-recent-icon-shell">
            ${fileIconMarkup}
          </div>

          <div class="course-recent-card-copy">
            <h3>${escapeMaterialText(material.title || "Course material")}</h3>
            <p>${escapeMaterialText(courseLabel || "AUC course material")}</p>
          </div>

          <div class="course-recent-footer">
            <small>${escapeMaterialText(formatMaterialUploadDate(material.createdAt))}</small>
          </div>
        </a>
      `;
    }).join("");
  }

  async function loadRecentMaterials() {
    const root = document.getElementById("course-recent-materials");

    if (!root) {
      return;
    }

    root.setAttribute("aria-busy", "true");
    root.setAttribute("role", "status");
    root.setAttribute("aria-label", "Loading course materials");
    root.innerHTML = renderRecentMaterialSkeletons();

    try {
      const response = await fetch(
        "/api/course-materials?random=true&limit=6",
        {
          credentials: "same-origin",
          cache: "no-store",
          headers: {
            Accept: "application/json"
          }
        }
      );

      const data = await response.json().catch(function () {
        return {};
      });

      if (response.status === 401 || response.status === 403) {
        root.innerHTML = `
          <div class="course-recent-status">
            <strong>Sign in to view course materials.</strong>
            <p>Course files are available to students with a verified AUC email.</p>
            <a href="/login">Log in</a>
          </div>
        `;
        return;
      }

      if (!response.ok) {
        throw new Error(data.error || "Could not load course materials.");
      }

      renderRecentMaterials(data.materials);
    } catch (error) {
      root.innerHTML = `
        <div class="course-recent-status">
          <strong>Course materials are unavailable right now.</strong>
          <p>Please try again later.</p>
        </div>
      `;
    } finally {
      root.removeAttribute("aria-busy");
      root.removeAttribute("role");
      root.removeAttribute("aria-label");
    }
  }

  function setCoursesSearchState(hasActiveSearch) {
    const dropdown = document.getElementById(
      "course-search-dropdown"
    );
    const searchInput = document.getElementById(
      "course-search-input"
    );
    const results = document.querySelector(
      ".courses-results"
    );

    if (dropdown) {
      dropdown.hidden = !hasActiveSearch;
    }

    if (results) {
      results.classList.toggle(
        "is-search-active",
        hasActiveSearch
      );
    }

    if (searchInput) {
      searchInput.setAttribute(
        "aria-expanded",
        hasActiveSearch ? "true" : "false"
      );
    }
  }

  function renderCourses() {
    const grid = document.getElementById("courses-grid");
    const count = document.getElementById(
      "courses-result-count"
    );
    const query = getCourseSearchQuery();
    const selectedSubjects = getCheckedSubjects();
    const hasActiveSearch = Boolean(
      query || selectedSubjects.length
    );

    if (!grid) {
      return;
    }

    setCoursesSearchState(hasActiveSearch);

    if (!hasActiveSearch) {
      grid.innerHTML = "";
      return;
    }

    const visibleCourses = searchCatalogCourses(courses, query, selectedSubjects);

    if (count) {
      count.textContent =
        visibleCourses.length + " matches";
    }

    grid.innerHTML = visibleCourses.map(function (course) {
      return `
<a
  class="course-card"
  href="${getCourseUrl(course.code)}"
  aria-label="Open ${escapeMaterialText(course.code)} course page"
>
          <span class="course-code">
            ${escapeMaterialText(course.code)}
          </span>

          <span class="course-search-copy">
            <strong>
              ${escapeMaterialText(course.title)}
            </strong>
            <small>
              ${escapeMaterialText(course.department)}
              ·
              ${escapeMaterialText(course.level)}
            </small>
          </span>

          <span class="course-search-arrow" aria-hidden="true">
            →
          </span>
        </a>
      `;
    }).join("");

    if (!visibleCourses.length) {
      grid.innerHTML = `
        <p class="courses-empty">
          No close matches found. Try a course code, an abbreviation like calc 2, or another keyword.
        </p>
      `;
    }
  }

  const courseSearchSuggestions = [
    "Search Computer Science",
    "Search calc 2",
    "Search CSCE1101",
    "Search Business",
    "Search diff eq",
    "Search Senior Project"
  ];

  let courseSuggestionIndex = 0;
  let courseCharacterIndex = 0;
  let isDeletingCourseSuggestion = false;

  function animateCourseSearchPlaceholder() {
    const searchInput = document.getElementById("course-search-input");

    if (!searchInput) {
      return;
    }

    const currentSuggestion = courseSearchSuggestions[courseSuggestionIndex];

    if (searchInput.value.trim().length === 0) {
      searchInput.placeholder = currentSuggestion.substring(0, courseCharacterIndex);
    }

    if (!isDeletingCourseSuggestion && courseCharacterIndex < currentSuggestion.length) {
      courseCharacterIndex += 1;
      setTimeout(animateCourseSearchPlaceholder, 70);
      return;
    }

    if (!isDeletingCourseSuggestion && courseCharacterIndex === currentSuggestion.length) {
      isDeletingCourseSuggestion = true;
      setTimeout(animateCourseSearchPlaceholder, 1200);
      return;
    }

    if (isDeletingCourseSuggestion && courseCharacterIndex > 0) {
      courseCharacterIndex -= 1;
      setTimeout(animateCourseSearchPlaceholder, 35);
      return;
    }

    isDeletingCourseSuggestion = false;
    courseSuggestionIndex = (courseSuggestionIndex + 1) % courseSearchSuggestions.length;
    setTimeout(animateCourseSearchPlaceholder, 250);
  }

function normalizeCourseCode(value) {
  return String(value || "")
    .replace(/\s+/g, " ")
    .trim()
    .toUpperCase();
}

function getCourseSlug(value) {
  return normalizeCourseCode(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function getCourseUrl(courseCode, hash) {
  const slug = getCourseSlug(courseCode);

  if (!slug) {
    return "/courses";
  }

  return (
    "/courses/" +
    encodeURIComponent(slug) +
    (hash || "")
  );
}

function getProfessorProfileUrl(professorId) {
  const normalizedId = String(professorId || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return normalizedId
    ? "/professors/" + encodeURIComponent(normalizedId)
    : "/professors";
}

function getSelectedCourseCode() {
  const params = new URLSearchParams(
    window.location.search
  );

  const legacyCourseCode = params.get("course");

  if (legacyCourseCode) {
    return normalizeCourseCode(legacyCourseCode);
  }

  const pathMatch = window.location.pathname.match(
    /^\/courses\/([^/]+)\/?$/i
  );

  if (!pathMatch) {
    return "";
  }

  const pathSlug = String(pathMatch[1] || "")
    .trim()
    .toLowerCase();

  const selectedCourse = courses.find(function (course) {
    return getCourseSlug(course.code) === pathSlug;
  });

  if (selectedCourse) {
    return normalizeCourseCode(selectedCourse.code);
  }

  return normalizeCourseCode(
    pathSlug.replace(/-/g, " ")
  );
}

  

export function initializeCatalog() {
  const input=document.getElementById("course-search-input");
  if(!input || input.dataset.atlasCatalogReady==="true")return;
  input.dataset.atlasCatalogReady="true";
  const searchBox=input.closest(".courses-search-box");
  input.addEventListener("input",renderCourses);
  input.addEventListener("focus",renderCourses);
  input.addEventListener("keydown",function(event){
    if(event.key==="Escape"){setCoursesSearchState(false);input.blur();}
  });
  document.addEventListener("click",function(event){
    if(searchBox&&!searchBox.contains(event.target))setCoursesSearchState(false);
  });
  renderSubjectFilters();
  renderBrowseCourses();
  loadRecentMaterials();
  animateCourseSearchPlaceholder();
  renderCourses();
}
export { normalizeCourseCode, getCourseUrl, getCourseByCode, getSelectedCourseCode, getProfessorProfileUrl, escapeMaterialText, getMaterialFileExtension, formatMaterialUploadDate, loadRecentMaterials };
