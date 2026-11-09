// @ts-nocheck
import { escapeMaterialText } from "./materialHelpers";
import { setMaterialUploadStatus } from "./materialUploadForm";
function closeMaterialChoiceMenus(activeChoice) {
    document.querySelectorAll(".material-choice.open").forEach(function (choice) {
      if (choice !== activeChoice) {
        choice.classList.remove("open");

        const button = choice.querySelector(".material-choice-button");

        if (button) {
          button.setAttribute("aria-expanded", "false");
        }
      }
    });
  }

  function syncMaterialChoiceButton(choice, select) {
    const button = choice.querySelector(".material-choice-button");
    const selectedOption = select.options[select.selectedIndex];
    const professorSearch = choice.querySelector(
      ".material-professor-search-input"
    );

    if (button && selectedOption) {
      button.textContent = selectedOption.textContent;
    }

    if (professorSearch) {
      professorSearch.value = select.value && selectedOption
        ? selectedOption.textContent
        : "";
      professorSearch.setAttribute("aria-expanded", "false");
      choice.classList.remove("open");
    }

    choice.querySelectorAll(".material-choice-option").forEach(function (optionButton) {
      optionButton.setAttribute("aria-selected", optionButton.dataset.value === select.value ? "true" : "false");
    });
  }

  function syncMaterialChoiceMenus(form) {
    form.querySelectorAll("select.material-native-select").forEach(function (select) {
      const choice = select.nextElementSibling;

      if (choice && choice.classList.contains("material-choice")) {
        syncMaterialChoiceButton(choice, select);
      }
    });
  }

  function setupMaterialProfessorSearch(select) {
    const choice = document.createElement("div");
    const input = document.createElement("input");
    const menu = document.createElement("div");
    const empty = document.createElement("p");
    const options = [];
    const isSemester = select.id === "material-semester" ||
      select.dataset.materialRole === "semester";

    choice.className = "material-choice material-professor-search-choice";

    input.type = "search";
    input.className = "material-professor-search-input";
    input.placeholder = isSemester ? "Search semesters..." : "Search professors...";
    input.setAttribute("aria-label", isSemester ? "Search semesters" : "Search professors");
    input.setAttribute("aria-autocomplete", "list");
    input.setAttribute("aria-controls", select.id + "-search-results");
    input.setAttribute("aria-expanded", "false");
    input.setAttribute("autocomplete", "off");
    input.setAttribute("autocorrect", "off");
    input.setAttribute("autocapitalize", "none");
    input.setAttribute("spellcheck", "false");

    menu.className = "material-choice-menu";
    menu.id = select.id + "-search-results";
    menu.setAttribute("role", "listbox");
    menu.setAttribute("aria-label", isSemester ? "Matching semesters" : "Matching professors");

    empty.className = "material-professor-search-empty";
    empty.textContent = isSemester ? "No matching semesters." : "No matching professors.";
    empty.hidden = true;

    function closeResults(restoreSelection) {
      choice.classList.remove("open");
      input.setAttribute("aria-expanded", "false");

      if (restoreSelection && !select.value) {
        input.value = "";
      }
    }

    function selectMatchingOption(option) {
      select.value = option.value;
      select.dispatchEvent(new Event("change", { bubbles: true }));
      input.focus();
      closeResults(false);
    }

    Array.from(select.options).forEach(function (option) {
      if (!option.value) return;

      const optionButton = document.createElement("button");
      optionButton.type = "button";
      optionButton.className = "material-choice-option";
      optionButton.dataset.value = option.value;
      optionButton.textContent = option.textContent;
      optionButton.setAttribute("role", "option");
      optionButton.setAttribute("aria-selected", "false");
      optionButton.hidden = true;
      optionButton.addEventListener("click", function () {
        selectMatchingOption(option);
      });

      options.push(optionButton);
      menu.appendChild(optionButton);
    });

    menu.appendChild(empty);

    function renderMatches() {
      const terms = input.value
        .toLowerCase()
        .trim()
        .split(/\s+/)
        .filter(Boolean);
      let matchCount = 0;

      options.forEach(function (option) {
        const name = option.textContent.toLowerCase();
        const matches = terms.length > 0 &&
          terms.every(function (term) {
            return name.includes(term);
          });
        option.hidden = !matches;
        if (matches) matchCount += 1;
      });

      empty.hidden = !terms.length || matchCount > 0;

      if (!terms.length) {
        closeResults(false);
        return;
      }

      closeMaterialChoiceMenus(choice);
      choice.classList.add("open");
      input.setAttribute("aria-expanded", "true");
    }

    input.addEventListener("input", function () {
      if (input.value !== select.value) {
        select.value = "";
      }
      renderMatches();
    });

    input.addEventListener("keydown", function (event) {
      if (event.key === "Enter") {
        // Typing a search must not accidentally submit the upload form.
        event.preventDefault();
        if (choice.classList.contains("open")) {
          const firstMatch = options.find(function (option) {
            return !option.hidden;
          });
          if (firstMatch) firstMatch.click();
        }
      } else if (event.key === "Escape") {
        event.preventDefault();
        closeResults(true);
      } else if (
        event.key === "ArrowDown" &&
        choice.classList.contains("open")
      ) {
        const firstMatch = options.find(function (option) {
          return !option.hidden;
        });
        if (firstMatch) {
          event.preventDefault();
          firstMatch.focus();
        }
      }
    });

    menu.addEventListener("keydown", function (event) {
      if (event.key === "Escape") {
        event.preventDefault();
        closeResults(true);
        input.focus();
        return;
      }

      if (event.key !== "ArrowUp" && event.key !== "ArrowDown") {
        return;
      }

      const visibleOptions = options.filter(function (option) {
        return !option.hidden;
      });
      const activeIndex = visibleOptions.indexOf(document.activeElement);
      const nextIndex = activeIndex + (event.key === "ArrowDown" ? 1 : -1);

      event.preventDefault();

      if (nextIndex < 0) {
        input.focus();
      } else if (nextIndex < visibleOptions.length) {
        visibleOptions[nextIndex].focus();
      }
    });

    choice.addEventListener("focusout", function () {
      window.setTimeout(function () {
        if (!choice.contains(document.activeElement)) {
          closeResults(true);
        }
      }, 0);
    });

    document.addEventListener("click", function (event) {
      if (!choice.contains(event.target)) {
        closeResults(true);
      }
    });

    select.addEventListener("change", function () {
      syncMaterialChoiceButton(choice, select);
    });

    choice.appendChild(input);
    choice.appendChild(menu);
    select.insertAdjacentElement("afterend", choice);
    syncMaterialChoiceButton(choice, select);
  }

  function setupMaterialChoiceMenus(form) {
    form.querySelectorAll("select.material-native-select").forEach(function (select) {
      if (select.dataset.choiceReady === "true") {
        return;
      }

      select.dataset.choiceReady = "true";

      if (
        select.id === "material-professor" ||
        select.dataset.materialRole === "professor" ||
        select.id === "material-semester" ||
        select.dataset.materialRole === "semester"
      ) {
        setupMaterialProfessorSearch(select);
        return;
      }

      const choice = document.createElement("div");
      const button = document.createElement("button");
      const menu = document.createElement("div");
      const searchPlaceholder = String(
        select.dataset.materialSearchPlaceholder || ""
      ).trim();
      const isSearchableSelect =
        Boolean(searchPlaceholder) ||
        select.id === "material-professor" ||
        select.dataset.materialRole === "professor";
      let searchInput = null;

      choice.className = "material-choice";
      button.type = "button";
      button.className = "material-choice-button";
      button.setAttribute("aria-haspopup", "listbox");
      button.setAttribute("aria-expanded", "false");
      menu.className = "material-choice-menu";
      menu.setAttribute("role", "listbox");

      function filterChoiceOptions(query) {
        const terms = String(query || "")
          .toLowerCase()
          .trim()
          .split(/\s+/)
          .filter(Boolean);

        menu.querySelectorAll(".material-choice-option").forEach(function (optionButton) {
          const optionText = optionButton.textContent.toLowerCase();
          const hasValue = Boolean(optionButton.dataset.value);
          const matches = !terms.length || (hasValue && terms.every(function (term) {
            return optionText.indexOf(term) !== -1;
          }));

          optionButton.hidden = !matches;
        });
      }

      function clearChoiceSearch() {
        if (searchInput) {
          searchInput.value = "";
          filterChoiceOptions("");
        }
      }

      if (isSearchableSelect) {
        const searchWrap = document.createElement("div");
        const resolvedSearchPlaceholder =
          searchPlaceholder || "Search professors";

        searchInput = document.createElement("input");
        searchInput.type = "search";
        searchInput.className = "material-choice-search";
        searchInput.placeholder =
          resolvedSearchPlaceholder;
        searchInput.setAttribute(
          "aria-label",
          resolvedSearchPlaceholder
        );
        searchInput.setAttribute("autocomplete", "new-password");
        searchInput.setAttribute("autocorrect", "off");
        searchInput.setAttribute("autocapitalize", "none");
        searchInput.setAttribute("spellcheck", "false");
        searchInput.setAttribute("data-lpignore", "true");
        searchInput.setAttribute("data-form-type", "other");

        searchWrap.className = "material-choice-search-wrap";
        searchWrap.appendChild(searchInput);
        menu.appendChild(searchWrap);

        searchInput.addEventListener("input", function () {
          filterChoiceOptions(searchInput.value);
        });

        searchInput.addEventListener("keydown", function (event) {
          if (event.key === "Escape") {
            event.preventDefault();
            clearChoiceSearch();
            searchInput.blur();
          }
        });
      }

      Array.from(select.options).forEach(function (option) {
        const optionButton = document.createElement("button");

        optionButton.type = "button";
        optionButton.className = "material-choice-option";
        optionButton.dataset.value = option.value;
        optionButton.textContent = option.textContent;
        optionButton.setAttribute("role", "option");

        optionButton.addEventListener("click", function () {
          select.value = option.value;
          select.dispatchEvent(new Event("change", { bubbles: true }));
          choice.classList.remove("open");
          button.setAttribute("aria-expanded", "false");
          clearChoiceSearch();
          syncMaterialChoiceButton(choice, select);
        });

        menu.appendChild(optionButton);
      });

      button.addEventListener("click", function () {
        const willOpen = !choice.classList.contains("open");

        closeMaterialChoiceMenus(choice);
        choice.classList.toggle("open", willOpen);
        button.setAttribute("aria-expanded", willOpen ? "true" : "false");

        if (willOpen && searchInput) {
          window.setTimeout(function () {
            searchInput.focus();
          }, 0);
        } else {
          clearChoiceSearch();
        }
      });

      document.addEventListener("click", function (event) {
        if (!choice.contains(event.target)) {
          choice.classList.remove("open");
          button.setAttribute("aria-expanded", "false");
          clearChoiceSearch();
        }
      });

      select.addEventListener("change", function () {
        syncMaterialChoiceButton(choice, select);
      });

      choice.appendChild(button);
      choice.appendChild(menu);
      select.insertAdjacentElement("afterend", choice);
      syncMaterialChoiceButton(choice, select);
    });
  }

  function formatMaterialFileSize(fileSize) {
    const bytes = Number(fileSize) || 0;

    if (bytes >= 1024 * 1024) {
      const megabytes = bytes / (1024 * 1024);
      return megabytes.toFixed(megabytes >= 10 ? 0 : 1) + " MB";
    }

    return Math.max(1, Math.round(bytes / 1024)) + " KB";
  }

  function setMaterialFileSelection(form, files) {
    const selection = form.querySelector(
      '[data-material-role="file-selection"], #material-file-selection'
    );
    const fileInput = form.querySelector(
      '[data-material-role="file"], #material-file'
    );
    const selectedFiles = Array.from(files || []);

    if (fileInput) {
      fileInput.materialSelectedFiles = selectedFiles;
    }

    if (!selection) {
      return;
    }

    selection.hidden = !selectedFiles.length;
    selection.classList.remove("is-uploading");
    selection.removeAttribute("aria-busy");

    if (!selectedFiles.length) {
      selection.innerHTML = "";
      return;
    }

    selection.innerHTML = `
      <div class="material-file-list">
        ${selectedFiles.map(function (file, index) {
          return `
            <div class="material-file-item">
              <span class="material-file-item-copy">
                <strong>${escapeMaterialText(file.name)}</strong>
                <span class="material-file-size">${formatMaterialFileSize(file.size)}</span>
              </span>
              <span class="material-file-item-status">
                <span class="material-file-upload-spinner" aria-hidden="true"></span>
                <button
                  class="material-file-remove"
                  type="button"
                  data-remove-material-file="${index}"
                  aria-label="Remove ${escapeMaterialText(file.name)}"
                  title="Remove file"
                >×</button>
              </span>
            </div>
          `;
        }).join("")}
      </div>
    `;
  }

  function setMaterialFileUploadState(form, isUploading) {
    const selection = form.querySelector(
      '[data-material-role="file-selection"], #material-file-selection'
    );
    const fileInput = form.querySelector(
      '[data-material-role="file"], #material-file'
    );

    if (fileInput) {
      fileInput.disabled = isUploading;
    }

    if (!selection) {
      return;
    }

    selection.classList.toggle("is-uploading", isUploading);
    selection.setAttribute("aria-busy", isUploading ? "true" : "false");
  }

  function setupMaterialFilePicker(form) {
    const fileInput = form.querySelector(
      '[data-material-role="file"], #material-file'
    );
    const selection = form.querySelector(
      '[data-material-role="file-selection"], #material-file-selection'
    );

    if (!fileInput || fileInput.dataset.fileReady === "true") {
      return;
    }

    fileInput.dataset.fileReady = "true";
    fileInput.materialSelectedFiles = [];

    function applySelectedFiles(files) {
      const transfer = new DataTransfer();

      files.forEach(function (file) {
        transfer.items.add(file);
      });

      fileInput.files = transfer.files;
      setMaterialFileSelection(form, fileInput.files);
    }

    function addSelectedFiles(newFiles) {
      const existingFiles = Array.isArray(fileInput.materialSelectedFiles)
        ? fileInput.materialSelectedFiles
        : [];
      const seenFiles = new Set();
      const mergedFiles = existingFiles.concat(newFiles).filter(function (file) {
        const fileKey = [file.name, file.size, file.lastModified].join("::");
        if (seenFiles.has(fileKey)) {
          return false;
        }
        seenFiles.add(fileKey);
        return true;
      });

      applySelectedFiles(mergedFiles);
    }

    fileInput.addEventListener("change", function () {
      addSelectedFiles(Array.from(fileInput.files || []));
    });

    if (selection) {
      selection.addEventListener("click", function (event) {
        const removeButton = event.target.closest("[data-remove-material-file]");
        if (!removeButton || fileInput.disabled) {
          return;
        }

        event.preventDefault();
        const removeIndex = Number(removeButton.dataset.removeMaterialFile);
        const currentFiles = fileInput.materialSelectedFiles || [];
        if (!Number.isInteger(removeIndex) || removeIndex < 0 || removeIndex >= currentFiles.length) {
          return;
        }

        applySelectedFiles(currentFiles.filter(function (file, index) {
          return index !== removeIndex;
        }));
      });
    }

    const fileField = fileInput.closest(".material-file-field");
    if (fileField) {
      let dragDepth = 0;
      function hasDraggedFiles(event) {
        return Boolean(
          event.dataTransfer &&
          Array.from(event.dataTransfer.types || []).includes("Files")
        );
      }

      fileField.addEventListener("dragenter", function (event) {
        if (!hasDraggedFiles(event) || fileInput.disabled) return;
        event.preventDefault();
        dragDepth += 1;
        fileField.classList.add("is-drag-over");
      });

      fileField.addEventListener("dragover", function (event) {
        if (!hasDraggedFiles(event) || fileInput.disabled) return;
        event.preventDefault();
        event.dataTransfer.dropEffect = "copy";
        fileField.classList.add("is-drag-over");
      });

      fileField.addEventListener("dragleave", function (event) {
        if (!hasDraggedFiles(event)) return;
        dragDepth = Math.max(0, dragDepth - 1);
        if (dragDepth === 0) {
          fileField.classList.remove("is-drag-over");
        }
      });

      fileField.addEventListener("drop", function (event) {
        if (!hasDraggedFiles(event)) return;
        event.preventDefault();
        dragDepth = 0;
        fileField.classList.remove("is-drag-over");
        if (fileInput.disabled) return;

        const allowedExtensions = fileInput.accept.toLowerCase().split(",").map(function (ext) {
          return ext.trim();
        });
        const incomingFiles = Array.from(event.dataTransfer.files || []);
        const acceptedFiles = incomingFiles.filter(function (file) {
          const ext = "." + file.name.split(".").pop().toLowerCase();
          return allowedExtensions.includes(ext);
        });
        if (acceptedFiles.length) {
          addSelectedFiles(acceptedFiles);
        }
        if (acceptedFiles.length !== incomingFiles.length) {
          setMaterialUploadStatus(
            "Only PDF, Word, PowerPoint, Excel, JPG and PNG files can be uploaded.",
            "error",
            form
          );
        }
      });
    }
  }

  
export { closeMaterialChoiceMenus, syncMaterialChoiceMenus, setupMaterialChoiceMenus,
  setMaterialFileSelection, setupMaterialFilePicker, setMaterialFileUploadState, formatMaterialFileSize };
