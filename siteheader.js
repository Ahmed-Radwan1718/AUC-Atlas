(function () {
  const headerRoot = document.getElementById("site-header-root");

  if (!headerRoot) {
    return;
  }

  const currentPage = window.location.pathname.split("/").pop() || "index.html";

  function activeAttribute(pageName) {
    return currentPage === pageName ? ' aria-current="page"' : "";
  }

  headerRoot.outerHTML = `
<header class="site-header">
  <a href="index.html" class="site-header-logo"><span class="site-header-logo-accent">AUC</span> Atlas</a>

  <nav class="site-header-nav" aria-label="Main navigation">
    <a href="courses.html"${activeAttribute("courses.html")}>Courses</a>
    <a href="professors.html"${activeAttribute("professors.html")}>Professors</a>
    <a href="index.html#contribute">Contribute</a>
  </nav>

  <div class="site-header-actions">
    <div class="site-header-account" id="site-header-account">
      <button class="site-header-user-icon" id="site-header-account-button" type="button" aria-label="Open account menu" aria-expanded="false">
        <img src="user.png" alt="" id="site-header-account-photo">
      </button>

      <div class="site-header-account-menu" id="site-header-account-menu" hidden>
        <a href="login.html" class="site-header-account-link" id="site-header-login-link">Login</a>
        <a href="account.html" class="site-header-account-link" id="site-header-account-link" hidden><img class="site-header-account-link-icon" src="user.png" alt="" aria-hidden="true"><span>Account</span></a>
        <button class="site-header-account-link site-header-logout-button" id="site-header-logout-button" type="button" hidden><svg class="site-header-account-link-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg><span>Log out</span></button>
      </div>
    </div>

    <button class="hamburger-toggle" id="site-mobile-nav-toggle" type="button" aria-label="Open menu" aria-controls="site-mobile-nav" aria-expanded="false">
      <span></span>
      <span></span>
      <span></span>
    </button>
  </div>
</header>

<div class="nav-menu-overlay" id="site-mobile-nav" hidden>
  <nav class="nav-menu-panel" aria-label="Mobile navigation">
    <a href="courses.html"${activeAttribute("courses.html")}>Courses</a>
    <a href="professors.html"${activeAttribute("professors.html")}>Professors</a>
    <a href="index.html#contribute">Contribute</a>
  </nav>
</div>
`;

  const accountWidget = document.getElementById("site-header-account");
  const accountButton = document.getElementById("site-header-account-button");
  const accountPhoto = document.getElementById("site-header-account-photo");
  const accountMenu = document.getElementById("site-header-account-menu");
  const loginLink = document.getElementById("site-header-login-link");
  const accountLink = document.getElementById("site-header-account-link");
  const logoutButton = document.getElementById("site-header-logout-button");
  const mobileNavToggle = document.getElementById("site-mobile-nav-toggle");
  const mobileNav = document.getElementById("site-mobile-nav");

  if (mobileNavToggle && mobileNav) {
    function setMobileNav(open) {
      mobileNav.hidden = !open;
      mobileNavToggle.setAttribute("aria-expanded", String(open));
      mobileNavToggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");

      if (open && accountMenu && accountButton) {
        accountMenu.hidden = true;
        accountButton.setAttribute("aria-expanded", "false");
      }
    }

    mobileNavToggle.addEventListener("click", function (event) {
      event.stopPropagation();
      setMobileNav(mobileNav.hidden);
    });

    mobileNav.querySelectorAll("a").forEach(function (link) {
      link.addEventListener("click", function () {
        setMobileNav(false);
      });
    });

    document.addEventListener("click", function (event) {
      if (!mobileNav.hidden && !mobileNav.contains(event.target) && !event.target.closest(".site-header")) {
        setMobileNav(false);
      }
    });

    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape") {
        setMobileNav(false);
      }
    });
  }

  if (accountWidget && accountButton && accountPhoto && accountMenu && loginLink && accountLink && logoutButton) {
    function setAccountMenu(open) {
      accountMenu.hidden = !open;
      accountButton.setAttribute("aria-expanded", String(open));
    }

    function setAccountPhoto(photoURL) {
      const safePhotoURL = String(photoURL || "").trim();

      if (safePhotoURL) {
        accountPhoto.src = safePhotoURL;
        accountPhoto.alt = "Account profile photo";
        accountPhoto.classList.add("has-profile-photo");
        return;
      }

      accountPhoto.src = "user.png";
      accountPhoto.alt = "";
      accountPhoto.classList.remove("has-profile-photo");
    }

    function setLogoutButtonLabel(label) {
      logoutButton.innerHTML = '<svg class="site-header-account-link-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg><span>' + label + '</span>';
    }

    function showLoggedOutAccountState() {
      loginLink.hidden = false;
      accountLink.hidden = true;
      logoutButton.hidden = true;
      logoutButton.disabled = false;
      setLogoutButtonLabel("Log out");
      setAccountPhoto("");
    }

    function showLoggedInAccountState(user) {
      loginLink.hidden = true;
      accountLink.hidden = false;
      logoutButton.hidden = false;
      logoutButton.disabled = false;
      setLogoutButtonLabel("Log out");
      setAccountPhoto(user && user.photoURL ? user.photoURL : "");
    }

    async function logoutServerSession() {
      await fetch("/api/logout", {
        method: "POST",
        credentials: "same-origin",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({})
      }).catch(function () {});
    }

    async function loadAccountHeaderState() {
      try {
        const response = await fetch("/api/me", {
          method: "GET",
          credentials: "same-origin",
          cache: "no-store",
          headers: {
            Accept: "application/json"
          }
        });

        const data = await response.json().catch(function () {
          return {};
        });

        if (response.ok && data.sessionRevoked) {
          await logoutServerSession();
          showLoggedOutAccountState();
          return;
        }

        if (response.ok && (data.loggedIn || data.signedIn || data.authenticated) && data.user) {
          showLoggedInAccountState(data.user);
          return;
        }
      } catch (error) {}

      showLoggedOutAccountState();
    }

    accountButton.addEventListener("click", function (event) {
      event.stopPropagation();
      setAccountMenu(accountMenu.hidden);
    });

    loginLink.addEventListener("click", function () {
      setAccountMenu(false);
    });

    accountLink.addEventListener("click", function () {
      setAccountMenu(false);
    });

    logoutButton.addEventListener("click", async function () {
      logoutButton.disabled = true;
      setLogoutButtonLabel("Logging out...");

      await logoutServerSession();

      setAccountMenu(false);
      showLoggedOutAccountState();
      window.location.href = "login.html";
    });

    document.addEventListener("click", function (event) {
      if (!accountWidget.contains(event.target)) {
        setAccountMenu(false);
      }
    });

    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape") {
        setAccountMenu(false);
      }
    });

    loadAccountHeaderState();
  }

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

  const reportReasonsByType = {
    review: [
      "Harassment or personal attack",
      "Discriminatory or hateful content",
      "False or misleading information",
      "Contains private information",
      "Spam or irrelevant content",
      "Inappropriate language",
      "Other"
    ],
    material: [
      "Active assessment or unauthorized answer key",
      "Copyrighted material shared without permission",
      "Pirated textbook or paid content",
      "Contains student names, IDs, grades or private information",
      "File does not match its title or metadata",
      "Malicious, unsafe or corrupted file",
      "Spam or irrelevant content",
      "Other"
    ]
  };

  function escapeReportHtml(value) {
    return String(value == null ? "" : value).replace(/[&<>"']/g, function (char) {
      return {
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
      }[char];
    });
  }

  function ensureReportModal() {
    if (document.getElementById("auc-report-modal")) {
      return;
    }

    document.body.insertAdjacentHTML("beforeend", `
      <div class="auc-report-modal" id="auc-report-modal" hidden>
        <button class="auc-report-modal-backdrop" id="auc-report-modal-backdrop" type="button" aria-label="Close report form"></button>

        <aside class="auc-report-modal-card" role="dialog" aria-modal="true" aria-labelledby="auc-report-modal-title">
          <button class="auc-report-modal-close" id="auc-report-modal-close" type="button" aria-label="Close report form">&times;</button>
          <h2 id="auc-report-modal-title">Report Content</h2>
          <p id="auc-report-modal-copy">Choose a reason so an admin can review this content.</p>

          <form class="auc-report-form" id="auc-report-form" novalidate>
            <label>
              Reason
              <select name="reason" id="auc-report-reason" required></select>
            </label>

            <label>
              Optional explanation
              <textarea name="explanation" id="auc-report-explanation" maxlength="600" placeholder="Add brief context for the moderation team."></textarea>
            </label>

            <button class="auc-report-submit" id="auc-report-submit" type="submit">Submit Report</button>
            <p class="auc-report-message" id="auc-report-message" aria-live="polite"></p>
          </form>
        </aside>
      </div>
    `);

    document.getElementById("auc-report-modal-backdrop").addEventListener("click", closeReportModal);
    document.getElementById("auc-report-modal-close").addEventListener("click", closeReportModal);
    document.getElementById("auc-report-form").addEventListener("submit", submitReportForm);
  }

  function closeReportModal() {
    const modal = document.getElementById("auc-report-modal");

    if (!modal) {
      return;
    }

    modal.hidden = true;
    modal.dataset.contentType = "";
    modal.dataset.contentId = "";
    document.body.style.overflow = "";
  }

  function openReportModal(button) {
    ensureReportModal();

    const modal = document.getElementById("auc-report-modal");
    const title = document.getElementById("auc-report-modal-title");
    const copy = document.getElementById("auc-report-modal-copy");
    const reasonSelect = document.getElementById("auc-report-reason");
    const explanation = document.getElementById("auc-report-explanation");
    const message = document.getElementById("auc-report-message");
    const contentType = String(button.getAttribute("data-report-content-type") || "").trim();
    const contentId = String(button.getAttribute("data-report-content-id") || "").trim();
    const label = String(button.getAttribute("data-report-label") || "this content").trim();
    const reasons = reportReasonsByType[contentType] || [];

    if (!contentType || !contentId || !reasons.length) {
      return;
    }

    modal.dataset.contentType = contentType;
    modal.dataset.contentId = contentId;
    title.textContent = contentType === "material" ? "Report Material" : "Report Review";
    copy.textContent = "Choose a reason so an admin can review " + label + ".";
    reasonSelect.innerHTML = '<option value="">Choose a reason</option>' + reasons.map(function (reason) {
      return '<option value="' + escapeReportHtml(reason) + '">' + escapeReportHtml(reason) + '</option>';
    }).join("");
    reasonSelect.value = "";
    explanation.value = "";
    message.textContent = "";
    modal.hidden = false;
    document.body.style.overflow = "hidden";
  }

  async function submitReportForm(event) {
    event.preventDefault();

    const modal = document.getElementById("auc-report-modal");
    const form = document.getElementById("auc-report-form");
    const reasonSelect = document.getElementById("auc-report-reason");
    const explanation = document.getElementById("auc-report-explanation");
    const submit = document.getElementById("auc-report-submit");
    const message = document.getElementById("auc-report-message");
    const contentType = modal ? modal.dataset.contentType : "";
    const contentId = modal ? modal.dataset.contentId : "";
    const reason = reasonSelect ? reasonSelect.value : "";
    const explanationText = explanation ? explanation.value.trim() : "";

    if (!reason) {
      message.textContent = "Choose a report reason.";
      return;
    }

    if (reason === "Other" && !explanationText) {
      message.textContent = "Write a brief explanation when choosing Other.";
      return;
    }

    if (form.dataset.submitting === "true") {
      return;
    }

    form.dataset.submitting = "true";
    submit.disabled = true;
    message.textContent = "Submitting report...";

    try {
      const payload = {
        action: "report",
        reason,
        explanation: explanationText
      };
      const endpoint = contentType === "material" ? "/api/course-materials" : "/api/professor-reviews";

      if (contentType === "material") {
        payload.materialId = contentId;
      } else {
        payload.reviewId = contentId;
      }

      const data = await requestJson(endpoint, {
        method: "POST",
        body: payload
      });

      message.textContent = data.message || "Report submitted for review.";
      setTimeout(closeReportModal, 900);
    } catch (error) {
      message.textContent = error.message || "Could not submit this report.";
    } finally {
      form.dataset.submitting = "";
      submit.disabled = false;
    }
  }

  document.addEventListener("click", function (event) {
    const reportButton = event.target.closest("[data-report-content-type][data-report-content-id]");

    if (reportButton) {
      event.preventDefault();
      openReportModal(reportButton);
    }
  });

  document.addEventListener("keydown", function (event) {
    const modal = document.getElementById("auc-report-modal");

    if (event.key === "Escape" && modal && !modal.hidden) {
      closeReportModal();
    }
  });

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

  document.addEventListener("DOMContentLoaded", function () {
    wirePasswordToggles();
    initLogin();
    initSignup();
    initForgotPassword();
  });
})();
