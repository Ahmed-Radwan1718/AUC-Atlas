"use client";

import { useState } from "react";
import CampusScene, { type SchoolId } from "./CampusScene";
import "./campus-3d.css";

const schools: { id: SchoolId; number: string; name: string }[] = [
  { id: "humanities", number: "01", name: "Humanities & Social Sciences" },
  { id: "engineering", number: "02", name: "Sciences & Engineering" },
  { id: "business", number: "03", name: "Business" }
];

export default function HomeTest() {
  const [selected, setSelected] = useState<SchoolId | null>(null);

  return (
    <main className="campus-home" aria-label="Interactive full-screen 3D AUC campus">
      <div className="campus-stage">
        <CampusScene selected={selected} onSelect={setSelected} />
      </div>

      {selected && (
        <button type="button" className="campus-reset" onClick={() => setSelected(null)}>
          <span aria-hidden="true">↖</span> ALL THREE BUILDINGS
        </button>
      )}

      <div className="campus-bottom-controls">
        <div className="campus-stage-hint" aria-hidden="true">
          <span aria-hidden="true">↔</span> DRAG TO ORBIT
          <span className="campus-hint-divider">/</span>
          SCROLL TO ZOOM
        </div>

        <div className="campus-building-grid" role="group" aria-label="Focus on an academic building">
          {schools.map(school => (
            <button
              key={school.id}
              type="button"
              className={"campus-building" + (selected === school.id ? " is-selected" : "")}
              onClick={() => setSelected(selected === school.id ? null : school.id)}
              aria-pressed={selected === school.id}
            >
              <span className="campus-building-number">{school.number}</span>
              <span className="campus-building-details">
                <strong>{school.name}</strong>
                <small>{selected === school.id ? "SELECTED BUILDING" : "EXPLORE BUILDING"}</small>
              </span>
              <span className="campus-building-arrow" aria-hidden="true">↗</span>
            </button>
          ))}
        </div>
      </div>
    </main>
  );
}
