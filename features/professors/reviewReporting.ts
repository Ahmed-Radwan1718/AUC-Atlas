// @ts-nocheck
// Preserved original AUC Atlas review-report modal interactions.
function submitProfessorReviewReport(
    button
  ) {
    const targetId =
      button.dataset.reportReview;
    const targetLabel =
      button.dataset.reportLabel ||
      "this review";

    if (!targetId) {
      return;
    }

    let modal = document.getElementById(
      "professor-review-report-modal"
    );

    if (!modal) {
      modal = document.createElement("div");
      modal.className = "course-report-modal";
      modal.id = "professor-review-report-modal";
      modal.hidden = true;
      modal.innerHTML = `
        <button
          class="course-report-backdrop"
          type="button"
          aria-label="Close report panel"
          data-close-professor-review-report
        ></button>

        <section
          class="course-report-dialog"
          role="dialog"
          aria-modal="true"
          aria-labelledby="professor-review-report-title"
        >
          <header class="course-report-header">
            <div class="course-report-header-copy">
              <p class="course-report-kicker">Content moderation</p>
              <h2 id="professor-review-report-title">Report review</h2>
              <p id="professor-review-report-copy">
                Tell us what is wrong with this review. Our moderators will review your report.
              </p>
            </div>

            <button
              class="course-report-close"
              type="button"
              aria-label="Close report panel"
              data-close-professor-review-report
            >×</button>
          </header>

          <form
            class="course-report-form"
            id="professor-review-report-form"
          >
            <label class="course-report-field">
              <span>Reason for report</span>
              <textarea
                id="professor-review-report-reason"
                name="reason"
                maxlength="1000"
                placeholder="Describe the issue with this review..."
                required
              ></textarea>
            </label>

            <p
              class="course-report-status"
              id="professor-review-report-status"
              aria-live="polite"
            ></p>

            <div class="course-report-actions">
              <button
                class="course-report-cancel"
                type="button"
                data-close-professor-review-report
              >Cancel</button>

              <button
                class="course-report-submit"
                id="professor-review-report-submit"
                type="submit"
              >Submit report</button>
            </div>
          </form>
        </section>
      `;

      document.body.appendChild(modal);
    }

    const form = document.getElementById(
      "professor-review-report-form"
    );
    const copy = document.getElementById(
      "professor-review-report-copy"
    );
    const reasonInput = document.getElementById(
      "professor-review-report-reason"
    );
    const status = document.getElementById(
      "professor-review-report-status"
    );
    const submitButton = document.getElementById(
      "professor-review-report-submit"
    );

    if (
      !form ||
      !copy ||
      !reasonInput ||
      !status ||
      !submitButton
    ) {
      return;
    }

    function closeReportPanel() {
      modal.hidden = true;
      document.body.classList.remove(
        "content-report-open"
      );
      form.reset();
      status.textContent = "";
      status.className = "course-report-status";
      submitButton.disabled = false;
      submitButton.textContent = "Submit report";

      if (
        modal.reportSourceButton &&
        !modal.reportSourceButton.disabled
      ) {
        modal.reportSourceButton.focus();
      }
    }

    if (modal.dataset.ready !== "true") {
      modal.dataset.ready = "true";

      modal
        .querySelectorAll(
          "[data-close-professor-review-report]"
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
          if (
            event.key === "Escape" &&
            !modal.hidden
          ) {
            closeReportPanel();
          }
        }
      );

      form.addEventListener(
        "submit",
        async function (event) {
          event.preventDefault();

          const activeButton =
            modal.reportSourceButton;
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
                  targetType: "review",
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

            modal.hidden = true;
            document.body.classList.remove(
              "content-report-open"
            );
            form.reset();
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

    modal.reportSourceButton = button;
    modal.reportSourceOriginalText =
      button.textContent;
    modal.dataset.targetId = targetId;

    copy.textContent =
      "Tell us what is wrong with " +
      targetLabel +
      ". Our moderators will review your report.";

    form.reset();
    status.textContent = "";
    status.className = "course-report-status";
    submitButton.disabled = false;
    submitButton.textContent = "Submit report";

    modal.hidden = false;
    document.body.classList.add(
      "content-report-open"
    );

    window.setTimeout(function () {
      reasonInput.focus();
    }, 0);
  }

  function setupProfessorReviewReports(
    list
  ) {
    if (
      !list ||
      list.dataset.reportReady ===
        "true"
    ) {
      return;
    }

    list.dataset.reportReady = "true";

    list.addEventListener(
      "click",
      function (event) {
        const button =
          event.target.closest(
            "[data-report-review]"
          );

        if (
          !button ||
          !list.contains(button)
        ) {
          return;
        }

        submitProfessorReviewReport(
          button
        );
      }
    );
  }

  
export { setupProfessorReviewReports };
