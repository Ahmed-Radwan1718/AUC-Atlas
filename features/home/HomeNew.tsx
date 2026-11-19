"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useMemo, useState } from "react";
import { courses } from "../../data/courses";
import { CAMPUS_DESTINATIONS, type CampusDestinationId, type CampusPhase } from "./CampusWorld";
import "./homeNew.css";

const CampusWorld = dynamic(() => import("./CampusWorld"), {
  ssr: false, loading: () => <div className="cinema-loading">Preparing the campus…</div>
});

type Major = { name: string; codes: string[] };
const majorsByBuilding: Record<Exclude<CampusDestinationId, "library">, Major[]> = {
  engineering: [
    { name: "Mechanical Engineering", codes: ["MENG"] },
    { name: "Computer Science & Engineering", codes: ["CSCE"] },
    { name: "Electronics & Communications", codes: ["ECNG"] },
    { name: "Construction Engineering", codes: ["CENG"] },
    { name: "Petroleum & Energy Engineering", codes: ["PENG"] },
    { name: "Architecture", codes: ["ARCH", "ARCE"] },
    { name: "Engineering Fundamentals", codes: ["ENGR"] }
  ],
  business: [
    { name: "Business & Management", codes: ["BADM", "MGMT"] },
    { name: "Finance", codes: ["FINC"] },
    { name: "Accounting", codes: ["ACCT"] },
    { name: "Marketing", codes: ["MKTG"] },
    { name: "Economics", codes: ["ECON"] },
    { name: "Entrepreneurship", codes: ["ENTR"] },
    { name: "Business Information Systems", codes: ["MOIS"] }
  ],
  sciences: [
    { name: "Physics", codes: ["PHYS"] },
    { name: "Chemistry", codes: ["CHEM"] },
    { name: "Biology", codes: ["BIOL"] },
    { name: "Mathematics", codes: ["MACT"] },
    { name: "Data Science", codes: ["DSCI"] },
    { name: "Environmental Sciences", codes: ["SCI", "ENVR"] }
  ],
  humanities: [
    { name: "Psychology", codes: ["PSYC"] },
    { name: "Political Science", codes: ["POLS"] },
    { name: "History", codes: ["HIST"] },
    { name: "Sociology & Anthropology", codes: ["SOCI", "ANTH"] },
    { name: "English & Comparative Literature", codes: ["ENGL", "LITR"] },
    { name: "Arabic Studies", codes: ["ARAB"] },
    { name: "Communication & Media", codes: ["JRMC", "COMM"] },
    { name: "Philosophy", codes: ["PHIL"] }
  ]
};

function courseHref(code: string) {
  const slug = code.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-");
  return "/courses/" + encodeURIComponent(slug) + "#course-materials-access";
}

export default function HomeNew() {
  const [phase, setPhase] = useState<CampusPhase>("campus");
  const [selectedId, setSelectedId] = useState<CampusDestinationId | null>(null);
  const [majorIndex, setMajorIndex] = useState<number | null>(null);
  const [query, setQuery] = useState("");
  const [shown, setShown] = useState(24);
  const [reducedMotion, setReducedMotion] = useState(false);

  const destination = CAMPUS_DESTINATIONS.find(item => item.id === selectedId);
  const majors = selectedId && selectedId !== "library" ? majorsByBuilding[selectedId] : [];
  const major = majorIndex === null ? null : majors[majorIndex];
  const browsing = selectedId === "library" || Boolean(major);

  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReducedMotion(media.matches);
    update();
    media.addEventListener("change", update);
    return () => {
      document.body.style.overflow = previous;
      media.removeEventListener("change", update);
    };
  }, []);

  const selectBuilding = useCallback((id: CampusDestinationId) => {
    if (phase !== "campus") return;
    setSelectedId(id);
    setMajorIndex(null);
    setQuery("");
    setShown(24);
    setPhase("approaching");
  }, [phase]);

  const arrived = useCallback(() => setPhase("inside"), []);
  const departed = useCallback(() => {
    setSelectedId(null);
    setMajorIndex(null);
    setQuery("");
    setPhase("campus");
  }, []);
  const goBack = useCallback(() => {
    if (majorIndex !== null) {
      setMajorIndex(null);
      setQuery("");
      setShown(24);
    } else if (phase === "inside") {
      setPhase("leaving");
    }
  }, [majorIndex, phase]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape" && phase === "inside") goBack();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [phase, goBack]);

  const filteredCourses = useMemo(() => {
    const allowed = major ? new Set(major.codes) : null;
    if (selectedId !== "library" && !allowed) return [];
    const needle = query.trim().toLowerCase();
    return courses.filter(course =>
      (!allowed || allowed.has(course.subject)) &&
      (!needle || (course.code + " " + course.title).toLowerCase().includes(needle))
    );
  }, [major, selectedId, query]);

  return (
    <main className={"cinema-home cinema-phase-" + phase}>
      <div className="cinema-world">
        <CampusWorld phase={phase} selectedId={selectedId} onSelect={selectBuilding}
          onArrival={arrived} onDeparture={departed}/>
      </div>
      <div className="cinema-film-grain" aria-hidden="true"/>
      <div className="cinema-shading" aria-hidden="true"/>

      <header className="cinema-topbar">
        <a className="cinema-wordmark" href="/" aria-label="AUC Atlas main homepage">
          <span className="cinema-wordmark-icon">A</span>
          <span>AUC <strong>ATLAS</strong><small>THE ATLAS, REIMAGINED</small></span>
        </a>
        <span className="cinema-topbar-center">AN INTERACTIVE CAMPUS EXPERIENCE <span> / CONCEPT 01</span></span>
        <a className="cinema-topbar-shortcut" href="/courses">Find materials <span aria-hidden="true">↗</span></a>
      </header>

      {phase === "campus" && <>
        <section className="cinema-hero" aria-labelledby="cinema-heading">
          <div className="cinema-hero-rule"><span/> A DIFFERENT WAY TO EXPLORE</div>
          <h1 id="cinema-heading">Your campus.<br/><em>Your atlas.</em></h1>
          <p>A photographic 3D building scan. Five academic destinations.<br/>Choose a school to explore your courses and materials.</p>
          <span className="cinema-hero-guide">EXPLORE THE 3D EXPERIMENT <span aria-hidden="true">↘</span></span>
        </section>
        <div className="cinema-campus-index">
          <span className="cinema-campus-index-left">AUC ATLAS <span> / </span> REAL 3D PROTOTYPE</span>
          <nav className="cinema-campus-nav" aria-label="Choose a campus building">
            {CAMPUS_DESTINATIONS.map(item => (
              <button type="button" key={item.id} className="cinema-campus-nav-item"
                onClick={() => selectBuilding(item.id)}>
                <span className="cinema-campus-nav-number">{item.number}</span>
                <span className="cinema-campus-nav-name">{item.short}</span>
                <span className="cinema-campus-nav-arrow" aria-hidden="true">↗</span>
              </button>
            ))}
          </nav>
          <span className="cinema-campus-index-right">SELECT A SCHOOL</span>
        </div>
      </>}

      {phase === "approaching" && destination && <div className="cinema-entering">
        <span className="cinema-entering-index">DESTINATION {destination.number} / 05</span>
        <h2>Entering<br/><em>{destination.name}</em></h2>
        <div className="cinema-entering-progress"><span/></div>
      </div>}

      {(phase === "inside" || phase === "leaving") && destination && (
        <section className="cinema-interior" aria-labelledby="cinema-interior-title">
          <div className="cinema-interior-head">
            <button className="cinema-back" type="button" onClick={goBack}
              disabled={phase === "leaving"}>
              <span aria-hidden="true">←</span> {major ? "All disciplines" : "Back to the scene"}
            </button>
            <span className="cinema-interior-location">AUC ATLAS <span>/</span> {destination.name.toUpperCase()}</span>
          </div>
          <div className="cinema-interior-body">
            <div className="cinema-interior-heading">
              <p className="cinema-kicker">{destination.number} / {selectedId === "library" ? "THE KNOWLEDGE HUB" : "THE SCHOOL DIRECTORY"}</p>
              <h2 id="cinema-interior-title">
                {major ? major.name : selectedId === "library" ? "The Library" : destination.name}<span>.</span>
              </h2>
              <p className="cinema-interior-intro">
                {major ? "Explore courses and open their student-shared materials and professor information." :
                  selectedId === "library" ? "Every course in one place. Search the AUC Atlas catalogue." :
                  "Select a discipline to explore courses, materials, and professors."}
              </p>
            </div>
            {!browsing && (
              <div className="cinema-discipline-grid" aria-label="Disciplines">
                {majors.map((item, i) => (
                  <button type="button" className="cinema-discipline" key={item.name}
                    onClick={() => { setMajorIndex(i); setQuery(""); setShown(24); }}>
                    <span className="cinema-discipline-number">{String(i + 1).padStart(2, "0")}</span>
                    <span className="cinema-discipline-name">{item.name}</span>
                    <span className="cinema-discipline-arrow" aria-hidden="true">↗</span>
                  </button>
                ))}
                <a href="/professors" className="cinema-discipline cinema-discipline-special">
                  <span className="cinema-discipline-number">↗</span>
                  <span className="cinema-discipline-name">Explore all professor reviews</span>
                  <span className="cinema-discipline-arrow" aria-hidden="true">↗</span>
                </a>
              </div>
            )}
            {browsing && (
              <div className="cinema-course-browser">
                <div className="cinema-course-search-wrap">
                  <span className="cinema-course-search-symbol" aria-hidden="true">⌕</span>
                  <input type="search" value={query}
                    onChange={event => { setQuery(event.target.value); setShown(24); }}
                    placeholder="Search by course code or name…" aria-label="Search courses"/>
                  <span className="cinema-course-total">{filteredCourses.length} COURSES</span>
                </div>
                <div className="cinema-course-list">
                  {filteredCourses.slice(0, shown).map(course => (
                    <a className="cinema-course-row" href={courseHref(course.code)} key={course.code}>
                      <span className="cinema-course-code">{course.code}</span>
                      <span className="cinema-course-title">{course.title}</span>
                      <span className="cinema-course-cta">Materials &amp; details <span aria-hidden="true">↗</span></span>
                    </a>
                  ))}
                  {!filteredCourses.length && <p className="cinema-empty">
                    No matching courses in this discipline. <a href="/courses">Browse all courses ↗</a>
                  </p>}
                </div>
                {filteredCourses.length > shown && (
                  <button type="button" className="cinema-more" onClick={() => setShown(count => count + 24)}>
                    Show more courses <span aria-hidden="true">↓</span>
                  </button>
                )}
                <div className="cinema-course-bottom">
                  <a href="/courses">Browse the full course library ↗</a>
                  <a href="/professors">Browse professors &amp; reviews ↗</a>
                </div>
              </div>
            )}
          </div>
        </section>
      )}

      <div className="cinema-asset-credit">Photogrammetry demo: model by <a href="https://huggingface.co/datasets/Matt1up/drone-building-scans" target="_blank" rel="noopener noreferrer">Matt1up</a> · <a href="https://creativecommons.org/licenses/by/4.0/" target="_blank" rel="noopener noreferrer">CC BY 4.0</a> · Not an AUC building</div>
      <footer className="cinema-footnote">
        <span>INTERACTIVE CONCEPT / ARCHITECTURAL STUDY</span>
        <span>{reducedMotion ? "MOTION REDUCED" : "MOVE TO EXPLORE • SELECT A DESTINATION"}</span>
      </footer>
      <span className="cinema-sr-only" aria-live="polite">
        {phase === "approaching" ? "Approaching " + destination?.name :
          phase === "inside" ? "Inside " + destination?.name : ""}
      </span>
    </main>
  );
}
