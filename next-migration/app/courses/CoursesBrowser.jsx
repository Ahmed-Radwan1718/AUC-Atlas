"use client";

import { useMemo, useState } from "react";

const departmentByPrefix = {
  CHEM: "Chemistry",
  ENGR: "Engineering",
  MACT: "Mathematics and Actuarial Science",
  MENG: "Mechanical Engineering",
  PHYS: "Physics",
  CSCE: "Computer Science and Engineering",
  ECNG: "Electronics and Communications Engineering",
  BIOL: "Biology"
};

const courseRecords = [
  { code: "CHEM 1005", title: "General Chemistry I", description: "Chemical stoichiometry, atomic structure, periodicity, chemical bonding, and an introduction to organic-compound structure." },
  { code: "CHEM 1015", title: "General Chemistry I-Laboratory", description: "Selected experiments in inorganic and organic chemistry." },
  { code: "ENGR 1005", title: "Descriptive Geometry and Engineering Drawing", description: "Orthographic and pictorial drawing, sectional views, auxiliary views, dimensioning, sketching, and computer-aided drafting." },
  { code: "ENGR 2102", title: "Engineering Mechanics I (Statics)", description: "Equilibrium, forces in space, equivalent systems, rigid bodies, distributed forces, friction, and simple structures." },
  { code: "ENGR 2104", title: "Engineering Mechanics II (Dynamics)", description: "Kinematics and kinetics of particles, systems of particles, rigid bodies, energy, momentum, and engineering applications." },
  { code: "ENGR 3202", title: "Engineering Analysis and Computation I", description: "Linear equations, roots, interpolation, numerical integration and differentiation, differential equations, and computation." },
  { code: "ENGR 3212", title: "General Electrical Engineering", description: "Power, three-phase systems, measurements, transformers, motors, generation, transmission, protection, and energy management." },
  { code: "MACT 1121", title: "Calculus I", description: "Limits, continuity, derivatives, applications of derivatives, definite and indefinite integrals, and the Fundamental Theorem of Calculus." },
  { code: "MACT 1122", title: "Calculus II", description: "Inverse functions, integration techniques, improper integrals, sequences, series, Taylor series, vectors, lines, and planes." },
  { code: "MACT 2123", title: "Calculus III", description: "Vector functions, functions of several variables, partial derivatives, multiple integrals, and vector calculus." },
  { code: "MACT 2141", title: "Differential Equations", description: "First-order and higher-order differential equations, systems, series solutions, Laplace transform, and applications." },
  { code: "MACT 3224", title: "Probability and Statistics", description: "Probability models, estimation, statistical inference, sampling distributions, hypothesis testing, and interval estimation." },
  { code: "MENG 2112", title: "Strength of Materials", description: "Stress, strain, mechanical behavior, torsion, bending, transverse loading, statically indeterminate problems, and Mohr's circle." },
  { code: "MENG 2601", title: "Fluid Mechanics Fundamentals", description: "Fluid properties, fluid statics, Bernoulli equations, conservation laws, pipe flow, networks, and flow measurements." },
  { code: "MENG 3601", title: "Fundamentals of Thermodynamics", description: "Thermodynamic processes, pure substances, gases, the first and second laws, Carnot cycle, reversibility, and entropy." },
  { code: "MENG 4606", title: "Heat Transfer", description: "Heat conduction, numerical methods, convection, mass transfer, radiation, and heat exchanger design." },
  { code: "PHYS 1011", title: "Physics 1: Classical Mechanics, Sound and Heat", description: "A foundational physics course for science and engineering tracks." },
  { code: "PHYS 1021", title: "Physics 2: Electricity and Magnetism", description: "A foundational electricity and magnetism course for science and engineering tracks." },
  { code: "CSCE 3103", title: "Object Oriented Programming", description: "Core programming course in the Computer Science and Engineering sequence." },
  { code: "CSCE 3311", title: "Data and Computer Communications", description: "Computer communications course in the Computer Science and Engineering sequence." },
  { code: "CSCE 4101", title: "Compiler Design", description: "Upper-level computer science course focused on compiler design." },
  { code: "BIOL 2230", title: "Molecular and Cell Biology", description: "Cellular and molecular biology course in the Biology sequence." }
];

function getPrefix(code) {
  return code.split(" ")[0];
}

function getLevel(code) {
  const match = code.match(/\d{4}/);
  return match ? `${match[0][0]}000 Level` : "Level pending";
}

function normalize(value) {
  return String(value || "").toLowerCase();
}

function getDepartment(course) {
  return departmentByPrefix[getPrefix(course.code)] || "AUC Course";
}

export default function CoursesBrowser() {
  const [query, setQuery] = useState("");
  const [department, setDepartment] = useState("All");

  const departments = useMemo(
    () => ["All", ...new Set(courseRecords.map(getDepartment))],
    []
  );

  const filteredCourses = useMemo(() => {
    const cleanQuery = normalize(query);

    return courseRecords.filter((course) => {
      const courseDepartment = getDepartment(course);
      const haystack = normalize(
        `${course.code} ${course.title} ${course.description} ${courseDepartment} ${getLevel(course.code)}`
      );

      return (
        (department === "All" || courseDepartment === department) &&
        (!cleanQuery || haystack.includes(cleanQuery))
      );
    });
  }, [department, query]);

  return (
    <main className="courses-page-shell">
      <section className="courses-hero">
        <div>
          <p className="section-kicker">Course Library</p>
          <h1>Find the course, then the context.</h1>
        </div>

        <p>
          Search a cleaner course library by code, title, department, and level.
          Course pages and materials connect in the next migration pass.
        </p>
      </section>

      <section className="course-search-card" aria-label="Course search">
        <div>
          <span>Search courses</span>
          <strong>{filteredCourses.length} of {courseRecords.length} courses shown</strong>
        </div>

        <input
          className="atlas-search-input"
          type="search"
          placeholder="Search MACT, Physics, calculus, mechanics..."
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
      </section>

      <section className="course-browser-layout">
        <aside className="course-filter-rail" aria-label="Course departments">
          <span>Departments</span>

          <div>
            {departments.map((item) => (
              <button
                type="button"
                key={item}
                aria-pressed={department === item}
                onClick={() => setDepartment(item)}
              >
                {item}
              </button>
            ))}
          </div>
        </aside>

        <section className="course-list-panel" aria-label="Course results">
          <div className="course-list-header">
            <div>
              <p className="section-kicker">Course results</p>
              <h2>{department === "All" ? "All departments" : department}</h2>
            </div>

            <span>{filteredCourses.length} shown</span>
          </div>

          <div className="course-row-list">
            {filteredCourses.length ? (
              filteredCourses.map((course) => (
                <article className="course-row" key={course.code}>
                  <div>
                    <span>{course.code}</span>
                    <h3>{course.title}</h3>
                    <p>{course.description}</p>
                  </div>

                  <div className="course-row-meta">
                    <span>{getDepartment(course)}</span>
                    <span>{getLevel(course.code)}</span>
                  </div>
                </article>
              ))
            ) : (
              <p className="course-empty-state">No courses match this search.</p>
            )}
          </div>
        </section>
      </section>
    </main>
  );
}
