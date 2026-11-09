// @ts-nocheck
import { getCourseByCode, getSelectedCourseCode, loadRecentMaterials } from "./courseDiscovery";
import { loadCourseMaterials } from "./courseMaterialsUI";
import { closeMaterialChoiceMenus, setupMaterialChoiceMenus, setupMaterialFilePicker } from "./materialUploadChoices";
import { getMaterialFormControl, setMaterialUploadStatus, populateMaterialProfessorSelect,
  populateQuickMaterialCourseSelect, setMaterialUploadProgress, setupMaterialUploadForm } from "./materialUploadForm";
function setupCourseUploadStart() {
    const button = document.getElementById(
      "course-upload-start"
    );
    const modal = document.getElementById(
      "quick-material-upload-modal"
    );
    const form = document.getElementById(
      "quick-material-upload-form"
    );
    if (
      !button ||
      !modal ||
      !form ||
      modal.dataset.ready === "true"
    ) {
      return;
    }

    modal.dataset.ready = "true";

    populateQuickMaterialCourseSelect(form);
    populateMaterialProfessorSelect(form);
    setupMaterialChoiceMenus(form);
    setupMaterialFilePicker(form);

    setupMaterialUploadForm(null, {
      form: form,
      buttonLabel: "Upload material",
      getCourse: function () {
        const courseInput = getMaterialFormControl(
          form,
          "course",
          "quick-material-course"
        );

        return courseInput
          ? getCourseByCode(courseInput.value)
          : null;
      },
      onSuccess: function (uploadedCourse) {
        const courseCode = getSelectedCourseCode();
        const currentCourse = courseCode ? getCourseByCode(courseCode) : null;
        if (currentCourse) {
          // Keep the hidden course choice selected for another upload.
          const courseSelect = getMaterialFormControl(
            form,
            "course",
            "quick-material-course"
          );
          if (courseSelect) {
            courseSelect.value = currentCourse.code;
            courseSelect.dispatchEvent(
              new Event("change", { bubbles: true })
            );
          }
          return loadCourseMaterials(currentCourse);
        }
        return loadRecentMaterials();
      }
    });

    let lastTrigger = null;

    function openQuickMaterialUpload() {
      lastTrigger =
        document.activeElement instanceof HTMLElement
          ? document.activeElement
          : button;

      const courseCode = getSelectedCourseCode();
      const courseInput = getMaterialFormControl(
        form,
        "course",
        "quick-material-course"
      );
      if (courseCode && courseInput) {
        courseInput.value = courseCode;
        courseInput.dispatchEvent(
          new Event("change", { bubbles: true })
        );
      }
      modal.classList.toggle(
        "is-course-detail-upload",
        Boolean(courseCode)
      );

      modal.hidden = false;
      document.body.classList.add(
        "quick-material-upload-open"
      );
      button.setAttribute("aria-expanded", "true");

      setMaterialUploadStatus("", "", form);
      setMaterialUploadProgress(
        0,
        "Uploading files",
        false,
        form
      );

      const courseChoice = courseInput
        ? courseInput.nextElementSibling
        : null;
      const courseChoiceButton =
        courseChoice &&
        courseChoice.classList.contains(
          "material-choice"
        )
          ? courseChoice.querySelector(
              ".material-choice-button"
            )
          : null;

      // Focus the first usable form control now that the decorative
      // header close button has been removed.
      window.setTimeout(function () {
        if (modal.hidden) return;

        const professorChoice = form.querySelector(
          "#quick-material-professor + .material-choice " +
          ".material-professor-search-input, " +
          "#quick-material-professor + .material-choice " +
          ".material-choice-button"
        );
        const firstField = form.querySelector(
          "input:not([type='file']):not([type='checkbox'])"
        );
        const target = (courseCode ? professorChoice : courseChoiceButton)
          || firstField;
        if (target) target.focus({ preventScroll: true });
      }, 0);
    }

    function closeQuickMaterialUpload() {
      modal.hidden = true;
      document.body.classList.remove(
        "quick-material-upload-open"
      );
      button.setAttribute("aria-expanded", "false");
      closeMaterialChoiceMenus();

      if (lastTrigger) {
        lastTrigger.focus();
      }
    }

    button.addEventListener(
      "click",
      openQuickMaterialUpload
    );

    modal
      .querySelectorAll(
        "[data-close-quick-material-upload]"
      )
      .forEach(function (closeTrigger) {
        closeTrigger.addEventListener(
          "click",
          closeQuickMaterialUpload
        );
      });

    document.addEventListener(
      "keydown",
      function (event) {
        if (
          event.key === "Escape" &&
          !modal.hidden
        ) {
          closeQuickMaterialUpload();
        }
      }
    );
  }

  
export { setupCourseUploadStart };
