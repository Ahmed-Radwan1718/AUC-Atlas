"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import HomeSearch from "../../features/home/HomeSearch";
import { courses, type Course } from "../../data/courses";
import "./hometest.css";

type Chapter = { title: string; codes: string[]; label: string };
type Page =
  | { kind: "index" }
  | { kind: "chapters"; page: number }
  | { kind: "subject"; chapter: Chapter; page: number }
  | { kind: "course"; course: Course; chapter: Chapter; page: number };

const chapters: Chapter[] = [
  { title: "Computer Science", codes: ["CSCE"], label: "01" },
  { title: "Engineering", codes: ["ENGR", "MENG", "CENG", "ECNG", "PENG"], label: "02" },
  { title: "Economics", codes: ["ECON"], label: "03" },
  { title: "Mathematics", codes: ["MACT"], label: "04" },
  { title: "Business", codes: ["BADM", "BUSC", "ACCT", "FINC", "MGMT", "MKTG", "ENTR", "MOIS", "OPMG"], label: "05" },
];

const subjectChapters: Chapter[] = [...new Map(courses.map(item => [item.subject, {
  title: item.department,
  codes: [item.subject],
  label: item.subject,
}])).values()].sort((a, b) => a.title.localeCompare(b.title));

const COURSES_PER_PAGE = 7;
const SUBJECTS_PER_PAGE = 9;

function courseHref(code: string) {
  return "/courses/" + encodeURIComponent(code.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""));
}

function Arrow({ left = false }: { left?: boolean }) {
  return (
    <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      {left ? <path d="m14 5-7 7 7 7M7 12h13"/> : <path d="m7 5 7 7-7 7M4 12h10"/>}
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" width="25" height="25" fill="none"
      stroke="currentColor" strokeWidth="1.65" strokeLinecap="round">
      <circle cx="10.8" cy="10.8" r="7.6"/><path d="m16.6 16.6 5.2 5.2"/>
    </svg>
  );
}

/** Small AUC-inspired architectural vignette, not an official campus rendering. */
function CampusIllustration() {
  return (
    <svg className="hb-campus-art" role="img" aria-label="Sepia architectural illustration inspired by AUC campus"
      viewBox="0 0 780 285" preserveAspectRatio="xMidYMax slice" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="hb-stone" x1="0" x2=".2" y1="0" y2="1">
          <stop stopColor="#dcc4a0"/><stop offset=".53" stopColor="#e8d6bb"/><stop offset="1" stopColor="#a98f6e"/>
        </linearGradient>
        <linearGradient id="hb-sky" x1="0" x2="0" y1="0" y2="1">
          <stop stopColor="#f7ecda" stopOpacity=".0"/><stop offset="1" stopColor="#d7bea0" stopOpacity=".5"/>
        </linearGradient>
        <pattern id="hb-bricks" width="48" height="34" patternUnits="userSpaceOnUse">
          <path d="M0 0H48M0 17H48M0 34H48M24 0V17M0 17V34" fill="none" stroke="#a88e71" strokeWidth="2.5" opacity=".52"/>
        </pattern>
        <pattern id="hb-small-bricks" width="25" height="18" patternUnits="userSpaceOnUse">
          <path d="M0 0H25M0 9H25M0 18H25M12 0V9M0 9V18" fill="none" stroke="#9c8265" strokeWidth="1.4" opacity=".44"/>
        </pattern>
      </defs>
      <path fill="url(#hb-sky)" d="M0 0h780v285H0z"/>
      <path fill="#ddc5a7" d="m0 169 175-20 90 9 128-23 180 15 207-21v156H0z"/>
      <g opacity=".68">
        <path d="M5 272L4 101l85-7 88 15v164z" fill="url(#hb-stone)"/>
        <path d="M5 272L4 101l85-7 88 15v164z" fill="url(#hb-bricks)"/>
        <path d="m4 101 86-22 90 20-91-6z" fill="#b69a79"/>
        {Array.from({length:4},(_,i)=><rect key={i} x={24+i*37} y="152" width="17" height="32" fill="#b7a082" stroke="#947c61" strokeWidth="3"/>)}
      </g>
      <path d="m166 153 164-40 158 37v140H166z" fill="url(#hb-stone)"/>
      <path d="m166 153 164-40 158 37v140H166z" fill="url(#hb-small-bricks)"/>
      <path d="m164 152 167-53 158 45-158-31z" fill="#c3a782"/>
      <path d="M235 281v-94a35 35 0 0 1 70 0v94z" fill="#947c61" opacity=".65"/>
      <path d="M247 281v-92a23 23 0 0 1 46 0v92z" fill="#c9b397"/>
      <path d="M357 281v-94a35 35 0 0 1 70 0v94z" fill="#93785d" opacity=".66"/>
      <path d="M369 281v-92a23 23 0 0 1 46 0v92z" fill="#bda88a"/>
      <path d="m451 136 66-39 138 20 64 39v135H451z" fill="url(#hb-stone)"/>
      <path d="m451 136 66-39 138 20 64 39v135H451z" fill="url(#hb-bricks)"/>
      <path d="m516 94 45-33 71 12 25 44z" fill="#ae9273"/>
      <path d="M532 102V67l31-30 53 10v60z" fill="#dcc5a6" stroke="#a98f72" strokeWidth="4"/>
      <path d="m531 66 29-35 57 11-29 7z" fill="#957a5d"/>
      {Array.from({length:3},(_,i)=><rect key={i} x={551+i*19} y="70" width="10" height="21" fill="#9b8062" opacity=".75"/>)}
      <path d="M514 286v-93a36 36 0 0 1 72 0v93z" fill="#9e8568"/>
      <path d="M527 286v-90a23 23 0 0 1 46 0v90z" fill="#d6c1a3"/>
      <path d="M612 286v-93a36 36 0 0 1 72 0v93z" fill="#9e8568"/>
      <path d="M625 286v-90a23 23 0 0 1 46 0v90z" fill="#d6c1a3"/>
      <path d="M0 258q260-20 465 2t315-15v40H0z" fill="#c9ad8d" opacity=".55"/>
      {[
        {x:95,y:248,s:1.1},{x:189,y:247,s:.79},{x:714,y:252,s:1.0},{x:755,y:259,s:.66}
      ].map((p,i)=><g key={i} transform={`translate(${p.x} ${p.y}) scale(${p.s})`}>
        <path d="M0 24Q-3-38 5-98" fill="none" stroke="#8c8067" strokeWidth="8" strokeLinecap="round"/>
        {Array.from({length:8},(_,j)=>{const angle=(-165+j*46)*Math.PI/180;
          return <path key={j} d={`M5 -97 Q${Math.sin(angle)*30} ${-125+Math.cos(angle)*15} ${Math.sin(angle)*74} ${-104+Math.cos(angle)*31}`}
            stroke="#8b8b6c" strokeWidth="9" opacity=".65" strokeLinecap="round" fill="none"/>;})}
      </g>)}
      <rect width="780" height="285" fill="#f7ecda" opacity=".12"/>
    </svg>
  );
}

function BookLines({ title, number }: { title: string; number: string }) {
  return <div className="hb-page-footer"><span>{title}</span><span>{number}</span></div>;
}

function ChapterList({ select }: { select: (chapter: Chapter) => void }) {
  return (
    <div className="hb-index-list">
      {chapters.map((item, index) => (
        <button className="hb-index-item" type="button" key={item.label} onClick={() => select(item)}>
          <span className="hb-index-num">{String(index + 1).padStart(2,"0")}</span>
          <span className="hb-index-label">{item.title}</span>
          <span className="hb-index-arrow" aria-hidden="true">↗</span>
        </button>
      ))}
    </div>
  );
}

export default function HomeTest() {
  const [page, setPage] = useState<Page>({ kind: "index" });
  const [searchOpen, setSearchOpen] = useState(false);
  const searchArea = useRef<HTMLDivElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const selectedCourses = useMemo(() => {
    if (page.kind !== "subject" && page.kind !== "course") return [];
    return courses.filter(item => page.chapter.codes.includes(item.subject))
      .sort((a,b) => a.code.localeCompare(b.code, "en", {numeric:true}));
  }, [page]);
  const currentChapter = page.kind === "subject" || page.kind === "course" ? page.chapter : null;
  const isIndex = page.kind === "index";
  const isSubject = page.kind === "subject";
  const isCourse = page.kind === "course";
  const isAllSubjects = page.kind === "chapters";
  const nextIndex = isSubject ? page.page : isAllSubjects ? page.page : 0;
  const maxPage = isSubject
    ? Math.max(1, Math.ceil(selectedCourses.length / COURSES_PER_PAGE))
    : isAllSubjects ? Math.ceil(subjectChapters.length / SUBJECTS_PER_PAGE) : 1;

  useEffect(() => {
    if (searchOpen) searchArea.current?.querySelector<HTMLInputElement>("input")?.focus();
  }, [searchOpen]);

  useEffect(() => {
    if (!searchOpen) return;
    function onKeydown(event: KeyboardEvent) {
      if (event.key === "Escape") setSearchOpen(false);
    }
    document.addEventListener("keydown", onKeydown);
    return () => document.removeEventListener("keydown", onKeydown);
  }, [searchOpen]);

  function select(chapter: Chapter) {
    setPage({kind:"subject", chapter, page:0});
    setSearchOpen(false);
  }
  function goIndex() {
    setPage({kind:"index"});
    setSearchOpen(false);
  }
  function goBack() {
    if (page.kind === "course") setPage({kind:"subject",chapter:page.chapter,page:page.page});
    else if (page.kind === "subject" || page.kind === "chapters") goIndex();
  }
  function changePage(direction: number) {
    if (page.kind === "subject") setPage({...page,page:Math.max(0,Math.min(maxPage - 1,page.page + direction))});
    if (page.kind === "chapters") setPage({...page,page:Math.max(0,Math.min(maxPage - 1,page.page + direction))});
  }

  const activeCourses = isSubject ? selectedCourses.slice(nextIndex*COURSES_PER_PAGE,(nextIndex+1)*COURSES_PER_PAGE) : [];
  const availableSubjects = isAllSubjects ? subjectChapters.slice(nextIndex*SUBJECTS_PER_PAGE,(nextIndex+1)*SUBJECTS_PER_PAGE) : [];

  return (
    <main className="handbook-home">
      <h1 className="hb-sr-only">AUC Atlas — The Unofficial Student Handbook</h1>
      <section className="hb-stage" aria-label="Interactive AUC student handbook">
        <div className="hb-book" data-view={page.kind}>
          <span className="hb-page-edge hb-page-edge-left" aria-hidden="true"/>
          <span className="hb-page-edge hb-page-edge-right" aria-hidden="true"/>

          <article className="hb-leaf hb-left-leaf">
            <div key={isIndex?"left-intro":isAllSubjects?"left-contents":isSubject?"left-"+page.chapter.label:"left-"+page.course.code} className="hb-leaf-inner hb-page-transition">
              {isIndex ? (
                <>
                  <div className="hb-topline"><span>THE UNOFFICIAL STUDENT HANDBOOK</span><i/></div>
                  <div className="hb-cover">
                    <div>
                      <div className="hb-cover-title">AUC<br/>ATLAS<span>.</span></div>
                      <p className="hb-cover-tagline">Everything you wish you knew<br/>before enrolling.</p>
                    </div>
                    <CampusIllustration />
                  </div>
                  <BookLines title="AUC ATLAS" number="01"/>
                </>
              ) : isCourse ? (
                <>
                  <div className="hb-topline"><span>ACADEMIC CATALOGUE / {page.chapter.label}</span><i/></div>
                  <div className="hb-chapter-open">
                    <button className="hb-back" onClick={goBack} type="button"><Arrow left/> BACK TO COURSES</button>
                    <span className="hb-overline">COURSE RECORD · {page.course.subject}</span>
                    <span className="hb-course-code-display">{page.course.code}</span>
                    <h2 className="hb-chapter-title hb-course-title">{page.course.title}</h2>
                    <div className="hb-course-prereq">
                      <span>PREREQUISITES / COREQUISITES</span>
                      <p>{page.course.prerequisite?.trim() || "See the full course page for requirement information."}</p>
                    </div>
                  </div>
                  <BookLines title="THE COURSE INDEX" number="03"/>
                </>
              ) : (
                <>
                  <div className="hb-topline"><span>THE UNOFFICIAL STUDENT HANDBOOK</span><i/></div>
                  <div className="hb-chapter-open">
                    <button className="hb-back" type="button" onClick={goIndex}><Arrow left/> BACK TO INDEX</button>
                    <span className="hb-overline">AUC ATLAS / {isAllSubjects ? "ALL DISCIPLINES" : "SELECTED DEPARTMENT"}</span>
                    <div className="hb-chapter-mark">{isAllSubjects?"A—Z":currentChapter?.codes[0]}</div>
                    <h2 className="hb-chapter-title">{isAllSubjects?"Every subject.":currentChapter?.title}</h2>
                    <p className="hb-chapter-note">{isAllSubjects
                      ? "Explore the full academic index. Every entry leads to the courses currently documented on Atlas."
                      : `${selectedCourses.length} catalogued ${selectedCourses.length===1?"course":"courses"}. Select a course on the facing page to read more.`}</p>
                  </div>
                  <BookLines title="AUC ATLAS" number={isAllSubjects?"03":"03"}/>
                </>
              )}
            </div>
          </article>

          <div className="hb-gutter" aria-hidden="true"/>
          <div className="hb-bookmark" aria-hidden="true"/>

          <article className="hb-leaf hb-right-leaf">
            <div key={isIndex?"right-index":isAllSubjects?"right-contents-"+page.page:isSubject?"right-"+page.chapter.label+"-"+page.page:"right-"+page.course.code}
              className="hb-leaf-inner hb-page-transition">
              <div className="hb-topline hb-right-topline">
                <span>{isIndex?"THE INDEX":isAllSubjects?"SUBJECTS A—Z":isSubject?"COURSE INDEX":"COURSE DETAILS"}</span>
                <i/>
                <button type="button" className="hb-search-toggle"
                  aria-label={searchOpen?"Close search":"Search courses, professors and materials"}
                  aria-expanded={searchOpen} onClick={() => setSearchOpen(value=>!value)}>
                  {searchOpen ? <span className="hb-close-icon" aria-hidden="true">×</span> : <SearchIcon />}
                </button>
              </div>

              {isIndex ? (
                <div className="hb-right-content hb-index-content">
                  <h2 className="hb-script-heading">Where would you like to begin?</h2>
                  <ChapterList select={select}/>
                  <button type="button" className="hb-index-item hb-more-item" onClick={()=>setPage({kind:"chapters",page:0})}>
                    <span className="hb-index-num">06</span>
                    <span className="hb-index-label">More subjects</span>
                    <span className="hb-index-arrow" aria-hidden="true">↗</span>
                  </button>
                </div>
              ) : isAllSubjects ? (
                <div className="hb-right-content hb-catalogue-content">
                  <h2 className="hb-script-heading">The complete index</h2>
                  <p className="hb-catalogue-subtitle">Select a subject to open its course catalogue.</p>
                  <div className="hb-catalogue-list">
                    {availableSubjects.map(item=>(
                      <button className="hb-course-row" key={item.label} type="button" onClick={()=>select(item)}>
                        <span className="hb-course-small-code">{item.codes[0]}</span>
                        <span className="hb-course-row-title">{item.title}</span>
                        <span className="hb-index-arrow" aria-hidden="true">↗</span>
                      </button>
                    ))}
                  </div>
                  <div className="hb-pagination">
                    <button type="button" onClick={()=>changePage(-1)} disabled={page.page===0} aria-label="Previous subjects"><Arrow left/></button>
                    <span>{page.page+1} / {maxPage}</span>
                    <button type="button" onClick={()=>changePage(1)} disabled={page.page+1>=maxPage} aria-label="Next subjects"><Arrow/></button>
                  </div>
                </div>
              ) : isSubject ? (
                <div className="hb-right-content hb-catalogue-content">
                  <h2 className="hb-script-heading">Browse the courses</h2>
                  <p className="hb-catalogue-subtitle">{selectedCourses.length} entries in this chapter</p>
                  <div className="hb-catalogue-list">
                    {activeCourses.map(course=>(
                      <button className="hb-course-row" key={course.code} type="button"
                        onClick={()=>setPage({kind:"course",course,chapter:page.chapter,page:page.page})}>
                        <span className="hb-course-small-code">{course.code}</span>
                        <span className="hb-course-row-title">{course.title}</span>
                        <span className="hb-index-arrow" aria-hidden="true">↗</span>
                      </button>
                    ))}
                  </div>
                  <div className="hb-pagination">
                    <button type="button" onClick={()=>changePage(-1)} disabled={page.page===0} aria-label="Previous courses"><Arrow left/></button>
                    <span>{page.page+1} / {maxPage}</span>
                    <button type="button" onClick={()=>changePage(1)} disabled={page.page+1>=maxPage} aria-label="Next courses"><Arrow/></button>
                  </div>
                </div>
              ) : isCourse ? (
                <div className="hb-right-content hb-detail-content">
                  <h2 className="hb-script-heading">About this course</h2>
                  <p className="hb-description">{page.course.description?.trim() || "AUC Atlas has a listing for this course. Open its full page to see current information and available resources."}</p>
                  <div className="hb-detail-divider"/>
                  <span className="hb-detail-eyebrow">CONTINUE READING</span>
                  <a className="hb-destination" href={courseHref(page.course.code)}>
                    <span><b>Full course page</b><small>Course information and available resources</small></span><span aria-hidden="true">↗</span>
                  </a>
                  <a className="hb-destination" href={courseHref(page.course.code)+"#course-materials-access"}>
                    <span><b>Study materials</b><small>Notes, exams, and student uploads when available</small></span><span aria-hidden="true">↗</span>
                  </a>
                  <a className="hb-destination" href="/professors">
                    <span><b>Professor directory</b><small>Read verified student reviews</small></span><span aria-hidden="true">↗</span>
                  </a>
                  <button type="button" className="hb-return-link" onClick={goBack}><Arrow left/> RETURN TO COURSE INDEX</button>
                </div>
              ) : null}

              {isIndex && <div className="hb-book-index-meta">COURSES <span>/</span> PROFESSORS <span>/</span> MATERIALS</div>}
              <BookLines title={isIndex?"THE STUDENT INDEX":"AUC ATLAS / ACADEMICS"} number={isIndex?"02":isCourse?"04":"04"}/>

              {searchOpen && (
                <div className="hb-search-panel" ref={searchArea}>
                  <div className="hb-search-head">
                    <span>SEARCH THE ATLAS</span>
                    <button type="button" aria-label="Close search" onClick={()=>setSearchOpen(false)}>×</button>
                  </div>
                  <p>Search a course, professor, or student material.</p>
                  <HomeSearch />
                  <span className="hb-search-hint">Press Escape to close</span>
                </div>
              )}
            </div>
          </article>
        </div>
        <p className="hb-outside-caption">AN INDEPENDENT STUDENT RESOURCE · NOT AFFILIATED WITH AUC</p>
      </section>
    </main>
  );
}
