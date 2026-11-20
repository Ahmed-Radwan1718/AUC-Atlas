"use client";

import { useEffect, useState } from "react";

type RecentMaterial = {
  id: string;
  title: string;
  courseCode: string;
  materialType: string;
  createdAt: string;
  href: string;
};
type MaterialResponse = {
  status: "loading" | "ready" | "sign-in" | "select-major"
    | "unsupported-major" | "invalid-id" | "error";
  term?: string;
  materials: RecentMaterial[];
};

const initial: MaterialResponse = { status: "loading", materials: [] };

function uploadedWhen(value: string): string {
  const ms = new Date(value).getTime();
  if (!Number.isFinite(ms)) return "";
  const days = Math.max(0, Math.floor((Date.now() - ms) / 86_400_000));
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 7) return days + " days ago";
  if (days < 14) return "1 week ago";
  if (days < 35) return Math.floor(days / 7) + " weeks ago";
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric",
    year: "numeric" }).format(new Date(ms));
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
    <div className="homepagenew-material-list" aria-hidden="true">
      {Array.from({ length: 4 }, (_, index) => (
        <div className="homepagenew-material-row homepagenew-material-row-loading" key={index}>
          <span className="homepagenew-material-icon" />
          <span className="homepagenew-material-details">
            <span className="homepagenew-material-loading-title" />
            <span className="homepagenew-material-loading-meta" />
          </span>
        </div>
      ))}
    </div>
  );
}

export default function NewHomepageMaterials() {
  const [result, setResult] = useState<MaterialResponse>(initial);

  useEffect(() => {
    const controller = new AbortController();
    void fetch("/api/homepage-personalized-materials", {
      credentials: "same-origin", cache: "no-store",
      headers: { Accept: "application/json" },
      signal: controller.signal
    }).then(async response => {
      if (!response.ok) throw Error("Could not load materials");
      return response.json() as Promise<MaterialResponse>;
    }).then(data => {
      if (!controller.signal.aborted) setResult(data);
    }).catch(() => {
      if (!controller.signal.aborted) {
        setResult({ status: "error", materials: [] });
      }
    });
    return () => controller.abort();
  }, []);

  const ready = result.status === "ready";
  const notice = {
    "sign-in": { label: "Sign in to see new materials for your courses", href: "/login" },
    "select-major": { label: "Choose your major in Account", href: "/accounts" },
    "unsupported-major": { label: "Materials for your major are coming soon", href: "/courses" },
    "invalid-id": { label: "Check your AUC ID in Account", href: "/accounts" },
    "error": { label: "Could not load materials for your courses", href: "/courses" }
  }[result.status as "sign-in" | "select-major" | "unsupported-major" | "invalid-id" | "error"];

  return (
    <section className="homepagenew-materials" aria-labelledby="homepagenew-materials-title"
      aria-busy={result.status === "loading"}>
      <div className="homepagenew-materials-heading">
        <h2 id="homepagenew-materials-title">New Materials for You</h2>
        <a href="/courses">View all</a>
      </div>
      {result.status === "loading" ? (
        <MaterialSkeleton />
      ) : ready && result.materials.length ? (
        <div className="homepagenew-material-list">
          {result.materials.map(material => (
            <a className="homepagenew-material-row" href={material.href}
              key={material.id} target="_blank" rel="noopener noreferrer"
              aria-label={"Open " + material.title + ", " + material.courseCode}>
              <MaterialIcon category={material.materialType} />
              <span className="homepagenew-material-details">
                <strong>{material.title}</strong>
                <span>{material.courseCode} · {material.materialType}</span>
              </span>
              <span className="homepagenew-material-trailing">
                <span>{uploadedWhen(material.createdAt)}</span>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"
                  strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M7 17 17 7M8 7h9v9" />
                </svg>
              </span>
            </a>
          ))}
        </div>
      ) : ready ? (
        <div className="homepagenew-material-empty">
          <span>No materials have been uploaded for your suggested courses yet.</span>
          <a href="/courses">Explore courses</a>
        </div>
      ) : notice ? (
        <div className="homepagenew-material-empty">
          <a href={notice.href}>{notice.label}</a>
        </div>
      ) : null}
    </section>
  );
}
