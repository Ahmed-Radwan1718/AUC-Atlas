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
      onSuccess: async function () {
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
          await loadCourseMaterials(currentCourse);
        } else {
          await loadRecentMaterials();
        }
        // The file-first hub uses its own paginated directory instead of
        // the legacy six-item random-materials preview.
        window.dispatchEvent(new Event("auc-materials-updated"));
      }
    });

    let lastTrigger = null;
    const drawer = modal.querySelector(".quick-material-upload-dialog");
    const backdrop = modal.querySelector(".quick-material-upload-backdrop");
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let drawerAnimation = null;
    let backdropAnimation = null;
    let closing = false;

    function cancelAnimations() {
      if (drawerAnimation) {
        drawerAnimation.cancel();
        drawerAnimation = null;
      }
      if (backdropAnimation) {
        backdropAnimation.cancel();
        backdropAnimation = null;
      }
    }

    function animateOpening() {
      cancelAnimations();
      if (reducedMotion.matches || !drawer || !backdrop) return;

      // Match Leave a review's slide distance, duration, and easing.
      drawerAnimation = drawer.animate(
        [
          { transform: "translateX(100%)" },
          { transform: "translateX(0)" }
        ],
        {
          duration: 320,
          easing: "cubic-bezier(0.22, 1, 0.36, 1)",
          fill: "both"
        }
      );

      backdropAnimation = backdrop.animate(
        [{ opacity: 0 }, { opacity: 1 }],
        {
          duration: 280,
          easing: "ease-out",
          fill: "both"
        }
      );

      const openingDrawer = drawerAnimation;
      openingDrawer.finished.then(function () {
        if (drawerAnimation === openingDrawer) {
          openingDrawer.cancel();
          drawerAnimation = null;
        }
      }).catch(function () {});

      const openingBackdrop = backdropAnimation;
      openingBackdrop.finished.then(function () {
        if (backdropAnimation === openingBackdrop) {
          openingBackdrop.cancel();
          backdropAnimation = null;
        }
      }).catch(function () {});
    }

    function openQuickMaterialUpload() {
      if (!modal.hidden || closing) return;

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
      animateOpening();

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

    function finishClosingQuickMaterialUpload() {
      cancelAnimations();
      modal.hidden = true;
      closing = false;
      document.body.classList.remove(
        "quick-material-upload-open"
      );
      button.setAttribute("aria-expanded", "false");

      if (lastTrigger) {
        lastTrigger.focus();
      }
    }

    function closeQuickMaterialUpload() {
      if (modal.hidden || closing) return;

      closing = true;
      closeMaterialChoiceMenus();
      cancelAnimations();

      if (reducedMotion.matches || !drawer || !backdrop) {
        finishClosingQuickMaterialUpload();
        return;
      }

      // Match Leave a review's exit slide and backdrop fade.
      drawerAnimation = drawer.animate(
        [
          { transform: "translateX(0)" },
          { transform: "translateX(100%)" }
        ],
        {
          duration: 250,
          easing: "cubic-bezier(0.4, 0, 0.2, 1)",
          fill: "both"
        }
      );

      backdropAnimation = backdrop.animate(
        [{ opacity: 1 }, { opacity: 0 }],
        {
          duration: 220,
          easing: "ease-in",
          fill: "both"
        }
      );

      drawerAnimation.finished
        .then(finishClosingQuickMaterialUpload)
        .catch(finishClosingQuickMaterialUpload);
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
