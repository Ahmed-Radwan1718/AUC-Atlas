(function () {
  const footerHiddenPages = new Set([
    "accounts",
    "degree-progression",
    "login",
    "signup",
    "forgot-password",
    "reset-password"
  ]);

  function renderSiteFooter() {
    const currentPath = window.location.pathname.replace(/\/+$/, "");
    const currentPage = (currentPath.split("/").pop() || "index").replace(/\.html$/i, "");

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
        grid-template-columns: minmax(0, 1.4fr) repeat(2, minmax(160px, 0.7fr));
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
              <li><a href="declaration-process.html">Declaration Process</a></li>
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
          <p>&copy; 2026 AUC Atlas. All rights reserved.</p>
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
