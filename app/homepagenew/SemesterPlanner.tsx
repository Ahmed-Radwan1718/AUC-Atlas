"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { courses } from "../../data/courses";
import { DEGREE_REQUIREMENTS } from "../../data/degree-requirements";
import type { DegreeRequirementGroup } from "./degreeProgressSummary";

type Semester = { name: string; courses: string[] };
type AccountState = "loading" | "signed-in" | "guest" | "error";
type SaveState = "idle" | "unsaved" | "saving" | "saved" | "error";

const courseByCode = new Map(courses.map(course => [course.code, course]));

function currentSemester(): string {
  const today = new Date();
  const month = today.getMonth();
  const year = today.getFullYear();
  return (month >= 8 ? "Fall " : month >= 5 ? "Summer " : "Spring ") + year;
}

function nextRegularSemester(name: string): string {
  const [term, yearString] = name.split(" ");
  const year = Number(yearString);
  return term === "Fall" ? "Spring " + (year + 1) : "Fall " + year;
}

function defaultSemesters(): Semester[] {
  const first = currentSemester();
  const second = nextRegularSemester(first);
  return [first, second, nextRegularSemester(second)].map(name => ({ name, courses: [] }));
}

function courseUrl(code: string): string {
  return "/courses/" + encodeURIComponent(code.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""));
}

function remainingDegreeCourses(major: string, completedKeys: readonly string[]): string[] {
  const plan = (DEGREE_REQUIREMENTS as Record<string, { groups?: DegreeRequirementGroup[] }>)[major];
  if (!Array.isArray(plan?.groups)) return [];
  const completed = new Set(completedKeys);
  const finishedCodes = new Set<string>();
  const pending: string[] = [];

  const readItems = (items: string[] | undefined, prefix: string) => {
    items?.forEach((item, index) => {
      const code = item.match(/^\s*([A-Z]{2,6}\s+\d{3,4}[A-Z]?)\s+-/i)?.[1]?.toUpperCase();
      if (!code || !courseByCode.has(code)) return;
      if (completed.has(prefix + "-" + index)) finishedCodes.add(code);
      else pending.push(code);
    });
  };

  plan.groups.forEach((group, index) => {
    readItems(group.items, String(index));
    group.subgroups?.forEach((subgroup, subIndex) => {
      readItems(subgroup.items, index + "-" + subIndex);
    });
  });

  return [...new Set(pending)].filter(code => !finishedCodes.has(code));
}

export default function SemesterPlanner() {
  const [semesters, setSemesters] = useState<Semester[]>(() => defaultSemesters());
  const [active, setActive] = useState(() => currentSemester());
  const [account, setAccount] = useState<AccountState>("loading");
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [major, setMajor] = useState("");
  const [completedKeys, setCompletedKeys] = useState<string[]>([]);
  const drawerRef = useRef<HTMLDialogElement>(null);
  const closingDrawer = useRef(false);
  const [addedThisSession, setAddedThisSession] = useState<string[]>([]);
  const [query, setQuery] = useState("");
  const [revision, setRevision] = useState(0);
  const latestRevision = useRef(0);
  const saveQueue = useRef<Promise<void>>(Promise.resolve());

  useEffect(() => {
    let live = true;
    async function load() {
      try {
        const response = await fetch("/api/semester-plan", {
          credentials: "same-origin", cache: "no-store", headers: { Accept: "application/json" }
        });
        if (!live) return;
        if (response.status === 401) {
          setAccount("guest");
          return;
        }
        if (!response.ok) throw new Error("Could not load saved semesters.");
        const saved = await response.json() as { semesters?: Semester[] };
        if (!live) return;
        if (Array.isArray(saved.semesters) && saved.semesters.length) {
          setSemesters(saved.semesters);
          setActive(saved.semesters[0].name);
        }
        const [meResponse, progressResponse] = await Promise.all([
          fetch("/api/me", { credentials: "same-origin", cache: "no-store" }),
          fetch("/api/academic-progress", { credentials: "same-origin", cache: "no-store" })
        ]);
        if (!live) return;
        if (meResponse.ok && progressResponse.ok) {
          const me = await meResponse.json() as { user?: { major?: string } };
          const progress = await progressResponse.json() as {
            degreeProgress?: { major?: string; completedKeys?: string[] } | null
          };
          if (!live) return;
          const selectedMajor = String(me.user?.major || "").trim();
          setMajor(selectedMajor);
          setCompletedKeys(progress.degreeProgress?.major === selectedMajor &&
            Array.isArray(progress.degreeProgress?.completedKeys)
              ? progress.degreeProgress.completedKeys : []);
        }
        setAccount("signed-in");
      } catch {
        if (live) setAccount("error");
      }
    }
    void load();
    return () => { live = false; };
  }, []);

  useEffect(() => {
    if (account !== "signed-in" || revision === 0) return;
    const snapshot = semesters;
    const thisRevision = revision;
    const timer = window.setTimeout(() => {
      setSaveState("saving");
      const save = async () => {
        const response = await fetch("/api/semester-plan", {
          method: "POST",
          credentials: "same-origin",
          headers: { "Content-Type": "application/json", Accept: "application/json" },
          body: JSON.stringify({ semesters: snapshot })
        });
        if (!response.ok) throw new Error("Could not save semester plan.");
      };
      const pending = saveQueue.current.catch(() => undefined).then(save);
      saveQueue.current = pending;
      void pending.then(
        () => { if (latestRevision.current === thisRevision) setSaveState("saved"); },
        () => { if (latestRevision.current === thisRevision) setSaveState("error"); }
      );
    }, 650);
    return () => window.clearTimeout(timer);
  }, [account, revision, semesters]);

  const planned = useMemo(
    () => new Set(semesters.flatMap(semester => semester.courses)),
    [semesters]
  );
  const degreeOptions = useMemo(
    () => remainingDegreeCourses(major, completedKeys),
    [major, completedKeys]
  );
  const availableCourses = useMemo(() => {
    const needle = query.trim().toLowerCase();
    const added = new Set(addedThisSession);
    const canShow = (code: string) => !planned.has(code) || added.has(code);
    if (!needle) return degreeOptions.filter(canShow)
      .map(code => courseByCode.get(code)!);
    return courses.filter(course =>
      canShow(course.code) &&
      (course.code.toLowerCase().includes(needle) ||
        course.title.toLowerCase().includes(needle))
    ).sort((a, b) =>
      Number(b.code.toLowerCase().startsWith(needle)) -
      Number(a.code.toLowerCase().startsWith(needle)) ||
      a.code.localeCompare(b.code)
    ).slice(0, 50);
  }, [degreeOptions, planned, query, addedThisSession]);

  const selected = semesters.find(semester => semester.name === active) || semesters[0];
  const canEdit = account !== "loading" && account !== "error";
  const semesterFull = (selected?.courses.length || 0) >= 20;

  const openCourseDrawer = () => {
    const drawer = drawerRef.current;
    if (!drawer || drawer.open || !canEdit || semesterFull) return;
    setQuery("");
    setAddedThisSession([]);
    closingDrawer.current = false;
    drawer.showModal();
    drawer.focus({ preventScroll: true });
  };

  const closeCourseDrawer = () => {
    const drawer = drawerRef.current;
    if (!drawer?.open || closingDrawer.current) return;
    closingDrawer.current = true;
    const finish = () => {
      if (drawer.open) drawer.close();
      drawer.classList.remove("is-closing");
      closingDrawer.current = false;
    };
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches || !drawer.animate) {
      finish();
      return;
    }
    const startTransform = getComputedStyle(drawer).transform;
    drawer.classList.add("is-closing");
    const animation = drawer.animate(
      [{ transform: startTransform }, { transform: "translateX(100%)" }],
      { duration: 250, easing: "cubic-bezier(0.4, 0, 0.2, 1)", fill: "both" }
    );
    void animation.finished.then(() => { finish(); animation.cancel(); }, finish);
  };

  const markEdited = (next: Semester[]) => {
    setSemesters(next);
    latestRevision.current += 1;
    setRevision(latestRevision.current);
    if (account === "signed-in") setSaveState("unsaved");
  };

  const addCourse = (code: string) => {
    if (!canEdit || !selected || planned.has(code) || selected.courses.length >= 20) return;
    markEdited(semesters.map(semester => semester.name === selected.name
      ? { ...semester, courses: [...semester.courses, code] } : semester));
    setAddedThisSession(previous => [...previous, code]);
  };

  const removeCourse = (code: string) => {
    markEdited(semesters.map(semester => semester.name === selected.name
      ? { ...semester, courses: semester.courses.filter(item => item !== code) }
      : semester));
  };

  const moveCourse = (code: string, target: string) => {
    if (!selected || target === selected.name) return;
    const destination = semesters.find(semester => semester.name === target);
    if (!destination || destination.courses.length >= 20) return;
    markEdited(semesters.map(semester => {
      if (semester.name === selected.name) {
        return { ...semester, courses: semester.courses.filter(item => item !== code) };
      }
      if (semester.name === target) {
        return { ...semester, courses: [...semester.courses, code] };
      }
      return semester;
    }));
  };

  const addSemester = () => {
    if (semesters.length >= 16) return;
    let name = nextRegularSemester(semesters[semesters.length - 1].name);
    while (semesters.some(semester => semester.name === name)) name = nextRegularSemester(name);
    markEdited([...semesters, { name, courses: [] }]);
    setActive(name);
  };

  return (
    <section className="new-homepage-semester-section" aria-labelledby="new-homepage-semester-title">
      <div className="new-homepage-semester-head">
        <h2 id="new-homepage-semester-title">Plan Your Semesters</h2>
        {account === "signed-in" && saveState !== "idle" && (
          <span className="new-homepage-semester-save" role="status">
            {saveState === "saving" ? "Saving..."
              : saveState === "saved" ? "Saved"
              : saveState === "error" ? (
                <button type="button" onClick={() => {
                  latestRevision.current += 1;
                  setRevision(latestRevision.current);
                  setSaveState("unsaved");
                }}>Save failed · Retry</button>
              ) : "Unsaved"}
          </span>
        )}
      </div>
      <div className="new-homepage-semester-tabs" role="tablist" aria-label="Academic semesters">
        {semesters.map(semester => (
          <button
            key={semester.name}
            type="button"
            role="tab"
            aria-selected={active === semester.name}
            className={active === semester.name ? "is-active" : ""}
            disabled={!canEdit}
            onClick={() => setActive(semester.name)}
          >
            {semester.name}
          </button>
        ))}
        {semesters.length < 16 && (
          <button className="new-homepage-semester-new" type="button"
            disabled={!canEdit} onClick={addSemester} aria-label="Add next semester"
            title="Add next semester">+ <span>Add semester</span></button>
        )}
      </div>

      <div className="new-homepage-semester-content" role="tabpanel" aria-label={selected?.name || "Semester"}>
        {account === "error" ? (
          <p className="new-homepage-semester-note">We couldn't load your saved plan. Refresh to try again.</p>
        ) : (
          <>
            {selected?.courses.length ? (
              <div className="new-homepage-semester-courses">
                {selected.courses.map(code => {
                  const course = courseByCode.get(code);
                  return (
                    <div key={code} className="new-homepage-semester-course">
                      <div className="new-homepage-semester-course-info">
                        <a href={courseUrl(code)}>{code}</a>
                        <span>{course?.title || "Course"}</span>
                      </div>
                      <div className="new-homepage-semester-course-actions">
                        <select
                          aria-label={"Move " + code + " to another semester"}
                          value={selected.name}
                          disabled={!canEdit}
                          onChange={event => moveCourse(code, event.target.value)}
                        >
                          {semesters.map(semester => (
                            <option key={semester.name} value={semester.name}>{semester.name}</option>
                          ))}
                        </select>
                        <button type="button" aria-label={"Remove " + code} title="Remove course"
                          disabled={!canEdit} onClick={() => removeCourse(code)}>×</button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : <p className="new-homepage-semester-note">No courses planned for this semester yet.</p>}

            <button type="button" className="new-homepage-semester-add-course"
              disabled={!canEdit || semesterFull} aria-haspopup="dialog"
              onClick={openCourseDrawer}>+ Add course</button>
          </>
        )}
      </div>
      {account === "guest" && (
        <p className="new-homepage-semester-account-note">
          <a href="/login">Sign in</a> to save your semester plan across devices.
        </p>
      )}
      <dialog ref={drawerRef} className="new-homepage-course-drawer"
        aria-labelledby="semester-course-drawer-title" aria-describedby="semester-course-drawer-semester"
        tabIndex={-1}
        onCancel={event => { event.preventDefault(); closeCourseDrawer(); }}
        onClick={event => {
          if (event.target !== event.currentTarget) return;
          const rect = event.currentTarget.getBoundingClientRect();
          if (event.clientX < rect.left || event.clientX > rect.right ||
              event.clientY < rect.top || event.clientY > rect.bottom) closeCourseDrawer();
        }}>
        <header className="new-homepage-course-drawer-header">
          <div>
            <h2 id="semester-course-drawer-title">Add courses</h2>
            <p id="semester-course-drawer-semester">{selected?.name}</p>
          </div>
          <button className="new-homepage-course-drawer-close" type="button"
            aria-label="Close course drawer" onClick={closeCourseDrawer}>×</button>
        </header>
        <div className="new-homepage-course-drawer-body">
          <input id="semester-course-search" type="search" value={query}
            onChange={event => setQuery(event.target.value)}
            aria-label="Search by course code or name"
            placeholder="Search by course code or name" autoComplete="off" />
          {!query.trim() && degreeOptions.length > 0 && (
            <p className="new-homepage-course-drawer-hint">
              <strong>From your degree plan</strong>
              <span>Check prerequisites before enrolling.</span>
            </p>
          )}
          {semesterFull && <p className="new-homepage-semester-note" role="status">This semester has reached its 20-course limit.</p>}
          <div className="new-homepage-semester-suggestions">
            {availableCourses.map(course => {
              const added = addedThisSession.includes(course.code);
              const unavailable = added || semesterFull || !canEdit;
              return (
                <button key={course.code} type="button"
                  aria-label={added ? course.code + " added" : "Add " + course.code}
                  aria-disabled={unavailable}
                  className={added ? "is-added" : ""}
                  onClick={() => { if (!unavailable) addCourse(course.code); }}>
                  <span><strong>{course.code}</strong><small>{course.title}</small></span>
                  <span aria-hidden="true">{added ? "✓" : "+"}</span>
                </button>
              );
            })}
            {!availableCourses.length && (
              <p className="new-homepage-semester-note">
                {query.trim() ? "No matching unplanned courses." : "Type a course code or name to find courses."}
              </p>
            )}
          </div>
        </div>
        <footer className="new-homepage-course-drawer-footer">
          <button type="button" onClick={closeCourseDrawer}>Done</button>
        </footer>
      </dialog>
    </section>
  );
}
