// @ts-nocheck
// Existing AUC Atlas interaction logic retained during the TypeScript migration.
// The legacy DOM implementation is isolated so the new application uses no standalone JS files.

export function mountGpaCalculator() {
  const root = document.querySelector("#gpa-semesters");
  if (!root || root.getAttribute("data-atlas-initialized") === "true") return;
  root.setAttribute("data-atlas-initialized", "true");

    const semestersRoot = document.getElementById("gpa-semesters");
    const addSemesterButton = document.getElementById("add-semester");
    const saveGpaButton = document.getElementById("save-gpa-plan");
    const resetButton = document.getElementById("reset-courses");
    const gpaSaveMessage = document.getElementById("gpa-save-message");
    const semesterCountOutput = document.getElementById("semester-count");
    const resetDialog = document.getElementById("gpa-reset-dialog");
    const confirmResetButton = document.getElementById("gpa-confirm-reset");
    const cancelResetButton = document.getElementById("gpa-cancel-reset");
    const semesterGpaOutput = document.getElementById("semester-gpa");
    const semesterCreditsOutput = document.getElementById("semester-credits");
    const qualityPointsOutput = document.getElementById("quality-points");

    const creditValues = [1, 2, 3, 4, 5, 6];

    function normalizeCredits(value) {
      const amount = Number(value);
      return creditValues.includes(amount) ? String(amount) : "3";
    }

    const grades = [
      ["", "Grade"],
      ["4.0", "A"],
      ["3.7", "A-"],
      ["3.3", "B+"],
      ["3.0", "B"],
      ["2.7", "B-"],
      ["2.3", "C+"],
      ["2.0", "C"],
      ["1.7", "C-"],
      ["1.3", "D+"],
      ["1.0", "D"],
      ["0", "F"]
    ];

    function getGradeLabel(value) {
      const grade = grades.find(function (item) {
        return item[0] === value;
      });

      return grade ? grade[1] : "Grade";
    }

    function closeGpaDropdowns() {
      semestersRoot.querySelectorAll(".grade-dropdown.open").forEach(function (dropdown) {
        dropdown.classList.remove("open");
        const toggle = dropdown.querySelector(".grade-toggle");
        const menu = dropdown.querySelector(".grade-menu");
        if (toggle) toggle.setAttribute("aria-expanded", "false");
        if (menu) menu.hidden = true;
      });
    }

    function toggleGpaDropdown(dropdown) {
      const shouldOpen = !dropdown.classList.contains("open");
      closeGpaDropdowns();
      if (!shouldOpen) return;

      const toggle = dropdown.querySelector(".grade-toggle");
      const menu = dropdown.querySelector(".grade-menu");
      if (!toggle || !menu) return;

      dropdown.classList.add("open");
      menu.hidden = false;
      toggle.setAttribute("aria-expanded", "true");
    }

    function syncGpaDropdownOptions(menu, dataAttribute, value) {
      menu.querySelectorAll(".grade-option").forEach(function (option) {
        const selected = option.getAttribute(dataAttribute) === value;
        option.classList.toggle("active", selected);
        option.setAttribute("aria-pressed", String(selected));
      });
    }

    function prefersReducedMotion() {
      return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    }

    function animateSummaryNumber(element, nextValue, decimals) {
      const currentValue = Number(element.textContent) || 0;

      if (prefersReducedMotion() || Math.abs(currentValue - nextValue) < 0.01) {
        element.textContent = nextValue.toFixed(decimals);
        return;
      }

      if (element.gpaAnimationFrame) {
        cancelAnimationFrame(element.gpaAnimationFrame);
      }

      const startTime = performance.now();
      const duration = 520;

      function updateFrame(now) {
        const progress = Math.min((now - startTime) / duration, 1);
        const easedProgress = 1 - Math.pow(1 - progress, 3);
        const displayedValue = currentValue + (nextValue - currentValue) * easedProgress;

        element.textContent = displayedValue.toFixed(decimals);

        if (progress < 1) {
          element.gpaAnimationFrame = requestAnimationFrame(updateFrame);
        } else {
          element.textContent = nextValue.toFixed(decimals);
        }
      }

      element.gpaAnimationFrame = requestAnimationFrame(updateFrame);
    }

    function updateGpaColor(value, hasGrades) {
      semesterGpaOutput.classList.remove("gpa-good", "gpa-mid", "gpa-low");

      if (!hasGrades) {
        return;
      }

      if (value >= 3.4) {
        semesterGpaOutput.classList.add("gpa-good");
      } else if (value >= 2.3) {
        semesterGpaOutput.classList.add("gpa-mid");
      } else {
        semesterGpaOutput.classList.add("gpa-low");
      }
    }

    function animateCourseRowIn(row, semesterCoursesRoot) {
      if (prefersReducedMotion()) {
        semesterCoursesRoot.appendChild(row);
        calculateGpa();
        return;
      }

      row.classList.add("is-entering");
      row.style.height = "0px";
      row.style.overflow = "hidden";
      semesterCoursesRoot.appendChild(row);

      const rowHeight = row.scrollHeight;

      window.requestAnimationFrame(function () {
        row.style.height = rowHeight + "px";
        row.classList.remove("is-entering");
      });

      row.addEventListener("transitionend", function handleRowIn(event) {
        if (event.propertyName !== "height") {
          return;
        }

        row.style.height = "";
        row.style.overflow = "";
        row.removeEventListener("transitionend", handleRowIn);
      });

      calculateGpa();
    }

    function animateSemesterIn(semester) {
      if (prefersReducedMotion()) {
        semestersRoot.appendChild(semester);
        calculateGpa();
        return;
      }

      semester.classList.add("is-entering");
      semester.style.height = "0px";
      semester.style.overflow = "hidden";
      semestersRoot.appendChild(semester);

      const semesterHeight = semester.scrollHeight;

      window.requestAnimationFrame(function () {
        semester.style.height = semesterHeight + "px";
        semester.classList.remove("is-entering");
      });

      semester.addEventListener("transitionend", function handleSemesterIn(event) {
        if (event.propertyName !== "height") {
          return;
        }

        semester.style.height = "";
        semester.style.overflow = "";
        semester.removeEventListener("transitionend", handleSemesterIn);
      });

      calculateGpa();
    }

    function removeCourseRow(row, semesterCoursesRoot, removeButton) {
      if (row.classList.contains("is-removing")) {
        return;
      }

      removeButton.disabled = true;

      if (prefersReducedMotion()) {
        row.remove();

        if (!semesterCoursesRoot.children.length) {
          createCourseRow(semesterCoursesRoot);
        }

        calculateGpa();
        return;
      }

      row.style.height = row.getBoundingClientRect().height + "px";
      row.style.overflow = "hidden";
      row.offsetHeight;
      row.classList.add("is-removing");
      row.style.height = "0px";

      window.setTimeout(function () {
        row.remove();

        if (!semesterCoursesRoot.children.length) {
          createCourseRow(semesterCoursesRoot);
        }

        calculateGpa();
      }, 340);
    }

    function removeSemesterBlock(semester, removeButton) {
      if (semester.classList.contains("is-removing")) {
        return;
      }

      removeButton.disabled = true;

      if (prefersReducedMotion()) {
        semester.remove();

        if (!semestersRoot.children.length) {
          createSemesterBlock();
        }

        calculateGpa();
        return;
      }

      semester.style.height = semester.getBoundingClientRect().height + "px";
      semester.style.overflow = "hidden";
      semester.offsetHeight;
      semester.classList.add("is-removing");
      semester.style.height = "0px";

      window.setTimeout(function () {
        semester.remove();

        if (!semestersRoot.children.length) {
          createSemesterBlock();
        }

        calculateGpa();
      }, 320);
    }

    function createSemesterBlock(
      semesterName = "",
      savedCourses,
      animateSemester = true
    ) {
      const semester =
        document.createElement("section");

      const semesterNumber =
        semestersRoot.children.length + 1;

      const title =
        semesterName ||
        "Semester " + semesterNumber;

      semester.className =
        "gpa-semester";

      semester.innerHTML = `
        <div class="gpa-semester-header">
          <input class="semester-name" type="text" value="" aria-label="Semester name">
          <div class="semester-actions">
            <span class="semester-course-count">3 courses</span>
            <button class="remove-course remove-semester" type="button" aria-label="Remove semester" title="Remove semester">&times;</button>
          </div>
        </div>

        <div class="gpa-table-head">
          <span>Course</span>
          <span>Credits</span>
          <span>Grade</span>
          <span></span>
        </div>

        <div class="semester-courses"></div>

        <div class="semester-course-footer">
          <button class="gpa-action semester-add-course" type="button"><span aria-hidden="true">+</span> Add course</button>
          <div class="semester-result"><span>Semester GPA</span><strong class="semester-gpa-value" aria-label="Semester GPA">—</strong></div>
        </div>
      `;

      const semesterNameInput =
        semester.querySelector(
          ".semester-name"
        );

      const semesterCoursesRoot =
        semester.querySelector(
          ".semester-courses"
        );

      semesterNameInput.value = title;

      semester
        .querySelector(
          ".semester-add-course"
        )
        .addEventListener(
          "click",
          function () {
            createCourseRow(
              semesterCoursesRoot
            );
          }
        );

      semester
        .querySelector(
          ".remove-semester"
        )
        .addEventListener(
          "click",
          function () {
            removeSemesterBlock(
              semester,
              semester.querySelector(
                ".remove-semester"
              )
            );
          }
        );

      semesterNameInput.addEventListener(
        "input",
        calculateGpa
      );

      const courses =
        Array.isArray(savedCourses) &&
        savedCourses.length
          ? savedCourses
          : [
              {
                name: "",
                credits: "3",
                grade: ""
              },
              {
                name: "",
                credits: "3",
                grade: ""
              },
              {
                name: "",
                credits: "3",
                grade: ""
              }
            ];

      courses.forEach(function (course) {
        createCourseRow(
          semesterCoursesRoot,
          "",
          "3",
          "",
          false
        );

        const row =
          semesterCoursesRoot
            .lastElementChild;

        const courseName =
          row.querySelector(
            ".course-name"
          );

        const courseCredits =
          row.querySelector(
            ".course-credits"
          );

        const courseGrade =
          row.querySelector(
            ".course-grade"
          );

        const gradeLabel =
          row.querySelector(
            ".grade-toggle-label"
          );

        courseName.value =
          String(course.name || "");

        courseCredits.value = normalizeCredits(course.credits);
        row.querySelector(".credits-toggle-label").textContent = courseCredits.value;
        row.querySelector(".credits-toggle").setAttribute("aria-label", "Credits: " + courseCredits.value);
        syncGpaDropdownOptions(row.querySelector(".credits-menu"), "data-credit-value", courseCredits.value);

        courseGrade.value =
          String(course.grade || "");

        gradeLabel.textContent =
          getGradeLabel(
            courseGrade.value
          );
        row.querySelector(".grade-dropdown:not(.credits-dropdown) .grade-toggle")
          .setAttribute("aria-label", "Grade: " + getGradeLabel(courseGrade.value));
        syncGpaDropdownOptions(
          row.querySelector(".grade-dropdown:not(.credits-dropdown) .grade-menu"),
          "data-grade-value",
          courseGrade.value
        );
      });

      if (animateSemester) {
        animateSemesterIn(semester);
      } else {
        semestersRoot.appendChild(
          semester
        );

        calculateGpa();
      }
    }

    function createCourseRow(semesterCoursesRoot, courseName = "", credits = "3", grade = "", animateRow = true) {
      const row = document.createElement("div");
      row.className = "gpa-row";

      row.innerHTML = `
        <input class="course-name" type="text" placeholder="Course name" value="${courseName}">
        <div class="grade-dropdown credits-dropdown">
          <input class="course-credits" type="hidden" value="${normalizeCredits(credits)}">
          <button class="grade-toggle credits-toggle" type="button" aria-label="Credits" aria-expanded="false">
            <span class="credits-toggle-label">${normalizeCredits(credits)}</span>
            <span class="grade-chevron" aria-hidden="true"></span>
          </button>
          <div class="grade-menu credits-menu" hidden>
            ${creditValues.map(function (value) {
              return `<button class="grade-option" type="button" data-credit-value="${value}">${value}</button>`;
            }).join("")}
          </div>
        </div>
        <div class="grade-dropdown">
          <input class="course-grade" type="hidden" value="${grade}">
          <button class="grade-toggle" type="button" aria-label="Grade" aria-expanded="false">
            <span class="grade-toggle-label">${getGradeLabel(grade)}</span>
            <span class="grade-chevron"></span>
          </button>
          <div class="grade-menu" hidden>
            ${grades.map(function (item) {
              return `<button class="grade-option" type="button" data-grade-value="${item[0]}">${item[1]}</button>`;
            }).join("")}
          </div>
        </div>
        <button class="remove-course" type="button" aria-label="Remove course" title="Remove course">&times;</button>
      `;

      const creditsInput = row.querySelector(".course-credits");
      const creditsDropdown = row.querySelector(".credits-dropdown");
      const creditsToggle = row.querySelector(".credits-toggle");
      const creditsToggleLabel = row.querySelector(".credits-toggle-label");
      const creditsMenu = row.querySelector(".credits-menu");
      const gradeInput = row.querySelector(".course-grade");
      const gradeDropdown = row.querySelector(".grade-dropdown:not(.credits-dropdown)");
      const gradeToggle = gradeDropdown.querySelector(".grade-toggle");
      const gradeToggleLabel = gradeDropdown.querySelector(".grade-toggle-label");
      const gradeMenu = gradeDropdown.querySelector(".grade-menu");

      creditsToggle.setAttribute("aria-label", "Credits: " + creditsInput.value);
      gradeToggle.setAttribute("aria-label", "Grade: " + getGradeLabel(gradeInput.value));
      syncGpaDropdownOptions(creditsMenu, "data-credit-value", creditsInput.value);
      syncGpaDropdownOptions(gradeMenu, "data-grade-value", gradeInput.value);

      creditsToggle.addEventListener("click", function () {
        toggleGpaDropdown(creditsDropdown);
      });

      creditsMenu.querySelectorAll(".grade-option").forEach(function (option) {
        option.addEventListener("click", function () {
          creditsInput.value = normalizeCredits(option.dataset.creditValue);
          creditsToggleLabel.textContent = creditsInput.value;
          creditsToggle.setAttribute("aria-label", "Credits: " + creditsInput.value);
          syncGpaDropdownOptions(creditsMenu, "data-credit-value", creditsInput.value);
          closeGpaDropdowns();
          creditsToggle.focus();
          calculateGpa();
        });
      });

      row.querySelector(".course-name").addEventListener("input", calculateGpa);

      gradeToggle.addEventListener("click", function () {
        toggleGpaDropdown(gradeDropdown);
      });

      gradeMenu.querySelectorAll(".grade-option").forEach(function (option) {
        option.addEventListener("click", function () {
          gradeInput.value = option.dataset.gradeValue;
          gradeToggleLabel.textContent = getGradeLabel(gradeInput.value);
          gradeToggle.setAttribute("aria-label", "Grade: " + getGradeLabel(gradeInput.value));
          syncGpaDropdownOptions(gradeMenu, "data-grade-value", gradeInput.value);
          closeGpaDropdowns();
          gradeToggle.focus();
          calculateGpa();
        });
      });

      row.querySelector(".remove-course").addEventListener("click", function () {
        removeCourseRow(row, semesterCoursesRoot, row.querySelector(".remove-course"));
      });

      if (animateRow) {
        animateCourseRowIn(row, semesterCoursesRoot);
      } else {
        semesterCoursesRoot.appendChild(row);
      }
    }

    function calculateGpa() {
      let totalCredits = 0;
      let totalQualityPoints = 0;
      const semesters = semestersRoot.querySelectorAll(".gpa-semester:not(.is-removing)");

      semesters.forEach(function (semester) {
        const rows = semester.querySelectorAll(".gpa-row:not(.is-removing)");
        const count = rows.length;
        const courseCount = semester.querySelector(".semester-course-count");
        if (courseCount) courseCount.textContent = count + (count === 1 ? " course" : " courses");

        let semesterCredits = 0;
        let semesterPoints = 0;

        rows.forEach(function (row) {
          const credits = Number(row.querySelector(".course-credits").value || 0);
          const gradeValue = row.querySelector(".course-grade").value;
          if (gradeValue === "" || !Number.isFinite(credits) || credits <= 0) return;

          semesterCredits += credits;
          semesterPoints += credits * Number(gradeValue);
        });

        const value = semester.querySelector(".semester-gpa-value");
        if (value) value.textContent = semesterCredits ? (semesterPoints / semesterCredits).toFixed(2) : "—";
        totalCredits += semesterCredits;
        totalQualityPoints += semesterPoints;
      });

      const overallGpa = totalCredits ? totalQualityPoints / totalCredits : 0;
      if (semesterCountOutput) semesterCountOutput.textContent = String(semesters.length);
      updateGpaColor(overallGpa, totalCredits > 0);
      if (totalCredits) {
        animateSummaryNumber(semesterGpaOutput, overallGpa, 2);
      } else {
        if (semesterGpaOutput.gpaAnimationFrame) cancelAnimationFrame(semesterGpaOutput.gpaAnimationFrame);
        semesterGpaOutput.textContent = "—";
      }
      animateSummaryNumber(semesterCreditsOutput, totalCredits, 0);
      animateSummaryNumber(qualityPointsOutput, totalQualityPoints, 2);
    }

    function showGpaSaveMessage(
      message,
      type
    ) {
      gpaSaveMessage.textContent =
        message;

      gpaSaveMessage.className =
        "gpa-save-message" +
        (type ? " " + type : "");
    }

    function getGpaCalculatorState() {
      return {
        semesters: Array.from(
          semestersRoot.querySelectorAll(
            ".gpa-semester"
          )
        ).map(function (semester) {
          return {
            name:
              semester.querySelector(
                ".semester-name"
              ).value.trim(),
            courses: Array.from(
              semester.querySelectorAll(
                ".gpa-row"
              )
            ).map(function (row) {
              return {
                name:
                  row.querySelector(
                    ".course-name"
                  ).value.trim(),
                credits:
                  row.querySelector(
                    ".course-credits"
                  ).value,
                grade:
                  row.querySelector(
                    ".course-grade"
                  ).value
              };
            })
          };
        })
      };
    }

    async function saveGpaCalculator() {
      saveGpaButton.disabled = true;
      saveGpaButton.textContent =
        "Saving…";
      showGpaSaveMessage("", "");

      try {
        const response = await fetch(
          "/api/academic-progress",
          {
            method: "POST",
            credentials: "same-origin",
            headers: {
              "Content-Type":
                "application/json"
            },
            body: JSON.stringify({
              type: "gpa",
              calculator:
                getGpaCalculatorState()
            })
          }
        );

        const data = await response
          .json()
          .catch(function () {
            return {};
          });

        if (
          response.status === 401 ||
          response.status === 403
        ) {
          try {
            localStorage.setItem(
              "auc-atlas-login-redirect",
              "/gpa-calculator"
            );
          } catch (error) {}

          window.location.href =
            "/login";

          return;
        }

        if (!response.ok) {
          throw new Error(
            data.error ||
            "Could not save the GPA plan."
          );
        }

        showGpaSaveMessage(
          "GPA plan saved.",
          "success"
        );
      } catch (error) {
        showGpaSaveMessage(
          error.message ||
          "Could not save the GPA plan.",
          "error"
        );
      } finally {
        saveGpaButton.disabled = false;
        saveGpaButton.textContent =
          "Save plan";
      }
    }

    async function loadSavedGpaCalculator() {
      try {
        const response = await fetch(
          "/api/academic-progress",
          {
            method: "GET",
            credentials: "same-origin",
            cache: "no-store",
            headers: {
              Accept: "application/json"
            }
          }
        );

        if (
          response.status === 401 ||
          response.status === 403
        ) {
          createSemesterBlock(
            "Semester 1"
          );

          return;
        }

        const data = await response
          .json()
          .catch(function () {
            return {};
          });

        if (!response.ok) {
          throw new Error(
            data.error ||
            "Could not load the saved GPA plan."
          );
        }

        const savedCalculator =
          data.gpaCalculator;

        const savedSemesters =
          savedCalculator &&
          Array.isArray(
            savedCalculator.semesters
          )
            ? savedCalculator.semesters
            : [];

        if (!savedSemesters.length) {
          createSemesterBlock(
            "Semester 1"
          );

          return;
        }

        semestersRoot.innerHTML = "";

        savedSemesters.forEach(
          function (semester) {
            createSemesterBlock(
              semester.name,
              semester.courses,
              false
            );
          }
        );

        calculateGpa();

        showGpaSaveMessage(
          "Saved GPA plan loaded.",
          "success"
        );
      } catch (error) {
        semestersRoot.innerHTML = "";

        createSemesterBlock(
          "Semester 1"
        );

        showGpaSaveMessage(
          error.message ||
          "Could not load the saved GPA plan.",
          "error"
        );
      } finally {
        const loadingState = semestersRoot.querySelector(".gpa-loading");
        if (loadingState) loadingState.remove();
        semestersRoot.setAttribute("aria-busy", "false");
        addSemesterButton.hidden = false;
        saveGpaButton.disabled = false;
        resetButton.disabled = false;
      }
    }

    function markGpaPlanUnsaved() {
      showGpaSaveMessage(
        "You have unsaved changes.",
        ""
      );
    }

    document.addEventListener("click", function (event) {
      if (!event.target.closest(".grade-dropdown")) closeGpaDropdowns();
    });

    semestersRoot.addEventListener(
      "input",
      markGpaPlanUnsaved
    );

    semestersRoot.addEventListener(
      "click",
      function (event) {
        if (
          event.target.closest(
            ".grade-option, .remove-course, .semester-add-course"
          )
        ) {
          window.setTimeout(
            markGpaPlanUnsaved,
            0
          );
        }
      }
    );

    addSemesterButton.addEventListener(
      "click",
      function () {
        createSemesterBlock();
        markGpaPlanUnsaved();
      }
    );

    saveGpaButton.addEventListener(
      "click",
      saveGpaCalculator
    );

    function closeResetDialog() {
      resetDialog.hidden = true;
      document.body.classList.remove("gpa-dialog-open");
      resetButton.focus();
    }

    document.addEventListener("keydown", function (event) {
      if (event.key !== "Escape") return;
      const openDropdown = semestersRoot.querySelector(".grade-dropdown.open");
      if (openDropdown) {
        closeGpaDropdowns();
        openDropdown.querySelector(".grade-toggle")?.focus();
      }
      if (!resetDialog.hidden) closeResetDialog();
    });

    resetButton.addEventListener("click", function () {
      resetDialog.hidden = false;
      document.body.classList.add("gpa-dialog-open");
      cancelResetButton.focus();
    });

    cancelResetButton.addEventListener("click", closeResetDialog);
    resetDialog.addEventListener("click", function (event) {
      if (event.target === resetDialog) closeResetDialog();
    });
    confirmResetButton.addEventListener("click", function () {
      semestersRoot.innerHTML = "";
      createSemesterBlock("Semester 1");
      calculateGpa();
      markGpaPlanUnsaved();
      closeResetDialog();
    });

    loadSavedGpaCalculator();
  
}
