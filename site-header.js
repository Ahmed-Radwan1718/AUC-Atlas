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
      border: 1px solid rgba(255, 255, 255, 0.14);
      background: rgba(24, 25, 24, 0.9);
      box-shadow: 0 22px 55px rgba(42, 32, 20, 0.2);
      backdrop-filter: blur(18px);
      -webkit-backdrop-filter: blur(18px);
      transform: translateX(-50%);
      display: flex;
      align-items: center;
      gap: 28px;
    }

    .site-header-logo,
    .site-header-logo:visited {
      color: white;
      font-size: 16px;
      font-weight: 700;
      letter-spacing: -0.02em;
      text-decoration: none;
      white-space: nowrap;
    }

    .site-header-nav {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 26px;
    }

    .site-header-nav > a,
    .site-header-nav > a:visited {
      color: rgba(255, 255, 255, 0.68);
      font-size: 12px;
      font-weight: 700;
      letter-spacing: 0.06em;
      text-transform: uppercase;
      text-decoration: none;
      transition: color 0.2s ease, opacity 0.2s ease;
    }

    .site-header-nav > a:hover {
      color: white;
    }

    .site-header-actions {
      flex: 0 0 auto;
      display: flex;
      align-items: center;
      justify-content: flex-end;
      gap: 8px;
    }

    .site-header-action,
    .site-header-action:visited {
      min-height: 42px;
      padding: 0 16px;
      border-radius: 999px;
      border: 1px solid rgba(255, 255, 255, 0.16);
      background: rgba(255, 255, 255, 0.08);
      color: white;
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      text-decoration: none;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      transition: background 0.22s ease, border-color 0.22s ease, transform 0.22s ease;
    }

    .site-header-action:hover {
      border-color: rgba(255, 255, 255, 0.3);
      background: rgba(255, 255, 255, 0.13);
      transform: translateY(-1px);
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
      background: white;
      display: block;
    }

    .nav-menu-overlay {
      position: fixed;
      inset: 0;
      z-index: 1001;
      padding: 82px 14px 14px;
      background: rgba(12, 12, 12, 0.34);
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
      border: 1px solid rgba(255, 255, 255, 0.11);
      background: rgba(24, 25, 24, 0.94);
      box-shadow: 0 22px 55px rgba(0, 0, 0, 0.28);
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
      color: rgba(255, 255, 255, 0.78);
      font-size: 13px;
      font-weight: 700;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      text-decoration: none;
      display: flex;
      align-items: center;
    }

    .nav-menu-link:hover {
      background: rgba(255, 255, 255, 0.09);
      color: white;
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
        grid-template-columns: 80px minmax(0, 1fr) 80px;
        align-items: center;
        gap: 0;
      }

      .site-header-nav,
      .site-header-actions {
        display: none;
      }

      .site-header-logo,
      .site-header-logo:visited {
        display: block;
        overflow: hidden;
        font-size: 15px;
        text-align: center;
        text-overflow: ellipsis;
      }

      .hamburger-toggle {
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
  <a href="index.html" class="site-header-logo">AUC Atlas</a>

  <nav class="site-header-nav" aria-label="Main navigation">
    <a href="professors.html">Professors</a>
    <a href="courses.html">Courses</a>
    <a href="materials.html">Materials</a>
    <a href="reviews.html">Reviews</a>
  </nav>

  <div class="site-header-actions">
    <a href="reviews.html" class="site-header-action">Submit Review</a>
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
      <a href="materials.html" class="nav-menu-link">Materials</a>
      <a href="reviews.html" class="nav-menu-link">Submit Review</a>
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
