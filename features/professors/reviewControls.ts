// @ts-nocheck
import { courses } from "../../data/courses";
if (typeof window !== "undefined") window.aucAtlasCourses = courses;

function populateReviewCourseSelect(form) {
    const select = form.querySelector("#review-course");
    const courses = Array.isArray(window.aucAtlasCourses) ? window.aucAtlasCourses : [];

    if (!select || select.dataset.courseOptionsReady === "true") {
      return;
    }

    const currentValue = select.value;
    const placeholder = document.createElement("option");

    select.dataset.courseOptionsReady = "true";
    select.innerHTML = "";
    placeholder.value = "";
    placeholder.textContent = "Choose course";
    placeholder.disabled = true;
    placeholder.selected = true;
    select.appendChild(placeholder);

    courses.forEach(function (course) {
      const code = String(course && course.code ? course.code : "").trim();
      const title = String(course && course.title ? course.title : "").trim();

      if (!code) {
        return;
      }

      const option = document.createElement("option");

      option.value = code;
      option.textContent = code + (title ? " - " + title : "");
      select.appendChild(option);
    });

    if (currentValue) {
      select.value = currentValue;
    }
  }

  function setupReviewDependsField(form) {
    const select = form.querySelector("#review-recommend");
    const field = form.querySelector("[data-depends-reason]");
    const input = form.querySelector("#review-recommend-reason");

    if (!select || !field || field.dataset.dependsReady === "true") {
      return;
    }

    field.dataset.dependsReady = "true";

    function syncDependsField() {
      const shouldShow = select.value === "Depends";

      field.hidden = !shouldShow;

      if (!shouldShow && input) {
        input.value = "";
      }
    }

    select.addEventListener("change", syncDependsField);
    syncDependsField();
  }

  function setupReviewSearchSelect(form, fieldType) {
    const select = form.querySelector("#review-" + fieldType);
    const input = form.querySelector("#review-" + fieldType + "-search");
    const listbox = form.querySelector("#review-" + fieldType + "-suggestions");
    const wrapper = input && input.closest(".review-course-search-wrap");

    if (!select || !input || !listbox || !wrapper) {
      return;
    }

    // Preserve the native select as the submitted course or semester value.
    // Only display matching suggestions after an actual search query.
    const courses = Array.from(select.options)
      .filter(function (option) {
        return Boolean(option.value);
      })
      .map(function (option) {
        const code = option.value;
        const label = option.textContent.trim();
        return {
          code: code,
          label: label,
          searchText: (code + " " + label).toLowerCase()
        };
      });

    const MAX_SUGGESTIONS = 5;
    let results = [];
    let activeIndex = -1;

    function hideSuggestions() {
      listbox.hidden = true;
      listbox.replaceChildren();
      results = [];
      activeIndex = -1;
      input.setAttribute("aria-expanded", "false");
      input.removeAttribute("aria-activedescendant");
    }

    function highlightSuggestion(index) {
      if (!results.length) {
        return;
      }

      activeIndex = (index + results.length) % results.length;
      listbox.querySelectorAll("[role='option']").forEach(
        function (option, optionIndex) {
          const active = optionIndex === activeIndex;
          option.classList.toggle("is-active", active);
          option.setAttribute("aria-selected", String(active));
          if (active) {
            input.setAttribute("aria-activedescendant", option.id);
            option.scrollIntoView({ block: "nearest" });
          }
        }
      );
    }

    function selectCourse(course) {
      select.value = course.code;
      input.value = course.label;
      hideSuggestions();
      select.dispatchEvent(new Event("change", { bubbles: true }));
      input.focus();
    }

    function showSuggestions() {
      const query = input.value.toLowerCase().trim();
      if (!query) {
        hideSuggestions();
        return;
      }

      const words = query.split(/\s+/).filter(Boolean);
      const matches = courses.filter(function (course) {
        return words.every(function (word) {
          return course.searchText.includes(word);
        });
      });

      // Prioritize course-code and title-prefix matches, not dataset order.
      matches.sort(function (a, b) {
        function rank(course) {
          const code = course.code.toLowerCase();
          const label = course.label.toLowerCase();
          return code.startsWith(query) ? 0 :
            label.startsWith(query) ? 1 : 2;
        }
        return rank(a) - rank(b) ||
          a.code.localeCompare(b.code);
      });

      results = matches.slice(0, MAX_SUGGESTIONS);
      activeIndex = -1;
      listbox.replaceChildren();
      input.removeAttribute("aria-activedescendant");

      results.forEach(function (course, index) {
        const option = document.createElement("div");
        option.id = "review-" + fieldType + "-option-" + index;
        option.className = "review-course-suggestion";
        option.setAttribute("role", "option");
        option.setAttribute("aria-selected", "false");
        option.textContent = course.label;
        option.addEventListener("mousedown", function (event) {
          // Preserve keyboard focus on desktop without blocking touch taps.
          event.preventDefault();
        });
        option.addEventListener("click", function () {
          selectCourse(course);
        });
        listbox.appendChild(option);
      });

      if (!matches.length) {
        const empty = document.createElement("div");
        empty.className = "review-course-no-results";
        empty.setAttribute("role", "status");
        empty.textContent = fieldType === "course"
          ? "No matching courses"
          : "No matching semesters";
        listbox.appendChild(empty);
      } else if (matches.length > MAX_SUGGESTIONS) {
        const more = document.createElement("div");
        more.className = "review-course-more-results";
        more.textContent = "Keep typing to narrow the results";
        listbox.appendChild(more);
      }

      listbox.hidden = false;
      input.setAttribute("aria-expanded", "true");
    }

    input.addEventListener("input", function () {
      if (select.value) {
        select.value = "";
        select.dispatchEvent(new Event("change", { bubbles: true }));
      }
      showSuggestions();
    });

    input.addEventListener("keydown", function (event) {
      if (event.key === "Escape" && !listbox.hidden) {
        event.preventDefault();
        event.stopPropagation();
        hideSuggestions();
        return;
      }

      if (event.key === "Tab") {
        hideSuggestions();
        return;
      }

      if (event.key === "ArrowDown" ||
          event.key === "ArrowUp") {
        if (listbox.hidden && input.value.trim() && !select.value) {
          showSuggestions();
        }
        if (listbox.hidden || !results.length) {
          return;
        }

        event.preventDefault();
        highlightSuggestion(
          activeIndex + (event.key === "ArrowDown" ? 1 : -1)
        );
        return;
      }

      if (event.key === "Enter" && !listbox.hidden &&
          activeIndex >= 0 && results[activeIndex]) {
        event.preventDefault();
        selectCourse(results[activeIndex]);
      } else if (event.key === "Enter" && !select.value) {
        // Do not submit an unresolved free-text course query.
        event.preventDefault();
      }
    });

    document.addEventListener("pointerdown", function (event) {
      if (!wrapper.contains(event.target)) {
        hideSuggestions();
      }
    });

    select.addEventListener("change", function () {
      if (!select.value && !input.matches(":focus")) {
        input.value = "";
      }
    });

    // Retain course and semester selections when reopening the drawer.
    if (select.value) {
      const selected = courses.find(function (course) {
        return course.code === select.value;
      });
      input.value = selected ? selected.label : "";
    }
    hideSuggestions();
  }

  function setupReviewChoiceMenus(form) {
    function resetChoiceSearch(choice) {
      const searchInput = choice.querySelector(".review-choice-search");

      if (searchInput) {
        searchInput.value = "";
      }

      choice.querySelectorAll(".review-choice-option").forEach(function (optionButton) {
        optionButton.hidden = false;
      });
    }

    function closeChoices(exceptChoice) {
      form.querySelectorAll(".review-choice.open").forEach(function (choice) {
        if (choice !== exceptChoice) {
          choice.classList.remove("open");
          resetChoiceSearch(choice);
        }
      });
    }

    form.querySelectorAll("select").forEach(function (select) {
      if (select.dataset.reviewChoiceReady === "true") {
        return;
      }

      if (select.id === "review-course" ||
          select.id === "review-semester" ||
          select.id === "review-rating" ||
          select.id === "review-recommend") {
        return;
      }

      select.dataset.reviewChoiceReady = "true";
      select.classList.add("review-native-select");

      const choice = document.createElement("div");
      const button = document.createElement("button");
      const label = document.createElement("span");
      const menu = document.createElement("div");
      const isSearchable = select.id === "review-course";
      let searchInput = null;

      choice.className = "review-choice";
      button.className = "review-choice-button";
      button.type = "button";
      label.className = "review-choice-label";
      menu.className = "review-choice-menu";

      function syncLabel() {
        const selectedOption = select.options[select.selectedIndex];
        label.textContent = selectedOption ? selectedOption.textContent : "";
      }

      function syncSelectedOption() {
        menu.querySelectorAll(".review-choice-option").forEach(function (optionButton) {
          optionButton.classList.toggle("is-selected", optionButton.dataset.choiceValue === select.value);
        });
      }

      function filterChoiceOptions(query) {
        const terms = String(query || "")
          .toLowerCase()
          .trim()
          .split(/\s+/)
          .filter(Boolean);

        menu.querySelectorAll(".review-choice-option").forEach(function (optionButton) {
          const searchText = optionButton.dataset.choiceSearchText || "";
          const hasValue = Boolean(optionButton.dataset.choiceValue);
          const matches = !terms.length || (hasValue && terms.every(function (term) {
            return searchText.indexOf(term) !== -1;
          }));

          optionButton.hidden = !matches;
        });
      }

      if (isSearchable) {
        const searchWrap = document.createElement("div");

        searchInput = document.createElement("input");
        searchInput.type = "search";
        searchInput.className = "review-choice-search";
        searchInput.placeholder = "Search courses";
        searchInput.setAttribute("aria-label", "Search courses");
        searchInput.setAttribute("autocomplete", "new-password");
        searchInput.setAttribute("autocorrect", "off");
        searchInput.setAttribute("autocapitalize", "none");
        searchInput.setAttribute("spellcheck", "false");

        searchWrap.className = "review-choice-search-wrap";
        searchWrap.appendChild(searchInput);
        menu.appendChild(searchWrap);

        searchInput.addEventListener("input", function () {
          filterChoiceOptions(searchInput.value);
        });

        searchInput.addEventListener("keydown", function (event) {
          if (event.key === "Escape") {
            event.preventDefault();
            resetChoiceSearch(choice);
            choice.classList.remove("open");
          }
        });
      }

      Array.from(select.options).forEach(function (option) {
        const optionButton = document.createElement("button");

        optionButton.className = "review-choice-option";
        optionButton.type = "button";
        optionButton.disabled = option.disabled;
        optionButton.dataset.choiceValue = option.value;
        optionButton.dataset.choiceSearchText = (option.value + " " + option.textContent).toLowerCase();
        optionButton.textContent = option.textContent;
        menu.appendChild(optionButton);
      });

      button.appendChild(label);
      choice.appendChild(button);
      choice.appendChild(menu);
      select.insertAdjacentElement("afterend", choice);
      syncLabel();
      syncSelectedOption();

      button.addEventListener("click", function (event) {
        const willOpen = !choice.classList.contains("open");

        event.stopPropagation();
        closeChoices(choice);
        choice.classList.toggle("open", willOpen);

        if (willOpen && searchInput) {
          window.setTimeout(function () {
            searchInput.focus();
          }, 0);
        } else {
          resetChoiceSearch(choice);
        }
      });

      menu.addEventListener("click", function (event) {
        const optionButton = event.target.closest("[data-choice-value]");

        if (!optionButton || optionButton.disabled) {
          return;
        }

        select.value = optionButton.dataset.choiceValue;
        syncLabel();
        syncSelectedOption();
        choice.classList.remove("open");
        resetChoiceSearch(choice);
        select.dispatchEvent(new Event("change", { bubbles: true }));
      });

      select.addEventListener("change", function () {
        syncLabel();
        syncSelectedOption();
      });
    });

    form.addEventListener("click", function (event) {
      if (!event.target.closest(".review-choice")) {
        closeChoices();
      }
    });
  }

  
export function setupReviewCompactControls(form) {
    const rating = form.querySelector("#review-rating");
    const recommendation = form.querySelector("#review-recommend");

    function syncCompactControls() {
      const chosenRating = Number(rating.value || 0);

      form.querySelectorAll("[data-review-rating]").forEach(
        function (button) {
          const starValue = Number(button.dataset.reviewRating);
          button.classList.toggle(
            "is-active",
            chosenRating >= starValue
          );
          button.setAttribute(
            "aria-pressed",
            String(chosenRating === starValue)
          );
        }
      );

      form.querySelectorAll("[data-review-recommend]").forEach(
        function (button) {
          const isSelected =
            button.dataset.reviewRecommend === recommendation.value;
          button.classList.toggle("is-active", isSelected);
          button.setAttribute("aria-pressed", String(isSelected));
        }
      );
    }

    function updateAccordionCounts() {
      form.querySelectorAll("[data-review-section]").forEach(
        function (section) {
          const fields = Array.from(
            section.querySelectorAll("select")
          );
          const answered = fields.filter(function (select) {
            return Boolean(select.value);
          }).length;
          const count = section.querySelector("[data-review-count]");

          if (count) {
            count.textContent =
              answered + "/" + fields.length + " answered";
          }
        }
      );
    }

    form.querySelectorAll("[data-review-rating]").forEach(
      function (button) {
        button.addEventListener("click", function () {
          rating.value = button.dataset.reviewRating;
          rating.dispatchEvent(
            new Event("change", { bubbles: true })
          );
        });
      }
    );

    form.querySelectorAll("[data-review-recommend]").forEach(
      function (button) {
        button.addEventListener("click", function () {
          recommendation.value = button.dataset.reviewRecommend;
          recommendation.dispatchEvent(
            new Event("change", { bubbles: true })
          );
        });
      }
    );

    form.addEventListener("change", function () {
      syncCompactControls();
      updateAccordionCounts();
    });

    syncCompactControls();
    updateAccordionCounts();
  }

export { populateReviewCourseSelect, setupReviewDependsField, setupReviewSearchSelect, setupReviewChoiceMenus };
