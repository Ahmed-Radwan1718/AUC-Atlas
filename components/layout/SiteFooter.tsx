export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="site-footer-inner">
        <div className="site-footer-grid">
          <div className="site-footer-column site-footer-brand">
            <h2 className="site-footer-logo">
              <span className="site-footer-logo-auc">AUC</span>
              <span className="site-footer-logo-atlas">Atlas</span>
            </h2>
            <p>All your academic needs in one place.</p>
          </div>

          <div className="site-footer-column">
            <h3>Explore</h3>
            <ul className="site-footer-links">
              <li><a href="/professors">Professors</a></li>
              <li><a href="/courses">Courses</a></li>
              <li><a href="/gpa-calculator">GPA Calculator</a></li>
            </ul>
          </div>

          <div className="site-footer-column">
            <h3>Support</h3>
            <ul className="site-footer-links">
              <li><a href="/faq">FAQ</a></li>
              <li><a href="/privacy">Privacy Policy</a></li>
              <li><a href="/terms">Terms of Service</a></li>
            </ul>
          </div>
        </div>

        <div className="site-footer-bottom">
          <p className="site-footer-copyright">
            © 2026 AUC Atlas. All rights reserved.
          </p>
          <p className="site-footer-disclaimer">
            AUC Atlas can make mistakes. Double-check important info.
          </p>
        </div>
      </div>
    </footer>
  );
}
