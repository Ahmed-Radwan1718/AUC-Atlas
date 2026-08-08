import Link from "next/link";
import "./globals.css";

export const metadata = {
  title: {
    default: "AUC Atlas",
    template: "%s | AUC Atlas"
  },
  description: "AUC Atlas helps students explore professors, courses, reviews, degree progress, GPA tools, and course materials."
};

const navItems = [
  { href: "/professors", label: "Professors" },
  { href: "/courses", label: "Courses" },
  { href: "/gpa-calculator", label: "GPA Calculator" },
  { href: "/degree-progression", label: "Degree Progression" },
  { href: "/faq", label: "FAQ" }
];

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <div className="site-shell">
          <header className="atlas-header">
            <Link className="atlas-brand" href="/">
              <span>AUC</span>
              <strong>Atlas</strong>
            </Link>

            <nav className="atlas-nav" aria-label="Main navigation">
              {navItems.map((item) => (
                <Link key={item.href} href={item.href}>
                  {item.label}
                </Link>
              ))}
            </nav>

            <Link className="atlas-account-link" href="/login">
              Account
            </Link>
          </header>

          {children}

          <footer className="atlas-footer">
            <span>AUC Atlas</span>
            <span>Built for clearer student decisions.</span>
          </footer>
        </div>
      </body>
    </html>
  );
}
