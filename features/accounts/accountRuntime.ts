// @ts-nocheck
// Original AUC Atlas My Account behavior, retained in one isolated compatibility module.
// The new Next.js layout provides the header/footer and mounts this after hydration.
import { courses } from "../../data/courses";
import { professors } from "../../data/professors";
import { getApp, getApps, initializeApp } from "firebase/app";
import {
  GoogleAuthProvider, getAuth, inMemoryPersistence, linkWithPopup,
  setPersistence, signInWithCustomToken, signOut
} from "firebase/auth";

export function initializeAccounts(){
  const root=document.querySelector(".account-page");
  if(!root || root.getAttribute("data-atlas-accounts-initialized")==="true")return;
  root.setAttribute("data-atlas-accounts-initialized","true");
  window.aucAtlasCourses=courses;
  window.aucAtlasCourseProfessors={};
  window.aucAtlasProfessors=professors;

    const sidebarLinks = document.querySelectorAll("[data-account-panel]");
    const accountPanels = document.querySelectorAll(".account-panel");
    const accountDetailsPanel = document.getElementById("account-panel-details");
    const accountDetailsLoadingState = document.getElementById("account-details-loading-state");
    const accountSecurityPanel = document.getElementById("account-panel-security");
    const accountSecurityLoadingState = document.getElementById("account-security-loading-state");
    const photoInput = document.getElementById("account-photo-input");
    const photoChooseButton = document.getElementById("account-photo-choose-button");
    const photoRemoveButton = document.getElementById("account-photo-remove-button");
    const photoPreview = document.getElementById("account-photo-preview");
    const photoInitial = document.getElementById("account-photo-initial");
    const detailsForm = document.getElementById("account-details-form");
    const detailsButton = detailsForm ? detailsForm.querySelector(".account-primary-button") : null;
    const detailsMessage = document.getElementById("account-details-message");
    const logoutButton = document.getElementById("account-logout-sidebar");
    const accountNameInput = document.getElementById("account-name");
    const accountDisplayNameEditButton = document.getElementById("account-display-name-edit-button");
    const accountDisplayNameNote = document.getElementById("account-display-name-note");
    const accountEmailInput = document.getElementById("account-email");
    const accountMajorInput = document.getElementById("account-major");
    const accountMajorDropdown = document.getElementById("account-major-dropdown");
    const accountMajorValue = document.getElementById("account-major-value");
    const accountMajorMenu = document.getElementById("account-major-menu");
    const accountAucIdInput = document.getElementById("account-auc-id");
    const securityMessage = document.getElementById("security-message");
    const deleteAccountButton = document.getElementById("delete-account-button");
    const deleteAccountModal = document.getElementById("delete-account-modal");
    const deleteAccountModalBackdrop = document.getElementById("delete-account-modal-backdrop");
    const deleteAccountModalClose = document.getElementById("delete-account-modal-close");
    const deleteAccountModalCancel = document.getElementById("delete-account-modal-cancel");
    const deleteAccountForm = document.getElementById("delete-account-form");
    const deleteAccountPassword = document.getElementById("delete-account-password");
    const deleteAccountConfirmation = document.getElementById("delete-account-confirmation");
    const deleteAccountSubmit = document.getElementById("delete-account-submit");
    const deleteAccountMessage = document.getElementById("delete-account-message");
    const accountLoginSessionsList = document.getElementById("account-login-sessions-list");
    const changePasswordOpenButton = document.getElementById("change-password-open-button");
    const changePasswordForm = document.getElementById("change-password-form");
    const changePasswordCancelButton = document.getElementById("change-password-cancel-button");
    const changePasswordSubmitButton = document.getElementById("change-password-submit-button");
    const currentPasswordInput = document.getElementById("current-password");
    const newPasswordInput = document.getElementById("new-password");
    const confirmNewPasswordInput = document.getElementById("confirm-new-password");
    const changePasswordMessage = document.getElementById("change-password-message");
    const twoFactorAppStatus = document.getElementById("two-factor-app-status");
    const twoFactorEmailStatus = document.getElementById("two-factor-email-status");
    const twoFactorAppButton = document.getElementById("two-factor-app-button");
    const twoFactorEmailButton = document.getElementById("two-factor-email-button");
    const authenticatorModal = document.getElementById("authenticator-modal");
    const authenticatorModalBackdrop = document.getElementById("authenticator-modal-backdrop");
    const authenticatorModalClose = document.getElementById("authenticator-modal-close");
    const authenticatorModalCancel = document.getElementById("authenticator-modal-cancel");
    const authenticatorQrCode = document.getElementById("authenticator-qr-code");
    const authenticatorSecretKey = document.getElementById("authenticator-secret-key");
    const authenticatorSetupForm = document.getElementById("authenticator-setup-form");
    const authenticatorSetupCode = document.getElementById("authenticator-setup-code");
    const authenticatorCodeInputs = Array.from(document.querySelectorAll("[data-authenticator-code-input]"));
    const authenticatorSetupConfirm = document.getElementById("authenticator-setup-confirm");
    const authenticatorMessage = document.getElementById("authenticator-message");
    const securityAccessModal = document.getElementById("security-access-modal");
    const securityAccessModalBackdrop = document.getElementById("security-access-modal-backdrop");
    const securityAccessModalCancel = document.getElementById("security-access-modal-cancel");
    const securityAccessForm = document.getElementById("security-access-form");
    const securityAccessCodeInputs = Array.from(document.querySelectorAll("[data-security-access-code-input]"));
    const securityAccessSubmit = document.getElementById("security-access-submit");
    const securityAccessMessage = document.getElementById("security-access-message");
    const accountPage = document.querySelector(".account-page");
    const accountPageTitle = document.getElementById("account-page-title");
    const accountPageDescription = document.getElementById("account-page-description");
    const accountActivitySearch = document.getElementById("account-activity-search");
    const accountReviewCount = document.getElementById("account-review-count");
    const accountUploadCount = document.getElementById("account-upload-count");
    const accountActivityTabs = document.querySelectorAll("[data-account-activity-tab]");
    const accountActivitySections = document.querySelectorAll("[data-account-activity-section]");
    const accountReviewList = document.getElementById("account-review-list");
    const reviewsMessage = document.getElementById("reviews-message");
    const accountUploadList = document.getElementById("account-upload-list");
    const uploadsMessage = document.getElementById("uploads-message");
    const accountReviewEditor = document.getElementById("account-review-editor");
    const accountReviewEditorBackdrop = document.getElementById("account-review-editor-backdrop");
    const accountReviewEditorClose = document.getElementById("account-review-editor-close");
    const accountReviewEditorCancel = document.getElementById("account-review-editor-cancel");
    const accountReviewEditorForm = document.getElementById("account-review-editor-form");
    const accountReviewEditorTitle = document.getElementById("account-review-editor-title");
    const accountReviewEditorSubmit = document.getElementById("account-review-editor-submit");
    const accountReviewEditorMessage = document.getElementById("account-review-editor-message");
    const accountMaterialEditor = document.getElementById("account-material-editor");
    const accountMaterialEditorBackdrop = document.getElementById("account-material-editor-backdrop");
    const accountMaterialEditorClose = document.getElementById("account-material-editor-close");
    const accountMaterialEditorCancel = document.getElementById("account-material-editor-cancel");
    const accountMaterialEditorForm = document.getElementById("account-material-editor-form");
    const accountMaterialEditorTitle = document.getElementById("account-material-editor-title");
    const accountMaterialEditorSubmit = document.getElementById("account-material-editor-submit");
    const accountMaterialEditorMessage = document.getElementById("account-material-editor-message");

    const PROFILE_PHOTO_MAX_SIZE = 4 * 1024 * 1024;
    const PROFILE_PHOTO_ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];
    const DISPLAY_NAME_COOLDOWN_DAYS = 30;

    let accountCurrentUser = null;
    let accountTwoFactor = { appEnabled: false, emailEnabled: false };
    let securityPanelAccessToken = "";
    let securityAccessResolver = null;
    let activePhotoPreviewUrl = "";
    let originalDisplayName = "";
    let displayNameLastChangedAt = null;
    let displayNameEditMode = false;
    let accountReviewHistory = [];
    let accountReviewLoading = false;
    let activeAccountReviewId = "";
    let accountUploadHistory = [];
    let accountUploadLoading = false;
    let activeAccountMaterialId = "";

    function getAccountDateFromValue(value) {
      if (!value) {
        return null;
      }

      if (typeof value.toDate === "function") {
        return value.toDate();
      }

      if (typeof value.seconds === "number") {
        return new Date(value.seconds * 1000);
      }

      if (typeof value._seconds === "number") {
        return new Date(value._seconds * 1000);
      }

      const parsedDate = new Date(value);
      return Number.isNaN(parsedDate.getTime()) ? null : parsedDate;
    }

    function getDisplayNameUnlockDate() {
      const lastChangeDate = getAccountDateFromValue(displayNameLastChangedAt);

      if (!lastChangeDate) {
        return null;
      }

      return new Date(lastChangeDate.getTime() + DISPLAY_NAME_COOLDOWN_DAYS * 24 * 60 * 60 * 1000);
    }

    function getDisplayNameDaysLeft() {
      const unlockDate = getDisplayNameUnlockDate();

      if (!unlockDate) {
        return 0;
      }

      const millisecondsLeft = unlockDate.getTime() - Date.now();
      return millisecondsLeft > 0 ? Math.ceil(millisecondsLeft / (24 * 60 * 60 * 1000)) : 0;
    }

    function getDisplayNameUnlockDateText() {
      const unlockDate = getDisplayNameUnlockDate();

      if (!unlockDate) {
        return "";
      }

      return unlockDate.toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric"
      });
    }

    function updateDisplayNameLockState() {
      const daysLeft = getDisplayNameDaysLeft();

      if (daysLeft > 0) {
        displayNameEditMode = false;
        accountNameInput.readOnly = true;
        accountDisplayNameEditButton.disabled = true;
        accountDisplayNameEditButton.setAttribute("aria-label", "Display name locked");
        accountDisplayNameNote.textContent = "You can change your display name again on " + getDisplayNameUnlockDateText() + ".";
      } else {
        accountNameInput.readOnly = !displayNameEditMode;
        accountDisplayNameEditButton.disabled = false;
        accountDisplayNameEditButton.setAttribute("aria-label", "Edit display name");
        accountDisplayNameNote.textContent = "";
      }
    }

    function clearTemporaryProfilePhotoPreview() {
      if (activePhotoPreviewUrl) {
        URL.revokeObjectURL(activePhotoPreviewUrl);
        activePhotoPreviewUrl = "";
      }
    }

    function setPhotoButtonsDisabled(isDisabled) {
      if (photoChooseButton) {
        photoChooseButton.disabled = isDisabled;
      }

      if (photoRemoveButton) {
        photoRemoveButton.disabled = isDisabled;
      }
    }

    function setTemporaryProfilePhotoPreview(file) {
      clearTemporaryProfilePhotoPreview();

      activePhotoPreviewUrl = URL.createObjectURL(file);
      photoPreview.src = activePhotoPreviewUrl;
      photoPreview.hidden = false;
      photoInitial.hidden = true;
      photoRemoveButton.hidden = false;
    }

    function resetPhotoPreviewToCurrentUser() {
      clearTemporaryProfilePhotoPreview();
      photoInput.value = "";

      const user = accountCurrentUser || {};
      photoInitial.textContent = getAccountInitials(user);

      if (user.photoURL) {
        photoPreview.src = user.photoURL;
        photoPreview.hidden = false;
        photoInitial.hidden = true;
        photoRemoveButton.hidden = false;
      } else {
        photoPreview.src = "";
        photoPreview.hidden = true;
        photoInitial.hidden = false;
        photoRemoveButton.hidden = true;
      }
    }

    function validateProfilePhotoFile(file) {
      if (!file) {
        throw new Error("Please choose a profile photo.");
      }

      if (PROFILE_PHOTO_ALLOWED_TYPES.indexOf(file.type) === -1) {
        throw new Error("Please choose a PNG, JPG, or WebP image.");
      }

      if (file.size > PROFILE_PHOTO_MAX_SIZE) {
        throw new Error("Please choose an image up to 4MB.");
      }
    }

    async function requestProfilePhotoAction(payload) {
      const response = await fetch("/api/profile-photo", {
        method: "POST",
        credentials: "same-origin",
        headers: {
          "Accept": "application/json",
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload || {})
      });

      const data = await response.json().catch(function () {
        return {};
      });

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Could not update profile photo.");
      }

      return data;
    }

    async function uploadProfilePhotoToCloudinary(file) {
      const signatureData = await requestProfilePhotoAction({
        action: "signature"
      });

      const uploadForm = new FormData();
      uploadForm.append("file", file);
      uploadForm.append("api_key", signatureData.apiKey);
      uploadForm.append("timestamp", signatureData.timestamp);
      uploadForm.append("public_id", signatureData.publicId);
      uploadForm.append(
        "overwrite",
        signatureData.overwrite || "false"
      );
      uploadForm.append(
        "invalidate",
        signatureData.invalidate || "true"
      );
      uploadForm.append(
        "allowed_formats",
        signatureData.allowedFormats || "jpg,jpeg,png,webp"
      );
      uploadForm.append(
        "upload_preset",
        signatureData.uploadPreset
      );
      uploadForm.append("signature", signatureData.signature);

      const cloudinaryResponse = await fetch("https://api.cloudinary.com/v1_1/" + encodeURIComponent(signatureData.cloudName) + "/image/upload", {
        method: "POST",
        body: uploadForm
      });

      const cloudinaryData = await cloudinaryResponse.json().catch(function () {
        return {};
      });
      const uploadedVersion = Number(
        cloudinaryData.version
      );

      if (
        !cloudinaryResponse.ok ||
        !cloudinaryData.secure_url ||
        cloudinaryData.public_id !==
          signatureData.publicId ||
        !Number.isSafeInteger(uploadedVersion) ||
        uploadedVersion <= 0
      ) {
        throw new Error(cloudinaryData.error && cloudinaryData.error.message ? cloudinaryData.error.message : "Could not upload profile photo.");
      }

      return requestProfilePhotoAction({
        action: "save",
        publicId: cloudinaryData.public_id,
        version: uploadedVersion
      });
    }

    async function uploadProfilePhotoFile(file) {
      validateProfilePhotoFile(file);
      setTemporaryProfilePhotoPreview(file);
      setPhotoButtonsDisabled(true);
      photoChooseButton.textContent = "Uploading...";
      showMessage(detailsMessage, "", "");

      try {
        const data = await uploadProfilePhotoToCloudinary(file);

        photoInput.value = "";
        hydrateAccountDetails(data.user);
        showMessage(detailsMessage, "Profile photo updated.", "success");
      } catch (error) {
        resetPhotoPreviewToCurrentUser();
        showMessage(detailsMessage, error.message || "Could not upload profile photo.", "error");
      } finally {
        setPhotoButtonsDisabled(false);
        photoChooseButton.textContent = "Choose Photo";
        photoRemoveButton.textContent = "Remove Photo";
      }
    }

    async function removeProfilePhoto() {
      setPhotoButtonsDisabled(true);
      photoRemoveButton.textContent = "Removing...";
      showMessage(detailsMessage, "", "");

      try {
        const data = await requestProfilePhotoAction({
          action: "remove"
        });

        photoInput.value = "";
        hydrateAccountDetails(data.user);
        showMessage(detailsMessage, "Profile photo removed.", "success");
      } catch (error) {
        showMessage(detailsMessage, error.message || "Could not remove profile photo.", "error");
      } finally {
        setPhotoButtonsDisabled(false);
        photoChooseButton.textContent = "Choose Photo";
        photoRemoveButton.textContent = "Remove Photo";
      }
    }

    function activateAccountPanel(panelName, options) {
      const deferLoading = Boolean(options && options.deferLoading);
      const isActivity = panelName === "reviews";
      if (accountPage) accountPage.classList.toggle("is-activity-view", isActivity);
      if (accountPageTitle) accountPageTitle.textContent = isActivity ? "Activity History" : "My Account";
      if (accountPageDescription) {
        accountPageDescription.textContent = isActivity
          ? "Manage the reviews and course materials you've shared with AUC Atlas."
          : "Manage your details, degree progression, security, reviews, and uploaded materials.";
      }

      sidebarLinks.forEach(function (link) {
        link.classList.toggle("active", link.dataset.accountPanel === panelName);
      });

      accountPanels.forEach(function (panel) {
        panel.classList.toggle("active", panel.id === "account-panel-" + panelName);
      });

      window.location.hash = panelName;

      // On a deep-linked refresh, select the right panel before fetching profile
      // data, but defer protected requests until the session is verified.
      if (!deferLoading && panelName === "security") {
        loadAccountLoginSessions();
      }

      if (!deferLoading && panelName === "reviews") {
        loadAccountActivityHistory();
      }
    }

    async function showPanel(panelName) {
      if (panelName === "security") {
        if (!accountCurrentUser) {
          return false;
        }

        if (accountTwoFactor.appEnabled) {
          const accessGranted = await requestSecurityPanelAccess();

          if (!accessGranted) {
            return false;
          }
        }
      } else {
        securityPanelAccessToken = "";
      }

      activateAccountPanel(panelName);
      return true;
    }

    function showMessage(element, message, type) {
      if (!element) {
        return;
      }

      const messageType = type || (message ? "error" : "");
      element.textContent = message;
      element.className = "account-message" + (messageType ? " " + messageType : "");
    }

    function escapeAccountHtml(value) {
      return String(value || "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
    }

    function getAccountSessionDateLabel(value) {
      const date = new Date(value);

      if (!value || Number.isNaN(date.getTime())) {
        return "Not available";
      }

      return date.toLocaleString("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit"
      });
    }

    function getAccountSessionBrowserIcon(session) {
      const browserKey = String(session.browserKey || "").toLowerCase();
      const browserName = String(session.browserName || session.browserLabel || "").toLowerCase();

      if (browserKey === "safari" || browserName.includes("safari")) {
        return "safari-icon.png";
      }

      if (browserKey === "firefox" || browserName.includes("firefox")) {
        return "firefox-icon.png";
      }

      return "chrome-icon.png";
    }

    function renderAccountLoginSessions(sessions) {
      const safeSessions = Array.isArray(sessions) ? sessions : [];

      if (!accountLoginSessionsList) {
        return;
      }

      if (!safeSessions.length) {
        accountLoginSessionsList.innerHTML = `
          <div class="account-empty-state">
            <h3>No active sessions</h3>
            <p>No browsers or devices are currently signed in to your account.</p>
          </div>
        `;
        return;
      }

      accountLoginSessionsList.innerHTML = safeSessions.map(function (session) {
        const sessionId = session.id || "";
        const browserText = session.browserName || session.browserLabel || "Browser";
        const platformText = session.platformLabel || session.osName || "Device";
        const titleText = session.deviceLabel || (browserText + " on " + platformText);
        const browserIcon = getAccountSessionBrowserIcon(session);
        const cardClass = "account-login-session-card" + (session.current ? " current" : "");
        const currentBadge = session.current
          ? '<span class="account-login-session-current">Current</span>'
          : "";
        const sessionAction = !session.current && sessionId
          ? '<button class="account-login-session-revoke" type="button" data-account-session-revoke="' + escapeAccountHtml(sessionId) + '">SIGN OUT</button>'
          : "";
        const ipText = session.ipAddress
          ? '<span>IP ' + escapeAccountHtml(session.ipAddress) + '</span>'
          : "";

        return `
          <article class="${cardClass}">
            <div class="account-login-session-main">
              <div class="account-login-session-head">
                <div class="account-login-session-title">
                  <img class="account-login-session-browser-icon" src="${escapeAccountHtml(browserIcon)}" alt="" aria-hidden="true" loading="lazy" decoding="async">
                  <h4>${escapeAccountHtml(titleText)}</h4>
                </div>

                <div class="account-login-session-actions">
                  ${currentBadge}
                  ${sessionAction}
                </div>
              </div>

              <p>${escapeAccountHtml(browserText)} · ${escapeAccountHtml(platformText)}</p>

              <div class="account-login-session-meta">
                <span>Last active ${escapeAccountHtml(getAccountSessionDateLabel(session.lastSeenAt || session.createdAt))}</span>
                <span>Signed in ${escapeAccountHtml(getAccountSessionDateLabel(session.createdAt))}</span>
                ${ipText}
              </div>
            </div>
          </article>
        `;
      }).join("");
    }

    function setAccountSecurityLoading(loading) {
      if (accountSecurityPanel) {
        accountSecurityPanel.classList.toggle("is-loading", loading);
        accountSecurityPanel.setAttribute("aria-busy", loading ? "true" : "false");
      }
      if (accountSecurityLoadingState) {
        accountSecurityLoadingState.hidden = !loading;
      }
    }

    async function loadAccountLoginSessions() {
      if (!accountLoginSessionsList) {
        return;
      }

      setAccountSecurityLoading(true);
      showMessage(securityMessage, "", "");

      try {
        const response = await fetch("/api/sessions", {
          method: "GET",
          credentials: "same-origin",
          cache: "no-store",
          headers: {
            "Accept": "application/json",
            "X-AUC-Security-Access": securityPanelAccessToken
          }
        });
        const data = await response.json().catch(function () {
          return {};
        });

        if (!response.ok) {
          throw new Error(data.error || "Could not load signed-in sessions.");
        }

        renderAccountLoginSessions(data.sessions || []);
      } catch (error) {
        accountLoginSessionsList.innerHTML = `
          <div class="account-empty-state">
            <h3>Could not load sessions</h3>
            <p>Your signed-in browsers and devices could not be loaded right now.</p>
          </div>
        `;
        showMessage(securityMessage, error.message || "Could not load signed-in sessions.", "error");
      } finally {
        setAccountSecurityLoading(false);
      }
    }

    async function revokeAccountLoginSession(sessionId, button) {
      if (!sessionId) {
        showMessage(securityMessage, "Session not found.", "error");
        return;
      }

      if (button) {
        button.disabled = true;
        button.textContent = "Signing out...";
      }

      showMessage(securityMessage, "", "");

      try {
        const response = await fetch("/api/sessions", {
          method: "DELETE",
          credentials: "same-origin",
          headers: {
            "Accept": "application/json",
            "Content-Type": "application/json",
            "X-AUC-Security-Access": securityPanelAccessToken
          },
          body: JSON.stringify({
            sessionId: sessionId
          })
        });
        const data = await response.json().catch(function () {
          return {};
        });

        if (!response.ok) {
          throw new Error(data.error || "Could not sign out this session.");
        }

        if (data.currentSignedOut) {
          window.location.href = "/login";
          return;
        }

        renderAccountLoginSessions(data.sessions || []);
        showMessage(securityMessage, "Session signed out.", "success");
      } catch (error) {
        if (button) {
          button.disabled = false;
          button.textContent = "Sign out";
        }

        showMessage(securityMessage, error.message || "Could not sign out this session.", "error");
      }
    }

    function getAccountReviewDateLabel(value) {
      const date = new Date(value);

      if (!value || Number.isNaN(date.getTime())) {
        return "Recently submitted";
      }

      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric"
      });
    }

    function getAccountReviewProfessor(professorId) {
      const professors = Array.isArray(window.aucAtlasProfessors)
        ? window.aucAtlasProfessors
        : [];
      const normalizedProfessorId = String(professorId || "").trim().toLowerCase();

      return professors.find(function (professor) {
        return String(professor.id || "").trim().toLowerCase() === normalizedProfessorId;
      }) || null;
    }

function getAccountReviewProfessorUrl(professorId) {
  const slug = String(professorId || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return slug
    ? "/professors/" + encodeURIComponent(slug)
    : "";
}

    function renderAccountReviewStars(rating) {
      const safeRating = Math.max(0, Math.min(5, Math.round(Number(rating || 0))));

      if (!safeRating) {
        return '<span class="account-review-rating-text">Not rated</span>';
      }

      const stars = Array.from({ length: 5 }, function (_, index) {
        return '<span class="account-review-star' + (index < safeRating ? ' is-filled' : '') + '">&#9733;</span>';
      }).join("");

      return '<span class="account-review-stars" aria-label="' + safeRating + ' out of 5 stars">' + stars + '</span>';
    }

    function getAccountReviewById(reviewId) {
      return accountReviewHistory.find(function (review) {
        return String(review.id || "") === String(reviewId || "");
      }) || null;
    }

    function getAccountReviewEditorField(name) {
      return accountReviewEditorForm
        ? accountReviewEditorForm.elements.namedItem(name)
        : null;
    }

    function populateAccountReviewCourseSelect() {
      const select = getAccountReviewEditorField("courseTaken");
      const courses = Array.isArray(window.aucAtlasCourses)
        ? window.aucAtlasCourses.slice()
        : [];

      if (!select || select.dataset.courseOptionsReady === "true") {
        return;
      }

      courses.sort(function (firstCourse, secondCourse) {
        return String(firstCourse.code || "").localeCompare(
          String(secondCourse.code || "")
        );
      });

      select.innerHTML = "";

      const placeholder = document.createElement("option");

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

      select.dataset.courseOptionsReady = "true";
    }

    function setupAccountReviewCourseChoice() {
      populateAccountReviewCourseSelect();

      const select = getAccountReviewEditorField("courseTaken");

      if (
        !select ||
        select.dataset.accountReviewCourseChoiceReady === "true"
      ) {
        return;
      }

      select.dataset.accountReviewCourseChoiceReady = "true";
      select.classList.add("review-native-select");

      const choice = document.createElement("div");
      const button = document.createElement("button");
      const label = document.createElement("span");
      const menu = document.createElement("div");
      const searchWrap = document.createElement("div");
      const searchInput = document.createElement("input");

      choice.className = "review-choice";
      choice.setAttribute("data-account-review-course-choice", "");

      button.className = "review-choice-button";
      button.type = "button";
      button.setAttribute("aria-haspopup", "listbox");
      button.setAttribute("aria-expanded", "false");
      button.setAttribute("data-account-review-course-button", "");

      label.className = "review-choice-label";

      menu.className = "review-choice-menu";
      menu.setAttribute("role", "listbox");

      searchWrap.className = "review-choice-search-wrap";

      searchInput.type = "search";
      searchInput.className = "review-choice-search";
      searchInput.placeholder = "Search courses";
      searchInput.setAttribute("aria-label", "Search courses");
      searchInput.setAttribute("autocomplete", "new-password");
      searchInput.setAttribute("autocorrect", "off");
      searchInput.setAttribute("autocapitalize", "none");
      searchInput.setAttribute("spellcheck", "false");
      searchInput.setAttribute("data-lpignore", "true");
      searchInput.setAttribute("data-form-type", "other");

      function syncChoice() {
        const selectedOption = select.options[select.selectedIndex];

        label.textContent = selectedOption
          ? selectedOption.textContent
          : "Choose course";

        menu.querySelectorAll(".review-choice-option").forEach(function (optionButton) {
          optionButton.classList.toggle(
            "is-selected",
            optionButton.dataset.choiceValue === select.value
          );
        });
      }

      function filterOptions(query) {
        const terms = String(query || "")
          .toLowerCase()
          .trim()
          .split(/\s+/)
          .filter(Boolean);

        menu.querySelectorAll(".review-choice-option").forEach(function (optionButton) {
          const searchText = optionButton.dataset.choiceSearchText || "";
          const hasValue = Boolean(optionButton.dataset.choiceValue);
          const matches =
            !terms.length ||
            (
              hasValue &&
              terms.every(function (term) {
                return searchText.indexOf(term) !== -1;
              })
            );

          optionButton.hidden = !matches;
        });
      }

      function closeChoice() {
        choice.classList.remove("open");
        button.setAttribute("aria-expanded", "false");
        searchInput.value = "";
        filterOptions("");
      }

      searchWrap.appendChild(searchInput);
      menu.appendChild(searchWrap);

      Array.from(select.options).forEach(function (option) {
        const optionButton = document.createElement("button");

        optionButton.className = "review-choice-option";
        optionButton.type = "button";
        optionButton.disabled = option.disabled;
        optionButton.dataset.choiceValue = option.value;
        optionButton.dataset.choiceSearchText = (
          option.value + " " + option.textContent
        ).toLowerCase();
        optionButton.textContent = option.textContent;
        optionButton.setAttribute("role", "option");

        optionButton.addEventListener("click", function () {
          if (option.disabled) {
            return;
          }

          select.value = option.value;
          select.dispatchEvent(new Event("change", { bubbles: true }));
          closeChoice();
          button.focus();
        });

        menu.appendChild(optionButton);
      });

      searchInput.addEventListener("input", function () {
        filterOptions(searchInput.value);
      });

      searchInput.addEventListener("keydown", function (event) {
        if (event.key === "Escape") {
          event.preventDefault();
          closeChoice();
          button.focus();
        }
      });

      button.addEventListener("click", function () {
        const shouldOpen = !choice.classList.contains("open");

        choice.classList.toggle("open", shouldOpen);
        button.setAttribute("aria-expanded", shouldOpen ? "true" : "false");

        if (shouldOpen) {
          window.setTimeout(function () {
            searchInput.focus();
          }, 0);
        } else {
          closeChoice();
        }
      });

      document.addEventListener("click", function (event) {
        if (!choice.contains(event.target)) {
          closeChoice();
        }
      });

      select.addEventListener("change", syncChoice);

      button.appendChild(label);
      choice.appendChild(button);
      choice.appendChild(menu);
      select.insertAdjacentElement("afterend", choice);
      syncChoice();

      setupAccountReviewAdditionalChoices();
      syncAccountReviewRecommendationReason();
    }

    function syncAccountReviewRecommendationReason() {
      if (!accountReviewEditorForm) {
        return;
      }

      const recommendationSelect = getAccountReviewEditorField("recommendation");
      const reasonField = accountReviewEditorForm.querySelector(
        "[data-account-review-depends-reason]"
      );
      const reasonInput = getAccountReviewEditorField("recommendationReason");

      if (!recommendationSelect || !reasonField) {
        return;
      }

      const shouldShow = recommendationSelect.value === "Depends";

      reasonField.hidden = !shouldShow;

      if (!shouldShow && reasonInput) {
        reasonInput.value = "";
      }
    }

    function setupAccountReviewAdditionalChoices() {
      if (!accountReviewEditorForm) {
        return;
      }

      accountReviewEditorForm.querySelectorAll("select").forEach(function (select) {
        if (
          select.name === "courseTaken" ||
          select.dataset.accountReviewChoiceReady === "true"
        ) {
          return;
        }

        select.dataset.accountReviewChoiceReady = "true";
        select.classList.add("review-native-select");

        const choice = document.createElement("div");
        const button = document.createElement("button");
        const label = document.createElement("span");
        const menu = document.createElement("div");

        choice.className = "review-choice";
        choice.setAttribute("data-account-review-choice", "");

        button.className = "review-choice-button";
        button.type = "button";
        button.setAttribute("aria-haspopup", "listbox");
        button.setAttribute("aria-expanded", "false");

        label.className = "review-choice-label";

        menu.className = "review-choice-menu";
        menu.setAttribute("role", "listbox");

        function syncChoice() {
          const selectedOption = select.options[select.selectedIndex];

          label.textContent = selectedOption
            ? selectedOption.textContent
            : "Choose an option";

          menu.querySelectorAll(".review-choice-option").forEach(function (optionButton) {
            optionButton.classList.toggle(
              "is-selected",
              optionButton.dataset.choiceValue === select.value
            );
          });
        }

        function closeChoice() {
          choice.classList.remove("open");
          button.setAttribute("aria-expanded", "false");
        }

        Array.from(select.options).forEach(function (option) {
          const optionButton = document.createElement("button");

          optionButton.className = "review-choice-option";
          optionButton.type = "button";
          optionButton.disabled = option.disabled;
          optionButton.dataset.choiceValue = option.value;
          optionButton.textContent = option.textContent;
          optionButton.setAttribute("role", "option");

          optionButton.addEventListener("click", function () {
            if (option.disabled) {
              return;
            }

            select.value = option.value;
            select.dispatchEvent(new Event("change", { bubbles: true }));
            closeChoice();
            button.focus();
          });

          menu.appendChild(optionButton);
        });

        button.addEventListener("click", function () {
          const shouldOpen = !choice.classList.contains("open");

          choice.classList.toggle("open", shouldOpen);
          button.setAttribute("aria-expanded", shouldOpen ? "true" : "false");
        });

        document.addEventListener("click", function (event) {
          if (!choice.contains(event.target)) {
            closeChoice();
          }
        });

        select.addEventListener("change", syncChoice);

        button.appendChild(label);
        choice.appendChild(button);
        choice.appendChild(menu);
        select.insertAdjacentElement("afterend", choice);
        syncChoice();
      });

      const recommendationSelect = getAccountReviewEditorField("recommendation");

      if (
        recommendationSelect &&
        recommendationSelect.dataset.accountReviewDependsReady !== "true"
      ) {
        recommendationSelect.dataset.accountReviewDependsReady = "true";
        recommendationSelect.addEventListener(
          "change",
          syncAccountReviewRecommendationReason
        );
      }

      syncAccountReviewRecommendationReason();
    }

    function resetAccountReviewCourseChoice() {
      if (!accountReviewEditorForm) {
        return;
      }

      accountReviewEditorForm.querySelectorAll(".review-choice").forEach(function (choice) {
        choice.classList.remove("open");

        const button = choice.querySelector(".review-choice-button");
        const searchInput = choice.querySelector(".review-choice-search");

        if (button) {
          button.setAttribute("aria-expanded", "false");
        }

        if (searchInput) {
          searchInput.value = "";
        }

        choice.querySelectorAll(".review-choice-option").forEach(function (optionButton) {
          optionButton.hidden = false;
        });
      });

      accountReviewEditorForm.querySelectorAll("select").forEach(function (select) {
        select.dispatchEvent(new Event("change", { bubbles: true }));
      });

      syncAccountReviewRecommendationReason();
    }

    function isValidAccountReviewCourse(courseCode) {
      const normalizedCode = String(courseCode || "")
        .replace(/\s+/g, " ")
        .trim()
        .toUpperCase();
      const courses = Array.isArray(window.aucAtlasCourses)
        ? window.aucAtlasCourses
        : [];

      return courses.some(function (course) {
        return String(course && course.code ? course.code : "")
          .replace(/\s+/g, " ")
          .trim()
          .toUpperCase() === normalizedCode;
      });
    }

    function setAccountReviewEditorValue(name, value) {
      const field = getAccountReviewEditorField(name);

      if (!field) {
        return;
      }

      field.value =
        value === undefined || value === null
          ? ""
          : String(value);

      if (field.tagName === "SELECT") {
        field.dispatchEvent(new Event("change", { bubbles: true }));
      }
    }

    function closeAccountReviewEditor() {
      if (!accountReviewEditor) {
        return;
      }

      accountReviewEditor.hidden = true;
      document.body.classList.remove("account-review-editor-open");
      activeAccountReviewId = "";

      if (accountReviewEditorForm) {
        accountReviewEditorForm.reset();
      }

      resetAccountReviewCourseChoice();
      showMessage(accountReviewEditorMessage, "", "");
    }

    function openAccountReviewEditor(reviewId) {
      const review = getAccountReviewById(reviewId);

      if (!review || !accountReviewEditor || !accountReviewEditorForm) {
        showMessage(reviewsMessage, "Review not found.", "error");
        return;
      }

      setupAccountReviewCourseChoice();

      activeAccountReviewId = String(review.id || "");
      accountReviewEditorForm.reset();
      resetAccountReviewCourseChoice();

      setAccountReviewEditorValue("reviewId", activeAccountReviewId);
      setAccountReviewEditorValue("courseTaken", review.courseTaken);
      setAccountReviewEditorValue("semesterTaken", review.semesterTaken);
      setAccountReviewEditorValue("rating", review.rating);
      setAccountReviewEditorValue("recommendationReason", review.recommendationReason);
      setAccountReviewEditorValue("recommendation", review.recommendation);
      setAccountReviewEditorValue("attendancePolicy", review.attendancePolicy);
      setAccountReviewEditorValue("workload", review.workload);
      setAccountReviewEditorValue("lectureUsefulness", review.lectureUsefulness);
      setAccountReviewEditorValue("officeHours", review.officeHours);
      setAccountReviewEditorValue("gradingStyle", review.gradingStyle);
      setAccountReviewEditorValue("examDifficulty", review.examDifficulty);
      setAccountReviewEditorValue("gradingTransparency", review.gradingTransparency);
      setAccountReviewEditorValue("feedbackQuality", review.feedbackQuality);
      setAccountReviewEditorValue("studentNote", review.studentNote);

      accountReviewEditorTitle.textContent =
        review.professorName || "Professor Review";

      showMessage(accountReviewEditorMessage, "", "");
      accountReviewEditor.hidden = false;
      document.body.classList.add("account-review-editor-open");

      window.setTimeout(function () {
        const courseButton = accountReviewEditorForm.querySelector(
          "[data-account-review-course-button]"
        );

        if (courseButton) {
          courseButton.focus();
        }
      }, 50);
    }

    function getAccountReviewEditorPayload() {
      const formData = new FormData(accountReviewEditorForm);

      return {
        reviewId: String(formData.get("reviewId") || activeAccountReviewId || ""),
        courseTaken: String(formData.get("courseTaken") || "").trim(),
        semesterTaken: String(formData.get("semesterTaken") || "").trim(),
        rating: Number(formData.get("rating") || 0),
        recommendation: String(formData.get("recommendation") || ""),
        recommendationReason: String(formData.get("recommendationReason") || "").trim(),
        attendancePolicy: String(formData.get("attendancePolicy") || ""),
        workload: String(formData.get("workload") || ""),
        lectureUsefulness: String(formData.get("lectureUsefulness") || ""),
        officeHours: String(formData.get("officeHours") || ""),
        gradingStyle: String(formData.get("gradingStyle") || ""),
        examDifficulty: String(formData.get("examDifficulty") || ""),
        gradingTransparency: String(formData.get("gradingTransparency") || ""),
        feedbackQuality: String(formData.get("feedbackQuality") || ""),
        studentNote: String(formData.get("studentNote") || "").trim()
      };
    }

    async function saveAccountReviewChanges() {
      const payload = getAccountReviewEditorPayload();

      if (!isValidAccountReviewCourse(payload.courseTaken)) {
        showMessage(
          accountReviewEditorMessage,
          "Please choose a course from the course list.",
          "error"
        );

        const courseButton = accountReviewEditorForm.querySelector(
          "[data-account-review-course-button]"
        );

        if (courseButton) {
          courseButton.focus();
        }

        return;
      }

      if (payload.recommendation === "Depends" && !payload.recommendationReason) {
        showMessage(accountReviewEditorMessage, "Please explain what the recommendation depends on.", "error");
        return;
      }

      accountReviewEditorSubmit.disabled = true;
      accountReviewEditorSubmit.textContent = "Saving...";
      showMessage(accountReviewEditorMessage, "", "");

      try {
        const response = await fetch("/api/professor-reviews", {
          method: "PATCH",
          credentials: "same-origin",
          headers: {
            "Accept": "application/json",
            "Content-Type": "application/json"
          },
          body: JSON.stringify(payload)
        });

        const data = await response.json().catch(function () {
          return {};
        });

        if (!response.ok || !data.success) {
          throw new Error(data.error || "Could not update your review.");
        }

        renderAccountReviewHistory(data.reviews || []);
        closeAccountReviewEditor();
        showMessage(reviewsMessage, "Review updated.", "success");
      } catch (error) {
        showMessage(accountReviewEditorMessage, error.message || "Could not update your review.", "error");
      } finally {
        accountReviewEditorSubmit.disabled = false;
        accountReviewEditorSubmit.textContent = "Save Changes";
      }
    }

    async function deleteAccountReview(reviewId, button) {
      const review = getAccountReviewById(reviewId);

      if (!review) {
        showMessage(reviewsMessage, "Review not found.", "error");
        return;
      }

      const confirmed = window.confirm(
        "Delete your review for " + (review.professorName || "this professor") + "? This cannot be undone."
      );

      if (!confirmed) {
        return;
      }

      if (button) {
        button.disabled = true;
        button.textContent = "Deleting...";
      }

      showMessage(reviewsMessage, "", "");

      try {
        const response = await fetch("/api/professor-reviews", {
          method: "DELETE",
          credentials: "same-origin",
          headers: {
            "Accept": "application/json",
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            reviewId: reviewId
          })
        });

        const data = await response.json().catch(function () {
          return {};
        });

        if (!response.ok || !data.success) {
          throw new Error(data.error || "Could not delete your review.");
        }

        renderAccountReviewHistory(data.reviews || []);
        showMessage(reviewsMessage, "Review deleted.", "success");
      } catch (error) {
        if (button) {
          button.disabled = false;
          button.textContent = "Delete";
        }

        showMessage(reviewsMessage, error.message || "Could not delete your review.", "error");
      }
    }

    function renderAccountReviewHistory(reviews) {
      const safeReviews = Array.isArray(reviews) ? reviews : [];
      accountReviewHistory = safeReviews.slice().sort(function (a, b) {
        const firstDate = getAccountDateFromValue(a.createdAt);
        const secondDate = getAccountDateFromValue(b.createdAt);
        return (secondDate ? secondDate.getTime() : 0) - (firstDate ? firstDate.getTime() : 0);
      });

      if (accountReviewCount) {
        accountReviewCount.textContent = accountReviewHistory.length.toLocaleString("en-US");
      }

      if (!accountReviewList) return;

      const search = String(accountActivitySearch ? accountActivitySearch.value : "").trim().toLowerCase();
      const filteredReviews = accountReviewHistory.filter(function (review) {
        const professor = getAccountReviewProfessor(review.professorId);
        return !search || [
          review.professorName, professor && professor.name, review.courseTaken,
          review.semesterTaken, review.studentNote
        ].join(" ").toLowerCase().includes(search);
      });

      if (!filteredReviews.length) {
        accountReviewList.innerHTML = search && accountReviewHistory.length
          ? `<div class="account-empty-state"><h3>No matching reviews</h3><p>Try a different professor, course, or keyword.</p></div>`
          : `<div class="account-empty-state"><h3>No reviews yet</h3><p>Your professor and course reviews will appear here after submission.</p></div>`;
        return;
      }

      accountReviewList.innerHTML = filteredReviews.map(function (review) {
        const reviewId = String(review.id || "");
        const professorId = String(review.professorId || "");
        const professor = getAccountReviewProfessor(professorId);
        const professorName = review.professorName || (professor && professor.name) || "Professor review";
        const professorImage = professor && professor.image ? professor.image : "/user.png";
        const professorUrl = getAccountReviewProfessorUrl(professorId);
        const rating = Number(review.rating || 0);
        const professorPhoto = professorUrl
          ? `
              <a class="account-review-professor-photo" href="${escapeAccountHtml(professorUrl)}" aria-label="Open ${escapeAccountHtml(professorName)} profile">
                <img src="${escapeAccountHtml(professorImage)}" alt="${escapeAccountHtml(professorName)}" loading="lazy">
              </a>
            `
          : `
              <div class="account-review-professor-photo">
                <img src="${escapeAccountHtml(professorImage)}" alt="${escapeAccountHtml(professorName)}" loading="lazy">
              </div>
            `;
        const professorNameMarkup = professorUrl
          ? `<a class="account-review-professor-name" href="${escapeAccountHtml(professorUrl)}">${escapeAccountHtml(professorName)}</a>`
          : escapeAccountHtml(professorName);
        const reviewActions = reviewId
          ? `
              <button class="account-review-action-button" type="button" data-account-review-edit="${escapeAccountHtml(reviewId)}">Edit</button>
              <button class="account-review-action-button is-danger" type="button" data-account-review-delete="${escapeAccountHtml(reviewId)}">Delete</button>
            `
          : "";

        return `
          <article class="account-review-item">
            ${professorPhoto}
            <div class="account-review-body">
              <div class="account-review-head">
                <h3>${professorNameMarkup}</h3>
                <p>${escapeAccountHtml(getAccountReviewDateLabel(review.createdAt))}</p>
              </div>
              <div class="account-review-meta">
                <span>${escapeAccountHtml(review.courseTaken || "Course not listed")}</span>
                <span>${escapeAccountHtml(review.semesterTaken || "Semester not listed")}</span>
              </div>
              ${review.studentNote
                ? `<p class="account-review-copy">${escapeAccountHtml(review.studentNote)}</p>`
                : '<p class="account-review-copy is-empty">Rating only</p>'}
            </div>
            <div class="account-activity-item-aside">
              <span class="account-review-rating">${renderAccountReviewStars(rating)}</span>
              <div class="account-review-actions">${reviewActions}</div>
            </div>
          </article>
        `;
      }).join("");
    }

    function renderAccountActivitySkeleton(type) {
      const list = type === "uploads" ? accountUploadList : accountReviewList;
      if (!list) return;

      const rows = Array.from({ length: 3 }, function () {
        return `
          <div class="account-skeleton-list-row" aria-hidden="true">
            <span class="account-skeleton-shape account-skeleton-photo"></span>
            <div class="account-skeleton-row-copy">
              <span class="account-skeleton-shape account-skeleton-text"></span>
              <span class="account-skeleton-shape account-skeleton-short"></span>
              <span class="account-skeleton-shape account-skeleton-description"></span>
            </div>
            <div class="account-skeleton-row-aside">
              <span class="account-skeleton-shape ${type === "uploads" ? "account-skeleton-button" : "account-skeleton-stars"}"></span>
              <span class="account-skeleton-shape account-skeleton-button"></span>
            </div>
          </div>
        `;
      }).join("");

      list.innerHTML = `
        <div class="account-skeleton-list" role="status" aria-label="Loading ${type}">
          ${rows}
        </div>
      `;
    }

    async function loadAccountReviewHistory() {
      if (!accountReviewList) {
        return;
      }

      accountReviewLoading = true;
      if (accountReviewCount) accountReviewCount.textContent = "—";
      showMessage(reviewsMessage, "", "");
      renderAccountActivitySkeleton("reviews");

      try {
        const response = await fetch("/api/professor-reviews?mine=true", {
          method: "GET",
          credentials: "same-origin",
          cache: "no-store",
          headers: {
            "Accept": "application/json"
          }
        });

        const data = await response.json().catch(function () {
          return {};
        });

        if (!response.ok) {
          throw new Error(data.error || "Could not load your reviews.");
        }

        accountReviewLoading = false;
        renderAccountReviewHistory(data.reviews || []);
      } catch (error) {
        accountReviewLoading = false;
        if (accountReviewCount) accountReviewCount.textContent = "—";
        accountReviewHistory = [];
        accountReviewList.innerHTML = `
          <div class="account-empty-state">
            <h3>Could not load reviews</h3>
            <p>Your review history could not be loaded right now.</p>
          </div>
        `;
        showMessage(reviewsMessage, error.message || "Could not load your reviews.", "error");
      }
    }

    function setAccountActivityTab(tabName) {
      const activeTab = tabName === "uploads" ? "uploads" : "reviews";
      const currentTab = Array.from(accountActivityTabs).find(function (tab) {
        return tab.classList.contains("active");
      });
      const tabChanged = currentTab && currentTab.dataset.accountActivityTab !== activeTab;

      if (accountActivitySearch) {
        if (tabChanged) accountActivitySearch.value = "";
        accountActivitySearch.placeholder = activeTab === "uploads" ? "Search uploads" : "Search reviews";
        accountActivitySearch.setAttribute("aria-label", accountActivitySearch.placeholder);
      }

      accountActivityTabs.forEach(function (tab) {
        const isActive = tab.dataset.accountActivityTab === activeTab;

        tab.classList.toggle("active", isActive);
        tab.setAttribute("aria-selected", isActive ? "true" : "false");
        tab.tabIndex = isActive ? 0 : -1;
      });

      accountActivitySections.forEach(function (section) {
        section.hidden =
          section.dataset.accountActivitySection !== activeTab;
      });

      if (activeTab === "uploads") {
        if (accountUploadLoading) renderAccountActivitySkeleton("uploads");
        else renderAccountUploadHistory(accountUploadHistory);
      } else {
        if (accountReviewLoading) renderAccountActivitySkeleton("reviews");
        else renderAccountReviewHistory(accountReviewHistory);
      }
    }

    function getAccountUploadById(materialId) {
      return accountUploadHistory.find(function (material) {
        return String(material.id || "") === String(materialId || "");
      }) || null;
    }

    function formatAccountMaterialSize(value) {
      const bytes = Number(value || 0);

      if (!Number.isFinite(bytes) || bytes <= 0) {
        return "Size not listed";
      }

      const units = ["B", "KB", "MB", "GB"];
      let size = bytes;
      let unitIndex = 0;

      while (size >= 1024 && unitIndex < units.length - 1) {
        size /= 1024;
        unitIndex += 1;
      }

      return (
        (unitIndex === 0 ? Math.round(size) : size.toFixed(size >= 10 ? 0 : 1)) +
        " " +
        units[unitIndex]
      );
    }

    function renderAccountUploadHistory(materials) {
      const safeMaterials = Array.isArray(materials) ? materials : [];
      accountUploadHistory = safeMaterials.slice().sort(function (a, b) {
        const firstDate = getAccountDateFromValue(a.createdAt);
        const secondDate = getAccountDateFromValue(b.createdAt);
        return (secondDate ? secondDate.getTime() : 0) - (firstDate ? firstDate.getTime() : 0);
      });

      if (accountUploadCount) {
        accountUploadCount.textContent = accountUploadHistory.length.toLocaleString("en-US");
      }

      if (!accountUploadList) return;

      const search = String(accountActivitySearch ? accountActivitySearch.value : "").trim().toLowerCase();
      const filteredMaterials = accountUploadHistory.filter(function (material) {
        return !search || [
          material.title, material.fileName, material.courseCode,
          material.materialType, material.professor, material.semester
        ].join(" ").toLowerCase().includes(search);
      });

      if (!filteredMaterials.length) {
        accountUploadList.innerHTML = search && accountUploadHistory.length
          ? `<div class="account-empty-state"><h3>No matching uploads</h3><p>Try another material name, course, or category.</p></div>`
          : `<div class="account-empty-state"><h3>No uploads yet</h3><p>Course materials uploaded from your account will appear here.</p></div>`;
        return;
      }

      accountUploadList.innerHTML = filteredMaterials.map(function (material) {
        const materialId = String(material.id || "");
        const title = material.title || "Course material";
        const fileName = material.fileName || "File name not listed";
        const extensionMatch = fileName.match(/\.([^.]+)$/);
        const fileExtension = extensionMatch ? extensionMatch[1].toLowerCase() : "";
        const extensionLabel = fileExtension ? fileExtension.slice(0, 5).toUpperCase() : "FILE";
        const fileIconMap = {
          pdf: "pdf.png", doc: "doc.png", docx: "doc.png",
          xls: "xls.png", xlsx: "xls.png", ppt: "ppt.png",
          pptx: "ppt.png", png: "png.png", jpg: "jpg.png", jpeg: "jpg.png"
        };
        const fileIconUrl = fileIconMap[fileExtension] || "";
        const fileIconMarkup = fileIconUrl
          ? `<img class="account-upload-file-icon" src="${escapeAccountHtml("/" + fileIconUrl)}" alt="" aria-hidden="true" loading="lazy">`
          : `<span class="account-upload-file-icon account-upload-file-icon-fallback" aria-hidden="true">${escapeAccountHtml(extensionLabel)}</span>`;

        const downloadUrl = String(material.downloadUrl || "");
        const downloadAction = downloadUrl
          ? `<a class="account-upload-download-button" href="${escapeAccountHtml(downloadUrl)}" target="_blank" rel="noopener">Download</a>`
          : "";
        const managementActions = materialId
          ? `
              <button class="account-review-action-button" type="button" data-account-material-edit="${escapeAccountHtml(materialId)}">Edit</button>
              <button class="account-review-action-button is-danger" type="button" data-account-material-delete="${escapeAccountHtml(materialId)}">Delete</button>
            `
          : "";

        return `
          <article class="account-upload-item">
            <span class="account-upload-file-visual">${fileIconMarkup}</span>
            <div class="account-upload-body">
              <div class="account-upload-head">
                <h3>${escapeAccountHtml(title)}</h3>
                <p>${escapeAccountHtml(getAccountReviewDateLabel(material.createdAt))}</p>
              </div>
              <div class="account-upload-meta">
                <span>${escapeAccountHtml(material.courseCode || "Course not listed")}</span>
                <span>${escapeAccountHtml(material.materialType || "Category not listed")}</span>
                <span>${escapeAccountHtml(material.professor || "Professor not listed")}</span>
                <span>${escapeAccountHtml(material.semester || "Semester not listed")}</span>
              </div>
              <p class="account-upload-file-name">
                ${escapeAccountHtml(fileName)} ·
                ${escapeAccountHtml(formatAccountMaterialSize(material.size))}
              </p>
            </div>
            <div class="account-activity-item-aside">
              <div class="account-upload-actions">
                ${downloadAction}
                ${managementActions}
              </div>
            </div>
          </article>
        `;
      }).join("");
    }

    async function loadAccountUploadHistory() {
      if (!accountUploadList) {
        return;
      }

      accountUploadLoading = true;
      if (accountUploadCount) accountUploadCount.textContent = "—";
      showMessage(uploadsMessage, "", "");
      renderAccountActivitySkeleton("uploads");

      try {
        const response = await fetch("/api/course-materials?mine=true", {
          method: "GET",
          credentials: "same-origin",
          cache: "no-store",
          headers: {
            "Accept": "application/json"
          }
        });

        const data = await response.json().catch(function () {
          return {};
        });

        if (!response.ok) {
          throw new Error(data.error || "Could not load your uploads.");
        }

        accountUploadLoading = false;
        renderAccountUploadHistory(data.materials || []);
      } catch (error) {
        accountUploadLoading = false;
        if (accountUploadCount) accountUploadCount.textContent = "—";
        accountUploadHistory = [];
        accountUploadList.innerHTML = `
          <div class="account-empty-state">
            <h3>Could not load uploads</h3>
            <p>Your upload history could not be loaded right now.</p>
          </div>
        `;

        showMessage(
          uploadsMessage,
          error.message || "Could not load your uploads.",
          "error"
        );
      }
    }

    function loadAccountActivityHistory() {
      loadAccountReviewHistory();
      loadAccountUploadHistory();
    }

    function closeAccountMaterialEditor() {
      if (!accountMaterialEditor) {
        return;
      }

      accountMaterialEditor.hidden = true;
      document.body.classList.remove("account-review-editor-open");
      activeAccountMaterialId = "";

      if (accountMaterialEditorForm) {
        accountMaterialEditorForm.reset();
      }

      showMessage(accountMaterialEditorMessage, "", "");
    }

    function openAccountMaterialEditor(materialId) {
      const material = getAccountUploadById(materialId);

      if (!material || !accountMaterialEditor || !accountMaterialEditorForm) {
        showMessage(uploadsMessage, "Upload not found.", "error");
        return;
      }

      const materialIdField =
        accountMaterialEditorForm.elements.namedItem("materialId");
      const titleField =
        accountMaterialEditorForm.elements.namedItem("title");
      const materialTypeField =
        accountMaterialEditorForm.elements.namedItem("materialType");

      activeAccountMaterialId = String(material.id || "");
      accountMaterialEditorForm.reset();

      if (materialIdField) {
        materialIdField.value = activeAccountMaterialId;
      }

      if (titleField) {
        titleField.value = material.title || "";
      }

      if (materialTypeField) {
        materialTypeField.value = material.materialType || "";
      }

      accountMaterialEditorTitle.textContent =
        material.title || "Course Material";

      showMessage(accountMaterialEditorMessage, "", "");
      accountMaterialEditor.hidden = false;
      document.body.classList.add("account-review-editor-open");

      window.setTimeout(function () {
        if (titleField) {
          titleField.focus();
          titleField.select();
        }
      }, 50);
    }

    async function saveAccountMaterialChanges() {
      const formData = new FormData(accountMaterialEditorForm);
      const materialId = String(
        formData.get("materialId") ||
        activeAccountMaterialId ||
        ""
      );
      const title = String(formData.get("title") || "").trim();
      const materialType = String(
        formData.get("materialType") || ""
      ).trim();

      if (!materialId || !title || !materialType) {
        showMessage(
          accountMaterialEditorMessage,
          "Enter a material name and choose a category.",
          "error"
        );
        return;
      }

      accountMaterialEditorSubmit.disabled = true;
      accountMaterialEditorSubmit.textContent = "Saving...";
      showMessage(accountMaterialEditorMessage, "", "");

      try {
        const response = await fetch("/api/course-materials", {
          method: "PATCH",
          credentials: "same-origin",
          headers: {
            "Accept": "application/json",
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            materialId,
            title,
            materialType
          })
        });

        const data = await response.json().catch(function () {
          return {};
        });

        if (!response.ok || !data.success) {
          throw new Error(data.error || "Could not update this upload.");
        }

        renderAccountUploadHistory(data.materials || []);
        closeAccountMaterialEditor();
        setAccountActivityTab("uploads");
        showMessage(uploadsMessage, "Upload updated.", "success");
      } catch (error) {
        showMessage(
          accountMaterialEditorMessage,
          error.message || "Could not update this upload.",
          "error"
        );
      } finally {
        accountMaterialEditorSubmit.disabled = false;
        accountMaterialEditorSubmit.textContent = "Save Changes";
      }
    }

    async function deleteAccountMaterial(materialId, button) {
      const material = getAccountUploadById(materialId);

      if (!material) {
        showMessage(uploadsMessage, "Upload not found.", "error");
        return;
      }

      const confirmed = window.confirm(
        "Delete \"" +
        (material.title || "this course material") +
        "\"? This cannot be undone."
      );

      if (!confirmed) {
        return;
      }

      if (button) {
        button.disabled = true;
        button.textContent = "Deleting...";
      }

      showMessage(uploadsMessage, "", "");

      try {
        const response = await fetch("/api/course-materials", {
          method: "DELETE",
          credentials: "same-origin",
          headers: {
            "Accept": "application/json",
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            materialId
          })
        });

        const data = await response.json().catch(function () {
          return {};
        });

        if (!response.ok || !data.success) {
          throw new Error(data.error || "Could not delete this upload.");
        }

        renderAccountUploadHistory(data.materials || []);
        setAccountActivityTab("uploads");
        showMessage(uploadsMessage, "Upload deleted.", "success");
      } catch (error) {
        if (button) {
          button.disabled = false;
          button.textContent = "Delete";
        }

        showMessage(
          uploadsMessage,
          error.message || "Could not delete this upload.",
          "error"
        );
      }
    }

    function resetDeleteAccountModal() {
      if (deleteAccountForm) {
        deleteAccountForm.reset();
      }

      if (deleteAccountSubmit) {
        deleteAccountSubmit.disabled = false;
        deleteAccountSubmit.textContent = "Delete Account";
      }

      showMessage(deleteAccountMessage, "", "");
    }

    function closeDeleteAccountModal() {
      if (!deleteAccountModal) {
        return;
      }

      deleteAccountModal.hidden = true;
      document.body.classList.remove(
        "account-review-editor-open"
      );

      resetDeleteAccountModal();

      if (deleteAccountButton) {
        deleteAccountButton.focus();
      }
    }

    async function openDeleteAccountModal() {
      if (
        !deleteAccountModal ||
        !deleteAccountForm
      ) {
        showMessage(
          securityMessage,
          "Could not open account deletion.",
          "error"
        );
        return;
      }

      const accessGranted =
        await requestSecurityPanelAccess();

      if (!accessGranted) {
        return;
      }

      resetDeleteAccountModal();
      deleteAccountModal.hidden = false;

      document.body.classList.add(
        "account-review-editor-open"
      );

      window.setTimeout(function () {
        if (deleteAccountPassword) {
          deleteAccountPassword.focus();
        }
      }, 50);
    }

    async function submitDeleteAccount() {
      const currentPassword = deleteAccountPassword
        ? deleteAccountPassword.value
        : "";
      const confirmation = deleteAccountConfirmation
        ? deleteAccountConfirmation.value.trim()
        : "";

      if (!currentPassword) {
        showMessage(
          deleteAccountMessage,
          "Enter your current password.",
          "error"
        );
        return;
      }

      if (confirmation !== "DELETE") {
        showMessage(
          deleteAccountMessage,
          "Type DELETE exactly to confirm account deletion.",
          "error"
        );

        if (deleteAccountConfirmation) {
          deleteAccountConfirmation.focus();
          deleteAccountConfirmation.select();
        }

        return;
      }

      if (deleteAccountSubmit) {
        deleteAccountSubmit.disabled = true;
        deleteAccountSubmit.textContent =
          "Deleting Account...";
      }

      showMessage(deleteAccountMessage, "", "");

      try {
        const response = await fetch(
          "/api/delete-account",
          {
            method: "DELETE",
            credentials: "same-origin",
            cache: "no-store",
            headers: {
              "Accept": "application/json",
              "Content-Type": "application/json",
              "X-AUC-Security-Access":
                securityPanelAccessToken
            },
            body: JSON.stringify({
              currentPassword: currentPassword,
              confirmation: confirmation
            })
          }
        );

        const data = await response
          .json()
          .catch(function () {
            return {};
          });

        if (!response.ok || !data.success) {
          throw new Error(
            data.error ||
              "Could not delete your account."
          );
        }

        try {
          localStorage.removeItem(
            "auc-atlas-signed-in"
          );
          localStorage.removeItem(
            "aucAtlasSignedIn"
          );
          sessionStorage.removeItem(
            "auc-atlas-signed-in"
          );
          sessionStorage.removeItem(
            "aucAtlasSignedIn"
          );
        } catch (error) {}

        window.location.replace("/");
      } catch (error) {
        showMessage(
          deleteAccountMessage,
          error.message ||
            "Could not delete your account.",
          "error"
        );

        if (deleteAccountSubmit) {
          deleteAccountSubmit.disabled = false;
          deleteAccountSubmit.textContent =
            "Delete Account";
        }
      }
    }

    function getAccountInitials(user) {
      const name = String(user.fullName || user.displayName || "").trim();

      if (name) {
        return name.split(/\s+/).slice(0, 2).map(function (part) {
          return part.charAt(0).toUpperCase();
        }).join("");
      }

      return String(user.email || "AUC").charAt(0).toUpperCase();
    }

    function syncAccountMajorDropdown() {
      if (!accountMajorInput || !accountMajorValue || !accountMajorMenu) {
        return;
      }

      const currentValue = accountMajorInput.value || "";
      let selectedOption = null;

      accountMajorMenu.querySelectorAll(".custom-select-option").forEach(function (option) {
        const isActive = option.dataset.majorValue === currentValue;
        option.classList.toggle("active", isActive);

        if (isActive) {
          selectedOption = option;
        }
      });

      accountMajorValue.innerHTML = "<span>" + escapeAccountHtml(selectedOption ? selectedOption.textContent.trim() : currentValue || "Select your major") + "</span>";
    }

    function initializeAccountMajorDropdown() {
      if (!accountMajorDropdown || !accountMajorMenu || !accountMajorInput) {
        return;
      }

      const trigger = accountMajorDropdown.querySelector(".custom-select-trigger");

      if (!trigger) {
        return;
      }

      trigger.addEventListener("click", function () {
        const isOpen = accountMajorDropdown.classList.toggle("open");
        trigger.setAttribute("aria-expanded", String(isOpen));
      });

      accountMajorMenu.addEventListener("click", function (event) {
        const option = event.target.closest(".custom-select-option");

        if (!option) {
          return;
        }

        accountMajorInput.value = option.dataset.majorValue || "";
        syncAccountMajorDropdown();
        accountMajorDropdown.classList.remove("open");
        trigger.setAttribute("aria-expanded", "false");
      });

      document.addEventListener("click", function (event) {
        if (!accountMajorDropdown.contains(event.target)) {
          accountMajorDropdown.classList.remove("open");
          trigger.setAttribute("aria-expanded", "false");
        }
      });

      syncAccountMajorDropdown();
    }

    function syncTwoFactorState(twoFactor) {
      accountTwoFactor = {
        appEnabled: Boolean(twoFactor && twoFactor.appEnabled),
        emailEnabled: Boolean(twoFactor && twoFactor.emailEnabled)
      };

      if (!accountTwoFactor.appEnabled) {
        securityPanelAccessToken = "";
      }

      if (twoFactorAppStatus) {
        twoFactorAppStatus.textContent = accountTwoFactor.appEnabled ? "On" : "Off";
        twoFactorAppStatus.classList.toggle("enabled", accountTwoFactor.appEnabled);
      }

      if (twoFactorEmailStatus) {
        twoFactorEmailStatus.textContent = accountTwoFactor.emailEnabled ? "On" : "Off";
        twoFactorEmailStatus.classList.toggle("enabled", accountTwoFactor.emailEnabled);
      }

      if (twoFactorAppButton) {
        twoFactorAppButton.textContent = accountTwoFactor.appEnabled ? "Disable app" : "Set up app";
        twoFactorAppButton.classList.toggle("is-danger", accountTwoFactor.appEnabled);
      }

      if (twoFactorEmailButton) {
        twoFactorEmailButton.textContent = accountTwoFactor.emailEnabled ? "Disable" : "Enable";
        twoFactorEmailButton.classList.toggle("is-danger", accountTwoFactor.emailEnabled);
      }
    }

    function hydrateAccountDetails(user) {
      const displayName = user.fullName || user.displayName || String(user.email || "").split("@")[0] || "AUC Student";
      const savedAucId = user.aucId || user.aucIdLookupKey || "";

      accountCurrentUser = user;
      window.aucAtlasCurrentUser = user;

      accountNameInput.value = displayName;
      originalDisplayName = displayName;
      displayNameLastChangedAt = user.displayNameLastChangedAt || user.usernameLastChangedAt || null;
      displayNameEditMode = false;
      updateDisplayNameLockState();

      accountEmailInput.value = user.email || "";
      accountMajorInput.value = user.major || "";
      syncAccountMajorDropdown();

      if (accountAucIdInput) {
        accountAucIdInput.value = savedAucId;
      }

      syncTwoFactorState(user.twoFactor || {});

      clearTemporaryProfilePhotoPreview();
      photoInitial.textContent = getAccountInitials(user);

      if (user.photoURL) {
        photoPreview.src = user.photoURL;
        photoPreview.hidden = false;
        photoInitial.hidden = true;
        photoRemoveButton.hidden = false;
      } else {
        photoPreview.src = "";
        photoPreview.hidden = true;
        photoInitial.hidden = false;
        photoRemoveButton.hidden = true;
      }

      if (accountDetailsPanel) {
        accountDetailsPanel.classList.remove("is-loading");
        accountDetailsPanel.setAttribute("aria-busy", "false");
      }

      if (accountDetailsLoadingState) {
        accountDetailsLoadingState.hidden = true;
      }
    }

    async function loadAccountDetails() {
      try {
        const response = await fetch("/api/me", {
          method: "GET",
          credentials: "same-origin",
          cache: "no-store",
          headers: {
            "Accept": "application/json"
          }
        });

        const data = await response.json().catch(function () {
          return {};
        });

        if (!response.ok || !data.signedIn || !data.user) {
          throw new Error("Please log in to view your account.");
        }

        hydrateAccountDetails(data.user);
        return true;
      } catch (error) {
        try {
          localStorage.setItem("auc-atlas-login-redirect", "/accounts");
        } catch (storageError) {}

        window.location.href = "/login";
        return false;
      }
    }

    function resetChangePasswordForm() {
      if (changePasswordForm) changePasswordForm.reset();
      showMessage(changePasswordMessage, "", "");
    }

    function accountPrefersReducedMotion() {
      return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    }

    function openChangePasswordForm() {
      if (!changePasswordForm || !changePasswordOpenButton) {
        return;
      }

      showMessage(securityMessage, "", "");
      resetChangePasswordForm();

      if (accountPrefersReducedMotion()) {
        changePasswordOpenButton.hidden = true;
        changePasswordForm.hidden = false;
        currentPasswordInput.focus();
        return;
      }

      changePasswordOpenButton.classList.add("is-pressed");

      window.setTimeout(function () {
        changePasswordOpenButton.hidden = true;
        changePasswordOpenButton.classList.remove("is-pressed");
        changePasswordForm.hidden = false;
        changePasswordForm.classList.remove("is-closing");
        changePasswordForm.classList.add("is-opening");

        window.setTimeout(function () {
          changePasswordForm.classList.remove("is-opening");
        }, 420);

        currentPasswordInput.focus();
      }, 160);
    }

    function closeChangePasswordForm() {
      resetChangePasswordForm();

      if (!changePasswordForm || !changePasswordOpenButton) {
        return;
      }

      if (accountPrefersReducedMotion()) {
        changePasswordForm.hidden = true;
        changePasswordOpenButton.hidden = false;
        return;
      }

      changePasswordForm.classList.remove("is-opening");
      changePasswordForm.classList.add("is-closing");

      window.setTimeout(function () {
        changePasswordForm.hidden = true;
        changePasswordForm.classList.remove("is-closing");
        changePasswordOpenButton.hidden = false;
      }, 240);
    }

    function passwordMeetsRules(password) {
      return password.length >= 10 &&
        password.length <= 48 &&
        /[A-Z]/.test(password) &&
        /[a-z]/.test(password) &&
        /[0-9]/.test(password) &&
        /[^A-Za-z0-9\s]/.test(password);
    }

    if (changePasswordOpenButton) {
      changePasswordOpenButton.addEventListener("click", openChangePasswordForm);
    }

    if (changePasswordCancelButton) {
      changePasswordCancelButton.addEventListener("click", closeChangePasswordForm);
    }

    if (changePasswordForm) {
      changePasswordForm.addEventListener("submit", async function (event) {
        event.preventDefault();

        const currentPassword = currentPasswordInput.value;
        const newPassword = newPasswordInput.value;
        const confirmPassword = confirmNewPasswordInput.value;

        if (!currentPassword || !newPassword || !confirmPassword) {
          showMessage(changePasswordMessage, "Please complete all password fields.", "error");
          return;
        }

        if (newPassword !== confirmPassword) {
          showMessage(changePasswordMessage, "New passwords do not match.", "error");
          return;
        }

        if (!passwordMeetsRules(newPassword)) {
          showMessage(changePasswordMessage, "Password must be 10 to 48 characters and include uppercase, lowercase, special, and numeric characters.", "error");
          return;
        }

        changePasswordSubmitButton.disabled = true;
        changePasswordCancelButton.disabled = true;
        changePasswordSubmitButton.textContent = "Saving...";
        showMessage(changePasswordMessage, "", "");

        try {
          const response = await fetch("/api/change-password", {
            method: "POST",
            credentials: "same-origin",
            headers: {
              "Accept": "application/json",
              "Content-Type": "application/json",
              "X-AUC-Security-Access": securityPanelAccessToken
            },
            body: JSON.stringify({
              currentPassword,
              newPassword,
              confirmPassword
            })
          });

          const data = await response.json().catch(function () {
            return {};
          });

          if (!response.ok || !data.success) {
            throw new Error(data.error || "Could not change your password.");
          }

          closeChangePasswordForm();
          showMessage(securityMessage, "Password changed successfully.", "success");
        } catch (error) {
          showMessage(changePasswordMessage, error.message || "Could not change your password.", "error");
        } finally {
          changePasswordSubmitButton.disabled = false;
          changePasswordCancelButton.disabled = false;
          changePasswordSubmitButton.textContent = "Save Password";
        }
      });
    }

    sidebarLinks.forEach(function (link) {
      link.addEventListener("click", function () {
        showPanel(link.dataset.accountPanel);
      });
    });

    accountDisplayNameEditButton.addEventListener("click", function () {
      if (getDisplayNameDaysLeft() > 0) {
        updateDisplayNameLockState();
        return;
      }

      displayNameEditMode = true;
      updateDisplayNameLockState();
      accountNameInput.focus();
      accountNameInput.select();
    });

    photoChooseButton.addEventListener("click", function () {
      photoInput.click();
    });

    photoInput.addEventListener("change", async function () {
      const file = photoInput.files && photoInput.files[0];

      if (!file) {
        return;
      }

      await uploadProfilePhotoFile(file);
    });

    photoRemoveButton.addEventListener("click", async function () {
      await removeProfilePhoto();
    });

    detailsForm.addEventListener("submit", async function (event) {
      event.preventDefault();

      const nextDisplayName = accountNameInput.value.trim();
      const displayNameIsChanging = nextDisplayName !== originalDisplayName;

      if (!nextDisplayName) {
        showMessage(detailsMessage, "Please enter your display name.", "error");
        return;
      }

      if (displayNameIsChanging && getDisplayNameDaysLeft() > 0) {
        accountNameInput.value = originalDisplayName;
        updateDisplayNameLockState();
        showMessage(detailsMessage, "You can change your display name again on " + getDisplayNameUnlockDateText() + ".", "error");
        return;
      }

      if (detailsButton) {
        detailsButton.disabled = true;
        detailsButton.textContent = "Saving...";
      }

      showMessage(detailsMessage, "", "");

      try {
        const response = await fetch("/api/me", {
          method: "PATCH",
          credentials: "same-origin",
          headers: {
            "Accept": "application/json",
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            fullName: nextDisplayName,
            major: accountMajorInput.value.trim()
          })
        });
        const data = await response.json().catch(function () {
          return {};
        });

        if (!response.ok || !data.user) {
          throw new Error(data.error || "Could not save your details.");
        }

        hydrateAccountDetails(data.user);
        showMessage(detailsMessage, "Account details saved.", "success");
      } catch (error) {
        accountNameInput.value = originalDisplayName;
        updateDisplayNameLockState();
        showMessage(detailsMessage, error.message || "Could not save your details. Please try again.", "error");
      } finally {
        if (detailsButton) {
          detailsButton.disabled = false;
          detailsButton.textContent = "Save Changes";
        }
      }
    });

    function formatAuthenticatorSecret(secret) {
      const compactSecret = String(secret || "").replace(/\s+/g, "").toUpperCase();
      return compactSecret.replace(/(.{4})/g, "$1 ").trim();
    }

    function getAuthenticatorCodeValue() {
      return authenticatorCodeInputs.map(function (input) {
        return input.value;
      }).join("").replace(/\D/g, "").slice(0, 6);
    }

    function setAuthenticatorCodeInvalid(isInvalid) {
      authenticatorCodeInputs.forEach(function (input) {
        if (isInvalid) {
          input.setAttribute("aria-invalid", "true");
        } else {
          input.removeAttribute("aria-invalid");
        }
      });
    }

    function syncAuthenticatorCodeValue() {
      const code = getAuthenticatorCodeValue();

      if (authenticatorSetupCode) {
        authenticatorSetupCode.value = code;
      }

      if (authenticatorSetupConfirm) {
        authenticatorSetupConfirm.disabled = code.length !== 6;
      }

      return code;
    }

    function resetAuthenticatorCodeInputs() {
      authenticatorCodeInputs.forEach(function (input) {
        input.value = "";
      });

      setAuthenticatorCodeInvalid(false);
      syncAuthenticatorCodeValue();
    }

    function fillAuthenticatorCodeInputs(value) {
      const digits = String(value || "").replace(/\D/g, "").slice(0, 6).split("");

      authenticatorCodeInputs.forEach(function (input, index) {
        input.value = digits[index] || "";
      });

      setAuthenticatorCodeInvalid(false);
      syncAuthenticatorCodeValue();

      const focusIndex = Math.min(digits.length, authenticatorCodeInputs.length - 1);
      const focusTarget = authenticatorCodeInputs[focusIndex];

      if (focusTarget) {
        focusTarget.focus();
      }
    }

    function openAuthenticatorModal(data) {
      if (authenticatorQrCode) authenticatorQrCode.src = data.qrDataUrl || "";
      if (authenticatorSecretKey) authenticatorSecretKey.textContent = formatAuthenticatorSecret(data.secret || "");
      resetAuthenticatorCodeInputs();
      showMessage(authenticatorMessage, "", "");
      authenticatorModal.hidden = false;

      setTimeout(function () {
        if (authenticatorCodeInputs[0]) authenticatorCodeInputs[0].focus();
      }, 50);
    }

    function closeAuthenticatorModal() {
      authenticatorModal.hidden = true;
      resetAuthenticatorCodeInputs();
      showMessage(authenticatorMessage, "", "");
    }

    authenticatorCodeInputs.forEach(function (input, index) {
      input.addEventListener("input", function () {
        const digits = String(input.value || "").replace(/\D/g, "");

        if (digits.length > 1) {
          fillAuthenticatorCodeInputs(digits);
          return;
        }

        input.value = digits;
        setAuthenticatorCodeInvalid(false);
        syncAuthenticatorCodeValue();

        if (digits && authenticatorCodeInputs[index + 1]) {
          authenticatorCodeInputs[index + 1].focus();
        }
      });

      input.addEventListener("keydown", function (event) {
        if (event.key === "Backspace" && !input.value && authenticatorCodeInputs[index - 1]) {
          authenticatorCodeInputs[index - 1].focus();
          authenticatorCodeInputs[index - 1].value = "";
          syncAuthenticatorCodeValue();
        }

        if (event.key === "ArrowLeft" && authenticatorCodeInputs[index - 1]) {
          authenticatorCodeInputs[index - 1].focus();
        }

        if (event.key === "ArrowRight" && authenticatorCodeInputs[index + 1]) {
          authenticatorCodeInputs[index + 1].focus();
        }
      });

      input.addEventListener("paste", function (event) {
        const pastedCode = event.clipboardData ? event.clipboardData.getData("text") : "";

        if (pastedCode) {
          event.preventDefault();
          fillAuthenticatorCodeInputs(pastedCode);
        }
      });
    });

    function getSecurityAccessCodeValue() {
      return securityAccessCodeInputs.map(function (input) {
        return input.value.trim();
      }).join("").replace(/\D/g, "").slice(0, 6);
    }

    function clearSecurityAccessCodeInputs() {
      securityAccessCodeInputs.forEach(function (input) {
        input.value = "";
      });
    }

    function focusFirstSecurityAccessCodeInput() {
      if (securityAccessCodeInputs[0]) {
        securityAccessCodeInputs[0].focus();
      }
    }

    function fillSecurityAccessCodeInputs(value) {
      const digits = String(value || "")
        .replace(/\D/g, "")
        .slice(0, 6);

      securityAccessCodeInputs.forEach(function (input, index) {
        input.value = digits.charAt(index) || "";
      });

      const focusIndex =
        Math.min(digits.length, securityAccessCodeInputs.length) - 1;

      if (focusIndex >= 0 && securityAccessCodeInputs[focusIndex]) {
        securityAccessCodeInputs[focusIndex].focus();
      }
    }

    function closeSecurityAccessModal(accessGranted) {
      if (!securityAccessModal) {
        return;
      }

      securityAccessModal.hidden = true;

      if (securityAccessForm) {
        securityAccessForm.reset();
      }

      clearSecurityAccessCodeInputs();

      if (securityAccessSubmit) {
        securityAccessSubmit.disabled = false;
        securityAccessSubmit.textContent = "Verify Code";
      }

      showMessage(securityAccessMessage, "", "");

      const resolveAccess = securityAccessResolver;
      securityAccessResolver = null;

      if (resolveAccess) {
        resolveAccess(Boolean(accessGranted));
      }
    }

    function requestSecurityPanelAccess() {
      if (!accountTwoFactor.appEnabled) {
        return Promise.resolve(true);
      }

      if (
        !securityAccessModal ||
        !securityAccessForm ||
        !securityAccessCodeInputs.length
      ) {
        showMessage(
          securityMessage,
          "Could not open security verification.",
          "error"
        );

        return Promise.resolve(false);
      }

      if (!securityAccessModal.hidden) {
        return Promise.resolve(false);
      }

      securityPanelAccessToken = "";
      securityAccessForm.reset();
      clearSecurityAccessCodeInputs();
      showMessage(securityAccessMessage, "", "");
      securityAccessModal.hidden = false;

      return new Promise(function (resolve) {
        securityAccessResolver = resolve;

        window.setTimeout(function () {
          focusFirstSecurityAccessCodeInput();
        }, 50);
      });
    }

    securityAccessCodeInputs.forEach(function (input, index) {
      input.addEventListener("input", function () {
        const digits = String(input.value || "").replace(/\D/g, "");

        if (digits.length > 1) {
          fillSecurityAccessCodeInputs(digits);
          showMessage(securityAccessMessage, "", "");
          return;
        }

        input.value = digits.slice(0, 1);
        showMessage(securityAccessMessage, "", "");

        if (input.value && securityAccessCodeInputs[index + 1]) {
          securityAccessCodeInputs[index + 1].focus();
        }
      });

      input.addEventListener("keydown", function (event) {
        if (
          event.key === "Backspace" &&
          !input.value &&
          securityAccessCodeInputs[index - 1]
        ) {
          securityAccessCodeInputs[index - 1].focus();
        }
      });

      input.addEventListener("paste", function (event) {
        const pastedCode = event.clipboardData
          .getData("text")
          .replace(/\D/g, "")
          .slice(0, 6);

        if (!pastedCode) {
          return;
        }

        event.preventDefault();
        fillSecurityAccessCodeInputs(pastedCode);
        showMessage(securityAccessMessage, "", "");
      });
    });

    if (securityAccessForm) {
      securityAccessForm.addEventListener("submit", async function (event) {
        event.preventDefault();

        const code = getSecurityAccessCodeValue();

        if (!/^\d{6}$/.test(code)) {
          showMessage(
            securityAccessMessage,
            "Please enter your 6-digit authenticator code.",
            "error"
          );

          focusFirstSecurityAccessCodeInput();
          return;
        }

        securityAccessSubmit.disabled = true;
        securityAccessSubmit.textContent = "Verifying...";
        showMessage(securityAccessMessage, "", "");

        try {
          const data = await requestAuthenticatorAction(
            "verify-security-panel",
            { code: code }
          );

          if (
            data.securityAccessRequired &&
            !data.securityAccessToken
          ) {
            throw new Error(
              "Could not verify access to the Security panel."
            );
          }

          securityPanelAccessToken =
            data.securityAccessToken || "";

          closeSecurityAccessModal(true);
        } catch (error) {
          securityPanelAccessToken = "";

          showMessage(
            securityAccessMessage,
            error.message || "Invalid authenticator code.",
            "error"
          );

          clearSecurityAccessCodeInputs();
          focusFirstSecurityAccessCodeInput();
        } finally {
          securityAccessSubmit.disabled = false;
          securityAccessSubmit.textContent = "Verify Code";
        }
      });
    }

    [
      securityAccessModalBackdrop,
      securityAccessModalCancel
    ].forEach(function (control) {
      if (control) {
        control.addEventListener("click", function () {
          closeSecurityAccessModal(false);
        });
      }
    });

    async function requestAuthenticatorAction(action, payload) {
      const response = await fetch("/api/authenticator", {
        method: "POST",
        credentials: "same-origin",
        headers: {
          "Accept": "application/json",
          "Content-Type": "application/json",
          "X-AUC-Security-Access": securityPanelAccessToken
        },
        body: JSON.stringify(Object.assign({ action: action }, payload || {}))
      });

      const data = await response.json().catch(function () {
        return {};
      });

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Could not update two-factor authentication.");
      }

      return data;
    }

    async function startAuthenticatorSetup() {
      twoFactorAppButton.disabled = true;
      twoFactorAppButton.textContent = "Setting up...";
      showMessage(securityMessage, "", "");

      try {
        const data = await requestAuthenticatorAction("setup");
        openAuthenticatorModal(data);
      } catch (error) {
        showMessage(securityMessage, error.message || "Could not start authenticator setup.", "error");
      } finally {
        twoFactorAppButton.disabled = false;
        twoFactorAppButton.textContent = accountTwoFactor.appEnabled ? "Disable app" : "Set up app";
      }
    }

    async function disableAuthenticatorApp() {
      const code = window.prompt("Enter your 6-digit authenticator code to disable it.");

      if (!code) {
        return;
      }

      twoFactorAppButton.disabled = true;
      twoFactorAppButton.textContent = "Disabling...";
      showMessage(securityMessage, "", "");

      try {
        const data = await requestAuthenticatorAction("disable", { code: code });
        syncTwoFactorState(data.twoFactor || { appEnabled: false });
        showMessage(securityMessage, "Authenticator app disabled.", "success");
      } catch (error) {
        showMessage(securityMessage, error.message || "Could not disable authenticator app.", "error");
      } finally {
        twoFactorAppButton.disabled = false;
        twoFactorAppButton.textContent = accountTwoFactor.appEnabled ? "Disable app" : "Set up app";
      }
    }

    if (twoFactorAppButton) {
      twoFactorAppButton.addEventListener("click", function () {
        if (accountTwoFactor.appEnabled) {
          disableAuthenticatorApp();
          return;
        }

        startAuthenticatorSetup();
      });
    }

    async function updateEmailTwoFactor() {
      const enabling = !accountTwoFactor.emailEnabled;

      twoFactorEmailButton.disabled = true;
      twoFactorEmailButton.textContent = enabling ? "Enabling..." : "Disabling...";
      showMessage(securityMessage, "", "");

      try {
        const data = await requestAuthenticatorAction(
          enabling ? "enable-email" : "disable-email"
        );

        syncTwoFactorState(data.twoFactor || {
          appEnabled: accountTwoFactor.appEnabled,
          emailEnabled: enabling
        });

        showMessage(
          securityMessage,
          enabling
            ? "Email two-factor authentication enabled."
            : "Email two-factor authentication disabled.",
          "success"
        );
      } catch (error) {
        showMessage(
          securityMessage,
          error.message || "Could not update email two-factor authentication.",
          "error"
        );
      } finally {
        twoFactorEmailButton.disabled = false;
        twoFactorEmailButton.textContent =
          accountTwoFactor.emailEnabled ? "Disable" : "Enable";
      }
    }

    if (twoFactorEmailButton) {
      twoFactorEmailButton.addEventListener("click", updateEmailTwoFactor);
    }

    if (authenticatorSetupForm) {
      authenticatorSetupForm.addEventListener("submit", async function (event) {
        event.preventDefault();

        const code = syncAuthenticatorCodeValue();

        if (!/^\d{6}$/.test(code)) {
          setAuthenticatorCodeInvalid(true);
          showMessage(authenticatorMessage, "Please enter the 6-digit authenticator code.", "error");

          if (authenticatorCodeInputs[0]) {
            authenticatorCodeInputs[0].focus();
          }

          return;
        }

        authenticatorSetupConfirm.disabled = true;
        authenticatorSetupConfirm.textContent = "Verifying...";
        setAuthenticatorCodeInvalid(false);
        showMessage(authenticatorMessage, "", "");

        try {
          const data = await requestAuthenticatorAction("verify-setup", {
            code: code
          });

          securityPanelAccessToken =
            data.securityAccessToken || securityPanelAccessToken;

          syncTwoFactorState(data.twoFactor || { appEnabled: true });
          closeAuthenticatorModal();
          showMessage(securityMessage, "Authenticator app enabled.", "success");
        } catch (error) {
          setAuthenticatorCodeInvalid(true);
          showMessage(authenticatorMessage, error.message || "Invalid authenticator code.", "error");
        } finally {
          authenticatorSetupConfirm.textContent = "Verify and Enable";
          syncAuthenticatorCodeValue();
        }
      });
    }

    [authenticatorModalBackdrop, authenticatorModalClose, authenticatorModalCancel].forEach(function (control) {
      if (control) {
        control.addEventListener("click", closeAuthenticatorModal);
      }
    });

    if (accountLoginSessionsList) {
      accountLoginSessionsList.addEventListener("click", function (event) {
        const button = event.target.closest("[data-account-session-revoke]");

        if (!button) {
          return;
        }

        revokeAccountLoginSession(button.dataset.accountSessionRevoke || "", button);
      });
    }

    accountActivityTabs.forEach(function (tab, index) {
      tab.addEventListener("click", function () {
        setAccountActivityTab(tab.dataset.accountActivityTab || "reviews");
      });
      tab.addEventListener("keydown", function (event) {
        if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
        event.preventDefault();
        const nextIndex = event.key === "Home" ? 0
          : event.key === "End" ? accountActivityTabs.length - 1
          : (index + (event.key === "ArrowRight" ? 1 : -1) + accountActivityTabs.length) % accountActivityTabs.length;
        const nextTab = accountActivityTabs[nextIndex];
        setAccountActivityTab(nextTab.dataset.accountActivityTab || "reviews");
        nextTab.focus();
      });
    });

    if (accountActivitySearch) {
      accountActivitySearch.addEventListener("input", function () {
        const activeTab = Array.from(accountActivityTabs).find(function (tab) {
          return tab.classList.contains("active");
        });
        if (activeTab && activeTab.dataset.accountActivityTab === "uploads") {
          if (!accountUploadLoading) renderAccountUploadHistory(accountUploadHistory);
        } else if (!accountReviewLoading) {
          renderAccountReviewHistory(accountReviewHistory);
        }
      });
    }

    if (accountReviewList) {
      accountReviewList.addEventListener("click", function (event) {
        const editButton = event.target.closest("[data-account-review-edit]");
        const deleteButton = event.target.closest("[data-account-review-delete]");

        if (editButton) {
          openAccountReviewEditor(editButton.dataset.accountReviewEdit || "");
          return;
        }

        if (deleteButton) {
          deleteAccountReview(deleteButton.dataset.accountReviewDelete || "", deleteButton);
        }
      });
    }

    if (accountUploadList) {
      accountUploadList.addEventListener("click", function (event) {
        const editButton = event.target.closest("[data-account-material-edit]");
        const deleteButton = event.target.closest("[data-account-material-delete]");

        if (editButton) {
          openAccountMaterialEditor(
            editButton.dataset.accountMaterialEdit || ""
          );
          return;
        }

        if (deleteButton) {
          deleteAccountMaterial(
            deleteButton.dataset.accountMaterialDelete || "",
            deleteButton
          );
        }
      });
    }

    if (accountReviewEditorForm) {
      accountReviewEditorForm.addEventListener("submit", function (event) {
        event.preventDefault();

        if (!accountReviewEditorForm.reportValidity()) {
          return;
        }

        saveAccountReviewChanges();
      });
    }

    if (accountMaterialEditorForm) {
      accountMaterialEditorForm.addEventListener("submit", function (event) {
        event.preventDefault();

        if (!accountMaterialEditorForm.reportValidity()) {
          return;
        }

        saveAccountMaterialChanges();
      });
    }

    [accountReviewEditorBackdrop, accountReviewEditorClose, accountReviewEditorCancel].forEach(function (control) {
      if (control) {
        control.addEventListener("click", closeAccountReviewEditor);
      }
    });

    [accountMaterialEditorBackdrop, accountMaterialEditorClose, accountMaterialEditorCancel].forEach(function (control) {
      if (control) {
        control.addEventListener("click", closeAccountMaterialEditor);
      }
    });

    if (deleteAccountButton) {
      deleteAccountButton.addEventListener(
        "click",
        openDeleteAccountModal
      );
    }

    if (deleteAccountForm) {
      deleteAccountForm.addEventListener(
        "submit",
        function (event) {
          event.preventDefault();

          if (!deleteAccountForm.reportValidity()) {
            return;
          }

          submitDeleteAccount();
        }
      );
    }

    [
      deleteAccountModalBackdrop,
      deleteAccountModalClose,
      deleteAccountModalCancel
    ].forEach(function (control) {
      if (control) {
        control.addEventListener(
          "click",
          closeDeleteAccountModal
        );
      }
    });

    document.addEventListener("keydown", function (event) {
      if (event.key !== "Escape") {
        return;
      }

      if (securityAccessModal && !securityAccessModal.hidden) {
        closeSecurityAccessModal(false);
        return;
      }

      if (deleteAccountModal && !deleteAccountModal.hidden) {
        closeDeleteAccountModal();
        return;
      }

      if (authenticatorModal && !authenticatorModal.hidden) {
        closeAuthenticatorModal();
        return;
      }

      if (accountMaterialEditor && !accountMaterialEditor.hidden) {
        closeAccountMaterialEditor();
        return;
      }

      if (accountReviewEditor && !accountReviewEditor.hidden) {
        closeAccountReviewEditor();
      }
    });

    document.querySelectorAll("[data-account-action]").forEach(function (button) {
      if (
        button.id === "two-factor-app-button" ||
        button.id === "two-factor-email-button"
      ) {
        return;
      }

      button.addEventListener("click", function () {
        const panel = button.closest(".account-panel");
        const message = panel ? panel.querySelector(".account-message") : null;
        showMessage(message, "This account action is not connected yet.");
      });
    });

    logoutButton.addEventListener("click", async function () {
      await fetch("/api/logout", {
        method: "POST",
        credentials: "same-origin",
        headers: {
          "Content-Type": "application/json"
        },
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

    async function initializeAccountPage() {
      const hashPanel = window.location.hash.slice(1);
      const initialPanel = ["details", "security", "reviews"].includes(hashPanel)
        ? hashPanel
        : "details";

      // Choose the correct skeleton synchronously; never flash Account Details
      // while a deep-linked panel is waiting for /api/me.
      if (initialPanel === "security") {
        // Security content must remain hidden until any required 2FA challenge.
        setAccountSecurityLoading(true);
      }
      activateAccountPanel(initialPanel, { deferLoading: true });

      initializeAccountMajorDropdown();
      const accountLoaded = await loadAccountDetails();
      if (!accountLoaded) return;

      if (initialPanel === "security") {
        const allowed = await showPanel("security");
        if (!allowed) {
          setAccountSecurityLoading(false);
          activateAccountPanel("details", { deferLoading: true });
        }
      } else if (initialPanel === "reviews") {
        await showPanel("reviews");
      }
    }

    initializeAccountPage();
  
  initializeGoogleConnection();
}
function initializeGoogleConnection(){
    const googleConnectionStatus =
      document.getElementById(
        "connected-google-status"
      );

    const googleConnectionButton =
      document.getElementById(
        "connected-google-action"
      );

    const googleConnectionMessage =
      document.getElementById(
        "account-details-message"
      );

    let googleConnected = false;
    let firebaseClientAuth = null;

    function showGoogleConnectionMessage(
      message,
      type
    ) {
      if (!googleConnectionMessage) {
        return;
      }

      googleConnectionMessage.textContent =
        message;

      googleConnectionMessage.className =
        "account-message" +
        (
          type
            ? " " + type
            : ""
        );
    }

    function setGoogleConnectionState(
      connected,
      googleEmail
    ) {
      googleConnected =
        Boolean(connected);

      if (googleConnectionStatus) {
        googleConnectionStatus.textContent =
          googleConnected
            ? "Connected"
            : "Not Connected";
      }

      if (!googleConnectionButton) {
        return;
      }

      googleConnectionButton.disabled =
        googleConnected;

      googleConnectionButton.textContent =
        googleConnected
          ? "Connected"
          : "Connect";

      googleConnectionButton.classList.toggle(
        "is-connect",
        !googleConnected
      );

      googleConnectionButton.classList.toggle(
        "is-connected",
        googleConnected
      );

      if (
        googleConnected &&
        googleEmail
      ) {
        googleConnectionButton.title =
          "Connected to " +
          googleEmail;
      } else {
        googleConnectionButton.removeAttribute(
          "title"
        );
      }
    }

    async function getGoogleAuthData() {
      const response = await fetch(
        "/api/google-auth",
        {
          method: "GET",
          credentials:
            "same-origin",
          headers: {
            "Accept":
              "application/json"
          }
        }
      );

      const data =
        await response
          .json()
          .catch(function () {
            return {};
          });

      if (
        !response.ok ||
        !data.firebase
      ) {
        throw new Error(
          data.error ||
          "Could not open the Google connection."
        );
      }

      return data;
    }

    async function getFirebaseClientAuth(
      firebase,
      customToken
    ) {
      const appName =
        "aucAtlasGoogleConnection";

      const existingApp =
        getApps().find(function (app) {
          return app.name === appName;
        });

      const firebaseApp =
        existingApp ||
        initializeApp(
          firebase,
          appName
        );

      const auth =
        getAuth(firebaseApp);

      await setPersistence(
        auth,
        inMemoryPersistence
      );

      if (!customToken) {
        throw new Error(
          "Please log in again before connecting Google."
        );
      }

      await signInWithCustomToken(
        auth,
        customToken
      );

      firebaseClientAuth = auth;

      return auth;
    }

    function getGoogleConnectionError(
      error
    ) {
      if (
        error &&
        error.code ===
          "auth/popup-closed-by-user"
      ) {
        return "Google connection was closed before it finished.";
      }

      if (
        error &&
        error.code ===
          "auth/popup-blocked"
      ) {
        return "Your browser blocked the Google popup. Please allow popups and try again.";
      }

      if (
        error &&
        (
          error.code ===
            "auth/credential-already-in-use" ||
          error.code ===
            "auth/account-exists-with-different-credential"
        )
      ) {
        return "That Google account is already connected to another AUC Atlas account.";
      }

      return (
        error.message ||
        "Could not connect Google. Please try again."
      );
    }

    async function connectGoogleAccount() {
      if (
        !googleConnectionButton ||
        googleConnected
      ) {
        return;
      }

      googleConnectionButton.disabled =
        true;

      googleConnectionButton.textContent =
        "Connecting...";

      showGoogleConnectionMessage(
        "",
        ""
      );

      try {
        const authData =
          await getGoogleAuthData();

        const auth =
          await getFirebaseClientAuth(
            authData.firebase,
            authData.customToken
          );

        const alreadyLinked =
          Boolean(
            auth.currentUser &&
            auth.currentUser.providerData
              .some(function (provider) {
                return (
                  provider &&
                  provider.providerId ===
                    "google.com"
                );
              })
          );

        if (!alreadyLinked) {
          const provider =
            new GoogleAuthProvider();

          provider.setCustomParameters({
            prompt: "select_account"
          });

          await linkWithPopup(
            auth.currentUser,
            provider
          );
        }

        const idToken =
          await auth.currentUser
            .getIdToken(true);

        const response = await fetch(
          "/api/google-auth",
          {
            method: "POST",
            credentials:
              "same-origin",
            headers: {
              "Content-Type":
                "application/json"
            },
            body: JSON.stringify({
              action: "connect",
              idToken
            })
          }
        );

        const data =
          await response
            .json()
            .catch(function () {
              return {};
            });

        if (
          !response.ok ||
          !data.success ||
          !data.connected
        ) {
          throw new Error(
            data.error ||
            "Could not confirm the Google connection."
          );
        }

        setGoogleConnectionState(
          true,
          data.googleEmail || ""
        );

        showGoogleConnectionMessage(
          "Google connected successfully. You can now use it to log in.",
          "success"
        );
      } catch (error) {
        setGoogleConnectionState(
          false,
          ""
        );

        showGoogleConnectionMessage(
          getGoogleConnectionError(
            error
          ),
          "error"
        );
      } finally {
        if (firebaseClientAuth) {
          await signOut(
            firebaseClientAuth
          ).catch(function () {});

          firebaseClientAuth = null;
        }

        if (
          googleConnectionButton &&
          !googleConnected
        ) {
          googleConnectionButton.disabled =
            false;

          googleConnectionButton.textContent =
            "Connect";
        }
      }
    }

    async function loadGoogleConnectionState() {
      if (
        !googleConnectionButton ||
        !googleConnectionStatus
      ) {
        return;
      }

      try {
        const data =
          await getGoogleAuthData();

        setGoogleConnectionState(
          Boolean(data.connected),
          data.googleEmail || ""
        );
      } catch (error) {
        setGoogleConnectionState(
          false,
          ""
        );
      }
    }

    if (googleConnectionButton) {
      googleConnectionButton.addEventListener(
        "click",
        connectGoogleAccount
      );
    }

    loadGoogleConnectionState();
  
}
