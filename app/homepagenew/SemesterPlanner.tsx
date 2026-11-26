"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import ProfessorInsights from "./ProfessorInsights";
import { SEMESTER_CREDIT_LIMIT, SEMESTER_COURSE_LIMIT, courseCredits, semesterCreditSummary, canAddSemesterCourse } from "../../lib/semesterCredits";
import { courses } from "../../data/courses";
import { useSearchResultMotion } from "../../lib/useSearchResultMotion";
import { DEGREE_REQUIREMENTS } from "../../data/degree-requirements";
import type { DegreeRequirementGroup } from "./degreeProgressSummary";
import { readSharedHomepageJson, type HomepageAccount, type HomepageProgress } from "../../lib/sharedHomepageReads";

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

function SemesterPlannerSkeleton() {
  return (
    <div className="new-homepage-semester-skeleton" role="status" aria-label="Loading semester plan">
      <div aria-hidden="true">
        <div className="new-homepage-semester-tabs new-homepage-semester-skeleton-tabs">
          {[59, 76, 60, 76, 60, 76, 60].map((width, index) => (
            <span className="new-homepage-semester-skeleton-tab" key={index}>
              <span className="new-homepage-semester-skeleton-block" style={{ width }} />
            </span>
          ))}
          <span className="new-homepage-semester-skeleton-tab is-add">
            <span className="new-homepage-semester-skeleton-block" />
          </span>
        </div>
        <div className="new-homepage-semester-content">
          <div className="new-homepage-semester-meta">
            <span className="new-homepage-semester-skeleton-block is-delete" />
            <span className="new-homepage-semester-skeleton-block is-counter" />
          </div>
          <div className="new-homepage-semester-courses">
            {Array.from({ length: 4 }, (_, index) => (
              <div className="new-homepage-semester-course" key={index}>
                <div className="new-homepage-semester-course-info">
                  <span className="new-homepage-semester-skeleton-block is-code" />
                  <span className="new-homepage-semester-skeleton-block is-title" style={{ width: index % 2 ? "76%" : "46%" }} />
                  <span className="new-homepage-semester-skeleton-block is-credits" />
                </div>
                <span className="new-homepage-semester-skeleton-block is-remove" />
              </div>
            ))}
            <div className="new-homepage-semester-add-course">
              <span className="new-homepage-semester-skeleton-block is-add-course" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SemesterPlanner() {
  const [semesters, setSemesters] = useState<Semester[]>(() => defaultSemesters());
  const [active, setActive] = useState(() => currentSemester());
  const [account, setAccount] = useState<AccountState>("loading");
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [major, setMajor] = useState("");
  const [completedKeys, setCompletedKeys] = useState<string[]>([]);
  const drawerRef = useRef<HTMLDialogElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  const deleteDialogRef = useRef<HTMLDialogElement>(null);
  const cancelDeleteRef = useRef<HTMLButtonElement>(null);
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
        // Start the shared account/progress chain alongside the plan read so
        // DegreeProgressPreview can join the very same in-flight requests.
        const academic = readSharedHomepageJson<HomepageAccount>("/api/me").then(async me => {
          if (!me.response.ok || !me.data.signedIn || !me.data.user) return null;
          const progress = await readSharedHomepageJson<HomepageProgress>("/api/academic-progress");
          return progress.response.ok ? { me: me.data, progress: progress.data } : null;
        }).catch(() => null);
        const response = await fetch("/api/semester-plan", {
          credentials: "same-origin", cache: "no-store", headers: { Accept: "application/json" }
        });
        if (!live) return;
        if (response.status === 401) {
          setAccount("guest");
          return;
        }
        if (!response.ok) throw new Error("Could not load saved semesters.");
        const saved = await response.json() as { semesters?: Semester[]; hasSavedPlan?: boolean };
        if (!live) return;
        if (Array.isArray(saved.semesters) && (saved.hasSavedPlan || saved.semesters.length)) {
          setSemesters(saved.semesters);
          setActive(saved.semesters[0]?.name || "");
        }
        const shared = await academic;
        if (!live) return;
        if (shared) {
          const { me, progress } = shared;
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
  useSearchResultMotion(suggestionsRef, JSON.stringify(availableCourses.map(course => course.code)));

  const selected = semesters.find(semester => semester.name === active) || semesters[0];
  const canEdit = account !== "loading" && account !== "error";
  const creditSummary = semesterCreditSummary(selected?.courses || []);
  const semesterFull = creditSummary.overLimit || creditSummary.unknown.length > 0 ||
    (selected?.courses.length || 0) >= SEMESTER_COURSE_LIMIT;
  const creditLabel = creditSummary.total + (creditSummary.unknown.length ? "+" : "") +
    " / " + SEMESTER_CREDIT_LIMIT + " credits";

  const openCourseDrawer = () => {
    const drawer = drawerRef.current;
    if (!drawer || drawer.open || !canEdit || !selected || semesterFull) return;
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
    if (!canEdit || !selected || planned.has(code) || !canAddSemesterCourse(selected.courses, code)) return;
    markEdited(semesters.map(semester => semester.name === selected.name
      ? { ...semester, courses: [...semester.courses, code] } : semester));
    setAddedThisSession(previous => [...previous, code]);
  };

  const removeCourse = (code: string) => {
    if (!canEdit || !selected) return;
    markEdited(semesters.map(semester => semester.name === selected.name
      ? { ...semester, courses: semester.courses.filter(item => item !== code) }
      : semester));
  };

  const addSemester = () => {
    if (!canEdit || semesters.length >= 16) return;
    let name = semesters.length ? nextRegularSemester(semesters[semesters.length - 1].name) : currentSemester();
    while (semesters.some(semester => semester.name === name)) name = nextRegularSemester(name);
    markEdited([...semesters, { name, courses: [] }]);
    setActive(name);
  };

  const deleteSemester = () => {
    if (!canEdit || !selected) return;
    const index = semesters.findIndex(semester => semester.name === selected.name);
    if (index < 0) return;
    const remaining = semesters.filter(semester => semester.name !== selected.name);
    const nearest = remaining[Math.min(index, remaining.length - 1)];
    deleteDialogRef.current?.close();
    markEdited(remaining);
    setActive(nearest?.name || "");
    setAddedThisSession([]);
    // The action disappears with the final semester, so restore focus to a
    // remaining tab or to Add semester rather than leaving it on the document.
    requestAnimationFrame(() => {
      const tabs = document.querySelector(".new-homepage-semester-tabs");
      tabs?.querySelector<HTMLButtonElement>('[aria-selected="true"]')?.focus({ preventScroll: true });
      if (!nearest) tabs?.querySelector<HTMLButtonElement>(".new-homepage-semester-new")?.focus({ preventScroll: true });
    });
  };

  const requestDeleteSemester = () => {
    if (!canEdit || !selected) return;
    if (!selected.courses.length) {
      deleteSemester();
      return;
    }
    const dialog = deleteDialogRef.current;
    if (!dialog || dialog.open) return;
    dialog.showModal();
    cancelDeleteRef.current?.focus({ preventScroll: true });
  };

  return (
    <>
    <section className="new-homepage-semester-section" aria-labelledby="new-homepage-semester-title" aria-busy={account === "loading"}>
      <div className="new-homepage-semester-head">
        <h2 id="new-homepage-semester-title">Plan Your Semesters</h2>
        {account === "signed-in" && saveState !== "idle" && saveState !== "saved" && (
          <span className="new-homepage-semester-save" role="status">
            {saveState === "saving" ? "Saving..."
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
      {account === "loading" ? (
        <SemesterPlannerSkeleton />
      ) : (
        <>
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
            ) : !selected ? (
              <p className="new-homepage-semester-note">No semesters planned. Add a semester to get started.</p>
            ) : (
              <>
                <div className="new-homepage-semester-meta">
                  <button type="button" className="new-homepage-semester-delete"
                    onClick={requestDeleteSemester} aria-label={"Delete " + selected.name}>
                    Delete semester
                  </button>
                  <span role="status" className={creditSummary.overLimit || creditSummary.unknown.length ? "is-credit-warning" : ""}>{creditLabel}</span>
                </div>
                {creditSummary.overLimit && <p className="new-homepage-semester-note is-credit-warning">This semester exceeds the 21-credit limit. Remove courses before adding more.</p>}
                {creditSummary.unknown.length > 0 && <p className="new-homepage-semester-note is-credit-warning">Credit values are missing for {creditSummary.unknown.join(", ")}. Remove these courses before adding more.</p>}
                {!selected?.courses.length && <p className="new-homepage-semester-note">No courses planned for this semester yet.</p>}
                <div className="new-homepage-semester-courses">
                    {selected?.courses.map(code => {
                      const course = courseByCode.get(code);
                      const credits = courseCredits(code);
                      return (
                        <div key={code} className="new-homepage-semester-course">
                          <div className="new-homepage-semester-course-info">
                            <a href={courseUrl(code)}>{code}</a>
                            <span>{course?.title || "Course"}</span>
                            <span className="new-homepage-semester-course-credits">{credits === null ? "Credits unavailable" : credits + (credits === 1 ? " credit" : " credits")}</span>
                          </div>
                          <div className="new-homepage-semester-course-actions">
                            <button type="button" aria-label={"Remove " + code} title="Remove course"
                              disabled={!canEdit} onClick={() => removeCourse(code)}>×</button>
                          </div>
                        </div>
                      );
                    })}
                  <button type="button" className="new-homepage-semester-add-course"
                    disabled={!canEdit || semesterFull} aria-haspopup="dialog"
                    onClick={openCourseDrawer}>+ Add course</button>
                </div>
              </>
            )}
          </div>
        </>
      )}
      {account === "guest" && (
        <p className="new-homepage-semester-account-note">
          <a href="/login">Sign in</a> to save your semester plan across devices.
        </p>
      )}
      <dialog ref={deleteDialogRef} className="new-homepage-semester-delete-dialog"
        aria-labelledby="semester-delete-title" aria-describedby="semester-delete-description"
        onClick={event => {
          if (event.target !== event.currentTarget) return;
          const rect = event.currentTarget.getBoundingClientRect();
          if (event.clientX < rect.left || event.clientX > rect.right ||
              event.clientY < rect.top || event.clientY > rect.bottom) event.currentTarget.close();
        }}>
        <h2 id="semester-delete-title">Delete {selected?.name}?</h2>
        <p id="semester-delete-description">This will remove the semester and its {selected?.courses.length || 0} planned {selected?.courses.length === 1 ? "course" : "courses"}.</p>
        <div className="new-homepage-semester-delete-actions">
          <button ref={cancelDeleteRef} type="button" className="new-homepage-semester-delete-cancel"
            onClick={() => deleteDialogRef.current?.close()}>Cancel</button>
          <button type="button" className="new-homepage-semester-delete-confirm"
            onClick={deleteSemester}>Delete semester</button>
        </div>
      </dialog>
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
            <p id="semester-course-drawer-semester">{selected?.name} · {creditLabel}</p>
          </div>
        </header>
        <div className="new-homepage-course-drawer-body">
          <input id="semester-course-search" type="search" value={query}
            onChange={event => setQuery(event.target.value)}
            aria-label="Search by course code or name"
            placeholder="Search by course code or name" autoComplete="off" />
          {creditSummary.total >= SEMESTER_CREDIT_LIMIT && <p className="new-homepage-semester-note" role="status">21-credit limit reached. Only zero-credit courses can be added.</p>}
          {semesterFull && <p className="new-homepage-semester-note" role="status">No more courses can be added to this semester.</p>}
          <div className="new-homepage-semester-suggestions" ref={suggestionsRef}>
            {availableCourses.map(course => {
              const added = addedThisSession.includes(course.code);
              const credits = courseCredits(course.code);
              const unavailable = added || semesterFull || !canEdit || !selected ||
                !canAddSemesterCourse(selected.courses, course.code);
              return (
                <button key={course.code} data-search-motion-key={course.code} type="button"
                  aria-label={added ? course.code + " added" : "Add " + course.code}
                  aria-disabled={unavailable}
                  title={!added && unavailable ? (credits === null ? "Credit value unavailable" : "Cannot add within semester limits") : undefined}
                  className={added ? "is-added" : ""}
                  onClick={() => { if (!unavailable) addCourse(course.code); }}>
                  <span><strong>{course.code}</strong><small>{course.title} · {credits === null ? "Credits unavailable" : credits + " cr."}</small></span>
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
          <button className="new-homepage-course-drawer-done" type="button" onClick={closeCourseDrawer}>Done</button>
          <button className="new-homepage-course-drawer-cancel" type="button" onClick={closeCourseDrawer}>Cancel</button>
        </footer>
      </dialog>
    </section>
    <ProfessorInsights semesters={semesters} current={currentSemester()} account={account} />
    </>
  );
}
