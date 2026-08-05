(function () {
  const faviconLink = document.querySelector('link[rel="icon"]') || document.createElement("link");
  faviconLink.rel = "icon";
  faviconLink.type = "image/svg+xml";
  faviconLink.href = "favicon.svg";
  document.head.appendChild(faviconLink);

  const isAdminPage = /\/admin(?:\.html)?\/?$/.test(window.location.pathname);

  function createWeeklyVisitorId() {
    if (
      window.crypto &&
      typeof window.crypto.randomUUID === "function"
    ) {
      return window.crypto.randomUUID();
    }

    return (
      "visitor-" +
      Date.now().toString(36) +
      "-" +
      Math.random().toString(36).slice(2) +
      Math.random().toString(36).slice(2)
    );
  }

  function getWeeklyVisitorId() {
    const storageKey = "aucAtlasVisitorId";

    try {
      let visitorId =
        window.localStorage.getItem(storageKey);

      if (!visitorId) {
        visitorId = createWeeklyVisitorId();
        window.localStorage.setItem(
          storageKey,
          visitorId
        );
      }

      return visitorId;
    } catch (error) {
      try {
        let visitorId =
          window.sessionStorage.getItem(storageKey);

        if (!visitorId) {
          visitorId = createWeeklyVisitorId();
          window.sessionStorage.setItem(
            storageKey,
            visitorId
          );
        }

        return visitorId;
      } catch (sessionError) {
        return createWeeklyVisitorId();
      }
    }
  }

  function trackWeeklyVisitor() {
    if (
      isAdminPage ||
      typeof window.fetch !== "function"
    ) {
      return Promise.resolve(null);
    }

    return fetch("/api/weekly-visitors", {
      method: "POST",
      credentials: "same-origin",
      cache: "no-store",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        visitorId: getWeeklyVisitorId()
      })
    })
      .then(function (response) {
        if (!response.ok) {
          throw new Error(
            "Could not update weekly visitors."
          );
        }

        return response.json();
      })
      .then(function (data) {
        const weeklyVisitors = Math.max(
          0,
          Number(data.weeklyVisitors) || 0
        );

        window.aucAtlasWeeklyVisitors =
          weeklyVisitors;

        return weeklyVisitors;
      })
      .catch(function () {
        return null;
      });
  }

  window.aucAtlasWeeklyVisitorsPromise =
    trackWeeklyVisitor();

  if (!isAdminPage && !document.querySelector('script[src="site-footer.js"]')) {
    const footerScript = document.createElement("script");
    footerScript.src = "site-footer.js";
    footerScript.defer = true;
    document.head.appendChild(footerScript);
  }

  const headerRoot = document.getElementById("site-header-root");

  if (!headerRoot) {
    return;
  }

  const headerStyles = document.createElement("style");
  headerStyles.textContent = `
    .site-header {
      position: fixed;
      top: 22px;
      left: 50%;
      z-index: 90;
      width: min(1120px, calc(100% - 48px));
      min-height: 62px;
      padding: 0 14px 0 24px;
      border-radius: 999px;
      border: 1px solid rgba(23, 23, 23, 0.1);
      background: rgba(255, 255, 255, 0.86);
      box-shadow: 0 22px 55px rgba(42, 32, 20, 0.12);
      backdrop-filter: blur(18px);
      -webkit-backdrop-filter: blur(18px);
      transform: translateX(-50%);
      display: grid;
      grid-template-columns: minmax(160px, 1fr) auto minmax(160px, 1fr);
      align-items: center;
      gap: 24px;
    }

    .site-header-logo,
    .site-header-logo:visited {
      position: relative;
      justify-self: start;
      min-width: 88px;
      min-height: 34px;
      color: #171717;
      font-weight: 700;
      letter-spacing: -0.02em;
      text-decoration: none;
      white-space: nowrap;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 4px;
      overflow: hidden;
      isolation: isolate;
    }

    .site-header-logo::after {
      content: "";
      position: absolute;
      left: 50%;
      top: 50%;
      width: 32px;
      height: 32px;
      background: url("logo.svg") center / contain no-repeat;
      opacity: 0;
      filter: drop-shadow(0 10px 18px rgba(42, 32, 20, 0.18));
      transform: translate(-50%, -50%) scale(0.18) rotate(-28deg);
      transition: opacity 0.28s ease, transform 0.42s cubic-bezier(0.2, 0.9, 0.2, 1.2);
    }

    .site-header-logo-auc,
    .site-header-logo-atlas {
      display: inline-flex;
      align-items: center;
      line-height: 1;
      transform-origin: center;
      transition: opacity 0.24s ease, filter 0.24s ease, transform 0.36s cubic-bezier(0.2, 0.9, 0.2, 1);
    }

    .site-header-logo-auc {
      color: rgba(192, 154, 92, 0.84);
      font-size: 14px;
    }

    .site-header-logo-atlas {
      color: #171717;
      font-size: 22px;
    }

    .site-header-logo:hover .site-header-logo-auc,
    .site-header-logo:focus-visible .site-header-logo-auc {
      opacity: 0;
      filter: blur(6px);
      transform: translateX(22px) scale(0.15) rotate(24deg);
    }

    .site-header-logo:hover .site-header-logo-atlas,
    .site-header-logo:focus-visible .site-header-logo-atlas {
      opacity: 0;
      filter: blur(6px);
      transform: translateX(-20px) scale(0.15) rotate(-20deg);
    }

    .site-header-logo:hover::after,
    .site-header-logo:focus-visible::after {
      opacity: 1;
      transform: translate(-50%, -50%) scale(1) rotate(0deg);
    }

    .site-header-nav {
      grid-column: 2;
      justify-self: center;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 34px;
    }

    .site-header-nav > a,
    .site-header-nav > a:visited {
      color: rgba(23, 23, 23, 0.62);
      font-size: 12px;
      font-weight: 700;
      letter-spacing: 0.06em;
      text-transform: uppercase;
      text-decoration: none;
      transition: color 0.2s ease, opacity 0.2s ease;
    }

    .site-header-nav > a:hover {
      color: #171717;
    }

    .site-header-actions {
      grid-column: 3;
      justify-self: end;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 12px;
    }

    .floating-account-widget {
      position: relative;
      display: flex;
      align-items: center;
      justify-content: flex-end;
    }

    .floating-account-button {
      width: 42px;
      height: 42px;
      padding: 0;
      border: 0;
      border-radius: 999px;
      background: transparent;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: opacity 0.2s ease, transform 0.2s ease;
    }

    .floating-account-button img {
      width: 24px;
      height: 24px;
      display: block;
      object-fit: contain;
    }

    .floating-account-button img.has-profile-photo {
      width: 34px;
      height: 34px;
      border-radius: 999px;
      object-fit: cover;
      background: rgba(192, 154, 92, 0.14);
    }

    .floating-account-button:hover {
      opacity: 0.72;
      transform: translateY(-1px);
    }

    .floating-account-menu {
      position: absolute;
      top: 52px;
      right: 0;
      min-width: 238px;
      padding: 8px;
      border-radius: 18px;
      border: 1px solid rgba(23, 23, 23, 0.1);
      background: rgba(255, 255, 255, 0.96);
      box-shadow: 0 22px 55px rgba(42, 32, 20, 0.16);
      backdrop-filter: blur(18px);
      -webkit-backdrop-filter: blur(18px);
      display: grid;
      gap: 4px;
      opacity: 0;
      visibility: hidden;
      transform: translateY(8px) scale(0.98);
      transform-origin: top right;
      pointer-events: none;
      transition: opacity 0.18s ease, transform 0.18s ease, visibility 0.18s ease;
    }

    .floating-account-menu.is-open {
      opacity: 1;
      visibility: visible;
      transform: translateY(0) scale(1);
      pointer-events: auto;
    }

    .floating-account-menu[hidden],
    .floating-account-menu-link[hidden] {
      display: none;
    }

    .floating-account-menu-link,
    .floating-account-menu-link:visited {
      width: 100%;
      min-height: 38px;
      padding: 0 13px;
      border: 0;
      border-radius: 999px;
      background: transparent;
      color: rgba(23, 23, 23, 0.68);
      font-family: inherit;
      font-size: 12px;
      font-weight: 700;
      letter-spacing: 0.08em;
      text-align: left;
      text-transform: uppercase;
      text-decoration: none;
      display: flex;
      align-items: center;
      gap: 10px;
      cursor: pointer;
      transition: background 0.2s ease, color 0.2s ease, opacity 0.2s ease;
    }

    .floating-account-menu-link:hover {
      background: rgba(192, 154, 92, 0.12);
      color: #171717;
    }

    .floating-account-menu-link img,
    .floating-account-menu-icon {
      width: 16px;
      height: 16px;
      display: block;
      object-fit: contain;
      opacity: 0.68;
      transition: opacity 0.2s ease;
    }

    .floating-account-menu-icon {
      flex: 0 0 16px;
      color: inherit;
      background: currentColor;
    }

    .floating-account-menu-link:hover img,
    .floating-account-menu-link:hover .floating-account-menu-icon {
      opacity: 1;
    }

    .floating-degree-icon {
      position: relative;
      background: transparent;
    }

    .floating-degree-icon::before {
      content: "";
      position: absolute;
      inset: 2px;
      border-left: 2px solid currentColor;
      border-bottom: 2px solid currentColor;
      border-radius: 0 0 0 3px;
    }

    .floating-degree-icon::after {
      content: "";
      position: absolute;
      left: 5px;
      bottom: 4px;
      width: 3px;
      height: 8px;
      border-radius: 999px;
      background: currentColor;
      box-shadow: 5px -3px 0 currentColor, 10px -7px 0 currentColor;
    }

    .floating-reviews-icon {
      -webkit-mask: url("support-icon.png") center / contain no-repeat;
      mask: url("support-icon.png") center / contain no-repeat;
    }

    .floating-account-logout {
      color: #c73636;
    }

    .floating-logout-icon {
      width: 16px;
      height: 16px;
      display: block;
      background: currentColor;
      opacity: 0.95;
      transition: opacity 0.2s ease;
      -webkit-mask: url("logout-icon.png") center / contain no-repeat;
      mask: url("logout-icon.png") center / contain no-repeat;
    }

    .floating-account-logout:hover {
      color: #a91515;
    }

    .floating-account-logout:hover .floating-logout-icon {
      opacity: 1;
    }

    .hamburger-toggle {
      display: none;
      border: 0;
      background: transparent;
      cursor: pointer;
      align-items: center;
      justify-content: center;
      gap: 5px;
      flex-direction: column;
    }

    .hamburger-toggle span {
      width: 18px;
      height: 2px;
      border-radius: 999px;
      background: #171717;
      display: block;
    }

    .nav-menu-overlay {
      position: fixed;
      inset: 0;
      z-index: 1001;
      padding: 82px 14px 14px;
      background: rgba(23, 23, 23, 0.18);
      opacity: 0;
      pointer-events: none;
      transition: opacity 0.22s ease;
    }

    body.nav-menu-open .nav-menu-overlay {
      opacity: 1;
      pointer-events: auto;
    }

    .nav-menu-panel {
      padding: 18px;
      border-radius: 24px;
      border: 1px solid rgba(23, 23, 23, 0.1);
      background: rgba(255, 255, 255, 0.94);
      box-shadow: 0 22px 55px rgba(42, 32, 20, 0.16);
      backdrop-filter: blur(18px);
      -webkit-backdrop-filter: blur(18px);
      display: none;
    }

    .nav-menu-panel.active {
      display: block;
    }

    .nav-menu-links {
      display: grid;
      gap: 8px;
    }

    .nav-menu-link,
    .nav-menu-link:visited {
      min-height: 48px;
      padding: 0 14px;
      border-radius: 16px;
      color: rgba(23, 23, 23, 0.68);
      font-size: 13px;
      font-weight: 700;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      text-decoration: none;
      display: flex;
      align-items: center;
    }

    .nav-menu-link:hover {
      background: rgba(192, 154, 92, 0.12);
      color: #171717;
    }

    @media (max-width: 900px) {
      .site-header {
        top: 14px;
        left: 14px;
        right: 14px;
        z-index: 1002;
        width: auto;
        height: 54px;
        min-height: 54px;
        padding: 0 10px;
        transform: none;
        display: grid;
        grid-template-columns: 52px minmax(0, 1fr) 52px;
        align-items: center;
        gap: 0;
      }

      .site-header-nav {
        display: none;
      }

      .site-header-logo,
      .site-header-logo:visited {
        grid-column: 2;
        justify-self: center;
        min-width: 88px;
        display: inline-flex;
        overflow: hidden;
        text-align: center;
      }

      .site-header-actions {
        grid-column: 3;
        justify-self: end;
        display: flex;
      }

      .site-header-gpa {
        display: none;
      }

      .site-header-user,
      .site-header-user:visited {
        width: 42px;
        height: 42px;
      }

      .hamburger-toggle {
        grid-column: 1;
        grid-row: 1;
        display: flex;
        justify-self: start;
        width: 44px;
        height: 44px;
      }
    }
  `;

  document.head.appendChild(headerStyles);

  headerRoot.outerHTML = `
<header class="site-header">
  <a href="index.html" class="site-header-logo"><span class="site-header-logo-auc">AUC</span><span class="site-header-logo-atlas">Atlas</span></a>

  <nav class="site-header-nav" aria-label="Main navigation">
    <a href="professors.html">Professors</a>
    <a href="courses.html">Courses</a>
    <a href="gpa-calculator.html">GPA Calculator</a>
  </nav>

  <div class="site-header-actions">
    <div class="floating-account-widget" id="floating-account-widget">
      <button class="floating-account-button" id="floating-account-button" type="button" aria-label="Open account menu" aria-expanded="false">
        <img src="user.png" alt="Account" id="floating-account-photo">
      </button>

      <div class="floating-account-menu" id="floating-account-menu" hidden>
        <a href="login.html" class="floating-account-menu-link" id="floating-login-link">
          <img src="user.png" alt="">
          <span>Login</span>
        </a>

        <a href="accounts.html" class="floating-account-menu-link" id="floating-account-link" hidden>
          <img src="user.png" alt="">
          <span>Account</span>
        </a>

        <a href="degree-progression.html" class="floating-account-menu-link" id="floating-degree-link" hidden>
          <span class="floating-account-menu-icon floating-degree-icon" aria-hidden="true"></span>
          <span>Degree Progression</span>
        </a>

        <a href="accounts.html#reviews" class="floating-account-menu-link" id="floating-reviews-link" hidden>
          <span class="floating-account-menu-icon floating-reviews-icon" aria-hidden="true"></span>
          <span>Activity History</span>
        </a>

        <button class="floating-account-menu-link floating-account-logout" id="floating-logout-button" type="button" hidden>
          <span class="floating-logout-icon" aria-hidden="true"></span>
          <span>Logout</span>
        </button>
      </div>
    </div>
  </div>

  <button class="hamburger-toggle" type="button" aria-label="Open menu" aria-expanded="false">
    <span></span>
    <span></span>
    <span></span>
  </button>
</header>

<div class="nav-menu-overlay" aria-hidden="true">
  <div class="nav-menu-panel nav-menu-main active">
    <div class="nav-menu-links">
      <a href="professors.html" class="nav-menu-link">Professors</a>
      <a href="courses.html" class="nav-menu-link">Courses</a>
      <a href="gpa-calculator.html" class="nav-menu-link">GPA Calculator</a>
    </div>
  </div>
</div>
`;

  const menuButton = document.querySelector(".hamburger-toggle");
  const menuOverlay = document.querySelector(".nav-menu-overlay");
  const menuLinks = document.querySelectorAll(".nav-menu-link");
  const accountButton = document.getElementById("floating-account-button");
  const accountPhoto = document.getElementById("floating-account-photo");
  const accountMenu = document.getElementById("floating-account-menu");
  const loginLink = document.getElementById("floating-login-link");
  const accountLink = document.getElementById("floating-account-link");
  const degreeLink = document.getElementById("floating-degree-link");
  const reviewsLink = document.getElementById("floating-reviews-link");
  const logoutButton = document.getElementById("floating-logout-button");

  function closeNavMenu() {
    document.body.classList.remove("nav-menu-open");

    if (menuButton) {
      menuButton.setAttribute("aria-expanded", "false");
    }

    if (menuOverlay) {
      menuOverlay.setAttribute("aria-hidden", "true");
    }
  }

  function closeAccountMenu() {
    if (!accountButton || !accountMenu) {
      return;
    }

    accountButton.setAttribute("aria-expanded", "false");
    accountMenu.classList.remove("is-open");

    window.setTimeout(function () {
      if (!accountMenu.classList.contains("is-open")) {
        accountMenu.hidden = true;
      }
    }, 180);
  }

  function openAccountMenu() {
    if (!accountButton || !accountMenu) {
      return;
    }

    accountMenu.hidden = false;
    accountButton.setAttribute("aria-expanded", "true");

    window.requestAnimationFrame(function () {
      accountMenu.classList.add("is-open");
    });
  }

  function clearLocalSignedInFlags() {
    try {
      localStorage.removeItem("auc-atlas-signed-in");
      localStorage.removeItem("aucAtlasSignedIn");
      sessionStorage.removeItem("auc-atlas-signed-in");
      sessionStorage.removeItem("aucAtlasSignedIn");
    } catch (error) {}
  }

  function saveLocalSignedInFlags() {
    try {
      localStorage.setItem("auc-atlas-signed-in", "1");
      localStorage.setItem("aucAtlasSignedIn", "true");
    } catch (error) {}
  }

  function setAccountPhoto(photoURL) {
    const safePhotoURL = String(photoURL || "").trim();

    if (!accountPhoto) {
      return;
    }

    if (safePhotoURL) {
      accountPhoto.src = safePhotoURL;
      accountPhoto.alt = "Account profile photo";
      accountPhoto.classList.add("has-profile-photo");
      return;
    }

    accountPhoto.src = "user.png";
    accountPhoto.alt = "Account";
    accountPhoto.classList.remove("has-profile-photo");
  }

  function showLoggedOutAccountState() {
    window.aucAtlasCurrentUser = null;
    setAccountPhoto("");

    if (loginLink) {
      loginLink.hidden = false;
    }

    if (accountLink) {
      accountLink.hidden = true;
    }

    if (degreeLink) {
      degreeLink.hidden = true;
    }

    if (reviewsLink) {
      reviewsLink.hidden = true;
    }

    if (logoutButton) {
      logoutButton.hidden = true;
    }
  }

  function showLoggedInAccountState(user) {
    window.aucAtlasCurrentUser = user || window.aucAtlasCurrentUser || {};
    saveLocalSignedInFlags();
    setAccountPhoto((user || {}).photoURL || "");

    if (loginLink) {
      loginLink.hidden = true;
    }

    if (accountLink) {
      accountLink.hidden = false;
    }

    if (degreeLink) {
      degreeLink.hidden = false;
    }

    if (reviewsLink) {
      reviewsLink.hidden = false;
    }

    if (logoutButton) {
      logoutButton.hidden = false;
    }
  }

  async function loadAccountState() {
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

      if (response.ok && data.signedIn && data.user) {
        showLoggedInAccountState(data.user);
        return data.user;
      }
    } catch (error) {}

    clearLocalSignedInFlags();
    showLoggedOutAccountState();
    return null;
  }

  if (menuButton && menuOverlay) {
    menuButton.addEventListener("click", function () {
      const menuIsOpen = document.body.classList.toggle("nav-menu-open");
      menuButton.setAttribute("aria-expanded", String(menuIsOpen));
      menuOverlay.setAttribute("aria-hidden", String(!menuIsOpen));
      closeAccountMenu();
    });

    menuOverlay.addEventListener("click", function (event) {
      if (event.target === menuOverlay) {
        closeNavMenu();
      }
    });

    menuLinks.forEach(function (link) {
      link.addEventListener("click", closeNavMenu);
    });
  }

  if (accountButton && accountMenu) {
    loadAccountState();

    accountButton.addEventListener("click", function (event) {
      event.stopPropagation();
      loadAccountState();

      if (accountMenu.hidden || !accountMenu.classList.contains("is-open")) {
        openAccountMenu();
      } else {
        closeAccountMenu();
      }
    });

    if (loginLink) {
      loginLink.addEventListener("click", closeAccountMenu);
    }

    if (accountLink) {
      accountLink.addEventListener("click", closeAccountMenu);
    }

    if (logoutButton) {
      logoutButton.addEventListener("click", async function () {
        logoutButton.disabled = true;

        await fetch("/api/logout", {
          method: "POST",
          credentials: "same-origin",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({})
        }).catch(function () {});

        clearLocalSignedInFlags();
        showLoggedOutAccountState();
        closeAccountMenu();
        logoutButton.disabled = false;
        window.location.href = "index.html";
      });
    }

    document.addEventListener("click", function (event) {
      if (!accountMenu.contains(event.target) && event.target !== accountButton) {
        closeAccountMenu();
      }
    });
  }

  document.addEventListener("keydown", function (event) {
    if (event.key === "Escape") {
      closeNavMenu();
      closeAccountMenu();
    }
  });
})();
