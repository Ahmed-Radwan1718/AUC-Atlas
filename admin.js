(function () {
  const state = {
    dashboard: null,
    selectedUser: null,
    activePanel: "overview",
    busy: false,
    authenticationBusy: false,
    requiresTwoFactor: false,
    adminChallengeToken: "",
    adminAccessToken: "",
    adminAccessExpiresAt: ""
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
  const identity =
    document.getElementById(
      "admin-identity"
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
  const userLookupForm =
    document.getElementById(
      "admin-user-lookup-form"
    );
  const userUidInput =
    document.getElementById(
      "admin-user-uid"
    );
  const userLookupButton =
    document.getElementById(
      "admin-user-lookup-button"
    );
  const userMessage =
    document.getElementById(
      "admin-user-message"
    );
  const userResult =
    document.getElementById(
      "admin-user-result"
    );
  const notificationForm =
    document.getElementById(
      "admin-notification-form"
    );
  const notificationTitleInput =
    document.getElementById(
      "admin-notification-title"
    );
  const notificationMessageInput =
    document.getElementById(
      "admin-notification-message"
    );
  const notificationTypeInput =
    document.getElementById(
      "admin-notification-type"
    );
  const notificationLinkUrlInput =
    document.getElementById(
      "admin-notification-link-url"
    );
  const notificationLinkLabelInput =
    document.getElementById(
      "admin-notification-link-label"
    );
  const notificationExpiresAtInput =
    document.getElementById(
      "admin-notification-expires-at"
    );
  const notificationSubmit =
    document.getElementById(
      "admin-notification-submit"
    );
  const notificationFormMessage =
    document.getElementById(
      "admin-notification-form-message"
    );
  const notificationList =
    document.getElementById(
      "admin-notification-list"
    );
  const donationForm =
    document.getElementById(
      "admin-donation-form"
    );
  const donationCurrentInput =
    document.getElementById(
      "admin-donation-current"
    );
  const donationGoalInput =
    document.getElementById(
      "admin-donation-goal"
    );
  const donationCurrencyInput =
    document.getElementById(
      "admin-donation-currency"
    );
  const donationReasonInput =
    document.getElementById(
      "admin-donation-reason"
    );
  const donationSubmit =
    document.getElementById(
      "admin-donation-submit"
    );
  const donationMessage =
    document.getElementById(
      "admin-donation-message"
    );
  const donationPreviewAmount =
    document.getElementById(
      "admin-donation-preview-amount"
    );
  const donationPreviewFill =
    document.getElementById(
      "admin-donation-preview-fill"
    );
  const donationPreviewCopy =
    document.getElementById(
      "admin-donation-preview-copy"
    );
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

  function formatAmount(value, currency) {
    const amount = Number(value || 0);
    const formatted = Number.isInteger(amount)
      ? amount.toLocaleString("en-US")
      : amount.toLocaleString("en-US", {
          minimumFractionDigits: 0,
          maximumFractionDigits: 2
        });

    return currency === "EGP" ? "EGP " + formatted : "$" + formatted;
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

  function renderNotifications() {
    const notifications = Array.isArray(
      state.dashboard.notifications
    )
      ? state.dashboard.notifications
      : [];

    if (!notifications.length) {
      notificationList.innerHTML =
        '<div class="admin-empty">No site notifications have been published yet.</div>';
      return;
    }

    notificationList.innerHTML =
      notifications.map(
        function (notification) {
          const type =
            normalizeSearch(
              notification.type || "info"
            );
          const typeLabel =
            type === "important"
              ? "Important"
              : type === "maintenance"
                ? "Maintenance"
                : "Information";
          const typeClass =
            type === "important"
              ? " is-danger"
              : "";
          const statusClass =
            notification.active
              ? " is-success"
              : "";

          return [
            '<article class="admin-item">',
              '<div class="admin-item-main">',
                '<div class="admin-item-title">',
                  escapeHtml(
                    notification.title ||
                    "Site notification"
                  ),
                '</div>',
                '<div class="admin-meta">',
                  '<span class="admin-badge',
                    typeClass,
                  '">',
                    escapeHtml(typeLabel),
                  '</span>',
                  '<span class="admin-badge',
                    statusClass,
                  '">',
                    notification.active
                      ? "Active"
                      : "Expired",
                  '</span>',
                  '<span>',
                    escapeHtml(
                      formatDate(
                        notification.createdAt
                      )
                    ),
                  '</span>',
                  notification.expiresAt
                    ? '<span>Expires ' +
                      escapeHtml(
                        formatDate(
                          notification.expiresAt
                        )
                      ) +
                      '</span>'
                    : '',
                '</div>',
                '<p class="admin-item-copy admin-notification-message">',
                  escapeHtml(
                    notification.message || ""
                  ),
                '</p>',
                notification.linkUrl
                  ? '<p class="admin-item-copy"><strong>Link:</strong> ' +
                    escapeHtml(
                      notification.linkUrl
                    ) +
                    ' · ' +
                    escapeHtml(
                      notification.linkLabel ||
                      "View details"
                    ) +
                    '</p>'
                  : '',
              '</div>',
              '<div class="admin-item-actions">',
                '<button class="admin-button danger" type="button" data-delete-notification="',
                  escapeHtml(notification.id),
                '">Delete notification</button>',
              '</div>',
            '</article>'
          ].join("");
        }
      ).join("");
  }

  function renderDonation() {
    const donation = state.dashboard.donation || {
      currentAmount: 0,
      goalAmount: 100,
      currency: "USD"
    };
    donationCurrentInput.value = donation.currentAmount;
    donationGoalInput.value = donation.goalAmount;
    donationCurrencyInput.value = donation.currency === "EGP" ? "EGP" : "USD";
    updateDonationPreview();
  }

  function updateDonationPreview() {
    const currentAmount = Math.max(0, Number(donationCurrentInput.value || 0));
    const goalAmount = Math.max(0, Number(donationGoalInput.value || 0));
    const currency = donationCurrencyInput.value === "EGP" ? "EGP" : "USD";
    const percentage = goalAmount > 0
      ? Math.min(100, Math.max(0, currentAmount / goalAmount * 100))
      : 0;

    donationPreviewAmount.textContent = formatAmount(currentAmount, currency);
    donationPreviewCopy.textContent = formatAmount(currentAmount, currency) + " of " + formatAmount(goalAmount, currency);
    donationPreviewFill.style.width = percentage + "%";
  }

  function renderUser(user) {
    state.selectedUser = user;

    if (!user) {
      userResult.hidden = true;
      userResult.innerHTML = "";
      return;
    }

    const statusBadge = user.disabled
      ? '<span class="admin-badge is-danger">Banned</span>'
      : '<span class="admin-badge is-success">Active</span>';
    const adminBadge = user.isAdmin
      ? '<span class="admin-badge">Administrator</span>'
      : '';
    const moderationButtons = user.isAdmin
      ? '<p class="admin-item-copy">Administrator accounts are protected from moderation actions.</p>'
      : [
          '<div class="admin-user-actions">',
            '<button class="admin-button ', user.disabled ? 'primary' : 'danger', '" type="button" data-user-ban-action="', user.disabled ? 'unban' : 'ban', '" data-user-uid="', escapeHtml(user.uid), '">', user.disabled ? 'Unban user' : 'Ban user', '</button>',
            '<button class="admin-button" type="button" data-user-revoke-sessions="', escapeHtml(user.uid), '">Revoke all sessions</button>',
          '</div>'
        ].join("");

    userResult.innerHTML = [
      '<div class="admin-user-head">',
        '<div>',
          '<h3>', escapeHtml(user.displayName || user.email || user.uid), '</h3>',
          '<p class="admin-item-copy">', escapeHtml(user.email || "Email unavailable"), '</p>',
        '</div>',
        '<div class="admin-meta">', statusBadge, adminBadge, '</div>',
      '</div>',
      '<div class="admin-user-details">',
        '<div class="admin-user-detail"><span>Firebase UID</span><strong>', escapeHtml(user.uid), '</strong></div>',
        '<div class="admin-user-detail"><span>Email verified</span><strong>', user.emailVerified ? 'Yes' : 'No', '</strong></div>',
        '<div class="admin-user-detail"><span>Session records</span><strong>', escapeHtml(user.activeSessionRecords), '</strong></div>',
        '<div class="admin-user-detail"><span>Created</span><strong>', escapeHtml(formatDate(user.createdAt)), '</strong></div>',
        '<div class="admin-user-detail"><span>Last sign in</span><strong>', escapeHtml(formatDate(user.lastSignInAt)), '</strong></div>',
        '<div class="admin-user-detail"><span>Ban reason</span><strong>', escapeHtml(user.banReason || "Not banned"), '</strong></div>',
      '</div>',
      moderationButtons
    ].join("");
    userResult.hidden = false;
  }

  function renderDashboard() {
    const adminUser = state.dashboard.admin || {};
    identity.textContent = [adminUser.email, adminUser.uid].filter(Boolean).join(" · ");
    renderStats();
    renderAuditLogs();
    renderReports();
    renderReviews();
    renderMaterials();
    renderNotifications();
    renderDonation();
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
  donationCurrentInput.addEventListener("input", updateDonationPreview);
  donationGoalInput.addEventListener("input", updateDonationPreview);
  donationCurrencyInput.addEventListener("change", updateDonationPreview);

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

  userLookupForm.addEventListener("submit", function (event) {
    event.preventDefault();
    const uid = userUidInput.value.trim();

    setMessage(userMessage, "", "");
    renderUser(null);

    runBusy(userLookupButton, async function () {
      const data = await postAction({
        action: "lookupUser",
        uid
      });
      renderUser(data.user);
      setMessage(userMessage, "User loaded.", "success");
    }).catch(function (error) {
      setMessage(userMessage, error.message || "Could not find that user.", "error");
    });
  });

  userResult.addEventListener("click", function (event) {
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
        const data = await postAction({
          action: "setUserBan",
          uid: banButton.dataset.userUid,
          banned: isBanning,
          reason
        });
        renderUser(data.user);
        await loadDashboard({ message: isBanning ? "User banned." : "User unbanned." });
        renderUser(data.user);
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
        const data = await postAction({
          action: "revokeUserSessions",
          uid: revokeButton.dataset.userRevokeSessions,
          reason
        });
        renderUser(data.user);
        await loadDashboard({ message: "All user sessions were revoked." });
        renderUser(data.user);
      }).catch(function (error) {
        showToast(error.message || "Could not revoke the sessions.");
      });
    }
  });

  notificationForm.addEventListener("submit", function (event) {
    event.preventDefault();
    setMessage(
      notificationFormMessage,
      "",
      ""
    );

    let expiresAt = "";

    if (
      notificationExpiresAtInput.value
    ) {
      const expiresAtDate = new Date(
        notificationExpiresAtInput.value
      );

      if (
        Number.isNaN(
          expiresAtDate.getTime()
        ) ||
        expiresAtDate.getTime() <=
          Date.now()
      ) {
        setMessage(
          notificationFormMessage,
          "Choose a future expiration date and time.",
          "error"
        );
        return;
      }

      expiresAt =
        expiresAtDate.toISOString();
    }

    runBusy(
      notificationSubmit,
      async function () {
        await postAction({
          action:
            "createNotification",
          title:
            notificationTitleInput.value,
          message:
            notificationMessageInput.value,
          type:
            notificationTypeInput.value,
          linkUrl:
            notificationLinkUrlInput.value,
          linkLabel:
            notificationLinkLabelInput.value,
          expiresAt
        });

        notificationForm.reset();

        setMessage(
          notificationFormMessage,
          "Notification published.",
          "success"
        );

        await loadDashboard({
          message:
            "Notification published."
        });
      }
    ).catch(function (error) {
      setMessage(
        notificationFormMessage,
        error.message ||
          "Could not publish the notification.",
        "error"
      );
    });
  });

  notificationList.addEventListener("click", function (event) {
    const deleteButton =
      event.target.closest(
        "[data-delete-notification]"
      );

    if (
      !deleteButton ||
      !window.confirm(
        "Delete this notification for everyone?"
      )
    ) {
      return;
    }

    runBusy(
      deleteButton,
      async function () {
        await postAction({
          action:
            "deleteNotification",
          notificationId:
            deleteButton.dataset
              .deleteNotification
        });

        await loadDashboard({
          message:
            "Notification deleted."
        });
      }
    ).catch(function (error) {
      showToast(
        error.message ||
          "Could not delete the notification."
      );
    });
  });

  donationForm.addEventListener("submit", function (event) {
    event.preventDefault();
    setMessage(donationMessage, "", "");

    runBusy(donationSubmit, async function () {
      const data = await postAction({
        action: "updateDonation",
        currentAmount: Number(donationCurrentInput.value),
        goalAmount: Number(donationGoalInput.value),
        currency: donationCurrencyInput.value,
        reason: donationReasonInput.value
      });

      state.dashboard.donation = data.donation;
      donationReasonInput.value = "";
      renderDonation();
      setMessage(donationMessage, "Donation counter updated.", "success");
      await loadDashboard({ message: "Donation counter updated." });
    }).catch(function (error) {
      setMessage(donationMessage, error.message || "Could not update the donation counter.", "error");
    });
  });

  prepareAdminAuthentication();
})();
