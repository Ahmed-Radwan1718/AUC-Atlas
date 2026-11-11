"use client";

import { useEffect, useMemo, useState } from "react";
import { courses } from "../../data/courses";
import CourseDialogs from "./CourseDialogs";
import { setupCourseUploadStart } from "./materialUploadDialog";
import "./courses-1.css";
import "./courses-2.css";
import "./courses-3.css";
import "./courses-4.css";
import "./courses-5.css";
import "./materials-directory.css";

type Material = {
  id: string;
  title: string;
  courseCode: string;
  courseTitle: string;
  materialType: string;
  professor: string;
  semester: string;
  fileName: string;
  fileType: string;
  size: number;
  createdAt: string;
  downloadUrl: string;
};
type DirectoryResponse = {
  materials?: Material[];
  hasMore?: boolean;
  nextCursor?: string | null;
  error?: string;
};
const filters = [
  { value: "", label: "All files" },
  { value: "Past exam", label: "Past exams" },
  { value: "Notes", label: "Notes" },
  { value: "Slides", label: "Slides" },
  { value: "Practice sheet", label: "Practice sheets" },
  { value: "Past assignments", label: "Assignments" },
  { value: "Review sheet", label: "Review sheets" },
  { value: "Lab file", label: "Lab files" },
  { value: "Syllabus", label: "Syllabi" }
];
const slug = (value: string) => value.trim().toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-+|-+$/g,"");
const courseLink = (code: string) => code ? "/courses/" + encodeURIComponent(slug(code)) + "#course-materials-access" : "/courses";
const formatDate = (value: string) => {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Date unavailable" :
    date.toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric"});
};
const formatSize = (bytes: number) => {
  if(!Number.isFinite(bytes)||bytes<=0)return "";
  return bytes>=1024*1024 ? (bytes/(1024*1024)).toFixed(1)+" MB" : Math.max(1,Math.ceil(bytes/1024))+" KB";
};
const iconName = (file: Material) => {
  const ext = (file.fileName.match(/\.([a-z0-9]+)$/i)?.[1] || "").toLowerCase();
  const icons: Record<string,string> = {
    pdf:"pdf.png",doc:"doc.png",docx:"doc.png",ppt:"ppt.png",pptx:"ppt.png",
    xls:"xls.png",xlsx:"xls.png",png:"png.png",jpg:"jpg.png",jpeg:"jpg.png"
  };
  return icons[ext] ? "/"+icons[ext] : "";
};
const normalize = (value:string) => value.toLowerCase().replace(/[^a-z0-9]+/g," ").trim();
const courseIndex = new Map(courses.map(course=>[normalize(course.code),course.title]));

export default function MaterialsDirectory() {
  const [search, setSearch] = useState("");
  const [type, setType] = useState("");
  const [semester, setSemester] = useState("");
  const [materials, setMaterials] = useState<Material[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [locked, setLocked] = useState(false);
  const [error, setError] = useState("");
  const [revision, setRevision] = useState(0);

  useEffect(() => {
    setupCourseUploadStart();
    const update = () => { setCursor(null); setRevision(value=>value+1); };
    window.addEventListener("auc-materials-updated",update);
    return () => window.removeEventListener("auc-materials-updated",update);
  }, []);

  useEffect(() => {
    let alive = true;
    const controller = new AbortController();
    setLoading(true);
    setError("");
    if (!cursor) {
      setMaterials([]);
      setNextCursor(null);
    }
    const timeout = window.setTimeout(async () => {
      try {
        const params = new URLSearchParams();
        if (search.trim()) params.set("q",search.trim());
        if (type) params.set("type",type);
        if (semester) params.set("semester",semester);
        if (cursor) params.set("cursor",cursor);
        const response = await fetch("/api/material-directory?"+params.toString(),{
          credentials:"same-origin",cache:"no-store",
          headers:{Accept:"application/json"},signal:controller.signal
        });
        const data = await response.json().catch(()=>({})) as DirectoryResponse;
        if (!alive) return;
        if (response.status === 401 || response.status === 403) {
          setLocked(true);
          setMaterials([]);
          setNextCursor(null);
          return;
        }
        if (!response.ok) throw new Error(data.error || "Could not load study materials.");
        setLocked(false);
        const incoming = Array.isArray(data.materials) ? data.materials : [];
        setMaterials(previous => {
          if(!cursor)return incoming;
          const seen = new Set(previous.map(item=>item.id));
          return [...previous,...incoming.filter(item=>!seen.has(item.id))];
        });
        setNextCursor(data.hasMore && data.nextCursor ? data.nextCursor : null);
      } catch (failure) {
        if (!alive || controller.signal.aborted) return;
        setError(failure instanceof Error ? failure.message : "Could not load study materials.");
      } finally {
        if (alive) setLoading(false);
      }
    },search && !cursor ? 300 : 0);
    return () => {
      alive = false;
      controller.abort();
      window.clearTimeout(timeout);
    };
  },[search,type,semester,cursor,revision]);

  const relatedCourses = useMemo(() => {
    const query = normalize(search);
    if (query.length<2) return [];
    const terms = query.split(" ").filter(Boolean);
    return courses.filter(course => {
      const haystack = normalize([course.code,course.title].join(" "));
      return terms.every(term=>haystack.includes(term));
    }).slice(0,5);
  },[search]);

  const resetPage = () => setCursor(null);
  const hasFilters = Boolean(search || type || semester);
  const loadingFirstPage = loading && !cursor;

  return <>
    <main className="materials-hub">
      <div className="materials-hub-inner">
        <div className="materials-hub-toolbar">
          <h1>Materials</h1>
          <button id="course-upload-start" className="materials-primary-action"
            type="button" disabled={locked} aria-haspopup="dialog"
            aria-controls="quick-material-upload-modal" aria-expanded="false">
            <span aria-hidden="true">＋</span> Upload material
          </button>
        </div>

        <section className="materials-search-panel" aria-label="Find study materials">
          <label className="materials-search-field" htmlFor="materials-search-input">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <circle cx="10.8" cy="10.8" r="6.7"/><path d="m16 16 5 5"/>
            </svg>
            <input id="materials-search-input" type="search" value={search}
              onChange={event=>{setSearch(event.target.value);resetPage();}}
              autoComplete="off" placeholder="Search MATH 2010, midterms, lecture notes, professors..."
              aria-label="Search materials by title, course, or professor"/>
          </label>
          <div className="materials-filter-row">
            <div className="materials-type-filters" role="group" aria-label="Filter by material type">
              {filters.map(filter=><button key={filter.value} type="button"
                className={"materials-type-chip"+(filter.value===type?" is-selected":"")}
                aria-pressed={filter.value===type}
                onClick={()=>{setType(filter.value);resetPage();}}>{filter.label}</button>)}
            </div>
          </div>
        </section>

        <section className="materials-directory-section" aria-labelledby="materials-directory-title">
          <div className="materials-directory-top">
            <div>
              <span className="materials-section-kicker">The library</span>
              <h2 id="materials-directory-title">{hasFilters ? "Search results" : "Recently uploaded"}</h2>
              <p>Browse study files from newest to oldest. Open or download a file, or visit its course page.</p>
            </div>
            <label className="materials-semester-label" htmlFor="materials-semester-select">
              Semester
              <select id="materials-semester-select" value={semester}
                onChange={event=>{setSemester(event.target.value);resetPage();}}>
                <option value="">All semesters</option>
                {["Fall 2026","Summer 2026","Spring 2026","Winter 2026","Fall 2025","Summer 2025","Spring 2025","Winter 2025","Fall 2024","Spring 2024","Fall 2023","Spring 2023","Fall 2022","Spring 2022"].map(item=>
                  <option key={item} value={item}>{item}</option>)}
              </select>
            </label>
          </div>

          {locked ? <div className="materials-directory-empty">
            <div className="materials-empty-symbol" aria-hidden="true">🔒</div>
            <h3>Study materials are for verified AUC students.</h3>
            <p>Sign in with your verified university email to browse, preview and download files shared by students.</p>
            <a href="/login" className="materials-primary-link">Sign in to browse</a>
          </div> : <>
            {error && <div className="materials-directory-error" role="alert">
              <p>{error}</p>
              <button type="button" onClick={()=>setRevision(n=>n+1)}>Try again</button>
            </div>}
            {loadingFirstPage && <div className="materials-file-list" aria-label="Loading materials" aria-busy="true">
              {Array.from({length:5},(_,i)=><div className="materials-file-skeleton" key={i} aria-hidden="true"><span/><div><i/><i/></div><span/></div>)}
            </div>}
            {!!materials.length && <div className="materials-file-list">
              {materials.map(file=>{
                const name = file.title || file.fileName || "Course material";
                const courseTitle = file.courseTitle || courseIndex.get(normalize(file.courseCode)) || "";
                const icon = iconName(file);
                const details = [
                  file.professor,
                  file.semester,
                  formatSize(file.size),
                  formatDate(file.createdAt)
                ].filter(Boolean);
                return <article className="materials-file-row" key={file.id}>
                  <div className="materials-file-icon" aria-hidden="true">
                    {icon ? <img src={icon} alt=""/> : <span>FILE</span>}
                  </div>
                  <div className="materials-file-details">
                    <div className="materials-file-tagline">
                      <span className="materials-file-type">{file.materialType || "Material"}</span>
                      {file.courseCode && <span className="materials-file-course-code">{file.courseCode}</span>}
                    </div>
                    <h3>{name}</h3>
                    {courseTitle && <p className="materials-file-course-title">{courseTitle}</p>}
                    <p className="materials-file-meta">{details.join(" · ")}</p>
                  </div>
                  <div className="materials-file-actions">
                    {file.downloadUrl && <a className="materials-download-link" href={file.downloadUrl}
                      target="_blank" rel="noopener noreferrer">Download <span aria-hidden="true">↗</span></a>}
                    {file.courseCode && <a className="materials-course-link" href={courseLink(file.courseCode)}>View course</a>}
                  </div>
                </article>;
              })}
            </div>}
            {!loading && !materials.length && !error && <div className="materials-directory-empty">
              <div className="materials-empty-symbol" aria-hidden="true">⌕</div>
              <h3>{hasFilters ? "No matching files on this page." : "No materials uploaded yet."}</h3>
              <p>{nextCursor ? "Try browsing older uploads to find more matches." :
                hasFilters ? "Try a different course code or remove a filter." :
                "When students upload their first files, they’ll appear here."}</p>
              {hasFilters && <button type="button" className="materials-clear-filters"
                onClick={()=>{setSearch("");setType("");setSemester("");resetPage();}}>Clear filters</button>}
            </div>}
            {nextCursor && !error && <div className="materials-load-more">
              <button type="button" onClick={()=>setCursor(nextCursor)} disabled={loading}>
                {loading ? "Loading older files..." : "Load more materials"}
              </button>
            </div>}
          </>}

          {!!relatedCourses.length && <div className="materials-course-suggestions">
            <div className="materials-course-suggestions-heading">
              <h3>Matching courses</h3>
              <p>Looking for a particular course? Go straight to its material collection.</p>
            </div>
            <div className="materials-course-suggestion-list">
              {relatedCourses.map(course=><a href={courseLink(course.code)} key={course.code}>
                <strong>{course.code}</strong><span>{course.title}</span><span aria-hidden="true">↗</span>
              </a>)}
            </div>
          </div>}
        </section>
      </div>
    </main>
    <CourseDialogs/>
  </>;
}
