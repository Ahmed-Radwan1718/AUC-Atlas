"use client";

import { useEffect, useState } from "react";

type RecentMaterial = {
  id: string;
  title: string;
  materialType: string;
  createdAt: string;
  href: string;
};
type CurrentCourse = {
  code: string;
  title: string;
  materials: RecentMaterial[];
};
type MaterialResponse = {
  status: "loading" | "ready" | "sign-in" | "verify-email" | "select-major"
    | "unsupported-major" | "plan-pending" | "error";
  term?: string;
  semester?: number;
  upcoming?: boolean;
  currentSemester?: number;
  preview?: boolean;
  fallback?: boolean;
  courses: CurrentCourse[];
};

const initial: MaterialResponse = { status: "loading", courses: [] };
const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

function timestamp(value: string): number {
  const time = new Date(value).getTime();
  return Number.isFinite(time) ? time : 0;
}

function uploadedWhen(value: string): string {
  const ms = timestamp(value);
  if (!ms) return "Date unavailable";
  const days = Math.max(0, Math.floor((Date.now() - ms) / 86_400_000));
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 7) return days + " days ago";
  if (days < 14) return "1 week ago";
  if (days < 35) return Math.floor(days / 7) + " weeks ago";
  return new Intl.DateTimeFormat("en-US", {
    month: "short", day: "numeric", year: "numeric"
  }).format(new Date(ms));
}

function latestUpload(course: CurrentCourse): number {
  return course.materials.reduce(
    (latest, material) => Math.max(latest, timestamp(material.createdAt)), 0
  );
}

function recentlyUpdated(course: CurrentCourse, now: number): boolean {
  const latest = latestUpload(course);
  return latest > 0 && latest <= now && latest >= now - WEEK_MS;
}

function courseHref(code: string): string {
  return "/courses/" + code.toLowerCase().trim()
    .replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

function MaterialIcon({ category }: { category: string }) {
  const kind = category.toLowerCase();
  return (
    <span className="homepagenew-material-icon" aria-hidden="true">
      {kind.includes("exam") || kind.includes("assignment") || kind.includes("practice")
        ? <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
            strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
            <path d="M8 3h8l4 4v13a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h3Z" />
            <path d="M15 3v5h5M8 13h8M8 17h5" />
          </svg>
        : kind.includes("note") || kind.includes("slide") || kind.includes("syllabus")
        ? <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
            strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 5.5c2.5-1.8 5.6-1.8 9 0v15c-3.4-1.8-6.5-1.8-9 0v-15Z" />
            <path d="M21 5.5c-2.5-1.8-5.6-1.8-9 0v15c3.4-1.8 6.5-1.8 9 0v-15Z" />
          </svg>
        : <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
            strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
            <path d="M6 2h8l5 5v14H6a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2Z" />
            <path d="M14 2v6h5M8 12h7M8 16h7" />
          </svg>}
    </span>
  );
}

function MaterialSkeleton() {
  return (
    <div className="homepagenew-material-course-list" aria-hidden="true">
      {Array.from({ length: 4 }, (_, index) => (
        <div className="homepagenew-material-course-loading" key={index}>
          <span className="homepagenew-material-loading-title" />
          <span className="homepagenew-material-loading-meta" />
        </div>
      ))}
    </div>
  );
}

export default function NewHomepageMaterials({
  viewingSemester = null
}: { viewingSemester?: number | null }) {
  const [result, setResult] = useState<MaterialResponse>(initial);
  // Start with every course collapsed; expand only when a student clicks it.
  const [openedCourse, setOpenedCourse] = useState<string>("");

  useEffect(() => {
    const controller = new AbortController();
    setResult(initial);
    setOpenedCourse("");
    const url = "/api/homepage-personalized-materials" +
      (viewingSemester === null ? "" : "?semester=" + viewingSemester);
    void fetch(url, {
      credentials: "same-origin", cache: "no-store",
      headers: { Accept: "application/json" },
      signal: controller.signal
    }).then(async response => {
      if (!response.ok) throw Error("Could not load course materials");
      return response.json() as Promise<MaterialResponse>;
    }).then(data => {
      if (!controller.signal.aborted) setResult(data);
    }).catch(() => {
      if (!controller.signal.aborted) {
        setResult({ status: "error", courses: [] });
      }
    });
    return () => controller.abort();
  }, [viewingSemester]);

  const ready = result.status === "ready";
  const now = Date.now();
  // Updated courses first; otherwise preserve the fixed semester course order.
  const ordered = result.courses.filter(course => course.materials.length > 0).sort((a, b) => {
    const updateDifference = Number(recentlyUpdated(b, now)) -
      Number(recentlyUpdated(a, now));
    return updateDifference || latestUpload(b) - latestUpload(a);
  });
  const notice = {
    "sign-in": { label: "Sign in to see materials for your courses", href: "/login" },
    "verify-email": { label: "Verify your AUC email to access course materials", href: "/accounts" },
    "select-major": { label: "Choose your major and enrollment term in Account", href: "/accounts" },
    "unsupported-major": { label: "Materials for your major are coming soon", href: "/courses" },
    "plan-pending": { label: "The course plan for this semester is not available yet. Select Semester 1 or 2 to browse materials.", href: "" },
    "error": { label: "Could not load materials for your courses", href: "/courses" }
  }[result.status as "sign-in" | "verify-email" | "select-major"
    | "unsupported-major" | "plan-pending" | "error"];

  return (
    <section className="homepagenew-materials" aria-labelledby="homepagenew-materials-title"
      aria-busy={result.status === "loading"}>
      <div className="homepagenew-materials-heading">
        <h2 id="homepagenew-materials-title">Your Course Materials</h2>
        <a href="/courses">View all</a>
      </div>
      {result.status === "loading" ? (
        <MaterialSkeleton />
      ) : ready && ordered.length ? (
        <div className="homepagenew-material-course-list">
          {ordered.map(course => {
            const open = course.code === openedCourse;
            const updated = recentlyUpdated(course, now);
            const panelId = "homepagenew-materials-" + course.code.toLowerCase().replace(/\s+/g, "-");
            return (
              <div className="homepagenew-material-course" key={course.code}>
                <button className="homepagenew-material-course-trigger" type="button"
                  aria-expanded={open} aria-controls={panelId}
                  onClick={() => setOpenedCourse(open ? "" : course.code)}>
                  <span className="homepagenew-material-course-icon" aria-hidden="true">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
                      strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M3 5.5c2.5-1.8 5.6-1.8 9 0v15c-3.4-1.8-6.5-1.8-9 0v-15Z" />
                      <path d="M21 5.5c-2.5-1.8-5.6-1.8-9 0v15c3.4-1.8 6.5-1.8 9 0v-15Z" />
                    </svg>
                  </span>
                  <span className="homepagenew-material-course-identity">
                    <strong>{course.title}</strong>
                    <span aria-hidden="true">·</span>
                    <span className="homepagenew-material-course-code">{course.code}</span>
                  </span>
                  <span className="homepagenew-material-course-trailing">
                    {updated && (
                      <span className="homepagenew-material-new">New uploads</span>
                    )}
                    <svg className={open ? "is-open" : ""} viewBox="0 0 24 24"
                      fill="none" stroke="currentColor" strokeWidth="1.7"
                      strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="m6 9 6 6 6-6" />
                    </svg>
                  </span>
                </button>
                <div id={panelId} className="homepagenew-material-course-panel" hidden={!open}>
                  <div className="homepagenew-material-course-items">
                      {course.materials.map(material => (
                        <a className="homepagenew-material-row" href={material.href}
                          key={material.id} target="_blank" rel="noopener noreferrer"
                          aria-label={"Open " + material.title + " for " + course.code}>
                          <MaterialIcon category={material.materialType} />
                          <span className="homepagenew-material-details">
                            <strong>{material.title}</strong>
                            <span>{material.materialType}</span>
                          </span>
                          <span className="homepagenew-material-trailing">
                            <span>{uploadedWhen(material.createdAt)}</span>
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
                              strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"
                              aria-hidden="true"><path d="M7 17 17 7M8 7h9v9" /></svg>
                          </span>
                        </a>
                      ))}
                    </div>
                  <a className="homepagenew-material-course-link" href={courseHref(course.code)}>
                    Browse all {course.code} materials
                    <span aria-hidden="true">→</span>
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      ) : ready ? (
        <div className="homepagenew-material-empty">
          <span>No materials have been uploaded for this semester's courses yet.</span>
        </div>
      ) : notice ? (
        <div className="homepagenew-material-empty">
          {notice.href ? <a href={notice.href}>{notice.label}</a> : <span>{notice.label}</span>}
        </div>
      ) : null}
    </section>
  );
}
