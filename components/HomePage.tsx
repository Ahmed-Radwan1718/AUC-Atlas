"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { trackWeeklyVisit } from "@/lib/weekly-visits";

type Professor = {
  id?: string;
  name?: string;
  department?: string;
  displayDepartment?: string;
  image?: string;
};

type Course = {
  code?: string;
};

type Review = {
  id?: string;
  professorId?: string;
  professorName?: string;
  courseCode?: string;
  rating?: number;
  createdAt?: string;
};

type Material = {
  id?: string;
  courseCode?: string;
  materialType?: string;
  title?: string;
  createdAt?: string;
};

type ProfessorSummary = {
  professorId?: string;
  averageRating?: number;
  reviewCount?: number;
};

type HomepageOverview = {
  reviewCount?: number;
  latestReviews?: Review[];
  latestMaterials?: Material[];
  topReviewedProfessors?: ProfessorSummary[];
};

type TopProfessor = {
  professor: Professor;
  averageRating: number;
  reviewCount: number;
};

function formatHomeCount(value: number) {
  return Math.max(0, Math.round(Number(value) || 0)).toLocaleString("en-US");
}

function useAnimatedCount(value: number | null, fallback = "—") {
  const [displayValue, setDisplayValue] = useState(
    value === null ? fallback : formatHomeCount(value)
  );
  const numericValueRef = useRef(value === null ? 0 : value);

  useEffect(() => {
    if (value === null) {
      setDisplayValue(fallback);
      return;
    }

    const currentValue = Math.max(0, Number(numericValueRef.current) || 0);
    const nextValue = Math.max(0, Math.round(Number(value) || 0));
    numericValueRef.current = nextValue;

    if (
      window.matchMedia("(prefers-reduced-motion: reduce)").matches ||
      currentValue === nextValue
    ) {
      setDisplayValue(formatHomeCount(nextValue));
      return;
    }

    const startTime = performance.now();
    const duration = 520;
    let animationFrame = 0;

    const updateFrame = (now: number) => {
      const progress = Math.min((now - startTime) / duration, 1);
      const easedProgress = 1 - Math.pow(1 - progress, 3);
      const displayedValue =
        currentValue + (nextValue - currentValue) * easedProgress;

      setDisplayValue(formatHomeCount(displayedValue));

      if (progress < 1) {
        animationFrame = window.requestAnimationFrame(updateFrame);
      } else {
        setDisplayValue(formatHomeCount(nextValue));
      }
    };

    animationFrame = window.requestAnimationFrame(updateFrame);

    return () => {
      window.cancelAnimationFrame(animationFrame);
    };
  }, [fallback, value]);

  return displayValue;
}

function formatHomeDate(value?: string) {
  const date = new Date(value || "");

  if (Number.isNaN(date.getTime())) {
    return "Recently";
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric"
  }).format(date);
}

function getCourseMaterialHref(courseCode?: string) {
  const slug = String(courseCode || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return slug
    ? `/courses/${encodeURIComponent(slug)}#course-materials-access`
    : "/courses";
}

export function HomePage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [professors, setProfessors] = useState<Professor[]>([]);
  const [overview, setOverview] = useState<HomepageOverview | null>(null);
  const [weeklyVisits, setWeeklyVisits] = useState<number | null>(null);
  const [overviewFailed, setOverviewFailed] = useState(false);
  const [donationModalOpen, setDonationModalOpen] = useState(false);
  const donationCloseButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    setCourses(Array.isArray(window.aucAtlasCourses) ? window.aucAtlasCourses : []);
    setProfessors(
      Array.isArray(window.aucAtlasProfessors) ? window.aucAtlasProfessors : []
    );

    let cancelled = false;

    void trackWeeklyVisit().then((count) => {
      if (!cancelled && count !== null && Number.isFinite(Number(count))) {
        setWeeklyVisits(Number(count));
      }
    });

    void fetch("/api/homepage-overview", {
      method: "GET",
      credentials: "same-origin",
      headers: {
        Accept: "application/json"
      }
    })
      .then(async (response) => {
        if (!response.ok) {
          throw new Error("Could not load homepage activity.");
        }

        return (await response.json()) as HomepageOverview;
      })
      .then((data) => {
        if (!cancelled) {
          setOverview(data);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setOverviewFailed(true);
        }
      });

    void fetch("/api/donation-counter", {
      method: "GET",
      credentials: "same-origin",
      headers: {
        Accept: "application/json"
      }
    }).catch(() => undefined);

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    document.body.classList.toggle("support-donation-open", donationModalOpen);

    if (donationModalOpen) {
      window.setTimeout(() => donationCloseButtonRef.current?.focus(), 0);
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && donationModalOpen) {
        setDonationModalOpen(false);
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.classList.remove("support-donation-open");
    };
  }, [donationModalOpen]);

  const topProfessors = useMemo(() => {
    const professorsById = new Map<string, Professor>();

    professors.forEach((professor) => {
      if (professor?.id) {
        professorsById.set(String(professor.id), professor);
      }
    });

    return (Array.isArray(overview?.topReviewedProfessors)
      ? overview.topReviewedProfessors
      : []
    )
      .map((summary): TopProfessor | null => {
        const professorId = String(summary?.professorId || "");
        const professor = professorsById.get(professorId);
        const averageRating = Number(summary?.averageRating);
        const reviewCount = Math.max(
          0,
          Math.round(Number(summary?.reviewCount) || 0)
        );

        if (
          !professor?.name ||
          !Number.isFinite(averageRating) ||
          averageRating <= 0 ||
          reviewCount <= 0
        ) {
          return null;
        }

        return {
          professor,
          averageRating: Math.min(5, averageRating),
          reviewCount
        };
      })
      .filter((item): item is TopProfessor => item !== null)
      .sort((a, b) => {
        if (b.averageRating !== a.averageRating) {
          return b.averageRating - a.averageRating;
        }

        return b.reviewCount - a.reviewCount;
      })
      .slice(0, 3);
  }, [overview?.topReviewedProfessors, professors]);

  const professorCount = useAnimatedCount(professors.length, "0");
  const courseCount = useAnimatedCount(courses.length, "0");
  const reviewCount = useAnimatedCount(
    overviewFailed ? null : overview ? Number(overview.reviewCount) || 0 : null
  );
  const weeklyVisitCount = useAnimatedCount(weeklyVisits);
  const latestReviews = Array.isArray(overview?.latestReviews)
    ? overview.latestReviews.slice(0, 3)
    : [];
  const latestMaterials = Array.isArray(overview?.latestMaterials)
    ? overview.latestMaterials.slice(0, 3)
    : [];

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
                spellCheck="false"
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
            <p>
              Jump directly to the main AUC Atlas tools instead of searching through
              the site.
            </p>

            <div className="home-quick-links">
              <a className="home-quick-link" href="/professors.html">
                <strong>Browse professors</strong>
                <span aria-hidden="true">→</span>
              </a>

              <a className="home-quick-link" href="/courses.html">
                <strong>Explore courses</strong>
                <span aria-hidden="true">→</span>
              </a>

              <a className="home-quick-link" href="/gpa-calculator.html">
                <strong>Calculate your GPA</strong>
                <span aria-hidden="true">→</span>
              </a>
            </div>
          </aside>
        </section>

        <section className="home-stats-section" aria-labelledby="home-stats-title">
          <div className="home-section-head">
            <div>
              <p className="home-kicker">AUC Atlas by the numbers</p>
              <h2 id="home-stats-title">Built from student knowledge.</h2>
            </div>

            <p>
              Live counts from the professors, courses, reviews, and visits during the
              current week.
            </p>
          </div>

          <div className="home-stats-grid">
            <article className="home-stat">
              <strong id="home-professor-count">{professorCount}</strong>
              <span>Professors listed</span>
            </article>

            <article className="home-stat">
              <strong id="home-course-count">{courseCount}</strong>
              <span>Courses available</span>
            </article>

            <article className="home-stat">
              <strong id="home-review-count">{reviewCount}</strong>
              <span>Student reviews</span>
            </article>

            <article className="home-stat">
              <strong id="home-weekly-visit-count">{weeklyVisitCount}</strong>
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
              Check the newest professor reviews, student-uploaded course materials,
              and professors with the highest student ratings.
            </p>
          </div>

          <div className="home-latest-grid">
            <article className="home-latest-card">
              <div className="home-latest-card-head">
                <div>
                  <span>Student feedback</span>
                  <h3>Recent reviews</h3>
                </div>

                <a href="/professors.html">View all →</a>
              </div>

              <div className="home-latest-list" id="home-latest-reviews">
                {!overview && !overviewFailed ? (
                  <p className="home-latest-status">Loading recent reviews...</p>
                ) : latestReviews.length ? (
                  latestReviews.map((review, index) => {
                    const rating = Math.max(
                      0,
                      Math.min(5, Math.round(Number(review.rating) || 0))
                    );
                    const professorId = String(review.professorId || "");
                    const professor = professors.find(
                      (item) => String(item?.id || "") === professorId
                    );
                    const professorName =
                      review.professorName || professor?.name || "AUC professor";
                    const professorImage = professor?.image || "/user.png";
                    const professorHref = professorId
                      ? `/professors/${encodeURIComponent(professorId)}`
                      : "/professors";

                    return (
                      <a
                        className="home-latest-item home-latest-person"
                        href={professorHref}
                        key={review.id || `${professorId}-${index}`}
                      >
                        <img src={professorImage} alt="" />
                        <span className="home-latest-person-copy">
                          <span className="home-latest-item-top">
                            <span className="home-latest-type">Review</span>
                            <small>{formatHomeDate(review.createdAt)}</small>
                          </span>
                          <strong>{professorName}</strong>
                          <span className="home-latest-item-bottom">
                            <small>{review.courseCode || "Course not listed"}</small>
                            <span
                              className="home-latest-stars"
                              aria-label={`${rating} out of 5 stars`}
                            >
                              {"★".repeat(rating) + "☆".repeat(5 - rating)}
                            </span>
                          </span>
                        </span>
                      </a>
                    );
                  })
                ) : (
                  <p className="home-latest-status">
                    The newest professor reviews will appear here.
                  </p>
                )}
              </div>
            </article>

            <article className="home-latest-card">
              <div className="home-latest-card-head">
                <div>
                  <span>Course resources</span>
                  <h3>New materials</h3>
                </div>

                <a href="/courses.html">View all →</a>
              </div>

              <div className="home-latest-list" id="home-latest-materials">
                {!overview && !overviewFailed ? (
                  <p className="home-latest-status">Loading new materials...</p>
                ) : latestMaterials.length ? (
                  latestMaterials.map((material, index) => (
                    <a
                      className="home-latest-item"
                      href={getCourseMaterialHref(material.courseCode)}
                      key={material.id || `${material.courseCode}-${index}`}
                    >
                      <span className="home-latest-item-top">
                        <span className="home-latest-type">
                          {material.materialType || "Material"}
                        </span>
                        <small>{formatHomeDate(material.createdAt)}</small>
                      </span>
                      <strong>{material.title || "Course material"}</strong>
                      <span className="home-latest-item-bottom">
                        <small>{material.courseCode || "AUC course"}</small>
                        <span className="home-latest-arrow" aria-hidden="true">
                          →
                        </span>
                      </span>
                    </a>
                  ))
                ) : (
                  <p className="home-latest-status">
                    New approved course materials will appear here.
                  </p>
                )}
              </div>
            </article>

            <article className="home-latest-card">
              <div className="home-latest-card-head">
                <div>
                  <span>Student ratings</span>
                  <h3>Top reviewed professors</h3>
                </div>

                <a href="/professors.html">View all →</a>
              </div>

              <div className="home-latest-list" id="home-latest-professors">
                {!overview && !overviewFailed ? (
                  <p className="home-latest-status">
                    Loading top-reviewed professors...
                  </p>
                ) : topProfessors.length ? (
                  topProfessors.map(({ professor, averageRating, reviewCount }) => {
                    const reviewLabel = reviewCount === 1 ? "review" : "reviews";
                    const department =
                      professor.displayDepartment || professor.department || "AUC";
                    const ratingLabel = `${averageRating.toFixed(
                      1
                    )} out of 5 from ${reviewCount} ${reviewLabel}`;

                    return (
                      <a
                        className="home-latest-item home-latest-person"
                        href={`/professors/${encodeURIComponent(
                          String(professor.id || "")
                        )}`}
                        key={professor.id}
                      >
                        <img src={professor.image || "/user.png"} alt="" />
                        <span className="home-latest-person-copy">
                          <strong>{professor.name}</strong>
                          <small aria-label={`${department}. ${ratingLabel}`}>
                            {department} ·{" "}
                            <span className="home-latest-stars" aria-hidden="true">
                              ★
                            </span>{" "}
                            {averageRating.toFixed(1)} · {reviewCount} {reviewLabel}
                          </small>
                        </span>
                        <span className="home-latest-arrow" aria-hidden="true">
                          →
                        </span>
                      </a>
                    );
                  })
                ) : (
                  <p className="home-latest-status">
                    Top-reviewed professors will appear here once ratings are available.
                  </p>
                )}
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
                Request a missing professor, course, or study resource, or report
                information that needs to be corrected.
              </p>
            </div>

            <div className="home-request-grid">
              <a
                className="home-request-card"
                href="https://wa.me/201010206091"
                target="_blank"
                rel="noopener noreferrer"
              >
                <span>Professor request</span>
                <strong>Request a professor</strong>
                <p>Tell us which AUC professor is missing from the directory.</p>
                <span aria-hidden="true">→</span>
              </a>

              <a
                className="home-request-card"
                href="https://wa.me/201010206091"
                target="_blank"
                rel="noopener noreferrer"
              >
                <span>Course request</span>
                <strong>Request a course</strong>
                <p>Submit a course code or title that should be searchable.</p>
                <span aria-hidden="true">→</span>
              </a>

              <a
                className="home-request-card"
                href="https://wa.me/201010206091"
                target="_blank"
                rel="noopener noreferrer"
              >
                <span>Material request</span>
                <strong>Request course material</strong>
                <p>Let students know which notes, exams, or resources are needed.</p>
                <span aria-hidden="true">→</span>
              </a>

              <a
                className="home-request-card"
                href="https://wa.me/201010206091"
                target="_blank"
                rel="noopener noreferrer"
              >
                <span>Correction</span>
                <strong>Report incorrect information</strong>
                <p>Flag outdated, missing, or inaccurate information on the site.</p>
                <span aria-hidden="true">→</span>
              </a>
            </div>
          </div>
        </section>
      </main>

      <div
        className="support-donation-modal"
        id="support-donation-modal"
        hidden={!donationModalOpen}
      >
        <button
          className="support-donation-backdrop"
          id="support-donation-backdrop"
          type="button"
          aria-label="Close donation window"
          onClick={() => setDonationModalOpen(false)}
        />

        <div
          className="support-donation-card"
          role="dialog"
          aria-modal="true"
          aria-labelledby="support-donation-title"
        >
          <button
            ref={donationCloseButtonRef}
            className="support-donation-close"
            id="support-donation-close"
            type="button"
            aria-label="Close donation window"
            onClick={() => setDonationModalOpen(false)}
          >
            ×
          </button>

          <div className="support-donation-heading">
            <div className="support-donation-title-group">
              <p className="support-donation-kicker">Support AUC Atlas</p>
              <h2 id="support-donation-title">Scan to donate</h2>
            </div>

            <p className="support-donation-copy">
              Open Telda on your phone and scan this QR code to help cover the monthly
              running costs.
            </p>
          </div>

          <div className="support-barcode">
            <img src="/telda-payment-barcode.png" alt="Telda donation QR code" />
            <span>Scan with Telda</span>
          </div>
        </div>
      </div>
    </>
  );
}

declare global {
  interface Window {
    aucAtlasCourses?: Course[];
    aucAtlasProfessors?: Professor[];
  }
}
