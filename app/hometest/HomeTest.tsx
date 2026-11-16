"use client";

import { useEffect, useMemo, useState } from "react";
import HomeSearch from "../../features/home/HomeSearch";
import { professors } from "../../data/professors";
import { courses } from "../../data/courses";
import { homepageMonthlyVisits } from "../../lib/monthlyVisits";
import "./hometest.css";

type RankedProfessor = {
  professorId: string;
  professorName: string;
  reviewCount: number;
  averageRating: number;
};
type CourseMaterial = {
  id: string;
  courseCode: string;
  courseTitle?: string;
  title?: string;
  materialType?: string;
  fileName?: string;
  fileType?: string;
  createdAt?: string;
};
type Overview = {
  reviewsLocked: boolean;
  reviewCount: number | null;
  materialCount: number;
  lowestRatedProfessors: RankedProfessor[];
  topReviewedProfessors: RankedProfessor[];
  latestMaterials: CourseMaterial[];
};
type IconName =
  | "professor" | "course" | "file" | "calculator"
  | "degree" | "arrow" | "star" | "spark" | "search"
  | "upload" | "reviews" | "visits";

function Icon({ name, size = 23 }: { name: IconName; size?: number }) {
  const graphic: Record<IconName, React.ReactNode> = {
    professor: <><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></>,
    course: <><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/><path d="M9 7h6M9 11h5"/></>,
    file: <><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6M8 13h8M8 17h8"/></>,
    calculator: <><rect x="4" y="2" width="16" height="20" rx="2"/><path d="M8 6h8M8 11h2M14 11h2M8 16h2M14 16h2"/></>,
    degree: <><path d="m2 10 10-5 10 5-10 5-10-5z"/><path d="M6 12v5c3.5 2.7 8.5 2.7 12 0v-5M22 10v6"/></>,
    arrow: <><path d="M7 17 17 7M7 7h10v10"/></>,
    star: <path d="m12 2 3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>,
    spark: <><path d="m12 3 1.9 6.1L20 11l-6.1 1.9L12 19l-1.9-6.1L4 11l6.1-1.9L12 3z"/><path d="m20 17 .8 2.2L23 20l-2.2.8L20 23l-.8-2.2L17 20l2.2-.8L20 17z"/></>,
    search: <><circle cx="10.9" cy="10.9" r="6.9"/><path d="m16 16 5 5"/></>,
    upload: <><path d="M12 16V3m-5 5 5-5 5 5"/><path d="M3 16v3a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-3"/></>,
    reviews: <><path d="M21 11.5a8.4 8.4 0 0 1-.9 3.8A8.5 8.5 0 0 1 12.5 20a8.4 8.4 0 0 1-3.8-.9L3 21l1.9-5.7a8.4 8.4 0 0 1-.9-3.8A8.5 8.5 0 0 1 12.5 3h.5a8.5 8.5 0 0 1 8 8v.5z"/></>,
    visits: <><path d="M3 20h18M6 17V9M12 17V4M18 17v-6"/></>,
  };
  return <svg aria-hidden="true" width={size} height={size} viewBox="0 0 24 24"
    fill="none" stroke="currentColor" strokeWidth="1.7"
    strokeLinecap="round" strokeLinejoin="round">{graphic[name]}</svg>;
}

const professorById = new Map(professors.map(p => [p.id, p]));
const courseByCode = new Map(courses.map(c => [c.code.toUpperCase(), c]));

function courseUrl(code: string) {
  const slug = code.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  return slug ? "/courses/" + encodeURIComponent(slug) : "/courses";
}

function formatShortDate(raw?: string) {
  if (!raw) return "";
  const date = new Date(raw);
  return Number.isNaN(date.getTime()) ? "" : date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function NumberValue({ value }: { value: number | null | undefined }) {
  return <span>{value == null ? "—" : value.toLocaleString("en-US")}</span>;
}

const shortcuts: { title: string; caption: string; href: string; icon: IconName; number: string }[] = [
  { title: "Professors", caption: "Reviews, ratings & real experiences", href: "/professors", icon: "professor", number: "01" },
  { title: "Courses", caption: "Explore the AUC course catalog", href: "/courses", icon: "course", number: "02" },
  { title: "Study materials", caption: "Notes, slides & student resources", href: "/courses", icon: "file", number: "03" },
];

export default function HomeTest() {
  const [overview, setOverview] = useState<Overview | null>(null);
  const [visits, setVisits] = useState<number | null>(null);
  const [activityError, setActivityError] = useState(false);
  const [spotlight, setSpotlight] = useState<"top" | "lowest">("top");

  useEffect(() => {
    let active = true;
    void homepageMonthlyVisits().then(count => { if (active) setVisits(count); });
    void fetch("/api/homepage-overview", {
      credentials: "same-origin",
      cache: "no-store",
      headers: { Accept: "application/json" },
    })
      .then(response => {
        if (!response.ok) throw new Error("Homepage data unavailable");
        return response.json() as Promise<Overview>;
      })
      .then(data => { if (active) setOverview(data); })
      .catch(() => { if (active) setActivityError(true); });
    return () => { active = false; };
  }, []);

  const rankings = useMemo(() => {
    const data = spotlight === "top" ? overview?.topReviewedProfessors : overview?.lowestRatedProfessors;
    return (data || []).map(item => ({
      ...item,
      profile: professorById.get(item.professorId),
    })).filter(item => item.profile && item.reviewCount > 0).slice(0, 3);
  }, [overview, spotlight]);

  return (
    <main className="hometest-root">
      <section className="ht-hero" aria-labelledby="ht-hero-title">
        <div className="ht-hero-halo" aria-hidden="true" />
        <div className="ht-hero-inner">
          <div className="ht-eyebrow"><span className="ht-eyebrow-line" /> THE AUC STUDENT TOOLKIT <span className="ht-eyebrow-line" /></div>
          <h1 id="ht-hero-title">KNOW BEFORE<br />YOU ENROLL<span className="ht-hero-dot">.</span></h1>
          <p className="ht-hero-description">Find professors, explore courses, and discover study materials.<br className="ht-desktop-break"/> Everything you need, in one place.</p>
          <div className="ht-search-area">
            <HomeSearch />
          </div>
          <div className="ht-search-hints" aria-label="Popular searches">
            <span>EXPLORE</span>
            <a href="/professors">Professors <span aria-hidden="true">↗</span></a>
            <a href="/courses">Courses <span aria-hidden="true">↗</span></a>
            <a href="/courses">Study materials <span aria-hidden="true">↗</span></a>
          </div>
        </div>
        <a className="ht-scroll-hint" href="#ht-explore" aria-label="Scroll to explore">SCROLL TO EXPLORE <span aria-hidden="true">↓</span></a>
      </section>

      <div className="ht-container">
        <section className="ht-section ht-explore" id="ht-explore" aria-labelledby="ht-explore-title">
          <div className="ht-section-heading">
            <div>
              <span className="ht-section-kicker">01 / DISCOVER</span>
              <h2 id="ht-explore-title">EXPLORE ATLAS<span className="ht-heading-dot">.</span></h2>
            </div>
            <p>Everything you need to make smarter academic decisions, one click away.</p>
          </div>
          <div className="ht-explore-grid">
            {shortcuts.map(shortcut => (
              <a className="ht-explore-card" href={shortcut.href} key={shortcut.title}>
                <div className="ht-explore-top">
                  <span className="ht-shortcut-icon"><Icon name={shortcut.icon} size={27} /></span>
                  <span className="ht-shortcut-num">{shortcut.number}</span>
                </div>
                <div className="ht-explore-bottom">
                  <div>
                    <h3>{shortcut.title}</h3>
                    <p>{shortcut.caption}</p>
                  </div>
                  <span className="ht-card-arrow"><Icon name="arrow" size={19}/></span>
                </div>
              </a>
            ))}
          </div>
        </section>

        <section className="ht-section ht-activity" aria-labelledby="ht-activity-title">
          <div className="ht-section-heading">
            <div>
              <span className="ht-section-kicker">02 / THE COMMUNITY</span>
              <h2 id="ht-activity-title">WHAT'S NEW<span className="ht-heading-dot">.</span></h2>
            </div>
            <p>Fresh student resources and professor insights from across AUC.</p>
          </div>

          <div className="ht-activity-grid">
            <article className="ht-panel ht-materials-panel">
              <div className="ht-panel-top">
                <div className="ht-panel-title-block">
                  <span className="ht-panel-icon"><Icon name="file" size={20}/></span>
                  <div><h3>LATEST MATERIALS</h3><p>Recently shared by students</p></div>
                </div>
                <a className="ht-link" href="/courses">Explore courses <Icon name="arrow" size={16}/></a>
              </div>
              <div className="ht-material-list" aria-live="polite">
                {overview?.latestMaterials?.length ? overview.latestMaterials.slice(0,3).map(material => {
                  const course = courseByCode.get(material.courseCode.toUpperCase());
                  return (
                    <a className="ht-material-row" key={material.id} href={courseUrl(material.courseCode) + "#course-materials-access"}>
                      <span className="ht-file-icon"><Icon name="file" size={22}/></span>
                      <span className="ht-material-info">
                        <strong>{material.title || material.fileName || "Course material"}</strong>
                        <span>{material.courseCode}{course?.title ? " · " + course.title : material.courseTitle ? " · " + material.courseTitle : ""}</span>
                      </span>
                      <span className="ht-material-trail">
                        <span>{material.materialType || "Material"}</span>
                        <small>{formatShortDate(material.createdAt)}</small>
                      </span>
                      <span className="ht-row-chevron" aria-hidden="true">↗</span>
                    </a>
                  );
                }) : (
                  <div className="ht-list-state">
                    {activityError ? "Materials are temporarily unavailable." :
                     !overview ? "Loading recent uploads..." : "New materials will appear here once approved."}
                  </div>
                )}
              </div>
              <a className="ht-panel-footer-link" href="/courses">BROWSE ALL COURSES <span aria-hidden="true">↗</span></a>
            </article>

            <article className="ht-panel ht-spotlight-panel">
              <div className="ht-panel-top ht-spotlight-header">
                <div className="ht-panel-title-block">
                  <span className="ht-panel-icon"><Icon name="star" size={20}/></span>
                  <div><h3>PROFESSOR SPOTLIGHT</h3><p>Student rating insights</p></div>
                </div>
              </div>
              <div className="ht-tabs" role="group" aria-label="Professor ranking">
                <button type="button" className={spotlight === "top" ? "is-active" : ""} aria-pressed={spotlight === "top"} onClick={() => setSpotlight("top")}>Top reviewed</button>
                <button type="button" className={spotlight === "lowest" ? "is-active" : ""} aria-pressed={spotlight === "lowest"} onClick={() => setSpotlight("lowest")}>Lowest rated</button>
              </div>
              <div className="ht-professor-list" aria-live="polite">
                {overview?.reviewsLocked ? (
                  <div className="ht-list-state ht-locked">Professor rankings are available to verified AUC students. <a href="/login">Sign in to view →</a></div>
                ) : rankings.length ? rankings.map((item, index) => (
                  <a className="ht-professor-row" href={"/professors/" + encodeURIComponent(item.professorId)} key={item.professorId}>
                    <span className="ht-professor-rank">0{index + 1}</span>
                    <img src={item.profile?.image || "/user.png"} alt="" loading="lazy"/>
                    <span className="ht-professor-info">
                      <strong>{item.profile?.name || item.professorName}</strong>
                      <span>{item.profile?.displayDepartment || item.profile?.department || "AUC"} · {item.reviewCount} {item.reviewCount === 1 ? "review" : "reviews"}</span>
                    </span>
                    <span className="ht-rating"><span aria-hidden="true">★</span> {item.averageRating.toFixed(1)}</span>
                  </a>
                )) : (
                  <div className="ht-list-state">
                    {activityError ? "Professor insights are temporarily unavailable." :
                      !overview ? "Loading professor insights..." : "No professors in this category yet."}
                  </div>
                )}
              </div>
              <a className="ht-panel-footer-link" href="/professors">EXPLORE PROFESSORS <span aria-hidden="true">↗</span></a>
            </article>
          </div>
        </section>

        <section className="ht-section ht-tools" aria-labelledby="ht-tools-title">
          <div className="ht-section-heading">
            <div>
              <span className="ht-section-kicker">03 / YOUR FUTURE</span>
              <h2 id="ht-tools-title">PLAN YOUR DEGREE<span className="ht-heading-dot">.</span></h2>
            </div>
            <p>Make a plan for your semester and keep your graduation goals in sight.</p>
          </div>
          <div className="ht-tools-grid">
            <a className="ht-tool-card" href="/gpa-calculator">
              <span className="ht-tool-icon"><Icon name="calculator" size={29}/></span>
              <div className="ht-tool-copy"><span className="ht-tool-overline">ACADEMIC TOOLS</span><h3>GPA Calculator</h3><p>Calculate your GPA and plan your upcoming semesters.</p></div>
              <span className="ht-card-arrow"><Icon name="arrow" size={19}/></span>
            </a>
            <a className="ht-tool-card" href="/degree-progression">
              <span className="ht-tool-icon"><Icon name="degree" size={31}/></span>
              <div className="ht-tool-copy"><span className="ht-tool-overline">ACADEMIC TOOLS</span><h3>Degree Progression</h3><p>Track your completed credits and remaining requirements.</p></div>
              <span className="ht-card-arrow"><Icon name="arrow" size={19}/></span>
            </a>
          </div>
        </section>

        <section className="ht-section ht-stats" aria-label="AUC Atlas by the numbers">
          <div className="ht-stats-title"><span className="ht-section-kicker">AUC ATLAS BY THE NUMBERS</span><span>Built for the AUC student community</span></div>
          <div className="ht-stats-grid">
            <div className="ht-stat"><Icon name="professor" size={19}/><strong><NumberValue value={professors.length}/></strong><span>PROFESSORS</span></div>
            <div className="ht-stat"><Icon name="file" size={19}/><strong><NumberValue value={overview?.materialCount}/></strong><span>STUDY MATERIALS</span></div>
            <div className="ht-stat"><Icon name="reviews" size={19}/><strong><NumberValue value={overview?.reviewCount}/></strong><span>{overview?.reviewsLocked ? "REVIEWS · SIGN IN TO VIEW" : "STUDENT REVIEWS"}</span></div>
            <div className="ht-stat"><Icon name="visits" size={19}/><strong><NumberValue value={visits}/></strong><span>VISITS THIS MONTH</span></div>
          </div>
        </section>
      </div>
      <div className="ht-preview-note" role="note">HOMEPAGE CONCEPT PREVIEW · YOUR CURRENT HOMEPAGE IS UNCHANGED</div>
    </main>
  );
}
