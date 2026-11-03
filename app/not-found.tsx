import type { Metadata } from "next";
import "./not-found.css";

export const metadata: Metadata = {
  title: "Page Not Found | AUC Atlas",
  description: "The page you were looking for could not be found on AUC Atlas.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function NotFound() {
  return (
    <main className="error-page">
      <div className="error-inner">
        <section className="error-card" aria-labelledby="error-title">
          <div className="error-number" aria-hidden="true">
            4<span>0</span>4
          </div>
          <h1 className="error-message" id="error-title">
            Ackk, page not found.
          </h1>
        </section>
      </div>
    </main>
  );
}
