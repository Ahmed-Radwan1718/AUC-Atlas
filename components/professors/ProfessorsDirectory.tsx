"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { CatalogResponse, Professor } from "@/lib/types";

const PAGE_SIZE = 30;
const LEGACY_ASSET_BASE =
  "https://raw.githubusercontent.com/Ahmed-Radwan1718/AUC-Atlas/main";

type ReviewSummary = {
  reviewCount?: number;
  averageRating?: number;
};

type ReviewSummaryResponse = {
  summaries?: Record<string, ReviewSummary>;
};

type DirectoryProfessor = Professor & {
  reviewCount: number;
  averageRating: number;
};

function normalize(value: unknown) {
  return String(value || "").toLowerCase().trim();
}

function normalizeProfessorId(value: unknown) {
  return normalize(value)
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function getProfessorId(professor: Professor) {
  return normalizeProfessorId(professor.id || professor.name);
}

function getProfessorDepartment(professor: Professor) {
  const department = String(professor.department || "").trim();

  if (!department || normalize(department) === "department coming soon") {
    return "Other";
  }

  return department;
}

function getProfessorRatingStatus(professor: DirectoryProfessor) {
  const rating = Number(professor.averageRating || 0);

  if (!Number.isFinite(rating) || rating <= 0) {
    return "No ratings yet";
  }

  const rounded = Math.max(1, Math.min(5, Math.round(rating)));
  return rounded === 1 ? "1 star" : `${rounded} stars`;
}

function getProfessorCardImageUrl(imageUrl?: string) {
  const safe = String(imageUrl || "user.png").trim() || "user.png";

  if (safe === "user.png") {
    return `${LEGACY_ASSET_BASE}/user.png`;
  }

  if (safe.includes("res.cloudinary.com") && safe.includes("/image/upload/")) {
    return safe.replace(
      "/image/upload/",
      "/image/upload/f_auto,q_auto:good,c_fill,g_auto,w_720,h_456/",
    );
  }

  return safe;
}

function RatingLabel({ professor }: { professor: DirectoryProfessor }) {
  const { reviewCount, averageRating } = professor;

  if (!reviewCount || !Number.isFinite(averageRating) || averageRating <= 0) {
    return <>No Stars Yet</>;
  }

  const filled = Math.max(1, Math.min(5, Math.round(averageRating)));
  const empty = 5 - filled;

  return (
    <>
      <span className="professor-rating-filled">{"★".repeat(filled)}</span>
      {"☆".repeat(empty)} {averageRating.toFixed(1)}
    </>
  );
}

export function ProfessorsDirectory() {
  const [catalog, setCatalog] = useState<CatalogResponse>({
    courses: [],
    professors: [],
  });
  const [summaries, setSummaries] = useState<Record<string, ReviewSummary>>({});
  const [query, setQuery] = useState("");
  const [selectedDepartments, setSelectedDepartments] = useState<Set<string>>(
    new Set(),
  );
  const [selectedRatings, setSelectedRatings] = useState<Set<string>>(new Set());
  const [openFilters, setOpenFilters] = useState<Set<string>>(new Set());
  const [visibleLimit, setVisibleLimit] = useState(PAGE_SIZE);
  const [isFiltering, setIsFiltering] = useState(false);
  const mountedRef = useRef(false);

  useEffect(() => {
    let active = true;

    fetch("/api/catalog", {
      headers: { Accept: "application/json" },
    })
      .then((response) => {
        if (!response.ok) throw new Error("catalog");
        return response.json();
      })
      .then((data: CatalogResponse) => {
        if (active) setCatalog(data);
      })
      .catch(() => {});

    fetch("/api/professor-reviews?summaries=true", {
      credentials: "same-origin",
      cache: "no-store",
      headers: { Accept: "application/json" },
    })
      .then((response) => {
        if (!response.ok) throw new Error("summaries");
        return response.json();
      })
      .then((data: ReviewSummaryResponse) => {
        if (active && data.summaries && typeof data.summaries === "object") {
          setSummaries(data.summaries);
        }
      })
      .catch(() => {});

    return () => {
      active = false;
    };
  }, []);

  const professors = useMemo<DirectoryProfessor[]>(() => {
    return catalog.professors.map((professor) => {
      const summary = summaries[getProfessorId(professor)] || {};
      const reviewCount = Math.max(0, Math.floor(Number(summary.reviewCount) || 0));
      const averageRating = Number(summary.averageRating || 0);

      return {
        ...professor,
        reviewCount,
        averageRating:
          Number.isFinite(averageRating) && averageRating > 0
            ? averageRating
            : 0,
      };
    });
  }, [catalog.professors, summaries]);

  const departments = useMemo(() => {
    return Array.from(new Set(professors.map(getProfessorDepartment)))
      .filter((department) => department !== "Other")
      .sort((a, b) => a.localeCompare(b));
  }, [professors]);

  const matchingProfessors = useMemo(() => {
    const normalizedQuery = normalize(query);

    return professors
      .filter((professor) => {
        const ratingStatus = getProfessorRatingStatus(professor);
        const department = getProfessorDepartment(professor);
        const searchableText = normalize(
          [
            getProfessorId(professor),
            professor.name,
            professor.department,
            professor.displayDepartment,
            professor.filterDepartment,
            ratingStatus,
            professor.course,
            professor.bio,
          ].join(" "),
        );

        const matchesSearch =
          !normalizedQuery || searchableText.includes(normalizedQuery);
        const matchesDepartment =
          selectedDepartments.size === 0 || selectedDepartments.has(department);
        const matchesRating =
          selectedRatings.size === 0 || selectedRatings.has(ratingStatus);

        return matchesSearch && matchesDepartment && matchesRating;
      })
      .sort((a, b) => {
        const reviewDifference = b.reviewCount - a.reviewCount;
        return reviewDifference || a.name.localeCompare(b.name);
      });
  }, [professors, query, selectedDepartments, selectedRatings]);

  useEffect(() => {
    if (!mountedRef.current) {
      mountedRef.current = true;
      return;
    }

    setVisibleLimit(PAGE_SIZE);
    setIsFiltering(false);

    const frame = requestAnimationFrame(() => setIsFiltering(true));
    const timer = window.setTimeout(() => setIsFiltering(false), 520);

    return () => {
      cancelAnimationFrame(frame);
      window.clearTimeout(timer);
    };
  }, [query, selectedDepartments, selectedRatings]);

  const visibleProfessors = matchingProfessors.slice(0, visibleLimit);
  const remaining = Math.max(0, matchingProfessors.length - visibleLimit);
  const nextBatch = Math.min(PAGE_SIZE, remaining);

  function toggleFilterSection(section: string) {
    setOpenFilters((current) => {
      const next = new Set(current);
      if (next.has(section)) next.delete(section);
      else next.add(section);
      return next;
    });
  }

  function toggleDepartment(department: string) {
    setSelectedDepartments((current) => {
      const next = new Set(current);
      if (next.has(department)) next.delete(department);
      else next.add(department);
      return next;
    });
  }

  function toggleRating(rating: string) {
    setSelectedRatings((current) => {
      const next = new Set(current);
      if (next.has(rating)) next.delete(rating);
      else next.add(rating);
      return next;
    });
  }

  return (
    <main className="professors-page">
      <div className="professors-inner">
        <section className="professors-header">
          <div>
            <h1>Find your next professor.</h1>
          </div>
          <p>
            Browse AUC professors and check ratings, courses, and student reviews.
          </p>
        </section>

        <section
          className="professors-browser"
          aria-label="Professor filters and results"
        >
          <aside className="filters-panel" id="professor-filters">
            <div className="filters-heading">Filter Professors</div>

            <div
              className={`filter-item${openFilters.has("department") ? " open" : ""}`}
            >
              <button
                className="filter-toggle"
                type="button"
                aria-expanded={openFilters.has("department")}
                onClick={() => toggleFilterSection("department")}
              >
                <span>Department</span>
                <span className="chevron" aria-hidden="true" />
              </button>
              <div className="filter-content department-filter-content">
                {departments.map((department) => (
                  <label key={department}>
                    <input
                      type="checkbox"
                      checked={selectedDepartments.has(department)}
                      onChange={() => toggleDepartment(department)}
                    />
                    {department}
                  </label>
                ))}
              </div>
            </div>

            <div
              className={`filter-item${openFilters.has("rating") ? " open" : ""}`}
            >
              <button
                className="filter-toggle"
                type="button"
                aria-expanded={openFilters.has("rating")}
                onClick={() => toggleFilterSection("rating")}
              >
                <span>Rating Status</span>
                <span className="chevron" aria-hidden="true" />
              </button>
              <div className="filter-content">
                {[1, 2, 3, 4, 5].map((stars) => {
                  const value = stars === 1 ? "1 star" : `${stars} stars`;
                  return (
                    <label className="rating-filter-option" key={value}>
                      <input
                        type="checkbox"
                        checked={selectedRatings.has(value)}
                        onChange={() => toggleRating(value)}
                      />
                      <span className="rating-filter-stars">
                        {"★".repeat(stars)}
                      </span>
                      <span>{value}</span>
                    </label>
                  );
                })}
              </div>
            </div>
          </aside>

          <section className="professors-results">
            <div className="professors-search-box">
              <input
                id="professor-search-input"
                type="search"
                placeholder="Search professors..."
                aria-label="Search professors"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
              />
            </div>

            <section
              className={`professors-grid${isFiltering ? " is-filtering" : ""}`}
              id="professors-grid"
              aria-label="Professor list"
            >
              {visibleProfessors.map((professor, index) => (
                <a
                  className="professor-card"
                  href={`/professors/${encodeURIComponent(getProfessorId(professor))}`}
                  aria-label={`Open ${professor.name} profile`}
                  key={getProfessorId(professor)}
                >
                  <div className="professor-card-image">
                    <img
                      src={getProfessorCardImageUrl(professor.image)}
                      alt={professor.name}
                      width={720}
                      height={456}
                      loading={index < 8 ? "eager" : "lazy"}
                      decoding="async"
                      fetchPriority={index < 4 ? "high" : "auto"}
                    />
                  </div>
                  <div className="professor-card-body">
                    <h2>{professor.name}</h2>
                    <p className="professor-bio">
                      {professor.bio || "Bio coming soon."}
                    </p>
                    <div className="professor-meta">
                      <span>
                        {professor.displayDepartment || professor.department}
                      </span>
                      <span>
                        {professor.reviewCount} {professor.reviewCount === 1 ? "Review" : "Reviews"}
                      </span>
                      <span className="professor-rating-label">
                        <RatingLabel professor={professor} />
                      </span>
                    </div>
                  </div>
                </a>
              ))}

              {matchingProfessors.length === 0 && (
                <p className="professors-empty">
                  No professors match those filters.
                </p>
              )}

              {remaining > 0 && (
                <button
                  className="professors-view-more"
                  type="button"
                  aria-label={`Show ${nextBatch} more professors`}
                  onClick={() => setVisibleLimit((limit) => limit + PAGE_SIZE)}
                >
                  View {nextBatch} more
                  <span>{remaining} remaining</span>
                </button>
              )}
            </section>
          </section>
        </section>
      </div>
    </main>
  );
}
