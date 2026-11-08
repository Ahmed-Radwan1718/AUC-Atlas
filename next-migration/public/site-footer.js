(function () {
  const footerHiddenPages = new Set([
    "accounts",
    "degree-progression",
    "login",
    "signup",
    "forgot-password",
    "reset-password"
  ]);

  const professorNameUpdates = {
    "h-rizzo": "Helen Rizzo"
  };

  function normalizeProfessorId(value) {
    return String(value || "")
      .trim()
      .toLowerCase()
      .replace(/&/g, "and")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  }

  function applyProfessorNameUpdates() {
    document
      .querySelectorAll(
        ".professor-card-image img, .professor-profile-image img"
      )
      .forEach(function (image) {
        const professorId = normalizeProfessorId(image.alt);
        const updatedName = professorNameUpdates[professorId];

        if (!updatedName) {
          return;
        }

        const card = image.closest(".professor-card");
        const profileCard = image.closest(".professor-profile-card");
        const heading = card ? card.querySelector("h2") : null;
        const pageHeading = document.querySelector(
          ".professors-header.professor-profile-heading h1"
        );
        const professorNameInput = document.querySelector(
          'input[name="professorName"]'
        );

        image.alt = updatedName;

        if (heading) {
          heading.textContent = updatedName;
        }

        if (card) {
          card.setAttribute(
            "aria-label",
            "Open " + updatedName + " profile"
          );
        }

        if (profileCard) {
          if (pageHeading) {
            pageHeading.textContent = updatedName;
          }

          if (professorNameInput) {
            professorNameInput.value = updatedName;
          }

          document.title = updatedName + " | AUC Atlas";
        }
      });
  }

  function applyProfessorCardStarColors() {
    document
      .querySelectorAll(
        ".professor-card .professor-meta > span:last-child"
      )
      .forEach(function (rating) {
        if (rating.dataset.starColorReady === "true") {
          return;
        }

        const match = rating.textContent
          .trim()
          .match(/^([★]+)([☆]*)(?:\s+(.+))?$/);

        if (!match) {
          return;
        }

        rating.textContent = "";

        const filledStars = document.createElement("span");
        filledStars.textContent = match[1];
        filledStars.style.color = "#C09A5C";
        rating.appendChild(filledStars);

        if (match[2]) {
          const emptyStars = document.createElement("span");
          emptyStars.textContent = match[2];
          rating.appendChild(emptyStars);
        }

        if (match[3]) {
          rating.appendChild(
            document.createTextNode(" " + match[3])
          );
        }

        rating.dataset.starColorReady = "true";
      });
  }

  function applyProfessorOverrides() {
    applyProfessorNameUpdates();
    applyProfessorCardStarColors();
  }

  function setupProfessorOverrides() {
    const grid = document.getElementById("professors-grid");

    if (!grid) {
      return;
    }

    applyProfessorOverrides();

    if (grid.dataset.professorOverridesReady === "true") {
      return;
    }

    const observer = new MutationObserver(function () {
      applyProfessorOverrides();
    });

    observer.observe(grid, {
      childList: true,
      subtree: true
    });

    grid.dataset.professorOverridesReady = "true";
  }

  function renderSiteFooter() {
    const currentPath = window.location.pathname.replace(/\/+$/, "");
    const currentPage = (currentPath.split("/").pop() || "index").replace(/\.html$/i, "");

    applyProfessorOverrides();
    setupProfessorOverrides();

    if (
      currentPage === "accounts" &&
      !document.querySelector('script[src="account-authenticator-ui.js"]')
    ) {
      const authenticatorUiScript = document.createElement("script");
      authenticatorUiScript.src = "account-authenticator-ui.js";
      document.head.appendChild(authenticatorUiScript);
    }

    if (footerHiddenPages.has(currentPage) || document.querySelector(".site-footer")) {
      return;
    }

    const footerStyles = document.createElement("style");
    footerStyles.textContent = `
      .site-footer {
        padding: 46px 0 24px;
        border-top: 1px solid rgba(23, 23, 23, 0.08);
        background: rgba(255, 255, 255, 0.58);
        color: #171717;
      }

      .site-footer-inner {
        width: min(1120px, calc(100% - 32px));
        margin: 0 auto;
      }

      .site-footer-grid {
        display: grid;
        grid-template-columns: minmax(0, 1.35fr) repeat(2, minmax(140px, 0.65fr));
        gap: 34px;
      }

      .site-footer-logo {
        margin-bottom: 10px;
        color: #171717;
        font-weight: 700;
        letter-spacing: -0.02em;
        display: inline-flex;
        align-items: baseline;
        gap: 4px;
      }

      .site-footer-logo-auc {
        color: rgba(192, 154, 92, 0.84);
        font-size: 14px;
      }

      .site-footer-logo-atlas {
        color: #171717;
        font-size: 22px;
      }

      .site-footer-brand p,
      .site-footer-bottom p {
        color: rgba(23, 23, 23, 0.62);
        font-size: 14px;
        line-height: 1.7;
      }

      .site-footer-column h3 {
        margin-bottom: 13px;
        color: rgba(192, 154, 92, 0.9);
        font-size: 12px;
        font-weight: 800;
        letter-spacing: 0.14em;
        text-transform: uppercase;
      }

      .site-footer-links {
        list-style: none;
        display: grid;
        gap: 10px;
      }

      .site-footer-links a,
      .site-footer-links a:visited {
        color: rgba(23, 23, 23, 0.64);
        font-size: 14px;
        font-weight: 700;
        text-decoration: none;
      }

      .site-footer-links a:hover {
        color: #171717;
      }

      .site-footer-bottom {
        margin-top: 34px;
        padding-top: 18px;
        border-top: 1px solid rgba(23, 23, 23, 0.08);
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 32px;
      }

      .site-footer-bottom p {
        margin: 0;
      }

      .site-footer-copyright {
        flex: 0 0 auto;
        white-space: nowrap;
      }

      .site-footer-disclaimer {
        flex: 1 1 auto;
        text-align: right;
      }

      @media (max-width: 760px) {
        .site-footer-grid {
          grid-template-columns: 1fr;
          gap: 26px;
        }

        .site-footer-links {
          gap: 2px;
        }

        .site-footer-links a,
        .site-footer-links a:visited {
          min-height: 44px;
          display: flex;
          align-items: center;
        }

        .site-footer-bottom {
          flex-direction: column;
          align-items: flex-start;
          gap: 10px;
        }

        .site-footer-disclaimer {
          text-align: left;
        }
      }
    `;
    document.head.appendChild(footerStyles);

    const footer = document.createElement("footer");
    footer.className = "site-footer";
    footer.innerHTML = `
      <div class="site-footer-inner">
        <div class="site-footer-grid">
          <div class="site-footer-column site-footer-brand">
            <h2 class="site-footer-logo"><span class="site-footer-logo-auc">AUC</span><span class="site-footer-logo-atlas">Atlas</span></h2>
            <p>All your academic needs in one place.</p>
          </div>

          <div class="site-footer-column">
            <h3>Explore</h3>
            <ul class="site-footer-links">
              <li><a href="https://aucatlas.com/professors.html">Professors</a></li>
              <li><a href="https://aucatlas.com/courses.html">Courses</a></li>
              <li><a href="https://aucatlas.com/gpa-calculator.html">GPA Calculator</a></li>
            </ul>
          </div>

          <div class="site-footer-column">
            <h3>Support</h3>
            <ul class="site-footer-links">
              <li><a href="/faq">FAQ</a></li>
              <li><a href="https://aucatlas.com/privacy.html">Privacy Policy</a></li>
              <li><a href="https://aucatlas.com/terms.html">Terms of Service</a></li>
            </ul>
          </div>
        </div>

        <div class="site-footer-bottom">
          <p class="site-footer-copyright">&copy; 2026 AUC Atlas. All rights reserved.</p>
          <p class="site-footer-disclaimer">AUC Atlas can make mistakes. Double-check important info.</p>
        </div>
      </div>
    `;

    document.body.appendChild(footer);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", renderSiteFooter);
  } else {
    renderSiteFooter();
  }
})();