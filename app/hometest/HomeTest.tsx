"use client";

import { useState } from "react";
import CampusScene, { type SchoolId } from "./CampusScene";
import "./campus-3d.css";

const schools: { id: SchoolId; number: string; name: string; subtitle: string }[] = [
  { id: "humanities", number: "01", name: "Humanities & Social Sciences", subtitle: "Humanities and social sciences" },
  { id: "engineering", number: "02", name: "Sciences & Engineering", subtitle: "Sciences and engineering" },
  { id: "business", number: "03", name: "Business", subtitle: "Business" }
];

export default function HomeTest() {
  const [selected, setSelected] = useState<SchoolId | null>(null);

  return (
    <main className="campus-home">
      <div className="campus-shell">
        <section className="campus-intro" aria-labelledby="campus-heading">
          <div className="campus-intro-copy">
            <p className="campus-eyebrow"><span className="campus-eyebrow-dot" /> THE AUC ATLAS / 3D EXPERIMENT</p>
            <h1 id="campus-heading">A new perspective<br />on <span>AUC.</span></h1>
          </div>
          <p className="campus-intro-aside">
            Three academic buildings.<br />
            One campus to explore.
          </p>
        </section>

        <section className="campus-exhibit" aria-label="Interactive 3D model of three AUC academic buildings">
          <div className="campus-exhibit-rail">
            <span>THE CAMPUS / THREE ACADEMIC SCHOOLS</span>
            <span>01 — 03</span>
          </div>
          <div className="campus-stage">
            <CampusScene selected={selected} onSelect={setSelected} />
            <div className="campus-stage-corner campus-stage-corner-tl" />
            <div className="campus-stage-corner campus-stage-corner-tr" />
            <div className="campus-stage-corner campus-stage-corner-bl" />
            <div className="campus-stage-corner campus-stage-corner-br" />
            <div className="campus-stage-hint" aria-hidden="true">
              <span className="campus-hint-icon">↔</span> DRAG TO ORBIT <span className="campus-hint-divider">/</span> SCROLL TO ZOOM
            </div>
            {selected && (
              <button type="button" className="campus-reset" onClick={() => setSelected(null)}>
                <span aria-hidden="true">↖</span> ALL THREE BUILDINGS
              </button>
            )}
          </div>
          <div className="campus-building-grid" role="group" aria-label="Select a building to focus the camera">
            {schools.map((school) => (
              <button
                key={school.id}
                type="button"
                className={"campus-building " + (selected === school.id ? "is-selected" : "")}
                onClick={() => setSelected(selected === school.id ? null : school.id)}
                aria-pressed={selected === school.id}
              >
                <span className="campus-building-number">{school.number} /</span>
                <span className="campus-building-details">
                  <strong>{school.name}</strong>
                  <small>{selected === school.id ? "SELECTED BUILDING" : "VIEW BUILDING"}</small>
                </span>
                <span className="campus-building-arrow" aria-hidden="true">↗</span>
              </button>
            ))}
          </div>
        </section>
        <div className="campus-bottom-note">
          <span>AUC ATLAS — A STUDENT-BUILT ACADEMIC RESOURCE</span>
          <span>ARCHITECTURAL CONCEPT / NOT A SURVEY MODEL</span>
        </div>
      </div>
    </main>
  );
}
