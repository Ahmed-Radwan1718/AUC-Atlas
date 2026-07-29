(function () {
  "use strict";

  const securityUnlockMinutes = 60;
  const loginRedirectKey = "auc-atlas-login-redirect";
  const loginMessageKey = "auc-atlas-login-message";

  let initialized = false;
  let currentUser = null;
  let twoFactorSettings = {};
  let loginSessions = [];
  let trustedDevices = [];
  let securityUnlockUntil = 0;
  let pendingSignOutSessionId = "";
  let pendingTrustedDeviceId = "";

  let passwordLastChangedText;
  let passwordSectionMessage;
  let openPasswordModalButton;
  let passwordChangeModal;
  let passwordChangeModalBackdrop;
  let passwordChangeModalClose;
  let passwordChangeModalCancel;
  let passwordForm;
  let currentPasswordInput;
  let newPasswordInput;
  let passwordButton;
  let passwordMessage;

  let twoFactorAppStatus;
  let twoFactorAppButton;
  let twoFactorEmailStatus;
  let twoFactorEmailButton;
  let twoFactorMessage;

  let loginSessionsList;
  let loginSessionsEmpty;
  let trustedDevicesList;
  let trustedDevicesEmpty;

  let authenticatorSetupModal;
  let authenticatorSetupModalBackdrop;
  let authenticatorSetupModalClose;
  let authenticatorSetupModalCancel;
  let authenticatorSetupForm;
  let authenticatorSetupCode;
  let authenticatorSetupConfirm;
  let authenticatorSetupMessage;
  let authenticatorQrImage;
  let authenticatorSecretKey;

  let securityGateModal;
  let securityGateModalBackdrop;
  let securityGateModalClose;
  let securityGateModalCancel;
  let securityGateModalContinue;
  let securityGateMessage;

  let securityCodeModal;
  let securityCodeModalBackdrop;
  let securityCodeModalCancel;
  let securityCodeModalText;
  let securityCodeInput;
  let securityCodeForm;
  let securityCodeSubmit;
  let securityCodeMessage;

  let signOutEverywhereButton;
  let signOutEverywhereMessage;

  let deleteAccountButton;
  let deleteAccountMessage;
  let deleteAccountModal;
  let deleteAccountModalBackdrop;
  let deleteAccountModalCancel;
  let deleteAccountModalConfirm;
  let deleteAccountModalMessage;
  let deleteAccountConfirmText;

  let signOutSessionModal;
  let signOutSessionModalBackdrop;
  let signOutSessionCancel;
  let signOutSessionConfirm;
  let signOutSessionMessage;

  let removeTrustedDeviceModal;
  let removeTrustedDeviceModalBackdrop;
  let removeTrustedDeviceCancel;
  let removeTrustedDeviceConfirm;
  let removeTrustedDeviceMessage;

  function getById(id) {
    return document.getElementById(id);
  }

  function cacheElements() {
    passwordLastChangedText = getById("password-last-changed");
    passwordSectionMessage = getById("password-section-message");
    openPasswordModalButton = getById("open-password-modal-button");
    passwordChangeModal = getById("password-change-modal");
    passwordChangeModalBackdrop = getById("password-change-modal-backdrop");
    passwordChangeModalClose = getById("password-change-modal-close");
    passwordChangeModalCancel = getById("password-change-modal-cancel");
    passwordForm = getById("change-password-form");
    currentPasswordInput = getById("current-password");
    newPasswordInput = getById("new-password");
    passwordButton = getById("change-password-button");
    passwordMessage = getById("password-message");

    twoFactorAppStatus = getById("two-factor-app-status");
    twoFactorAppButton = getById("two-factor-app-button");
    twoFactorEmailStatus = getById("two-factor-email-status");
    twoFactorEmailButton = getById("two-factor-email-button");
    twoFactorMessage = getById("two-factor-message");

    loginSessionsList = getById("account-login-sessions-list");
    loginSessionsEmpty = getById("account-login-sessions-empty");
    trustedDevicesList = getById("account-trusted-devices-list");
    trustedDevicesEmpty = getById("account-trusted-devices-empty");

    authenticatorSetupModal = getById("authenticator-setup-modal");
    authenticatorSetupModalBackdrop = getById("authenticator-setup-modal-backdrop");
    authenticatorSetupModalClose = getById("authenticator-setup-modal-close");
    authenticatorSetupModalCancel = getById("authenticator-setup-modal-cancel");
    authenticatorSetupForm = getById("authenticator-setup-form");
    authenticatorSetupCode = getById("authenticator-setup-code");
    authenticatorSetupConfirm = getById("authenticator-setup-confirm");
    authenticatorSetupMessage = getById("authenticator-setup-message");
    authenticatorQrImage = getById("authenticator-qr-image");
    authenticatorSecretKey = getById("authenticator-secret-key");

    securityGateModal = getById("security-gate-modal");
    securityGateModalBackdrop = getById("security-gate-modal-backdrop");
    securityGateModalClose = getById("security-gate-modal-close");
    securityGateModalCancel = getById("security-gate-modal-cancel");
    securityGateModalContinue = getById("security-gate-modal-continue");
    securityGateMessage = getById("security-gate-message");

    securityCodeModal = getById("security-code-modal");
    securityCodeModalBackdrop = getById("security-code-modal-backdrop");
    securityCodeModalCancel = getById("security-code-modal-cancel");
    securityCodeModalText = getById("security-code-modal-text");
    securityCodeInput = getById("security-code-input");
    securityCodeForm = getById("security-code-form");
    securityCodeSubmit = getById("security-code-submit");
    securityCodeMessage = getById("security-code-message");

    signOutEverywhereButton = getById("sign-out-everywhere-button");
    signOutEverywhereMessage = getById("sign-out-everywhere-message");

    deleteAccountButton = getById("delete-account-button");
    deleteAccountMessage = getById("delete-account-message");
    deleteAccountModal = getById("delete-account-modal");
    deleteAccountModalBackdrop = getById("delete-account-modal-backdrop");
    deleteAccountModalCancel = getById("delete-account-modal-cancel");
    deleteAccountModalConfirm = getById("delete-account-modal-confirm");
    deleteAccountModalMessage = getById("delete-account-modal-message");
    deleteAccountConfirmText = getById("delete-account-confirm-text");

    signOutSessionModal = getById("sign-out-session-modal");
    signOutSessionModalBackdrop = getById("sign-out-session-modal-backdrop");
    signOutSessionCancel = getById("sign-out-session-modal-cancel");
    signOutSessionConfirm = getById("sign-out-session-modal-confirm");
    signOutSessionMessage = getById("sign-out-session-message");

    removeTrustedDeviceModal = getById("remove-trusted-device-modal");
    removeTrustedDeviceModalBackdrop = getById("remove-trusted-device-modal-backdrop");
    removeTrustedDeviceCancel = getById("remove-trusted-device-modal-cancel");
    removeTrustedDeviceConfirm = getById("remove-trusted-device-modal-confirm");
    removeTrustedDeviceMessage = getById("remove-trusted-device-message");
  }

  function getSecurityModals() {
    return [
      passwordChangeModal,
      authenticatorSetupModal,
      securityGateModal,
      securityCodeModal,
      deleteAccountModal,
      signOutSessionModal,
      removeTrustedDeviceModal
    ].filter(Boolean);
  }

  function moveModalsToBody() {
    getSecurityModals().forEach(function (modal) {
      if (modal.parentElement !== document.body) {
        document.body.appendChild(modal);
      }
    });
  }

  function updateModalBodyState() {
    const hasOpenModal = getSecurityModals().some(function (modal) {
      return !modal.hidden;
    });

    document.body.classList.toggle("account-security-modal-open", hasOpenModal);
  }

  function openModal(modal) {
    if (!modal) return;
    modal.hidden = false;
    updateModalBodyState();
  }

  function closeModal(modal) {
    if (!modal) return;
    modal.hidden = true;
    updateModalBodyState();
  }

  function showMessage(element, message, type) {
    if (!element) return;

    const baseClass = element.classList.contains("auth-message") ? "auth-message" : "account-message";
    element.textContent = message || "";
    element.className = baseClass;

    if (type) {
      element.classList.add(type);
    }
  }

  function setButtonLoading(button, loading, loadingText, normalText) {
    if (!button) return;

    button.disabled = Boolean(loading);
    button.textContent = loading ? loadingText : normalText;
  }

  async function requestJson(url, options) {
    const settings = options || {};
    const headers = Object.assign({
      Accept: "application/json"
    }, settings.headers || {});

    if (settings.body && typeof settings.body !== "string") {
      headers["Content-Type"] = "application/json";
      settings.body = JSON.stringify(settings.body);
    }

    const response = await fetch(url, Object.assign({
      credentials: "same-origin"
    }, settings, {
      headers
    }));

    const data = await response.json().catch(function () {
      return {};
    });

    if (!response.ok) {
      throw new Error(data.error || "Something went wrong. Please try again.");
    }

    return data;
  }

  function escapeHtml(value) {
    return String(value || "").replace(/[&<>"']/g, function (character) {
      return {
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        "\"": "&quot;",
        "'": "&#039;"
      }[character];
    });
  }

  function getDateFromFirestoreValue(value) {
    if (!value) return null;

    if (value instanceof Date) {
      return Number.isNaN(value.getTime()) ? null : value;
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

    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
  }

  function getReadableDateTime(value) {
    const date = getDateFromFirestoreValue(value);

    if (!date) {
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

  function getReadableDate(value) {
    const date = getDateFromFirestoreValue(value);

    if (!date) {
      return "Not available";
    }

    return date.toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric"
    });
  }

  function updatePasswordLastChangedText(value) {
    if (!passwordLastChangedText) return;
    passwordLastChangedText.textContent = "Last changed: " + getReadableDate(value);
  }

  function getMaskedEmail(email) {
    const value = String(email || "");

    if (!value.includes("@")) {
      return "your email";
    }

    const parts = value.split("@");
    const name = parts[0];
    const domain = parts.slice(1).join("@");

    if (name.length <= 2) {
      return name.charAt(0) + "***@" + domain;
    }

    return name.charAt(0) + "***" + name.charAt(name.length - 1) + "@" + domain;
  }

  function isSecurityUnlocked() {
    return securityUnlockUntil > Date.now();
  }

  async function refreshSecurityUnlockStatus() {
    try {
      const data = await requestJson("/api/security-unlock-status", {
        method: "GET"
      });

      if (data.unlocked) {
        securityUnlockUntil = Date.now() + securityUnlockMinutes * 60 * 1000;
        return true;
      }
    } catch (error) {}

    securityUnlockUntil = 0;
    return false;
  }

  async function ensureSecurityUnlocked() {
    if (isSecurityUnlocked()) {
      return true;
    }

    return await refreshSecurityUnlockStatus();
  }

  function saveSecurityUnlock(unlockUntil) {
    const unlockDate = unlockUntil ? new Date(unlockUntil) : null;

    if (unlockDate && !Number.isNaN(unlockDate.getTime())) {
      securityUnlockUntil = unlockDate.getTime();
      return;
    }

    securityUnlockUntil = Date.now() + securityUnlockMinutes * 60 * 1000;
  }

  function clearSecurityUnlock() {
    securityUnlockUntil = 0;
  }

  function showSecurityPanel() {
    document.querySelectorAll("[data-account-section]").forEach(function (panel) {
      const isSecurityPanel = panel.getAttribute("data-account-section") === "security";
      panel.hidden = !isSecurityPanel;
      panel.classList.toggle("active", isSecurityPanel);
    });

    document.querySelectorAll("[data-account-panel]").forEach(function (button) {
      button.classList.toggle("active", button.getAttribute("data-account-panel") === "security");
    });

    if (window.location.hash !== "#security") {
      history.replaceState(null, "", "#security");
    }
  }

  async function sendSecurityPanelCode() {
    return await requestJson("/api/send-security-code", {
      method: "POST",
      body: {
        reason: "security-panel"
      }
    });
  }

  async function verifySecurityPanelCode(code, method) {
    return await requestJson("/api/verify-security-code", {
      method: "POST",
      body: {
        code: code,
        method: method || "email"
      }
    });
  }

  function openSecurityGateModal() {
    showMessage(securityGateMessage, "", "");
    openModal(securityGateModal);
  }

  function closeSecurityGateModal() {
    closeModal(securityGateModal);
    showMessage(securityGateMessage, "", "");
  }

  function clearSecurityCodeInput() {
    if (securityCodeInput) {
      securityCodeInput.value = "";
    }

    if (securityCodeSubmit) {
      securityCodeSubmit.disabled = true;
    }
  }

  function getSecurityCodeValue() {
    return securityCodeInput ? securityCodeInput.value.trim().replace(/\D/g, "").slice(0, 6) : "";
  }

  function updateSecurityCodeSubmitState() {
    if (securityCodeSubmit) {
      securityCodeSubmit.disabled = getSecurityCodeValue().length !== 6;
    }
  }

  function openSecurityCodeModal(method) {
    const verificationMethod = method === "authenticator" || method === "app" ? "authenticator" : "email";
    const title = getById("security-code-modal-title");

    if (securityCodeModal) {
      securityCodeModal.dataset.securityMethod = verificationMethod;
    }

    clearSecurityCodeInput();
    showMessage(securityCodeMessage, "", "");

    if (verificationMethod === "authenticator") {
      if (title) title.textContent = "Enter Authenticator Code";
      if (securityCodeModalText) securityCodeModalText.textContent = "Enter the 6-digit code from your authenticator app.";
    } else {
      if (title) title.textContent = "Check Your Inbox";
      if (securityCodeModalText) {
        securityCodeModalText.textContent = "Enter the 6-digit security code we sent to " + getMaskedEmail(currentUser && currentUser.email ? currentUser.email : "") + ".";
      }
    }

    openModal(securityCodeModal);

    setTimeout(function () {
      if (securityCodeInput) {
        securityCodeInput.focus();
      }
    }, 50);
  }

  function closeSecurityCodeModal() {
    closeModal(securityCodeModal);
    clearSecurityCodeInput();
    showMessage(securityCodeMessage, "", "");
  }

  function updateTwoFactorUI() {
    const appEnabled = Boolean(twoFactorSettings && twoFactorSettings.appEnabled);
    const emailEnabled = Boolean(twoFactorSettings && twoFactorSettings.emailEnabled);

    if (twoFactorAppStatus) {
      twoFactorAppStatus.textContent = appEnabled ? "On" : "Off";
      twoFactorAppStatus.classList.toggle("enabled", appEnabled);
    }

    if (twoFactorEmailStatus) {
      twoFactorEmailStatus.textContent = emailEnabled ? "On" : "Off";
      twoFactorEmailStatus.classList.toggle("enabled", emailEnabled);
    }

    if (twoFactorAppButton) {
      twoFactorAppButton.textContent = appEnabled ? "Disable" : "Set up app";
      twoFactorAppButton.classList.toggle("danger", appEnabled);
    }

    if (twoFactorEmailButton) {
      twoFactorEmailButton.textContent = emailEnabled ? "Disable" : "Enable email";
      twoFactorEmailButton.classList.toggle("danger", emailEnabled);
    }
  }

  async function refreshAccountUser() {
    const data = await requestJson("/api/account-profile", {
      method: "GET"
    });

    if (data.user) {
      loadAccountUser(data.user);
    }

    return data.user || null;
  }

  async function startAuthenticatorSetup() {
    if (!twoFactorAppButton) return;

    setButtonLoading(twoFactorAppButton, true, "Starting...", "Set up app");
    showMessage(twoFactorMessage, "", "");

    try {
      const data = await requestJson("/api/setup-authenticator", {
        method: "POST",
        body: {}
      });

      if (authenticatorQrImage) {
        authenticatorQrImage.src = data.qrDataUrl || "";
      }

      if (authenticatorSecretKey) {
        authenticatorSecretKey.textContent = data.secret || "";
      }

      if (authenticatorSetupCode) {
        authenticatorSetupCode.value = "";
      }

      showMessage(authenticatorSetupMessage, "", "");
      openModal(authenticatorSetupModal);

      setTimeout(function () {
        if (authenticatorSetupCode) {
          authenticatorSetupCode.focus();
        }
      }, 50);
    } catch (error) {
      showMessage(twoFactorMessage, error.message || "Could not start authenticator setup.", "error");
    } finally {
      twoFactorAppButton.disabled = false;
      updateTwoFactorUI();
    }
  }

  function closeAuthenticatorSetupModal() {
    closeModal(authenticatorSetupModal);

    if (authenticatorSetupCode) {
      authenticatorSetupCode.value = "";
    }

    showMessage(authenticatorSetupMessage, "", "");
  }

  async function disableAuthenticatorApp() {
    const codeInput = window.prompt("Enter your 6-digit authenticator app code to disable app 2FA.");

    if (codeInput === null) {
      return;
    }

    const code = String(codeInput || "").replace(/\D/g, "");

    if (code.length !== 6) {
      showMessage(twoFactorMessage, "Please enter a valid 6-digit authenticator code.", "error");
      return;
    }

    const confirmed = window.confirm("Disable authenticator app 2FA for this account?");

    if (!confirmed) {
      return;
    }

    setButtonLoading(twoFactorAppButton, true, "Disabling...", "Disable");
    showMessage(twoFactorMessage, "", "");

    try {
      const data = await requestJson("/api/disable-authenticator", {
        method: "POST",
        body: {
          code: code
        }
      });

      twoFactorSettings = data.twoFactor || Object.assign({}, twoFactorSettings, {
        appEnabled: false
      });

      updateTwoFactorUI();
      showMessage(twoFactorMessage, "Authenticator app 2FA disabled.", "success");
    } catch (error) {
      showMessage(twoFactorMessage, error.message || "Could not disable authenticator app.", "error");
    } finally {
      twoFactorAppButton.disabled = false;
      updateTwoFactorUI();
    }
  }

  async function setEmailTwoFactor(enabled) {
    setButtonLoading(twoFactorEmailButton, true, enabled ? "Enabling..." : "Disabling...", enabled ? "Enable email" : "Disable");
    showMessage(twoFactorMessage, "", "");

    try {
      const data = await requestJson("/api/set-email-2fa", {
        method: "POST",
        body: {
          enabled: enabled
        }
      });

      twoFactorSettings = data.twoFactor || Object.assign({}, twoFactorSettings, {
        emailEnabled: Boolean(enabled)
      });

      updateTwoFactorUI();
      showMessage(twoFactorMessage, enabled ? "Email 2FA enabled." : "Email 2FA disabled.", "success");
    } catch (error) {
      showMessage(twoFactorMessage, error.message || "Could not update email 2FA.", "error");
    } finally {
      twoFactorEmailButton.disabled = false;
      updateTwoFactorUI();
    }
  }

  function validateNewPassword(password) {
    if (password.length < 10 || password.length > 48) {
      return false;
    }

    return /[A-Z]/.test(password)
      && /[a-z]/.test(password)
      && /\d/.test(password)
      && /[^A-Za-z0-9]/.test(password);
  }

  function updatePasswordSubmitState() {
    if (!passwordButton || !newPasswordInput || !currentPasswordInput) return;

    passwordButton.disabled = !currentPasswordInput.value || !validateNewPassword(newPasswordInput.value);
  }

  function openPasswordModal() {
    showMessage(passwordMessage, "", "");

    if (currentPasswordInput) currentPasswordInput.value = "";
    if (newPasswordInput) newPasswordInput.value = "";

    updatePasswordSubmitState();
    openModal(passwordChangeModal);

    setTimeout(function () {
      if (currentPasswordInput) {
        currentPasswordInput.focus();
      }
    }, 50);
  }

  function closePasswordModal() {
    closeModal(passwordChangeModal);

    if (passwordForm) {
      passwordForm.reset();
    }

    showMessage(passwordMessage, "", "");
    updatePasswordSubmitState();
  }

  async function changePassword() {
    const currentPassword = currentPasswordInput ? currentPasswordInput.value : "";
    const newPassword = newPasswordInput ? newPasswordInput.value : "";

    if (!currentPassword) {
      showMessage(passwordMessage, "Please enter your current password.", "error");
      return;
    }

    if (!validateNewPassword(newPassword)) {
      showMessage(passwordMessage, "Please enter a password that matches all requirements.", "error");
      return;
    }

    setButtonLoading(passwordButton, true, "Changing...", "Confirm");
    showMessage(passwordMessage, "", "");

    try {
      const data = await requestJson("/api/change-password", {
        method: "POST",
        body: {
          currentPassword: currentPassword,
          newPassword: newPassword
        }
      });

      if (data.user) {
        loadAccountUser(data.user);
      } else {
        updatePasswordLastChangedText(data.passwordLastChangedAt || new Date().toISOString());
      }

      closePasswordModal();
      showMessage(passwordSectionMessage, data.message || "Password changed successfully.", "success");
    } catch (error) {
      showMessage(passwordMessage, error.message || "Could not change password.", "error");
    } finally {
      passwordButton.disabled = false;
      updatePasswordSubmitState();
    }
  }

  function getSessionTimeValue(session) {
    const date = getDateFromFirestoreValue(session && (session.lastSeenAt || session.createdAt));
    return date ? date.getTime() : 0;
  }

  function getLoginSessionKey(session) {
    return [
      session.deviceLabel,
      session.browserLabel,
      session.platformLabel,
      session.ipAddress
    ].map(function (value) {
      return String(value || "").trim().toLowerCase();
    }).join("|");
  }

  function getVisibleLoginSessions(sessions) {
    const visibleByDevice = new Map();

    sessions.forEach(function (session) {
      const key = getLoginSessionKey(session);
      const safeKey = key.replace(/\|/g, "");

      if (!safeKey) {
        visibleByDevice.set("session:" + String(session.id || Math.random()), session);
        return;
      }

      const existingSession = visibleByDevice.get(key);
      const sessionTime = getSessionTimeValue(session);
      const existingTime = existingSession ? getSessionTimeValue(existingSession) : 0;

      if (!existingSession || session.current || (!existingSession.current && sessionTime > existingTime)) {
        visibleByDevice.set(key, session);
      }
    });

    return Array.from(visibleByDevice.values()).sort(function (first, second) {
      if (first.current && !second.current) return -1;
      if (!first.current && second.current) return 1;
      return getSessionTimeValue(second) - getSessionTimeValue(first);
    });
  }

  function renderLoginSessions() {
    if (!loginSessionsList || !loginSessionsEmpty) return;

    const sessions = getVisibleLoginSessions(Array.isArray(loginSessions) ? loginSessions : []);
    loginSessionsEmpty.hidden = sessions.length > 0;

    loginSessionsList.innerHTML = sessions.map(function (session) {
      const sessionId = String(session.id || "");
      const currentBadge = session.current ? '<span class="account-current-badge">Current</span>' : "";
      const action = !session.current && sessionId
        ? '<button class="account-session-action" type="button" data-session-sign-out data-session-id="' + escapeHtml(sessionId) + '">Sign Out</button>'
        : "";

      return '\
        <article class="account-login-session-card">\
          <div>\
            <h4>' + escapeHtml(session.deviceLabel || "Browser session") + " " + currentBadge + '</h4>\
            <p>' + escapeHtml(session.browserLabel || "Browser") + " - " + escapeHtml(session.platformLabel || "Device") + '</p>\
            <p>Last active ' + escapeHtml(getReadableDateTime(session.lastSeenAt || session.createdAt)) + '</p>\
          </div>\
          ' + action + "\
        </article>\
      ";
    }).join("");
  }

  function getTrustedDeviceTimeValue(device) {
    const date = getDateFromFirestoreValue(device && (device.lastUsedAt || device.lastTrustedAt || device.createdAt));
    return date ? date.getTime() : 0;
  }

  function getTrustedDeviceKey(device) {
    return [
      device.deviceName,
      device.browserName,
      device.platform
    ].map(function (value) {
      return String(value || "").trim().toLowerCase();
    }).join("|");
  }

  function getVisibleTrustedDevices(devices) {
    const visibleByDevice = new Map();

    devices.forEach(function (device) {
      const key = getTrustedDeviceKey(device);
      const safeKey = key.replace(/\|/g, "");

      if (!safeKey) {
        visibleByDevice.set("device:" + String(device.trustedDeviceId || device.id || Math.random()), device);
        return;
      }

      const existingDevice = visibleByDevice.get(key);
      const deviceTime = getTrustedDeviceTimeValue(device);
      const existingTime = existingDevice ? getTrustedDeviceTimeValue(existingDevice) : 0;

      if (!existingDevice || device.current || (!existingDevice.current && deviceTime > existingTime)) {
        visibleByDevice.set(key, device);
      }
    });

    return Array.from(visibleByDevice.values()).sort(function (first, second) {
      if (first.current && !second.current) return -1;
      if (!first.current && second.current) return 1;
      return getTrustedDeviceTimeValue(second) - getTrustedDeviceTimeValue(first);
    });
  }

  function renderTrustedDevices() {
    if (!trustedDevicesList || !trustedDevicesEmpty) return;

    const devices = getVisibleTrustedDevices(Array.isArray(trustedDevices) ? trustedDevices : []);
    trustedDevicesEmpty.hidden = devices.length > 0;

    trustedDevicesList.innerHTML = devices.map(function (device) {
      const trustedDeviceId = String(device.trustedDeviceId || device.id || "");
      const currentBadge = device.current ? '<span class="account-current-badge">Current</span>' : "";

      return '\
        <article class="account-trusted-device-card">\
          <div>\
            <h4>' + escapeHtml(device.deviceName || device.browserName || "Trusted device") + " " + currentBadge + '</h4>\
            <p>' + escapeHtml(device.browserName || "Browser") + " - " + escapeHtml(device.platform || "Device") + '</p>\
            <p>Trusted ' + escapeHtml(getReadableDateTime(device.lastTrustedAt || device.createdAt)) + '</p>\
          </div>\
          <button class="account-trusted-device-remove" type="button" data-trusted-device-remove data-trusted-device-id="' + escapeHtml(trustedDeviceId) + '">Remove Trust</button>\
        </article>\
      ';
    }).join("");
  }

  function getLoginSessionById(sessionId) {
    return (Array.isArray(loginSessions) ? loginSessions : []).find(function (session) {
      return String(session.id || "") === String(sessionId || "");
    }) || null;
  }

  function getTrustedDeviceById(trustedDeviceId) {
    return (Array.isArray(trustedDevices) ? trustedDevices : []).find(function (device) {
      return String(device.trustedDeviceId || device.id || "") === String(trustedDeviceId || "");
    }) || null;
  }

  function openSignOutSessionModal(sessionId) {
    const session = getLoginSessionById(sessionId);

    if (!session || session.current) return;

    pendingSignOutSessionId = String(session.id || "");
    showMessage(signOutSessionMessage, "", "");

    if (signOutSessionConfirm) {
      signOutSessionConfirm.disabled = false;
      signOutSessionConfirm.textContent = "Sign Out";
    }

    openModal(signOutSessionModal);
  }

  function closeSignOutSessionModal() {
    pendingSignOutSessionId = "";

    if (signOutSessionConfirm) {
      signOutSessionConfirm.disabled = false;
      signOutSessionConfirm.textContent = "Sign Out";
    }

    showMessage(signOutSessionMessage, "", "");
    closeModal(signOutSessionModal);
  }

  async function signOutSelectedSession() {
    if (!pendingSignOutSessionId) return;

    const unlocked = await ensureSecurityUnlocked();

    if (!unlocked) {
      closeSignOutSessionModal();
      openSecurityGateModal();
      return;
    }

    setButtonLoading(signOutSessionConfirm, true, "Signing out...", "Sign Out");
    showMessage(signOutSessionMessage, "", "");

    try {
      await requestJson("/api/sign-out-session", {
        method: "POST",
        body: {
          sessionId: pendingSignOutSessionId
        }
      });

      loginSessions = loginSessions.filter(function (session) {
        return String(session.id || "") !== pendingSignOutSessionId;
      });

      renderLoginSessions();
      closeSignOutSessionModal();
    } catch (error) {
      showMessage(signOutSessionMessage, error.message || "Could not sign out this session.", "error");
      setButtonLoading(signOutSessionConfirm, false, "Signing out...", "Sign Out");
    }
  }

  function openRemoveTrustedDeviceModal(trustedDeviceId) {
    const device = getTrustedDeviceById(trustedDeviceId);

    if (!device) return;

    pendingTrustedDeviceId = String(device.trustedDeviceId || device.id || "");
    showMessage(removeTrustedDeviceMessage, "", "");

    if (removeTrustedDeviceConfirm) {
      removeTrustedDeviceConfirm.disabled = false;
      removeTrustedDeviceConfirm.textContent = "Remove Trust";
    }

    openModal(removeTrustedDeviceModal);
  }

  function closeRemoveTrustedDeviceModal() {
    pendingTrustedDeviceId = "";

    if (removeTrustedDeviceConfirm) {
      removeTrustedDeviceConfirm.disabled = false;
      removeTrustedDeviceConfirm.textContent = "Remove Trust";
    }

    showMessage(removeTrustedDeviceMessage, "", "");
    closeModal(removeTrustedDeviceModal);
  }

  async function removeSelectedTrustedDevice() {
    if (!pendingTrustedDeviceId) return;

    const unlocked = await ensureSecurityUnlocked();

    if (!unlocked) {
      closeRemoveTrustedDeviceModal();
      openSecurityGateModal();
      return;
    }

    setButtonLoading(removeTrustedDeviceConfirm, true, "Removing...", "Remove Trust");
    showMessage(removeTrustedDeviceMessage, "", "");

    try {
      await requestJson("/api/trusted-devices", {
        method: "POST",
        body: {
          trustedDeviceId: pendingTrustedDeviceId
        }
      });

      trustedDevices = trustedDevices.filter(function (device) {
        return String(device.trustedDeviceId || device.id || "") !== pendingTrustedDeviceId;
      });

      renderTrustedDevices();
      closeRemoveTrustedDeviceModal();
    } catch (error) {
      showMessage(removeTrustedDeviceMessage, error.message || "Could not remove trusted device.", "error");
      setButtonLoading(removeTrustedDeviceConfirm, false, "Removing...", "Remove Trust");
    }
  }

  async function signOutEverywhere() {
    const unlocked = await ensureSecurityUnlocked();

    if (!unlocked) {
      openSecurityGateModal();
      return;
    }

    if (!window.confirm("This will sign your account out from every device. Continue?")) {
      return;
    }

    setButtonLoading(signOutEverywhereButton, true, "Signing out...", "Sign out everywhere");
    showMessage(signOutEverywhereMessage, "", "");

    try {
      await requestJson("/api/sign-out-everywhere", {
        method: "POST",
        body: {}
      });

      clearSecurityUnlock();
      sessionStorage.removeItem("auc-atlas-login-2fa-pending");
      localStorage.removeItem(loginRedirectKey);
      window.location.href = "login.html";
    } catch (error) {
      showMessage(signOutEverywhereMessage, error.message || "Could not sign out from all devices.", "error");
      setButtonLoading(signOutEverywhereButton, false, "Signing out...", "Sign out everywhere");
    }
  }

  function updateDeleteAccountConfirmButton() {
    if (!deleteAccountModalConfirm || !deleteAccountConfirmText) return;
    deleteAccountModalConfirm.disabled = deleteAccountConfirmText.value.trim().toUpperCase() !== "DELETE";
  }

  async function openDeleteAccountModal() {
    const unlocked = await ensureSecurityUnlocked();

    if (!unlocked) {
      openSecurityGateModal();
      return;
    }

    if (deleteAccountConfirmText) {
      deleteAccountConfirmText.value = "";
    }

    updateDeleteAccountConfirmButton();
    showMessage(deleteAccountModalMessage, "", "");
    openModal(deleteAccountModal);

    setTimeout(function () {
      if (deleteAccountConfirmText) {
        deleteAccountConfirmText.focus();
      }
    }, 50);
  }

  function closeDeleteAccountModal() {
    if (deleteAccountConfirmText) {
      deleteAccountConfirmText.value = "";
    }

    if (deleteAccountModalConfirm) {
      deleteAccountModalConfirm.disabled = true;
      deleteAccountModalConfirm.textContent = "Delete Account";
    }

    showMessage(deleteAccountModalMessage, "", "");
    closeModal(deleteAccountModal);
  }

  async function deleteAccountPermanently() {
    if (!deleteAccountConfirmText || deleteAccountConfirmText.value.trim().toUpperCase() !== "DELETE") {
      showMessage(deleteAccountModalMessage, "Type DELETE to confirm.", "error");
      return;
    }

    setButtonLoading(deleteAccountModalConfirm, true, "Deleting...", "Delete Account");
    showMessage(deleteAccountModalMessage, "", "");

    try {
      await requestJson("/api/delete-account", {
        method: "POST",
        body: {
          confirmation: "DELETE"
        }
      });

      clearSecurityUnlock();
      sessionStorage.removeItem("auc-atlas-login-2fa-pending");
      localStorage.removeItem(loginRedirectKey);
      sessionStorage.setItem(loginMessageKey, "Your account has been deleted.");
      window.location.href = "login.html";
    } catch (error) {
      showMessage(deleteAccountModalMessage, error.message || "Could not delete your account.", "error");
      deleteAccountModalConfirm.disabled = false;
      deleteAccountModalConfirm.textContent = "Delete Account";
      updateDeleteAccountConfirmButton();
    }
  }

  function loadAccountUser(user) {
    cacheElements();

    currentUser = user || {};
    twoFactorSettings = currentUser.twoFactor && typeof currentUser.twoFactor === "object" ? currentUser.twoFactor : {};
    loginSessions = Array.isArray(currentUser.sessions) ? currentUser.sessions : [];
    trustedDevices = Array.isArray(currentUser.trustedDevices) ? currentUser.trustedDevices : [];

    updatePasswordLastChangedText(currentUser.passwordLastChangedAt || null);
    updateTwoFactorUI();
    renderLoginSessions();
    renderTrustedDevices();
  }

  function wireEvents() {
    document.addEventListener("click", async function (event) {
      const button = event.target.closest("[data-account-panel='security']");

      if (!button) return;

      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();

      button.disabled = true;

      try {
        const unlocked = await ensureSecurityUnlocked();

        if (!unlocked) {
          openSecurityGateModal();
          return;
        }

        showSecurityPanel();
      } finally {
        button.disabled = false;
      }
    }, true);

    if (securityGateModalContinue) {
      securityGateModalContinue.addEventListener("click", async function () {
        setButtonLoading(securityGateModalContinue, true, "Checking...", "Continue");
        showMessage(securityGateMessage, "", "");

        try {
          const data = await sendSecurityPanelCode();
          const method = data.method === "authenticator" || data.method === "app" ? "authenticator" : "email";
          closeSecurityGateModal();
          openSecurityCodeModal(method);
        } catch (error) {
          showMessage(securityGateMessage, error.message || "Could not start security verification.", "error");
        } finally {
          setButtonLoading(securityGateModalContinue, false, "Checking...", "Continue");
        }
      });
    }

    [securityGateModalCancel, securityGateModalClose, securityGateModalBackdrop].forEach(function (element) {
      if (element) element.addEventListener("click", closeSecurityGateModal);
    });

    if (securityCodeInput) {
      securityCodeInput.addEventListener("input", function () {
        securityCodeInput.value = getSecurityCodeValue();
        updateSecurityCodeSubmitState();
      });
    }

    if (securityCodeForm) {
      securityCodeForm.addEventListener("submit", async function (event) {
        event.preventDefault();

        const code = getSecurityCodeValue();
        const method = securityCodeModal && securityCodeModal.dataset.securityMethod ? securityCodeModal.dataset.securityMethod : "email";

        if (code.length !== 6) {
          showMessage(securityCodeMessage, "Please enter the 6-digit security code.", "error");
          return;
        }

        setButtonLoading(securityCodeSubmit, true, "Verifying...", "Continue");
        showMessage(securityCodeMessage, "", "");

        try {
          const data = await verifySecurityPanelCode(code, method);
          saveSecurityUnlock(data.unlockUntil || "");
          closeSecurityCodeModal();
          showSecurityPanel();
        } catch (error) {
          showMessage(securityCodeMessage, error.message || "The security code is incorrect.", "error");
          clearSecurityCodeInput();

          if (securityCodeInput) {
            securityCodeInput.focus();
          }
        } finally {
          securityCodeSubmit.textContent = "Continue";
          updateSecurityCodeSubmitState();
        }
      });
    }

    [securityCodeModalCancel, securityCodeModalBackdrop].forEach(function (element) {
      if (element) element.addEventListener("click", closeSecurityCodeModal);
    });

    if (openPasswordModalButton) openPasswordModalButton.addEventListener("click", openPasswordModal);
    if (passwordChangeModalBackdrop) passwordChangeModalBackdrop.addEventListener("click", closePasswordModal);
    if (passwordChangeModalClose) passwordChangeModalClose.addEventListener("click", closePasswordModal);
    if (passwordChangeModalCancel) passwordChangeModalCancel.addEventListener("click", closePasswordModal);

    [currentPasswordInput, newPasswordInput].forEach(function (input) {
      if (input) input.addEventListener("input", updatePasswordSubmitState);
    });

    if (passwordForm) {
      passwordForm.addEventListener("submit", function (event) {
        event.preventDefault();
        changePassword();
      });
    }

    if (twoFactorAppButton) {
      twoFactorAppButton.addEventListener("click", function () {
        if (twoFactorSettings && twoFactorSettings.appEnabled) {
          disableAuthenticatorApp();
          return;
        }

        startAuthenticatorSetup();
      });
    }

    if (twoFactorEmailButton) {
      twoFactorEmailButton.addEventListener("click", function () {
        setEmailTwoFactor(!(twoFactorSettings && twoFactorSettings.emailEnabled));
      });
    }

    if (authenticatorSetupForm) {
      authenticatorSetupForm.addEventListener("submit", async function (event) {
        event.preventDefault();

        const code = authenticatorSetupCode ? authenticatorSetupCode.value.trim().replace(/\D/g, "") : "";

        if (code.length !== 6) {
          showMessage(authenticatorSetupMessage, "Please enter the 6-digit authenticator code.", "error");
          return;
        }

        setButtonLoading(authenticatorSetupConfirm, true, "Verifying...", "Verify and enable");
        showMessage(authenticatorSetupMessage, "", "");

        try {
          const data = await requestJson("/api/verify-authenticator-setup", {
            method: "POST",
            body: {
              code: code
            }
          });

          twoFactorSettings = data.twoFactor || Object.assign({}, twoFactorSettings, {
            appEnabled: true
          });

          updateTwoFactorUI();
          closeAuthenticatorSetupModal();
          showMessage(twoFactorMessage, "Authenticator app 2FA enabled.", "success");
        } catch (error) {
          showMessage(authenticatorSetupMessage, error.message || "Could not verify that code.", "error");
        } finally {
          setButtonLoading(authenticatorSetupConfirm, false, "Verifying...", "Verify and enable");
        }
      });
    }

    [authenticatorSetupModalBackdrop, authenticatorSetupModalClose, authenticatorSetupModalCancel].forEach(function (element) {
      if (element) element.addEventListener("click", closeAuthenticatorSetupModal);
    });

    if (loginSessionsList) {
      loginSessionsList.addEventListener("click", function (event) {
        const button = event.target.closest("[data-session-sign-out]");
        if (button) openSignOutSessionModal(button.dataset.sessionId);
      });
    }

    if (trustedDevicesList) {
      trustedDevicesList.addEventListener("click", function (event) {
        const button = event.target.closest("[data-trusted-device-remove]");
        if (button) openRemoveTrustedDeviceModal(button.dataset.trustedDeviceId);
      });
    }

    if (signOutSessionCancel) signOutSessionCancel.addEventListener("click", closeSignOutSessionModal);
    if (signOutSessionModalBackdrop) signOutSessionModalBackdrop.addEventListener("click", closeSignOutSessionModal);
    if (signOutSessionConfirm) signOutSessionConfirm.addEventListener("click", signOutSelectedSession);

    if (removeTrustedDeviceCancel) removeTrustedDeviceCancel.addEventListener("click", closeRemoveTrustedDeviceModal);
    if (removeTrustedDeviceModalBackdrop) removeTrustedDeviceModalBackdrop.addEventListener("click", closeRemoveTrustedDeviceModal);
    if (removeTrustedDeviceConfirm) removeTrustedDeviceConfirm.addEventListener("click", removeSelectedTrustedDevice);

    if (signOutEverywhereButton) signOutEverywhereButton.addEventListener("click", signOutEverywhere);
    if (deleteAccountButton) deleteAccountButton.addEventListener("click", openDeleteAccountModal);
    if (deleteAccountConfirmText) deleteAccountConfirmText.addEventListener("input", updateDeleteAccountConfirmButton);
    if (deleteAccountModalCancel) deleteAccountModalCancel.addEventListener("click", closeDeleteAccountModal);
    if (deleteAccountModalBackdrop) deleteAccountModalBackdrop.addEventListener("click", closeDeleteAccountModal);
    if (deleteAccountModalConfirm) deleteAccountModalConfirm.addEventListener("click", deleteAccountPermanently);

    document.addEventListener("keydown", function (event) {
      if (event.key !== "Escape") return;

      if (securityCodeModal && !securityCodeModal.hidden) closeSecurityCodeModal();
      if (securityGateModal && !securityGateModal.hidden) closeSecurityGateModal();
      if (authenticatorSetupModal && !authenticatorSetupModal.hidden) closeAuthenticatorSetupModal();
      if (passwordChangeModal && !passwordChangeModal.hidden) closePasswordModal();
      if (deleteAccountModal && !deleteAccountModal.hidden) closeDeleteAccountModal();
      if (signOutSessionModal && !signOutSessionModal.hidden) closeSignOutSessionModal();
      if (removeTrustedDeviceModal && !removeTrustedDeviceModal.hidden) closeRemoveTrustedDeviceModal();
    });
  }

  function initSecurityPanel() {
    if (initialized) return;

    initialized = true;
    cacheElements();
    moveModalsToBody();
    wireEvents();
    updatePasswordSubmitState();
    updateTwoFactorUI();
    renderLoginSessions();
    renderTrustedDevices();
    refreshSecurityUnlockStatus().catch(function () {});
  }

  window.aucAtlasAccountSecurity = {
    loadAccountUser: loadAccountUser,
    refreshSecurityUnlockStatus: refreshSecurityUnlockStatus,
    refreshAccountUser: refreshAccountUser
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initSecurityPanel);
  } else {
    initSecurityPanel();
  }
})();
