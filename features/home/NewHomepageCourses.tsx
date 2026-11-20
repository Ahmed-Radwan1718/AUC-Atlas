"use client";

import { useEffect, useState } from "react";

type SuggestedCourse = {
  code: string; title: string; semester: number; credits: number;
  kind: "major" | "core";
};
type SuggestionsResponse = {
  status: "loading" | "ready" | "sign-in" | "select-major" | "unsupported-major" | "invalid-id" | "error";
  term?: string;
  upcoming?: boolean;
  usedSavedProgress?: boolean;
  totalCredits?: number;
  courses: SuggestedCourse[];
  requirements?: { id: string; label: string; timing: string }[];
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

export default function NewHomepageCourses() {
  const [result, setResult] = useState<SuggestionsResponse>(empty);

  useEffect(() => {
    const controller = new AbortController();
    void fetch("/api/homepage-course-recommendations", {
      credentials: "same-origin",
      cache: "no-store",
      headers: { Accept: "application/json" },
      signal: controller.signal
    }).then(async response => {
      if (!response.ok) throw Error("Could not load courses");
      return response.json() as Promise<SuggestionsResponse>;
    }).then(data => {
      if (!controller.signal.aborted) setResult(data);
    }).catch(() => {
      if (!controller.signal.aborted) setResult({ status: "error", courses: [] });
    });
    return () => controller.abort();
  }, []);

  const ready = result.status === "ready";
  const message = {
    "sign-in": { label: "Sign in to see your courses", href: "/login" },
    "select-major": { label: "Choose your major in Account", href: "/accounts" },
    "unsupported-major": { label: "Course suggestions for your major are coming soon", href: "/courses" },
    "invalid-id": { label: "Check your AUC ID in Account", href: "/accounts" },
    error: { label: "Could not load your courses", href: "/courses" }
  }[result.status as "sign-in" | "select-major" | "unsupported-major" | "invalid-id" | "error"];

  return (
    <section className="homepagenew-courses" aria-labelledby="homepagenew-courses-title"
      aria-busy={result.status === "loading"}>
      <div className="homepagenew-courses-heading">
        <h1 id="homepagenew-courses-title">{ready && result.upcoming ? "Next Semester" : "Your Courses"}</h1>
        {ready && <span className="homepagenew-courses-preview">
          {result.term} · {result.totalCredits ?? 0} cr.
        </span>}
      </div>

      {ready && result.courses.length > 0 ? (
        <div className="homepagenew-courses-grid">
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
        </div>
      ) : result.status === "loading" ? (
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
          <span>No eligible courses found from your saved progress.</span>
          <a href="/degree-progression">Degree Progression</a>
        </div>
      ) : message ? (
        <div className="homepagenew-course-empty">
          <a href={message.href}>{message.label}</a>
        </div>
      ) : null}

      {ready && Boolean(result.requirements?.length) && (
        <div className="homepagenew-core-categories" aria-labelledby="homepagenew-core-categories-title">
          <div className="homepagenew-core-categories-heading">
            <h2 id="homepagenew-core-categories-title">Other Requirements</h2>
            <p>Choose a course that fulfills each category. These are planning reminders, not enrolled courses.</p>
          </div>
          <div className="homepagenew-core-categories-grid">
            {result.requirements!.map(requirement => (
              <div className="homepagenew-core-category" key={requirement.id}>
                <span className="homepagenew-core-category-name">{requirement.label}</span>
                <span className="homepagenew-core-category-timing">{requirement.timing}</span>
              </div>
            ))}
          </div>
          <p className="homepagenew-core-categories-note">
            Category electives are not included in the credit total above.
          </p>
        </div>
      )}
    </section>
  );
}
