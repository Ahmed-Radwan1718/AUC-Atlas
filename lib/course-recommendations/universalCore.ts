/**
 * University-wide Core requirements for the AUC Atlas course-planning engine.
 *
 * Planning preferences provided for all majors. "Suggested semesters" describe
 * the preferred early study window, NOT prerequisites or registration limits.
 * A course missed in an earlier semester remains an outstanding recommendation.
 */
export type EarlySemester = 1 | 2;
export type UniversalCoreRequirement = {
  readonly code: string;
  readonly preferredSemester: EarlySemester;
  readonly suggestedSemesters: readonly EarlySemester[];
  readonly credits: number;
};

export const UNIVERSAL_CORE_REQUIREMENTS: readonly UniversalCoreRequirement[] = [
  { code: "CORE 1010", preferredSemester: 1, suggestedSemesters: [1], credits: 3 },
  { code: "RHET 1010", preferredSemester: 1, suggestedSemesters: [1], credits: 3 },
  { code: "SCI 1020", preferredSemester: 1, suggestedSemesters: [1, 2], credits: 3 },
  { code: "RHET 1020", preferredSemester: 2, suggestedSemesters: [2], credits: 3 },
  { code: "LALT 1020", preferredSemester: 2, suggestedSemesters: [2], credits: 0 },
  { code: "PHIL 2100", preferredSemester: 2, suggestedSemesters: [1, 2], credits: 3 }
];

export type UniversalCoreRecommendation = UniversalCoreRequirement & {
  readonly timing: "due" | "overdue";
};

/**
 * Returns incomplete Core courses due in the student's estimated semester,
 * with older unfinished requirements ahead of current-semester requirements.
 * Deliberately does not infer completed courses from an AUC ID, and does not assume prerequisites have been met.
 */
export function recommendUniversalCoreCourses(input: {
  semester: number;
  completedCodes?: ReadonlySet<string> | readonly string[];
}): UniversalCoreRecommendation[] {
  const { semester } = input;
  if (!Number.isInteger(semester) || semester < 1) return [];

  const completed = new Set(
    Array.from(input.completedCodes ?? [], code => code.trim().toUpperCase().replace(/\s+/g, " "))
  );

  return UNIVERSAL_CORE_REQUIREMENTS
    .filter(course => course.preferredSemester <= semester && !completed.has(course.code))
    .map(course => ({
      ...course,
      timing: course.preferredSemester < semester ? "overdue" : "due"
    }));
}
