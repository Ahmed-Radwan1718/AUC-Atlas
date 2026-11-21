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
  "ENGR 1005": "https://res.cloudinary.com/dhtamisqn/image/upload/v1795296570/5fe0ffe7-5dc6-48ef-9170-b4bdd9e55c73.png",
  "RHET 1010": "https://res.cloudinary.com/dhtamisqn/image/upload/v1795296035/f24ae05e-04ea-486b-aa6c-0fc70cac4d15.png",
  "CORE 1010": "https://res.cloudinary.com/dhtamisqn/image/upload/v1795296122/dad9afa5-55a0-48e3-a151-7b988e1971a2.png",
  "SCI 1020": "https://res.cloudinary.com/dhtamisqn/image/upload/v1795296249/85863696-d96d-4a42-b645-2fbcb7aeb362.png",
  "ENGR 3212": "https://res.cloudinary.com/dhtamisqn/image/upload/v1795175235/f46b454e-e868-4f34-ab07-f66805e29603.png",
  "MENG 3207": "https://res.cloudinary.com/dhtamisqn/image/upload/v1795174953/40375512-ed63-4a35-86d1-9eafdf48169c.png",
  "MENG 3217": "https://res.cloudinary.com/dhtamisqn/image/upload/v1795174452/f259a808-6214-41f0-a7ca-e35fc35633d8.png",
};

type CourseCardEntry =
  | { type: "course"; course: SuggestedCourse }
  | { type: "elective"; requirement: NonNullable<SuggestionsResponse["requirements"]>[number] };

/** Include elective choices in the same grid, before zero-credit courses. */
function courseCardEntries(result: SuggestionsResponse): CourseCardEntry[] {
  const courses: CourseCardEntry[] = result.courses.map(course => ({ type: "course", course }));
  const electives: CourseCardEntry[] = (result.requirements ?? [])
    .map(requirement => ({ type: "elective", requirement }));
  const zeroCreditIndex = result.courses.findIndex(course => course.credits === 0);
  const insertAt = zeroCreditIndex < 0 ? courses.length : zeroCreditIndex;
  return [...courses.slice(0, insertAt), ...electives, ...courses.slice(insertAt)];
}

function courseHref(code: string) {
  return "/courses/" + code.toLowerCase().trim()
    .replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

const empty: SuggestionsResponse = { status: "loading", courses: [] };

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
        <div className="homepagenew-courses-controls">
          {ready && <span className="homepagenew-courses-preview">
            {result.totalCredits ?? 0} credits
          </span>}
          {canBrowse && shownSemester && (
            <nav className="homepagenew-semester-selector" aria-label="Browse course semesters">
              <button type="button" className="homepagenew-semester-arrow"
                aria-label="Previous semester" disabled={shownSemester <= 1}
                onClick={() => setSelectedSemester(Math.max(1, shownSemester - 1))}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
                  strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"
                  aria-hidden="true">
                  <path d="m15 18-6-6 6-6" />
                </svg>
              </button>
              <span className="homepagenew-semester-current" aria-live="polite">
                Semester {shownSemester}
              </span>
              <button type="button" className="homepagenew-semester-arrow"
                aria-label="Next semester" disabled={shownSemester >= 8}
                onClick={() => setSelectedSemester(Math.min(8, shownSemester + 1))}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
                  strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"
                  aria-hidden="true">
                  <path d="m9 18 6-6-6-6" />
                </svg>
              </button>
            </nav>
          )}
        </div>
      </div>

      {ready && (result.courses.length > 0 || Boolean(result.requirements?.length)) ? (
        <div className="homepagenew-course-recommendations">
          <div className="homepagenew-courses-grid">
            {courseCardEntries(result).map(item => item.type === "course" ? (
              <a className="homepagenew-course-card" href={courseHref(item.course.code)}
                key={item.course.code}>
                <div className="homepagenew-course-cover" aria-hidden="true">
                  {courseImages[item.course.code] && (
                    <img src={courseImages[item.course.code]} alt="" loading="lazy" />
                  )}
                </div>
                <div className="homepagenew-course-info">
                  <div className="homepagenew-course-code-row">
                    <span className="homepagenew-course-code">{item.course.code}</span>
                    <span className="homepagenew-course-credit">{item.course.credits} cr.</span>
                  </div>
                  <span className="homepagenew-course-name">{item.course.title}</span>
                </div>
              </a>
            ) : (
              <div className="homepagenew-course-card homepagenew-course-elective"
                key={"elective-" + item.requirement.id}>
                <div className="homepagenew-course-cover" aria-hidden="true" />
                <div className="homepagenew-course-info">
                  <div className="homepagenew-course-code-row">
                    <span className="homepagenew-course-code">CORE ELECTIVE</span>
                    <span className="homepagenew-course-credit">{item.requirement.credits} cr.</span>
                  </div>
                  <span className="homepagenew-course-name">{item.requirement.label}</span>
                </div>
              </div>
            ))}
          </div>
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
