import Link from "next/link";
import Script from "next/script";

export default function HomePage() {
  return (
    <>
      <main className="home-page">
        <section className="home-hero">
          <div>
            <p className="home-kicker">Built for AUC students</p>
            <h1>Know before you enroll.</h1>
            <p className="home-hero-copy">
              Search professors, courses, and student-uploaded material in one place.
            </p>

            <form
              className="atlas-search"
              id="atlas-search-form"
              role="search"
              autoComplete="off"
              noValidate
            >
              <input
                id="atlas-search-input"
                name="q"
                type="search"
                placeholder="Search a professor, course, or material"
                aria-label="Search AUC Atlas"
                aria-controls="atlas-search-results"
                aria-expanded="false"
                aria-autocomplete="list"
                autoComplete="off"
                spellCheck={false}
              />
              <button type="submit">Search</button>

              <div
                className="atlas-search-results"
                id="atlas-search-results"
                aria-label="Search results"
                hidden
              >
                <div id="atlas-search-results-list" />
                <p
                  className="atlas-search-status"
                  id="atlas-search-status"
                  aria-live="polite"
                  hidden
                />
              </div>
            </form>
          </div>

          <aside className="home-feature-card">
            <span>Quick access</span>
            <h2>Start with what you need.</h2>
            <p>Jump directly to the main AUC Atlas tools instead of searching through the site.</p>

            <div className="home-quick-links">
              <Link className="home-quick-link" href="/professors">
                <strong>Browse professors</strong>
                <span aria-hidden="true">→</span>
              </Link>
              <Link className="home-quick-link" href="/courses">
                <strong>Explore courses</strong>
                <span aria-hidden="true">→</span>
              </Link>
              <Link className="home-quick-link" href="/gpa-calculator">
                <strong>Calculate your GPA</strong>
                <span aria-hidden="true">→</span>
              </Link>
            </div>
          </aside>
        </section>

        <section className="home-stats-section" aria-labelledby="home-stats-title">
          <div className="home-section-head">
            <div>
              <p className="home-kicker">AUC Atlas by the numbers</p>
              <h2 id="home-stats-title">Built from student knowledge.</h2>
            </div>
            <p>Live counts from the professors, courses, reviews, and visits during the current week.</p>
          </div>

          <div className="home-stats-grid">
            <article className="home-stat">
              <strong id="home-professor-count">0</strong>
              <span>Professors listed</span>
            </article>
            <article className="home-stat">
              <strong id="home-course-count">0</strong>
              <span>Courses available</span>
            </article>
            <article className="home-stat">
              <strong id="home-review-count">—</strong>
              <span>Student reviews</span>
            </article>
            <article className="home-stat">
              <strong id="home-weekly-visit-count">—</strong>
              <span>Visits this week</span>
            </article>
          </div>
        </section>

        <section className="home-content-section" aria-labelledby="home-latest-title">
          <div className="home-section-head">
            <div>
              <p className="home-kicker">Latest on AUC Atlas</p>
              <h2 id="home-latest-title">See what students added recently.</h2>
            </div>
            <p>
              Check the newest professor reviews, student-uploaded course materials, and professors with the highest student ratings.
            </p>
          </div>

          <div className="home-latest-grid">
            <article className="home-latest-card">
              <div className="home-latest-card-head">
                <div>
                  <span>Student feedback</span>
                  <h3>Recent reviews</h3>
                </div>
                <Link href="/professors">View all →</Link>
              </div>
              <div className="home-latest-list" id="home-latest-reviews">
                <p className="home-latest-status">Loading recent reviews...</p>
              </div>
            </article>

            <article className="home-latest-card">
              <div className="home-latest-card-head">
                <div>
                  <span>Course resources</span>
                  <h3>New materials</h3>
                </div>
                <Link href="/courses">View all →</Link>
              </div>
              <div className="home-latest-list" id="home-latest-materials">
                <p className="home-latest-status">Loading new materials...</p>
              </div>
            </article>

            <article className="home-latest-card">
              <div className="home-latest-card-head">
                <div>
                  <span>Student ratings</span>
                  <h3>Top reviewed professors</h3>
                </div>
                <Link href="/professors">View all →</Link>
              </div>
              <div className="home-latest-list" id="home-latest-professors">
                <p className="home-latest-status">Loading top-reviewed professors...</p>
              </div>
            </article>
          </div>
        </section>

        <section className="home-content-section" aria-labelledby="home-request-title">
          <div className="home-request-layout">
            <div className="home-request-copy">
              <p className="home-kicker">Missing something?</p>
              <h2 id="home-request-title">Help us fill the gaps.</h2>
              <p>
                Request a missing professor, course, or study resource, or report information that needs to be corrected.
              </p>
            </div>

            <div className="home-request-grid">
              <a className="home-request-card" href="https://wa.me/201010206091" target="_blank" rel="noopener noreferrer">
                <span>Professor request</span>
                <strong>Request a professor</strong>
                <p>Tell us which AUC professor is missing from the directory.</p>
                <span aria-hidden="true">→</span>
              </a>
              <a className="home-request-card" href="https://wa.me/201010206091" target="_blank" rel="noopener noreferrer">
                <span>Course request</span>
                <strong>Request a course</strong>
                <p>Submit a course code or title that should be searchable.</p>
                <span aria-hidden="true">→</span>
              </a>
              <a className="home-request-card" href="https://wa.me/201010206091" target="_blank" rel="noopener noreferrer">
                <span>Material request</span>
                <strong>Request course material</strong>
                <p>Let students know which notes, exams, or resources are needed.</p>
                <span aria-hidden="true">→</span>
              </a>
              <a className="home-request-card" href="https://wa.me/201010206091" target="_blank" rel="noopener noreferrer">
                <span>Correction</span>
                <strong>Report incorrect information</strong>
                <p>Flag outdated, missing, or inaccurate information on the site.</p>
                <span aria-hidden="true">→</span>
              </a>
            </div>
          </div>
        </section>
      </main>

      <Script src="/data/courses.js" strategy="afterInteractive" />
      <Script src="/data/professor-data.js" strategy="afterInteractive" />
      <Script src="/home-search.js" strategy="afterInteractive" />
    </>
  );
}
