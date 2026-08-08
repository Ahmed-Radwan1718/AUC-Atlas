import Link from "next/link";

const stats = [
  { value: "900+", label: "Courses", detail: "Search by code, title, subject, and level." },
  { value: "470+", label: "Professors", detail: "Browse profiles, reviews, departments, and course links." },
  { value: "24/7", label: "Student Tools", detail: "GPA, degree progress, materials, and account history." }
];

const featureCards = [
  {
    href: "/courses",
    label: "Course Library",
    title: "Find the class before you commit.",
    copy: "Search courses, open course pages, and reach materials without jumping across disconnected tools."
  },
  {
    href: "/professors",
    label: "Professor Profiles",
    title: "Compare teaching fit clearly.",
    copy: "Profiles, ratings, review counts, departments, and course history should feel calm and easy to scan."
  },
  {
    href: "/degree-progression",
    label: "Academic Planning",
    title: "Track requirements in one place.",
    copy: "A cleaner planning layer for majors, completed requirements, and saved progress."
  }
];

export default function HomePage() {
  return (
    <main className="home-page-shell">
      <section className="home-hero-grid">
        <div className="home-hero-copy">
          <p className="section-kicker">AUC Atlas</p>
          <h1>Choose courses with a clearer map.</h1>
          <p>
            AUC Atlas brings professor insight, course material, GPA tools, and
            degree planning into one student-focused workspace.
          </p>

          <div className="home-search-preview" aria-label="Search preview">
            <span>Search professors, courses, or materials</span>
            <Link href="/courses">Start search</Link>
          </div>

          <div className="hero-actions">
            <Link className="atlas-button" href="/courses">
              Browse courses
            </Link>
            <Link className="atlas-button atlas-button-secondary" href="/professors">
              View professors
            </Link>
          </div>
        </div>

        <aside className="home-signal-panel" aria-label="AUC Atlas overview">
          <div className="signal-panel-header">
            <span>Student decision layer</span>
            <strong>Built around enrollment choices</strong>
          </div>

          <div className="signal-list">
            <div>
              <span>01</span>
              <p>Find a course and see what students have shared.</p>
            </div>
            <div>
              <span>02</span>
              <p>Open professor context before registration week.</p>
            </div>
            <div>
              <span>03</span>
              <p>Track progress without losing the bigger picture.</p>
            </div>
          </div>
        </aside>
      </section>

      <section className="home-stat-grid" aria-label="Site snapshot">
        {stats.map((stat) => (
          <article className="stat-card" key={stat.label}>
            <strong>{stat.value}</strong>
            <span>{stat.label}</span>
            <p>{stat.detail}</p>
          </article>
        ))}
      </section>

      <section className="feature-grid" aria-label="AUC Atlas features">
        {featureCards.map((card) => (
          <Link className="feature-card" href={card.href} key={card.href}>
            <span>{card.label}</span>
            <h2>{card.title}</h2>
            <p>{card.copy}</p>
          </Link>
        ))}
      </section>
    </main>
  );
}
