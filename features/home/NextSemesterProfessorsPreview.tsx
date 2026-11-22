"use client";

import { useEffect, useState } from "react";

type RatedProfessor = {
  professorId: string;
  professorName: string;
  courseCode: string;
  image: string;
  averageRating: number;
  reviewCount: number;
};
type RecommendationResponse = {
  status: "loading" | "ready" | "sign-in" | "select-major"
    | "unsupported-major" | "plan-pending" | "invalid-id" | "error";
  term?: string;
  semester?: number;
  predictedCourses?: string[];
  consider: RatedProfessor[];
  avoid: RatedProfessor[];
};
const initial: RecommendationResponse = {
  status: "loading", consider: [], avoid: []
};

function PersonPlaceholder() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"
      strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="8" r="3.5" />
      <path d="M5 20c0-4 3.1-6 7-6s7 2 7 6" />
    </svg>
  );
}

function ProfessorAvatar({ professor }: { professor: RatedProfessor }) {
  const [failed, setFailed] = useState(false);
  return (
    <span className="homepagenew-professor-avatar" aria-hidden="true">
      {professor.image && professor.image !== "/user.png" && !failed
        ? <img src={professor.image} alt="" loading="lazy"
            referrerPolicy="no-referrer" onError={() => setFailed(true)} />
        : <PersonPlaceholder />}
    </span>
  );
}

function Rating({ professor }: { professor: RatedProfessor }) {
  return (
    <span className="homepagenew-professor-rating">
      <span className="homepagenew-professor-rating-score">
        <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path d="m12 2.5 2.9 5.88 6.5.95-4.7 4.57 1.11 6.48L12 17.32l-5.81 3.06 1.11-6.48-4.7-4.57 6.5-.95L12 2.5Z" />
        </svg>
        <strong>{professor.averageRating.toFixed(1)}</strong>
      </span>
      <span>{professor.reviewCount} course reviews</span>
    </span>
  );
}

function ProfessorGroup({ label, tone, professors, loading }: {
  label: string;
  tone: "consider" | "avoid";
  professors: RatedProfessor[];
  loading: boolean;
}) {
  return (
    <div className="homepagenew-professor-panel">
      <h3 className="homepagenew-professor-panel-title">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"
          strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          {tone === "consider" ? (
            <>
              <path d="M7 10v10H4a2 2 0 0 1-2-2v-6a2 2 0 0 1 2-2h3Z" />
              <path d="m7 10 4.7-7.2a2 2 0 0 1 3.5 1.7L14.5 8H20a2 2 0 0 1 1.96 2.4l-1.6 8A2 2 0 0 1 18.4 20H7" />
            </>
          ) : (
            <>
              <path d="M7 14V4H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h3Z" />
              <path d="m7 14 4.7 7.2a2 2 0 0 0 3.5-1.7l-.7-3.5H20a2 2 0 0 0 1.96-2.4l-1.6-8A2 2 0 0 0 18.4 4H7" />
            </>
          )}
        </svg>
        {label}
      </h3>
      <div className="homepagenew-professor-list">
        {loading ? (
          <div className="homepagenew-professor-item homepagenew-professor-loading"
            aria-hidden="true">
            <span className="homepagenew-professor-avatar" />
            <span className="homepagenew-professor-identity">
              <span className="homepagenew-professor-loading-name" />
              <span className="homepagenew-professor-loading-course" />
            </span>
          </div>
        ) : professors.length ? professors.map(professor => (
          <a className="homepagenew-professor-item"
            href={"/professors/" + encodeURIComponent(professor.professorId)}
            key={professor.professorId + ":" + professor.courseCode}
            aria-label={professor.professorName + ", " + professor.courseCode +
              ", " + professor.averageRating.toFixed(1) + " out of 5 from " +
              professor.reviewCount + " course reviews"}>
            <ProfessorAvatar professor={professor} />
            <span className="homepagenew-professor-identity">
              <strong>{professor.professorName}</strong>
              <span>{professor.courseCode}</span>
            </span>
            <Rating professor={professor} />
          </a>
        )) : (
          <p className="homepagenew-professor-group-empty">
            {tone === "consider"
              ? "No highly rated professors with enough reviews for these courses yet."
              : "No low-rated professors with enough reviews for these courses yet."}
          </p>
        )}
      </div>
    </div>
  );
}

export default function NextSemesterProfessorsPreview({
  viewingSemester = null
}: { viewingSemester?: number | null }) {
  const [result, setResult] = useState<RecommendationResponse>(initial);

  useEffect(() => {
    const controller = new AbortController();
    setResult(initial);
    const url = "/api/homepage-professor-recommendations" +
      (viewingSemester === null ? "" : "?semester=" + (viewingSemester + 1));
    void fetch(url, {
      credentials: "same-origin",
      cache: "no-store",
      headers: { Accept: "application/json" },
      signal: controller.signal
    }).then(async response => {
      if (!response.ok) throw Error("Could not load next-semester professors");
      return response.json() as Promise<RecommendationResponse>;
    }).then(data => {
      if (!controller.signal.aborted) setResult(data);
    }).catch(() => {
      if (!controller.signal.aborted) {
        setResult({ status: "error", consider: [], avoid: [] });
      }
    });
    return () => controller.abort();
  }, [viewingSemester]);

  const ready = result.status === "ready";
  const notice = {
    "sign-in": { label: "Sign in to see next-semester professors", href: "/login" },
    "select-major": { label: "Choose your major in Account", href: "/accounts" },
    "unsupported-major": { label: "Suggestions for your major are coming soon", href: "/professors" },
    "plan-pending": {
      label: "Semester " + (result.semester ?? "") +
        " course plan has not been added yet. Professor suggestions will appear once its courses are available.",
      href: ""
    },
    "invalid-id": { label: "Check your AUC ID in Account", href: "/accounts" },
    "error": { label: "Could not load next-semester professors", href: "/professors" }
  }[result.status as "sign-in" | "select-major" | "unsupported-major" | "plan-pending" | "invalid-id" | "error"];

  return (
    <section className="homepagenew-professors"
      aria-labelledby="homepagenew-professors-title" aria-busy={result.status === "loading"}>
      <div className="homepagenew-professors-heading">
        <h2 id="homepagenew-professors-title">Professors for Next Semester</h2>
        {(ready || result.status === "plan-pending") && <span>{result.term}</span>}
      </div>
      {ready && !(result.predictedCourses?.length) ? (
        <div className="homepagenew-professor-notice">
          <span>No courses have been listed for this semester yet.</span>
        </div>
      ) : ready && result.consider.length === 0 && result.avoid.length === 0 ? (
        <div className="homepagenew-professor-notice">
          <span>Not enough course-specific student reviews to recommend professors yet.</span>
          <a href="/professors">Browse professors</a>
        </div>
      ) : ready || result.status === "loading" ? (
        <div className="homepagenew-professor-grid">
          <ProfessorGroup label="Professors to Consider" tone="consider"
            professors={result.consider} loading={!ready} />
          <ProfessorGroup label="Professors to Avoid" tone="avoid"
            professors={result.avoid} loading={!ready} />
        </div>
      ) : notice ? (
        <div className="homepagenew-professor-notice">
          {notice.href ? <a href={notice.href}>{notice.label}</a> : <span>{notice.label}</span>}
        </div>
      ) : null}
    </section>
  );
}
