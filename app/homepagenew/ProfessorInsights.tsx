"use client";

import { useEffect, useState } from "react";
import { courses } from "../../data/courses";
import { professors } from "../../data/professors";
import { summarizeCourseProfessors, type CourseReview, type ProfessorInsight } from "./professorInsightsSummary";

type Semester = { name: string; courses: string[] };
type Account = "loading" | "signed-in" | "guest" | "error";
type SemesterInsight = ProfessorInsight & { courseCode: string };
type ReviewView = { status: "loading" | "locked" | "error" } |
  { status: "ready"; insights: SemesterInsight[]; failedCourses: string[] };

const courseByCode = new Map(courses.map(course => [course.code, course]));
const professorById = new Map(professors.map(professor => [professor.id, professor]));

function ProfessorRow({ insight }: { insight: SemesterInsight }) {
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
        <small className="new-homepage-insights-person-course">{insight.courseCode}{courseByCode.get(insight.courseCode)?.title ? " · " + courseByCode.get(insight.courseCode)!.title : ""}</small>
        <small>{insight.averageRating.toFixed(1)} / 5 · {insight.reviewCount} {insight.reviewCount === 1 ? "rating" : "ratings"}</small>
        {insight.reviewCount < 3 && <small>Limited reviews</small>}
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
  label: string; category: "consider" | "caution"; insights: SemesterInsight[];
}) {
  return (
    <div className="new-homepage-insights-column">
      <h3 className={"new-homepage-insights-column-label is-" + category}
        title="Based on course reviews, not confirmed teaching assignments">{label}</h3>
      {insights.length ? (
        <div className="new-homepage-insights-people">
          {insights.map(insight => <ProfessorRow key={insight.courseCode + ":" + insight.professorId} insight={insight} />)}
        </div>
      ) : <p className="new-homepage-insights-empty">
        {category === "consider" ? "No professors recommended" : "No professors flagged"}
      </p>}
    </div>
  );
}

function ProfessorInsightsSkeleton() {
  return (
    <div className="new-homepage-insights-results" role="status" aria-label="Loading professor insights">
      <div className="new-homepage-insights-grid" aria-hidden="true">
        {(["consider", "caution"] as const).map(category => (
          <div className="new-homepage-insights-column" key={category}>
            <h3 className={"new-homepage-insights-column-label is-" + category}>
              {category === "consider" ? "Consider" : "Avoid"}
            </h3>
            <div className="new-homepage-insights-row">
              <span className="new-homepage-insights-avatar new-homepage-insights-skeleton-block" />
              <span className="new-homepage-insights-person">
                <span className="new-homepage-insights-skeleton-block new-homepage-insights-skeleton-line is-name" />
                <span className="new-homepage-insights-skeleton-block new-homepage-insights-skeleton-line is-course" />
                <span className="new-homepage-insights-skeleton-block new-homepage-insights-skeleton-line is-rating" />
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function SemesterInsights({ codes }: { codes: readonly string[] }) {
  const [view, setView] = useState<ReviewView>({ status: "loading" });
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    setView({ status: "loading" });
    async function load() {
      try {
        const response = await fetch("/api/professor-reviews?courseCodes=" + encodeURIComponent(codes.join(",")), {
          credentials: "same-origin", cache: "no-store", signal: controller.signal,
          headers: { Accept: "application/json" }
        });
        if (controller.signal.aborted) return;
        if (response.status === 401) { setView({ status: "locked" }); return; }
        if (!response.ok) throw new Error("Unable to load course reviews.");
        const data = await response.json() as { courses?: { courseCode: string; reviews: CourseReview[] | null }[] };
        if (controller.signal.aborted) return;
        if (!Array.isArray(data.courses)) throw new Error("Invalid review response.");
        const byCode = new Map(data.courses.map(row => [row.courseCode, row.reviews]));
        const insights: SemesterInsight[] = [];
        const failedCourses: string[] = [];
        for (const code of codes) {
          const reviews = byCode.get(code);
          if (!Array.isArray(reviews)) { failedCourses.push(code); continue; }
          insights.push(...summarizeCourseProfessors(reviews, code).map(insight => ({ ...insight, courseCode: code })));
        }
        setView(failedCourses.length === codes.length
          ? { status: "error" }
          : { status: "ready", insights, failedCourses });
      } catch {
        if (!controller.signal.aborted) setView({ status: "error" });
      }
    }
    void load();
    return () => controller.abort();
  }, [codes, retry]);

  if (view.status === "loading") return <ProfessorInsightsSkeleton />;
  if (view.status === "locked") return <p className="new-homepage-insights-note"><a href="/login">Sign in</a> with a verified AUC account to view reviews.</p>;
  if (view.status === "error") return <p className="new-homepage-insights-note" role="status">Couldn’t load reviews. <button type="button" onClick={() => setRetry(n => n + 1)}>Try again</button></p>;
  if (view.status !== "ready") return null;

  const consider = view.insights.filter(item => item.category === "consider");
  const avoid = view.insights.filter(item => item.category === "caution");
  return (
    <div className="new-homepage-insights-results">
      <div className="new-homepage-insights-grid">
        <ProfessorColumn label="Consider" category="consider" insights={consider} />
        <ProfessorColumn label="Avoid" category="caution" insights={avoid} />
      </div>
      {!view.insights.length && !view.failedCourses.length && <p className="new-homepage-insights-note">No professor ratings for these courses yet.</p>}
      {view.failedCourses.length > 0 && <p className="new-homepage-insights-note" role="status">Couldn’t load reviews for {view.failedCourses.join(", ")}. <button type="button" onClick={() => setRetry(n => n + 1)}>Try again</button></p>}
    </div>
  );
}

export default function ProfessorInsights({ semesters, current, account }: {
  semesters: readonly Semester[]; current: string; account: Account;
}) {
  const [semesterName, setSemesterName] = useState(current);
  const choices = semesters.some(semester => semester.name === current)
    ? semesters : [{ name: current, courses: [] }, ...semesters];
  const selected = choices.find(semester => semester.name === semesterName) || choices[0];


  return (
    <section className="new-homepage-insights-section" aria-labelledby="new-homepage-insights-title">
      <div className="new-homepage-insights-head">
        <h2 id="new-homepage-insights-title">Professor Insights</h2>
        <select aria-label="Professor insights semester" value={selected.name}
          onChange={event => setSemesterName(event.target.value)}>
          {choices.map(semester => <option key={semester.name} value={semester.name}>
            {semester.name}
          </option>)}
        </select>
      </div>
      {account === "loading" ? <ProfessorInsightsSkeleton /> :
        account === "error" ? <p className="new-homepage-insights-note">Your semester plan couldn’t be loaded.</p> :
        account === "guest" ? <p className="new-homepage-insights-note"><a href="/login">Sign in</a> with a verified AUC account to see professor reviews.</p> :
        !selected.courses.length ? <p className="new-homepage-insights-note">Add courses to {selected.name} in Plan Your Semesters to see insights here.</p> :
        <SemesterInsights key={JSON.stringify([selected.name, selected.courses])} codes={selected.courses} />}
    </section>
  );
}
