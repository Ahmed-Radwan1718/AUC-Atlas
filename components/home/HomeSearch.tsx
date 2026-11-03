"use client";

import {
  FormEvent,
  KeyboardEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { Course, Professor } from "@/lib/types";

type SearchResult = {
  key: string;
  type: "Professor" | "Course" | "Material";
  title: string;
  meta: string;
  href: string;
  score: number;
  professorId?: string;
  department?: string;
};

type MaterialResult = {
  title?: string;
  courseCode?: string;
  materialType?: string;
  professor?: string;
  semester?: string;
  score?: number;
};

type Props = {
  courses: Course[];
  professors: Professor[];
};

const minimumQueryLength = 2;

function normalize(value: unknown) {
  return String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function getSearchTerms(query: string) {
  return normalize(query).split(/\s+/).filter(Boolean);
}

function getMatchScore(query: string, primaryText: string, values: unknown[]) {
  const normalizedQuery = normalize(query);
  const terms = getSearchTerms(query);
  const normalizedPrimary = normalize(primaryText);
  const normalizedValues = values.map(normalize);
  const searchableText = normalizedValues.join(" ");

  if (!terms.length || !terms.every((term) => searchableText.includes(term))) {
    return -1;
  }

  let score = 0;

  if (normalizedPrimary === normalizedQuery) score += 500;
  else if (normalizedPrimary.startsWith(normalizedQuery)) score += 300;
  else if (normalizedPrimary.includes(normalizedQuery)) score += 180;

  normalizedValues.forEach((value, index) => {
    if (value === normalizedQuery) score += index === 0 ? 180 : 90;
    else if (value.startsWith(normalizedQuery)) score += index === 0 ? 110 : 55;
    else if (value.includes(normalizedQuery)) score += index === 0 ? 70 : 30;
  });

  score += Math.max(0, 50 - normalizedPrimary.length);
  return score;
}

function professorUrl(id: string) {
  const slug = String(id || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return slug ? `/professors/${encodeURIComponent(slug)}` : "/professors";
}

function courseUrl(code: string, hash = "") {
  const slug = String(code || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return slug ? `/courses/${encodeURIComponent(slug)}${hash}` : "/courses";
}

export function HomeSearch({ courses, professors }: Props) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [allowPanelOpen, setAllowPanelOpen] = useState(true);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [materials, setMaterials] = useState<MaterialResult[]>([]);
  const [materialLoading, setMaterialLoading] = useState(false);
  const [materialsLocked, setMaterialsLocked] = useState(false);
  const [reviewCounts, setReviewCounts] = useState<Record<string, number | null>>({});
  const formRef = useRef<HTMLFormElement>(null);

  const professorResults = useMemo<SearchResult[]>(() => {
    if (query.trim().length < minimumQueryLength) return [];

    return professors
      .map((professor) => {
        const department =
          professor.displayDepartment || professor.department || "AUC";
        const score = getMatchScore(query, professor.name, [
          professor.name,
          professor.id,
          professor.department,
          professor.displayDepartment,
          professor.filterDepartment,
          professor.course,
          professor.bio,
        ]);
        const reviewCount = reviewCounts[professor.id];
        const reviewLabel =
          reviewCount === undefined
            ? "Loading reviews..."
            : reviewCount === null
              ? "Reviews unavailable"
              : `${reviewCount} ${reviewCount === 1 ? "review" : "reviews"}`;

        return {
          key: `professor:${professor.id}`,
          type: "Professor" as const,
          title: professor.name,
          professorId: professor.id,
          department,
          meta: [department, reviewLabel].filter(Boolean).join(" · "),
          href: professorUrl(professor.id),
          score,
        };
      })
      .filter((result) => result.score >= 0)
      .sort((a, b) => b.score - a.score || a.title.localeCompare(b.title))
      .slice(0, 12);
  }, [professors, query, reviewCounts]);

  const courseResults = useMemo<SearchResult[]>(() => {
    if (query.trim().length < minimumQueryLength) return [];

    return courses
      .map((course) => {
        const score = getMatchScore(query, course.code, [
          course.code,
          course.title,
          course.subject,
          course.department,
          course.level,
        ]);

        return {
          key: `course:${course.code}`,
          type: "Course" as const,
          title: `${course.code} — ${course.title}`,
          meta: `${course.department} · ${course.level}`,
          href: courseUrl(course.code),
          score,
        };
      })
      .filter((result) => result.score >= 0)
      .sort((a, b) => b.score - a.score || a.title.localeCompare(b.title))
      .slice(0, 12);
  }, [courses, query]);

  const materialResults = useMemo<SearchResult[]>(() => {
    return materials.map((material, index) => ({
      key: `material:${material.courseCode || "course"}:${material.title || index}`,
      type: "Material",
      title: material.title || "Course material",
      meta: [
        material.courseCode,
        material.materialType,
        material.professor,
        material.semester,
      ]
        .filter(Boolean)
        .join(" · "),
      href: courseUrl(material.courseCode || "", "#course-materials-access"),
      score: Number(material.score || 0),
    }));
  }, [materials]);

  const allResults = useMemo(
    () => [...professorResults, ...courseResults, ...materialResults],
    [professorResults, courseResults, materialResults],
  );

  useEffect(() => {
    if (query.trim().length < minimumQueryLength) {
      setMaterials([]);
      setMaterialLoading(false);
      setMaterialsLocked(false);
      setOpen(false);
      setActiveIndex(-1);
      return;
    }

    if (allowPanelOpen) setOpen(true);
    setMaterialLoading(true);
    setMaterialsLocked(false);
    setMaterials([]);
    setActiveIndex(-1);

    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      try {
        const response = await fetch(
          `/api/search-materials?q=${encodeURIComponent(query.trim())}`,
          {
            cache: "no-store",
            credentials: "same-origin",
            headers: { Accept: "application/json" },
            signal: controller.signal,
          },
        );
        const data = await response.json().catch(() => ({}));

        if (!controller.signal.aborted) {
          setMaterials(response.ok && Array.isArray(data.materials) ? data.materials : []);
          setMaterialsLocked(Boolean(data.materialsLocked));
          setMaterialLoading(false);
        }
      } catch {
        if (!controller.signal.aborted) {
          setMaterials([]);
          setMaterialsLocked(false);
          setMaterialLoading(false);
        }
      }
    }, 650);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [query, allowPanelOpen]);

  useEffect(() => {
    const missing = professorResults
      .map((result) => result.professorId)
      .filter((id): id is string => Boolean(id) && reviewCounts[id!] === undefined);

    if (!missing.length) return;

    let cancelled = false;

    missing.forEach(async (professorId) => {
      try {
        const response = await fetch(
          `/api/professor-reviews?professorId=${encodeURIComponent(professorId)}&countOnly=true`,
          {
            credentials: "same-origin",
            cache: "no-store",
            headers: { Accept: "application/json" },
          },
        );
        const data = await response.json().catch(() => ({}));
        const count = response.ok ? Number(data.reviewCount || 0) : null;

        if (!cancelled) {
          setReviewCounts((current) => ({
            ...current,
            [professorId]: Number.isInteger(count) ? count : null,
          }));
        }
      } catch {
        if (!cancelled) {
          setReviewCounts((current) => ({ ...current, [professorId]: null }));
        }
      }
    });

    return () => {
      cancelled = true;
    };
  }, [professorResults, reviewCounts]);

  useEffect(() => {
    function onDocumentClick(event: MouseEvent) {
      if (formRef.current && !formRef.current.contains(event.target as Node)) {
        setOpen(false);
        setAllowPanelOpen(false);
        setActiveIndex(-1);
      }
    }

    document.addEventListener("mousedown", onDocumentClick);
    return () => document.removeEventListener("mousedown", onDocumentClick);
  }, []);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setAllowPanelOpen(true);

    if (query.trim().length < minimumQueryLength) return;

    if (activeIndex >= 0 && allResults[activeIndex]) {
      window.location.href = allResults[activeIndex].href;
      return;
    }

    setOpen(true);
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (!open || !allResults.length) {
      if (event.key === "Escape") {
        setOpen(false);
        setAllowPanelOpen(false);
      }
      return;
    }

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((current) => (current + 1 + allResults.length) % allResults.length);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((current) =>
        current <= 0 ? allResults.length - 1 : current - 1,
      );
    } else if (event.key === "Enter" && activeIndex >= 0) {
      event.preventDefault();
      window.location.href = allResults[activeIndex].href;
    } else if (event.key === "Escape") {
      event.preventDefault();
      setOpen(false);
      setAllowPanelOpen(false);
      setActiveIndex(-1);
    }
  }

  function statusText() {
    if (!allResults.length && materialLoading) return "Searching course materials...";
    if (!allResults.length && materialsLocked) {
      return "No professor or course matches. Log in with your verified AUC email to search course materials.";
    }
    if (!allResults.length) {
      return "No matches found. Try a professor name, course code, course title, or material title.";
    }
    if (materialLoading) return "Searching course materials...";
    if (materialsLocked) {
      return "Log in with your verified AUC email to include course materials.";
    }
    return "";
  }

  let flatIndex = -1;

  function renderSection(label: string, results: SearchResult[]) {
    if (!results.length) return null;

    return (
      <section className="atlas-search-result-section" key={label}>
        <h2>
          {label}
          <span>{results.length}</span>
        </h2>
        {results.map((result) => {
          flatIndex += 1;
          const index = flatIndex;
          return (
            <a
              className={`atlas-search-result${activeIndex === index ? " is-active" : ""}`}
              href={result.href}
              key={result.key}
              onMouseEnter={() => setActiveIndex(index)}
            >
              <span className="atlas-search-result-type">{result.type}</span>
              <span className="atlas-search-result-copy">
                <strong>{result.title}</strong>
                <small>{result.meta}</small>
              </span>
            </a>
          );
        })}
      </section>
    );
  }

  const status = query.trim().length >= minimumQueryLength ? statusText() : "";

  return (
    <form
      className={`atlas-search${materialLoading ? " is-searching" : ""}`}
      role="search"
      autoComplete="off"
      noValidate
      ref={formRef}
      onSubmit={handleSubmit}
    >
      <input
        name="q"
        type="search"
        value={query}
        placeholder="Search a professor, course, or material"
        aria-label="Search AUC Atlas"
        aria-controls="atlas-search-results"
        aria-expanded={open}
        aria-autocomplete="list"
        autoComplete="off"
        spellCheck={false}
        onChange={(event) => {
          setQuery(event.target.value);
          setAllowPanelOpen(true);
        }}
        onFocus={() => {
          setAllowPanelOpen(true);
          if (query.trim().length >= minimumQueryLength) setOpen(true);
        }}
        onKeyDown={handleKeyDown}
      />
      <button type="submit">Search</button>

      <div
        className="atlas-search-results"
        id="atlas-search-results"
        aria-label="Search results"
        hidden={!open || query.trim().length < minimumQueryLength}
      >
        <div>
          {renderSection("Professors", professorResults)}
          {renderSection("Courses", courseResults)}
          {renderSection("Course materials", materialResults)}
        </div>
        {status ? (
          <p
            className={`atlas-search-status${materialLoading ? " is-loading" : ""}`}
            aria-live="polite"
          >
            {status}
          </p>
        ) : null}
      </div>
    </form>
  );
}
