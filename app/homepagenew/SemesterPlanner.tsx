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
  const [adding, setAdding] = useState(false);
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
    if (!needle) return degreeOptions.filter(code => !planned.has(code))
      .map(code => courseByCode.get(code)!).slice(0, 8);
    return courses.filter(course =>
      !planned.has(course.code) &&
      (course.code.toLowerCase().includes(needle) ||
        course.title.toLowerCase().includes(needle))
    ).sort((a, b) =>
      Number(b.code.toLowerCase().startsWith(needle)) -
      Number(a.code.toLowerCase().startsWith(needle)) ||
      a.code.localeCompare(b.code)
    ).slice(0, 8);
  }, [degreeOptions, planned, query]);

  const selected = semesters.find(semester => semester.name === active) || semesters[0];
  const canEdit = account !== "loading" && account !== "error";

  const markEdited = (next: Semester[]) => {
    setSemesters(next);
    latestRevision.current += 1;
    setRevision(latestRevision.current);
    if (account === "signed-in") setSaveState("unsaved");
  };

  const addCourse = (code: string) => {
    if (!selected || planned.has(code) || selected.courses.length >= 20) return;
    markEdited(semesters.map(semester => semester.name === selected.name
      ? { ...semester, courses: [...semester.courses, code] } : semester));
    setQuery("");
    setAdding(false);
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
    setAdding(false);
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
            onClick={() => { setActive(semester.name); setAdding(false); setQuery(""); }}
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
            <div className="new-homepage-semester-meta">
              <span>{selected?.name || "Semester"}</span>
              <span>{selected?.courses.length || 0} planned {selected?.courses.length === 1 ? "course" : "courses"}</span>
            </div>
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

            {adding ? (
              <div className="new-homepage-semester-picker">
                <div className="new-homepage-semester-picker-head">
                  <label htmlFor="semester-course-search">Add a course to {selected?.name}</label>
                  <button type="button" onClick={() => { setAdding(false); setQuery(""); }}>Cancel</button>
                </div>
                <input id="semester-course-search" autoFocus value={query}
                  onChange={event => setQuery(event.target.value)}
                  placeholder="Search by course code or name" />
                {!query.trim() && degreeOptions.length > 0 && (
                  <p className="new-homepage-semester-note">
                    From your degree plan · Check prerequisites before enrolling
                  </p>
                )}
                <div className="new-homepage-semester-suggestions">
                  {availableCourses.map(course => (
                    <button key={course.code} type="button" onClick={() => addCourse(course.code)}>
                      <span><strong>{course.code}</strong><small>{course.title}</small></span>
                      <span aria-hidden="true">+</span>
                    </button>
                  ))}
                  {!availableCourses.length && (
                    <p className="new-homepage-semester-note">
                      {query.trim() ? "No matching unplanned courses." : "Type a course code or name to find courses."}
                    </p>
                  )}
                </div>
              </div>
            ) : (
              <button type="button" className="new-homepage-semester-add-course"
                disabled={!canEdit || (selected?.courses.length || 0) >= 20}
                onClick={() => setAdding(true)}>+ Add course</button>
            )}
          </>
        )}
      </div>
      {account === "guest" && (
        <p className="new-homepage-semester-account-note">
          <a href="/login">Sign in</a> to save your semester plan across devices.
        </p>
      )}
    </section>
  );
}
