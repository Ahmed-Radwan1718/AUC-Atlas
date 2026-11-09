"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { courses } from "../../data/courses";
import { professors } from "../../data/professors";

type SearchResult = {
  type: "Professor" | "Course" | "Material";
  title: string;
  meta: string;
  href: string;
  score: number;
  professorId?: string;
  department?: string;
};
type Material = {
  title?: string; courseCode?: string; materialType?: string;
  professor?: string; semester?: string; score?: number;
};
type MaterialState = { loading: boolean; locked: boolean; materials: Material[] };

const reviewCache = new Map<string, { count: number; fetchedAt: number }>();
const reviewRequests = new Map<string, Promise<number | null>>();
const reviewCacheLifetime = 15 * 60 * 1000;

function normalize(value: unknown): string {
  return String(value || "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}
function slug(value: string): string {
  return value.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}
function professorHref(id: string): string {
  return id ? "/professors/" + encodeURIComponent(slug(id)) : "/professors";
}
function courseHref(code: string, hash = ""): string {
  return code ? "/courses/" + encodeURIComponent(slug(code)) + hash : "/courses";
}
function getMatchScore(query: string, primary: string, values: unknown[]): number {
  const q = normalize(query);
  const terms = q.split(/\s+/).filter(Boolean);
  const normalizedPrimary = normalize(primary);
  const normalizedValues = values.map(normalize);
  const text = normalizedValues.join(" ");
  if (!terms.length || !terms.every(term => text.includes(term))) return -1;
  let score = normalizedPrimary === q ? 500 : normalizedPrimary.startsWith(q) ? 300 : normalizedPrimary.includes(q) ? 180 : 0;
  normalizedValues.forEach((value, index) => {
    if (value === q) score += index === 0 ? 180 : 90;
    else if (value.startsWith(q)) score += index === 0 ? 110 : 55;
    else if (value.includes(q)) score += index === 0 ? 70 : 30;
  });
  return score + Math.max(0, 50 - normalizedPrimary.length);
}
function cachedReviewCount(id: string): number | null {
  const entry = reviewCache.get(id);
  if (!entry) return null;
  if (Date.now() - entry.fetchedAt > reviewCacheLifetime) {
    reviewCache.delete(id);
    return null;
  }
  return entry.count;
}
async function getReviewCount(id: string): Promise<number | null> {
  const cached = cachedReviewCount(id);
  if (cached !== null) return cached;
  const pending = reviewRequests.get(id);
  if (pending) return pending;
  const request: Promise<number | null> = fetch(
    "/api/professor-reviews?professorId=" + encodeURIComponent(id) + "&countOnly=true",
    { credentials: "same-origin", cache: "no-store", headers: { Accept: "application/json" } }
  ).then(response => {
    if (!response.ok) throw Error("Could not load review count");
    return response.json();
  }).then(data => {
    const count = Number(data.reviewCount || 0);
    reviewCache.set(id, { count, fetchedAt: Date.now() });
    return count;
  }).catch(() => null).finally(() => reviewRequests.delete(id));
  reviewRequests.set(id, request);
  return request;
}
function SearchResultLink({
  result, index, activeIndex, onHover, onNavigate
}: {
  result: SearchResult; index: number; activeIndex: number;
  onHover: (index: number) => void; onNavigate: () => void;
}) {
  const [reviews, setReviews] = useState<number | null>(result.professorId ? cachedReviewCount(result.professorId) : null);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    if (!result.professorId) return;
    let live = true;
    void getReviewCount(result.professorId).then(count => {
      if (!live) return;
      setReviews(count);
      setFailed(count === null);
    });
    return () => { live = false; };
  }, [result.professorId]);
  const meta = result.professorId
    ? [result.department, failed ? "Reviews unavailable" : reviews === null
      ? "Loading reviews..." : reviews + " " + (reviews === 1 ? "review" : "reviews")].filter(Boolean).join(" · ")
    : result.meta;
  return (
    <a href={result.href} className={`atlas-search-result ${activeIndex === index ? "is-active" : ""}`}
      onMouseEnter={() => onHover(index)} onClick={onNavigate}>
      <span className="atlas-search-result-type">{result.type}</span>
      <span className="atlas-search-result-copy"><strong>{result.title}</strong><small>{meta}</small></span>
    </a>
  );
}

export default function HomeSearch() {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);
  const [text, setText] = useState("");
  const [searchRevision, setSearchRevision] = useState(0);
  const [open, setOpen] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [materialState, setMaterialState] = useState<MaterialState>({ loading: false, locked: false, materials: [] });
  const query = text.trim();

  const groupedResults = useMemo(() => {
    if (query.length < 2) return [[], [], []] as SearchResult[][];
    const professorResults: SearchResult[] = professors.map(professor => {
      const id = professor.id || "";
      const department = professor.displayDepartment || professor.department || "AUC";
      const score = getMatchScore(query, professor.name, [
        professor.name, professor.id, professor.department, professor.displayDepartment,
        professor.filterDepartment, professor.course
      ]);
      return { type: "Professor" as const, title: professor.name, department, professorId: id,
        meta: "", href: professorHref(id), score };
    }).filter(item => item.score >= 0)
      .sort((a,b) => b.score - a.score || a.title.localeCompare(b.title)).slice(0, 12);
    const courseResults: SearchResult[] = courses.map(course => {
      const score = getMatchScore(query, course.code, [
        course.code, course.title, course.subject, course.department, course.level
      ]);
      return { type: "Course" as const, title: course.code + " — " + course.title,
        meta: course.department + " · " + course.level, href: courseHref(course.code), score };
    }).filter(item => item.score >= 0)
      .sort((a,b) => b.score - a.score || a.title.localeCompare(b.title)).slice(0, 12);
    const materials: SearchResult[] = materialState.materials.map(material => ({
      type: "Material" as const, title: material.title || "Course material",
      meta: [material.courseCode, material.materialType, material.professor, material.semester].filter(Boolean).join(" · "),
      href: courseHref(material.courseCode || "", "#course-materials-access"),
      score: Number(material.score || 0)
    }));
    return [professorResults, courseResults, materials];
  }, [query, materialState.materials]);
  const allResults = groupedResults.flat();
  const status = !allResults.length && materialState.loading ? "Searching course materials..."
    : !allResults.length && materialState.locked ? "No professor or course matches. Log in with your verified AUC email to search course materials."
    : !allResults.length ? "No matches found. Try a professor name, course code, course title, or material title."
    : materialState.loading ? "Searching course materials..."
    : materialState.locked ? "Log in with your verified AUC email to include course materials." : "";
  const isLoading = open && materialState.loading && query.length >= 2;
  const visible = open && !dismissed && query.length >= 2;

  useEffect(() => {
    if (query.length < 2) return;
    let cancelled = false;
    const timeout = window.setTimeout(async () => {
      try {
        const response = await fetch("/api/search-materials?q=" + encodeURIComponent(query), {
          credentials: "same-origin", cache: "no-store", headers: { Accept: "application/json" }
        });
        const data = await response.json().catch(() => ({}));
        if (!cancelled) setMaterialState({
          loading: false, locked: Boolean(data.materialsLocked),
          materials: response.ok && Array.isArray(data.materials) ? data.materials : []
        });
      } catch {
        if (!cancelled) setMaterialState({ loading: false, locked: false, materials: [] });
      }
    }, 650);
    return () => { cancelled = true; window.clearTimeout(timeout); };
  }, [query, searchRevision]);

  useEffect(() => {
    function onOutsideClick(event: MouseEvent) {
      if (formRef.current && !formRef.current.contains(event.target as Node)) {
        setOpen(false); setDismissed(true); setActiveIndex(-1);
      }
    }
    document.addEventListener("click", onOutsideClick);
    return () => document.removeEventListener("click", onOutsideClick);
  }, []);

  useEffect(() => {
    if (activeIndex >= 0) {
      resultsRef.current?.querySelectorAll(".atlas-search-result")[activeIndex]?.scrollIntoView({ block: "nearest" });
    }
  }, [activeIndex]);

  function handleInput(value: string) {
    setText(value);
    setDismissed(false);
    setOpen(value.trim().length >= 2);
    setActiveIndex(-1);
    setMaterialState({ loading: value.trim().length >= 2, locked: false, materials: [] });
  }
  function submit(event: React.FormEvent) {
    event.preventDefault();
    if (query.length < 2) { inputRef.current?.focus(); return; }
    if (activeIndex >= 0 && allResults[activeIndex]) {
      router.push(allResults[activeIndex].href);
      return;
    }
    setOpen(true); setDismissed(false);
    setActiveIndex(-1);
    setMaterialState({ loading: true, locked: false, materials: [] });
    setSearchRevision(previous => previous + 1);
  }
  function onKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (!visible || !allResults.length) return;
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex(i => (i + 1 + allResults.length) % allResults.length);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex(i => (i <= 0 ? allResults.length - 1 : i - 1));
    } else if (event.key === "Enter" && activeIndex >= 0) {
      event.preventDefault();
      router.push(allResults[activeIndex].href);
    } else if (event.key === "Escape") {
      event.preventDefault();
      setOpen(false); setDismissed(true); setActiveIndex(-1);
    }
  }
  let rowIndex = -1;
  return (
    <form className={`atlas-search ${isLoading ? "is-searching" : ""}`}
      id="atlas-search-form" role="search" autoComplete="off" noValidate ref={formRef} onSubmit={submit}>
      <input id="atlas-search-input" name="q" type="search" ref={inputRef}
        placeholder="Search a professor, course, or material" aria-label="Search AUC Atlas"
        aria-controls="atlas-search-results" aria-expanded={visible}
        aria-autocomplete="list" autoComplete="off" spellCheck={false}
        value={text} onChange={event => handleInput(event.target.value)}
        onFocus={() => { setDismissed(false); if (query.length >= 2) setOpen(true); }}
        onKeyDown={onKeyDown}/>
      <button type="submit">Search</button>
      <div className="atlas-search-results" id="atlas-search-results" aria-label="Search results"
        hidden={!visible} ref={resultsRef}>
        <div id="atlas-search-results-list">
          {(["Professors", "Courses", "Course materials"] as const).map((label, sectionIndex) => {
            const items = groupedResults[sectionIndex];
            if (!items.length) return null;
            return <section className="atlas-search-result-section" key={label}>
              <h2>{label}<span>{items.length}</span></h2>
              {items.map((item) => {
                rowIndex += 1;
                return <SearchResultLink key={item.type + item.href + item.title}
                  result={item} index={rowIndex} activeIndex={activeIndex}
                  onHover={setActiveIndex} onNavigate={() => setOpen(false)}/>;
              })}
            </section>;
          })}
        </div>
        <p className={`atlas-search-status ${isLoading ? "is-loading" : ""}`}
          id="atlas-search-status" aria-live="polite" hidden={!status}>{status}</p>
      </div>
    </form>
  );
}
