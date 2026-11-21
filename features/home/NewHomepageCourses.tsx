"use client";

import { useEffect, useState } from "react";

type SuggestedCourse = {
  code: string; title: string; semester: number; credits: number;
  kind: "major" | "core";
};
type SuggestionsResponse = {
  status: "loading" | "ready" | "sign-in" | "select-major" | "unsupported-major" | "invalid-id" | "plan-pending" | "error";
  term?: string;
  semester?: number;
  upcoming?: boolean;
  usedSavedProgress?: boolean;
  totalCredits?: number;
  courses: SuggestedCourse[];
  requirements?: { id: string; label: string; timing: string; credits: number }[];
};

// Course artwork supplied by the site owner. Other cards use neutral placeholders.
const courseImages: Record<string, string> = {
  "ENGR 3212": "https://res.cloudinary.com/dhtamisqn/image/upload/v1795175235/f46b454e-e868-4f34-ab07-f66805e29603.png",
  "MENG 3207": "https://res.cloudinary.com/dhtamisqn/image/upload/v1795174953/40375512-ed63-4a35-86d1-9eafdf48169c.png",
  "MENG 3217": "https://res.cloudinary.com/dhtamisqn/image/upload/v1795174452/f259a808-6214-41f0-a7ca-e35fc35633d8.png",
};

function courseHref(code: string) {
  return "/courses/" + code.toLowerCase().trim()
    .replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

const empty: SuggestionsResponse = { status: "loading", courses: [] };
const semesters = [1, 2, 3, 4, 5, 6, 7, 8] as const;

export default function NewHomepageCourses() {
  const [result, setResult] = useState<SuggestionsResponse>(empty);
  // null uses the student's calculated current semester on initial load.
  const [selectedSemester, setSelectedSemester] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [canBrowse, setCanBrowse] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    setIsLoading(true);
    const url = "/api/homepage-course-recommendations" +
      (selectedSemester === null ? "" : "?semester=" + selectedSemester);
    void fetch(url, {
      credentials: "same-origin",
      cache: "no-store",
      headers: { Accept: "application/json" },
      signal: controller.signal
    }).then(async response => {
      if (!response.ok) throw Error("Could not load courses");
      return response.json() as Promise<SuggestionsResponse>;
    }).then(data => {
      if (!controller.signal.aborted) {
        setResult(data);
        if (data.status === "ready" || data.status === "plan-pending") setCanBrowse(true);
      }
    }).catch(() => {
      if (!controller.signal.aborted) setResult({ status: "error", courses: [] });
    }).finally(() => {
      if (!controller.signal.aborted) setIsLoading(false);
    });
    return () => controller.abort();
  }, [selectedSemester]);

  const shownSemester = selectedSemester ?? result.semester;
  const ready = !isLoading && result.status === "ready";
  const message = {
    "sign-in": { label: "Sign in to see your courses", href: "/login" },
    "select-major": { label: "Choose your major and enrollment term in Account", href: "/accounts" },
    "unsupported-major": { label: "Course suggestions for your major are coming soon", href: "/courses" },
    "invalid-id": { label: "Check your AUC ID in Account", href: "/accounts" },
    "plan-pending": { label: "Semester " + (result.semester ?? "") + " course plan is coming soon", href: "" },
    error: { label: "Could not load your courses", href: "/courses" }
  }[result.status as "sign-in" | "select-major" | "unsupported-major" | "invalid-id" | "plan-pending" | "error"];

  return (
    <section className="homepagenew-courses" aria-labelledby="homepagenew-courses-title"
      aria-busy={isLoading}>
      <div className="homepagenew-courses-heading">
        <h1 id="homepagenew-courses-title">{ready && result.upcoming ? "Next Semester" : "Your Courses"}</h1>
        {ready && <span className="homepagenew-courses-preview">
          {result.term} · {result.totalCredits ?? 0} cr.
        </span>}
      </div>

      {canBrowse && (
        <div className="homepagenew-semester-selector" aria-label="Browse course semesters">
          <span className="homepagenew-semester-label">Semester</span>
          <div className="homepagenew-semester-options" role="group" aria-label="Choose semester">
            {semesters.map(semester => (
              <button type="button" key={semester}
                className={"homepagenew-semester-button" +
                  (shownSemester === semester ? " is-selected" : "")}
                aria-pressed={shownSemester === semester}
                onClick={() => {
                  if (shownSemester !== semester) setSelectedSemester(semester);
                }}>
                Sem {semester}
              </button>
            ))}
          </div>
        </div>
      )}

      {ready && (result.courses.length > 0 || Boolean(result.requirements?.length)) ? (
        <div className="homepagenew-course-recommendations">
          {result.courses.length > 0 && <div className="homepagenew-courses-grid">
          {result.courses.map(course => (
            <a className="homepagenew-course-card" href={courseHref(course.code)} key={course.code}>
              <div className="homepagenew-course-cover" aria-hidden="true">
                {courseImages[course.code] && (
                  <img src={courseImages[course.code]} alt="" loading="lazy" />
                )}
              </div>
              <div className="homepagenew-course-info">
                <div className="homepagenew-course-code-row">
                  <span className="homepagenew-course-code">{course.code}</span>
                  <span className="homepagenew-course-credit">{course.credits} cr.</span>
                </div>
                <span className="homepagenew-course-name">{course.title}</span>

              </div>
            </a>
          ))}
          </div>}
          {Boolean(result.requirements?.length) && (
            <div className="homepagenew-core-requirements">
              <span className="homepagenew-core-requirements-title">Core curriculum choices</span>
              <div className="homepagenew-core-requirements-list">
                {result.requirements?.map(requirement => (
                  <div className="homepagenew-core-requirement" key={requirement.id}>
                    <span>{requirement.label}</span>
                    <span>{requirement.credits} cr.</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : isLoading ? (
        <div className="homepagenew-courses-grid" aria-hidden="true">
          {Array.from({ length: 6 }, (_, index) => (
            <div className="homepagenew-course-card homepagenew-course-loading" key={index}>
              <div className="homepagenew-course-cover" />
              <div className="homepagenew-course-info">
                <span className="homepagenew-loading-code" />
                <span className="homepagenew-loading-title" />
              </div>
            </div>
          ))}
        </div>
      ) : ready ? (
        <div className="homepagenew-course-empty">
          <span>No remaining recommended courses for this semester.</span>
          <a href="/degree-progression">Degree Progression</a>
        </div>
      ) : message ? (
        <div className="homepagenew-course-empty">
          {message.href ? <a href={message.href}>{message.label}</a> : <span>{message.label}</span>}
        </div>
      ) : null}

    </section>
  );
}
