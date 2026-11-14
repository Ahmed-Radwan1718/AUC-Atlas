// @ts-nocheck
// Original AUC Atlas administrator interaction runtime, scoped to a Next.js client mount.
// Preserved for feature and animation parity while the UI is gradually typed.
export function initializeAdmin() {
  const ADMIN_ACCESS_STORAGE_KEY =
    "auc-atlas-admin-access";

  function clearStoredAdminAccess() {
    try {
      window.sessionStorage.removeItem(
        ADMIN_ACCESS_STORAGE_KEY
      );
    } catch (error) {}
  }

  function readStoredAdminAccess() {
    try {
      const storedAccess = JSON.parse(
        window.sessionStorage.getItem(
          ADMIN_ACCESS_STORAGE_KEY
        ) || "{}"
      );
      const token = String(
        storedAccess.token || ""
      );
      const expiresAt = String(
        storedAccess.expiresAt || ""
      );
      const expiresAtTime =
        new Date(expiresAt).getTime();

      if (
        !/^[a-f0-9]{64}$/i.test(token) ||
        !Number.isFinite(expiresAtTime) ||
        expiresAtTime <= Date.now()
      ) {
        clearStoredAdminAccess();

        return {
          token: "",
          expiresAt: ""
        };
      }

      return {
        token,
        expiresAt
      };
    } catch (error) {
      clearStoredAdminAccess();

      return {
        token: "",
        expiresAt: ""
      };
    }
  }

  function storeAdminAccess(
    token,
    expiresAt
  ) {
    try {
      window.sessionStorage.setItem(
        ADMIN_ACCESS_STORAGE_KEY,
        JSON.stringify({
          token: String(token || ""),
          expiresAt: String(
            expiresAt || ""
          )
        })
      );
    } catch (error) {}
  }

  const storedAdminAccess =
    readStoredAdminAccess();

  const state = {
    dashboard: null,
    activePanel: "users",
    busy: false,
    authenticationBusy: false,
    requiresTwoFactor: false,
    adminChallengeToken: "",
    adminAccessToken:
      storedAdminAccess.token,
    adminAccessExpiresAt:
      storedAdminAccess.expiresAt
  };

  // Cache loaded panels within this session; retain full-list search and pagination.
  const loadedSections = new Set();
  const sectionRequests = new Map();

  const loadingState =
    document.getElementById(
      "admin-loading"
    );
  const authState =
    document.getElementById(
      "admin-auth"
    );
  const authForm =
    document.getElementById(
      "admin-auth-form"
    );
  const authPasswordInput =
    document.getElementById(
      "admin-auth-password"
    );
  const authSubmitButton =
    document.getElementById(
      "admin-auth-submit"
    );
  const authMessage =
    document.getElementById(
      "admin-auth-message"
    );
  const twoFactorPanel =
    document.getElementById(
      "admin-two-factor-panel"
    );
  const twoFactorForm =
    document.getElementById(
      "admin-two-factor-form"
    );
  const twoFactorCodeInputs =
    Array.from(
      document.querySelectorAll(
        "[data-admin-two-factor-input]"
      )
    );
  const twoFactorSubmit =
    document.getElementById(
      "admin-two-factor-submit"
    );
  const twoFactorCancel =
    document.getElementById(
      "admin-two-factor-cancel"
    );
  const twoFactorMessage =
    document.getElementById(
      "admin-two-factor-message"
    );
  const deniedState =
    document.getElementById(
      "admin-denied"
    );
  const deniedMessage =
    document.getElementById(
      "admin-denied-message"
    );
  const app =
    document.getElementById(
      "admin-app"
    );
  const navButtons = Array.from(
    document.querySelectorAll(
      "[data-admin-panel]"
    )
  );
  const panels = Array.from(
    document.querySelectorAll(
      ".admin-panel"
    )
  );
  const auditList =
    document.getElementById(
      "admin-audit-list"
    );
  const reportList =
    document.getElementById(
      "admin-report-list"
    );
  const reviewList =
    document.getElementById(
      "admin-review-list"
    );
  const materialList =
    document.getElementById(
      "admin-material-list"
    );
  const reviewPagination =
    document.getElementById("admin-review-pagination");
  const reviewPageInfo =
    document.getElementById("admin-review-page-info");
  const reviewPrev =
    document.getElementById("admin-review-prev");
  const reviewNext =
    document.getElementById("admin-review-next");
  const materialPagination =
    document.getElementById("admin-material-pagination");
  const materialPageInfo =
    document.getElementById("admin-material-page-info");
  const materialPrev =
    document.getElementById("admin-material-prev");
  const materialNext =
    document.getElementById("admin-material-next");
  const reportSearch =
    document.getElementById(
      "admin-report-search"
    );
  const reviewSearch =
    document.getElementById(
      "admin-review-search"
    );
  const materialSearch =
    document.getElementById(
      "admin-material-search"
    );
  const userSearch =
    document.getElementById(
      "admin-user-search"
    );
  const userList =
    document.getElementById(
      "admin-user-list"
    );
  const usersPanel =
    document.getElementById("admin-panel-users");
  const userCount =
    document.getElementById("admin-user-count");
  const userPagination =
    document.getElementById("admin-user-pagination");
  const userPageInfo =
    document.getElementById("admin-user-page-info");
  const userPrev =
    document.getElementById("admin-user-prev");
  const userNext =
    document.getElementById("admin-user-next");
  const userPageSize = 25;
  const reviewPageSize = 25;
  const materialPageSize = 25;
  let userPage = 1;
  let reviewPage = 1;
  let materialPage = 1;
  let selectedUserUid = "";
  let userStatusFilter = "all";
  let savedPageOverflow = "";
  const userFilterButtons = Array.from(document.querySelectorAll("[data-user-filter]"));
  const userSort = document.getElementById("admin-user-sort");
  const userDrawerLayer = document.getElementById("admin-user-drawer-layer");
  const userDrawer = document.getElementById("admin-user-drawer");
  const userDrawerContent = document.getElementById("admin-user-drawer-content");
  const siteStats = document.querySelector(".admin-stats");
  const toast =
    document.getElementById(
      "admin-toast"
    );

  let toastTimer = 0;

  function escapeHtml(value) {
    return String(value || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function normalizeSearch(value) {
    return String(value || "").trim().toLowerCase();
  }

  function normalizeProfessorKey(value) {
    return normalizeSearch(value).replace(/\s+/g, " ");
  }

  // The public professor catalog is loaded before admin.js.
  const professorById = new Map();
  const professorByName = new Map();
  (Array.isArray(window.aucAtlasProfessors) ? window.aucAtlasProfessors : [])
    .forEach(function (professor) {
      if (professor && professor.id) {
        professorById.set(normalizeProfessorKey(professor.id), professor);
      }
      if (professor && professor.name) {
        professorByName.set(normalizeProfessorKey(professor.name), professor);
      }
    });

  function getReviewProfessorPhoto(review) {
    const id = normalizeProfessorKey(review.professorId);
    const name = normalizeProfessorKey(review.professorName);
    const professor = (id && professorById.get(id)) || professorByName.get(name);
    const photo = String((professor && professor.image) || "").trim();
    return photo && photo !== "user.png" ? photo : "";
  }

  function getProfessorInitials(name) {
    return String(name || "").trim().split(/\s+/).filter(Boolean)
      .slice(0, 2).map(function (part) {
        return part.charAt(0).toUpperCase();
      }).join("") || "?";
  }

  function formatDate(value) {
    if (!value) {
      return "Date unavailable";
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return "Date unavailable";
    }

    return date.toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit"
    });
  }

  function showToast(message) {
    window.clearTimeout(toastTimer);
    toast.textContent = message;
    toast.hidden = false;
    toastTimer = window.setTimeout(function () {
      toast.hidden = true;
    }, 3200);
  }

  function setMessage(
    element,
    message,
    type
  ) {
    element.textContent = message || "";
    element.classList.remove(
      "error",
      "success"
    );

    if (type) {
      element.classList.add(type);
    }
  }

  function clearTwoFactorCodeInputs() {
    twoFactorCodeInputs.forEach(
      function (input) {
        input.value = "";
      }
    );
  }

  function getTwoFactorCodeValue() {
    return twoFactorCodeInputs
      .map(function (input) {
        return input.value.trim();
      })
      .join("");
  }

  function focusFirstTwoFactorInput() {
    if (twoFactorCodeInputs[0]) {
      twoFactorCodeInputs[0].focus();
    }
  }

  function closeTwoFactorPanel() {
    twoFactorPanel.hidden = true;
    clearTwoFactorCodeInputs();

    twoFactorSubmit.disabled = false;
    twoFactorSubmit.textContent =
      "Verify Code";

    setMessage(
      twoFactorMessage,
      "",
      ""
    );
  }

  function openTwoFactorPanel() {
    clearTwoFactorCodeInputs();

    setMessage(
      authMessage,
      "",
      ""
    );
    setMessage(
      twoFactorMessage,
      "",
      ""
    );

    twoFactorPanel.hidden = false;
    twoFactorSubmit.disabled = false;
    twoFactorSubmit.textContent =
      "Verify Code";

    window.setTimeout(
      focusFirstTwoFactorInput,
      50
    );
  }

  function showDenied(message) {
    state.adminChallengeToken = "";
    state.adminAccessToken = "";
    state.adminAccessExpiresAt = "";
    clearStoredAdminAccess();

    closeTwoFactorPanel();

    loadingState.hidden = true;
    authState.hidden = true;
    app.hidden = true;
    deniedState.hidden = false;
    deniedMessage.textContent =
      message ||
      "Administrator access could not be verified.";
  }

  function showAuthenticationGate(
    message
  ) {
    state.adminChallengeToken = "";
    state.adminAccessToken = "";
    state.adminAccessExpiresAt = "";
    clearStoredAdminAccess();

    closeTwoFactorPanel();

    loadingState.hidden = true;
    deniedState.hidden = true;
    app.hidden = true;
    authState.hidden = false;

    authPasswordInput.value = "";

    setMessage(
      authMessage,
      message || "",
      message ? "error" : ""
    );

    window.requestAnimationFrame(
      function () {
        authPasswordInput.focus();
      }
    );
  }

  async function requestJson(
    url,
    options
  ) {
    const settings = options || {};
    const headers = Object.assign(
      {
        Accept: "application/json"
      },
      settings.headers || {}
    );

    if (state.adminAccessToken) {
      headers["X-AUC-Admin-Access"] =
        state.adminAccessToken;
    }

    const response = await fetch(
      url,
      Object.assign(
        {},
        settings,
        {
          credentials: "same-origin",
          cache: "no-store",
          headers
        }
      )
    );
    const data = await response
      .json()
      .catch(function () {
        return {};
      });

    if (!response.ok) {
      const error = new Error(
        data.error ||
        "The request could not be completed."
      );

      error.status = response.status;
      error.code = data.code || "";
      error.requiresTwoFactor =
        Boolean(
          data.requiresTwoFactor
        );

      if (
        error.code ===
          "admin-fresh-auth-required" &&
        state.adminAccessToken
      ) {
        showAuthenticationGate(
          error.message
        );
      }

      throw error;
    }

    return data;
  }

  async function prepareAdminAuthentication(
    message
  ) {
    loadingState.hidden = false;
    authState.hidden = true;
    deniedState.hidden = true;
    app.hidden = true;

    if (state.adminAccessToken) {
      await loadDashboard();
      return;
    }

    try {
      const data = await requestJson(
        "/api/admin",
        {
          method: "POST",
          headers: {
            Accept: "application/json",
            "Content-Type":
              "application/json"
          },
          body: JSON.stringify({
            action:
              "getAuthenticationRequirements"
          })
        }
      );

      state.requiresTwoFactor =
        Boolean(
          data.requiresTwoFactor
        );

      showAuthenticationGate(
        message || ""
      );
    } catch (error) {
      showDenied(
        error.message ||
        "Administrator access could not be verified."
      );
    }
  }

  async function postAction(payload) {
    return requestJson("/api/admin", {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type":
          "application/json"
      },
      body: JSON.stringify(
        payload || {}
      )
    });
  }

  function switchPanel(panelName) {
    if (!["users", "reports", "reviews", "materials"].includes(panelName)) return;
    state.activePanel = panelName;
    if (panelName !== "users") closeUserDrawer({ restoreFocus: false });
    if (siteStats) siteStats.hidden = panelName === "users";

    navButtons.forEach(function (button) {
      button.classList.toggle(
        "active",
        button.dataset.adminPanel ===
          panelName
      );
    });

    panels.forEach(function (panel) {
      panel.classList.toggle(
        "active",
        panel.id ===
          "admin-panel-" + panelName
      );
    });

    if (state.dashboard && !loadedSections.has(panelName) &&
        !sectionRequests.has(panelName)) {
      const target = {
        users: userList, reports: reportList,
        reviews: reviewList, materials: materialList
      }[panelName];
      if (target) target.innerHTML = '<div class="admin-empty">Loading...</div>';
      void loadDashboard({ section: panelName });
    }
  }

  async function completeAdminAuthentication(
    data
  ) {
    const accessToken = String(
      data.adminAccessToken || ""
    );

    if (
      !/^[a-f0-9]{64}$/i.test(
        accessToken
      )
    ) {
      throw new Error(
        "Administrator access could not be created."
      );
    }

    state.adminChallengeToken = "";
    state.adminAccessToken =
      accessToken;
    state.adminAccessExpiresAt =
      String(
        data.adminAccessExpiresAt ||
        ""
      );
    state.requiresTwoFactor =
      Boolean(
        data.requiresTwoFactor
      );

    storeAdminAccess(
      state.adminAccessToken,
      state.adminAccessExpiresAt
    );
    // New credentials must never inherit data from a previous admin session.
    state.dashboard = null;
    loadedSections.clear();

    authPasswordInput.value = "";
    closeTwoFactorPanel();

    authState.hidden = true;
    loadingState.hidden = false;

    await loadDashboard();
  }

  authForm.addEventListener(
    "submit",
    async function (event) {
      event.preventDefault();

      if (state.authenticationBusy) {
        return;
      }

      const password =
        authPasswordInput.value;

      if (!password) {
        setMessage(
          authMessage,
          "Enter your administrator account password.",
          "error"
        );
        authPasswordInput.focus();
        return;
      }

      state.authenticationBusy = true;

      const originalText =
        authSubmitButton.textContent;

      authSubmitButton.disabled = true;
      authSubmitButton.textContent =
        "Checking password...";

      setMessage(
        authMessage,
        "Verifying administrator password...",
        ""
      );

      try {
        const data = await requestJson(
          "/api/admin",
          {
            method: "POST",
            headers: {
              Accept:
                "application/json",
              "Content-Type":
                "application/json"
            },
            body: JSON.stringify({
              action:
                "authenticateAdminPassword",
              password
            })
          }
        );

        authPasswordInput.value = "";

        if (data.requiresTwoFactor) {
          const challengeToken =
            String(
              data.adminChallengeToken ||
              ""
            );

          if (
            !/^[a-f0-9]{64}$/i.test(
              challengeToken
            )
          ) {
            throw new Error(
              "Authenticator verification could not be started."
            );
          }

          state.requiresTwoFactor = true;
          state.adminChallengeToken =
            challengeToken;

          openTwoFactorPanel();
          return;
        }

        await completeAdminAuthentication(
          data
        );
      } catch (error) {
        setMessage(
          authMessage,
          error.message ||
          "Administrator authentication failed.",
          "error"
        );

        authPasswordInput.focus();
      } finally {
        state.authenticationBusy = false;
        authSubmitButton.disabled = false;
        authSubmitButton.textContent =
          originalText;
      }
    }
  );

  twoFactorCodeInputs.forEach(
    function (input, index) {
      input.addEventListener(
        "input",
        function () {
          input.value = input.value
            .replace(/\D/g, "")
            .slice(0, 1);

          if (
            input.value &&
            twoFactorCodeInputs[
              index + 1
            ]
          ) {
            twoFactorCodeInputs[
              index + 1
            ].focus();
          }
        }
      );

      input.addEventListener(
        "keydown",
        function (event) {
          if (
            event.key === "Backspace" &&
            !input.value &&
            twoFactorCodeInputs[
              index - 1
            ]
          ) {
            twoFactorCodeInputs[
              index - 1
            ].focus();
          }
        }
      );

      input.addEventListener(
        "paste",
        function (event) {
          const pastedCode =
            event.clipboardData
              .getData("text")
              .replace(/\D/g, "")
              .slice(0, 6);

          if (!pastedCode) {
            return;
          }

          event.preventDefault();

          twoFactorCodeInputs.forEach(
            function (
              codeInput,
              codeIndex
            ) {
              codeInput.value =
                pastedCode.charAt(
                  codeIndex
                ) || "";
            }
          );

          const focusIndex =
            Math.min(
              pastedCode.length,
              twoFactorCodeInputs.length
            ) - 1;

          if (
            twoFactorCodeInputs[
              focusIndex
            ]
          ) {
            twoFactorCodeInputs[
              focusIndex
            ].focus();
          }
        }
      );
    }
  );

  twoFactorForm.addEventListener(
    "submit",
    async function (event) {
      event.preventDefault();

      if (state.authenticationBusy) {
        return;
      }

      const authenticatorCode =
        getTwoFactorCodeValue();

      if (
        !/^\d{6}$/.test(
          authenticatorCode
        )
      ) {
        setMessage(
          twoFactorMessage,
          "Enter your 6-digit authenticator code.",
          "error"
        );
        focusFirstTwoFactorInput();
        return;
      }

      if (
        !/^[a-f0-9]{64}$/i.test(
          state.adminChallengeToken
        )
      ) {
        showAuthenticationGate(
          "Administrator verification expired. Enter your password again."
        );
        return;
      }

      state.authenticationBusy = true;
      twoFactorSubmit.disabled = true;
      twoFactorSubmit.textContent =
        "Verifying...";

      setMessage(
        twoFactorMessage,
        "",
        ""
      );

      try {
        const data = await requestJson(
          "/api/admin",
          {
            method: "POST",
            headers: {
              Accept:
                "application/json",
              "Content-Type":
                "application/json"
            },
            body: JSON.stringify({
              action:
                "verifyAdminAuthenticator",
              adminChallengeToken:
                state.adminChallengeToken,
              authenticatorCode
            })
          }
        );

        await completeAdminAuthentication(
          data
        );
      } catch (error) {
        if (
          error.code ===
          "admin-auth-challenge-invalid"
        ) {
          showAuthenticationGate(
            error.message ||
            "Administrator verification expired. Enter your password again."
          );
          return;
        }

        setMessage(
          twoFactorMessage,
          error.message ||
          "The authenticator code is incorrect.",
          "error"
        );

        clearTwoFactorCodeInputs();
        focusFirstTwoFactorInput();
      } finally {
        state.authenticationBusy = false;
        twoFactorSubmit.disabled = false;
        twoFactorSubmit.textContent =
          "Verify Code";
      }
    }
  );

  twoFactorCancel.addEventListener(
    "click",
    function () {
      showAuthenticationGate(
        "Administrator authentication cancelled."
      );
    }
  );

  function renderStats() {
    const stats = state.dashboard.stats || {};
    document.getElementById("admin-stat-users").textContent = Number(stats.users || 0).toLocaleString("en-US");
    document.getElementById("admin-stat-reviews").textContent = Number(stats.reviews || 0).toLocaleString("en-US");
    document.getElementById("admin-stat-materials").textContent = Number(stats.materials || 0).toLocaleString("en-US");
    document.getElementById("admin-stat-banned").textContent = Number(stats.bannedUsers || 0).toLocaleString("en-US");
  }

  function renderAuditLogs() {
    const logs = Array.isArray(state.dashboard.auditLogs) ? state.dashboard.auditLogs : [];

    if (!logs.length) {
      auditList.innerHTML = '<div class="admin-empty">No administrator actions have been recorded yet.</div>';
      return;
    }

    auditList.innerHTML = logs.map(function (log) {
      return [
        '<article class="admin-item">',
          '<div class="admin-item-main">',
            '<div class="admin-item-title">', escapeHtml(String(log.action || "admin action").replace(/_/g, " ")), '</div>',
            '<div class="admin-meta">',
              '<span>', escapeHtml(log.targetType || "target"), '</span>',
              '<span>', escapeHtml(formatDate(log.createdAt)), '</span>',
              '<span>', escapeHtml(log.actorEmail || log.actorUid || "Admin"), '</span>',
            '</div>',
            log.targetLabel ? '<p class="admin-item-copy">' + escapeHtml(log.targetLabel) + '</p>' : '',
            log.reason ? '<p class="admin-item-copy"><strong>Reason:</strong> ' + escapeHtml(log.reason) + '</p>' : '',
          '</div>',
        '</article>'
      ].join("");
    }).join("");
  }

  function renderReports() {
    const reports = Array.isArray(
      state.dashboard.reports
    )
      ? state.dashboard.reports
      : [];
    const search = normalizeSearch(
      reportSearch.value
    );
    const filtered = reports.filter(
      function (report) {
        return (
          !search ||
          normalizeSearch(
            [
              report.targetType,
              report.targetId,
              report.targetLabel,
              report.reason,
              report.reporterUid,
              report.reporterEmail,
              JSON.stringify(
                report.targetSnapshot ||
                  {}
              )
            ].join(" ")
          ).includes(search)
        );
      }
    );

    if (!filtered.length) {
      reportList.innerHTML =
        '<div class="admin-empty">No open content reports were found.</div>';
      return;
    }

    reportList.innerHTML =
      filtered.map(function (report) {
        const snapshot =
          report.targetSnapshot || {};
        const targetType =
          report.targetType === "material"
            ? "material"
            : "review";
        const targetSummary =
          targetType === "review"
            ? [
                snapshot.professorName,
                snapshot.courseCode
              ]
                .filter(Boolean)
                .join(" · ")
            : [
                snapshot.title,
                snapshot.courseCode
              ]
                .filter(Boolean)
                .join(" · ");
        const targetCopy =
          targetType === "review"
            ? snapshot.studentNote
            : snapshot.fileName;
        const targetButtonLabel =
          targetType === "review"
            ? "Open review"
            : "Open upload";

        return [
          '<article class="admin-item">',
            '<div class="admin-item-main">',
              '<div class="admin-item-title">',
                escapeHtml(
                  report.targetLabel ||
                    targetSummary ||
                    "Reported content"
                ),
              '</div>',
              '<div class="admin-meta">',
                '<span class="admin-badge is-danger">Open report</span>',
                '<span>',
                  escapeHtml(targetType),
                '</span>',
                '<span>',
                  escapeHtml(
                    report.targetId ||
                      "Target unavailable"
                  ),
                '</span>',
                '<span>',
                  escapeHtml(
                    formatDate(
                      report.createdAt
                    )
                  ),
                '</span>',
              '</div>',
              targetSummary
                ? '<p class="admin-item-copy"><strong>Content:</strong> ' +
                  escapeHtml(
                    targetSummary
                  ) +
                  '</p>'
                : '',
              targetCopy
                ? '<p class="admin-item-copy">' +
                  escapeHtml(targetCopy) +
                  '</p>'
                : '',
              '<p class="admin-item-copy"><strong>Report reason:</strong> ',
                escapeHtml(
                  report.reason ||
                    "No reason supplied."
                ),
              '</p>',
              '<p class="admin-item-copy"><strong>Reporter:</strong> ',
                escapeHtml(
                  report.reporterEmail ||
                    "Email unavailable"
                ),
                ' · ',
                escapeHtml(
                  report.reporterUid ||
                    "UID unavailable"
                ),
              '</p>',
            '</div>',
            '<div class="admin-item-actions">',
              '<button class="admin-button" type="button"',
                ' data-open-report-target',
                ' data-report-target-type="',
                  escapeHtml(targetType),
                '"',
                ' data-report-target-id="',
                  escapeHtml(
                    report.targetId
                  ),
                '">',
                targetButtonLabel,
              '</button>',
              '<button class="admin-button danger" type="button"',
                ' data-dismiss-report="',
                  escapeHtml(report.id),
                '">',
                'Dismiss report',
              '</button>',
            '</div>',
          '</article>'
        ].join("");
      }).join("");
  }

  function renderReviews() {
    const reviews = Array.isArray(state.dashboard.reviews) ? state.dashboard.reviews : [];
    const search = normalizeSearch(reviewSearch.value);
    const filtered = reviews.filter(function (review) {
      return !search || normalizeSearch([
        review.id,
        review.professorName,
        review.courseCode,
        review.authorName,
        review.authorUid,
        review.studentNote
      ].join(" ")).includes(search);
    });

    if (!filtered.length) {
      reviewList.innerHTML = '<div class="admin-empty">No matching professor reviews were found.</div>';
      reviewPagination.hidden = true;
      return;
    }

    const pageCount = Math.ceil(filtered.length / reviewPageSize);
    reviewPage = Math.max(1, Math.min(reviewPage, pageCount));
    const start = (reviewPage - 1) * reviewPageSize;
    const visibleReviews = filtered.slice(start, start + reviewPageSize);

    reviewPagination.hidden = pageCount <= 1;
    reviewPageInfo.textContent =
      (start + 1).toLocaleString("en-US") + "–" +
      Math.min(start + reviewPageSize, filtered.length).toLocaleString("en-US") +
      " of " + filtered.length.toLocaleString("en-US") + " reviews";
    reviewPrev.disabled = reviewPage === 1;
    reviewNext.disabled = reviewPage === pageCount;

    reviewList.innerHTML = visibleReviews.map(function (review) {
      const professorName = review.professorName || "Professor review";
      const professorPhoto = getReviewProfessorPhoto(review);
      return [
        '<article class="admin-item">',
          '<div class="admin-item-main admin-review-body">',
            '<div class="admin-review-avatar" aria-hidden="true">',
              '<span>', escapeHtml(getProfessorInitials(professorName)), '</span>',
              professorPhoto
                ? '<img src="' + escapeHtml(professorPhoto) + '" alt="" loading="lazy" decoding="async">'
                : '',
            '</div>',
            '<div class="admin-review-copy">',
              '<div class="admin-item-title">', escapeHtml(professorName), '</div>',
              '<div class="admin-meta">',
                '<span>', escapeHtml(review.courseCode || "Course not listed"), '</span>',
                '<span>', escapeHtml(String(review.rating || 0)), ' / 5</span>',
                '<span>', escapeHtml(review.semesterTaken || "Semester not listed"), '</span>',
                '<span>', escapeHtml(formatDate(review.createdAt)), '</span>',
              '</div>',
              '<p class="admin-item-copy">', escapeHtml(review.studentNote || "No written comment."), '</p>',
              '<p class="admin-item-copy"><strong>Author:</strong> ', escapeHtml(review.authorName || "AUC student"), ' · ', escapeHtml(review.authorUid || "UID unavailable"), '</p>',
            '</div>',
          '</div>',
          '<div class="admin-item-actions">',
            '<button class="admin-button danger" type="button" data-delete-review="', escapeHtml(review.id), '">Delete review</button>',
          '</div>',
        '</article>'
      ].join("");
    }).join("");
  }

  function renderMaterials() {
    const materials = Array.isArray(state.dashboard.materials) ? state.dashboard.materials : [];
    const search = normalizeSearch(materialSearch.value);
    const filtered = materials.filter(function (material) {
      return !search || normalizeSearch([
        material.id,
        material.title,
        material.fileName,
        material.courseCode,
        material.professor,
        material.uploaderDisplayName,
        material.uploaderUid,
        material.materialType,
        material.status
      ].join(" ")).includes(search);
    });

    if (!filtered.length) {
      materialList.innerHTML = '<div class="admin-empty">No matching uploaded materials were found.</div>';
      materialPagination.hidden = true;
      return;
    }

    const pageCount = Math.ceil(filtered.length / materialPageSize);
    materialPage = Math.max(1, Math.min(materialPage, pageCount));
    const start = (materialPage - 1) * materialPageSize;
    const visibleMaterials = filtered.slice(start, start + materialPageSize);

    materialPagination.hidden = pageCount <= 1;
    materialPageInfo.textContent =
      (start + 1).toLocaleString("en-US") + "–" +
      Math.min(start + materialPageSize, filtered.length).toLocaleString("en-US") +
      " of " + filtered.length.toLocaleString("en-US") + " uploads";
    materialPrev.disabled = materialPage === 1;
    materialNext.disabled = materialPage === pageCount;

    materialList.innerHTML = visibleMaterials.map(function (material) {
      const status = normalizeSearch(
        material.status || "pending"
      );

      return [
        '<article class="admin-item">',
          '<div class="admin-item-main">',
            '<div class="admin-item-title">', escapeHtml(material.title || material.fileName || "Course material"), '</div>',
            '<div class="admin-meta">',
              '<span>', escapeHtml(material.courseCode || "Course not listed"), '</span>',
              '<span>', escapeHtml(material.materialType || "Material"), '</span>',
              '<span>', escapeHtml(material.source || "firestore"), '</span>',
              '<span>', escapeHtml(status || "pending"), '</span>',
              '<span>', escapeHtml(formatDate(material.createdAt)), '</span>',
            '</div>',
            '<p class="admin-item-copy">', escapeHtml(material.fileName || "Filename unavailable"), '</p>',
            '<p class="admin-item-copy"><strong>Uploader:</strong> ', escapeHtml(material.uploaderDisplayName || "AUC student"), ' · ', escapeHtml(material.uploaderUid || "UID unavailable"), '</p>',
          '</div>',
          '<div class="admin-item-actions">',
            '<button class="admin-button danger" type="button"',
              ' data-delete-material="', escapeHtml(material.id), '"',
              ' data-material-source="', escapeHtml(material.source || "firestore"), '"',
              ' data-material-file-id="', escapeHtml(material.fileId || ""), '"',
              ' data-material-title="', escapeHtml(material.title || material.fileName || "Course material"), '">',
              'Delete upload',
            '</button>',
          '</div>',
        '</article>'
      ].join("");
    }).join("");
  }

  function userAvatar(user, extraClass = "") {
    const label = user.displayName || user.email || "User";
    let photo = "";
    try {
      const raw = String(user.photoURL || "").trim();
      if (raw) {
        const url = new URL(raw, window.location.origin);
        if (url.protocol === "https:" || (url.origin === window.location.origin && url.protocol === "http:")) {
          photo = url.href;
        }
      }
    } catch (error) {}

    return [
      '<span class="admin-user-avatar', extraClass ? ' ' + extraClass : '', '" aria-hidden="true">',
        '<span class="admin-user-avatar-initials">', escapeHtml(getProfessorInitials(label)), '</span>',
        photo ? '<img src="' + escapeHtml(photo) + '" alt="" loading="lazy" decoding="async">' : '',
      '</span>'
    ].join("");
  }

  function formatUserDate(value) {
    if (!value) return "—";
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? "—" : date.toLocaleDateString("en-US", {
      month: "short", day: "numeric", year: "numeric"
    });
  }

  function closeUserDrawer(options = {}) {
    if (userDrawerLayer.hidden) {
      selectedUserUid = "";
      return;
    }
    const uid = selectedUserUid;
    userDrawerLayer.hidden = true;
    document.body.style.overflow = savedPageOverflow;
    selectedUserUid = "";
    if (options.render !== false) renderUsers();
    if (options.restoreFocus !== false) {
      const trigger = Array.from(userList.querySelectorAll("[data-user-open-uid]"))
        .find(function (button) { return button.dataset.userOpenUid === uid; });
      (trigger || userSearch).focus({ preventScroll: true });
    }
  }

  function renderUserDetails(user) {
    const status = user.disabled ? "Banned" : "Active";
    const identity = [
      ["Major", user.major || "Not provided"],
      ["AUC ID", user.aucId || "Not provided"],
      ["Email verified", user.emailVerified ? "Yes" : "No"],
      ["Firebase UID", user.uid || "Unavailable"]
    ];
    const activity = [
      ["Registered", formatDate(user.createdAt)],
      ["Last sign in", formatDate(user.lastSignInAt)],
      ["Session records", user.activeSessionRecords == null ? "Not loaded" : user.activeSessionRecords],
      ...(user.disabled ? [["Ban reason", user.banReason || "Not provided"]] : [])
    ];
    function detailRows(items) {
      return items.map(function (detail) {
        return '<div class="admin-user-drawer-detail"><dt>' + escapeHtml(detail[0]) +
          '</dt><dd>' + escapeHtml(String(detail[1])) + '</dd></div>';
      }).join("");
    }

    const moderation = user.isAdmin
      ? '<p class="admin-user-admin-protected">Administrator accounts are protected from moderation actions.</p>'
      : [
          '<p class="admin-user-controls-hint">Moderation actions are logged and require confirmation.</p>',
          '<div class="admin-user-actions">',
            '<button class="admin-button ', user.disabled ? 'primary' : 'danger', '" type="button" data-user-ban-action="',
              user.disabled ? 'unban' : 'ban', '" data-user-uid="', escapeHtml(user.uid), '">',
              user.disabled ? 'Unban user' : 'Ban user', '</button>',
            '<button class="admin-button" type="button" data-user-revoke-sessions="',
              escapeHtml(user.uid), '">Revoke all sessions</button>',
          '</div>'
        ].join("");

    return [
      '<div class="admin-user-drawer-profile">',
        userAvatar(user, "is-large"),
        '<div class="admin-user-drawer-identity">',
          '<strong>', escapeHtml(user.displayName || user.email || user.uid || "User"), '</strong>',
          '<p>', escapeHtml(user.email || "Email unavailable"), '</p>',
          '<div class="admin-user-drawer-badges">',
            '<span class="admin-user-status', user.disabled ? ' is-banned' : '', '">', status, '</span>',
            '<span class="admin-user-verification', user.emailVerified ? ' is-verified' : '', '">',
              user.emailVerified ? "Verified" : "Unverified", '</span>',
            user.isAdmin ? '<span class="admin-user-role">Administrator</span>' : '',
          '</div>',
        '</div>',
      '</div>',
      '<section class="admin-user-drawer-section" aria-label="Identity">',
        '<h4>Identity</h4><dl>', detailRows(identity), '</dl>',
      '</section>',
      '<section class="admin-user-drawer-section" aria-label="Account activity">',
        '<h4>Account activity</h4><dl>', detailRows(activity), '</dl>',
      '</section>',
      '<section class="admin-user-drawer-section admin-user-drawer-moderation" aria-label="Account controls">',
        '<h4>Account controls</h4>', moderation,
      '</section>'
    ].join("");
  }

  function renderUserDrawer() {
    if (!selectedUserUid || userDrawerLayer.hidden) return;
    const users = Array.isArray(state.dashboard?.users) ? state.dashboard.users : [];
    const user = users.find(function (item) { return String(item.uid) === selectedUserUid; });
    if (!user) {
      closeUserDrawer({ restoreFocus: false, render: false });
      return;
    }
    userDrawerContent.innerHTML = renderUserDetails(user);
  }

  function toggleUserDetails(uid) {
    if (!uid) return;
    if (!userDrawerLayer.hidden && selectedUserUid === uid) {
      closeUserDrawer();
      return;
    }
    const exists = (state.dashboard?.users || []).some(function (user) { return String(user.uid) === uid; });
    if (!exists) return;
    if (userDrawerLayer.hidden) savedPageOverflow = document.body.style.overflow;
    selectedUserUid = uid;
    userDrawerLayer.hidden = false;
    document.body.style.overflow = "hidden";
    renderUsers();
    userDrawer.querySelector(".admin-user-drawer-close").focus({ preventScroll: true });
  }

  function renderUsers() {
    const users = Array.isArray(state.dashboard.users) ? state.dashboard.users : [];
    const search = normalizeSearch(userSearch.value);
    const filtered = users.filter(function (user) {
      if (userStatusFilter === "active" && user.disabled) return false;
      if (userStatusFilter === "banned" && !user.disabled) return false;
      if (userStatusFilter === "unverified" && user.emailVerified) return false;
      return !search || normalizeSearch([
        user.displayName, user.email, user.uid, user.major, user.aucId, user.banReason
      ].join(" ")).includes(search);
    }).sort(function (a, b) {
      const order = userSort.value;
      if (order === "name") return String(a.displayName || a.email || "").localeCompare(
        String(b.displayName || b.email || ""), undefined, { sensitivity: "base" }
      );
      const field = order === "lastSignIn" ? "lastSignInAt" : "createdAt";
      const aDate = new Date(a[field] || 0).getTime() || 0;
      const bDate = new Date(b[field] || 0).getTime() || 0;
      return order === "oldest" ? aDate - bDate : bDate - aDate;
    });

    const count = function (value) { return Number(value).toLocaleString("en-US"); };
    document.getElementById("admin-users-total").textContent = count(users.length);
    document.getElementById("admin-users-active").textContent = count(users.filter(user => !user.disabled).length);
    document.getElementById("admin-users-banned").textContent = count(users.filter(user => user.disabled).length);
    userCount.textContent = search || userStatusFilter !== "all"
      ? count(filtered.length) + " of " + count(users.length) + " registered accounts"
      : count(users.length) + " registered accounts";

    if (selectedUserUid && !filtered.some(function (user) { return String(user.uid) === selectedUserUid; })) {
      closeUserDrawer({ restoreFocus: false, render: false });
    }

    if (!filtered.length) {
      userList.innerHTML = '<div class="admin-users-empty"><strong>No matching users</strong><p>' +
        (users.length ? "Try a different search or status filter." : "No registered accounts were found.") +
        '</p></div>';
      userPagination.hidden = true;
    } else {
      const pageCount = Math.ceil(filtered.length / userPageSize);
      userPage = Math.max(1, Math.min(userPage, pageCount));
      const start = (userPage - 1) * userPageSize;
      const displayed = filtered.slice(start, start + userPageSize);

      userList.innerHTML = [
        '<table class="admin-user-table">',
          '<thead><tr>',
            '<th scope="col">USER</th>',
            '<th scope="col">MAJOR</th>',
            '<th scope="col">STATUS</th>',
            '<th scope="col">VERIFICATION</th>',
          '</tr></thead>',
          '<tbody>',
            displayed.map(function (user) {
              const uid = escapeHtml(user.uid);
              const name = escapeHtml(user.displayName || user.email || user.uid || "Unnamed user");
              const selected = String(user.uid) === selectedUserUid;
              return [
                '<tr class="admin-user-row', selected ? ' is-expanded' : '', '" data-user-row-uid="', uid, '">',
                  '<td><button class="admin-user-open" type="button" data-user-open-uid="', uid,
                    '" aria-haspopup="dialog" aria-expanded="', selected ? 'true' : 'false', '">',
                    userAvatar(user),
                    '<span class="admin-user-primary">',
                      '<strong>', name, '</strong>',
                      '<small>', escapeHtml(user.email || "Email unavailable"), '</small>',
                      user.isAdmin ? '<span class="admin-user-role">Administrator</span>' : '',
                    '</span>',
                  '</button></td>',
                  '<td class="admin-user-major">', escapeHtml(user.major || "Not provided"), '</td>',
                  '<td><span class="admin-user-status', user.disabled ? ' is-banned' : '', '">',
                    user.disabled ? "Banned" : "Active", '</span></td>',
                  '<td><span class="admin-user-verification', user.emailVerified ? ' is-verified' : '', '">',
                    user.emailVerified ? "Verified" : "Unverified", '</span></td>',
                '</tr>'
              ].join("");
            }).join(""),
          '</tbody>',
        '</table>'
      ].join("");

      userPagination.hidden = pageCount <= 1;
      userPageInfo.textContent = count(start + 1) + "–" +
        count(Math.min(start + userPageSize, filtered.length)) + " of " +
        count(filtered.length) + " users";
      userPrev.disabled = userPage === 1;
      userNext.disabled = userPage === pageCount;
    }
    renderUserDrawer();
  }

  // Fetch the selected section once. Other panels stay on the server until opened.
  async function loadDashboard(options) {
    const settings = options || {};
    const section = settings.section || "users";
    if (loadedSections.has(section) && !settings.force) {
      if (settings.message) showToast(settings.message);
      return;
    }
    if (sectionRequests.has(section)) return sectionRequests.get(section);

    const pending = (async function () {
      try {
        const data = await requestJson("/api/admin?section=" + encodeURIComponent(section));
        if (!state.dashboard) {
          state.dashboard = {
            stats: {}, users: [], reports: [], reviews: [], materials: [], auditLogs: []
          };
        }
        if (data.stats) {
          state.dashboard.stats = Object.assign({}, state.dashboard.stats, data.stats);
        }
        if (Array.isArray(data[section])) state.dashboard[section] = data[section];
        loadedSections.add(section);

        renderStats();
        if (section === "users") renderUsers();
        if (section === "reports") renderReports();
        if (section === "reviews") renderReviews();
        if (section === "materials") renderMaterials();
        switchPanel(state.activePanel);

        loadingState.hidden = true;
        authState.hidden = true;
        deniedState.hidden = true;
        app.hidden = false;
        if (settings.message) showToast(settings.message);
      } catch (error) {
        if (error.code === "admin-fresh-auth-required") {
          showAuthenticationGate(error.message);
          return;
        }
        if (!state.dashboard) {
          showDenied(error.message || "Administrator access could not be verified.");
          return;
        }
        showToast(error.message || "Could not load administrator data.");
        const target = {
          users: userList, reports: reportList,
          reviews: reviewList, materials: materialList
        }[section];
        if (target && !loadedSections.has(section)) {
          target.innerHTML = '<div class="admin-empty">Could not load records. Switch panels to retry.</div>';
        }
      }
    })();

    sectionRequests.set(section, pending);
    try { return await pending; }
    finally { sectionRequests.delete(section); }
  }

  // Mutations update the loaded list and stats instead of refetching every record.
  function removeModeratedContent(section, id) {
    const list = Array.isArray(state.dashboard[section]) ? state.dashboard[section] : [];
    const next = list.filter(function (item) { return item.id !== id; });
    if (next.length !== list.length) {
      state.dashboard[section] = next;
      const stat = section === "reviews" ? "reviews" : "materials";
      state.dashboard.stats[stat] = Math.max(0, Number(state.dashboard.stats[stat] || 0) - 1);
      renderStats();
      if (section === "reviews") renderReviews();
      else renderMaterials();
    }
    // The target's open reports are resolved server-side; reload reports on revisit.
    loadedSections.delete("reports");
  }

  function updateModeratedUser(nextUser) {
    if (!nextUser || !nextUser.uid) return;
    const users = state.dashboard.users || [];
    const index = users.findIndex(function (user) { return user.uid === nextUser.uid; });
    if (index < 0) return;
    // The action response omits AUC ID and major; preserve them from the list.
    users[index] = Object.assign({}, users[index], nextUser, { activeSessionRecords: null });
    state.dashboard.stats.bannedUsers = users.filter(function (user) { return user.disabled; }).length;
    renderUsers();
    renderStats();
  }

  async function runBusy(button, callback) {
    if (state.busy) {
      return;
    }

    state.busy = true;
    const originalText = button ? button.textContent : "";

    if (button) {
      button.disabled = true;
      button.textContent = "Working...";
    }

    try {
      await callback();
    } finally {
      state.busy = false;

      if (button && document.body.contains(button)) {
        button.disabled = false;
        button.textContent = originalText;
      }
    }
  }

  navButtons.forEach(function (button) {
    button.addEventListener("click", function () {
      switchPanel(button.dataset.adminPanel);
    });
  });

  reportSearch.addEventListener("input", renderReports);
  reviewSearch.addEventListener("input", function () {
    reviewPage = 1;
    renderReviews();
  });

  function changeReviewPage(nextPage) {
    reviewPage = nextPage;
    renderReviews();
    reviewList.scrollIntoView({ block: "start", behavior: "smooth" });
  }

  reviewPrev.addEventListener("click", function () {
    if (reviewPage > 1) {
      changeReviewPage(reviewPage - 1);
    }
  });

  reviewNext.addEventListener("click", function () {
    changeReviewPage(reviewPage + 1);
  });
  materialSearch.addEventListener("input", function () {
    materialPage = 1;
    renderMaterials();
  });

  function changeMaterialPage(nextPage) {
    materialPage = nextPage;
    renderMaterials();
    materialList.scrollIntoView({ block: "start", behavior: "smooth" });
  }

  materialPrev.addEventListener("click", function () {
    if (materialPage > 1) {
      changeMaterialPage(materialPage - 1);
    }
  });

  materialNext.addEventListener("click", function () {
    changeMaterialPage(materialPage + 1);
  });
  userSearch.addEventListener("input", function () {
    userPage = 1;
    renderUsers();
  });
  userFilterButtons.forEach(function (button) {
    button.addEventListener("click", function () {
      userStatusFilter = button.dataset.userFilter;
      userFilterButtons.forEach(function (item) {
        const active = item === button;
        item.classList.toggle("active", active);
        item.setAttribute("aria-pressed", String(active));
      });
      userPage = 1;
      renderUsers();
    });
  });
  userSort.addEventListener("change", function () {
    userPage = 1;
    renderUsers();
  });

  userPrev.addEventListener("click", function () {
    if (userPage > 1) {
      userPage -= 1;
      renderUsers();
    }
  });

  userNext.addEventListener("click", function () {
    userPage += 1;
    renderUsers();
  });

  reportList.addEventListener("click", function (event) {
    const openButton = event.target.closest(
      "[data-open-report-target]"
    );

    if (openButton) {
      const targetType =
        openButton.dataset
          .reportTargetType;
      const targetId =
        openButton.dataset
          .reportTargetId;

      if (targetType === "review") {
        reviewSearch.value = targetId;
        reviewPage = 1;
        if (loadedSections.has("reviews")) renderReviews();
        switchPanel("reviews");
      } else {
        materialSearch.value = targetId;
        if (loadedSections.has("materials")) renderMaterials();
        switchPanel("materials");
      }

      return;
    }

    const dismissButton =
      event.target.closest(
        "[data-dismiss-report]"
      );

    if (!dismissButton) {
      return;
    }

    const reason = window.prompt(
      "Internal reason for dismissing this report?",
      "Reviewed and dismissed"
    );

    if (
      reason === null ||
      !window.confirm(
        "Dismiss all open reports for this content?"
      )
    ) {
      return;
    }

    runBusy(
      dismissButton,
      async function () {
        await postAction({
          action: "dismissReport",
          reportId:
            dismissButton.dataset
              .dismissReport,
          reason
        });

        loadedSections.delete("reports");
        await loadDashboard({ section: "reports", message: "Content report dismissed." });
      }
    ).catch(function (error) {
      showToast(
        error.message ||
          "Could not dismiss the report."
      );
    });
  });

  // Capture image failures so the initials underneath remain visible.
  reviewList.addEventListener("error", function (event) {
    if (event.target.matches(".admin-review-avatar img")) {
      event.target.remove();
    }
  }, true);

  reviewList.addEventListener("click", function (event) {
    const button = event.target.closest("[data-delete-review]");

    if (!button) {
      return;
    }

    const reason = window.prompt("Reason for deleting this review?", "");

    if (reason === null || !window.confirm("Permanently delete this review?")) {
      return;
    }

    runBusy(button, async function () {
      await postAction({
        action: "deleteReview",
        reviewId: button.dataset.deleteReview,
        reason
      });
      removeModeratedContent("reviews", button.dataset.deleteReview);
      showToast("Review deleted.");
    }).catch(function (error) {
      showToast(error.message || "Could not delete the review.");
    });
  });

  materialList.addEventListener("click", function (event) {
    const deleteButton =
      event.target.closest(
        "[data-delete-material]"
      );

    if (!deleteButton) {
      return;
    }

    const reason = window.prompt(
      "Reason for deleting this upload?",
      ""
    );

    if (
      reason === null ||
      !window.confirm(
        "Delete this uploaded content?"
      )
    ) {
      return;
    }

    runBusy(
      deleteButton,
      async function () {
        await postAction({
          action: "deleteMaterial",
          materialId:
            deleteButton.dataset
              .deleteMaterial,
          source:
            deleteButton.dataset
              .materialSource,
          fileId:
            deleteButton.dataset
              .materialFileId,
          title:
            deleteButton.dataset
              .materialTitle,
          reason
        });

        removeModeratedContent("materials", deleteButton.dataset.deleteMaterial);
        showToast("Uploaded content deleted.");
      }
    ).catch(function (error) {
      showToast(
        error.message ||
        "Could not delete the upload."
      );
    });
  });

  // Broken remote avatar images reveal their initials fallback.
  usersPanel.addEventListener("error", function (event) {
    if (event.target.matches(".admin-user-avatar img")) event.target.remove();
  }, true);

  document.addEventListener("keydown", function (event) {
    if (userDrawerLayer.hidden) return;
    if (event.key === "Escape") {
      event.preventDefault();
      closeUserDrawer();
      return;
    }
    if (event.key !== "Tab") return;
    const focusable = Array.from(userDrawer.querySelectorAll(
      'button:not([disabled]), a[href], input:not([disabled]), select:not([disabled]), [tabindex="0"]'
    )).filter(function (item) { return item.getClientRects().length > 0; });
    if (!focusable.length) return;
    const first = focusable[0], last = focusable[focusable.length - 1];
    if (event.shiftKey && (document.activeElement === first || !userDrawer.contains(document.activeElement))) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && (document.activeElement === last || !userDrawer.contains(document.activeElement))) {
      event.preventDefault();
      first.focus();
    }
  });

  usersPanel.addEventListener("click", function (event) {
    if (event.target.closest("[data-close-user-detail]")) {
      closeUserDrawer();
      return;
    }

    const banButton = event.target.closest("[data-user-ban-action]");
    const revokeButton = event.target.closest("[data-user-revoke-sessions]");

    if (banButton) {
      const isBanning = banButton.dataset.userBanAction === "ban";
      const reason = window.prompt(
        isBanning ? "Reason for banning this user?" : "Reason for unbanning this user?",
        isBanning ? "Violation of AUC Atlas rules" : ""
      );

      if (reason === null || !window.confirm(isBanning ? "Ban this user and revoke all sessions?" : "Unban this user?")) return;

      runBusy(banButton, async function () {
        const result = await postAction({
          action: "setUserBan",
          uid: banButton.dataset.userUid,
          banned: isBanning,
          reason
        });
        updateModeratedUser(result.user);
        showToast(isBanning ? "User banned." : "User unbanned.");
      }).catch(function (error) {
        showToast(error.message || "Could not update the user.");
      });
      return;
    }

    if (revokeButton) {
      const reason = window.prompt("Reason for revoking all sessions?", "Security reset");
      if (reason === null || !window.confirm("Sign this user out of every recorded session?")) return;
      runBusy(revokeButton, async function () {
        await postAction({
          action: "revokeUserSessions",
          uid: revokeButton.dataset.userRevokeSessions,
          reason
        });
        showToast("All user sessions were revoked.");
      }).catch(function (error) {
        showToast(error.message || "Could not revoke the sessions.");
      });
      return;
    }

    const openButton = event.target.closest("[data-user-open-uid]");
    if (openButton) {
      toggleUserDetails(openButton.dataset.userOpenUid);
      return;
    }

    const userRow = event.target.closest(".admin-user-row[data-user-row-uid]");
    if (userRow) toggleUserDetails(userRow.dataset.userRowUid);
  });

  prepareAdminAuthentication();
}
