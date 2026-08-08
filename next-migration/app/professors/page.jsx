import ProfessorsBrowser from "./ProfessorsBrowser";

export const metadata = {
  title: "Professors",
  description: "Browse AUC professor profiles, departments, ratings, and student review context."
};

const professorHighlights = [
  {
    name: "Eslam Badr",
    department: "Mathematics and Actuarial Science",
    code: "MACT",
    rating: "No ratings yet",
    note: "Calculus, linear algebra, algebraic geometry, and arithmetic."
  },
  {
    name: "Kate Ellis",
    department: "Psychology",
    code: "PSYC",
    rating: "No ratings yet",
    note: "Clinical psychology, trauma, refugees, and youth mental health."
  },
  {
    name: "Aya Musmar",
    department: "Architecture",
    code: "ARCH",
    rating: "No ratings yet",
    note: "Forced displacement, heritage, climate change, and architecture."
  },
  {
    name: "Tamer ElBatt",
    department: "Computer Science and Engineering",
    code: "CSCE",
    rating: "No ratings yet",
    note: "Wireless, mobile, and IoT networks."
  }
];

const filters = [
  "All",
  "Computer Science",
  "Engineering",
  "Sciences",
  "Humanities",
  "Business"
];

export default function ProfessorsPage() {
  return (
    <main className="professors-page-shell">
      <section className="professors-hero">
        <div>
          <p className="section-kicker">Professor Profiles</p>
          <h1>Compare teaching fit without the noise.</h1>
        </div>

        <p>
          The replacement frontend starts with a calmer professor browsing
          surface. Next we connect it to the full professor dataset, review
          counts, ratings, and individual profile pages.
        </p>
      </section>

      <section className="professor-filter-card" aria-label="Professor filters">
        <div>
          <span>Browse professors</span>
          <strong>Name, department, course, or rating status</strong>
        </div>

        <div className="professor-filter-chips">
          {filters.map((filter) => (
            <button type="button" key={filter}>
              {filter}
            </button>
          ))}
        </div>
      </section>

      <section className="professor-grid" aria-label="Featured professors">
        {professorHighlights.map((professor) => (
          <article className="professor-profile-card" key={professor.name}>
            <div className="professor-avatar" aria-hidden="true">
              {professor.name
                .split(" ")
                .slice(0, 2)
                .map((part) => part[0])
                .join("")}
            </div>

            <div className="professor-card-copy">
              <span>{professor.code}</span>
              <h2>{professor.name}</h2>
              <p>{professor.note}</p>
            </div>

            <div className="professor-card-meta">
              <span>{professor.department}</span>
              <span>{professor.rating}</span>
            </div>
          </article>
        ))}
      </section>
    </main>
  );
}
