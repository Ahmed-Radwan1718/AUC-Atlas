export const metadata = {
  title: "Degree Progression",
  description: "Track degree requirements, major progress, completed courses, and academic planning."
};

const requirementGroups = [
  {
    title: "Core requirements",
    complete: 8,
    total: 12,
    items: ["Rhetoric", "Scientific thinking", "Humanities", "Arab world studies"]
  },
  {
    title: "Major requirements",
    complete: 14,
    total: 22,
    items: ["Foundation courses", "Major electives", "Capstone sequence", "Internship"]
  },
  {
    title: "General electives",
    complete: 3,
    total: 6,
    items: ["Free electives", "Concentration support", "Optional minor"]
  }
];

export default function DegreeProgressionPage() {
  return (
    <main className="tool-page-shell">
      <section className="tool-hero">
        <div>
          <p className="section-kicker">Degree Progression</p>
          <h1>See the path, not just the checklist.</h1>
        </div>

        <p>
          This route replaces the old degree page structure with a calmer
          planning dashboard. The next step is wiring it to saved account data.
        </p>
      </section>

      <section className="degree-dashboard">
        <aside className="degree-summary-card">
          <span>Overall progress</span>
          <strong>62%</strong>
          <p>Sample progress view until the live account data is connected.</p>
        </aside>

        <div className="degree-group-list">
          {requirementGroups.map((group) => (
            <article className="degree-group-card" key={group.title}>
              <div className="degree-group-head">
                <div>
                  <span>{group.complete} of {group.total}</span>
                  <h2>{group.title}</h2>
                </div>

                <strong>{Math.round((group.complete / group.total) * 100)}%</strong>
              </div>

              <div className="degree-progress-track">
                <span style={{ width: `${(group.complete / group.total) * 100}%` }} />
              </div>

              <ul>
                {group.items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
