"use client";

import { useMemo, useState } from "react";

const professorRecords = [
  { name: "Eslam Badr", department: "Mathematics and Actuarial Science", code: "MACT", filter: "Sciences", status: "No ratings yet", course: "Calculus 1, Linear Algebra", bio: "Algebraic geometry, arithmetic, plane curves, moduli spaces, automorphism groups, twisting theory, quadratic points, and Weierstrass points.", image: "https://res.cloudinary.com/hpsuzs6q/image/upload/v1785248610/ChatGPT_Image_Jul_28_2026_05_23_19_PM_xfec1d.png" },
  { name: "Kate Ellis", department: "Psychology", code: "PSYC", filter: "Humanities", status: "No ratings yet", course: "Courses coming soon", bio: "Clinical psychology, refugees, trauma, youth exposed to violence, and accessible mental health interventions for conflict-affected communities.", image: "https://res.cloudinary.com/hpsuzs6q/image/upload/v1785765918/Kate_Ellis_dhynm1.png" },
  { name: "Aya Musmar", department: "Architecture", code: "ARCH", filter: "Engineering", status: "No ratings yet", course: "Courses coming soon", bio: "Forced displacement, refugee camps, injustice, climate change, heritage, and architecture as a form of testimony.", image: "https://res.cloudinary.com/hpsuzs6q/image/upload/v1785765917/Aya_Musmar_fistv7.png" },
  { name: "Tamir El-Khouly", department: "Architecture", code: "ARCH", filter: "Engineering", status: "No ratings yet", course: "Courses coming soon", bio: "Architectural computing, BIM, machine learning, design thinking, and parametric design.", image: "https://res.cloudinary.com/hpsuzs6q/image/upload/v1785765913/Tamir_El-Khouly_r80cnx.png" },
  { name: "Wael El Mahallawy", department: "Arts", code: "ARTS", filter: "Humanities", status: "No ratings yet", course: "Courses coming soon", bio: "Arab music theory, qanoun performance, sound engineering, and music technology.", image: "https://res.cloudinary.com/hpsuzs6q/image/upload/v1785765912/Wael_El-Mahallawy_ajg1rj.png" },
  { name: "Daoud Siniora", department: "Mathematics and Actuarial Science", code: "MACT", filter: "Sciences", status: "No ratings yet", course: "Courses coming soon", bio: "Pure mathematics, model theory, and mathematical logic.", image: "https://res.cloudinary.com/hpsuzs6q/image/upload/v1785764421/Daoud_Siniora_wfvvfr.png" },
  { name: "Peter Barsoum", department: "Rhetoric and Composition", code: "RHET", filter: "Rhetoric & Writing", status: "No ratings yet", course: "Courses coming soon", bio: "Writing instruction across Southeast Europe, the Middle East, Africa, and Asia.", image: "https://res.cloudinary.com/hpsuzs6q/image/upload/v1785764419/Peter_Barsoum_fbvgzf.png" },
  { name: "Maha Bali", department: "Center for Learning and Teaching", code: "CLT", filter: "Humanities", status: "No ratings yet", course: "Courses coming soon", bio: "Equitable, open, and connected learning, academic inclusion, and community-building.", image: "https://res.cloudinary.com/hpsuzs6q/image/upload/v1785764415/Maha_Bali_oep3n4.png" },
  { name: "Mohamed Aly", department: "Mechanical Engineering", code: "MENG", filter: "Engineering", status: "No ratings yet", course: "Courses coming soon", bio: "Advanced manufacturing, design optimization, and topology optimization.", image: "https://res.cloudinary.com/hpsuzs6q/image/upload/v1785764414/Mohamed_Aly_jiacih.png" },
  { name: "Karim Banawan", department: "Electronics and Communications Engineering", code: "ECE", filter: "Engineering", status: "No ratings yet", course: "Courses coming soon", bio: "Information theory, wireless communications, network security, private information retrieval, and machine learning.", image: "https://res.cloudinary.com/hpsuzs6q/image/upload/v1785764413/Karim_Banawan_v87oii.png" },
  { name: "Karim Seddik", department: "Electronics and Communications Engineering", code: "ECE", filter: "Engineering", status: "No ratings yet", course: "Courses coming soon", bio: "Machine learning, wireless networks, intelligent reflecting surfaces, and backscatter communications.", image: "https://res.cloudinary.com/hpsuzs6q/image/upload/v1785764413/Karim_Seddik_mncy4y.png" },
  { name: "Suher Zada", department: "Biology", code: "BIOL", filter: "Sciences", status: "No ratings yet", course: "Courses coming soon", bio: "Infectious diseases and immune-system research using biotechnology, nanotechnology, and computational methods.", image: "https://res.cloudinary.com/hpsuzs6q/image/upload/v1785764408/Suher_Zada_osz83q.png" },
  { name: "Karim Addas", department: "Physics", code: "PHYS", filter: "Sciences", status: "No ratings yet", course: "Courses coming soon", bio: "Microrheology and the behavior of semiflexible biological materials.", image: "https://res.cloudinary.com/hpsuzs6q/image/upload/v1785764408/Karim_Addas_vq799y.png" },
  { name: "Tamer ElBatt", department: "Computer Science and Engineering", code: "CSCE", filter: "Computer Science", status: "No ratings yet", course: "Courses coming soon", bio: "Wireless, mobile, and IoT networks.", image: "https://res.cloudinary.com/hpsuzs6q/image/upload/v1785764407/Tamer_ElBatt_xvnauy.png" },
  { name: "Hani Henry", department: "Psychology", code: "PSYC", filter: "Humanities", status: "No ratings yet", course: "Courses coming soon", bio: "Culture, marginalized communities, psychotherapy, counseling, and cross-cultural psychology.", image: "https://res.cloudinary.com/hpsuzs6q/image/upload/v1785764405/Hani_Henry_yqg7ui.png" },
  { name: "Yasmine Motawy", department: "Rhetoric and Composition", code: "RHET", filter: "Rhetoric & Writing", status: "No ratings yet", course: "Courses coming soon", bio: "Children's literature, translation, criticism, editing, and contemporary Egyptian society.", image: "https://res.cloudinary.com/hpsuzs6q/image/upload/v1785764405/Yasmine_Motawy_ewzf4j.png" }
];

function normalize(value) {
  return String(value || "").toLowerCase();
}

function getInitials(name) {
  return name
    .split(" ")
    .slice(0, 2)
    .map((part) => part[0])
    .join("");
}

export default function ProfessorsBrowser() {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("All");

  const filters = useMemo(
    () => ["All", ...new Set(professorRecords.map((professor) => professor.filter))],
    []
  );

  const filteredProfessors = useMemo(() => {
    const cleanQuery = normalize(query);

    return professorRecords.filter((professor) => {
      const haystack = normalize(
        `${professor.name} ${professor.department} ${professor.code} ${professor.course} ${professor.bio} ${professor.status}`
      );

      return (
        (filter === "All" || professor.filter === filter) &&
        (!cleanQuery || haystack.includes(cleanQuery))
      );
    });
  }, [filter, query]);

  return (
    <main className="professors-page-shell">
      <section className="professors-hero">
        <div>
          <p className="section-kicker">Professor Profiles</p>
          <h1>Compare teaching fit without the noise.</h1>
        </div>

        <p>
          Browse real professor records with a consistent card system, search,
          department filters, course context, and rating status.
        </p>
      </section>

      <section className="professor-filter-card professor-filter-card-searchable" aria-label="Professor filters">
        <div>
          <span>Browse professors</span>
          <strong>{filteredProfessors.length} of {professorRecords.length} professors shown</strong>
        </div>

        <div className="professor-filter-actions">
          <input
            className="atlas-search-input"
            type="search"
            placeholder="Search name, department, course, or research area..."
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />

          <div className="professor-filter-chips">
            {filters.map((item) => (
              <button
                type="button"
                key={item}
                aria-pressed={filter === item}
                onClick={() => setFilter(item)}
              >
                {item}
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="professor-grid" aria-label="Professor results">
        {filteredProfessors.length ? (
          filteredProfessors.map((professor) => (
            <article className="professor-profile-card" key={professor.name}>
              <div className="professor-image-wrap" aria-hidden="true">
                <span className="professor-image-fallback">{getInitials(professor.name)}</span>
                <img
                  className="professor-profile-image"
                  src={professor.image}
                  alt=""
                  onError={(event) => {
                    event.currentTarget.style.display = "none";
                  }}
                />
              </div>

              <div className="professor-card-copy">
                <span>{professor.code}</span>
                <h2>{professor.name}</h2>
                <p>{professor.bio}</p>
              </div>

              <div className="professor-card-meta">
                <span>{professor.department}</span>
                <span>{professor.course}</span>
                <span>{professor.status}</span>
              </div>
            </article>
          ))
        ) : (
          <p className="professor-empty-state">No professors match this search.</p>
        )}
      </section>
    </main>
  );
}
