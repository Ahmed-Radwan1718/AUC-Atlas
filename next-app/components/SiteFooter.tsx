import Link from "next/link";

export default function SiteFooter() {
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
              <li><Link href="/professors">Professors</Link></li>
              <li><Link href="/courses">Courses</Link></li>
              <li><Link href="/gpa-calculator">GPA Calculator</Link></li>
            </ul>
          </div>

          <div className="site-footer-column">
            <h3>Support</h3>
            <ul className="site-footer-links">
              <li><Link href="/faq">FAQ</Link></li>
              <li><Link href="/privacy">Privacy Policy</Link></li>
              <li><Link href="/terms">Terms of Service</Link></li>
            </ul>
          </div>
        </div>

        <div className="site-footer-bottom">
          <p className="site-footer-copyright">© 2026 AUC Atlas. All rights reserved.</p>
          <p className="site-footer-disclaimer">AUC Atlas can make mistakes. Double-check important info.</p>
        </div>
      </div>
    </footer>
  );
}
