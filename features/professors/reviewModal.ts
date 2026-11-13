// @ts-nocheck
import { populateReviewCourseSelect, setupReviewDependsField, setupReviewSearchSelect, setupReviewChoiceMenus, setupReviewCompactControls } from "./reviewControls";
import { renderProfessorReviews, renderProfessorReviewsLocked, renderProfessorReviewsUnavailable } from "./reviewPresentation";

async function loadProfessorReviews(professorId) {
  try {
    const response=await fetch("/api/professor-reviews?professorId="+encodeURIComponent(professorId),{
      credentials:"same-origin", cache:"no-store", headers:{Accept:"application/json"}
    });
    if (response.status === 401) {
      renderProfessorReviewsLocked();
      return;
    }
    if (!response.ok) throw Error("Could not load reviews.");
    const data = await response.json();
    renderProfessorReviews(Array.isArray(data.reviews) ? data.reviews : []);
  } catch {
    renderProfessorReviewsUnavailable();
  }
}

async function submitProfessorReview(form, panel) {
    const submitButton = form.querySelector(".review-submit-button");
    const message = form.querySelector(".review-form-message");
    const formData = new FormData(form);
    const payload = {};

    formData.forEach(function (value, key) {
      payload[key] = value;
    });

    if (submitButton) {
      submitButton.disabled = true;
      submitButton.textContent = "Submitting...";
    }

    if (message) {
      message.className = "review-form-message";
      message.textContent = "";
    }

    try {
      const response = await fetch("/api/professor-reviews", {
        method: "POST",
        credentials: "same-origin",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json().catch(function () {
        return {};
      });

      if (!response.ok) {
        throw new Error(data.error || "Could not save your review. Please log in and try again.");
      }

      if (Array.isArray(data.reviews)) {
        renderProfessorReviews(data.reviews);
      } else {
        await loadProfessorReviews(payload.professorId);
      }

      if (message) {
        message.className = "review-form-message is-success";
        message.textContent = "Review submitted. Thanks for helping other students.";
      }

      window.setTimeout(function () {
        panel.dispatchEvent(
          new CustomEvent("review-request-close")
        );
      }, 900);
    } catch (error) {
      if (message) {
        message.className = "review-form-message is-error";
        message.textContent = error.message || "Could not save your review. Please try again.";
      }
    } finally {
      if (submitButton) {
        submitButton.disabled = false;
        submitButton.textContent = "Submit Review";
      }
    }
  }

  function setupReviewModalBehavior(grid) {
    const panel = grid.querySelector(".professor-review-panel");
    const form = grid.querySelector(".professor-review-form");
    const backdrop = grid.querySelector(".review-modal-backdrop");
    const reviewToggle = panel
      ? panel.querySelector(".professor-review-toggle")
      : null;
    const cancelButton = form
      ? form.querySelector(".review-cancel-button")
      : null;
    const drawerBody = form
      ? form.querySelector(".review-drawer-body")
      : null;
    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    );

    if (!panel || !form || !reviewToggle || !backdrop) {
      return;
    }

    let portalActive = false;
    let closing = false;
    let formAnimation = null;
    let backdropAnimation = null;

    populateReviewCourseSelect(form);
    setupReviewChoiceMenus(form);
    setupReviewSearchSelect(form, "course");
    setupReviewSearchSelect(form, "semester");
    setupReviewDependsField(form);
    setupReviewCompactControls(form);

    // Native select controls are visually replaced; validate them through
    // the visible controls rather than attempting focus on hidden selects.
    form.noValidate = true;

    form.addEventListener("submit", function (event) {
      event.preventDefault();

      const requiredFields = [
        form.querySelector("#review-course"),
        form.querySelector("#review-semester"),
        form.querySelector("#review-rating")
      ];
      const missingField = requiredFields.find(function (field) {
        return !field || !field.value;
      });

      if (missingField) {
        const message = form.querySelector(".review-form-message");
        if (message) {
          message.className = "review-form-message is-error";
          message.textContent =
            "Choose a course, semester and overall rating before submitting.";
        }

        const visibleControl = missingField.id === "review-rating"
          ? form.querySelector("[data-review-rating='1']")
          : missingField.id === "review-course" ||
            missingField.id === "review-semester"
            ? form.querySelector("#" + missingField.id + "-search")
            : missingField.nextElementSibling &&
              missingField.nextElementSibling.querySelector(
                ".review-choice-button"
              );
        if (visibleControl) {
          visibleControl.focus();
          visibleControl.scrollIntoView({
            block: "nearest",
            behavior: "smooth"
          });
        }
        return;
      }

      submitProfessorReview(form, panel);
    });

    function cancelAnimations() {
      if (formAnimation) {
        formAnimation.cancel();
        formAnimation = null;
      }

      if (backdropAnimation) {
        backdropAnimation.cancel();
        backdropAnimation = null;
      }
    }

    function mountReviewDrawer() {
      if (portalActive) {
        return;
      }

      document.body.appendChild(backdrop);
      document.body.appendChild(form);
      portalActive = true;
    }

    function restoreReviewDrawer() {
      if (!portalActive) {
        return;
      }

      panel.appendChild(backdrop);
      panel.appendChild(form);
      portalActive = false;
    }

    function clearOpenChoices() {
      form.querySelectorAll(".review-choice.open").forEach(
        function (choice) {
          choice.classList.remove("open");
        }
      );
    }

    function syncReviewModalLock() {
      document.body.classList.toggle(
        "review-modal-open",
        panel.open
      );

      if (panel.open) {
        mountReviewDrawer();
        return;
      }

      clearOpenChoices();
      restoreReviewDrawer();
      document.body.style.removeProperty(
        "--review-scrollbar-compensation"
      );
    }

    function focusReviewDrawer() {
      try {
        form.focus({ preventScroll: true });
      } catch (error) {
        form.focus();
      }
    }

    function openReviewModal() {
      if (panel.open || closing) {
        return;
      }

      const scrollbarWidth = Math.max(
        0,
        window.innerWidth -
          document.documentElement.clientWidth
      );

      document.body.style.setProperty(
        "--review-scrollbar-compensation",
        scrollbarWidth + "px"
      );

      panel.setAttribute("open", "");
      syncReviewModalLock();

      if (drawerBody) {
        drawerBody.scrollTop = 0;
      }

      cancelAnimations();
      if (!reducedMotion.matches) {
        formAnimation = form.animate(
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

        const openingAnimation = formAnimation;
        openingAnimation.finished.then(function () {
          if (formAnimation === openingAnimation) {
            openingAnimation.cancel();
            formAnimation = null;
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

      focusReviewDrawer();
    }

    function finishClosingReviewModal() {
      cancelAnimations();
      panel.removeAttribute("open");
      closing = false;
      syncReviewModalLock();

      try {
        reviewToggle.focus({ preventScroll: true });
      } catch (error) {
        reviewToggle.focus();
      }
    }

    function closeReviewModal() {
      if (!panel.open || closing) {
        return;
      }

      closing = true;
      clearOpenChoices();
      cancelAnimations();

      if (reducedMotion.matches) {
        finishClosingReviewModal();
        return;
      }

      formAnimation = form.animate(
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

      formAnimation.finished
        .then(finishClosingReviewModal)
        .catch(finishClosingReviewModal);
    }

    reviewToggle.addEventListener("click", function (event) {
      event.preventDefault();

      if (panel.open) {
        closeReviewModal();
      } else {
        openReviewModal();
      }
    });

    backdrop.addEventListener("click", closeReviewModal);

    if (cancelButton) {
      cancelButton.addEventListener("click", closeReviewModal);
    }

    panel.addEventListener(
      "review-request-close",
      closeReviewModal
    );
    panel.addEventListener(
      "toggle",
      syncReviewModalLock
    );

    document.addEventListener("keydown", function (event) {
      if (!panel.open || closing) {
        return;
      }

      if (event.key === "Escape") {
        event.preventDefault();
        closeReviewModal();
        return;
      }

      if (event.key !== "Tab") {
        return;
      }

      const focusable = Array.from(form.querySelectorAll(
        "button:not([disabled]), " +
        "input:not([type='hidden']):not([disabled]), " +
        "select:not([disabled]), " +
        "textarea:not([disabled]), " +
        "[tabindex]:not([tabindex='-1'])"
      )).filter(function (element) {
        return element.getClientRects().length > 0;
      });

      if (!focusable.length) {
        event.preventDefault();
        form.focus();
        return;
      }

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (!form.contains(document.activeElement)) {
        event.preventDefault();
        (event.shiftKey ? last : first).focus();
      } else if (event.shiftKey &&
        document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey &&
        document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    });

    syncReviewModalLock();
  }

  
export { setupReviewModalBehavior, loadProfessorReviews };
