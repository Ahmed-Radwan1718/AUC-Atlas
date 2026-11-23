/**
 * Mechanical Engineering course lists for /homepagenew only.
 *
 * These are fixed, owner-supplied semester lists. Do not derive them from
 * degree progression, catalog prerequisites, previous planning algorithms,
 * or a student's saved completion checkboxes.
 *
 * Only semesters 1, 2, 3, and 4 have been provided. Later semesters remain pending.
 */
export type NewHomepageMechanicalCourse = {
  readonly code: string;
  readonly title: string;
  readonly credits: number;
  readonly kind: "core" | "major";
};

export type NewHomepageMechanicalChoice = {
  readonly id: string;
  readonly label: string;
  readonly credits: number;
};

export type NewHomepageMechanicalPlan = {
  readonly semester: number;
  readonly courses: readonly NewHomepageMechanicalCourse[];
  /** Unspecified electives are requirements, never fabricated course codes. */
  readonly requirements: readonly NewHomepageMechanicalChoice[];
  readonly totalCredits: number;
};

function fixedPlan(
  semester: number,
  courses: readonly NewHomepageMechanicalCourse[],
  requirements: readonly NewHomepageMechanicalChoice[] = []
): NewHomepageMechanicalPlan {
  return {
    semester, courses, requirements,
    totalCredits: [...courses, ...requirements]
      .reduce((total, requirement) => total + requirement.credits, 0)
  };
}

const plans: readonly NewHomepageMechanicalPlan[] = [
  // Semester 1 — Fall (18 credits)
  fixedPlan(1, [
    { code: "CORE 1010", title: "Freshman Seminar", credits: 3, kind: "core" },
    { code: "RHET 1010", title: "Freshman Writing", credits: 3, kind: "core" },
    { code: "MACT 1121", title: "Calculus I", credits: 3, kind: "major" },
    { code: "ENGR 1005", title: "Engineering Drawing", credits: 2, kind: "major" },
    { code: "PHYS 1011", title: "Physics I", credits: 3, kind: "major" },
    { code: "PHYS 1012", title: "Physics I Lab", credits: 1, kind: "major" },
    { code: "SCI 1020", title: "Scientific Thinking", credits: 3, kind: "core" }
  ]),

  // Semester 2 — Spring (16 credits)
  fixedPlan(2, [
    { code: "MACT 1122", title: "Calculus II", credits: 3, kind: "major" },
    { code: "CHEM 1005", title: "General Chemistry I", credits: 3, kind: "major" },
    { code: "CHEM 1015", title: "General Chemistry Laboratory", credits: 1, kind: "major" },
    { code: "RHET 1020", title: "Research Writing", credits: 3, kind: "core" },
    { code: "PHIL 2100", title: "Philosophical Thinking", credits: 3, kind: "core" },
    { code: "LALT 1020", title: "Libraries and Learning Technologies", credits: 0, kind: "core" }
  ], [
    { id: "cultural-foundations", label: "Cultural Foundations elective", credits: 3 }
  ]),

  // Semester 3 — 17 credits (six fixed courses and one HU/SS choice)
  fixedPlan(3, [
    { code: "MACT 2123", title: "Calculus III", credits: 3, kind: "major" },
    { code: "ENGR 2102", title: "Engineering Mechanics I (Statics)", credits: 3, kind: "major" },
    { code: "PHYS 1021", title: "Physics II", credits: 3, kind: "major" },
    { code: "PHYS 1022", title: "Physics II Lab", credits: 1, kind: "major" },
    { code: "MENG 2505", title: "Mechanical Engineering Drawing", credits: 1, kind: "major" },
    { code: "ENGR 3222", title: "Engineering Economy", credits: 3, kind: "major" }
  ], [
    { id: "humanities-social-sciences", label: "Humanities and Social Sciences (HU/SS)", credits: 3 }
  ]),

  // Semester 4 — Spring (16 credits)
  fixedPlan(4, [
    { code: "ENGR 2104", title: "Engineering Mechanics II (Dynamics)", credits: 3, kind: "major" },
    { code: "MENG 2112", title: "Strength of Materials", credits: 3, kind: "major" },
    { code: "PHYS 2216", title: "Fundamentals of Circuits and Electronics", credits: 2, kind: "major" },
    { code: "PHYS 2217", title: "Circuits and Electronics Lab", credits: 1, kind: "major" },
    { code: "MACT 2141", title: "Differential Equations", credits: 3, kind: "major" },
    { code: "MENG 2202", title: "Computational Thinking and Programming Lab", credits: 1, kind: "major" }
  ], [
    { id: "arab-world-studies", label: "Arab World Studies", credits: 3 }
  ])
];

/** Returns null for semesters the owner has not supplied yet. */
export function getNewHomepageMechanicalSemesterPlan(
  semester: number
): NewHomepageMechanicalPlan | null {
  return plans.find(plan => plan.semester === semester) ?? null;
}
