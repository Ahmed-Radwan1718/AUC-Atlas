"use client";

import { useEffect, useLayoutEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { professors, type Professor } from "../../data/professors";
import "./professors.css";
import "./professors-ui-1.css";
import "./professors-ui-2.css";
import "./professors-ui-3.css";

type RatedProfessor = Professor & { reviewCount: number; averageRating: number };
type RatingSummary = { reviewCount?: number; averageRating?: number };
type CardSnapshot = { element: HTMLAnchorElement; rect: DOMRect };

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
const departments = [...new Set(professors.map(department))].filter(x => x !== "Other").sort((a,b)=>a.localeCompare(b));
const ratingChoices = [1,2,3,4,5];

export default function Professors() {
  const [items, setItems] = useState<RatedProfessor[]>(initialProfessors);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [reviewsLocked, setReviewsLocked] = useState(false);
  const [query, setQuery] = useState("");
  const [departmentOpen, setDepartmentOpen] = useState(false);
  const [ratingOpen, setRatingOpen] = useState(false);
  const [selectedDepartments, setSelectedDepartments] = useState<string[]>([]);
  const [selectedRatings, setSelectedRatings] = useState<string[]>([]);
  const [visibleLimit, setVisibleLimit] = useState(30);
  const gridRef = useRef<HTMLElement | null>(null);
  const previousCardsRef = useRef<Map<string, CardSnapshot> | null>(null);
  const cardAnimationsRef = useRef<Map<string, Animation>>(new Map());
  const leavingCardsRef = useRef<Set<HTMLAnchorElement>>(new Set());

  // Remember each card's *current visual position*, including mid-animation,
  // before React changes the results. No debounce or delay to the search input.
  function updateWithFluidLayout(update: () => void) {
    const grid = gridRef.current;
    if (!grid || loading || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      previousCardsRef.current = null;
      update();
      return;
    }

    const snapshot = new Map<string, CardSnapshot>();
    grid.querySelectorAll<HTMLAnchorElement>(".professor-card[data-professor-id]").forEach(card => {
      const id = card.dataset.professorId;
      if (id) snapshot.set(id, { element: card, rect: card.getBoundingClientRect() });
    });
    previousCardsRef.current = snapshot;
    update();
  }

  function updateSearch(value: string) {
    updateWithFluidLayout(() => {
      setQuery(value);
      setVisibleLimit(30);
    });
  }

  useEffect(() => {
    let active = true;
    fetch("/api/professor-reviews?summaries=true", {
      credentials: "same-origin", cache: "no-store",
      headers: { Accept: "application/json" }
    }).then(async response => {
      if (response.status === 401) return { summaries: {} as Record<string, RatingSummary>, locked: true };
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw Error(data.error || "Could not load professor ratings.");
      return { summaries: (data as { summaries: Record<string, RatingSummary> }).summaries, locked: false };
    }).then(data => {
      if (!active) return;
      setReviewsLocked(data.locked);
      setItems(professors.map(item => ({
        ...item,
        reviewCount: data.locked ? 0 : Math.max(0, Math.floor(Number(data.summaries?.[item.id]?.reviewCount || 0))),
        averageRating: data.locked ? 0 : Math.max(0, Number(data.summaries?.[item.id]?.averageRating || 0))
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
  // Sort strictly by average rating (highest first). Equal ratings retain source order.
  }).sort((a,b) => b.averageRating - a.averageRating), [items,query,selectedDepartments,selectedRatings]);

  // FLIP: measure old positions, let React reflow, then animate the difference.
  // Reading positions while an old animation is active lets rapid typing
  // continue from the card's visible position rather than snapping back.
  useLayoutEffect(() => {
    const previous = previousCardsRef.current;
    previousCardsRef.current = null;
    const grid = gridRef.current;
    if (!previous || !grid) return;

    const current = new Map<string, HTMLAnchorElement>();
    grid.querySelectorAll<HTMLAnchorElement>(".professor-card[data-professor-id]").forEach(card => {
      const id = card.dataset.professorId;
      if (id) current.set(id, card);
    });

    // Cancel old transforms before measuring final layout. Nothing paints
    // between this cancellation and the replacement animations.
    for (const animation of cardAnimationsRef.current.values()) animation.cancel();
    cardAnimationsRef.current.clear();

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    for (const [id, card] of current) {
      const old = previous.get(id);
      if (!old) {
        // A newly matching professor appears gently, without scaling.
        const animation = card.animate([{ opacity: 0 }, { opacity: 1 }], {
          duration: 170, easing: "ease-out"
        });
        cardAnimationsRef.current.set(id, animation);
        animation.onfinish = () => {
          if (cardAnimationsRef.current.get(id) === animation) cardAnimationsRef.current.delete(id);
        };
        continue;
      }

      const target = card.getBoundingClientRect();
      const dx = old.rect.left - target.left;
      const dy = old.rect.top - target.top;
      if (Math.abs(dx) < 0.5 && Math.abs(dy) < 0.5) continue;

      // Preserve an existing hover transform when a card is repositioned.
      const base = window.getComputedStyle(card).transform;
      const start = `translate(${dx}px, ${dy}px)${base === "none" ? "" : " " + base}`;
      const end = base === "none" ? "translate(0px, 0px)" : base;
      const animation = card.animate([{ transform: start }, { transform: end }], {
        duration: 240, easing: "cubic-bezier(0.22, 1, 0.36, 1)", fill: "both"
      });
      cardAnimationsRef.current.set(id, animation);
      animation.onfinish = () => {
        if (cardAnimationsRef.current.get(id) === animation) cardAnimationsRef.current.delete(id);
        animation.cancel(); // Remove the temporary transform; preserve :hover styles.
      };
    }

    // React removes nonmatching cards immediately. Fade a short-lived visual
    // copy at the card's former screen coordinates so they don't disappear.
    for (const [id, old] of previous) {
      if (current.has(id)) continue;
      const { rect } = old;
      if (rect.bottom < 0 || rect.top > window.innerHeight) continue;
      const ghost = old.element.cloneNode(true) as HTMLAnchorElement;
      ghost.setAttribute("aria-hidden", "true");
      ghost.tabIndex = -1;
      ghost.inert = true;
      Object.assign(ghost.style, {
        position: "fixed",
        top: rect.top + "px",
        left: rect.left + "px",
        width: rect.width + "px",
        height: rect.height + "px",
        margin: "0",
        transform: "none",
        transition: "none",
        pointerEvents: "none",
        zIndex: "5"
      });
      document.body.appendChild(ghost);
      leavingCardsRef.current.add(ghost);
      const disappear = () => {
        ghost.remove();
        leavingCardsRef.current.delete(ghost);
      };
      const animation = ghost.animate([{ opacity: 1 }, { opacity: 0 }], {
        duration: 160, easing: "ease-in"
      });
      animation.onfinish = disappear;
      animation.oncancel = disappear;
    }

    // Match the empty state to the same gentle entrance.
    const empty = grid.querySelector<HTMLElement>(".professors-empty");
    if (empty && previous.size) {
      empty.animate([{ opacity: 0 }, { opacity: 1 }], {
        duration: 170, easing: "ease-out"
      });
    }
  }, [results, visibleLimit, loading]);

  useEffect(() => () => {
    for (const animation of cardAnimationsRef.current.values()) animation.cancel();
    cardAnimationsRef.current.clear();
    for (const ghost of leavingCardsRef.current) ghost.remove();
    leavingCardsRef.current.clear();
  }, []);

  function toggle(list: string[], item: string, setter: (value: string[]) => void) {
    updateWithFluidLayout(() => {
      setter(list.includes(item) ? list.filter(x => x !== item) : [...list, item]);
      setVisibleLimit(30);
    });
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
            <div className={`filter-item ${ratingOpen ? "open" : ""}`} hidden={reviewsLocked}>
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
                onChange={event=>updateSearch(event.target.value)}/>
            </div>
            {reviewsLocked && <p className="professors-empty" role="status">
              <a href="/login">Sign in with your verified AUC account</a> to see professor ratings and reviews.
            </p>}
            <section className="professors-grid" id="professors-grid" ref={gridRef} aria-label={loading?"Loading professors and reviews":"Professor list"}
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
                    ? <><span className="professor-card-stars" aria-hidden="true" style={{ "--star-fill": `${Math.min(5, Math.max(0, item.averageRating)) * 20}%` } as CSSProperties}/>{" " + item.averageRating.toFixed(1)}</>
                    : "No Stars Yet";
                  return <a className="professor-card" key={item.id} data-professor-id={item.id} href={"/professors/"+encodeURIComponent(item.id)}
                    aria-label={"Open "+item.name+" profile"}>
                    <div className="professor-card-image">
                      <img src={photo(item.image)} alt={item.name} width={720} height={456}
                        loading={index<8?"eager":"lazy"} decoding="async"/>
                    </div>
                    <div className="professor-card-body">
                      <h2>{item.name}</h2>
                      <div className="professor-meta">
                        <span>{item.displayDepartment||item.department}</span>
                        <span>{reviewsLocked?"Reviews for verified accounts":failed?"Reviews unavailable":item.reviewCount+" "+(item.reviewCount===1?"Review":"Reviews")}</span>
                        <span>{reviewsLocked?"Sign in to view ratings":failed?"Ratings unavailable":rating}</span>
                      </div>
                    </div>
                  </a>;
                })}
                {!results.length && <p className="professors-empty">No professors match those filters.</p>}
                {results.length>visibleLimit && <button className="professors-view-more" type="button"
                  onClick={()=>updateWithFluidLayout(() => setVisibleLimit(x=>x+30))}>
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
