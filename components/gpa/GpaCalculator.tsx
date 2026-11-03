"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type GradeOption = { value: string; label: string };
type CourseRow = { id: number; name: string; credits: string; grade: string };
type Semester = { id: number; name: string; courses: CourseRow[] };
type SavedCalculator = { semesters?: Array<{ name?: string; courses?: Array<{ name?: string; credits?: string | number; grade?: string }> }> };

const grades: GradeOption[] = [
  { value: "", label: "Grade" },
  { value: "4.0", label: "A" },
  { value: "3.7", label: "A-" },
  { value: "3.3", label: "B+" },
  { value: "3.0", label: "B" },
  { value: "2.7", label: "B-" },
  { value: "2.3", label: "C+" },
  { value: "2.0", label: "C" },
  { value: "1.7", label: "C-" },
  { value: "1.3", label: "D+" },
  { value: "1.0", label: "D" },
  { value: "0", label: "F" },
];

function defaultCourses(startId: number): CourseRow[] {
  return [0, 1, 2].map((offset) => ({
    id: startId + offset,
    name: "",
    credits: "3",
    grade: "",
  }));
}

function getGradeLabel(value: string) {
  return grades.find((grade) => grade.value === value)?.label || "Grade";
}

function AnimatedNumber({ value, decimals }: { value: number; decimals: number }) {
  const [displayed, setDisplayed] = useState(0);
  const previous = useRef(0);
  const frame = useRef<number | null>(null);

  useEffect(() => {
    const current = previous.current;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (frame.current) cancelAnimationFrame(frame.current);

    if (reduced || Math.abs(current - value) < 0.01) {
      previous.current = value;
      setDisplayed(value);
      return;
    }

    const started = performance.now();
    const duration = 520;

    const tick = (now: number) => {
      const progress = Math.min((now - started) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayed(current + (value - current) * eased);

      if (progress < 1) {
        frame.current = requestAnimationFrame(tick);
      } else {
        previous.current = value;
        setDisplayed(value);
      }
    };

    frame.current = requestAnimationFrame(tick);
    return () => {
      if (frame.current) cancelAnimationFrame(frame.current);
    };
  }, [value]);

  return <>{displayed.toFixed(decimals)}</>;
}

function GradeDropdown({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const close = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("click", close);
    return () => document.removeEventListener("click", close);
  }, []);

  return (
    <div className={`grade-dropdown${open ? " open" : ""}`} ref={rootRef}>
      <input className="course-grade" type="hidden" value={value} readOnly />
      <button className="grade-toggle" type="button" aria-label="Grade" aria-expanded={open} onClick={() => setOpen((current) => !current)}>
        <span className="grade-toggle-label">{getGradeLabel(value)}</span>
        <span className="grade-chevron" aria-hidden="true" />
      </button>
      {!open ? null : (
        <div className="grade-menu">
          {grades.map((grade) => (
            <button
              className="grade-option"
              type="button"
              key={grade.value || "none"}
              onClick={() => {
                onChange(grade.value);
                setOpen(false);
              }}
            >
              {grade.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export function GpaCalculator() {
  const [semesters, setSemesters] = useState<Semester[]>([]);
  const [loading, setLoading] = useState(true);
  const [saveMessage, setSaveMessage] = useState("");
  const [saveType, setSaveType] = useState<"" | "success" | "error">("");
  const [saving, setSaving] = useState(false);
  const nextSemesterId = useRef(2);
  const nextCourseId = useRef(4);

  useEffect(() => {
    let active = true;

    fetch("/api/academic-progress", {
      method: "GET",
      credentials: "same-origin",
      cache: "no-store",
      headers: { Accept: "application/json" },
    })
      .then(async (response) => {
        if (response.status === 401 || response.status === 403) return { unauthorized: true };
        const data = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(data.error || "Could not load the saved GPA plan.");
        return data;
      })
      .then((data: { unauthorized?: boolean; gpaCalculator?: SavedCalculator }) => {
        if (!active) return;
        const saved = data.gpaCalculator?.semesters;

        if (!Array.isArray(saved) || saved.length === 0) {
          setSemesters([{ id: 1, name: "Semester 1", courses: defaultCourses(1) }]);
          nextSemesterId.current = 2;
          nextCourseId.current = 4;
          return;
        }

        let courseId = 1;
        const mapped = saved.map((semester, index) => ({
          id: index + 1,
          name: String(semester.name || `Semester ${index + 1}`),
          courses:
            Array.isArray(semester.courses) && semester.courses.length
              ? semester.courses.map((course) => ({
                  id: courseId++,
                  name: String(course.name || ""),
                  credits: String(course.credits == null ? "" : course.credits),
                  grade: String(course.grade || ""),
                }))
              : defaultCourses(courseId),
        }));
        setSemesters(mapped);
        nextSemesterId.current = mapped.length + 1;
        nextCourseId.current = Math.max(courseId, mapped.reduce((max, semester) => Math.max(max, ...semester.courses.map((course) => course.id + 1)), 1));
        setSaveMessage("Saved GPA plan loaded.");
        setSaveType("success");
      })
      .catch((error: Error) => {
        if (!active) return;
        setSemesters([{ id: 1, name: "Semester 1", courses: defaultCourses(1) }]);
        nextSemesterId.current = 2;
        nextCourseId.current = 4;
        setSaveMessage(error.message || "Could not load the saved GPA plan.");
        setSaveType("error");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const totals = useMemo(() => {
    let credits = 0;
    let qualityPoints = 0;

    semesters.forEach((semester) => {
      semester.courses.forEach((course) => {
        if (course.grade === "") return;
        const courseCredits = Number(course.credits || 0);
        const grade = Number(course.grade);
        credits += courseCredits;
        qualityPoints += courseCredits * grade;
      });
    });

    const gpa = credits ? qualityPoints / credits : 0;
    return { credits, qualityPoints, gpa };
  }, [semesters]);

  function markUnsaved() {
    setSaveMessage("You have unsaved changes.");
    setSaveType("");
  }

  function updateSemesterName(semesterId: number, value: string) {
    setSemesters((current) => current.map((semester) => (semester.id === semesterId ? { ...semester, name: value } : semester)));
    markUnsaved();
  }

  function updateCourse(semesterId: number, courseId: number, patch: Partial<CourseRow>) {
    setSemesters((current) =>
      current.map((semester) =>
        semester.id === semesterId
          ? { ...semester, courses: semester.courses.map((course) => (course.id === courseId ? { ...course, ...patch } : course)) }
          : semester,
      ),
    );
    markUnsaved();
  }

  function addCourse(semesterId: number) {
    const course: CourseRow = { id: nextCourseId.current++, name: "", credits: "3", grade: "" };
    setSemesters((current) => current.map((semester) => (semester.id === semesterId ? { ...semester, courses: [...semester.courses, course] } : semester)));
    markUnsaved();
  }

  function removeCourse(semesterId: number, courseId: number) {
    setSemesters((current) =>
      current.map((semester) => {
        if (semester.id !== semesterId) return semester;
        const next = semester.courses.filter((course) => course.id !== courseId);
        return {
          ...semester,
          courses: next.length ? next : [{ id: nextCourseId.current++, name: "", credits: "3", grade: "" }],
        };
      }),
    );
    markUnsaved();
  }

  function addSemester() {
    const id = nextSemesterId.current++;
    const startId = nextCourseId.current;
    nextCourseId.current += 3;
    setSemesters((current) => [...current, { id, name: `Semester ${current.length + 1}`, courses: defaultCourses(startId) }]);
    markUnsaved();
  }

  function removeSemester(semesterId: number) {
    setSemesters((current) => {
      const next = current.filter((semester) => semester.id !== semesterId);
      if (next.length) return next;
      const startId = nextCourseId.current;
      nextCourseId.current += 3;
      return [{ id: nextSemesterId.current++, name: "Semester 1", courses: defaultCourses(startId) }];
    });
    markUnsaved();
  }

  function reset() {
    const startId = nextCourseId.current;
    nextCourseId.current += 3;
    setSemesters([{ id: nextSemesterId.current++, name: "Semester 1", courses: defaultCourses(startId) }]);
    markUnsaved();
  }

  async function save() {
    setSaving(true);
    setSaveMessage("");
    setSaveType("");

    try {
      const response = await fetch("/api/academic-progress", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "gpa",
          calculator: {
            semesters: semesters.map((semester) => ({
              name: semester.name.trim(),
              courses: semester.courses.map((course) => ({
                name: course.name.trim(),
                credits: course.credits,
                grade: course.grade,
              })),
            })),
          },
        }),
      });

      const data = await response.json().catch(() => ({}));
      if (response.status === 401 || response.status === 403) {
        window.location.href = "https://aucatlas.com/login.html";
        return;
      }
      if (!response.ok) throw new Error(data.error || "Could not save the GPA plan.");
      setSaveMessage("GPA plan saved.");
      setSaveType("success");
    } catch (error) {
      setSaveMessage(error instanceof Error ? error.message : "Could not save the GPA plan.");
      setSaveType("error");
    } finally {
      setSaving(false);
    }
  }

  const gpaClass = totals.credits === 0 ? "" : totals.gpa >= 3.4 ? " gpa-good" : totals.gpa >= 2.3 ? " gpa-mid" : " gpa-low";

  return (
    <main className="gpa-page">
      <div className="gpa-inner">
        <section className="gpa-header">
          <div><h1>Calculate your GPA.</h1></div>
          <p>Add your courses, credits, and grades to calculate your overall GPA across multiple semesters.</p>
        </section>

        <section className="gpa-layout" aria-label="GPA calculator">
          <section className="gpa-panel">
            <div className="gpa-semesters">
              {loading ? (
                <div className="gpa-loading" role="status" aria-live="polite">
                  <span className="gpa-loading-spinner" aria-hidden="true" />
                  <span>Loading GPA calculator...</span>
                </div>
              ) : (
                semesters.map((semester) => (
                  <section className="gpa-semester" key={semester.id}>
                    <div className="gpa-semester-header">
                      <input className="semester-name" type="text" value={semester.name} aria-label="Semester name" onChange={(event) => updateSemesterName(semester.id, event.target.value)} />
                      <div className="semester-actions">
                        <button className="remove-course remove-semester" type="button" aria-label="Remove semester" title="Remove semester" onClick={() => removeSemester(semester.id)} />
                      </div>
                    </div>

                    <div className="gpa-table-head">
                      <span>Course</span><span>Credits</span><span>Grade</span><span />
                    </div>

                    <div className="semester-courses">
                      {semester.courses.map((course) => (
                        <div className="gpa-row" key={course.id}>
                          <input className="course-name" type="text" placeholder="Course name" value={course.name} onChange={(event) => updateCourse(semester.id, course.id, { name: event.target.value })} />
                          <input
                            className="course-credits"
                            type="text"
                            inputMode="numeric"
                            pattern="[0-9]*"
                            placeholder="Credits"
                            value={course.credits}
                            aria-label="Credits"
                            onChange={(event) => updateCourse(semester.id, course.id, { credits: event.target.value.replace(/[^0-9]/g, "") })}
                          />
                          <GradeDropdown value={course.grade} onChange={(grade) => updateCourse(semester.id, course.id, { grade })} />
                          <button className="remove-course" type="button" aria-label="Remove course" title="Remove course" onClick={() => removeCourse(semester.id, course.id)} />
                        </div>
                      ))}
                    </div>

                    <div className="semester-course-footer">
                      <button className="gpa-action semester-add-course" type="button" aria-label="Add course" title="Add course" onClick={() => addCourse(semester.id)}>+</button>
                    </div>
                  </section>
                ))
              )}
            </div>

            <div className="gpa-actions">
              <button className="gpa-action primary" type="button" onClick={addSemester}>Add Semester</button>
              <button className="gpa-action" type="button" disabled={saving} onClick={save}>{saving ? "Saving..." : "Save GPA Plan"}</button>
              <button className="gpa-action" type="button" onClick={reset}>Reset</button>
            </div>

            <p className={`gpa-save-message${saveType ? ` ${saveType}` : ""}`} aria-live="polite">{saveMessage}</p>
          </section>

          <aside className="gpa-summary">
            <span className="summary-label">Overall GPA</span>
            <div className={`summary-gpa${gpaClass}`}><AnimatedNumber value={totals.gpa} decimals={2} /></div>
            <div className="summary-items">
              <div className="summary-item"><strong>Credits</strong><span><AnimatedNumber value={totals.credits} decimals={0} /></span></div>
              <div className="summary-item"><strong>Quality Points</strong><span><AnimatedNumber value={totals.qualityPoints} decimals={2} /></span></div>
              <div className="summary-item"><strong>Cumulative GPA</strong><span><AnimatedNumber value={totals.gpa} decimals={2} /></span></div>
            </div>
          </aside>
        </section>
      </div>
    </main>
  );
}
