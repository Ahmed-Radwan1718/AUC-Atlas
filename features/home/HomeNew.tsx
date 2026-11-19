"use client";

import { useState } from "react";
import HomeSearch, { type SearchScope } from "./HomeSearch";
import "./homeNew.css";

const scopes: { value: SearchScope; label: string }[] = [
  { value: "all", label: "All" },
  { value: "materials", label: "Materials" },
  { value: "professors", label: "Professors" }
];

export default function HomeNew() {
  const [scope, setScope] = useState<SearchScope>("all");

  return (
    <main className="home-new">
      <section className="home-new-stage" aria-labelledby="home-new-title">
        <p className="home-new-eyebrow"><span aria-hidden="true" /> Built for AUC students</p>
        <h1 className="home-new-title" id="home-new-title">
          <span className="home-new-title-auc">AUC</span>{" "}
          <span className="home-new-title-atlas">Atlas<span className="home-new-title-dot">.</span></span>
        </h1>
        <p className="home-new-description">
          Past exams, lecture notes, and real professor reviews.
          <span> Everything for your next class, one search away.</span>
        </p>

        <div className="home-new-search-area">
          <HomeSearch scope={scope} />
          <div className="home-new-search-scopes" role="group" aria-label="Search within">
            {scopes.map(option => (
              <button key={option.value} type="button"
                className={"home-new-scope" + (scope === option.value ? " is-selected" : "")}
                aria-pressed={scope === option.value}
                onClick={() => setScope(option.value)}>
                {option.label}
              </button>
            ))}
          </div>
          <p className="home-new-search-hint">
            {scope === "materials" ? "Try a course code like MATH 2010, or a material title."
              : scope === "professors" ? "Search by professor name or department."
              : "Search by course code, file title, or professor name."}
          </p>
        </div>

        <nav className="home-new-explore" aria-label="Browse without searching">
          <a href="/courses">Browse course materials <span aria-hidden="true">↗</span></a>
          <span className="home-new-explore-separator" aria-hidden="true" />
          <a href="/professors">Explore professor reviews <span aria-hidden="true">↗</span></a>
        </nav>
      </section>
    </main>
  );
}
