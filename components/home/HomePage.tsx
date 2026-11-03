"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { HomeSearch } from "@/components/home/HomeSearch";
import type {
  CatalogResponse,
  HomepageOverview,
  Professor,
} from "@/lib/types";

function formatCount(value: number) {
  return Math.max(0, Math.round(value || 0)).toLocaleString("en-US");
}

function AnimatedCount({ value, fallback = "0" }: { value: number | null; fallback?: string }) {
  const [displayed, setDisplayed] = useState(0);
  const frameRef = useRef<number | null>(null);
  const previousRef = useRef(0);

  useEffect(() => {
    if (value === null) return;

    const nextValue = Math.max(0, Math.round(value));
    const currentValue = previousRef.current;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (frameRef.current) cancelAnimationFrame(frameRef.current);

    if (reduced || currentValue === nextValue) {
      previousRef.current = nextValue;
      setDisplayed(nextValue);
      return;
    }

    const start = performance.now();
    const duration = 520;

    const tick = (now: number) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const nextDisplayed = currentValue + (nextValue - currentValue) * eased;
      setDisplayed(nextDisplayed);

      if (progress < 1) {
        frameRef.current = requestAnimationFrame(tick);
      } else {
        previousRef.current = nextValue;
        setDisplayed(nextValue);
      }
    };

    frameRef.current = requestAnimationFrame(tick);

    return () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
    };
  }, [value]);

  return <>{value === null ? fallback : formatCount(displayed)}</>;
}

function formatDate(value?: string) {
  if (!value) return "Recently";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Recently";
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" }).format(date);
}

function courseUrl(courseCode?: string, hash = "") {
  const slug = String(courseCode || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return slug ? `/courses/${encodeURIComponent(slug)}${hash}` : "/courses";
}

export function HomePage() {
  const [catalog, setCatalog] = useState<CatalogResponse>({ courses: [], professors: [] });
  const [overview, setOverview] = useState<HomepageOverview | null>(null);
  const [weeklyVisits, setWeeklyVisits] = useState<number | null>(null);

  useEffect(() => {
    let active = true;

    fetch("/api/catalog", { headers: { Accept: "application/json" } })
      .then((response) => {
        if (!response.ok) throw new Error("catalog");
        return response.json();
      })
      .then((data: CatalogResponse) => {
        if (active) setCatalog(data);
      })
      .catch(() => {});

    fetch("/api/homepage-overview", {
      cache: "no-store",
      credentials: "same-origin",
      headers: { Accept: "application/json" },
    })
      .then((response) => {
        if (!response.ok) throw new Error("overview");
        return response.json();
      })
      .then((data: HomepageOverview) => {
        if (active) setOverview(data);
      })
      .catch(() => {
        if (active) setOverview({});
      });

    const cacheKey = "aucAtlasWeeklyVisitCache";
    try {
      const cached = JSON.parse(sessionStorage.getItem(cacheKey) || "null");
      if (
        cached &&
        Number.isFinite(Number(cached.savedAt)) &&
        Date.now() - Number(cached.savedAt) <= 30 * 60 * 1000 &&
        Number.isFinite(Number(cached.weeklyVisits))
      ) {
        setWeeklyVisits(Math.max(0, Number(cached.weeklyVisits)));
      } else {
        fetch("/api/weekly-visitors", {
          method: "POST",
          cache: "no-store",
          credentials: "same-origin",
          headers: { Accept: "application/json" },
        })
          .then((response) => {
            if (!response.ok) throw new Error("visits");
            return response.json();
          })
          .then((data) => {
            if (!active) return;
            const count = Math.max(0, Number(data.weeklyVisits) || 0);
            setWeeklyVisits(count);
            sessionStorage.setItem(
              cacheKey,
              JSON.stringify({ savedAt: Date.now(), weeklyVisits: count }),
            );
          })
          .catch(() => {});
      }
    } catch {
      fetch("/api/weekly-visitors", {
        cache: "no-store",
        headers: { Accept: "application/json" },
      })
        .then((response) => response.json())
        .then((data) => {
          if (active && Number.isFinite(Number(data.weeklyVisits))) {
            setWeeklyVisits(Math.max(0, Number(data.weeklyVisits)));
          }
        })
        .catch(() => {});
    }

    return () => {
      active = false;
    };
  }, []);

  const professorsById = useMemo(() => {
    const map = new Map<string, Professor>();
    catalog.professors.forEach((professor) => map.set(String(professor.id), professor));
    return map;
  }, [catalog.professors]);

  const topProfessors = useMemo(() => {
    return (overview?.topReviewedProfessors || [])
      .map((summary) => {
        const professor = professorsById.get(String(summary.professorId || ""));
        const averageRating = Number(summary.averageRating);
        const reviewCount = Math.max(0, Math.round(Number(summary.reviewCount) || 0));
        if (!professor || !Number.isFinite(averageRating) || averageRating <= 0 || reviewCount <= 0) {
          return null;
        }
        return { professor, averageRating: Math.min(5, averageRating), reviewCount };
      })
      .filter((item): item is NonNullable<typeof item> => Boolean(item))
      .sort((a, b) => b.averageRating - a.averageRating || b.reviewCount - a.reviewCount)
      .slice(0, 3);
  }, [overview?.topReviewedProfessors, professorsById]);

  return (
    <main className="home-page">
      <section className="home-hero">
        <div>
          <p className="home-kicker">Built for AUC students</p>
          <h1>Know before you enroll.</h1>
          <p className="home-hero-copy">
            Search professors, courses, and student-uploaded material in one place.
          </p>
          <HomeSearch courses={catalog.courses} professors={catalog.professors} />
        </div>

        <aside className="home-feature-card">
          <span>Quick access</span>
          <h2>Start with what you need.</h2>
          <p>Jump directly to the main AUC Atlas tools instead of searching through the site.</p>
          <div className="home-quick-links">
            <a className="home-quick-link" href="/professors">
              <strong>Browse professors</strong><span aria-hidden="true">→</span>
            </a>
            <a className="home-quick-link" href="/courses">
              <strong>Explore courses</strong><span aria-hidden="true">→</span>
            </a>
            <a className="home-quick-link" href="/gpa-calculator">
              <strong>Calculate your GPA</strong><span aria-hidden="true">→</span>
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
          <p>Live counts from the professors, courses, reviews, and visits during the current week.</p>
        </div>

        <div className="home-stats-grid">
          <article className="home-stat">
            <strong><AnimatedCount value={catalog.professors.length} /></strong>
            <span>Professors listed</span>
          </article>
          <article className="home-stat">
            <strong><AnimatedCount value={catalog.courses.length} /></strong>
            <span>Courses available</span>
          </article>
          <article className="home-stat">
            <strong><AnimatedCount value={overview ? Number(overview.reviewCount || 0) : null} fallback="—" /></strong>
            <span>Student reviews</span>
          </article>
          <article className="home-stat">
            <strong><AnimatedCount value={weeklyVisits} fallback="—" /></strong>
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
          <p>Check the newest professor reviews, student-uploaded course materials, and professors with the highest student ratings.</p>
        </div>

        <div className="home-latest-grid">
          <article className="home-latest-card">
            <div className="home-latest-card-head">
              <div><span>Student feedback</span><h3>Recent reviews</h3></div>
              <a href="/professors">View all →</a>
            </div>
            <div className="home-latest-list">
              {!overview ? (
                <p className="home-latest-status">Loading recent reviews...</p>
              ) : (overview.latestReviews || []).slice(0, 3).length ? (
                (overview.latestReviews || []).slice(0, 3).map((review, index) => {
                  const professor = professorsById.get(String(review.professorId || ""));
                  const professorName = review.professorName || professor?.name || "AUC professor";
                  const professorImage = professor?.image || "https://aucatlas.com/user.png";
                  const rating = Math.max(0, Math.min(5, Math.round(Number(review.rating) || 0)));
                  const stars = "★".repeat(rating) + "☆".repeat(5 - rating);
                  return (
                    <a
                      className="home-latest-item home-latest-person"
                      href={review.professorId ? `/professors/${encodeURIComponent(String(review.professorId))}` : "/professors"}
                      key={`${review.professorId || "review"}-${review.createdAt || index}`}
                    >
                      <img src={professorImage} alt="" />
                      <span className="home-latest-person-copy">
                        <span className="home-latest-item-top">
                          <span className="home-latest-type">Review</span>
                          <small>{formatDate(review.createdAt)}</small>
                        </span>
                        <strong>{professorName}</strong>
                        <span className="home-latest-item-bottom">
                          <small>{review.courseCode || "Course not listed"}</small>
                          <span className="home-latest-stars" aria-label={`${rating} out of 5 stars`}>{stars}</span>
                        </span>
                      </span>
                    </a>
                  );
                })
              ) : (
                <p className="home-latest-status">The newest professor reviews will appear here.</p>
              )}
            </div>
          </article>

          <article className="home-latest-card">
            <div className="home-latest-card-head">
              <div><span>Course resources</span><h3>New materials</h3></div>
              <a href="/courses">View all →</a>
            </div>
            <div className="home-latest-list">
              {!overview ? (
                <p className="home-latest-status">Loading new materials...</p>
              ) : (overview.latestMaterials || []).slice(0, 3).length ? (
                (overview.latestMaterials || []).slice(0, 3).map((material, index) => (
                  <a
                    className="home-latest-item"
                    href={courseUrl(material.courseCode, "#course-materials-access")}
                    key={`${material.courseCode || "material"}-${material.title || index}`}
                  >
                    <span className="home-latest-item-top">
                      <span className="home-latest-type">{material.materialType || "Material"}</span>
                      <small>{formatDate(material.createdAt)}</small>
                    </span>
                    <strong>{material.title || "Course material"}</strong>
                    <span className="home-latest-item-bottom">
                      <small>{material.courseCode || "AUC course"}</small>
                      <span className="home-latest-arrow" aria-hidden="true">→</span>
                    </span>
                  </a>
                ))
              ) : (
                <p className="home-latest-status">New approved course materials will appear here.</p>
              )}
            </div>
          </article>

          <article className="home-latest-card">
            <div className="home-latest-card-head">
              <div><span>Student ratings</span><h3>Top reviewed professors</h3></div>
              <a href="/professors">View all →</a>
            </div>
            <div className="home-latest-list">
              {!overview ? (
                <p className="home-latest-status">Loading top-reviewed professors...</p>
              ) : topProfessors.length ? (
                topProfessors.map(({ professor, averageRating, reviewCount }) => {
                  const department = professor.displayDepartment || professor.department || "AUC";
                  const reviewLabel = reviewCount === 1 ? "review" : "reviews";
                  return (
                    <a
                      className="home-latest-item home-latest-person"
                      href={`/professors/${encodeURIComponent(professor.id)}`}
                      key={professor.id}
                    >
                      <img src={professor.image || "https://aucatlas.com/user.png"} alt="" />
                      <span className="home-latest-person-copy">
                        <strong>{professor.name}</strong>
                        <small aria-label={`${department}. ${averageRating.toFixed(1)} out of 5 from ${reviewCount} ${reviewLabel}`}>
                          {department} · <span className="home-latest-stars" aria-hidden="true">★</span> {averageRating.toFixed(1)} · {reviewCount} {reviewLabel}
                        </small>
                      </span>
                      <span className="home-latest-arrow" aria-hidden="true">→</span>
                    </a>
                  );
                })
              ) : (
                <p className="home-latest-status">Top-reviewed professors will appear here once ratings are available.</p>
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
            <p>Request a missing professor, course, or study resource, or report information that needs to be corrected.</p>
          </div>

          <div className="home-request-grid">
            {[
              ["Professor request", "Request a professor", "Tell us which AUC professor is missing from the directory."],
              ["Course request", "Request a course", "Submit a course code or title that should be searchable."],
              ["Material request", "Request course material", "Let students know which notes, exams, or resources are needed."],
              ["Correction", "Report incorrect information", "Flag outdated, missing, or inaccurate information on the site."],
            ].map(([label, title, copy]) => (
              <a
                className="home-request-card"
                href="https://wa.me/201010206091"
                target="_blank"
                rel="noopener noreferrer"
                key={label}
              >
                <span>{label}</span>
                <strong>{title}</strong>
                <p>{copy}</p>
                <span aria-hidden="true">→</span>
              </a>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
