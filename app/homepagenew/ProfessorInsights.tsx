"use client";

import { useEffect, useState } from "react";
import { courses } from "../../data/courses";
import { professors } from "../../data/professors";
import { summarizeCourseProfessors, type CourseReview, type ProfessorInsight } from "./professorInsightsSummary";

type Semester = { name: string; courses: string[] };
type Account = "loading" | "signed-in" | "guest" | "error";
type ReviewView = { status: "loading" | "locked" | "error" } |
  { status: "ready"; insights: ProfessorInsight[] };

const courseByCode = new Map(courses.map(course => [course.code, course]));
const professorById = new Map(professors.map(professor => [professor.id, professor]));

function ProfessorCard({ insight }: { insight: ProfessorInsight }) {
  const professor = professorById.get(insight.professorId);
  return (
    <article className="new-homepage-insights-card">
      <p className={"new-homepage-insights-status is-" + insight.category}>
        {insight.category === "consider" ? "Worth considering" :
          insight.category === "caution" ? "Consider carefully" :
          insight.category === "limited" ? "Limited reviews" : "Other reviewed professor"}
      </p>
      <div className="new-homepage-insights-card-head">
        <h4>{professor?.name || insight.professorName}</h4>
        <span className="new-homepage-insights-rating"><strong>{insight.averageRating.toFixed(1)}</strong><small> / 5</small></span>
      </div>
      <p className="new-homepage-insights-meta">{insight.reviewCount} course {insight.reviewCount === 1 ? "rating" : "ratings"}</p>
      {insight.themes.length > 0 && (
        <ul className="new-homepage-insights-themes">
          {insight.themes.map(theme => <li key={theme}>{theme}</li>)}
        </ul>
      )}
      {professor && <a href={"/professors/" + encodeURIComponent(professor.id)}>View reviews <span aria-hidden="true">↗</span></a>}
    </article>
  );
}

function CourseInsights({ code }: { code: string }) {
  const [view, setView] = useState<ReviewView>({ status: "loading" });
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    setView({ status: "loading" });
    async function load() {
      try {
        const response = await fetch("/api/professor-reviews?courseCode=" + encodeURIComponent(code), {
          credentials: "same-origin", cache: "no-store", signal: controller.signal,
          headers: { Accept: "application/json" }
        });
        if (controller.signal.aborted) return;
        if (response.status === 401) { setView({ status: "locked" }); return; }
        if (!response.ok) throw new Error("Unable to load course reviews.");
        const data = await response.json() as { reviews?: CourseReview[] };
        if (controller.signal.aborted) return;
        if (!Array.isArray(data.reviews)) throw new Error("Invalid review response.");
        setView({ status: "ready", insights: summarizeCourseProfessors(data.reviews, code) });
      } catch {
        if (!controller.signal.aborted) setView({ status: "error" });
      }
    }
    void load();
    return () => controller.abort();
  }, [code, retry]);

  if (view.status === "loading") return <p className="new-homepage-insights-note" role="status">Loading course reviews…</p>;
  if (view.status === "locked") return <p className="new-homepage-insights-note"><a href="/login">Sign in</a> with a verified AUC account to view reviews.</p>;
  if (view.status === "error") return <p className="new-homepage-insights-note" role="status">Couldn’t load reviews. <button type="button" onClick={() => setRetry(n => n + 1)}>Try again</button></p>;
  if (view.status !== "ready" || !view.insights.length) return <p className="new-homepage-insights-note">No professor ratings for this course yet.</p>;

  const best = view.insights.find(item => item.category === "consider");
  const caution = view.insights.find(item => item.category === "caution");
  const featured = [best, caution].filter((item): item is ProfessorInsight => Boolean(item));
  const others = view.insights.filter(item => !featured.includes(item));
  return (
    <div className="new-homepage-insights-results">
      {featured.length ? (
        <div className="new-homepage-insights-grid">
          {featured.map(insight => <ProfessorCard key={insight.professorId} insight={insight} />)}
        </div>
      ) : <p className="new-homepage-insights-note">No clear recommendation or caution based on the available ratings.</p>}
      {others.length > 0 && (
        <details className="new-homepage-insights-others" open={!featured.length}>
          <summary>{featured.length ? "See other reviewed professors" : "Reviewed professors"} ({others.length})</summary>
          <div className="new-homepage-insights-grid">
            {others.map(insight => <ProfessorCard key={insight.professorId} insight={insight} />)}
          </div>
        </details>
      )}
    </div>
  );
}

export default function ProfessorInsights({ semesters, current, account }: {
  semesters: readonly Semester[]; current: string; account: Account;
}) {
  const [semesterName, setSemesterName] = useState(current);
  const [expanded, setExpanded] = useState<{ semester: string; code: string | null } | null>(null);
  const choices = semesters.some(semester => semester.name === current)
    ? semesters : [{ name: current, courses: [] }, ...semesters];
  const selected = choices.find(semester => semester.name === semesterName) || choices[0];
  const openCode = expanded?.semester === selected.name &&
    (expanded.code === null || selected.courses.includes(expanded.code))
    ? expanded.code : selected.courses[0];

  return (
    <section className="new-homepage-insights-section" aria-labelledby="new-homepage-insights-title">
      <div className="new-homepage-insights-head">
        <h2 id="new-homepage-insights-title">Professor Insights</h2>
        <select aria-label="Professor insights semester" value={selected.name}
          onChange={event => { setSemesterName(event.target.value); setExpanded(null); }}>
          {choices.map(semester => <option key={semester.name} value={semester.name}>
            {semester.name}{semester.name === current ? " (current)" : ""}
          </option>)}
        </select>
      </div>
      <p className="new-homepage-insights-intro">Explore professors for your planned courses.</p>
      {account === "loading" ? <p className="new-homepage-insights-note" role="status">Loading your semester plan…</p> :
        account === "error" ? <p className="new-homepage-insights-note">Your semester plan couldn’t be loaded.</p> :
        account === "guest" ? <p className="new-homepage-insights-note"><a href="/login">Sign in</a> with a verified AUC account to see professor reviews.</p> :
        !selected.courses.length ? <p className="new-homepage-insights-note">Add courses to {selected.name} in Plan Your Semesters to see insights here.</p> :
        <>
          <div className="new-homepage-insights-courses">
            {selected.courses.map(code => {
              const isOpen = openCode === code;
              const panelId = "insight-" + code.replace(/[^a-zA-Z0-9]/g, "-");
              return (
                <div key={code} className="new-homepage-insights-course">
                  <button type="button" className="new-homepage-insights-course-toggle"
                    aria-expanded={isOpen} aria-controls={panelId}
                    onClick={() => setExpanded({ semester: selected.name, code: isOpen ? null : code })}>
                    <span><strong>{code}</strong><small>{courseByCode.get(code)?.title || "Course"}</small></span>
                    <span className="new-homepage-insights-chevron" aria-hidden="true" />
                  </button>
                  <div id={panelId} hidden={!isOpen}>
                    {isOpen && <CourseInsights key={selected.name + ":" + code} code={code} />}
                  </div>
                </div>
              );
            })}
          </div>
          <p className="new-homepage-insights-disclaimer">Based on available past and current student reviews for each course, not confirmed teaching assignments. Recommendations require at least 3 ratings; averages of 4.0 or higher are worth considering and 2.0 or lower warrant caution.</p>
        </>}
    </section>
  );
}
