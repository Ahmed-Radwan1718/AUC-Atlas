// @ts-nocheck
import { getMaterialFileExtension, getMaterialFileLabel, isMaterialPreviewable,
  escapeMaterialText } from "./materialHelpers";
import { setupCourseMaterialPreview } from "./materialPreviews";
import { closeMaterialChoiceMenus, formatMaterialFileSize } from "./materialUploadChoices";
function renderCourseMaterials(materials) {
    const list = document.getElementById(
      "course-materials-list"
    );
    const filterChoice = document.getElementById(
      "course-material-filter"
    );
    const filterButton = filterChoice
      ? filterChoice.querySelector(
          "[data-material-filter-button]"
        )
      : null;
    const filterOptions = filterChoice
      ? Array.from(
          filterChoice.querySelectorAll(
            "[data-material-filter-option]"
          )
        )
      : [];
    const pageSize = 6;
    let visibleCount = pageSize;
    let activeFilter =
      filterButton &&
      filterButton.dataset.materialFilterValue
        ? filterButton.dataset.materialFilterValue
        : "all";
    let sortDirection = "newest";

    if (!list) {
      return;
    }

    function setupMaterialFilterChoice(onFilterChange) {
      if (
        !filterChoice ||
        !filterButton ||
        !filterOptions.length
      ) {
        return;
      }

      function closeFilterMenu() {
        filterChoice.classList.remove("open");
        filterButton.setAttribute(
          "aria-expanded",
          "false"
        );
      }

      filterButton.onclick = function () {
        const shouldOpen =
          !filterChoice.classList.contains(
            "open"
          );

        closeMaterialChoiceMenus(filterChoice);
        filterChoice.classList.toggle(
          "open",
          shouldOpen
        );

        filterButton.setAttribute(
          "aria-expanded",
          shouldOpen ? "true" : "false"
        );
      };

      filterOptions.forEach(
        function (option) {
          option.onclick = function () {
            const nextFilter =
              option.dataset
                .materialFilterOption ||
              "all";

            activeFilter = nextFilter;
            filterButton.dataset.materialFilterValue =
              activeFilter;
            filterButton.textContent =
              option.textContent.trim();
            visibleCount = pageSize;

            filterOptions.forEach(
              function (filterOption) {
                filterOption.setAttribute(
                  "aria-selected",
                  filterOption === option
                    ? "true"
                    : "false"
                );
              }
            );

            closeFilterMenu();

            if (typeof onFilterChange === "function") {
              onFilterChange();
            }
          };
        }
      );

      filterChoice.onfocusout = function () {
        window.setTimeout(function () {
          if (
            !filterChoice.contains(
              document.activeElement
            )
          ) {
            closeFilterMenu();
          }
        }, 0);
      };

      filterChoice.onkeydown = function (event) {
        if (event.key === "Escape") {
          closeFilterMenu();
          filterButton.focus();
        }
      };
    }

    setupMaterialFilterChoice(null);

    if (!materials.length) {
      list.innerHTML =
        '<p class="course-material-status">No course files shared yet.</p>';
      return;
    }

    const materialGroups = [];
    const groupsByKey = new Map();

    materials.forEach(function (material, index) {
      const groupId = String(
        material.uploadGroupId ||
        material.id ||
        "legacy-" + index
      ).trim();
      const uploaderKey = String(
        material.uploaderUid ||
        material.uploaderDisplayName ||
        ""
      ).trim();
      const groupKey =
        groupId + "::" + uploaderKey;

      let group = groupsByKey.get(groupKey);

      if (!group) {
        group = {
          material,
          files: []
        };

        groupsByKey.set(groupKey, group);
        materialGroups.push(group);
      }

      group.files.push(material);
    });

    function getMaterialTimestamp(value) {
      const timestamp = new Date(
        value || ""
      ).getTime();

      return Number.isNaN(timestamp)
        ? 0
        : timestamp;
    }

    materialGroups.forEach(function (group) {
      group.latestTime = group.files.reduce(
        function (latestTime, fileMaterial) {
          return Math.max(
            latestTime,
            getMaterialTimestamp(
              fileMaterial.createdAt
            )
          );
        },
        0
      );
    });

    function groupMatchesFilter(group) {
      if (activeFilter === "all") {
        return true;
      }

      function normalizeMaterialFilter(value) {
        return String(value || "")
          .trim()
          .toLowerCase()
          .replace(/&/g, "and")
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-+|-+$/g, "");
      }

      const normalizedActiveFilter =
        normalizeMaterialFilter(activeFilter);
      const acceptedFilters =
        normalizedActiveFilter === "past-assignment" ||
        normalizedActiveFilter === "past-assignments"
          ? [
              "past-assignment",
              "past-assignments"
            ]
          : [normalizedActiveFilter];

      return group.files.some(function (fileMaterial) {
        const materialType =
          fileMaterial.materialType ||
          group.material.materialType ||
          "";

        return acceptedFilters.includes(
          normalizeMaterialFilter(materialType)
        );
      });
    }

    function getFileView(
      fileMaterial,
      material,
      files
    ) {
      const rawFileName =
        fileMaterial.fileName ||
        fileMaterial.title ||
        "Course material";
      const extension =
        getMaterialFileExtension(
          rawFileName,
          fileMaterial.fileType
        );
      const fileLabel =
        getMaterialFileLabel(extension);
      const fileSize =
        Number(fileMaterial.size) > 0
          ? formatMaterialFileSize(
              fileMaterial.size
            )
          : "Size unavailable";
      const rawDownloadUrl =
        fileMaterial.downloadUrl || "";
      const previewable =
        Boolean(rawDownloadUrl) &&
        isMaterialPreviewable(extension);
      const fileName =
        escapeMaterialText(rawFileName);
      const safeFileLabel =
        escapeMaterialText(fileLabel);
      const safeFileSize =
        escapeMaterialText(fileSize);
      const safeDownloadUrl =
        escapeMaterialText(
          rawDownloadUrl || "#"
        );
      const safeExtension =
        escapeMaterialText(extension);
      const safeMaterialId =
        escapeMaterialText(
          fileMaterial.id || ""
        );
      const safeMaterialLabel =
        escapeMaterialText(
          (material.title ||
            "Course material") +
          (
            files.length > 1
              ? " — " + rawFileName
              : ""
          )
        );
      const extensionLabel =
        escapeMaterialText(
          extension === "file"
            ? "FILE"
            : extension.toUpperCase()
        );

      const fileIcon =
        extension === "pdf"
          ? `
            <img
              class="course-material-file-icon-image"
              src="/pdf.png"
              alt=""
              aria-hidden="true"
            >
          `
          : ["doc", "docx"].includes(
              extension
            )
            ? `
              <img
                class="course-material-file-icon-image"
                src="/doc.png"
                alt=""
                aria-hidden="true"
              >
            `
            : ["ppt", "pptx"].includes(
                extension
              )
              ? `
                <img
                  class="course-material-file-icon-image"
                  src="/ppt.png"
                  alt=""
                  aria-hidden="true"
                >
              `
              : `
                <span
                  class="course-material-file-icon"
                  aria-hidden="true"
                >
                  <strong>${extensionLabel}</strong>
                </span>
              `;

      const previewDataAttributes = [
        'data-download-url="' +
          safeDownloadUrl +
          '"',
        'data-file-name="' +
          fileName +
          '"',
        'data-file-extension="' +
          safeExtension +
          '"',
        'data-file-label="' +
          safeFileLabel +
          '"',
        'data-file-size="' +
          safeFileSize +
          '"'
      ].join(" ");

      return {
        fileName,
        safeFileLabel,
        safeFileSize,
        safeDownloadUrl,
        safeMaterialId,
        safeMaterialLabel,
        fileIcon,
        previewable,
        previewDataAttributes,
        hasDownload:
          Boolean(rawDownloadUrl)
      };
    }

    function buildActions(fileView) {
      const downloadMarkup =
        fileView.hasDownload
          ? `
            <a
              class="course-material-compact-download"
              href="${fileView.safeDownloadUrl}"
              target="_blank"
              rel="noopener"
              aria-label="Download ${fileView.fileName}"
              title="Download"
            ></a>
          `
          : "";

      const menuMarkup =
        fileView.safeMaterialId
          ? `
            <details
              class="course-material-action-menu"
            >
              <summary
                aria-label="More actions for ${fileView.fileName}"
                title="More actions"
              >⋮</summary>

              <div
                class="course-material-action-menu-panel"
              >
                <button
                  class="course-material-report-button"
                  type="button"
                  data-report-material="${fileView.safeMaterialId}"
                  data-report-label="${fileView.safeMaterialLabel}"
                >Report</button>
              </div>
            </details>
          `
          : "";

      return downloadMarkup + menuMarkup;
    }

    function buildPreviewMain(
      fileView,
      primaryTitle,
      secondaryText,
      metadataText,
      materialType
    ) {
      const typeMarkup = materialType
        ? `
          <em>${materialType}</em>
        `
        : "";

      const secondaryMarkup =
        secondaryText
          ? `
            <span
              class="course-material-row-file-name"
            >${secondaryText}</span>
          `
          : "";

      const previewMarkup =
        fileView.previewable
          ? `
            <span
              class="course-material-preview-label"
            >Preview</span>
          `
          : "";

      const content = `
        ${fileView.fileIcon}

        <span class="course-material-row-copy">
          <span
            class="course-material-row-title-line"
          >
            <strong>${primaryTitle}</strong>
            ${typeMarkup}
          </span>

          ${secondaryMarkup}

          <small>${metadataText}</small>
        </span>

        ${previewMarkup}
      `;

      if (fileView.previewable) {
        return `
          <button
            class="course-material-row-main course-material-preview-trigger"
            type="button"
            ${fileView.previewDataAttributes}
            aria-label="Preview ${fileView.fileName}"
          >
            ${content}
          </button>
        `;
      }

      return `
        <div
          class="course-material-row-main is-disabled"
        >
          ${content}
        </div>
      `;
    }

    function buildGroupMetadata(material) {
      return [
        material.professor ||
          "Professor not listed",
        material.semester ||
          "Semester not listed",
        material.uploaderDisplayName ||
          "AUC student"
      ]
        .map(function (value) {
          return escapeMaterialText(value);
        })
        .join(" · ");
    }

    function buildSingleRow(group) {
      const material = group.material;
      const files = group.files;
      const fileView = getFileView(
        files[0],
        material,
        files
      );
      const title =
        escapeMaterialText(
          material.title ||
          "Course material"
        );
      const materialType =
        escapeMaterialText(
          material.materialType ||
          "Material"
        );
      const metadata =
        buildGroupMetadata(material) +
        " · " +
        fileView.safeFileSize;

      return `
        <article class="course-material-row">
          ${buildPreviewMain(
            fileView,
            title,
            "",
            metadata,
            materialType
          )}

          ${buildActions(fileView)}
        </article>
      `;
    }

    function buildChildRow(
      fileMaterial,
      material,
      files
    ) {
      const fileView = getFileView(
        fileMaterial,
        material,
        files
      );

      return `
        <div class="course-material-child-row">
          ${buildPreviewMain(
            fileView,
            fileView.fileName,
            "",
            fileView.safeFileLabel +
              " · " +
              fileView.safeFileSize,
            ""
          )}

          ${buildActions(fileView)}
        </div>
      `;
    }

    function buildMultiFileGroup(group) {
      const material = group.material;
      const files = group.files;
      const title =
        escapeMaterialText(
          material.title ||
          "Course material"
        );
      const materialType =
        escapeMaterialText(
          material.materialType ||
          "Material"
        );
      const hasCompleteFileSizes =
        files.every(function (fileMaterial) {
          return Number(fileMaterial.size) > 0;
        });
      const totalFileSize =
        files.reduce(
          function (total, fileMaterial) {
            return (
              total +
              Math.max(
                0,
                Number(fileMaterial.size) || 0
              )
            );
          },
          0
        );
      const groupFileSize =
        hasCompleteFileSizes
          ? formatMaterialFileSize(totalFileSize)
          : "Size unavailable";
      const metadata =
        buildGroupMetadata(material) +
        " · " +
        escapeMaterialText(groupFileSize);

      const fileRows = files
        .map(function (fileMaterial) {
          return buildChildRow(
            fileMaterial,
            material,
            files
          );
        })
        .join("");

      return `
        <details class="course-material-group">
          <summary
            class="course-material-group-summary"
          >
            <span class="course-material-folder-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                <path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
              </svg>
            </span>

            <span class="course-material-group-copy">
              <span
                class="course-material-row-title-line"
              >
                <strong>${title}</strong>
                <em>${materialType}</em>
              </span>

              <small>${metadata}</small>
            </span>

            <span class="course-material-file-count">
              ${files.length} files
            </span>

            <span
              class="course-material-group-chevron"
              aria-hidden="true"
            ></span>
          </summary>

          <div class="course-material-group-files">
            ${fileRows}
          </div>
        </details>
      `;
    }

    function setupMaterialGroupAnimations() {
      if (
        window.matchMedia(
          "(prefers-reduced-motion: reduce)"
        ).matches
      ) {
        return;
      }

      list.querySelectorAll(
        ".course-material-group"
      ).forEach(function (group) {
        if (
          group.dataset.animationReady ===
          "true"
        ) {
          return;
        }

        const summary = group.querySelector(
          ".course-material-group-summary"
        );

        if (!summary) {
          return;
        }

        group.dataset.animationReady = "true";

        summary.addEventListener(
          "click",
          function (event) {
            event.preventDefault();

            if (
              group.dataset.animating ===
              "true"
            ) {
              return;
            }

            const wasOpen = group.open;
            const startHeight =
              group.getBoundingClientRect()
                .height;

            group.dataset.animating = "true";
            group.classList.add(
              "is-animating"
            );

            if (!wasOpen) {
              group.open = true;

              const endHeight =
                group.getBoundingClientRect()
                  .height;

              const animation =
                group.animate(
                  [
                    {
                      height:
                        startHeight + "px"
                    },
                    {
                      height:
                        endHeight + "px"
                    }
                  ],
                  {
                    duration: 280,
                    easing:
                      "cubic-bezier(0.22, 1, 0.36, 1)"
                  }
                );

              animation.onfinish =
                function () {
                  group.dataset.animating =
                    "false";
                  group.classList.remove(
                    "is-animating"
                  );
                };

              return;
            }

            const endHeight =
              summary.getBoundingClientRect()
                .height + 2;

            const animation =
              group.animate(
                [
                  {
                    height:
                      startHeight + "px",
                    opacity: 1
                  },
                  {
                    height:
                      endHeight + "px",
                    opacity: 0.98
                  }
                ],
                {
                  duration: 240,
                  easing:
                    "cubic-bezier(0.4, 0, 0.2, 1)"
                }
              );

            animation.onfinish =
              function () {
                group.open = false;
                group.dataset.animating =
                  "false";
                group.classList.remove(
                  "is-animating"
                );
              };
          }
        );
      });
    }

    function renderMaterialView() {
      const filteredGroups =
        materialGroups
          .filter(groupMatchesFilter)
          .slice()
          .sort(function (
            firstGroup,
            secondGroup
          ) {
            if (sortDirection === "oldest") {
              return (
                firstGroup.latestTime -
                secondGroup.latestTime
              );
            }

            return (
              secondGroup.latestTime -
              firstGroup.latestTime
            );
          });

      if (!filteredGroups.length) {
        list.innerHTML =
          '<p class="course-material-status">No materials match this filter yet.</p>';
        return;
      }

      const visibleGroups =
        filteredGroups.slice(
          0,
          visibleCount
        );

      const rows = visibleGroups
        .map(function (group) {
          return group.files.length > 1
            ? buildMultiFileGroup(group)
            : buildSingleRow(group);
        })
        .join("");

      const remainingCount =
        filteredGroups.length -
        visibleGroups.length;

      const showMoreMarkup =
        remainingCount > 0
          ? `
            <button
              class="course-material-show-more"
              type="button"
              data-material-show-more
            >
              Show more
            </button>
          `
          : "";

      list.innerHTML =
        rows + showMoreMarkup;

      setupMaterialGroupAnimations();
    }

    let materialViewAnimationTimer = 0;

    function animateMaterialViewUpdate() {
      if (
        window.matchMedia(
          "(prefers-reduced-motion: reduce)"
        ).matches
      ) {
        renderMaterialView();
        return;
      }

      window.clearTimeout(
        materialViewAnimationTimer
      );

      list.classList.add("is-changing");

      materialViewAnimationTimer =
        window.setTimeout(
          function () {
            renderMaterialView();

            window.requestAnimationFrame(
              function () {
                window.requestAnimationFrame(
                  function () {
                    list.classList.remove(
                      "is-changing"
                    );
                  }
                );
              }
            );
          },
          140
        );
    }

    setupMaterialFilterChoice(animateMaterialViewUpdate);

    list.onclick = function (event) {
      const showMoreButton =
        event.target.closest(
          "[data-material-show-more]"
        );

      if (
        !showMoreButton ||
        !list.contains(showMoreButton)
      ) {
        return;
      }

      visibleCount += pageSize;
      animateMaterialViewUpdate();
    };

    renderMaterialView();
  }

  function setCourseMaterialsLocked(access, isLocked) {
    if (!access) {
      return;
    }

    access.classList.toggle("is-locked", isLocked);

    access.querySelectorAll(
      ".course-material-summary > :not(.course-material-access-lock), " +
      ".material-upload-panel > :not(.course-material-access-lock)"
    ).forEach(function (element) {
      element.inert = isLocked;

      if (isLocked) {
        element.setAttribute("aria-hidden", "true");
      } else {
        element.removeAttribute("aria-hidden");
      }
    });

    access.querySelectorAll(
      ".course-material-access-lock"
    ).forEach(function (lock) {
      lock.setAttribute(
        "aria-hidden",
        isLocked ? "false" : "true"
      );
    });
  }

  async function loadCourseMaterials(course) {
    const access = document.getElementById("course-materials-access");
    const list = document.getElementById("course-materials-list");
    const loading = document.getElementById("course-materials-loading");

    if (access) {
      access.hidden = false;
      setCourseMaterialsLocked(access, true);
      access.classList.add("is-loading");
      access.setAttribute("aria-busy", "true");
    }

    if (loading) {
      loading.hidden = false;
    }

    if (list) {
      list.innerHTML = '<p class="course-material-status">Loading course files...</p>';
    }

    try {
      const response = await fetch(
        "/api/course-materials?courseCode=" +
          encodeURIComponent(course.code),
        {
          credentials: "same-origin",
          cache: "no-store"
        }
      );

      if (!response.ok) {
        throw new Error("Course-material access was denied.");
      }

      const data = await response.json();

      renderCourseMaterials(
        Array.isArray(data.materials)
          ? data.materials
          : []
      );

      if (loading) {
        loading.hidden = true;
      }

      if (access) {
        access.classList.remove("is-loading");
        access.removeAttribute("aria-busy");
        setCourseMaterialsLocked(access, false);
      }
    } catch (error) {
      if (loading) {
        loading.hidden = true;
      }

      if (list) {
        list.innerHTML =
          '<p class="course-material-status">Verified account required.</p>';
      }

      if (access) {
        access.hidden = false;
        access.classList.remove("is-loading");
        access.removeAttribute("aria-busy");
        setCourseMaterialsLocked(access, true);
      }
    }
  }

  function setupCourseMaterialsAccess(course) {
    setupCourseMaterialPreview();
    loadCourseMaterials(course);
  }

  
export { setupCourseMaterialsAccess, loadCourseMaterials, renderCourseMaterials };
