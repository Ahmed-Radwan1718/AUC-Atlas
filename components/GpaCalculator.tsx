"use client";

import { useEffect, useRef } from "react";

type SavedCourse = {
  name?: string;
  credits?: string | number | null;
  grade?: string;
};

type SavedSemester = {
  name?: string;
  courses?: SavedCourse[];
};

type AcademicProgressResponse = {
  error?: string;
  gpaCalculator?: {
    semesters?: SavedSemester[];
  };
};

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
] as const;

function getGradeLabel(value: string) {
  const grade = grades.find((item) => item[0] === value);
  return grade ? grade[1] : "Grade";
}

export function GpaCalculator() {
  const calculatorRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const calculator = calculatorRef.current;

    if (!calculator) {
      return;
    }

    const semestersRoot = calculator.querySelector<HTMLElement>("#gpa-semesters");
    const addSemesterButton = calculator.querySelector<HTMLButtonElement>("#add-semester");
    const saveGpaButton = calculator.querySelector<HTMLButtonElement>("#save-gpa-plan");
    const resetButton = calculator.querySelector<HTMLButtonElement>("#reset-courses");
    const gpaSaveMessage = calculator.querySelector<HTMLElement>("#gpa-save-message");
    const semesterGpaOutput = calculator.querySelector<HTMLElement>("#semester-gpa");
    const semesterCreditsOutput = calculator.querySelector<HTMLElement>("#semester-credits");
    const qualityPointsOutput = calculator.querySelector<HTMLElement>("#quality-points");
    const cumulativeGpaOutput = calculator.querySelector<HTMLElement>("#cumulative-gpa");

    if (
      !semestersRoot ||
      !addSemesterButton ||
      !saveGpaButton ||
      !resetButton ||
      !gpaSaveMessage ||
      !semesterGpaOutput ||
      !semesterCreditsOutput ||
      !qualityPointsOutput ||
      !cumulativeGpaOutput
    ) {
      return;
    }

    const controller = new AbortController();
    const animationFrames = new Map<HTMLElement, number>();
    const pendingTimeouts = new Set<number>();

    function setTrackedTimeout(callback: () => void, delay: number) {
      const timeoutId = window.setTimeout(() => {
        pendingTimeouts.delete(timeoutId);
        callback();
      }, delay);

      pendingTimeouts.add(timeoutId);
      return timeoutId;
    }

    function prefersReducedMotion() {
      return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    }

    function animateSummaryNumber(
      element: HTMLElement,
      nextValue: number,
      decimals: number
    ) {
      const currentValue = Number(element.textContent) || 0;

      if (prefersReducedMotion() || Math.abs(currentValue - nextValue) < 0.01) {
        element.textContent = nextValue.toFixed(decimals);
        return;
      }

      const existingFrame = animationFrames.get(element);

      if (existingFrame) {
        cancelAnimationFrame(existingFrame);
      }

      const startTime = performance.now();
      const duration = 520;

      function updateFrame(now: number) {
        const progress = Math.min((now - startTime) / duration, 1);
        const easedProgress = 1 - Math.pow(1 - progress, 3);
        const displayedValue =
          currentValue + (nextValue - currentValue) * easedProgress;

        element.textContent = displayedValue.toFixed(decimals);

        if (progress < 1) {
          const frame = requestAnimationFrame(updateFrame);
          animationFrames.set(element, frame);
        } else {
          element.textContent = nextValue.toFixed(decimals);
          animationFrames.delete(element);
        }
      }

      const frame = requestAnimationFrame(updateFrame);
      animationFrames.set(element, frame);
    }

    function updateGpaColor(value: number, hasGrades: boolean) {
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

    function calculateGpa() {
      let totalCredits = 0;
      let totalQualityPoints = 0;

      calculator.querySelectorAll<HTMLElement>(".gpa-row").forEach((row) => {
        const creditsInput = row.querySelector<HTMLInputElement>(".course-credits");
        const gradeInput = row.querySelector<HTMLInputElement>(".course-grade");

        if (!creditsInput || !gradeInput) {
          return;
        }

        const credits = Number(creditsInput.value || 0);
        const gradeValue = gradeInput.value;

        if (gradeValue === "") {
          return;
        }

        const grade = Number(gradeValue);
        totalCredits += credits;
        totalQualityPoints += credits * grade;
      });

      const semesterGpa = totalCredits ? totalQualityPoints / totalCredits : 0;
      const cumulativeGpa = semesterGpa;

      updateGpaColor(semesterGpa, totalCredits > 0);
      animateSummaryNumber(semesterGpaOutput, semesterGpa, 2);
      animateSummaryNumber(semesterCreditsOutput, totalCredits, 0);
      animateSummaryNumber(qualityPointsOutput, totalQualityPoints, 2);
      animateSummaryNumber(cumulativeGpaOutput, cumulativeGpa, 2);
    }

    function animateCourseRowIn(
      row: HTMLElement,
      semesterCoursesRoot: HTMLElement
    ) {
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

      window.requestAnimationFrame(() => {
        row.style.height = rowHeight + "px";
        row.classList.remove("is-entering");
      });

      function handleRowIn(event: TransitionEvent) {
        if (event.propertyName !== "height") {
          return;
        }

        row.style.height = "";
        row.style.overflow = "";
        row.removeEventListener("transitionend", handleRowIn);
      }

      row.addEventListener("transitionend", handleRowIn);
      calculateGpa();
    }

    function animateSemesterIn(semester: HTMLElement) {
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

      window.requestAnimationFrame(() => {
        semester.style.height = semesterHeight + "px";
        semester.classList.remove("is-entering");
      });

      function handleSemesterIn(event: TransitionEvent) {
        if (event.propertyName !== "height") {
          return;
        }

        semester.style.height = "";
        semester.style.overflow = "";
        semester.removeEventListener("transitionend", handleSemesterIn);
      }

      semester.addEventListener("transitionend", handleSemesterIn);
      calculateGpa();
    }

    function removeCourseRow(
      row: HTMLElement,
      semesterCoursesRoot: HTMLElement,
      removeButton: HTMLButtonElement
    ) {
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
      void row.offsetHeight;
      row.classList.add("is-removing");
      row.style.height = "0px";

      setTrackedTimeout(() => {
        row.remove();

        if (!semesterCoursesRoot.children.length) {
          createCourseRow(semesterCoursesRoot);
        }

        calculateGpa();
      }, 340);
    }

    function removeSemesterBlock(
      semester: HTMLElement,
      removeButton: HTMLButtonElement
    ) {
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
      void semester.offsetHeight;
      semester.classList.add("is-removing");
      semester.style.height = "0px";

      setTrackedTimeout(() => {
        semester.remove();

        if (!semestersRoot.children.length) {
          createSemesterBlock();
        }

        calculateGpa();
      }, 320);
    }

    function createCourseRow(
      semesterCoursesRoot: HTMLElement,
      courseName = "",
      credits = "3",
      grade = "",
      animateRow = true
    ) {
      const row = document.createElement("div");
      row.className = "gpa-row";

      row.innerHTML = `
        <input class="course-name" type="text" placeholder="Course name" value="${courseName}">
        <input class="course-credits" type="text" inputmode="numeric" pattern="[0-9]*" placeholder="Credits" value="${credits}" aria-label="Credits">
        <div class="grade-dropdown">
          <input class="course-grade" type="hidden" value="${grade}">
          <button class="grade-toggle" type="button" aria-label="Grade">
            <span class="grade-toggle-label">${getGradeLabel(grade)}</span>
            <span class="grade-chevron"></span>
          </button>
          <div class="grade-menu" hidden>
            ${grades
              .map(
                (item) =>
                  `<button class="grade-option" type="button" data-grade-value="${item[0]}">${item[1]}</button>`
              )
              .join("")}
          </div>
        </div>
        <button class="remove-course" type="button" aria-label="Remove course" title="Remove course">&times;</button>
      `;

      const creditsInput = row.querySelector<HTMLInputElement>(".course-credits");
      const courseNameInput = row.querySelector<HTMLInputElement>(".course-name");
      const gradeInput = row.querySelector<HTMLInputElement>(".course-grade");
      const gradeDropdown = row.querySelector<HTMLElement>(".grade-dropdown");
      const gradeToggle = row.querySelector<HTMLButtonElement>(".grade-toggle");
      const gradeToggleLabel = row.querySelector<HTMLElement>(".grade-toggle-label");
      const gradeMenu = row.querySelector<HTMLElement>(".grade-menu");
      const removeButton = row.querySelector<HTMLButtonElement>(".remove-course");

      if (
        !creditsInput ||
        !courseNameInput ||
        !gradeInput ||
        !gradeDropdown ||
        !gradeToggle ||
        !gradeToggleLabel ||
        !gradeMenu ||
        !removeButton
      ) {
        return;
      }

      creditsInput.addEventListener("input", () => {
        creditsInput.value = creditsInput.value.replace(/[^0-9]/g, "");
        calculateGpa();
      });

      courseNameInput.addEventListener("input", calculateGpa);

      gradeToggle.addEventListener("click", () => {
        const isOpen = !gradeMenu.hidden;

        document.querySelectorAll<HTMLElement>(".grade-menu").forEach((menu) => {
          menu.hidden = true;
        });

        document
          .querySelectorAll<HTMLElement>(".grade-dropdown")
          .forEach((dropdown) => {
            dropdown.classList.remove("open");
          });

        gradeMenu.hidden = isOpen;
        gradeDropdown.classList.toggle("open", !isOpen);
      });

      row.querySelectorAll<HTMLButtonElement>(".grade-option").forEach((option) => {
        option.addEventListener("click", () => {
          gradeInput.value = option.dataset.gradeValue || "";
          gradeToggleLabel.textContent = option.textContent;
          gradeMenu.hidden = true;
          gradeDropdown.classList.remove("open");
          calculateGpa();
        });
      });

      removeButton.addEventListener("click", () => {
        removeCourseRow(row, semesterCoursesRoot, removeButton);
      });

      if (animateRow) {
        animateCourseRowIn(row, semesterCoursesRoot);
      } else {
        semesterCoursesRoot.appendChild(row);
      }
    }

    function createSemesterBlock(
      semesterName = "",
      savedCourses?: SavedCourse[],
      animateSemester = true
    ) {
      const semester = document.createElement("section");
      const semesterNumber = semestersRoot.children.length + 1;
      const title = semesterName || "Semester " + semesterNumber;

      semester.className = "gpa-semester";
      semester.innerHTML = `
        <div class="gpa-semester-header">
          <input class="semester-name" type="text" value="" aria-label="Semester name">
          <div class="semester-actions">
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
          <button class="gpa-action semester-add-course" type="button" aria-label="Add course" title="Add course">+</button>
        </div>
      `;

      const semesterNameInput =
        semester.querySelector<HTMLInputElement>(".semester-name");
      const semesterCoursesRoot =
        semester.querySelector<HTMLElement>(".semester-courses");
      const addCourseButton =
        semester.querySelector<HTMLButtonElement>(".semester-add-course");
      const removeSemesterButton =
        semester.querySelector<HTMLButtonElement>(".remove-semester");

      if (
        !semesterNameInput ||
        !semesterCoursesRoot ||
        !addCourseButton ||
        !removeSemesterButton
      ) {
        return;
      }

      semesterNameInput.value = title;

      addCourseButton.addEventListener("click", () => {
        createCourseRow(semesterCoursesRoot);
      });

      removeSemesterButton.addEventListener("click", () => {
        removeSemesterBlock(semester, removeSemesterButton);
      });

      semesterNameInput.addEventListener("input", calculateGpa);

      const courses =
        Array.isArray(savedCourses) && savedCourses.length
          ? savedCourses
          : [
              { name: "", credits: "3", grade: "" },
              { name: "", credits: "3", grade: "" },
              { name: "", credits: "3", grade: "" }
            ];

      courses.forEach((course) => {
        createCourseRow(semesterCoursesRoot, "", "3", "", false);

        const row = semesterCoursesRoot.lastElementChild as HTMLElement | null;

        if (!row) {
          return;
        }

        const courseName = row.querySelector<HTMLInputElement>(".course-name");
        const courseCredits = row.querySelector<HTMLInputElement>(".course-credits");
        const courseGrade = row.querySelector<HTMLInputElement>(".course-grade");
        const gradeLabel = row.querySelector<HTMLElement>(".grade-toggle-label");

        if (!courseName || !courseCredits || !courseGrade || !gradeLabel) {
          return;
        }

        courseName.value = String(course.name || "");
        courseCredits.value = String(
          course.credits == null ? "" : course.credits
        );
        courseGrade.value = String(course.grade || "");
        gradeLabel.textContent = getGradeLabel(courseGrade.value);
      });

      if (animateSemester) {
        animateSemesterIn(semester);
      } else {
        semestersRoot.appendChild(semester);
        calculateGpa();
      }
    }

    function showGpaSaveMessage(message: string, type: string) {
      gpaSaveMessage.textContent = message;
      gpaSaveMessage.className =
        "gpa-save-message" + (type ? " " + type : "");
    }

    function getGpaCalculatorState() {
      return {
        semesters: Array.from(
          semestersRoot.querySelectorAll<HTMLElement>(".gpa-semester")
        ).map((semester) => ({
          name:
            semester.querySelector<HTMLInputElement>(".semester-name")?.value.trim() ||
            "",
          courses: Array.from(
            semester.querySelectorAll<HTMLElement>(".gpa-row")
          ).map((row) => ({
            name:
              row.querySelector<HTMLInputElement>(".course-name")?.value.trim() ||
              "",
            credits:
              row.querySelector<HTMLInputElement>(".course-credits")?.value || "",
            grade:
              row.querySelector<HTMLInputElement>(".course-grade")?.value || ""
          }))
        }))
      };
    }

    async function saveGpaCalculator() {
      saveGpaButton.disabled = true;
      saveGpaButton.textContent = "Saving...";
      showGpaSaveMessage("", "");

      try {
        const response = await fetch("/api/academic-progress", {
          method: "POST",
          credentials: "same-origin",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            type: "gpa",
            calculator: getGpaCalculatorState()
          })
        });

        const data = (await response.json().catch(() => ({}))) as {
          error?: string;
        };

        if (response.status === 401 || response.status === 403) {
          try {
            localStorage.setItem(
              "auc-atlas-login-redirect",
              "gpa-calculator.html"
            );
          } catch {}

          window.location.href = "login.html";
          return;
        }

        if (!response.ok) {
          throw new Error(data.error || "Could not save the GPA plan.");
        }

        showGpaSaveMessage("GPA plan saved.", "success");
      } catch (error) {
        showGpaSaveMessage(
          error instanceof Error ? error.message : "Could not save the GPA plan.",
          "error"
        );
      } finally {
        saveGpaButton.disabled = false;
        saveGpaButton.textContent = "Save GPA Plan";
      }
    }

    async function loadSavedGpaCalculator() {
      try {
        const response = await fetch("/api/academic-progress", {
          method: "GET",
          credentials: "same-origin",
          cache: "no-store",
          headers: {
            Accept: "application/json"
          },
          signal: controller.signal
        });

        if (controller.signal.aborted) {
          return;
        }

        if (response.status === 401 || response.status === 403) {
          createSemesterBlock("Semester 1");
          return;
        }

        const data = (await response
          .json()
          .catch(() => ({}))) as AcademicProgressResponse;

        if (!response.ok) {
          throw new Error(data.error || "Could not load the saved GPA plan.");
        }

        const savedCalculator = data.gpaCalculator;
        const savedSemesters =
          savedCalculator && Array.isArray(savedCalculator.semesters)
            ? savedCalculator.semesters
            : [];

        if (!savedSemesters.length) {
          createSemesterBlock("Semester 1");
          return;
        }

        semestersRoot.innerHTML = "";

        savedSemesters.forEach((semester) => {
          createSemesterBlock(
            String(semester.name || ""),
            Array.isArray(semester.courses) ? semester.courses : undefined,
            false
          );
        });

        calculateGpa();
        showGpaSaveMessage("Saved GPA plan loaded.", "success");
      } catch (error) {
        if (controller.signal.aborted) {
          return;
        }

        semestersRoot.innerHTML = "";
        createSemesterBlock("Semester 1");

        showGpaSaveMessage(
          error instanceof Error
            ? error.message
            : "Could not load the saved GPA plan.",
          "error"
        );
      } finally {
        if (controller.signal.aborted) {
          return;
        }

        semestersRoot.querySelector(".gpa-loading")?.remove();
      }
    }

    function markGpaPlanUnsaved() {
      showGpaSaveMessage("You have unsaved changes.", "");
    }

    function handleDocumentClick(event: MouseEvent) {
      const target = event.target;

      if (target instanceof Element && target.closest(".grade-dropdown")) {
        return;
      }

      document.querySelectorAll<HTMLElement>(".grade-menu").forEach((menu) => {
        menu.hidden = true;
      });

      document
        .querySelectorAll<HTMLElement>(".grade-dropdown")
        .forEach((dropdown) => {
          dropdown.classList.remove("open");
        });
    }

    function handleSemestersInput() {
      markGpaPlanUnsaved();
    }

    function handleSemestersClick(event: MouseEvent) {
      const target = event.target;

      if (
        target instanceof Element &&
        target.closest(".grade-option, .remove-course, .semester-add-course")
      ) {
        setTrackedTimeout(markGpaPlanUnsaved, 0);
      }
    }

    function handleAddSemester() {
      createSemesterBlock();
      markGpaPlanUnsaved();
    }

    function handleSave() {
      void saveGpaCalculator();
    }

    function handleReset() {
      semestersRoot.innerHTML = "";
      createSemesterBlock("Semester 1");
      calculateGpa();
      markGpaPlanUnsaved();
    }

    document.addEventListener("click", handleDocumentClick);
    semestersRoot.addEventListener("input", handleSemestersInput);
    semestersRoot.addEventListener("click", handleSemestersClick);
    addSemesterButton.addEventListener("click", handleAddSemester);
    saveGpaButton.addEventListener("click", handleSave);
    resetButton.addEventListener("click", handleReset);

    void loadSavedGpaCalculator();

    return () => {
      controller.abort();

      document.removeEventListener("click", handleDocumentClick);
      semestersRoot.removeEventListener("input", handleSemestersInput);
      semestersRoot.removeEventListener("click", handleSemestersClick);
      addSemesterButton.removeEventListener("click", handleAddSemester);
      saveGpaButton.removeEventListener("click", handleSave);
      resetButton.removeEventListener("click", handleReset);

      animationFrames.forEach((frame) => cancelAnimationFrame(frame));
      pendingTimeouts.forEach((timeoutId) => clearTimeout(timeoutId));
    };
  }, []);

  return (
    <main className="gpa-page" ref={calculatorRef}>
      <div className="gpa-inner">
        <section className="gpa-header">
          <div>
            <h1>Calculate your GPA.</h1>
          </div>

          <p>
            Add your courses, credits, and grades to calculate your overall GPA
            across multiple semesters.
          </p>
        </section>

        <section className="gpa-layout" aria-label="GPA calculator">
          <section className="gpa-panel">
            <div className="gpa-semesters" id="gpa-semesters">
              <div className="gpa-loading" role="status" aria-live="polite">
                <span className="gpa-loading-spinner" aria-hidden="true" />
                <span>Loading GPA calculator...</span>
              </div>
            </div>

            <div className="gpa-actions">
              <button className="gpa-action primary" type="button" id="add-semester">
                Add Semester
              </button>
              <button className="gpa-action" type="button" id="save-gpa-plan">
                Save GPA Plan
              </button>
              <button className="gpa-action" type="button" id="reset-courses">
                Reset
              </button>
            </div>

            <p
              className="gpa-save-message"
              id="gpa-save-message"
              aria-live="polite"
            />
          </section>

          <aside className="gpa-summary">
            <span className="summary-label">Overall GPA</span>
            <div className="summary-gpa" id="semester-gpa">
              0.00
            </div>

            <div className="summary-items">
              <div className="summary-item">
                <strong>Credits</strong>
                <span id="semester-credits">0</span>
              </div>
              <div className="summary-item">
                <strong>Quality Points</strong>
                <span id="quality-points">0.00</span>
              </div>
              <div className="summary-item">
                <strong>Cumulative GPA</strong>
                <span id="cumulative-gpa">0.00</span>
              </div>
            </div>
          </aside>
        </section>
      </div>
    </main>
  );
}
