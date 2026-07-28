(function () {
  const loginRedirectKey = "auc-atlas-login-redirect";

  function getById(id) {
    return document.getElementById(id);
  }

  function setMessage(element, message, type) {
    if (!element) return;

    element.textContent = message || "";
    element.className = "auth-message";

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

  function getRedirectTarget() {
    const params = new URLSearchParams(window.location.search);
    const queryRedirect = params.get("redirect");

    if (queryRedirect) {
      return queryRedirect;
    }

    const savedRedirect = localStorage.getItem(loginRedirectKey);

    if (savedRedirect) {
      localStorage.removeItem(loginRedirectKey);
      return savedRedirect;
    }

    return "account.html";
  }

  function wirePasswordToggles() {
    document.querySelectorAll("[data-password-toggle]").forEach(function (button) {
      const target = getById(button.getAttribute("data-password-toggle"));

      if (!target) return;

      button.addEventListener("click", function () {
        const showing = target.type === "text";
        target.type = showing ? "password" : "text";
        button.textContent = showing ? "Show" : "Hide";
      });
    });
  }

  function initLogin() {
    const form = getById("login-form");

    if (!form) return;

    const message = getById("login-message");
    const submit = getById("login-submit");
    const twoFactorForm = getById("login-two-factor-form");
    const twoFactorPanel = getById("login-two-factor-panel");
    const twoFactorMessage = getById("login-two-factor-message");
    const twoFactorSubmit = getById("login-two-factor-submit");
    const twoFactorCode = getById("login-two-factor-code");
    const twoFactorTitle = getById("login-two-factor-title");
    const trustDevice = getById("login-trust-device");

    let activeTwoFactorMethod = "";

    async function openTwoFactor(method, email) {
      activeTwoFactorMethod = method;

      if (method === "email") {
        await requestJson("/api/login-send-email-code", {
          method: "POST",
          body: email ? { email } : {}
        });

        twoFactorTitle.textContent = "Check your email";
      } else {
        twoFactorTitle.textContent = "Authenticator code";
      }

      form.hidden = true;
      twoFactorPanel.hidden = false;
      twoFactorCode.value = "";
      twoFactorCode.focus();
      setMessage(twoFactorMessage, method === "email" ? "Enter the code sent to your email." : "Enter the 6-digit code from your authenticator app.", "");
    }

    form.addEventListener("submit", async function (event) {
      event.preventDefault();

      const email = getById("login-email").value.trim();
      const password = getById("login-password").value;

      setButtonLoading(submit, true, "Logging in...", "Log in");
      setMessage(message, "", "");

      try {
        const data = await requestJson("/api/login", {
          method: "POST",
          body: {
            email,
            password
          }
        });

        if (data.requiresTwoFactor) {
          const methods = data.methods || {};

          if (methods.app) {
            await openTwoFactor("app", email);
            return;
          }

          if (methods.email) {
            await openTwoFactor("email", email);
            return;
          }

          throw new Error("No two-factor method is available.");
        }

        setMessage(message, "Logged in successfully.", "success");

        setTimeout(function () {
          window.location.href = getRedirectTarget();
        }, 500);
      } catch (error) {
        setMessage(message, error.message || "Could not log in.", "error");
      } finally {
        setButtonLoading(submit, false, "Logging in...", "Log in");
      }
    });

    twoFactorForm.addEventListener("submit", async function (event) {
      event.preventDefault();

      const code = twoFactorCode.value.trim().replace(/\D/g, "");

      if (code.length !== 6) {
        setMessage(twoFactorMessage, "Please enter the 6-digit code.", "error");
        return;
      }

      setButtonLoading(twoFactorSubmit, true, "Verifying...", "Continue");
      setMessage(twoFactorMessage, "", "");

      try {
        const endpoint = activeTwoFactorMethod === "email"
          ? "/api/login-verify-email-code"
          : "/api/login-verify-authenticator";

        await requestJson(endpoint, {
          method: "POST",
          body: {
            code,
            trustDevice: Boolean(trustDevice && trustDevice.checked)
          }
        });

        setMessage(twoFactorMessage, "Logged in successfully.", "success");

        setTimeout(function () {
          window.location.href = getRedirectTarget();
        }, 500);
      } catch (error) {
        setMessage(twoFactorMessage, error.message || "Could not verify that code.", "error");
      } finally {
        setButtonLoading(twoFactorSubmit, false, "Verifying...", "Continue");
      }
    });
  }

  function initSignup() {
    const form = getById("signup-form");

    if (!form) return;

    const submit = getById("signup-submit");
    const message = getById("signup-message");

    form.addEventListener("submit", async function (event) {
      event.preventDefault();

      const fullName = getById("signup-name").value.trim();
      const phone = getById("signup-phone").value.trim();
      const email = getById("signup-email").value.trim();
      const password = getById("signup-password").value;
      const confirmPassword = getById("signup-confirm-password").value;

      setButtonLoading(submit, true, "Creating...", "Create account");
      setMessage(message, "", "");

      try {
        const data = await requestJson("/api/signup", {
          method: "POST",
          body: {
            fullName,
            phone,
            email,
            password,
            confirmPassword
          }
        });

        setMessage(message, data.message || "Account created. Check your inbox to verify your AUC email.", "success");

        setTimeout(function () {
          window.location.href = "login.html";
        }, 1200);
      } catch (error) {
        setMessage(message, error.message || "Could not create account.", "error");
      } finally {
        setButtonLoading(submit, false, "Creating...", "Create account");
      }
    });
  }

  function initForgotPassword() {
    const form = getById("forgot-password-form");

    if (!form) return;

    const submit = getById("reset-submit");
    const message = getById("reset-message");

    form.addEventListener("submit", async function (event) {
      event.preventDefault();

      const email = getById("reset-email").value.trim();

      setButtonLoading(submit, true, "Sending...", "Send reset link");
      setMessage(message, "", "");

      try {
        const data = await requestJson("/api/forgot-password", {
          method: "POST",
          body: {
            email
          }
        });

        form.reset();
        setMessage(message, data.message || "If an account exists with that email, a reset link has been sent.", "success");
      } catch (error) {
        setMessage(message, error.message || "Could not send reset link.", "error");
      } finally {
        setButtonLoading(submit, false, "Sending...", "Send reset link");
      }
    });
  }

  function initAccount() {
    const loading = getById("account-loading");
    const guest = getById("account-guest");
    const panel = getById("account-panel");

    if (!loading || !guest || !panel) return;

    const name = getById("account-name");
    const email = getById("account-email");
    const verified = getById("account-verified");
    const verifyButton = getById("account-send-verification");
    const logoutButton = getById("account-logout");
    const accountMessage = getById("account-message");
    const securityButton = getById("account-send-security-code");
    const securityForm = getById("account-security-code-form");
    const securityCode = getById("account-security-code");
    const securitySubmit = getById("account-security-submit");
    const securityMessage = getById("account-security-message");
    const securityStatus = getById("account-security-status");

    async function loadAccount() {
      const data = await requestJson("/api/me", {
        method: "GET"
      });

      loading.hidden = true;

      if (!data.loggedIn || !data.user) {
        guest.hidden = false;
        panel.hidden = true;
        return;
      }

      guest.hidden = true;
      panel.hidden = false;

      name.textContent = data.user.fullName || data.user.displayName || data.user.firstName || "AUC Atlas user";
      email.textContent = data.user.email || "";
      verified.textContent = data.user.emailVerified ? "Verified email" : "Email not verified";
    }

    verifyButton.addEventListener("click", async function () {
      setButtonLoading(verifyButton, true, "Sending...", "Send verification email");
      setMessage(accountMessage, "", "");

      try {
        const data = await requestJson("/api/send-email-verification", {
          method: "POST",
          body: {}
        });

        setMessage(accountMessage, data.alreadyVerified ? "Your email is already verified." : "Verification email sent.", "success");
      } catch (error) {
        setMessage(accountMessage, error.message || "Could not send verification email.", "error");
      } finally {
        setButtonLoading(verifyButton, false, "Sending...", "Send verification email");
      }
    });

    securityButton.addEventListener("click", async function () {
      setButtonLoading(securityButton, true, "Starting...", "Unlock security panel");
      setMessage(securityMessage, "", "");

      try {
        const data = await requestJson("/api/send-security-code", {
          method: "POST",
          body: {
            reason: "security-panel"
          }
        });

        securityForm.hidden = false;
        securityCode.value = "";
        securityCode.focus();
        securityStatus.textContent = data.method === "authenticator" ? "Enter your authenticator code." : "Enter the code sent to your email.";
      } catch (error) {
        setMessage(securityMessage, error.message || "Could not start security verification.", "error");
      } finally {
        setButtonLoading(securityButton, false, "Starting...", "Unlock security panel");
      }
    });

    securityForm.addEventListener("submit", async function (event) {
      event.preventDefault();

      const code = securityCode.value.trim().replace(/\D/g, "");

      if (code.length !== 6) {
        setMessage(securityMessage, "Please enter the 6-digit code.", "error");
        return;
      }

      setButtonLoading(securitySubmit, true, "Verifying...", "Verify code");
      setMessage(securityMessage, "", "");

      try {
        await requestJson("/api/verify-security-code", {
          method: "POST",
          body: {
            code
          }
        });

        securityForm.hidden = true;
        securityStatus.textContent = "Security panel unlocked.";
        setMessage(securityMessage, "Security panel unlocked.", "success");
      } catch (error) {
        setMessage(securityMessage, error.message || "Could not verify code.", "error");
      } finally {
        setButtonLoading(securitySubmit, false, "Verifying...", "Verify code");
      }
    });

    logoutButton.addEventListener("click", async function () {
      await requestJson("/api/logout", {
        method: "POST",
        body: {}
      }).catch(function () {});

      window.location.href = "login.html";
    });

    loadAccount().catch(function () {
      loading.hidden = true;
      guest.hidden = false;
      panel.hidden = true;
    });
  }

  document.addEventListener("DOMContentLoaded", function () {
    wirePasswordToggles();
    initLogin();
    initSignup();
    initForgotPassword();
    initAccount();
  });
})();
