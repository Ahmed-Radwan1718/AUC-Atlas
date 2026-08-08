import Link from "next/link";

const featureCards = [
  {
    href: "/professors",
    title: "Professor Reviews",
    copy: "Browse professors with ratings, review history, departments, and course connections."
  },
  {
    href: "/courses",
    title: "Course Materials",
    copy: "Find courses, professor-linked files, recent uploads, and student-contributed resources."
  },
  {
    href: "/degree-progression",
    title: "Degree Progression",
    copy: "Track requirements with a cleaner account-based academic planning experience."
  }
];

export default function HomePage() {
  return (
    <main className="page-shell">
      <section className="hero-section">
        <p className="section-kicker">AUC student hub</p>
        <h1>Know before you enroll.</h1>
        <p className="hero-copy">
          A coherent Next.js foundation for AUC Atlas, starting with one shared
          layout, typography scale, color system, and reusable page structure.
        </p>

        <div className="hero-actions">
          <Link className="atlas-button" href="/courses">
            Browse Courses
          </Link>
          <Link className="atlas-button atlas-button-secondary" href="/professors">
            View Professors
          </Link>
        </div>
      </section>

      <section className="feature-grid" aria-label="AUC Atlas features">
        {featureCards.map((card) => (
          <Link className="feature-card" href={card.href} key={card.href}>
            <h2>{card.title}</h2>
            <p>{card.copy}</p>
            <span>Open</span>
          </Link>
        ))}
      </section>

      <section className="migration-panel">
        <p className="section-kicker">Migration step 1</p>
        <h2>Shared visual system first.</h2>
        <p>
          This shell gives every future page the same header, spacing, type
          scale, buttons, cards, surfaces, and color language before deeper
          page-by-page conversion begins.
        </p>
      </section>
    </main>
  );
}
