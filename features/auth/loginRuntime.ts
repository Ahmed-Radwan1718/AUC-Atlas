// @ts-nocheck
// Original AUC Atlas login, email-code, authenticator-recovery behavior.
// This temporary compatibility module runs after the React page mounts.
import { getApps, initializeApp } from "firebase/app";
import {
  GoogleAuthProvider, getAuth, inMemoryPersistence,
  setPersistence, signInWithPopup, signOut
} from "firebase/auth";

export function initializeLogin() {
  const root=document.querySelector(".auth-page");
  if(!root || root.getAttribute("data-atlas-login-initialized")==="true")return;
  root.setAttribute("data-atlas-login-initialized","true");

    const loginForm = document.getElementById("login-form");
    const loginButton = document.getElementById("login-submit");
    const loginMessage = document.getElementById("login-message");
    const passwordVisibilityToggles = document.querySelectorAll(".auth-password-visibility-toggle");
    const passwordlessLoginButton = document.getElementById("login-passwordless-button");
    const twoFactorPanel = document.getElementById("login-two-factor-panel");
    const twoFactorForm = document.getElementById("login-two-factor-form");
    const twoFactorCodeInputs = Array.from(document.querySelectorAll("[data-login-two-factor-input]"));
    const twoFactorSubmit = document.getElementById("login-two-factor-submit");
    const twoFactorRecoveryButton = document.getElementById("login-two-factor-email-recovery");
    const twoFactorMessage = document.getElementById("login-two-factor-message");

    let awaitingAuthenticatorCode = false;

    function showMessage(message, type) {
      loginMessage.textContent = message;
      loginMessage.className = "auth-message";

      if (type) {
        loginMessage.classList.add(type);
      }
    }

    function showTwoFactorMessage(message, type) {
      twoFactorMessage.textContent = message;
      twoFactorMessage.className = "auth-message";

      if (type) {
        twoFactorMessage.classList.add(type);
      }
    }

    function clearLocalSignedInState() {
      try {
        localStorage.removeItem("auc-atlas-signed-in");
        localStorage.removeItem("aucAtlasSignedIn");
      } catch (error) {}

      window.aucAtlasCurrentUser = null;
    }

    function markLocalSignedIn(user) {
      try {
        localStorage.setItem("auc-atlas-signed-in", "1");
        localStorage.setItem("aucAtlasSignedIn", "true");
      } catch (error) {}

      window.aucAtlasCurrentUser = user || null;
    }

    function getLoginRedirectTarget() {
      const savedRedirect = localStorage.getItem("auc-atlas-login-redirect");

      if (savedRedirect) {
        localStorage.removeItem("auc-atlas-login-redirect");
        return savedRedirect;
      }

      return "/accounts";
    }

    function finishLogin(user) {
      markLocalSignedIn(user);

      if (twoFactorPanel && !twoFactorPanel.hidden) {
        showTwoFactorMessage("Logged in successfully.", "success");
      } else {
        showMessage("Logged in successfully.", "success");
      }

      setTimeout(function () {
        window.location.href = getLoginRedirectTarget();
      }, 700);
    }

    window.handleAucAtlasGoogleLoginResult =
      async function (data) {
        const result =
          data || {};

        if (result.requiresTwoFactor) {
          if (result.method === "email") {
            if (
              typeof window.startLoginEmailTwoFactor !==
              "function"
            ) {
              throw new Error(
                "Email verification could not be opened."
              );
            }

            awaitingAuthenticatorCode =
              true;

            try {
              await window
                .startLoginEmailTwoFactor();
            } catch (error) {
              awaitingAuthenticatorCode =
                false;

              throw error;
            }

            return;
          }

          openTwoFactorPanel({
            emailRecoveryAvailable:
              Boolean(
                result.emailRecoveryAvailable
              )
          });

          return;
        }

        finishLogin(
          result.user || null
        );
      };

    function clearTwoFactorCodeInputs() {
      twoFactorCodeInputs.forEach(function (input) {
        input.value = "";
      });
    }

    function getTwoFactorCodeValue() {
      return twoFactorCodeInputs.map(function (input) {
        return input.value.trim();
      }).join("");
    }

    function focusFirstTwoFactorCodeInput() {
      if (twoFactorCodeInputs[0]) {
        twoFactorCodeInputs[0].focus();
      }
    }

    function openTwoFactorPanel(options) {
      const settings = options || {};

      clearLocalSignedInState();
      awaitingAuthenticatorCode = true;
      clearTwoFactorCodeInputs();
      showMessage("", "");
      showTwoFactorMessage("", "");

      twoFactorRecoveryButton.hidden =
        !Boolean(settings.emailRecoveryAvailable);

      twoFactorPanel.hidden = false;
      twoFactorSubmit.disabled = false;
      twoFactorSubmit.textContent = "Verify Code";

      setTimeout(function () {
        focusFirstTwoFactorCodeInput();
      }, 50);
    }

    function closeTwoFactorPanel(message) {
      awaitingAuthenticatorCode = false;
      twoFactorPanel.hidden = true;
      clearTwoFactorCodeInputs();
      showTwoFactorMessage("", "");

      twoFactorSubmit.disabled = false;
      twoFactorSubmit.textContent = "Verify Code";
      loginButton.disabled = false;
      loginButton.textContent = "Log In";

      if (message) {
        showMessage(message, "error");
      }
    }

    async function verifyAuthenticatorLogin() {
      const code = getTwoFactorCodeValue();

      if (!/^\d{6}$/.test(code)) {
        showTwoFactorMessage("Please enter your 6-digit authenticator code.", "error");
        focusFirstTwoFactorCodeInput();
        return;
      }

      twoFactorSubmit.disabled = true;
      twoFactorSubmit.textContent = "Verifying...";
      showTwoFactorMessage("", "");

      try {
        const response = await fetch("/api/verify-login-authenticator", {
          method: "POST",
          credentials: "same-origin",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            code: code
          })
        });

        const data = await response.json().catch(function () {
          return {};
        });

        if (!response.ok || !data.success) {
          throw new Error(data.error || "Invalid authenticator code.");
        }

        awaitingAuthenticatorCode = false;
        finishLogin(data.user || null);
      } catch (error) {
        showTwoFactorMessage(error.message || "The authenticator code is incorrect.", "error");
        clearTwoFactorCodeInputs();
        focusFirstTwoFactorCodeInput();
      } finally {
        if (awaitingAuthenticatorCode) {
          twoFactorSubmit.disabled = false;
          twoFactorSubmit.textContent = "Verify Code";
        }
      }
    }

    passwordVisibilityToggles.forEach(function (toggleButton) {
      const targetId = toggleButton.getAttribute("data-target");
      const targetInput = document.getElementById(targetId);

      toggleButton.addEventListener("click", function () {
        if (!targetInput) {
          return;
        }

        if (targetInput.type === "password") {
          targetInput.type = "text";
          toggleButton.classList.remove("password-hidden");
          toggleButton.classList.add("password-visible");
          toggleButton.setAttribute("aria-label", "Hide password");
        } else {
          targetInput.type = "password";
          toggleButton.classList.add("password-hidden");
          toggleButton.classList.remove("password-visible");
          toggleButton.setAttribute("aria-label", "Show password");
        }
      });
    });

    twoFactorCodeInputs.forEach(function (input, index) {
      input.addEventListener("input", function () {
        input.value = input.value.replace(/\D/g, "").slice(0, 1);

        if (input.value && twoFactorCodeInputs[index + 1]) {
          twoFactorCodeInputs[index + 1].focus();
        }
      });

      input.addEventListener("keydown", function (event) {
        if (event.key === "Backspace" && !input.value && twoFactorCodeInputs[index - 1]) {
          twoFactorCodeInputs[index - 1].focus();
        }
      });

      input.addEventListener("paste", function (event) {
        const pastedCode = event.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);

        if (!pastedCode) {
          return;
        }

        event.preventDefault();

        twoFactorCodeInputs.forEach(function (codeInput, codeIndex) {
          codeInput.value = pastedCode.charAt(codeIndex) || "";
        });

        const focusIndex = Math.min(pastedCode.length, twoFactorCodeInputs.length) - 1;

        if (twoFactorCodeInputs[focusIndex]) {
          twoFactorCodeInputs[focusIndex].focus();
        }
      });
    });

    loginForm.addEventListener("submit", async function (event) {
      event.preventDefault();

      const email = document.getElementById("login-email").value.trim();
      const password = document.getElementById("login-password").value;

      loginButton.disabled = true;
      loginButton.textContent = "Logging In...";
      showMessage("", "");

      try {
        const response = await fetch("/api/login", {
          method: "POST",
          credentials: "same-origin",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            email: email,
            password: password
          })
        });

        const data = await response.json().catch(function () {
          return {};
        });

        if (!response.ok || !data.success) {
          throw new Error(data.error || "Incorrect email or password.");
        }

        if (data.requiresTwoFactor) {
          if (data.method === "email") {
            if (typeof window.startLoginEmailTwoFactor !== "function") {
              throw new Error("Email verification could not be opened.");
            }

            awaitingAuthenticatorCode = true;
            await window.startLoginEmailTwoFactor();
            return;
          }

          openTwoFactorPanel({
            emailRecoveryAvailable: Boolean(data.emailRecoveryAvailable)
          });
          return;
        }

        finishLogin(data.user || null);
      } catch (error) {
        clearLocalSignedInState();
        showMessage(error.message || "Something went wrong. Please try again.", "error");
      } finally {
        if (!awaitingAuthenticatorCode) {
          loginButton.disabled = false;
          loginButton.textContent = "Log In";
        }
      }
    });

    twoFactorForm.addEventListener("submit", async function (event) {
      event.preventDefault();
      await verifyAuthenticatorLogin();
    });

  
(function () {
  const emailInput =
    document.getElementById(
      "login-email"
    );

  const passwordlessButton =
    document.getElementById(
      "login-passwordless-button"
    );

  const emailCodePanel =
    document.getElementById(
      "login-email-code-panel"
    );

  const emailCodeForm =
    document.getElementById(
      "login-email-code-form"
    );

  const emailCodeDescription =
    document.getElementById(
      "login-email-code-description"
    );

  const emailCodeInputs =
    Array.from(
      document.querySelectorAll(
        "[data-login-email-code-input]"
      )
    );

  const emailCodeSubmit =
    document.getElementById(
      "login-email-code-submit"
    );

  const emailCodeResend =
    document.getElementById(
      "login-email-code-resend"
    );

  const emailCodeCancel =
    document.getElementById(
      "login-email-code-cancel"
    );

  const emailCodeMessage =
    document.getElementById(
      "login-email-code-message"
    );

  if (
    !emailInput ||
    !passwordlessButton ||
    !emailCodePanel ||
    !emailCodeForm ||
    !emailCodeInputs.length ||
    !emailCodeSubmit ||
    !emailCodeResend ||
    !emailCodeCancel ||
    !emailCodeMessage
  ) {
    return;
  }

  let activeChallengeId = "";
  let activeEmailAddress = "";
  let requestingCode = false;
  let verifyingCode = false;

  function showMainMessage(
    message,
    type
  ) {
    if (
      typeof showMessage ===
      "function"
    ) {
      showMessage(
        message,
        type
      );

      return;
    }

    const messageElement =
      document.getElementById(
        "login-message"
      );

    if (!messageElement) {
      return;
    }

    messageElement.textContent =
      message;

    messageElement.className =
      "auth-message" +
      (
        type
          ? " " + type
          : ""
      );
  }

  function showEmailCodeMessage(
    message,
    type
  ) {
    emailCodeMessage.textContent =
      message;

    emailCodeMessage.className =
      "auth-message" +
      (
        type
          ? " " + type
          : ""
      );
  }

  function clearEmailCodeInputs() {
    emailCodeInputs.forEach(
      function (input) {
        input.value = "";
      }
    );
  }

  function getEmailCodeValue() {
    return emailCodeInputs
      .map(function (input) {
        return input.value.trim();
      })
      .join("");
  }

  function focusFirstEmailCodeInput() {
    if (emailCodeInputs[0]) {
      emailCodeInputs[0].focus();
    }
  }

  function setRequestButtonsDisabled(
    disabled
  ) {
    passwordlessButton.disabled =
      disabled;

    emailCodeResend.disabled =
      disabled;
  }

  function openEmailCodePanel(
    email
  ) {
    if (
      typeof clearLocalSignedInState ===
      "function"
    ) {
      clearLocalSignedInState();
    }

    activeEmailAddress = email;

    if (emailCodeDescription) {
      emailCodeDescription.textContent =
        "Enter the 6-digit code sent to " +
        email +
        ". It expires in 10 minutes.";
    }

    clearEmailCodeInputs();
    showMainMessage("", "");
    showEmailCodeMessage(
      "Code sent. Check your inbox.",
      "success"
    );

    emailCodePanel.hidden = false;
    emailCodeSubmit.disabled = false;
    emailCodeSubmit.textContent =
      "Verify Code";

    window.setTimeout(
      function () {
        focusFirstEmailCodeInput();
      },
      50
    );
  }

  function closeEmailCodePanel(
    message
  ) {
    emailCodePanel.hidden = true;
    activeChallengeId = "";
    activeEmailAddress = "";
    verifyingCode = false;

    clearEmailCodeInputs();
    showEmailCodeMessage("", "");

    emailCodeSubmit.disabled = false;
    emailCodeSubmit.textContent =
      "Verify Code";

    emailCodeResend.disabled = false;
    emailCodeResend.textContent =
      "Send a new code";

    passwordlessButton.disabled =
      false;

    passwordlessButton.textContent =
      "Email Me a Sign-In Code";

    if (message) {
      showMainMessage(
        message,
        "error"
      );
    }
  }

  function isValidAucEmail(email) {
    return /^[^@\s]+@aucegypt\.edu$/i
      .test(email);
  }

  async function requestEmailCode(
    options
  ) {
    if (requestingCode) {
      return;
    }

    const settings = options || {};

    const email = String(
      settings.email ||
      emailInput.value ||
      ""
    )
      .trim()
      .toLowerCase();

    if (!isValidAucEmail(email)) {
      showMainMessage(
        "Please enter your AUC email address (@aucegypt.edu).",
        "error"
      );

      emailInput.focus();
      return;
    }

    requestingCode = true;

    setRequestButtonsDisabled(true);

    if (settings.fromPanel) {
      emailCodeResend.textContent =
        "Sending...";
      showEmailCodeMessage("", "");
    } else {
      passwordlessButton.textContent =
        "Sending...";
      showMainMessage("", "");
    }

    try {
      const response = await fetch(
        "/api/login-code",
        {
          method: "POST",
          credentials:
            "same-origin",
          headers: {
            "Content-Type":
              "application/json"
          },
          body: JSON.stringify({
            action: "request",
            email
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
        !/^[a-f0-9]{64}$/i.test(
          data.challengeId || ""
        )
      ) {
        throw new Error(
          data.error ||
          "Could not send the sign-in code."
        );
      }

      activeChallengeId =
        data.challengeId;

      emailInput.value = email;

      openEmailCodePanel(email);
    } catch (error) {
      const message =
        error.message ||
        "Could not send the sign-in code. Please try again.";

      if (emailCodePanel.hidden) {
        showMainMessage(
          message,
          "error"
        );
      } else {
        showEmailCodeMessage(
          message,
          "error"
        );
      }
    } finally {
      requestingCode = false;

      setRequestButtonsDisabled(
        false
      );

      passwordlessButton.textContent =
        "Email Me a Sign-In Code";

      emailCodeResend.textContent =
        "Send a new code";
    }
  }

  async function verifyEmailCode() {
    if (verifyingCode) {
      return;
    }

    const code =
      getEmailCodeValue();

    if (
      !activeChallengeId ||
      !activeEmailAddress
    ) {
      showEmailCodeMessage(
        "Request a new sign-in code.",
        "error"
      );

      return;
    }

    if (!/^\d{6}$/.test(code)) {
      showEmailCodeMessage(
        "Please enter the 6-digit code.",
        "error"
      );

      focusFirstEmailCodeInput();
      return;
    }

    verifyingCode = true;

    emailCodeSubmit.disabled = true;
    emailCodeSubmit.textContent =
      "Verifying...";

    showEmailCodeMessage("", "");

    try {
      const response = await fetch(
        "/api/login-code",
        {
          method: "POST",
          credentials:
            "same-origin",
          headers: {
            "Content-Type":
              "application/json"
          },
          body: JSON.stringify({
            action: "verify",
            email:
              activeEmailAddress,
            challengeId:
              activeChallengeId,
            code
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
        !data.success
      ) {
        throw new Error(
          data.error ||
          "The sign-in code is invalid or has expired."
        );
      }

      emailCodePanel.hidden = true;
      activeChallengeId = "";

      clearEmailCodeInputs();
      showEmailCodeMessage("", "");

      if (data.requiresTwoFactor) {
        if (
          typeof openTwoFactorPanel ===
          "function"
        ) {
          openTwoFactorPanel({
            emailRecoveryAvailable: false
          });
          return;
        }

        throw new Error(
          "Authenticator verification could not be opened."
        );
      }

      if (
        typeof finishLogin ===
        "function"
      ) {
        finishLogin(
          data.user || null
        );

        return;
      }

      window.location.href =
        "/";
    } catch (error) {
      showEmailCodeMessage(
        error.message ||
        "The sign-in code is invalid or has expired.",
        "error"
      );

      clearEmailCodeInputs();
      focusFirstEmailCodeInput();
    } finally {
      verifyingCode = false;

      if (!emailCodePanel.hidden) {
        emailCodeSubmit.disabled =
          false;

        emailCodeSubmit.textContent =
          "Verify Code";
      }
    }
  }

  emailCodeInputs.forEach(
    function (input, index) {
      input.addEventListener(
        "input",
        function () {
          input.value =
            input.value
              .replace(/\D/g, "")
              .slice(0, 1);

          showEmailCodeMessage(
            "",
            ""
          );

          if (
            input.value &&
            emailCodeInputs[index + 1]
          ) {
            emailCodeInputs[
              index + 1
            ].focus();
          }
        }
      );

      input.addEventListener(
        "keydown",
        function (event) {
          if (
            event.key ===
              "Backspace" &&
            !input.value &&
            emailCodeInputs[
              index - 1
            ]
          ) {
            emailCodeInputs[
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

          emailCodeInputs.forEach(
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
              emailCodeInputs.length
            ) - 1;

          if (
            emailCodeInputs[
              focusIndex
            ]
          ) {
            emailCodeInputs[
              focusIndex
            ].focus();
          }
        }
      );
    }
  );

  passwordlessButton.addEventListener(
    "click",
    function () {
      requestEmailCode();
    }
  );

  emailCodeForm.addEventListener(
    "submit",
    function (event) {
      event.preventDefault();
      verifyEmailCode();
    }
  );

  emailCodeResend.addEventListener(
    "click",
    function () {
      requestEmailCode({
        email:
          activeEmailAddress ||
          emailInput.value,
        fromPanel: true
      });
    }
  );

  emailCodeCancel.addEventListener(
    "click",
    function () {
      closeEmailCodePanel(
        "Sign in cancelled."
      );
    }
  );

  document.addEventListener(
    "keydown",
    function (event) {
      if (
        event.key === "Escape" &&
        !emailCodePanel.hidden
      ) {
        closeEmailCodePanel(
          "Sign in cancelled."
        );
      }
    }
  );
})();

if (typeof getLoginRedirectTarget === "function") {
  getLoginRedirectTarget = function () {
    const savedRedirect = localStorage.getItem("auc-atlas-login-redirect");

    if (savedRedirect) {
      localStorage.removeItem("auc-atlas-login-redirect");
      return savedRedirect;
    }

    return "/";
  };
}

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

  initializeGoogleLogin();
}

function initializeGoogleLogin() {
    const googleLoginButton =
      document.getElementById(
        "google-login-button"
      );

    const googleLoginMessage =
      document.getElementById(
        "login-message"
      );

    const originalGoogleButtonContent =
      googleLoginButton
        ? googleLoginButton.innerHTML
        : "";

    let googleLoginAuth = null;

    function showGoogleLoginMessage(
      message,
      type
    ) {
      if (!googleLoginMessage) {
        return;
      }

      googleLoginMessage.textContent =
        message;

      googleLoginMessage.className =
        "auth-message" +
        (
          type
            ? " " + type
            : ""
        );
    }

    function getGoogleLoginError(
      error
    ) {
      if (
        error &&
        error.code ===
          "auth/popup-closed-by-user"
      ) {
        return "Google sign-in was closed before it finished.";
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
        error.code ===
          "auth/account-exists-with-different-credential"
      ) {
        return "This Google account is not connected yet. Log in with your AUC email and connect Google from My Account.";
      }

      return (
        error.message ||
        "Could not log in with Google. Please try again."
      );
    }

    async function getGoogleFirebaseConfig() {
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
          "Google sign-in is not configured."
        );
      }

      return data.firebase;
    }

    async function startGoogleLogin() {
      if (!googleLoginButton) {
        return;
      }

      googleLoginButton.disabled =
        true;

      googleLoginButton.textContent =
        "Opening Google...";

      showGoogleLoginMessage(
        "",
        ""
      );

      try {
        const firebase =
          await getGoogleFirebaseConfig();

        const appName =
          "aucAtlasGoogleLogin";

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

        googleLoginAuth = auth;

        const provider =
          new GoogleAuthProvider();

        provider.setCustomParameters({
          prompt: "select_account"
        });

        const result =
          await signInWithPopup(
            auth,
            provider
          );

        const idToken =
          await result.user
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
              action: "login",
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
          !data.success
        ) {
          throw new Error(
            data.error ||
            "This Google account is not connected to an existing AUC Atlas account."
          );
        }

        await signOut(auth)
          .catch(function () {});

        googleLoginAuth = null;

        if (
          typeof window
            .handleAucAtlasGoogleLoginResult !==
          "function"
        ) {
          throw new Error(
            "Google login could not be completed."
          );
        }

        await window
          .handleAucAtlasGoogleLoginResult(
            data
          );
      } catch (error) {
        showGoogleLoginMessage(
          getGoogleLoginError(error),
          "error"
        );
      } finally {
        if (googleLoginAuth) {
          await signOut(
            googleLoginAuth
          ).catch(function () {});

          googleLoginAuth = null;
        }

        googleLoginButton.disabled =
          false;

        googleLoginButton.innerHTML =
          originalGoogleButtonContent;
      }
    }

    if (googleLoginButton) {
      googleLoginButton.addEventListener(
        "click",
        startGoogleLogin
      );
    }
  
}
