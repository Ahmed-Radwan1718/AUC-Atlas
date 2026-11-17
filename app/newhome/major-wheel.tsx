"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import type { SchoolId } from "./wheel-data";
import { SCHOOL_ITEMS, SCHOOL_NAMES } from "./wheel-data";
import type { WheelItem } from "./wheel-data";
import styles from "./major-wheel.module.css";

const PER_PAGE = 8;
const C = 260;
const OUTER = 241;
const INNER = 112;
const LABEL_RADIUS = 182;

type CourseGroup = {
  title?: string;
  scope?: string;
  description?: string;
  items?: unknown[];
  subgroups?: { title?: string; items?: unknown[] }[];
};
type DegreePlan = { note?: string; groups?: CourseGroup[] };
type WheelProps = { school: SchoolId; onClose: () => void };

function point(angle: number, radius: number) {
  const rad = (angle * Math.PI) / 180;
  return {
    x: C + Math.sin(rad) * radius,
    y: C - Math.cos(rad) * radius,
  };
}
function slicePath(index: number, count: number) {
  const span = 360 / count;
  const start = index * span - span / 2 + 0.95;
  const end = (index + 1) * span - span / 2 - 0.95;
  const a = point(start, INNER);
  const b = point(start, OUTER);
  const c = point(end, OUTER);
  const d = point(end, INNER);
  return (
    "M " + a.x + " " + a.y +
    " L " + b.x + " " + b.y +
    " A " + OUTER + " " + OUTER + " 0 0 1 " + c.x + " " + c.y +
    " L " + d.x + " " + d.y +
    " A " + INNER + " " + INNER + " 0 0 0 " + a.x + " " + a.y + " Z"
  );
}
function courseDetail(text: string) {
  const m = text.match(/\b([A-Z]{3,5})\s+(\d{4}[A-Z]?)\b/);
  if (!m) return null;
  const code = m[1] + " " + m[2];
  const name = text.slice(m.index! + m[0].length).replace(/^\s*[-–—:]\s*/, "").trim();
  return {
    code,
    title: name || "View course",
    href: "/courses/" + code.toLowerCase().replace(/[^a-z0-9]+/g, "-") + "#course-materials-access",
  };
}

function CourseBrowser({ major, onBack }: { major: string; onBack: () => void }) {
  const [plan, setPlan] = useState<DegreePlan | null>(null);
  const [status, setStatus] = useState<"loading" | "ready">("loading");
  useEffect(() => {
    let active = true;
    setStatus("loading");
    setPlan(null);
    import("../../data/degree-requirements").then(({ DEGREE_REQUIREMENTS }) => {
      if (!active) return;
      setPlan((DEGREE_REQUIREMENTS as Record<string, DegreePlan>)[major] ?? null);
      setStatus("ready");
    }).catch(() => { if (active) setStatus("ready"); });
    return () => { active = false; };
  }, [major]);

  return <section className={styles.courseBrowser} aria-label={major + " curriculum"}>
    <div className={styles.courseHeader}>
      <button type="button" className={styles.back} onClick={onBack}>
        <span aria-hidden="true">←</span> Major wheel
      </button>
      <div className={styles.eyebrow}>DEGREE REQUIREMENTS</div>
      <h2>{major}</h2>
      <p>Explore courses listed in Atlas&apos;s degree plan. Catalog year, concentrations
        and elective choices can change your requirements.</p>
    </div>
    <div className={styles.courseScroll}>
      {status === "loading" && <p className={styles.empty}>Loading degree requirements…</p>}
      {status === "ready" && !plan && <div className={styles.empty}>
        The degree plan for this major is not yet indexed in Atlas.
        <a href="/courses">Browse all courses ↗</a>
      </div>}
      {status === "ready" && plan?.groups?.map((group, index) => {
        const sublists = [
          { title: "", items: group.items || [] },
          ...(group.subgroups || []).map((sub) => ({
            title: sub.title || "", items: sub.items || [],
          })),
        ];
        return <section key={index} className={styles.group}>
          <h3>{group.title || group.scope || "Requirements"}</h3>
          {group.description && <p className={styles.description}>{group.description}</p>}
          {sublists.map((part, partIndex) => <div key={partIndex}>
            {part.title && <h4 className={styles.subheading}>{part.title}</h4>}
            {part.items.map((value, i) => {
              if (typeof value !== "string") return null;
              const course = courseDetail(value);
              return course ? <a key={i} className={styles.courseRow} href={course.href}>
                <strong>{course.code}</strong>
                <span>{course.title}</span>
                <span className={styles.courseArrow} aria-hidden="true">↗</span>
              </a> : <p key={i} className={styles.courseNote}>{value}</p>;
            })}
          </div>)}
        </section>;
      })}
      {status === "ready" && plan?.note &&
        <p className={styles.courseNote}>{plan.note}</p>}
      {status === "ready" && <a href="/courses" className={styles.browseAll}>
        Browse full course directory <span aria-hidden="true">↗</span>
      </a>}
    </div>
  </section>;
}

export default function MajorWheel({ school, onClose }: WheelProps) {
  const items = SCHOOL_ITEMS[school];
  const schoolName = SCHOOL_NAMES[school];
  const [page, setPage] = useState(0);
  const [hovered, setHovered] = useState(0);
  const [major, setMajor] = useState<string | null>(null);
  const totalPages = Math.ceil(items.length / PER_PAGE);
  const pageItems = useMemo(() => items.slice(page * PER_PAGE, (page + 1) * PER_PAGE), [items, page]);
  const current = pageItems[Math.min(hovered, pageItems.length - 1)];
  const previousFocus = useRef<HTMLElement | null>(null);
  const closeButton = useRef<HTMLButtonElement | null>(null);
  const titleId = useId();

  useEffect(() => {
    previousFocus.current = document.activeElement instanceof HTMLElement
      ? document.activeElement : null;
    closeButton.current?.focus();
    const oldOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = oldOverflow;
      previousFocus.current?.focus();
    };
  }, []);

  useEffect(() => {
    function keyDown(event: KeyboardEvent) {
      if (event.key === "Escape") { event.preventDefault(); onClose(); }
      if (major || event.key !== "ArrowRight" && event.key !== "ArrowLeft") return;
      const total = pageItems.length;
      if (!total) return;
      event.preventDefault();
      const step = event.key === "ArrowRight" ? 1 : -1;
      setHovered(i => (i + step + total) % total);
    }
    window.addEventListener("keydown", keyDown);
    return () => window.removeEventListener("keydown", keyDown);
  }, [onClose, major, pageItems.length]);

  function setNextPage(direction: number) {
    setPage(p => (p + direction + totalPages) % totalPages);
    setHovered(0);
  }
  function select(item: WheelItem) {
    if (item.href) {
      window.location.assign(item.href);
      return;
    }
    setMajor(item.name);
  }
  return <div className={styles.overlay} role="dialog" aria-modal="true"
      aria-labelledby={titleId}>
    <button type="button" className={styles.backdrop} onClick={onClose}
      tabIndex={-1} aria-label="Close major selector"/>
    <div className={styles.heading}>
      <span className={styles.eyebrow}>AUC ATLAS · INTERACTIVE CAMPUS</span>
      <h2 id={titleId}>{schoolName}</h2>
      <p>{major ? "Course requirements" :
        school === "library" ? "Select a library resource" : "Choose your major"}</p>
    </div>
    <button type="button" ref={closeButton} className={styles.close}
      onClick={onClose} aria-label="Close selection wheel">
      <span aria-hidden="true">×</span>
    </button>

    {major ? <CourseBrowser major={major} onBack={() => setMajor(null)}/> :
      <div className={styles.wheelStage}>
        <div className={styles.wheel} aria-label={schoolName + " selection wheel"}>
          <svg className={styles.wheelShape} viewBox="0 0 520 520" aria-hidden="true">
            <defs>
              <radialGradient id="wheel-sheen">
                <stop offset="0" stopColor="#e9c797" stopOpacity=".08" />
                <stop offset="1" stopColor="#fcf0d9" stopOpacity=".26" />
              </radialGradient>
            </defs>
            <circle cx={C} cy={C} r={OUTER + 4}
              fill="none" stroke="#e6c79b" strokeOpacity=".6" strokeWidth="1.5" />
            {pageItems.map((item, i) => <path key={item.name}
              d={slicePath(i, pageItems.length)}
              fill={hovered === i ? "#d7af76" : "rgba(60,77,97,.81)"}
              fillOpacity={hovered === i ? ".9" : "1"}
              stroke={hovered === i ? "#f2d9b0" : "rgba(230,237,245,.26)"}
              strokeWidth={hovered === i ? "2.5" : "1.5"}
              className={styles.slice}
              onPointerEnter={() => setHovered(i)}
              onClick={() => select(item)}
            />)}
            <circle cx={C} cy={C} r={INNER - 6} fill="#0c1829"
              stroke="#e5c38c" strokeOpacity=".65" strokeWidth="2.5"/>
            <circle cx={C} cy={C} r={INNER - 16}
              fill="none" stroke="#bd9864" strokeOpacity=".25" strokeWidth="1"/>
          </svg>

          {pageItems.map((item, i) => {
            const center = point(i * (360 / pageItems.length), LABEL_RADIUS);
            const isActive = hovered === i;
            return <button type="button" key={item.name}
              className={styles.option + (isActive ? " " + styles.activeOption : "")}
              style={{ left: center.x / 520 * 100 + "%",
                top: center.y / 520 * 100 + "%" }}
              aria-label={item.name}
              aria-current={isActive ? "true" : undefined}
              onPointerEnter={() => setHovered(i)}
              onFocus={() => setHovered(i)}
              onClick={() => select(item)}>
              <span className={styles.optionCode}>{String(page * PER_PAGE + i + 1).padStart(2, "0")}</span>
              <span className={styles.optionText}>{item.short}</span>
            </button>;
          })}

          <div className={styles.hub}>
            <span className={styles.hubIcon} aria-hidden="true">{school === "library" ? "✦" : "✧"}</span>
            <strong title={current?.name}>{current?.name || "Select"}</strong>
            <span className={styles.hubHint}>CLICK TO OPEN</span>
          </div>
        </div>
        <div className={styles.pagination} aria-label="Wheel pages">
          {totalPages > 1 && <button type="button"
            onClick={() => setNextPage(-1)} aria-label="Previous majors">←</button>}
          <span>{items.length} {school === "library" ? "RESOURCES" : "MAJORS"}
            {totalPages > 1 ? " · " + (page + 1) + " / " + totalPages : ""}</span>
          {totalPages > 1 && <button type="button"
            onClick={() => setNextPage(1)} aria-label="More majors">→</button>}
        </div>
        <p className={styles.help}>Hover to preview · Click to select · Esc to return</p>
      </div>}
  </div>;
}
