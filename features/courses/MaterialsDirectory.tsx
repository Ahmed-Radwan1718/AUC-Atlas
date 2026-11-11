"use client";

import { useEffect, useMemo, useState } from "react";
import { courses, type Course } from "../../data/courses";
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
  semester: string;
  professor: string;
  fileName: string;
  fileType: string;
  size: number;
  createdAt: string;
  downloadUrl: string;
  uploadGroupId?: string;
};
type DirectoryResponse = {
  materials?: Material[];
  hasMore?: boolean;
  nextCursor?: string | null;
  error?: string;
};
type UploadGroup = { key: string; files: Material[] };
const materialTypes = [
  { label: "All", value: "" },
  { label: "Past exams", value: "Past exam" },
  { label: "Slides", value: "Slides" },
  { label: "Notes", value: "Notes" }
];
const seasons = ["Fall","Summer","Spring","Winter"];
const semesterOptions = Array.from({length: 9},(_,i)=>2026-i).flatMap(year=>
  seasons.map(season=>season+" "+year)
);
const normalize = (value:string) => value.toLowerCase().replace(/[^a-z0-9]+/g," ").trim();
const slug = (value:string) => value.toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-+|-+$/g,"");
const courseHref = (code:string) => "/courses/"+encodeURIComponent(slug(code))+"#course-materials-access";
const sizeLabel = (bytes:number) => {
  if (!Number.isFinite(bytes) || bytes<=0) return "";
  return bytes>=1048576 ? (bytes/1048576).toFixed(1)+" MB" : Math.ceil(bytes/1024)+" KB";
};
const inlineUrl = (url:string) => url+(url.includes("?")?"&":"?")+"disposition=inline";
const formatDate = (value:string) => {
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? "" : d.toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric"});
};

function DownloadIcon() {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75"
    strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M12 3v12m0 0 4-4m-4 4-4-4M4 17v3h16v-3"/>
  </svg>;
}
function DocumentIcon({folder=false}:{folder?:boolean}) {
  return folder ?
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"
      strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M3 6a2 2 0 0 1 2-2h5l2 2h7a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
    </svg> :
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"
      strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M7 3h7l4 4v13a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1z"/>
      <path d="M14 3v5h5M9 12h6M9 16h5"/>
    </svg>;
}
function FileRow({file,child=false}:{file:Material;child?:boolean}) {
  const title = (child ? file.fileName : file.title) || file.fileName || "Study material";
  const metadata = [
    file.semester,
    file.professor,
    sizeLabel(file.size),
    formatDate(file.createdAt)
  ].filter(Boolean).join(" · ");
  return <div className={"material-finder-file"+(child?" is-child":"")}>
    <span className="material-finder-file-icon"><DocumentIcon/></span>
    <div className="material-finder-file-copy">
      <a className="material-finder-file-name" href={inlineUrl(file.downloadUrl)}
        target="_blank" rel="noopener noreferrer"
        title={"Preview "+title}>{title}</a>
      <span className="material-finder-file-info">{metadata}</span>
    </div>
    <a className="material-finder-download" href={file.downloadUrl}
      target="_blank" rel="noopener noreferrer"
      aria-label={"Download "+(file.fileName || title)}
      title={"Download "+(file.fileName || title)}><DownloadIcon/></a>
  </div>;
}

export default function MaterialsDirectory() {
  const [courseQuery,setCourseQuery] = useState("");
  const [selectedCode,setSelectedCode] = useState("");
  const [suggestionsOpen,setSuggestionsOpen] = useState(false);
  const [activeSuggestion,setActiveSuggestion] = useState(0);
  const [type,setType] = useState("");
  const [semester,setSemester] = useState("");
  const [materials,setMaterials] = useState<Material[]>([]);
  const [cursor,setCursor] = useState<string|null>(null);
  const [nextCursor,setNextCursor] = useState<string|null>(null);
  const [loading,setLoading] = useState(false);
  const [locked,setLocked] = useState(false);
  const [error,setError] = useState("");
  const [revision,setRevision] = useState(0);

  const course = useMemo(()=>courses.find(entry=>entry.code===selectedCode),[selectedCode]);
  const suggestions = useMemo(()=>{
    const query=normalize(courseQuery);
    if (query.length<2) return [] as Course[];
    const terms=query.split(" ").filter(Boolean);
    return courses
      .filter(entry=>{
        const text=normalize(entry.code+" "+entry.title);
        return terms.every(term=>text.includes(term));
      })
      .sort((a,b)=>{
        const aCode=normalize(a.code);
        const bCode=normalize(b.code);
        const aRank=aCode===query?0:aCode.startsWith(query)?1:2;
        const bRank=bCode===query?0:bCode.startsWith(query)?1:2;
        return aRank-bRank||a.code.localeCompare(b.code);
      }).slice(0,6);
  },[courseQuery]);

  const groups = useMemo(()=>{
    const byId=new Map<string,UploadGroup>();
    for(const file of materials){
      // Only combine files genuinely uploaded as a bundle; matching titles
      // alone do not establish that two submissions belong together.
      const key=file.uploadGroupId && !file.uploadGroupId.startsWith("single-")
        ? file.uploadGroupId : file.id;
      if (!byId.has(key)) byId.set(key,{key,files:[]});
      byId.get(key)!.files.push(file);
    }
    return [...byId.values()];
  },[materials]);

  function chooseCourse(entry:Course) {
    setCourseQuery(entry.code);
    setSelectedCode(entry.code);
    setSuggestionsOpen(false);
    setCursor(null);
  }
  function changeCourseInput(value:string) {
    setCourseQuery(value);
    const match=courses.find(entry=>
      normalize(entry.code)===normalize(value) || normalize(entry.title)===normalize(value));
    setSelectedCode(match?.code||"");
    setCursor(null);
    setSuggestionsOpen(true);
    setActiveSuggestion(0);
  }
  function handleCourseKey(event:React.KeyboardEvent<HTMLInputElement>) {
    if(event.key==="Escape") {setSuggestionsOpen(false);return;}
    if(!suggestionsOpen||!suggestions.length)return;
    if(event.key==="ArrowDown") {
      event.preventDefault();
      setActiveSuggestion(index=>(index+1)%suggestions.length);
    }else if(event.key==="ArrowUp"){
      event.preventDefault();
      setActiveSuggestion(index=>(index+suggestions.length-1)%suggestions.length);
    }else if(event.key==="Enter"){
      event.preventDefault();
      chooseCourse(suggestions[activeSuggestion]||suggestions[0]);
    }
  }

  useEffect(()=>{
    setupCourseUploadStart();
    const update=()=>{setCursor(null);setRevision(n=>n+1);};
    window.addEventListener("auc-materials-updated",update);
    return ()=>window.removeEventListener("auc-materials-updated",update);
  },[]);

  useEffect(()=>{
    let active=true;
    const controller=new AbortController();
    if(!cursor){setMaterials([]);setNextCursor(null);}
    setError("");
    if(!selectedCode){
      setLoading(false);
      setLocked(false);
      return ()=>{active=false;controller.abort();};
    }
    setLoading(true);
    const timer=window.setTimeout(async()=>{
      try{
        const params=new URLSearchParams({courseCode:selectedCode});
        if(type)params.set("type",type);
        if(semester)params.set("semester",semester);
        if(cursor)params.set("cursor",cursor);
        const response=await fetch("/api/material-directory?"+params.toString(),{
          credentials:"same-origin",cache:"no-store",
          headers:{Accept:"application/json"},signal:controller.signal
        });
        const body=await response.json().catch(()=>({})) as DirectoryResponse;
        if(!active)return;
        if(response.status===401||response.status===403){
          setLocked(true);
          setMaterials([]);
          setNextCursor(null);
          return;
        }
        if(!response.ok)throw Error(body.error||"Could not load study materials.");
        setLocked(false);
        const incoming=Array.isArray(body.materials)?body.materials:[];
        setMaterials(old=>{
          if(!cursor)return incoming;
          const existing=new Set(old.map(item=>item.id));
          return [...old,...incoming.filter(item=>!existing.has(item.id))];
        });
        setNextCursor(body.hasMore&&body.nextCursor?body.nextCursor:null);
      }catch(failure){
        if(!active||controller.signal.aborted)return;
        setError(failure instanceof Error?failure.message:"Could not load study materials.");
      }finally{
        if(active)setLoading(false);
      }
    },0);
    return ()=>{active=false;controller.abort();window.clearTimeout(timer);};
  },[selectedCode,type,semester,cursor,revision]);

  return <>
    <main className="materials-hub">
      <div className="materials-hub-inner">
        <section className="material-finder" aria-labelledby="material-finder-title">
          <div className="material-finder-head">
            <h1 id="material-finder-title">Materials</h1>
            <button id="course-upload-start" className="material-finder-upload"
              type="button" disabled={locked} aria-haspopup="dialog"
              aria-controls="quick-material-upload-modal" aria-expanded="false">
              <span aria-hidden="true">＋</span> Upload
            </button>
          </div>

          <div className="material-finder-field">
            <label htmlFor="material-finder-course">Course</label>
            <div className="material-finder-autocomplete">
              <input id="material-finder-course" type="search"
                value={courseQuery} onChange={event=>changeCourseInput(event.target.value)}
                onFocus={()=>setSuggestionsOpen(true)}
                onBlur={()=>setSuggestionsOpen(false)}
                onKeyDown={handleCourseKey}
                placeholder="Search a course code or name..."
                autoComplete="off"
                role="combobox" aria-autocomplete="list"
                aria-expanded={suggestionsOpen&&suggestions.length>0}
                aria-controls="material-finder-suggestions"/>
              {suggestionsOpen&&suggestions.length>0&&<div id="material-finder-suggestions"
                className="material-finder-suggestions" role="listbox"
                aria-label="Matching courses">
                {suggestions.map((entry,index)=>
                  <button key={entry.code} type="button" role="option"
                    aria-selected={index===activeSuggestion}
                    className={index===activeSuggestion?"is-active":""}
                    onMouseDown={event=>event.preventDefault()}
                    onClick={()=>chooseCourse(entry)}>
                    <strong>{entry.code}</strong><span>{entry.title}</span>
                  </button>)}
              </div>}
            </div>
          </div>

          <fieldset className="material-finder-types">
            <legend>Material type</legend>
            <div className="material-finder-radios">
              {materialTypes.map(option=><label key={option.label} className="material-finder-radio">
                <input type="radio" name="finder-type" value={option.value}
                  checked={type===option.value}
                  onChange={()=>{setType(option.value);setCursor(null);}}/>
                <span>{option.label}</span>
              </label>)}
            </div>
          </fieldset>

          <div className="material-finder-field">
            <label htmlFor="material-finder-semester">Semester</label>
            <select id="material-finder-semester" value={semester}
              onChange={event=>{setSemester(event.target.value);setCursor(null);}}>
              <option value="">All semesters</option>
              {semesterOptions.map(value=><option value={value} key={value}>{value}</option>)}
            </select>
          </div>

          <section className="material-finder-results" aria-labelledby="material-finder-results-title">
            <div className="material-finder-results-head">
              <h2 id="material-finder-results-title">Available materials</h2>
              {selectedCode&&!locked&&!error&&!loading&&<span aria-live="polite">
                {materials.length}{nextCursor?"+":""} {materials.length===1&&!nextCursor?"result":"results"}
              </span>}
            </div>
            {!selectedCode&&<div className="material-finder-message">
              Search for a course above to see its past exams, slides and notes.
            </div>}
            {selectedCode&&course&&!locked&&<div className="material-finder-course-context">
              <span>{course.code} · {course.title}</span>
              <a href={courseHref(course.code)}>View course page</a>
            </div>}
            {locked&&<div className="material-finder-message">
              <strong>Verified AUC account required.</strong>
              <span> <a href="/login">Sign in</a> to view and download materials.</span>
            </div>}
            {error&&<div className="material-finder-message is-error" role="alert">
              {error} <button type="button" onClick={()=>setRevision(n=>n+1)}>Try again</button>
            </div>}
            {selectedCode&&loading&&!cursor&&!locked&&
              <div className="material-finder-loading" role="status" aria-label="Loading materials">
                {Array.from({length:3},(_,index)=><div key={index}><span/><span/></div>)}
              </div>}
            {!locked&&groups.length>0&&<div className="material-finder-list">
              {groups.map(group=>{
                if(group.files.length===1)return <FileRow file={group.files[0]} key={group.key}/>;
                const first=group.files[0];
                return <details key={group.key} className="material-finder-group">
                  <summary className="material-finder-group-head">
                    <span className="material-finder-file-icon"><DocumentIcon folder/></span>
                    <span className="material-finder-file-copy">
                      <span className="material-finder-file-name">{first.title||"Material bundle"}</span>
                      <span className="material-finder-file-info">
                        {group.files.length} files{first.semester?" · "+first.semester:""}
                      </span>
                    </span>
                    <span className="material-finder-expand" aria-hidden="true">⌄</span>
                  </summary>
                  <div className="material-finder-group-children">
                    {group.files.map(file=><FileRow file={file} key={file.id} child/>)}
                  </div>
                </details>;
              })}
            </div>}
            {selectedCode&&!locked&&!loading&&!error&&materials.length===0&&
              <div className="material-finder-message">
                {nextCursor ? "No matches among the newest uploads. Load older files to keep looking." :
                  "No matching materials yet. Try another type or semester."}
              </div>}
            {nextCursor&&!locked&&!error&&<div className="material-finder-pagination">
              <button type="button" disabled={loading} onClick={()=>setCursor(nextCursor)}>
                {loading?"Loading...":"Load older materials"}
              </button>
            </div>}
          </section>
        </section>
      </div>
    </main>
    <CourseDialogs/>
  </>;
}