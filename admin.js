(function () {
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
  const userDrawer =
    document.getElementById("admin-user-drawer");
  const userDrawerPanel =
    userDrawer.querySelector(".admin-user-drawer-panel");
  const userDetailContent =
    document.getElementById("admin-user-detail-content");
  const userPageSize = Number.MAX_SAFE_INTEGER;
  let userPage = 1;
  let selectedUserUid = "";
  let userDetailTrigger = null;
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
    if (panelName !== "users" && !userDrawer.hidden) {
      closeUserDrawer(false);
    }
    state.activePanel = panelName;

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
      return;
    }

    reviewList.innerHTML = filtered.map(function (review) {
      return [
        '<article class="admin-item">',
          '<div class="admin-item-main">',
            '<div class="admin-item-title">', escapeHtml(review.professorName || "Professor review"), '</div>',
            '<div class="admin-meta">',
              '<span>', escapeHtml(review.courseCode || "Course not listed"), '</span>',
              '<span>', escapeHtml(String(review.rating || 0)), ' / 5</span>',
              '<span>', escapeHtml(review.semesterTaken || "Semester not listed"), '</span>',
              '<span>', escapeHtml(formatDate(review.createdAt)), '</span>',
            '</div>',
            '<p class="admin-item-copy">', escapeHtml(review.studentNote || "No written comment."), '</p>',
            '<p class="admin-item-copy"><strong>Author:</strong> ', escapeHtml(review.authorName || "AUC student"), ' · ', escapeHtml(review.authorUid || "UID unavailable"), '</p>',
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
      return;
    }

    materialList.innerHTML = filtered.map(function (material) {
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

  function closeUserDrawer(restoreFocus) {
    const shouldRestore = restoreFocus !== false;
    userDrawer.hidden = true;
    selectedUserUid = "";

    if (
      shouldRestore &&
      userDetailTrigger &&
      document.contains(userDetailTrigger)
    ) {
      userDetailTrigger.focus();
    }

    userDetailTrigger = null;
  }

  function renderUserDetails(user) {
    const status = user.disabled ? "Banned" : "Active";
    const statusClass = user.disabled ? " is-banned" : "";
    const details = [
      ["Account status", status],
      ["Email verified", user.emailVerified ? "Yes" : "No"],
      ["Firebase UID", user.uid || "Unavailable"],
      ["Major", user.major || "Not provided"],
      ["AUC ID", user.aucId || "Not provided"],
      ["Session records", user.activeSessionRecords == null ? "Not loaded" : user.activeSessionRecords],
      ["Created", formatDate(user.createdAt)],
      ["Last sign in", formatDate(user.lastSignInAt)],
      ["Ban reason", user.banReason || "Not banned"]
    ];

    // Existing moderation permissions and confirmation flows are retained.
    const moderation = user.isAdmin
      ? '<p class="admin-item-copy">Administrator accounts are protected from moderation actions.</p>'
      : [
          '<div class="admin-user-actions">',
            '<button class="admin-button ', user.disabled ? 'primary' : 'danger', '" type="button" data-user-ban-action="', user.disabled ? 'unban' : 'ban', '" data-user-uid="', escapeHtml(user.uid), '">', user.disabled ? 'Unban user' : 'Ban user', '</button>',
            '<button class="admin-button" type="button" data-user-revoke-sessions="', escapeHtml(user.uid), '">Revoke all sessions</button>',
          '</div>'
        ].join("");

    userDetailContent.innerHTML = [
      '<div class="admin-user-drawer-identity">',
        '<strong>', escapeHtml(user.displayName || user.email || user.uid || "User"), '</strong>',
        '<p>', escapeHtml(user.email || "Email unavailable"), '</p>',
        '<span class="admin-user-status', statusClass, '">', status, '</span>',
        user.isAdmin ? ' <span class="admin-badge">Administrator</span>' : '',
      '</div>',
      '<dl class="admin-user-detail-rows">',
        details.map(function (detail) {
          return [
            '<div class="admin-user-detail-line">',
              '<dt>', escapeHtml(detail[0]), '</dt>',
              '<dd>', escapeHtml(String(detail[1])), '</dd>',
            '</div>'
          ].join("");
        }).join(""),
      '</dl>',
      moderation
    ].join("");
  }

  function openUserDrawer(uid, trigger) {
    const users = Array.isArray(state.dashboard && state.dashboard.users)
      ? state.dashboard.users
      : [];
    const user = users.find(function (entry) {
      return String(entry.uid) === uid;
    });

    if (!user) {
      return;
    }

    selectedUserUid = uid;
    userDetailTrigger = trigger;
    renderUserDetails(user);
    userDrawer.hidden = false;
    userDrawerPanel.focus();
  }

  function renderUsers() {
    const users = Array.isArray(state.dashboard.users)
      ? state.dashboard.users
      : [];
    const search = normalizeSearch(userSearch.value);
    const filtered = users.filter(function (user) {
      return !search || normalizeSearch([
        user.displayName,
        user.email,
        user.uid,
        user.major,
        user.aucId,
        user.banReason
      ].join(" ")).includes(search);
    });

    userCount.textContent = search
      ? filtered.length.toLocaleString("en-US") + " of " +
        users.length.toLocaleString("en-US") + " registered accounts"
      : users.length.toLocaleString("en-US") + " registered accounts";

    if (!filtered.length) {
      userList.innerHTML = '<div class="admin-empty">' +
        (search
          ? "No registered users match this filter."
          : "No registered Firebase users were found.") +
        '</div>';
      userPagination.hidden = true;
    } else {
      const pageCount = Math.ceil(filtered.length / userPageSize);
      userPage = Math.max(1, Math.min(userPage, pageCount));
      const start = (userPage - 1) * userPageSize;
      const displayed = filtered.slice(start, start + userPageSize);

      userList.innerHTML = [
        '<table class="admin-user-table">',
          '<thead><tr>',
            '<th scope="col">User</th>',
            '<th scope="col">Status</th>',
            '<th scope="col">Verified</th>',
            '<th scope="col">Action</th>',
          '</tr></thead>',
          '<tbody>',
            displayed.map(function (user) {
              const uid = escapeHtml(user.uid);
              const name = escapeHtml(user.displayName || user.email || user.uid || "Unnamed user");
              const status = user.disabled ? "Banned" : "Active";
              return [
                '<tr>',
                  '<td><button class="admin-user-open" type="button" data-user-open-uid="', uid, '">',
                    '<strong>', name, '</strong>',
                    '<small>', escapeHtml(user.email || "Email unavailable"),
                    user.isAdmin ? ' · Administrator' : '', '</small>',
                  '</button></td>',
                  '<td><span class="admin-user-status', user.disabled ? ' is-banned' : '', '">', status, '</span></td>',
                  '<td>', user.emailVerified ? 'Yes' : 'No', '</td>',
                  '<td><button class="admin-user-more" type="button" data-user-open-uid="', uid,
                    '" aria-label="View details for ', name, '" title="View user details">⋯</button></td>',
                '</tr>'
              ].join("");
            }).join(""),
          '</tbody>',
        '</table>'
      ].join("");

      userPagination.hidden = filtered.length <= userPageSize;
      userPageInfo.textContent =
        (start + 1).toLocaleString("en-US") + "–" +
        Math.min(start + userPageSize, filtered.length).toLocaleString("en-US") +
        " of " + filtered.length.toLocaleString("en-US") + " users";
      userPrev.disabled = userPage === 1;
      userNext.disabled = userPage === pageCount;
    }

    if (selectedUserUid && !userDrawer.hidden) {
      const selected = users.find(function (user) {
        return String(user.uid) === selectedUserUid;
      });

      if (selected) {
        renderUserDetails(selected);
      } else {
        closeUserDrawer(false);
      }
    }
  }

  function renderDashboard() {
    renderStats();
    renderUsers();
    renderReports();
    renderReviews();
    renderMaterials();
    switchPanel(state.activePanel);
  }

  async function loadDashboard(options) {
    const settings = options || {};

    try {
      const data = await requestJson(
        "/api/admin"
      );

      state.dashboard = data;
      renderDashboard();

      loadingState.hidden = true;
      authState.hidden = true;
      deniedState.hidden = true;
      app.hidden = false;

      if (settings.message) {
        showToast(settings.message);
      }
    } catch (error) {
      if (
        error.code ===
        "admin-fresh-auth-required"
      ) {
        showAuthenticationGate(
          error.message
        );
        return;
      }

      showDenied(
        error.message ||
        "Administrator access could not be verified."
      );
    }
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
  reviewSearch.addEventListener("input", renderReviews);
  materialSearch.addEventListener("input", renderMaterials);
  userSearch.addEventListener("input", function () {
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

  userDrawer.addEventListener("click", function (event) {
    if (event.target.closest("[data-close-user-detail]")) {
      closeUserDrawer();
    }
  });

  userDrawer.addEventListener("keydown", function (event) {
    if (userDrawer.hidden) return;

    if (event.key === "Escape") {
      event.preventDefault();
      closeUserDrawer();
      return;
    }

    if (event.key !== "Tab") return;

    const focusable = Array.from(
      userDrawerPanel.querySelectorAll("button:not(:disabled)")
    );
    if (!focusable.length) {
      event.preventDefault();
      return;
    }

    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    if (event.shiftKey && (document.activeElement === first ||
      document.activeElement === userDrawerPanel)) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
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
        renderReviews();
        switchPanel("reviews");
      } else {
        materialSearch.value = targetId;
        renderMaterials();
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

        await loadDashboard({
          message:
            "Content report dismissed."
        });
      }
    ).catch(function (error) {
      showToast(
        error.message ||
          "Could not dismiss the report."
      );
    });
  });

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
      await loadDashboard({ message: "Review deleted." });
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

        await loadDashboard({
          message:
            "Uploaded content deleted."
        });
      }
    ).catch(function (error) {
      showToast(
        error.message ||
        "Could not delete the upload."
      );
    });
  });

  usersPanel.addEventListener("click", function (event) {
    const openButton = event.target.closest("[data-user-open-uid]");
    if (openButton) {
      openUserDrawer(openButton.dataset.userOpenUid, openButton);
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

      if (reason === null || !window.confirm(isBanning ? "Ban this user and revoke all sessions?" : "Unban this user?")) {
        return;
      }

      runBusy(banButton, async function () {
        await postAction({
          action: "setUserBan",
          uid: banButton.dataset.userUid,
          banned: isBanning,
          reason
        });

        await loadDashboard({
          message: isBanning
            ? "User banned."
            : "User unbanned."
        });
      }).catch(function (error) {
        showToast(error.message || "Could not update the user.");
      });

      return;
    }

    if (revokeButton) {
      const reason = window.prompt("Reason for revoking all sessions?", "Security reset");

      if (reason === null || !window.confirm("Sign this user out of every recorded session?")) {
        return;
      }

      runBusy(revokeButton, async function () {
        await postAction({
          action: "revokeUserSessions",
          uid: revokeButton.dataset.userRevokeSessions,
          reason
        });

        await loadDashboard({
          message: "All user sessions were revoked."
        });
      }).catch(function (error) {
        showToast(error.message || "Could not revoke the sessions.");
      });
    }
  });

  prepareAdminAuthentication();
})();
