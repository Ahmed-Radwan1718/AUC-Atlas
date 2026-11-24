// @ts-nocheck
// Existing AUC Atlas interaction logic retained during the TypeScript migration.
// The legacy DOM implementation is isolated so the new application uses no standalone JS files.
import { DEGREE_REQUIREMENTS } from "../../data/degree-requirements";


export function mountDegreeProgression() {
  const root = document.querySelector("#degree-requirements-root");
  if (!root || root.getAttribute("data-atlas-initialized") === "true") return;
  root.setAttribute("data-atlas-initialized", "true");

    const logoutButton = document.getElementById("degree-logout-sidebar");
    const degreePanel = document.getElementById("degree-panel");
    const degreeLoading = document.getElementById("degree-loading");
    const degreeLiveContent = document.getElementById("degree-live-content");
    const degreeMajorName = document.getElementById("degree-major-name");
    const degreeMajorCopy = document.getElementById("degree-major-copy");
    const degreeCompletedCount = document.getElementById("degree-completed-count");
    const degreeRemainingCount = document.getElementById("degree-remaining-count");
    const degreeTotalCount = document.getElementById("degree-total-count");
    const degreeProgressPercent = document.getElementById("degree-progress-percent");
    const degreeProgressBar = document.getElementById("degree-progress-bar");
    const degreeRequirementsRoot = document.getElementById("degree-requirements-root");
    const degreePlanNote = document.getElementById("degree-plan-note");
    const degreeSaveButton = document.getElementById("degree-save-progress");
    const degreeSaveMessage = document.getElementById("degree-save-message");

    let activeDegreeMajor = "";

    function escapeDegreeHtml(value) {
      return String(value || "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
    }


    function resetDegreeProgressSummary() {
      degreeCompletedCount.textContent = "0";
      degreeRemainingCount.textContent = "0";
      degreeTotalCount.textContent = "0";
      degreeProgressPercent.textContent = "0%";
      degreeProgressBar.style.width = "0%";
      degreeProgressBar.parentElement.setAttribute("aria-valuenow", "0");
    }

    function renderDegreeEmptyState(title, message) {
      degreeRequirementsRoot.innerHTML = `
        <div class="degree-empty-state">
          <h3>${escapeDegreeHtml(title)}</h3>
          <p>${escapeDegreeHtml(message)}</p>
        </div>
      `;

      degreePlanNote.hidden = true;
      degreePlanNote.textContent = "";
      resetDegreeProgressSummary();
    }

    function getDegreeItemCredits(item) {
      const creditSection = String(item || "").match(
        /\(([^()]*(?:cr\.?)[^()]*)\)\s*$/i
      );

      if (!creditSection) {
        return 0;
      }

      const creditText = creditSection[1];
      const rangeMatch = creditText.match(
        /(\d+(?:\.\d+)?)\s*-\s*(\d+(?:\.\d+)?)/
      );

      if (rangeMatch) {
        return Number(rangeMatch[2]);
      }

      const creditValues =
        creditText.match(/\d+(?:\.\d+)?/g) || [];

      return creditValues.reduce(function (total, value) {
        return total + Number(value);
      }, 0);
    }

    function formatDegreeCreditCount(value) {
      const credits = Number(value) || 0;

      return Number.isInteger(credits)
        ? String(credits)
        : credits.toFixed(1).replace(/\.0$/, "");
    }

    function renderDegreeRequirementItems(
      items,
      keyPrefix,
      creditGroup,
      creditCap
    ) {
      return (Array.isArray(items) ? items : [])
        .map(function (item, itemIndex) {
          const key =
            keyPrefix + "-" + itemIndex;
          const credits =
            getDegreeItemCredits(item);
          const courseCode = String(
            item || ""
          )
            .split(" - ")[0]
            .trim()
            .toUpperCase();
          const creditAttributes =
            creditGroup
              ? `
                    data-degree-credit-group="${escapeDegreeHtml(creditGroup)}"
                    data-degree-credit-cap="${Number(creditCap) || 0}"`
              : "";

          const raw = String(item || "");
          const creditMatch = raw.match(/\(([^()]*(?:cr\.?)[^()]*)\)\s*$/i);
          const withoutCredits = creditMatch ? raw.slice(0, creditMatch.index).trim() : raw;
          const parsed = withoutCredits.match(/^\s*([A-Z]{2,6}\s+\d{3,4}[A-Z]?)\s+-\s*(.*)$/i);
          const code = parsed ? parsed[1].toUpperCase().replace(/\s+/g, " ") : "";
          const title = parsed ? parsed[2] : withoutCredits;
          const inputId = "degree-item-" + key;
          const codeMarkup = code
            ? `<span class="degree-course-code">${escapeDegreeHtml(code)}</span>`
            : "";
          const creditLabel = creditMatch ? creditMatch[1] : "";

          return `
            <div class="degree-requirement-item">
              <input
                id="${escapeDegreeHtml(inputId)}"
                aria-label="${escapeDegreeHtml(raw)}"
                type="checkbox"
                data-degree-item="${escapeDegreeHtml(key)}"
                data-degree-credits="${credits}"
                data-degree-course-code="${escapeDegreeHtml(courseCode)}"${creditAttributes}
              >
              <div class="degree-requirement-text">
                ${codeMarkup}
                <label class="degree-course-title" for="${escapeDegreeHtml(inputId)}">${escapeDegreeHtml(title)}</label>
              </div>
              <label class="degree-course-credits" for="${escapeDegreeHtml(inputId)}">${escapeDegreeHtml(creditLabel)}</label>
            </div>
          `;
        })
        .join("");
    }

    function renderDegreeRequirementGroup(
      group,
      groupIndex
    ) {
      const items = Array.isArray(
        group.items
      )
        ? group.items
        : [];
      const subgroups = Array.isArray(
        group.subgroups
      )
        ? group.subgroups
        : [];
      const directItemsMarkup =
        items.length
          ? `
            <div class="degree-requirement-list">
              ${renderDegreeRequirementItems(
                items,
                String(groupIndex),
                group.creditGroup,
                group.creditCap
              )}
            </div>
          `
          : "";
      const subgroupMarkup =
        subgroups.length
          ? `
            <div class="degree-requirement-subgroups">
              ${subgroups.map(function (
                subgroup,
                subgroupIndex
              ) {
                return `
                  <section class="degree-requirement-subgroup">
                    <h4>${escapeDegreeHtml(subgroup.title)}</h4>

                    <div class="degree-requirement-list">
                      ${renderDegreeRequirementItems(
                        subgroup.items,
                        groupIndex +
                          "-" +
                          subgroupIndex,
                        subgroup.creditGroup ||
                          group.creditGroup,
                        subgroup.creditCap ||
                          group.creditCap
                      )}
                    </div>
                  </section>
                `;
              }).join("")}
            </div>
          `
          : "";

      const hasItems = items.length || subgroups.some(subgroup => Array.isArray(subgroup.items) && subgroup.items.length);
      const title = escapeDegreeHtml(group.title);
      const description = group.description ? `<p class="degree-group-description">${escapeDegreeHtml(group.description)}</p>` : "";
      // Keep explanatory, non-checkable requirements visible; each actual checklist expands independently.
      if (!hasItems) return `
        <article class="degree-requirement-group degree-info-group">
          <h3>${title}</h3>
          ${description}
        </article>
      `;

      return `
        <details class="degree-requirement-group" data-degree-group="${groupIndex}" ${groupIndex === 0 ? "open" : ""}>
          <summary class="degree-requirement-group-head">
            <div class="degree-group-title-row">
              <h3>${title}</h3>
              <span class="degree-group-chevron" aria-hidden="true"></span>
            </div>
            <div class="degree-group-progress-copy">
              <span class="degree-group-credit-label"></span>
              <span class="degree-group-percent"></span>
            </div>
            <div class="degree-group-track" role="progressbar" aria-label="${title} progress" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0">
              <div class="degree-group-fill"></div>
            </div>
          </summary>
          <div class="degree-group-body">
            ${description}
            ${directItemsMarkup}
            ${subgroupMarkup}
          </div>
        </details>
      `;
    }

    function showDegreeSaveMessage(message, type) {
      degreeSaveMessage.textContent = message;
      degreeSaveMessage.className =
        "degree-save-message" +
        (type ? " " + type : "");
    }

    function getCompletedDegreeKeys() {
      return Array.from(
        degreeRequirementsRoot.querySelectorAll(
          "[data-degree-item]:checked"
        )
      ).map(function (item) {
        return item.dataset.degreeItem;
      });
    }

    function updateDegreeProgress() {
      const items = Array.from(
        degreeRequirementsRoot.querySelectorAll(
          "[data-degree-item]"
        )
      );
      const creditGroups = {};
      let totalCredits = 0;
      let completedCredits = 0;

      items.forEach(function (item) {
        const requirement =
          item.closest(
            ".degree-requirement-item"
          );
        const credits = Number(
          item.dataset.degreeCredits || 0
        );
        const creditGroup = String(
          item.dataset.degreeCreditGroup ||
            ""
        );
        const courseCode = String(
          item.dataset.degreeCourseCode ||
            item.dataset.degreeItem ||
            ""
        );

        if (requirement) {
          requirement.classList.toggle(
            "is-complete",
            item.checked
          );
        }

        if (!creditGroup) {
          totalCredits += credits;

          if (item.checked) {
            completedCredits += credits;
          }

          return;
        }

        if (!creditGroups[creditGroup]) {
          creditGroups[creditGroup] = {
            cap: Number(
              item.dataset
                .degreeCreditCap || 0
            ),
            completedCourses: {}
          };
        }

        if (
          item.checked &&
          !creditGroups[creditGroup]
            .completedCourses[
              courseCode
            ]
        ) {
          creditGroups[creditGroup]
            .completedCourses[
              courseCode
            ] = credits;
        }
      });

      Object.keys(
        creditGroups
      ).forEach(function (creditGroup) {
        const group =
          creditGroups[creditGroup];
        const selectedCredits =
          Object.keys(
            group.completedCourses
          ).reduce(
            function (
              total,
              courseCode
            ) {
              return (
                total +
                Number(
                  group.completedCourses[
                    courseCode
                  ] || 0
                )
              );
            },
            0
          );
        const creditCap = Math.max(
          0,
          Number(group.cap || 0)
        );

        totalCredits += creditCap;
        group.countedCredits = Math.min(selectedCredits, creditCap);
        completedCredits += group.countedCredits;
      });

      const remainingCredits = Math.max(
        totalCredits - completedCredits,
        0
      );

      const percent = totalCredits
        ? Math.round(
            (
              completedCredits /
              totalCredits
            ) * 100
          )
        : 0;

      degreeCompletedCount.textContent =
        formatDegreeCreditCount(
          completedCredits
        );

      degreeRemainingCount.textContent =
        formatDegreeCreditCount(
          remainingCredits
        );

      degreeProgressPercent.textContent =
        percent + "%";

      degreeProgressBar.style.width =
        percent + "%";
      degreeTotalCount.textContent = formatDegreeCreditCount(totalCredits);
      degreeProgressBar.parentElement.setAttribute("aria-valuenow", String(percent));

      // A capped elective pool may span several top-level categories. Display
      // the shared pool's progress in each participating group, but count it
      // only once in the overall summary above.
      const groupElements = Array.from(degreeRequirementsRoot.querySelectorAll("[data-degree-group]"));
      const poolUsage = new Map();
      groupElements.forEach(element => {
        const pools = new Set(Array.from(element.querySelectorAll("[data-degree-credit-group]"), item => item.dataset.degreeCreditGroup));
        pools.forEach(pool => poolUsage.set(pool, (poolUsage.get(pool) || 0) + 1));
      });
      groupElements.forEach(element => {
        const groupItems = Array.from(element.querySelectorAll("[data-degree-item]"));
        const pools = new Set();
        let required = 0;
        let completed = 0;
        let shared = false;
        groupItems.forEach(item => {
          const pool = item.dataset.degreeCreditGroup;
          if (pool) { pools.add(pool); return; }
          const credits = Number(item.dataset.degreeCredits || 0);
          required += credits;
          if (item.checked) completed += credits;
        });
        pools.forEach(pool => {
          const record = creditGroups[pool];
          if (!record) return;
          required += Math.max(0, Number(record.cap || 0));
          completed += Number(record.countedCredits || 0);
          if (poolUsage.get(pool) > 1) shared = true;
        });
        // Zero-credit/reference-only groups still show checklist completion.
        const checked = groupItems.filter(item => item.checked).length;
        const groupPercent = required ? Math.round(completed / required * 100) : Math.round(checked / groupItems.length * 100);
        const creditLabel = required
          ? formatDegreeCreditCount(completed) + " / " + formatDegreeCreditCount(required) + " credits completed" + (shared ? " · includes shared elective pool" : "")
          : checked + " / " + groupItems.length + " items checked";
        element.querySelector(".degree-group-credit-label").textContent = creditLabel;
        element.querySelector(".degree-group-percent").textContent = groupPercent + "%";
        element.querySelector(".degree-group-fill").style.width = groupPercent + "%";
        element.querySelector(".degree-group-track").setAttribute("aria-valuenow", String(groupPercent));
      });
    }

    async function loadSavedDegreeProgress() {
      if (!activeDegreeMajor) {
        return;
      }

      degreeSaveButton.disabled = true;
      showDegreeSaveMessage("", "");

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

        const data = await response
          .json()
          .catch(function () {
            return {};
          });

        if (!response.ok) {
          throw new Error(
            data.error ||
            "Could not load saved progress."
          );
        }

        const savedProgress =
          data.degreeProgress;

        if (
          savedProgress &&
          savedProgress.major ===
            activeDegreeMajor
        ) {
          const completedKeys = new Set(
            Array.isArray(
              savedProgress.completedKeys
            )
              ? savedProgress.completedKeys
              : []
          );

          degreeRequirementsRoot
            .querySelectorAll(
              "[data-degree-item]"
            )
            .forEach(function (item) {
              item.checked =
                completedKeys.has(
                  item.dataset.degreeItem
                );
            });

          updateDegreeProgress();
        }
      } catch (error) {
        showDegreeSaveMessage(
          error.message ||
          "Could not load saved progress.",
          "error"
        );
      } finally {
        degreeSaveButton.disabled = false;
      }
    }

    async function saveDegreeProgress() {
      if (!activeDegreeMajor) {
        return;
      }

      degreeSaveButton.disabled = true;
      degreeSaveButton.textContent =
        "Saving...";
      showDegreeSaveMessage("", "");

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
              type: "degree",
              progress: {
                major:
                  activeDegreeMajor,
                completedKeys:
                  getCompletedDegreeKeys()
              }
            })
          }
        );

        const data = await response
          .json()
          .catch(function () {
            return {};
          });

        if (!response.ok) {
          throw new Error(
            data.error ||
            "Could not save degree progress."
          );
        }

        showDegreeSaveMessage(
          "Degree progress saved.",
          "success"
        );
      } catch (error) {
        showDegreeSaveMessage(
          error.message ||
          "Could not save degree progress.",
          "error"
        );
      } finally {
        degreeSaveButton.disabled = false;
        degreeSaveButton.textContent =
          "Save progress";
      }
    }

    function renderDegreeProgression(user) {
      const savedMajor = String(
        (user || {}).major || ""
      ).trim();

      const majorPlan =
        DEGREE_REQUIREMENTS[
          savedMajor
        ] || null;

      activeDegreeMajor = savedMajor;

      degreeMajorName.textContent =
        savedMajor ||
        "No major selected";

      degreeMajorCopy.textContent = "";
      degreeMajorCopy.hidden = true;

      if (!savedMajor) {
        degreeSaveButton.disabled = true;

        renderDegreeEmptyState(
          "No major selected",
          "Go to Account Details, choose your major, then return to this page."
        );

        return;
      }

      if (!majorPlan) {
        degreeSaveButton.disabled = true;

        renderDegreeEmptyState(
          "Requirements not found",
          "Requirements were not found for " +
            savedMajor +
            " yet."
        );

        return;
      }

      degreeRequirementsRoot.innerHTML =
        majorPlan.groups
          .map(
            renderDegreeRequirementGroup
          )
          .join("");

      degreePlanNote.hidden =
        !majorPlan.note;

      degreePlanNote.textContent =
        majorPlan.note || "";

      updateDegreeProgress();
    }

    degreeRequirementsRoot.addEventListener(
      "change",
      function () {
        updateDegreeProgress();

        showDegreeSaveMessage(
          "You have unsaved changes.",
          ""
        );
      }
    );

    degreeSaveButton.addEventListener(
      "click",
      saveDegreeProgress
    );

    async function requireSignedIn() {
      try {
        const response = await fetch("/api/me", {
          method: "GET",
          credentials: "same-origin",
          cache: "no-store",
          headers: { "Accept": "application/json" }
        });

        const data = await response.json().catch(function () {
          return {};
        });

        if (!response.ok || !data.signedIn || !data.user) {
          throw new Error("Please log in to view degree progression.");
        }

        renderDegreeProgression(data.user);
        await loadSavedDegreeProgress();
        degreeLoading.hidden = true;
        degreeLiveContent.hidden = false;
        degreePanel.setAttribute("aria-busy", "false");
      } catch (error) {
        try {
          localStorage.setItem("auc-atlas-login-redirect", "/degree-progression");
        } catch (storageError) {}

        window.location.href = "/login";
      }
    }

    logoutButton.addEventListener("click", async function () {
      await fetch("/api/logout", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({})
      }).catch(function () {});

      try {
        localStorage.removeItem("auc-atlas-signed-in");
        localStorage.removeItem("aucAtlasSignedIn");
        sessionStorage.removeItem("auc-atlas-signed-in");
        sessionStorage.removeItem("aucAtlasSignedIn");
      } catch (error) {}

      window.location.href = "/login";
    });

    requireSignedIn();
  
}
