(function () {
  const state = {
    dashboard: null,
    selectedUser: null,
    activePanel: "overview",
    busy: false,
    authenticationBusy: false,
    requiresTwoFactor: false,
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
  const authCodeField =
    document.getElementById(
      "admin-auth-code-field"
    );
  const authCodeInput =
    document.getElementById(
      "admin-auth-code"
    );
  const authSubmitButton =
    document.getElementById(
      "admin-auth-submit"
    );
  const authMessage =
    document.getElementById(
      "admin-auth-message"
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
  const reviewList =
    document.getElementById(
      "admin-review-list"
    );
  const materialList =
    document.getElementById(
      "admin-material-list"
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

  function showDenied(message) {
    state.adminAccessToken = "";
    state.adminAccessExpiresAt = "";

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
    state.adminAccessToken = "";
    state.adminAccessExpiresAt = "";

    loadingState.hidden = true;
    deniedState.hidden = true;
    app.hidden = true;
    authState.hidden = false;

    authCodeField.hidden =
      !state.requiresTwoFactor;
    authCodeInput.required =
      state.requiresTwoFactor;

    authPasswordInput.value = "";
    authCodeInput.value = "";

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

  authForm.addEventListener(
    "submit",
    async function (event) {
      event.preventDefault();

      if (state.authenticationBusy) {
        return;
      }

      const password =
        authPasswordInput.value;
      const authenticatorCode =
        authCodeInput.value
          .replace(/\D/g, "")
          .slice(0, 6);

      if (!password) {
        setMessage(
          authMessage,
          "Enter your administrator account password.",
          "error"
        );
        authPasswordInput.focus();
        return;
      }

      if (
        state.requiresTwoFactor &&
        !/^\d{6}$/.test(
          authenticatorCode
        )
      ) {
        setMessage(
          authMessage,
          "Enter your 6-digit authenticator code.",
          "error"
        );
        authCodeInput.focus();
        return;
      }

      state.authenticationBusy = true;

      const originalText =
        authSubmitButton.textContent;

      authSubmitButton.disabled = true;
      authSubmitButton.textContent =
        "Authenticating...";

      setMessage(
        authMessage,
        "Verifying administrator credentials...",
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
                "authenticateAdmin",
              password,
              authenticatorCode:
                state.requiresTwoFactor
                  ? authenticatorCode
                  : ""
            })
          }
        );

        state.adminAccessToken =
          String(
            data.adminAccessToken ||
            ""
          );
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
        authCodeInput.value = "";
        authState.hidden = true;
        loadingState.hidden = false;

        await loadDashboard();
      } catch (error) {
        if (error.requiresTwoFactor) {
          state.requiresTwoFactor = true;
          authCodeField.hidden = false;
          authCodeInput.required = true;
        }

        setMessage(
          authMessage,
          error.message ||
          "Administrator authentication failed.",
          "error"
        );

        if (
          error.requiresTwoFactor &&
          password
        ) {
          authCodeInput.focus();
        } else {
          authPasswordInput.focus();
        }
      } finally {
        state.authenticationBusy = false;
        authSubmitButton.disabled = false;
        authSubmitButton.textContent =
          originalText;
      }
    }
  );

  navButtons.forEach(function (button) {
      button.classList.toggle("active", button.dataset.adminPanel === panelName);
    });

    panels.forEach(function (panel) {
      panel.classList.toggle("active", panel.id === "admin-panel-" + panelName);
    });
  }

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

  function renderReviews() {
    const reviews = Array.isArray(state.dashboard.reviews) ? state.dashboard.reviews : [];
    const search = normalizeSearch(reviewSearch.value);
    const filtered = reviews.filter(function (review) {
      return !search || normalizeSearch([
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
        material.title,
        material.fileName,
        material.courseCode,
        material.professor,
        material.uploaderDisplayName,
        material.uploaderUid,
        material.materialType
      ].join(" ")).includes(search);
    });

    if (!filtered.length) {
      materialList.innerHTML = '<div class="admin-empty">No matching uploaded materials were found.</div>';
      return;
    }

    materialList.innerHTML = filtered.map(function (material) {
      return [
        '<article class="admin-item">',
          '<div class="admin-item-main">',
            '<div class="admin-item-title">', escapeHtml(material.title || material.fileName || "Course material"), '</div>',
            '<div class="admin-meta">',
              '<span>', escapeHtml(material.courseCode || "Course not listed"), '</span>',
              '<span>', escapeHtml(material.materialType || "Material"), '</span>',
              '<span>', escapeHtml(material.source || "firestore"), '</span>',
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
    renderReviews();
    renderMaterials();
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

  reviewSearch.addEventListener("input", renderReviews);
  materialSearch.addEventListener("input", renderMaterials);
  donationCurrentInput.addEventListener("input", updateDonationPreview);
  donationGoalInput.addEventListener("input", updateDonationPreview);
  donationCurrencyInput.addEventListener("change", updateDonationPreview);

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
    const button = event.target.closest("[data-delete-material]");

    if (!button) {
      return;
    }

    const reason = window.prompt("Reason for deleting this upload?", "");

    if (reason === null || !window.confirm("Delete this uploaded content?")) {
      return;
    }

    runBusy(button, async function () {
      await postAction({
        action: "deleteMaterial",
        materialId: button.dataset.deleteMaterial,
        source: button.dataset.materialSource,
        fileId: button.dataset.materialFileId,
        title: button.dataset.materialTitle,
        reason
      });
      await loadDashboard({ message: "Uploaded content deleted." });
    }).catch(function (error) {
      showToast(error.message || "Could not delete the upload.");
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
