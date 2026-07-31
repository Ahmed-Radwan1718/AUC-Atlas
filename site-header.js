(function () {
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
      justify-self: start;
      color: #171717;
      font-weight: 700;
      letter-spacing: -0.02em;
      text-decoration: none;
      white-space: nowrap;
      display: inline-flex;
      align-items: baseline;
      gap: 4px;
    }

    .site-header-logo-auc {
      color: rgba(192, 154, 92, 0.84);
      font-size: 14px;
    }

    .site-header-logo-atlas {
      color: #171717;
      font-size: 22px;
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

    .site-header-user,
    .site-header-user:visited {
      width: 42px;
      height: 42px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      text-decoration: none;
      transition: opacity 0.22s ease, transform 0.22s ease;
    }

    .site-header-user:hover {
      opacity: 0.72;
      transform: translateY(-1px);
    }

    .site-header-user img {
      width: 24px;
      height: 24px;
      display: block;
      object-fit: contain;
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
        display: block;
        overflow: hidden;
        font-size: 15px;
        text-align: center;
        text-overflow: ellipsis;
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
    <a href="account.html" class="site-header-user" aria-label="Account">
      <img src="user.png" alt="">
    </a>
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

  function closeNavMenu() {
    document.body.classList.remove("nav-menu-open");

    if (menuButton) {
      menuButton.setAttribute("aria-expanded", "false");
    }

    if (menuOverlay) {
      menuOverlay.setAttribute("aria-hidden", "true");
    }
  }

  if (menuButton && menuOverlay) {
    menuButton.addEventListener("click", function () {
      const menuIsOpen = document.body.classList.toggle("nav-menu-open");
      menuButton.setAttribute("aria-expanded", String(menuIsOpen));
      menuOverlay.setAttribute("aria-hidden", String(!menuIsOpen));
    });

    menuOverlay.addEventListener("click", function (event) {
      if (event.target === menuOverlay) {
        closeNavMenu();
      }
    });

    menuLinks.forEach(function (link) {
      link.addEventListener("click", closeNavMenu);
    });

    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape") {
        closeNavMenu();
      }
    });
  }
})();
