(function () {
  const form = document.getElementById("atlas-search-form");
  const input = document.getElementById("atlas-search-input");
  const panel = document.getElementById("atlas-search-results");
  const list = document.getElementById("atlas-search-results-list");
  const status = document.getElementById("atlas-search-status");

  if (!form || !input || !panel || !list || !status) {
    return;
  }

  const minimumQueryLength = 2;
  let activeResultIndex = -1;
  let resultLinks = [];
  let materialRequestNumber = 0;
  let materialSearchTimer = null;
  let allowPanelOpen = true;
  let materialState = {
    loading: false,
    locked: false,
    materials: []
  };

  function normalize(value) {
    return String(value || "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, " ")
      .trim();
  }

  function getSearchTerms(query) {
    return normalize(query).split(/\s+/).filter(Boolean);
  }

  function getMatchScore(query, primaryText, values) {
    const normalizedQuery = normalize(query);
    const terms = getSearchTerms(query);
    const normalizedPrimary = normalize(primaryText);
    const normalizedValues = values.map(normalize);
    const searchableText = normalizedValues.join(" ");

    if (!terms.length || !terms.every(function (term) {
      return searchableText.includes(term);
    })) {
      return -1;
    }

    let score = 0;

    if (normalizedPrimary === normalizedQuery) {
      score += 500;
    } else if (normalizedPrimary.startsWith(normalizedQuery)) {
      score += 300;
    } else if (normalizedPrimary.includes(normalizedQuery)) {
      score += 180;
    }

    normalizedValues.forEach(function (value, index) {
      if (value === normalizedQuery) {
        score += index === 0 ? 180 : 90;
      } else if (value.startsWith(normalizedQuery)) {
        score += index === 0 ? 110 : 55;
      } else if (value.includes(normalizedQuery)) {
        score += index === 0 ? 70 : 30;
      }
    });

    score += Math.max(0, 50 - normalizedPrimary.length);
    return score;
  }

  const professorReviewCountCache = new Map();
  const professorReviewCountRequests = new Map();

  function getReviewCountLabel(count) {
    return count + " " + (count === 1 ? "review" : "reviews");
  }

  function getProfessorMeta(result, reviewCount) {
    const reviewLabel = Number.isInteger(reviewCount)
      ? getReviewCountLabel(reviewCount)
      : "Loading reviews...";

    return [
      result.department,
      result.courses,
      reviewLabel
    ].filter(Boolean).join(" · ");
  }

  function loadProfessorReviewCount(professorId) {
    if (professorReviewCountCache.has(professorId)) {
      return Promise.resolve(professorReviewCountCache.get(professorId));
    }

    if (professorReviewCountRequests.has(professorId)) {
      return professorReviewCountRequests.get(professorId);
    }

    const request = fetch(
      "/api/professor-reviews?professorId=" +
        encodeURIComponent(professorId) +
        "&countOnly=true",
      {
        credentials: "same-origin",
        cache: "no-store",
        headers: {
          Accept: "application/json"
        }
      }
    ).then(function (response) {
      if (!response.ok) {
        throw new Error("Could not load review count.");
      }

      return response.json();
    }).then(function (data) {
      const reviewCount = Number(data.reviewCount || 0);

      professorReviewCountCache.set(professorId, reviewCount);
      return reviewCount;
    }).catch(function () {
      return null;
    }).finally(function () {
      professorReviewCountRequests.delete(professorId);
    });

    professorReviewCountRequests.set(professorId, request);
    return request;
  }

  function getProfessorResults(query) {
    const professors = Array.isArray(window.aucAtlasProfessors)
      ? window.aucAtlasProfessors
      : [];

    return professors.map(function (professor) {
      const professorId = professor.id || "";
      const department = professor.displayDepartment || professor.department || "AUC";
      const courses = professor.course || "Courses coming soon";
      const score = getMatchScore(query, professor.name, [
        professor.name,
        professor.id,
        professor.department,
        professor.displayDepartment,
        professor.filterDepartment,
        professor.course,
        professor.bio
      ]);
      const result = {
        type: "Professor",
        title: professor.name,
        professorId,
        department,
        courses,
        meta: "",
        href: "professors.html?id=" + encodeURIComponent(professorId),
        score
      };

      result.meta = getProfessorMeta(
        result,
        professorReviewCountCache.get(professorId)
      );

      return result;
    }).filter(function (result) {
      return result.score >= 0;
    }).sort(function (firstResult, secondResult) {
      return secondResult.score - firstResult.score ||
        firstResult.title.localeCompare(secondResult.title);
    }).slice(0, 12);
  }

  function getCourseResults(query) {
    const courses = Array.isArray(window.aucAtlasCourses)
      ? window.aucAtlasCourses
      : [];

    return courses.map(function (course) {
      const score = getMatchScore(query, course.code, [
        course.code,
        course.title,
        course.subject,
        course.department,
        course.level
      ]);

      return {
        type: "Course",
        title: course.code + " — " + course.title,
        meta: course.department + " · " + course.level,
        href: "courses.html?course=" + encodeURIComponent(course.code),
        score
      };
    }).filter(function (result) {
      return result.score >= 0;
    }).sort(function (firstResult, secondResult) {
      return secondResult.score - firstResult.score ||
        firstResult.title.localeCompare(secondResult.title);
    }).slice(0, 12);
  }

  function getMaterialResults() {
    return materialState.materials.map(function (material) {
      const metaParts = [
        material.courseCode,
        material.materialType,
        material.professor,
        material.semester
      ].filter(Boolean);

      return {
        type: "Material",
        title: material.title || "Course material",
        meta: metaParts.join(" · "),
        href: "courses.html?course=" +
          encodeURIComponent(material.courseCode || "") +
          "#course-materials-access",
        score: Number(material.score || 0)
      };
    });
  }

  function createResultLink(result) {
    const link = document.createElement("a");
    const type = document.createElement("span");
    const copy = document.createElement("span");
    const title = document.createElement("strong");
    const meta = document.createElement("small");

    link.className = "atlas-search-result";
    link.href = result.href;

    type.className = "atlas-search-result-type";
    type.textContent = result.type;

    copy.className = "atlas-search-result-copy";
    title.textContent = result.title;
    meta.textContent = result.meta;

    copy.appendChild(title);
    copy.appendChild(meta);
    link.appendChild(type);
    link.appendChild(copy);

    if (result.type === "Professor" && result.professorId) {
      loadProfessorReviewCount(result.professorId).then(function (reviewCount) {
        if (!link.isConnected) {
          return;
        }

        meta.textContent = reviewCount === null
          ? [
              result.department,
              result.courses,
              "Reviews unavailable"
            ].filter(Boolean).join(" · ")
          : getProfessorMeta(result, reviewCount);
      });
    }

    link.addEventListener("mouseenter", function () {
      setActiveResult(resultLinks.indexOf(link));
    });

    return link;
  }

  function appendResultSection(label, results) {
    if (!results.length) {
      return;
    }

    const section = document.createElement("section");
    const heading = document.createElement("h2");
    const count = document.createElement("span");

    section.className = "atlas-search-result-section";
    heading.textContent = label;
    count.textContent = String(results.length);

    heading.appendChild(count);
    section.appendChild(heading);

    results.forEach(function (result) {
      section.appendChild(createResultLink(result));
    });

    list.appendChild(section);
  }

  function setStatus(message) {
    status.textContent = message;
    status.hidden = !message;
  }

  function openPanel() {
    if (!allowPanelOpen) {
      return;
    }

    panel.hidden = false;
    input.setAttribute("aria-expanded", "true");
  }

  function closePanel(shouldDismiss) {
    if (shouldDismiss) {
      allowPanelOpen = false;
    }

    panel.hidden = true;
    input.setAttribute("aria-expanded", "false");
    setActiveResult(-1);
  }

  function setActiveResult(index) {
    resultLinks.forEach(function (link) {
      link.classList.remove("is-active");
    });

    if (!resultLinks.length || index < 0) {
      activeResultIndex = -1;
      return;
    }

    activeResultIndex = (index + resultLinks.length) % resultLinks.length;
    resultLinks[activeResultIndex].classList.add("is-active");
    resultLinks[activeResultIndex].scrollIntoView({
      block: "nearest"
    });
  }

  function renderResults(query) {
    const professorResults = getProfessorResults(query);
    const courseResults = getCourseResults(query);
    const materialResults = getMaterialResults();

    list.innerHTML = "";

    appendResultSection("Professors", professorResults);
    appendResultSection("Courses", courseResults);
    appendResultSection("Course materials", materialResults);

    resultLinks = Array.from(
      list.querySelectorAll(".atlas-search-result")
    );

    setActiveResult(-1);

    if (!resultLinks.length && materialState.loading) {
      setStatus("Searching course materials...");
    } else if (!resultLinks.length && materialState.locked) {
      setStatus(
        "No professor or course matches. Log in with your verified AUC email to search course materials."
      );
    } else if (!resultLinks.length) {
      setStatus(
        "No matches found. Try a professor name, course code, course title, or material title."
      );
    } else if (materialState.loading) {
      setStatus("Searching course materials...");
    } else if (materialState.locked) {
      setStatus(
        "Log in with your verified AUC email to include course materials."
      );
    } else {
      setStatus("");
    }

    openPanel();
  }

  async function searchMaterials(query, requestNumber) {
    try {
      const response = await fetch(
        "/api/search-materials?q=" + encodeURIComponent(query),
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

      if (
        requestNumber !== materialRequestNumber ||
        input.value.trim() !== query
      ) {
        return;
      }

      materialState = {
        loading: false,
        locked: Boolean(data.materialsLocked),
        materials:
          response.ok && Array.isArray(data.materials)
            ? data.materials
            : []
      };

      renderResults(query);
    } catch (error) {
      if (
        requestNumber !== materialRequestNumber ||
        input.value.trim() !== query
      ) {
        return;
      }

      materialState = {
        loading: false,
        locked: false,
        materials: []
      };

      renderResults(query);
    }
  }

  function startSearch() {
    const query = input.value.trim();

    allowPanelOpen = true;
    window.clearTimeout(materialSearchTimer);
    materialRequestNumber += 1;

    if (query.length < minimumQueryLength) {
      materialState = {
        loading: false,
        locked: false,
        materials: []
      };

      list.innerHTML = "";
      setStatus("");
      closePanel(false);
      return;
    }

    materialState = {
      loading: true,
      locked: false,
      materials: []
    };

    renderResults(query);

    const requestNumber = materialRequestNumber;

    materialSearchTimer = window.setTimeout(function () {
      searchMaterials(query, requestNumber);
    }, 220);
  }

  form.addEventListener("submit", function (event) {
    event.preventDefault();
    allowPanelOpen = true;

    if (input.value.trim().length < minimumQueryLength) {
      input.focus();
      return;
    }

    if (
      activeResultIndex >= 0 &&
      resultLinks[activeResultIndex]
    ) {
      resultLinks[activeResultIndex].click();
      return;
    }

    startSearch();
  });

  input.addEventListener("input", startSearch);

  input.addEventListener("focus", function () {
    allowPanelOpen = true;

    if (input.value.trim().length >= minimumQueryLength) {
      renderResults(input.value.trim());
    }
  });

  input.addEventListener("keydown", function (event) {
    if (panel.hidden || !resultLinks.length) {
      return;
    }

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveResult(activeResultIndex + 1);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();

      setActiveResult(
        activeResultIndex <= 0
          ? resultLinks.length - 1
          : activeResultIndex - 1
      );
    } else if (
      event.key === "Enter" &&
      activeResultIndex >= 0
    ) {
      event.preventDefault();
      resultLinks[activeResultIndex].click();
    } else if (event.key === "Escape") {
      event.preventDefault();
      closePanel(true);
    }
  });

  document.addEventListener("click", function (event) {
    if (!form.contains(event.target)) {
      closePanel(true);
    }
  });
})();
