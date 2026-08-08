"use client";

import { useMemo, useState } from "react";

const sharedSsePolicy = [
  "Students may be admitted to the major at the gate or enter AUC as undeclared.",
  "Students must declare a major before completing 60 credit hours.",
  "At-gate and from-within eligibility criteria are published through the official catalog links for Fall 2026 and Spring 2027 declaration.",
  "Admission depends on the program's student capacity."
];

const programs = [
  { school: "Business", name: "Accounting (B.A.C.)", requirements: ["Complete at least 27 credits before applying.", "Required courses: ACCT 2001 with minimum B; ACCT 2002 with minimum B; ECON 2011 or ECON 2021; MACT 2222.", "Weighted GPA: 60% overall GPA at declaration + 40% average GPA in ACCT 2001 and ACCT 2002."] },
  { school: "Business", name: "Economics (B.A.)", requirements: ["Complete at least 27 credits including ECON 2011, ECON 2021, and ECON 2061.", "Earn an average of B or higher in ECON 2011 and ECON 2021, with at least B- in each.", "Declaration score: 50% Economics GPA + 50% overall GPA."] },
  { school: "Business", name: "Business and Entrepreneurship (B.B.E.)", requirements: ["Apply in the third semester after completing at least 27 credits.", "Required courses: ACCT 2001, BADM 2001, ECON 2011 or ECON 2021, and MACT 2222.", "Selection uses a 50% major GPA + 50% overall GPA declaration score."] },
  { school: "Business", name: "Business in Finance (B.B.F.)", requirements: ["Apply in the third semester after completing at least 27 credits.", "Required courses: ACCT 2001, BADM 2001, ECON 2011 or ECON 2021, and MACT 2222.", "Selection uses an equal weighted score between overall GPA and major GPA."] },
  { school: "Business", name: "Business in Marketing (B.B.M.)", requirements: ["Apply in the third semester after completing at least 27 credits.", "Required courses: ACCT 2001, BADM 2001, ECON 2011 or ECON 2021, and MACT 2222.", "Declaration GPA: 50% major GPA + 50% overall GPA."] },
  { school: "Business", name: "Management of Information and Communication Technology (MICT)", requirements: ["Complete at least 27 credits before applying.", "Required courses: CSCE 1001, MACT 2222, and MOIS 2101.", "Ranking uses 50% overall GPA + 50% average GPA in the required courses."] },
  { school: "Global Affairs and Public Policy", name: "Integrated Marketing Communication (B.A.)", requirements: ["Complete 24 credits of university coursework.", "Complete RHET 1020 with B or better.", "Complete JRMC 2200 with B or better.", "Pass the English Proficiency Test with at least 75%."] },
  { school: "Global Affairs and Public Policy", name: "Multimedia Communication and Journalism (B.A.)", requirements: ["Complete 24 credits of university coursework.", "Complete RHET 1020 with B or better.", "Complete JRMC 2200 with B or better.", "Pass the English Proficiency Test with at least 75%."] },
  { school: "Humanities and Social Sciences", name: "Political Science (B.A.)", requirements: ["Minimum overall GPA of 2.7.", "B average in the listed POLS declaration courses, with at least C+ in each course used for declaration.", "Earn at least B in RHET 1020."] },
  { school: "Humanities and Social Sciences", name: "Psychology (B.A.)", requirements: ["Complete PSYC 1000 with B or higher.", "Successfully complete or be currently enrolled in PSYC 2000.", "Admission is competitive and uses discipline-relevant factors."] },
  { school: "Arts", name: "Film (B.A.)", requirements: ["Earn at least B in FILM 2120.", "Earn at least B in FILM 2121 or FILM 2123.", "Complete a portfolio-based interview."] },
  { school: "Arts", name: "Graphic Design (B.A.)", requirements: ["Earn at least C+ in DSGN 2200 and DSGN 2113.", "Complete a portfolio interview after those two courses.", "Admission depends on space and portfolio promise."] },
  { school: "Arts", name: "Visual Arts (B.A.)", requirements: ["Complete ARTV 2200 and ARTV 2113.", "Complete two additional Visual Arts studio courses.", "Final recommendation is made after an interview and portfolio review."] },
  ...[
    "Architecture (B.Arch.)",
    "Biology (B.Sc.)",
    "Chemistry (B.S.)",
    "Computer Engineering (B.S.)",
    "Computer Science (B.S.)",
    "Construction Engineering (B.S.)",
    "Electronics and Communications Engineering (B.S.)",
    "Actuarial Science (B.S.)",
    "Data Science (B.Sc.)",
    "Mathematics (B.S.)",
    "Mechanical Engineering (B.S.)",
    "Petroleum Engineering (B.S.)",
    "Physics (B.S.)"
  ].map((name) => ({ school: "Sciences and Engineering", name, requirements: sharedSsePolicy }))
];

export default function DeclarationProcessPage() {
  const [query, setQuery] = useState("");
  const [school, setSchool] = useState("all");

  const schools = useMemo(
    () => [...new Set(programs.map((program) => program.school))].sort(),
    []
  );

  const filteredPrograms = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return programs.filter((program) => {
      const searchable = [program.school, program.name, ...program.requirements]
        .join(" ")
        .toLowerCase();

      return (
        (school === "all" || program.school === school) &&
        (!normalizedQuery || searchable.includes(normalizedQuery))
      );
    });
  }, [query, school]);

  return (
    <main className="declaration-page-shell">
      <section className="declaration-hero">
        <div>
          <p className="section-kicker">Academic planning</p>
          <h1>Major declaration process</h1>
        </div>
        <p>
          Declaration requirements summarized from the AUC 2025-2026 Academic
          Catalog. Always confirm final eligibility with the official catalog
          and your advisor.
        </p>
      </section>

      <section className="declaration-tools" aria-label="Declaration filters">
        <input
          type="search"
          placeholder="Search majors, courses, grades, or schools"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
        <select value={school} onChange={(event) => setSchool(event.target.value)}>
          <option value="all">All schools</option>
          {schools.map((schoolName) => (
            <option value={schoolName} key={schoolName}>
              {schoolName}
            </option>
          ))}
        </select>
      </section>

      <section className="declaration-grid" aria-live="polite">
        {filteredPrograms.length ? (
          filteredPrograms.map((program) => (
            <article className="declaration-card" key={`${program.school}-${program.name}`}>
              <div className="declaration-card-head">
                <span className="declaration-school">{program.school}</span>
                <h2>{program.name}</h2>
              </div>
              <ul>
                {program.requirements.map((requirement) => (
                  <li key={requirement}>{requirement}</li>
                ))}
              </ul>
            </article>
          ))
        ) : (
          <p className="declaration-empty">No declaration requirements match this search.</p>
        )}
      </section>

      <p className="declaration-source">
        Source:{" "}
        <a href="https://catalog.aucegypt.edu/index.php?catoid=44" target="_blank" rel="noreferrer">
          AUC 2025-2026 Academic Catalog
        </a>.
      </p>
    </main>
  );
}
