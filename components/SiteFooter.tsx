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
              <li>
                <a href="/professors.html">Professors</a>
              </li>
              <li>
                <a href="/courses.html">Courses</a>
              </li>
              <li>
                <a href="/gpa-calculator.html">GPA Calculator</a>
              </li>
            </ul>
          </div>

          <div className="site-footer-column">
            <h3>Student Guidance</h3>
            <ul className="site-footer-links">
              <li>
                <a href="/declaration-process.html">Declaration Process</a>
              </li>
              <li>
                <a href="/student-rights.html">Student Rights</a>
              </li>
              <li>
                <a href="/auc-benefits.html">AUC Benefits</a>
              </li>
              <li>
                <a href="/university-policy.html">Campus Rules</a>
              </li>
            </ul>
          </div>

          <div className="site-footer-column">
            <h3>Support</h3>
            <ul className="site-footer-links">
              <li>
                <a href="/faq.html">FAQ</a>
              </li>
              <li>
                <a href="/privacy.html">Privacy Policy</a>
              </li>
              <li>
                <a href="/terms.html">Terms of Service</a>
              </li>
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
