"use client";

import { useEffect, useMemo, useState } from "react";
import { professors, type Professor } from "../../data/professors";
import "./professors.css";
import "./professors-ui-1.css";
import "./professors-ui-2.css";
import "./professors-ui-3.css";

type RatedProfessor = Professor & { reviewCount: number; averageRating: number };
type RatingSummary = { reviewCount?: number; averageRating?: number };

const department = (item: Professor): string =>
  !item.department || item.department.trim().toLowerCase() === "department coming soon"
    ? "Other" : item.department.trim();
const normalize = (value: unknown) => String(value ?? "").toLowerCase().trim();
const ratingStatus = (value: number): string =>
  !Number.isFinite(value) || value <= 0 ? "No ratings yet"
    : Math.max(1, Math.min(5, Math.round(value))) + (Math.round(value) === 1 ? " star" : " stars");
const photo = (url?: string) => {
  const safe = url?.trim() || "/user.png";
  return safe.includes("res.cloudinary.com") && safe.includes("/image/upload/")
    ? safe.replace("/image/upload/", "/image/upload/f_auto,q_auto:good,c_fill,g_auto,w_720,h_456/") : safe;
};
function initialProfessors(): RatedProfessor[] {
  return professors.map(item => ({ ...item, reviewCount: 0, averageRating: 0 }));
}
function priority(item: RatedProfessor): number {
  const hasPhoto = Boolean(item.image && item.image.trim() !== "user.png");
  const hasReviews = item.reviewCount > 0;
  return hasPhoto && hasReviews ? 0 : hasPhoto ? 1 : hasReviews ? 2 : 3;
}
const departments = [...new Set(professors.map(department))].filter(x => x !== "Other").sort((a,b)=>a.localeCompare(b));
const ratingChoices = [1,2,3,4,5];

export default function Professors() {
  const [items, setItems] = useState<RatedProfessor[]>(initialProfessors);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [query, setQuery] = useState("");
  const [departmentOpen, setDepartmentOpen] = useState(false);
  const [ratingOpen, setRatingOpen] = useState(false);
  const [selectedDepartments, setSelectedDepartments] = useState<string[]>([]);
  const [selectedRatings, setSelectedRatings] = useState<string[]>([]);
  const [visibleLimit, setVisibleLimit] = useState(30);
  useEffect(() => {
    let active = true;
    fetch("/api/professor-reviews?summaries=true", {
      credentials: "same-origin", cache: "no-store",
      headers: { Accept: "application/json" }
    }).then(async response => {
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw Error(data.error || "Could not load professor ratings.");
      return data as { summaries: Record<string, RatingSummary> };
    }).then(data => {
      if (!active) return;
      setItems(professors.map(item => ({
        ...item,
        reviewCount: Math.max(0, Math.floor(Number(data.summaries?.[item.id]?.reviewCount || 0))),
        averageRating: Math.max(0, Number(data.summaries?.[item.id]?.averageRating || 0))
      })));
    }).catch(() => { if (active) setFailed(true); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  const results = useMemo(() => items.filter(item => {
    const searchable = normalize([
      item.id, item.name, item.department, item.displayDepartment,
      item.filterDepartment, item.status, ratingStatus(item.averageRating),
      item.course, item.group
    ].join(" "));
    return (!query || searchable.includes(normalize(query)))
      && (!selectedDepartments.length || selectedDepartments.includes(department(item)))
      && (!selectedRatings.length || selectedRatings.includes(ratingStatus(item.averageRating)));
  }).sort((a,b) => priority(a) - priority(b)
    || b.reviewCount - a.reviewCount || a.name.localeCompare(b.name)), [items,query,selectedDepartments,selectedRatings]);

  function toggle(list: string[], item: string, setter: (value: string[]) => void) {
    setter(list.includes(item) ? list.filter(x=>x!==item) : [...list,item]);
    setVisibleLimit(30);
  }
  return (
    <main className="professors-page">
      <div className="professors-inner">
        <section className="professors-browser" aria-label="Professor filters and results">
          <aside className="filters-panel" id="professor-filters">
            <div className="filters-heading">Filter Professors</div>
            <div className={`filter-item ${departmentOpen ? "open" : ""}`}>
              <button className="filter-toggle" type="button" onClick={() => setDepartmentOpen(x=>!x)}>
                <span>Department</span><span className="chevron">⌄</span>
              </button>
              <div className="filter-content department-filter-content" id="department-filter-options">
                {departments.map(name => <label key={name}>
                  <input type="checkbox" data-filter-group="department" value={name}
                    checked={selectedDepartments.includes(name)}
                    onChange={() => toggle(selectedDepartments,name,setSelectedDepartments)} />{" "}{name}
                </label>)}
              </div>
            </div>
            <div className={`filter-item ${ratingOpen ? "open" : ""}`}>
              <button className="filter-toggle" type="button" onClick={() => setRatingOpen(x=>!x)}>
                <span>Rating Status</span><span className="chevron">⌄</span>
              </button>
              <div className="filter-content">
                {ratingChoices.map(value => {
                  const choice = value + (value===1?" star":" stars");
                  return <label className="rating-filter-option" key={value}>
                    <input type="checkbox" data-filter-group="status" value={choice}
                      checked={selectedRatings.includes(choice)}
                      onChange={() => toggle(selectedRatings,choice,setSelectedRatings)} />
                    <span className="rating-filter-stars">{"★".repeat(value)}</span>
                    <span>{choice}</span>
                  </label>;
                })}
              </div>
            </div>
          </aside>
          <section className="professors-results">
            <div className="professors-search-box">
              <input id="professor-search-input" type="search" placeholder="Search professors..."
                aria-label="Search professors" value={query}
                onChange={event=>{setQuery(event.target.value);setVisibleLimit(30);}}/>
            </div>
            <section className="professors-grid" id="professors-grid" aria-label={loading?"Loading professors and reviews":"Professor list"}
              aria-busy={loading}>
              {loading ? Array.from({length:4},(_,index)=><div className="professor-loading-card" aria-hidden="true" key={index}>
                <div className="professor-loading-image"/>
                <div className="professor-loading-body">
                  <span className="professor-loading-line is-title"/>
                  <span className="professor-loading-line is-detail"/>
                  <span className="professor-loading-line is-short"/>
                </div>
              </div>) : <>
                {results.slice(0,visibleLimit).map((item,index) => {
                  const rating = item.reviewCount && Number.isFinite(item.averageRating) && item.averageRating>0
                    ? "★".repeat(Math.max(1,Math.min(5,Math.round(item.averageRating)))) + " " + item.averageRating.toFixed(1)
                    : "No Stars Yet";
                  return <a className="professor-card" key={item.id} href={"/professors/"+encodeURIComponent(item.id)}
                    aria-label={"Open "+item.name+" profile"}>
                    <div className="professor-card-image">
                      <img src={photo(item.image)} alt={item.name} width={720} height={456}
                        loading={index<8?"eager":"lazy"} decoding="async"/>
                    </div>
                    <div className="professor-card-body">
                      <h2>{item.name}</h2>
                      <div className="professor-meta">
                        <span>{item.displayDepartment||item.department}</span>
                        <span>{failed?"Reviews unavailable":item.reviewCount+" "+(item.reviewCount===1?"Review":"Reviews")}</span>
                        <span>{failed?"Ratings unavailable":rating}</span>
                      </div>
                    </div>
                  </a>;
                })}
                {!results.length && <p className="professors-empty">No professors match those filters.</p>}
                {results.length>visibleLimit && <button className="professors-view-more" type="button"
                  onClick={()=>setVisibleLimit(x=>x+30)}>
                  View {Math.min(30,results.length-visibleLimit)} more
                  <span>{results.length-visibleLimit} remaining</span>
                </button>}
              </>}
            </section>
          </section>
        </section>
      </div>
    </main>
  );
}
