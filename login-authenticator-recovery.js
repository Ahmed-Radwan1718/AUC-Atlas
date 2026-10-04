(function () {
  const recoveryButton = document.getElementById("login-two-factor-email-recovery");
  const twoFactorPanel = document.getElementById("login-two-factor-panel");
  const recoveryPanel = document.getElementById("login-authenticator-recovery-panel");
  const recoveryForm = document.getElementById("login-authenticator-recovery-form");
  const recoveryDescription = document.getElementById("login-authenticator-recovery-description");
  const recoveryInputs = Array.from(document.querySelectorAll("[data-login-authenticator-recovery-input]"));
  const recoverySubmit = document.getElementById("login-authenticator-recovery-submit");
  const recoveryResend = document.getElementById("login-authenticator-recovery-resend");
  const recoveryBack = document.getElementById("login-authenticator-recovery-back");
  const recoveryMessage = document.getElementById("login-authenticator-recovery-message");

  if (
    !recoveryButton ||
    !twoFactorPanel ||
    !recoveryPanel ||
    !recoveryForm ||
    !recoveryDescription ||
    !recoveryInputs.length ||
    !recoverySubmit ||
    !recoveryResend ||
    !recoveryBack ||
    !recoveryMessage
  ) {
    return;
  }

  let activeChallengeId = "";
  let requestingCode = false;
  let verifyingCode = false;
  let emailOnlyMode = false;

  function restoreRecoveryButtonLabel() {
    recoveryButton.innerHTML =
      "Lost access to your authenticator app?<br><span>Receive a code by email</span>";
  }

  function showRecoveryMessage(message, type) {
    recoveryMessage.textContent = message;
    recoveryMessage.className = "auth-message";

    if (type) {
      recoveryMessage.classList.add(type);
    }
  }

  function clearRecoveryInputs() {
    recoveryInputs.forEach(function (input) {
      input.value = "";
    });
  }

  function getRecoveryCode() {
    return recoveryInputs.map(function (input) {
      return input.value.trim();
    }).join("");
  }

  function focusFirstRecoveryInput() {
    if (recoveryInputs[0]) {
      recoveryInputs[0].focus();
    }
  }

  function openRecoveryPanel(email) {
    recoveryDescription.textContent =
      "Enter the 6-digit code sent to " +
      (email || "your AUC email address") +
      ". It expires in 10 minutes.";

    recoveryBack.textContent = emailOnlyMode
      ? "Cancel sign in"
      : "Back to authenticator app";

    clearRecoveryInputs();
    showTwoFactorMessage("", "");
    showRecoveryMessage("Code sent. Check your inbox.", "success");

    twoFactorPanel.hidden = true;
    recoveryPanel.hidden = false;
    recoverySubmit.disabled = false;
    recoverySubmit.textContent = "Verify Code";

    setTimeout(focusFirstRecoveryInput, 50);
  }

  function closeRecoveryPanel() {
    const wasEmailOnlyMode = emailOnlyMode;

    recoveryPanel.hidden = true;
    activeChallengeId = "";
    verifyingCode = false;
    emailOnlyMode = false;

    clearRecoveryInputs();
    showRecoveryMessage("", "");

    recoverySubmit.disabled = false;
    recoverySubmit.textContent = "Verify Code";
    recoveryResend.disabled = false;
    recoveryResend.textContent = "Send a new code";
    recoveryButton.disabled = false;
    restoreRecoveryButtonLabel();

    if (wasEmailOnlyMode) {
      twoFactorPanel.hidden = true;
      awaitingAuthenticatorCode = false;
      loginButton.disabled = false;
      loginButton.textContent = "Log In";
      showMessage("Sign in cancelled.", "error");
      return;
    }

    twoFactorPanel.hidden = false;
    setTimeout(focusFirstTwoFactorCodeInput, 50);
  }

  async function requestRecoveryCode(fromPanel) {
    if (requestingCode) {
      return;
    }

    requestingCode = true;
    recoveryButton.disabled = true;
    recoveryResend.disabled = true;

    if (fromPanel) {
      recoveryResend.textContent = "Sending...";
      showRecoveryMessage("", "");
    } else if (!emailOnlyMode) {
      recoveryButton.textContent = "Sending code...";
      showTwoFactorMessage("", "");
    }

    try {
      const response = await fetch("/api/login-code", {
        method: "POST",
        credentials: "same-origin",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          action: "request",
          recovery: true
        })
      });

      const data = await response.json().catch(function () {
        return {};
      });

      if (
        !response.ok ||
        !data.success ||
        !/^[a-f0-9]{64}$/i.test(data.challengeId || "")
      ) {
        throw new Error(data.error || "Could not send the email verification code.");
      }

      activeChallengeId = data.challengeId;
      openRecoveryPanel(data.email);
    } catch (error) {
      const message =
        error.message ||
        "Could not send the email verification code. Please try again.";

      if (recoveryPanel.hidden && emailOnlyMode) {
        emailOnlyMode = false;
        awaitingAuthenticatorCode = false;
        loginButton.disabled = false;
        loginButton.textContent = "Log In";
        showMessage(message, "error");
      } else if (recoveryPanel.hidden) {
        showTwoFactorMessage(message, "error");
      } else {
        showRecoveryMessage(message, "error");
      }
    } finally {
      requestingCode = false;
      recoveryButton.disabled = false;
      recoveryResend.disabled = false;
      recoveryResend.textContent = "Send a new code";
      restoreRecoveryButtonLabel();
    }
  }

  async function verifyRecoveryCode() {
    if (verifyingCode) {
      return;
    }

    const code = getRecoveryCode();

    if (!activeChallengeId) {
      showRecoveryMessage("Request a new recovery code.", "error");
      return;
    }

    if (!/^\d{6}$/.test(code)) {
      showRecoveryMessage("Please enter the 6-digit code.", "error");
      focusFirstRecoveryInput();
      return;
    }

    verifyingCode = true;
    recoverySubmit.disabled = true;
    recoverySubmit.textContent = "Verifying...";
    showRecoveryMessage("", "");

    try {
      const response = await fetch("/api/login-code", {
        method: "POST",
        credentials: "same-origin",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          action: "verify",
          recovery: true,
          challengeId: activeChallengeId,
          code
        })
      });

      const data = await response.json().catch(function () {
        return {};
      });

      if (!response.ok || !data.success) {
        throw new Error(
          data.error ||
          "The email verification code is invalid or has expired."
        );
      }

      recoveryPanel.hidden = true;
      activeChallengeId = "";
      awaitingAuthenticatorCode = false;
      emailOnlyMode = false;
      clearRecoveryInputs();
      showRecoveryMessage("", "");
      finishLogin(data.user || null);
    } catch (error) {
      showRecoveryMessage(
        error.message ||
        "The recovery code is invalid or has expired.",
        "error"
      );

      clearRecoveryInputs();
      focusFirstRecoveryInput();
    } finally {
      verifyingCode = false;

      if (!recoveryPanel.hidden) {
        recoverySubmit.disabled = false;
        recoverySubmit.textContent = "Verify Code";
      }
    }
  }

  recoveryInputs.forEach(function (input, index) {
    input.addEventListener("input", function () {
      input.value = input.value.replace(/\D/g, "").slice(0, 1);
      showRecoveryMessage("", "");

      if (input.value && recoveryInputs[index + 1]) {
        recoveryInputs[index + 1].focus();
      }
    });

    input.addEventListener("keydown", function (event) {
      if (
        event.key === "Backspace" &&
        !input.value &&
        recoveryInputs[index - 1]
      ) {
        recoveryInputs[index - 1].focus();
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

      recoveryInputs.forEach(function (codeInput, codeIndex) {
        codeInput.value = pastedCode.charAt(codeIndex) || "";
      });

      const focusIndex =
        Math.min(pastedCode.length, recoveryInputs.length) - 1;

      if (recoveryInputs[focusIndex]) {
        recoveryInputs[focusIndex].focus();
      }
    });
  });

  window.startLoginEmailTwoFactor = function () {
    emailOnlyMode = true;
    return requestRecoveryCode(false);
  };

  recoveryButton.addEventListener("click", function () {
    emailOnlyMode = false;
    requestRecoveryCode(false);
  });

  recoveryForm.addEventListener("submit", function (event) {
    event.preventDefault();
    verifyRecoveryCode();
  });

  recoveryResend.addEventListener("click", function () {
    requestRecoveryCode(true);
  });

  recoveryBack.addEventListener("click", closeRecoveryPanel);

  document.addEventListener("keydown", function (event) {
    if (
      event.key === "Escape" &&
      !recoveryPanel.hidden
    ) {
      closeRecoveryPanel();
    }
  });
})();
