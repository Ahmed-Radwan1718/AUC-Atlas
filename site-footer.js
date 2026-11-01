(function () {
  const footerHiddenPages = new Set([
    "accounts",
    "degree-progression",
    "login",
    "signup",
    "forgot-password",
    "reset-password"
  ]);

  const professorPhotoUpdates = {
    "kate-ellis": "https://res.cloudinary.com/dhtamisqn/image/upload/v1793557977/5af39b66-7df3-4d17-8dc4-070332864bed.png",
    "nageh-allam": "https://res.cloudinary.com/dhtamisqn/image/upload/v1793558061/c0f7ea2d-853f-4973-8dbe-5040bc8e917a.png",
    "mohamed-badran": "https://res.cloudinary.com/dhtamisqn/image/upload/v1793558103/a5d14d05-15ac-4370-a206-e1527fc036c7.png",
    "wafik-lotfallah": "https://res.cloudinary.com/dhtamisqn/image/upload/v1793558143/29c1c873-da78-4247-8e61-18180bb4c9d2.png",
    "addison-ellis": "https://res.cloudinary.com/dhtamisqn/image/upload/v1793558195/4926dd5e-3c19-4dfd-80e1-e0375b4af172.png",
    "ahmed-abdellatif": "https://res.cloudinary.com/dhtamisqn/image/upload/v1793558230/a0626c92-db85-4274-bdb8-7c263e8491db.png",
    "ehab-elsawy": "https://res.cloudinary.com/dhtamisqn/image/upload/v1793558368/01e94527-d618-436d-90f6-420de93463db.png",
    "yasmine-motawy": "https://res.cloudinary.com/dhtamisqn/image/upload/v1793558421/729f5565-10b9-40ae-8cce-b45ba9a9fbf6.png",
    "hassan-azazy": "https://res.cloudinary.com/dhtamisqn/image/upload/v1793558561/3012e7d4-c723-4d2a-a4ae-1177eaf0b101.png",
    "mustafa-arafa": "https://res.cloudinary.com/dhtamisqn/image/upload/v1793558739/800ea61f-86a8-4493-b325-7f7f11c9f16b.png",
    "walid-fouad": "https://res.cloudinary.com/dhtamisqn/image/upload/v1793558858/ed0d7552-8282-4edd-8bfe-8b2f8e15553e.png",
    "aya-musmar": "https://res.cloudinary.com/dhtamisqn/image/upload/v1793558918/eb3dcd89-953f-4966-9c64-4d7f788b3a8e.png",
    "chelsea-green": "https://res.cloudinary.com/dhtamisqn/image/upload/v1793558956/e5255a7f-2193-4ff5-9fc4-d495bea0a2b9.png",
    "catarina-belo": "https://res.cloudinary.com/dhtamisqn/image/upload/v1793559003/daf84a9b-e38e-4675-b3a3-44e2ce981443.png",
    "christopher-barker": "https://res.cloudinary.com/dhtamisqn/image/upload/v1793559032/0fb6712a-f9c0-4bac-9735-a60da144feaf.png",
    "daoud-siniora": "https://res.cloudinary.com/dhtamisqn/image/upload/v1793559074/5234bcd4-e7a2-4162-b6f2-a102a710fa65.png",
    "dina-ebeid": "https://res.cloudinary.com/dhtamisqn/image/upload/v1793559131/69eb4f13-b22d-4ed6-8de8-4a7934f81be5.png",
    "dina-amin": "https://res.cloudinary.com/dhtamisqn/image/upload/v1793559201/4afc6619-9e14-4e3d-bc0f-3b1814ba704a.png",
    "elizabeth-rauh": "https://res.cloudinary.com/dhtamisqn/image/upload/v1793559438/2089b265-f586-492d-a767-e718dee11eec.png",
    "ahmed-tolba": "https://res.cloudinary.com/dhtamisqn/image/upload/v1793559365/4c9ab1b4-ffb8-45d3-b154-d884fde9dfeb.png"
  };

  function normalizeProfessorId(value) {
    return String(value || "")
      .trim()
      .toLowerCase()
      .replace(/&/g, "and")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  }

  function applyProfessorPhotoUpdates() {
    if (Array.isArray(window.aucAtlasProfessors)) {
      window.aucAtlasProfessors.forEach(function (professor) {
        const professorId = normalizeProfessorId(
          professor && (professor.id || professor.name)
        );
        const updatedPhoto = professorPhotoUpdates[professorId];

        if (updatedPhoto) {
          professor.image = updatedPhoto;
        }
      });
    }

    document
      .querySelectorAll(
        ".professor-card-image img, .professor-profile-image img"
      )
      .forEach(function (image) {
        const professorId = normalizeProfessorId(image.alt);
        const updatedPhoto = professorPhotoUpdates[professorId];

        if (updatedPhoto && image.src !== updatedPhoto) {
          image.src = updatedPhoto;
        }
      });
  }

  function renderSiteFooter() {
    const currentPath = window.location.pathname.replace(/\/+$/, "");
    const currentPage = (currentPath.split("/").pop() || "index").replace(/\.html$/i, "");

    applyProfessorPhotoUpdates();

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
              <li><a href="professors.html">Professors</a></li>
              <li><a href="courses.html">Courses</a></li>
              <li><a href="gpa-calculator.html">GPA Calculator</a></li>
            </ul>
          </div>

          <div class="site-footer-column">
            <h3>Support</h3>
            <ul class="site-footer-links">
              <li><a href="faq.html">FAQ</a></li>
              <li><a href="privacy.html">Privacy Policy</a></li>
              <li><a href="terms.html">Terms of Service</a></li>
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