"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import HomeSearch from "./HomeSearch";
import { courses } from "../../data/courses";
import { professors } from "../../data/professors";
import "./home.css";
import { homepageMonthlyVisits } from "../../lib/monthlyVisits";

type RankedProfessor = {
  professorId: string;
  professorName: string;
  reviewCount: number;
  averageRating: number;
};
type CourseMaterial = {
  id: string; courseCode: string; courseTitle?: string; title?: string;
  fileName?: string; fileType?: string; createdAt?: string;
};
type Overview = {
  reviewCount: number;
  lowestRatedProfessors: RankedProfessor[];
  topReviewedProfessors: RankedProfessor[];
  latestMaterials: CourseMaterial[];
};

const assetsRoot = "/";
const professorLookup = new Map<string, (typeof professors)[number]>();
for (const professor of professors) professorLookup.set(professor.id, professor);
const courseLookup = new Map<string, (typeof courses)[number]>();
for (const course of courses) {
  if (!courseLookup.has(course.code.toUpperCase())) courseLookup.set(course.code.toUpperCase(), course);
}
function formatCount(value: number): string {
  return Math.max(0, Math.round(value)).toLocaleString("en-US");
}
function AnimatedCount({ value, initial = "0" }: { value: number | null; initial?: string }) {
  const ref = useRef<HTMLElement>(null);
  const displayed = useRef(0);
  const [text, setText] = useState(initial);

  useEffect(() => {
    if (value === null) { setText("—"); return; }
    const next = Math.max(0, Math.round(Number(value) || 0));
    const start = displayed.current;
    displayed.current = next;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches || start === next) {
      setText(formatCount(next)); return;
    }
    let frame = 0;
    const startedAt = performance.now();
    const render = (now: number) => {
      const progress = Math.min((now - startedAt) / 520, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setText(formatCount(start + (next - start) * eased));
      if (progress < 1) frame = requestAnimationFrame(render);
      else setText(formatCount(next));
    };
    frame = requestAnimationFrame(render);
    return () => cancelAnimationFrame(frame);
  }, [value]);
  return <strong ref={ref}>{text}</strong>;
}
type RatedProfessor = {
  professor: (typeof professors)[number];
  average: number;
  count: number;
};

function professorItems(items: RankedProfessor[], lowestFirst: boolean): RatedProfessor[] {
  const rankings = items.map(summary => {
    const professor = professorLookup.get(summary.professorId);
    const average = Number(summary.averageRating);
    const count = Math.max(0, Math.round(Number(summary.reviewCount) || 0));
    return { professor, average, count };
  }).filter((item): item is RatedProfessor =>
    Boolean(item.professor?.name) && Number.isFinite(item.average) &&
    item.average > 0 && item.count > 0 && (!lowestFirst || item.average <= 2)
  ).sort((a, b) =>
    (lowestFirst ? a.average - b.average : b.average - a.average) || b.count - a.count
  );
  // Cycle through every qualifying low-rated professor; keep the other card at three.
  return lowestFirst ? rankings : rankings.slice(0, 3);
}

function professorRows(rankings: RatedProfessor[], inactive = false) {
  return rankings.map(({ professor, average, count }) => {
    const department = professor.displayDepartment || professor.department || "AUC";
    const label = count === 1 ? "review" : "reviews";
    return <a className="home-latest-item home-latest-person"
        href={"/professors/" + encodeURIComponent(professor.id)} key={professor.id}
        tabIndex={inactive ? -1 : undefined}>
      <img src={professor.image || assetsRoot + "user.png"} alt=""/>
      <span className="home-latest-person-copy">
        <strong>{professor.name}</strong>
        <small aria-label={department + ". " + average.toFixed(1) + " out of 5 from " + count + " " + label}>
          {department} · <span className="home-latest-stars" aria-hidden="true">★</span>{" "}
          {average.toFixed(1)} · {count + " " + label}
        </small>
      </span>
      <span className="home-latest-arrow" aria-hidden="true">→</span>
    </a>;
  });
}

function LowRatedProfessorSlider({ rankings }: { rankings: RatedProfessor[] }) {
  const pageCount = Math.ceil(rankings.length / 3);
  const [pageIndex, setPageIndex] = useState(0);
  const [sliding, setSliding] = useState(false);

  useEffect(() => {
    if (pageCount <= 1) return;
    const interval = window.setInterval(() => {
      if (document.hidden) return;
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        setPageIndex(current => (current + 1) % pageCount);
      } else {
        setSliding(true);
      }
    }, 15000);
    return () => window.clearInterval(interval);
  }, [pageCount]);

  useEffect(() => {
    if (!sliding) return;
    // Match the 600 ms CSS slide and reset the track after it has exited.
    const timer = window.setTimeout(() => {
      setPageIndex(current => (current + 1) % pageCount);
      setSliding(false);
    }, 650);
    return () => window.clearTimeout(timer);
  }, [sliding, pageCount]);

  // The existing three rows are rendered unchanged when no cycling is needed.
  if (pageCount <= 1) return <>{professorRows(rankings)}</>;

  const pageAt = (index: number) => Array.from({ length: 3 }, (_, offset) =>
    rankings[(index * 3 + offset) % rankings.length]
  );
  const current = pageIndex % pageCount;
  return <div className="home-lowest-carousel" aria-label="Professors rated 2 stars or less">
    <div className={"home-lowest-carousel-track" + (sliding ? " is-sliding" : "")}>
      <div className="home-lowest-carousel-slide">
        {professorRows(pageAt(current))}
      </div>
      <div className="home-lowest-carousel-slide" aria-hidden="true">
        {professorRows(pageAt((current + 1) % pageCount), true)}
      </div>
    </div>
  </div>;
}

function RatedProfessors({ items, lowest }: { items: RankedProfessor[]; lowest: boolean }) {
  const rankings = professorItems(items, lowest);
  if (!rankings.length) return <p className="home-latest-status">
    {lowest ? "Lowest-rated" : "Top-reviewed"} professors will appear here once ratings are available.
  </p>;
  return lowest
    ? <LowRatedProfessorSlider rankings={rankings}/>
    : <>{professorRows(rankings)}</>;
}

function getMaterialIcon(material: CourseMaterial): { icon: string | null; fallback: string } {
  const name = String(material.fileName || material.title || "").trim().toLowerCase();
  const extensionMatch = name.match(/\.([a-z0-9]{1,8})$/);
  let extension = extensionMatch ? extensionMatch[1] : "";
  const fileType = String(material.fileType || "").toLowerCase();
  if (!extension) {
    if (fileType.includes("pdf")) extension = "pdf";
    else if (fileType.includes("word")) extension = "docx";
    else if (fileType.includes("presentation") || fileType.includes("powerpoint")) extension = "pptx";
    else if (fileType.includes("spreadsheet") || fileType.includes("excel")) extension = "xlsx";
    else if (fileType.includes("jpeg")) extension = "jpg";
    else if (fileType.includes("png")) extension = "png";
  }
  const icons: Record<string,string> = {
    pdf: "pdf.png", doc: "doc.png", docx: "doc.png", ppt: "ppt.png",
    pptx: "ppt.png", xls: "xls.png", xlsx: "xls.png",
    jpg: "jpg.png", jpeg: "jpg.png", png: "png.png"
  };
  return { icon: icons[extension] || null, fallback: (extension || "FILE").slice(0, 5).toUpperCase() };
}
function LatestMaterials({ materials }: { materials: CourseMaterial[] }) {
  if (!materials.length) return <p className="home-latest-status">New approved course materials will appear here.</p>;
  return materials.slice(0, 3).map(material => {
    const courseName = courseLookup.get(String(material.courseCode || "").trim().toUpperCase())?.title
      || material.courseTitle || "Course name unavailable";
    const slug = String(material.courseCode || "").trim().toLowerCase()
      .replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
    const href = slug ? "/courses/" + encodeURIComponent(slug) + "#course-materials-access" : "/courses";
    const file = getMaterialIcon(material);
    return <a className="home-latest-item home-latest-material" href={href} key={material.id}>
      <span className="home-latest-material-icon" aria-hidden="true">
        {file.icon ? <img src={assetsRoot + file.icon} alt=""/> :
          <span className="home-latest-material-icon-fallback">{file.fallback}</span>}
      </span>
      <span className="home-latest-material-copy">
        <strong>{material.title || "Course material"}</strong>
        <span className="home-latest-item-bottom"><small>{courseName}</small></span>
      </span>
      <span className="home-latest-arrow" aria-hidden="true">→</span>
    </a>;
  });
}

export default function Home() {
  const [overview, setOverview] = useState<Overview | null>(null);
  const [visits, setVisits] = useState<number | null>(null);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    let active = true;
    void homepageMonthlyVisits().then(count => { if (active) setVisits(count); });
    void fetch("/api/homepage-overview", {
      method: "GET", credentials: "same-origin", headers: { Accept: "application/json" }
    }).then(response => {
      if (!response.ok) throw Error("Could not load homepage activity");
      return response.json() as Promise<Overview>;
    }).then(data => { if (active) setOverview(data); })
      .catch(() => { if (active) setFailed(true); });
    return () => { active = false; };
  }, []);
  const lowest = useMemo(() => overview?.lowestRatedProfessors || [], [overview]);
  const highest = useMemo(() => overview?.topReviewedProfessors || [], [overview]);
  const materials = overview?.latestMaterials || [];
  return (
    <main className="home-page">
      <section className="home-hero">
        <div>
          <div className="home-section-head">
            <div><h1>Know before you enroll.</h1></div>
            <p className="home-hero-copy">Search professors, courses, and student-uploaded material in one place.</p>
          </div>
          <HomeSearch/>
        </div>
      </section>
      <section className="home-stats-section" aria-labelledby="home-stats-title">
        <div className="home-section-head">
          <div><h2 id="home-stats-title">AUC Atlas by the numbers</h2></div>
          <p>Live counts from the professors, courses, reviews, and visits during the current month.</p>
        </div>
        <div className="home-stats-grid">
          <article className="home-stat"><AnimatedCount value={professors.length}/><span>Professors listed</span></article>
          <article className="home-stat"><AnimatedCount value={courses.length}/><span>Courses available</span></article>
          <article className="home-stat"><AnimatedCount value={overview ? overview.reviewCount : null} initial="—"/><span>Student reviews</span></article>
          <article className="home-stat"><AnimatedCount value={visits} initial="—"/><span>Visits this month</span></article>
        </div>
      </section>
      <section className="home-content-section" aria-labelledby="home-latest-title">
        <div className="home-section-head">
          <div><h2 id="home-latest-title">See what students added recently.</h2></div>
          <p>Check professors with the lowest and highest student ratings, alongside newly uploaded course materials.</p>
        </div>
        <div className="home-latest-grid">
          <article className="home-latest-card">
            <div className="home-latest-card-head">
              <div><h3>Professors to <span className="home-avoid-accent">AVOID</span></h3></div>
              <a href="/professors">View all →</a>
            </div>
            <div className="home-latest-list" id="home-lowest-professors">
              {overview || failed ? <RatedProfessors items={lowest} lowest/> : <p className="home-latest-status">Loading lowest-rated professors...</p>}
            </div>
          </article>
          <article className="home-latest-card">
            <div className="home-latest-card-head">
              <div><h3>New materials</h3></div>
              <a href="/courses">View all →</a>
            </div>
            <div className="home-latest-list" id="home-latest-materials">
              {overview || failed ? <LatestMaterials materials={materials}/> : <p className="home-latest-status">Loading new materials...</p>}
            </div>
          </article>
          <article className="home-latest-card">
            <div className="home-latest-card-head">
              <div><h3>Top reviewed professors</h3></div>
              <a href="/professors">View all →</a>
            </div>
            <div className="home-latest-list" id="home-latest-professors">
              {overview || failed ? <RatedProfessors items={highest} lowest={false}/> : <p className="home-latest-status">Loading top-reviewed professors...</p>}
            </div>
          </article>
        </div>
      </section>
    </main>
  );
}
