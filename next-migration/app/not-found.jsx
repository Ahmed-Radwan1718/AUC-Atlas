import Link from "next/link";

export default function NotFound() {
  return (
    <main className="not-found-page-shell">
      <section className="not-found-panel">
        <p className="section-kicker">Page not found</p>
        <h1>This page is not on the map yet.</h1>
        <p>
          The page may have moved, or it may still be waiting to be migrated into
          the new AUC Atlas frontend.
        </p>

        <div className="not-found-actions">
          <Link className="atlas-button" href="/">
            Home
          </Link>
          <Link className="atlas-button atlas-button-secondary" href="/courses">
            Browse courses
          </Link>
        </div>
      </section>
    </main>
  );
}
