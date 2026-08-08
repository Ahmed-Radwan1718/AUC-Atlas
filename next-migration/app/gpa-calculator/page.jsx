"use client";

import { useMemo, useState } from "react";

const gradeOptions = [
  ["A", 4],
  ["A-", 3.7],
  ["B+", 3.3],
  ["B", 3],
  ["B-", 2.7],
  ["C+", 2.3],
  ["C", 2],
  ["C-", 1.7],
  ["D", 1],
  ["F", 0]
];

const initialRows = [
  { id: 1, course: "Course 1", credits: 3, grade: "A" },
  { id: 2, course: "Course 2", credits: 3, grade: "B+" },
  { id: 3, course: "Course 3", credits: 3, grade: "A-" }
];

export default function GpaCalculatorPage() {
  const [rows, setRows] = useState(initialRows);

  const result = useMemo(() => {
    const gradeMap = new Map(gradeOptions);
    const totals = rows.reduce(
      (summary, row) => {
        const credits = Number(row.credits) || 0;
        const points = Number(gradeMap.get(row.grade)) || 0;

        return {
          credits: summary.credits + credits,
          points: summary.points + credits * points
        };
      },
      { credits: 0, points: 0 }
    );

    return {
      credits: totals.credits,
      gpa: totals.credits ? totals.points / totals.credits : 0
    };
  }, [rows]);

  function updateRow(id, field, value) {
    setRows((currentRows) =>
      currentRows.map((row) =>
        row.id === id ? { ...row, [field]: value } : row
      )
    );
  }

  function addRow() {
    setRows((currentRows) => [
      ...currentRows,
      {
        id: Date.now(),
        course: "New course",
        credits: 3,
        grade: "A"
      }
    ]);
  }

  function removeRow(id) {
    setRows((currentRows) =>
      currentRows.length > 1
        ? currentRows.filter((row) => row.id !== id)
        : currentRows
    );
  }

  return (
    <main className="tool-page-shell">
      <section className="tool-hero">
        <div>
          <p className="section-kicker">GPA Calculator</p>
          <h1>Calculate your term before it surprises you.</h1>
        </div>

        <p>
          A cleaner GPA workspace with editable course rows, credits, grades,
          and an instant term GPA summary.
        </p>
      </section>

      <section className="calculator-layout">
        <div className="calculator-panel">
          <div className="tool-panel-heading">
            <div>
              <span>Current semester</span>
              <h2>Course grades</h2>
            </div>

            <button type="button" onClick={addRow}>
              Add course
            </button>
          </div>

          <div className="gpa-row-list">
            {rows.map((row) => (
              <div className="gpa-row" key={row.id}>
                <input
                  value={row.course}
                  aria-label="Course name"
                  onChange={(event) =>
                    updateRow(row.id, "course", event.target.value)
                  }
                />

                <input
                  min="0"
                  max="6"
                  type="number"
                  value={row.credits}
                  aria-label="Credits"
                  onChange={(event) =>
                    updateRow(row.id, "credits", event.target.value)
                  }
                />

                <select
                  value={row.grade}
                  aria-label="Grade"
                  onChange={(event) =>
                    updateRow(row.id, "grade", event.target.value)
                  }
                >
                  {gradeOptions.map(([grade]) => (
                    <option value={grade} key={grade}>
                      {grade}
                    </option>
                  ))}
                </select>

                <button type="button" onClick={() => removeRow(row.id)}>
                  Remove
                </button>
              </div>
            ))}
          </div>
        </div>

        <aside className="calculator-summary">
          <span>Estimated GPA</span>
          <strong>{result.gpa.toFixed(2)}</strong>
          <p>{result.credits} attempted credits included in this estimate.</p>
        </aside>
      </section>
    </main>
  );
}
