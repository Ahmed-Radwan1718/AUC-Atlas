// @ts-nocheck
// Original course material helpers and content reporting flow.
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

  function getMaterialInitials(name) {
    return String(name || "AUC student")
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map(function (part) {
        return part.charAt(0).toUpperCase();
      })
      .join("") || "A";
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

  function getMaterialFileLabel(extension) {
    const labels = {
      pdf: "PDF document",
      doc: "Word document",
      docx: "Word document",
      ppt: "PowerPoint presentation",
      pptx: "PowerPoint presentation",
      xls: "Excel spreadsheet",
      xlsx: "Excel spreadsheet",
      jpg: "Image",
      jpeg: "Image",
      png: "Image",
      webp: "Image",
      gif: "Image",
      zip: "ZIP archive"
    };

    return labels[extension] ||
      extension.toUpperCase() + " file";
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

  function isMaterialPreviewable(extension) {
    return [
      "pdf",
      "doc",
      "docx",
      "ppt",
      "pptx",
      "xls",
      "xlsx",
      "jpg",
      "jpeg",
      "png",
      "webp",
      "gif"
    ].includes(extension);
  }

  function appendMaterialQueryParameter(url, name, value) {
    const separator = String(url || "").indexOf("?") === -1
      ? "?"
      : "&";

    return String(url || "") +
      separator +
      encodeURIComponent(name) +
      "=" +
      encodeURIComponent(value);
  }

  function submitContentReport(button, targetType, targetId, targetLabel) {
    const modal = document.getElementById("course-report-modal");
    if (!modal || !targetType || !targetId) return;

    const form = document.getElementById(
      "course-report-form"
    );
    const reasonInput = document.getElementById(
      "course-report-reason"
    );
    const status = document.getElementById(
      "course-report-status"
    );
    const submitButton = document.getElementById(
      "course-report-submit"
    );

    if (
      !form ||
      !reasonInput ||
      !status ||
      !submitButton
    ) {
      return;
    }

    function finishClosingReportPanel() {
      window.clearTimeout(modal.reportCloseTimer);
      modal.reportCloseTimer = null;
      modal.hidden = true;
      modal.classList.remove("is-closing");
      document.body.classList.remove("content-report-open");
      form.reset();
      status.textContent = "";
      status.className = "course-report-status";
      submitButton.disabled = false;
      submitButton.textContent = "Submit report";

      if (
        modal.reportSourceButton &&
        !modal.reportSourceButton.disabled
      ) {
        try {
          modal.reportSourceButton.focus({ preventScroll: true });
        } catch {
          modal.reportSourceButton.focus();
        }
      }
    }

    function closeReportPanel() {
      if (modal.hidden || modal.classList.contains("is-closing")) {
        return;
      }

      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        finishClosingReportPanel();
        return;
      }

      // Use a cancelable timer rather than an animation.finished promise:
      // opening a report during the exit animation must never be ignored.
      modal.classList.add("is-closing");
      window.clearTimeout(modal.reportCloseTimer);
      modal.reportCloseTimer = window.setTimeout(finishClosingReportPanel, 250);
    }

    if (modal.dataset.ready !== "true") {
      modal.dataset.ready = "true";

      modal
        .querySelectorAll(
          "[data-close-course-report]"
        )
        .forEach(function (closeButton) {
          closeButton.addEventListener(
            "click",
            closeReportPanel
          );
        });

      document.addEventListener(
        "keydown",
        function (event) {
          if (modal.hidden || modal.classList.contains("is-closing")) {
            return;
          }

          if (event.key === "Escape") {
            event.preventDefault();
            closeReportPanel();
            return;
          }

          if (event.key !== "Tab") {
            return;
          }

          const focusable = Array.from(
            modal.querySelectorAll(
              ".course-report-dialog button:not([disabled]), " +
              ".course-report-dialog textarea:not([disabled]), " +
              ".course-report-dialog [tabindex]:not([tabindex='-1'])"
            )
          ).filter(function (element) {
            return element.getClientRects().length > 0;
          });
          if (!focusable.length) {
            event.preventDefault();
            reasonInput.focus();
            return;
          }

          const first = focusable[0];
          const last = focusable[focusable.length - 1];
          const inside = modal.querySelector(".course-report-dialog")
            .contains(document.activeElement);

          if (!inside || (event.shiftKey && document.activeElement === first)) {
            event.preventDefault();
            (event.shiftKey ? last : first).focus();
          } else if (!event.shiftKey && document.activeElement === last) {
            event.preventDefault();
            first.focus();
          }
        }
      );

      form.addEventListener(
        "submit",
        async function (event) {
          event.preventDefault();

          const activeButton =
            modal.reportSourceButton;
          const activeTargetType =
            modal.dataset.targetType || "";
          const activeTargetId =
            modal.dataset.targetId || "";
          const cleanedReason =
            reasonInput.value.trim();

          if (cleanedReason.length < 3) {
            status.textContent =
              "Briefly explain why you are reporting this content.";
            status.className =
              "course-report-status error";
            reasonInput.focus();
            return;
          }

          status.textContent = "";
          status.className =
            "course-report-status";
          submitButton.disabled = true;
          submitButton.textContent =
            "Submitting...";

          if (activeButton) {
            activeButton.disabled = true;
            activeButton.textContent =
              "Reporting...";
          }

          try {
            const response = await fetch(
              "/api/content-reports",
              {
                method: "POST",
                credentials: "same-origin",
                cache: "no-store",
                headers: {
                  Accept: "application/json",
                  "Content-Type":
                    "application/json"
                },
                body: JSON.stringify({
                  targetType: activeTargetType,
                  targetId:
                    activeTargetId,
                  reason: cleanedReason
                })
              }
            );

            const data = await response
              .json()
              .catch(function () {
                return {};
              });

            if (
              response.status !== 409 &&
              !response.ok
            ) {
              throw new Error(
                data.error ||
                  "Could not submit the report."
              );
            }

            if (activeButton) {
              activeButton.textContent =
                "Reported";
              activeButton.disabled = true;
            }

            closeReportPanel();
          } catch (error) {
            status.textContent =
              error.message ||
              "Could not submit the report.";
            status.className =
              "course-report-status error";
            submitButton.disabled = false;
            submitButton.textContent =
              "Submit report";

            if (activeButton) {
              activeButton.disabled = false;
              activeButton.textContent =
                modal.reportSourceOriginalText ||
                "Report";
            }
          }
        }
      );
    }

    // Reopening during an exit cancels the pending close instead of
    // leaving the drawer hidden or stuck in its closing state.
    window.clearTimeout(modal.reportCloseTimer);
    modal.reportCloseTimer = null;
    modal.classList.remove("is-closing");

    modal.reportSourceButton = button;
    modal.reportSourceOriginalText =
      button.textContent;
    modal.dataset.targetType = targetType;
    modal.dataset.targetId = targetId;
    modal.dataset.targetLabel = String(targetLabel || "this course material");

    form.reset();
    status.textContent = "";
    status.className = "course-report-status";
    submitButton.disabled = false;
    submitButton.textContent = "Submit report";

    modal.hidden = false;
    document.body.classList.add("content-report-open");

    window.setTimeout(function () {
      if (!modal.hidden && !modal.classList.contains("is-closing")) {
        reasonInput.focus({ preventScroll: true });
      }
    }, 0);
  }

  
export { escapeMaterialText, getMaterialInitials, getMaterialFileExtension, getMaterialFileLabel,
  formatMaterialUploadDate, isMaterialPreviewable, appendMaterialQueryParameter, submitContentReport };
