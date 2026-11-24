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

function ProfessorRow({ insight }: { insight: ProfessorInsight }) {
  const professor = professorById.get(insight.professorId);
  const name = professor?.name || insight.professorName;
  const photo = professor?.image?.trim() || "/user.png";
  const content = (
    <>
      <img className="new-homepage-insights-avatar" src={photo} alt=""
        width={44} height={44} loading="lazy" decoding="async"
        onError={event => {
          const image = event.currentTarget;
          if (image.getAttribute("src") !== "/user.png") image.src = "/user.png";
        }} />
      <span className="new-homepage-insights-person">
        <strong>{name}</strong>
        <small>{insight.averageRating.toFixed(1)} / 5 · {insight.reviewCount} {insight.reviewCount === 1 ? "rating" : "ratings"}</small>
        {insight.category === "limited" && <small>Limited reviews</small>}
      </span>
      {professor && <span className="new-homepage-insights-row-arrow" aria-hidden="true">›</span>}
    </>
  );
  return professor ? (
    <a className="new-homepage-insights-row" href={"/professors/" + encodeURIComponent(professor.id)}>
      {content}
    </a>
  ) : <div className="new-homepage-insights-row">{content}</div>;
}

function ProfessorColumn({ label, category, insights }: {
  label: string; category: "consider" | "caution"; insights: ProfessorInsight[];
}) {
  return (
    <div className="new-homepage-insights-column">
      <h3 className={"new-homepage-insights-column-label is-" + category}
        title="Based on course reviews, not confirmed teaching assignments">{label}</h3>
      {insights.length ? (
        <div className="new-homepage-insights-people">
          {insights.map(insight => <ProfessorRow key={insight.professorId} insight={insight} />)}
        </div>
      ) : <p className="new-homepage-insights-empty">
        {category === "consider" ? "No professors recommended" : "No professors flagged"}
      </p>}
    </div>
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
  if (view.status !== "ready") return null;

  const consider = view.insights.filter(item => item.category === "consider");
  const avoid = view.insights.filter(item => item.category === "caution");
  const others = view.insights.filter(item => item.category === "other" || item.category === "limited");
  return (
    <div className="new-homepage-insights-results">
      <div className="new-homepage-insights-grid">
        <ProfessorColumn label="Consider" category="consider" insights={consider} />
        <ProfessorColumn label="Avoid" category="caution" insights={avoid} />
      </div>
      {!view.insights.length && <p className="new-homepage-insights-note">No professor ratings for this course yet.</p>}
      {others.length > 0 && (
        <details className="new-homepage-insights-others">
          <summary>See other reviewed professors ({others.length})</summary>
          <div className="new-homepage-insights-people">
            {others.map(insight => <ProfessorRow key={insight.professorId} insight={insight} />)}
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
        </>}
    </section>
  );
}
