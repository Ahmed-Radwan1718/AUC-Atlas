import { UNIVERSAL_CORE_REQUIREMENTS } from "./universalCore";

/**
 * MENG semester-by-semester study plan, supplied incrementally.
 * Only semesters 1–4 are defined so far. Do not treat later
 * semesters as empty/complete until their requirements are supplied.
 * Universal Core course credits live in universalCore.ts, not duplicated here.
 */
export type MechanicalStudyCourse = {
  readonly code: string;
  readonly title: string;
  readonly credits: number;
  readonly kind: "core" | "major";
  readonly recommendedSemester: number;
};

/** A Core category slot, not a particular registered course. */
export type MechanicalCoreCategorySlot = {
  readonly kind: "core-category";
  readonly categoryId: "arab-world-studies" | "cultural-explorations" | "humanities-and-social-sciences";
  readonly title: string;
  readonly credits: number;
  readonly recommendedSemester: 3 | 4;
};

export type MechanicalSemesterPlan = {
  readonly semester: number;
  /** Only real course codes; category placeholders are intentionally excluded. */
  readonly courses: readonly MechanicalStudyCourse[];
  readonly coreCategories: readonly MechanicalCoreCategorySlot[];
  /** All semester requirements in their suggested display order. */
  readonly requirements: readonly (MechanicalStudyCourse | MechanicalCoreCategorySlot)[];
  readonly totalCredits: number;
};

const additionalCourses: readonly MechanicalStudyCourse[] = [
  { code: "MACT 1121", title: "Calculus I", credits: 3, kind: "major", recommendedSemester: 1 },
  { code: "PHYS 1011", title: "Physics I", credits: 3, kind: "major", recommendedSemester: 1 },
  { code: "PHYS 1012", title: "Physics I Lab", credits: 1, kind: "major", recommendedSemester: 1 },
  { code: "ENGR 1005", title: "Engineering Drawing", credits: 2, kind: "major", recommendedSemester: 1 },
  { code: "CHEM 1005", title: "General Chemistry I", credits: 3, kind: "major", recommendedSemester: 2 },
  { code: "CHEM 1015", title: "Chemistry I Lab", credits: 1, kind: "major", recommendedSemester: 2 },
  { code: "MACT 1122", title: "Calculus II", credits: 3, kind: "major", recommendedSemester: 2 },
  { code: "ENGR 2102", title: "Engineering Mechanics I (Statics)", credits: 3, kind: "major", recommendedSemester: 2 },
  { code: "MENG 2505", title: "Mechanical Engineering Drawing", credits: 1, kind: "major", recommendedSemester: 2 },
  { code: "ENGR 2104", title: "Dynamics", credits: 3, kind: "major", recommendedSemester: 3 },
  { code: "MACT 2123", title: "Calculus III", credits: 3, kind: "major", recommendedSemester: 3 },
  { code: "PHYS 1021", title: "Physics II", credits: 3, kind: "major", recommendedSemester: 3 },
  { code: "PHYS 1022", title: "Physics II Lab", credits: 1, kind: "major", recommendedSemester: 3 },
  { code: "MACT 2141", title: "Differential Equations", credits: 3, kind: "major", recommendedSemester: 4 },
  { code: "MENG 2112", title: "Strength of Materials", credits: 3, kind: "major", recommendedSemester: 4 },
  { code: "MENG 2601", title: "Fluid Mechanics Fundamentals", credits: 3, kind: "major", recommendedSemester: 4 },
  { code: "MENG 2202", title: "Computational Thinking and Programming Lab", credits: 1, kind: "major", recommendedSemester: 4 },
  { code: "PHYS 2216", title: "Fundamentals of Circuits and Electronics", credits: 2, kind: "major", recommendedSemester: 4 },
  { code: "PHYS 2217", title: "Circuits and Electronics Lab", credits: 1, kind: "major", recommendedSemester: 4 }
];

/** Titles for shared Core courses; their timing and credits remain universal. */
const universalCoreTitles: Readonly<Record<string, string>> = {
  "CORE 1010": "Freshman Seminar",
  "RHET 1010": "Freshman Writing",
  "SCI 1020": "Scientific Thinking",
  "RHET 1020": "Research Writing",
  "PHIL 2100": "Philosophical Thinking",
  "LALT 1020": "Libraries and Learning Technologies"
};

/** Ordered codes, keeping the same sequence the user supplied per semester. */
const earlySemesterCourseCodes: Readonly<Record<1 | 2 | 3 | 4, readonly string[]>> = {
  1: ["CORE 1010", "RHET 1010", "MACT 1121", "PHYS 1011", "PHYS 1012", "SCI 1020", "ENGR 1005"],
  2: ["PHIL 2100", "CHEM 1005", "CHEM 1015", "RHET 1020", "MACT 1122", "ENGR 2102", "MENG 2505", "LALT 1020"],
  3: ["ENGR 2104", "MACT 2123", "PHYS 1021", "PHYS 1022"],
  4: ["MACT 2141", "MENG 2112", "MENG 2601", "MENG 2202", "PHYS 2216", "PHYS 2217"]
};

/**
 * Core category requirements have no fixed course codes. They count toward
 * planned semester credits but must not be treated as specific registrations
 * or passed/failed courses until a student picks an eligible class.
 */
const semesterCoreCategories: Readonly<Partial<Record<1 | 2 | 3 | 4, readonly MechanicalCoreCategorySlot[]>>> = {
  3: [
    { kind: "core-category", categoryId: "arab-world-studies", title: "Arab World Studies Core", credits: 3, recommendedSemester: 3 },
    { kind: "core-category", categoryId: "cultural-explorations", title: "Cultural Explorations Core", credits: 3, recommendedSemester: 3 }
  ],
  4: [
    { kind: "core-category", categoryId: "humanities-and-social-sciences", title: "Humanities and Social Sciences Core", credits: 3, recommendedSemester: 4 }
  ]
};

const courseCatalog = new Map<string, MechanicalStudyCourse>([
  ...UNIVERSAL_CORE_REQUIREMENTS.map(core => [core.code, {
    code: core.code,
    title: universalCoreTitles[core.code] || core.code,
    credits: core.credits,
    kind: "core" as const,
    recommendedSemester: core.preferredSemester
  }] as const),
  ...additionalCourses.map(course => [course.code, course] as const)
]);

function plan(semester: 1 | 2 | 3 | 4): MechanicalSemesterPlan {
  const courses = earlySemesterCourseCodes[semester].map(code => {
    const course = courseCatalog.get(code);
    if (!course) throw new Error("Undefined Mechanical Engineering course: " + code);
    return course;
  });
  const coreCategories = semesterCoreCategories[semester] ?? [];
  const requirements = [...courses, ...coreCategories];
  return {
    semester, courses, coreCategories, requirements,
    totalCredits: requirements.reduce((total, requirement) => total + requirement.credits, 0)
  };
}

export const MECHANICAL_ENGINEERING_EARLY_SEMESTERS: readonly MechanicalSemesterPlan[] = [
  plan(1), plan(2), plan(3), plan(4)
];

/** Only explicitly supplied semesters have a plan so far. */
export function getMechanicalSemesterPlan(semester: number): MechanicalSemesterPlan | null {
  return MECHANICAL_ENGINEERING_EARLY_SEMESTERS.find(item => item.semester === semester) ?? null;
}

export type MechanicalRecommendation = MechanicalStudyCourse & {
  readonly timing: "due" | "overdue";
};

/** Include unfinished earlier courses without assuming completion from the AUC ID. */
export function recommendMechanicalEarlyCourses(input: {
  semester: number;
  completedCodes?: ReadonlySet<string> | readonly string[];
}): MechanicalRecommendation[] {
  if (!Number.isInteger(input.semester) || input.semester < 1) return [];
  const completed = new Set(Array.from(input.completedCodes ?? [],
    code => String(code).trim().toUpperCase().replace(/\s+/g, " ")));
  return MECHANICAL_ENGINEERING_EARLY_SEMESTERS
    .filter(plan => plan.semester <= input.semester)
    .flatMap(plan => plan.courses
      .filter(course => !completed.has(course.code))
      .map(course => ({
        ...course,
        timing: (plan.semester < input.semester ? "overdue" : "due") as "overdue" | "due"
      })));
}
