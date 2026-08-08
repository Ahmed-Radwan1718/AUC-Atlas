import CoursesBrowser from "./CoursesBrowser";

export const metadata = {
  title: "Courses",
  description: "Search and browse AUC courses, course materials, departments, and student resources."
};

const featuredCourses = [
  {
    code: "CSCE 1001",
    title: "Fundamentals of Computing I",
    department: "Computer Science",
    level: "1000 Level",
    signal: "Popular first-year course"
  },
  {
    code: "MACT 1121",
    title: "Calculus I",
    department: "Mathematics",
    level: "1000 Level",
    signal: "Common foundation course"
  },
  {
    code: "PHYS 1011",
    title: "Physics 1: Classical Mechanics, Sound and Heat",
    department: "Physics",
    level: "1000 Level",
    signal: "Engineering and science track"
  },
  {
    code: "ACCT 2001",
    title: "Financial Accounting",
    department: "Accounting",
    level: "2000 Level",
    signal: "Business core course"
  }
];

const departments = [
  "Computer Science",
  "Business",
  "Engineering",
  "Mathematics",
  "Sciences",
  "Humanities"
];

export default function CoursesPage() {
  return (
    <main className="courses-page-shell">
      <section className="courses-hero">
        <div>
          <p className="section-kicker">Course Library</p>
          <h1>Find the course, then the context.</h1>
        </div>

        <p>
          The Next.js course page starts as a cleaner browsing surface. Next we
          connect it to the real course dataset, course detail pages, materials,
          and upload flows.
        </p>
      </section>

      <section className="course-search-card" aria-label="Course search">
        <div>
          <span>Search courses</span>
          <strong>Course code, title, department, or level</strong>
        </div>

        <Link href="/">Back to overview</Link>
      </section>

      <section className="course-browser-layout">
        <aside className="course-filter-rail" aria-label="Course departments">
          <span>Departments</span>

          <div>
            {departments.map((department) => (
              <button type="button" key={department}>
                {department}
              </button>
            ))}
          </div>
        </aside>

        <section className="course-list-panel" aria-label="Featured courses">
          <div className="course-list-header">
            <div>
              <p className="section-kicker">Featured courses</p>
              <h2>Start with the high-traffic paths.</h2>
            </div>

            <span>{featuredCourses.length} shown</span>
          </div>

          <div className="course-row-list">
            {featuredCourses.map((course) => (
              <article className="course-row" key={course.code}>
                <div>
                  <span>{course.code}</span>
                  <h3>{course.title}</h3>
                  <p>{course.signal}</p>
                </div>

                <div className="course-row-meta">
                  <span>{course.department}</span>
                  <span>{course.level}</span>
                </div>
              </article>
            ))}
          </div>
        </section>
      </section>
    </main>
  );
}
