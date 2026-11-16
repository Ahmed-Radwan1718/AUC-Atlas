"use client";

import { useState } from "react";
import CampusScene, { type SchoolId } from "./CampusScene";
import "./campus-3d.css";

export default function HomeTest() {
  const [selected, setSelected] = useState<SchoolId | null>(null);

  return (
    <main className="campus-home" aria-label="Interactive full-screen 3D AUC campus">
      <div className="campus-stage">
        <CampusScene selected={selected} onSelect={setSelected} />
      </div>

      {selected && (
        <button type="button" className="campus-reset" onClick={() => setSelected(null)}>
          <span aria-hidden="true">↖</span> ALL FOUR BUILDINGS
        </button>
      )}


    </main>
  );
}
