import { UNIVERSAL_CORE_REQUIREMENTS } from "./universalCore";

/**
 * MENG semester-by-semester study plan, supplied incrementally.
 * Only semesters 1 and 2 are defined so far. Do not treat subsequent
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

export type MechanicalSemesterPlan = {
  readonly semester: number;
  readonly courses: readonly MechanicalStudyCourse[];
  readonly totalCredits: number;
};

const additionalCourses: readonly MechanicalStudyCourse[] = [
  { code: "MACT 1121", title: "Calculus I", credits: 3, kind: "major", recommendedSemester: 1 },
  { code: "CHEM 1005", title: "General Chemistry I", credits: 3, kind: "major", recommendedSemester: 1 },
  { code: "CHEM 1015", title: "Chemistry Lab", credits: 1, kind: "major", recommendedSemester: 1 },
  { code: "ENGR 1005", title: "Engineering Drawing", credits: 2, kind: "major", recommendedSemester: 1 },
  { code: "MACT 1122", title: "Calculus II", credits: 3, kind: "major", recommendedSemester: 2 },
  { code: "PHYS 1011", title: "Physics I", credits: 3, kind: "major", recommendedSemester: 2 },
  { code: "PHYS 1012", title: "Physics I Lab", credits: 1, kind: "major", recommendedSemester: 2 }
];

/** Ordered codes, keeping the same sequence the user supplied per semester. */
const earlySemesterCourseCodes: Readonly<Record<1 | 2, readonly string[]>> = {
  1: ["CORE 1010", "RHET 1010", "SCI 1020", "MACT 1121", "CHEM 1005", "CHEM 1015", "ENGR 1005"],
  2: ["RHET 1020", "PHIL 2100", "LALT 1020", "MACT 1122", "PHYS 1011", "PHYS 1012"]
};

const courseCatalog = new Map<string, MechanicalStudyCourse>([
  ...UNIVERSAL_CORE_REQUIREMENTS.map(core => [core.code, {
    code: core.code,
    title: core.code,
    credits: core.credits,
    kind: "core" as const,
    recommendedSemester: core.preferredSemester
  }] as const),
  ...additionalCourses.map(course => [course.code, course] as const)
]);

function plan(semester: 1 | 2): MechanicalSemesterPlan {
  const courses = earlySemesterCourseCodes[semester].map(code => {
    const course = courseCatalog.get(code);
    if (!course) throw new Error("Undefined Mechanical Engineering course: " + code);
    return course;
  });
  return {
    semester, courses,
    totalCredits: courses.reduce((total, course) => total + course.credits, 0)
  };
}

export const MECHANICAL_ENGINEERING_EARLY_SEMESTERS: readonly MechanicalSemesterPlan[] = [
  plan(1), plan(2)
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
