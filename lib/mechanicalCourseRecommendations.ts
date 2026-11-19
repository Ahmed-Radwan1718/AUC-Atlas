/**
 * Mechanical Engineering homepage suggestions (first-major pilot).
 *
 * This is an inferred path through the current AUC Atlas requirements, NOT an
 * official AUC semester plan, enrollment record, or course-offering schedule.
 * No individual student's schedule is inferred as a fact.
 */
export type MechanicalCatalogCourse = { code: string; title: string };
export type DegreeRequirementPlan = {
  groups?: Array<{
    items?: string[];
    subgroups?: Array<{ items?: string[] }>;
  }>;
};
export type CourseSuggestion = { code: string; title: string; semester: number };
export type MechanicalRecommendation = {
  term: string;
  semester: number;
  upcoming: boolean;
  usedSavedProgress: boolean;
  courses: CourseSuggestion[];
};

export const MECHANICAL_TERM_PLAN: readonly (readonly string[])[] = [
  ["MACT 1121", "CHEM 1005", "CHEM 1015", "ENGR 1005"],
  ["MACT 1122", "PHYS 1011", "PHYS 1012", "MENG 2505"],
  ["MACT 2123", "MACT 2141", "PHYS 1021", "PHYS 1022", "ENGR 2102"],
  ["ENGR 2104", "MENG 2112", "MENG 2202", "PHYS 2216", "PHYS 2217"],
  ["ENGR 3202", "MENG 2601", "MENG 3207", "MENG 3217", "MACT 3224", "ENGR 3212"],
  ["MENG 3209", "MENG 3502", "MENG 3505", "MENG 3601", "ENGR 3222"],
  ["MENG 3506", "MENG 3602", "MENG 3605", "MENG 3402", "MENG 3446"],
  ["MENG 3705", "MENG 4208", "MENG 4507", "MENG 4606"],
  ["MENG 4980", "MENG 4950"],
  ["MENG 4981"]
];

/**
 * Prerequisite choices are the Mechanical Engineering track's normal path.
 * Co-requisites such as PHYS 1011/1012, PHYS 1021/1022, MENG 3207/3217
 * and PHYS 2216/2217 are intentionally not treated as prior-term requirements.
 * Real catalog conditions, waivers and registration permission still apply.
 */
const PREREQUISITES: Readonly<Record<string, readonly string[]>> = {
  "MACT 1122": ["MACT 1121"],
  "PHYS 1011": ["MACT 1121"],
  "PHYS 1021": ["PHYS 1011", "PHYS 1012", "MACT 1122"],
  "ENGR 2102": ["MACT 1121", "PHYS 1011"],
  "ENGR 2104": ["MACT 1122", "ENGR 2102"],
  "MACT 2123": ["MACT 1122"],
  "MACT 2141": ["MACT 1122"],
  "MACT 3224": ["MACT 1122"],
  "MENG 2505": ["ENGR 1005"],
  "MENG 2112": ["ENGR 2102"],
  "MENG 2202": ["PHYS 1021"],
  "PHYS 2216": ["PHYS 1021"],
  "ENGR 3212": ["PHYS 1021", "MACT 1122"],
  "ENGR 3222": ["MACT 1121"],
  "ENGR 3202": ["MENG 2202", "MACT 2141"],
  "MENG 2601": ["PHYS 1021", "ENGR 2104"],
  "MENG 3207": ["CHEM 1005", "MENG 2112"],
  "MENG 3217": ["MENG 2112"],
  "MENG 3209": ["MENG 3207"],
  "MENG 3502": ["ENGR 2104", "ENGR 3202"],
  "MENG 3505": ["MENG 2112", "MENG 2505", "ENGR 3202"],
  "MENG 3601": ["MENG 2601", "CHEM 1005", "CHEM 1015"],
  "MENG 3506": ["ENGR 2104", "MENG 2505", "MENG 3209", "MENG 3505"],
  "MENG 3602": ["MENG 2601", "MENG 3601"],
  "MENG 3605": ["MENG 3601"],
  "MENG 3402": ["ENGR 3202", "MACT 3224"],
  "MENG 3446": ["MACT 3224", "ENGR 3222"],
  "MENG 3705": ["PHYS 2216", "PHYS 2217", "MENG 3502"],
  "MENG 4208": ["MENG 3209", "MENG 3506"],
  "MENG 4507": ["MENG 3506", "MENG 3502"],
  "MENG 4606": ["ENGR 3202", "MENG 3602"],
  "MENG 4980": ["MENG 3446", "MENG 3605", "MENG 3705"],
  "MENG 4981": ["MENG 4980"],
  "MENG 4950": ["ENGR 1005", "ENGR 2102", "ENGR 2104", "ENGR 3202", "ENGR 3212", "ENGR 3222"]
};

export function enrollmentYearFromAucId(value: unknown, currentYear: number): number | null {
  const match = String(value ?? "").trim().match(/^900(\d{2})\d{4}$/);
  if (!match) return null;
  const year = 2000 + Number(match[1]);
  return year >= 2010 && year <= currentYear ? year : null;
}

export function cairoAcademicTerm(date: Date): {
  label: string; year: number; season: "Fall" | "Spring"; upcoming: boolean;
} {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Africa/Cairo", year: "numeric", month: "numeric"
  }).formatToParts(date);
  const year = Number(parts.find(part => part.type === "year")?.value);
  const month = Number(parts.find(part => part.type === "month")?.value);
  const season = month >= 6 ? "Fall" : "Spring";
  // January (winter) and June-August (summer) show the upcoming regular term.
  const upcoming = month === 1 || (month >= 6 && month <= 8);
  return { year, season, label: season + " " + year, upcoming };
}

/** Maps Degree Progression checkbox identifiers back to catalog course codes. */
export function completedMechanicalCourses(
  completedKeys: readonly string[], plan: DegreeRequirementPlan
): Set<string> {
  const result = new Set<string>();
  const groups = plan.groups || [];
  for (const key of completedKeys) {
    const match = /^(\d{1,3})-(?:(\d{1,3})-)?(\d{1,3})$/.exec(key);
    if (!match) continue;
    const group = groups[Number(match[1])];
    const entries = match[2] === undefined
      ? group?.items
      : group?.subgroups?.[Number(match[2])]?.items;
    const item = entries?.[Number(match[3])];
    if (typeof item !== "string") continue;
    const code = item.split(" - ")[0]?.trim().toUpperCase() || "";
    if (/^[A-Z]{3,5}\s+\d{4}[A-Z]?$/.test(code)) result.add(code);
  }
  return result;
}

export function recommendMechanicalCourses(input: {
  aucId: unknown;
  completedCodes?: ReadonlySet<string>;
  hasSavedProgress?: boolean;
  catalog: readonly MechanicalCatalogCourse[];
  today?: Date;
  limit?: number;
}): MechanicalRecommendation | null {
  const today = input.today || new Date();
  const current = cairoAcademicTerm(today);
  const enrolled = enrollmentYearFromAucId(input.aucId, current.year);
  if (enrolled === null) return null;

  // Mechanical Engineering is modeled as a ten-regular-semester pathway.
  const semester = Math.max(1, Math.min(10,
    current.season === "Fall"
      ? (current.year - enrolled) * 2 + 1
      : (current.year - enrolled) * 2
  ));
  const catalog = new Map(input.catalog.map(course => [course.code.toUpperCase(), course]));
  const all = MECHANICAL_TERM_PLAN.flatMap((codes, index) =>
    codes.map((code, order) => ({ code, semester: index + 1, order }))
  );
  // Never display a phantom course when the source catalog does not contain it.
  const plan = all.filter(course => catalog.has(course.code));
  const manual = Boolean(input.hasSavedProgress && input.completedCodes?.size);
  const completed = manual
    ? new Set(input.completedCodes)
    : new Set(plan.filter(course => course.semester < semester).map(course => course.code));

  // MACT 1121 belongs to preparatory mathematics rather than the mechanical
  // degree checklist. Progress checkboxes cannot explicitly confirm it.
  if (manual && semester >= 2) completed.add("MACT 1121");

  const eligible = plan.filter(course => {
    if (completed.has(course.code)) return false;
    if (course.semester > semester + (manual ? 1 : 0)) return false;
    return (PREREQUISITES[course.code] || []).every(code => completed.has(code));
  });

  eligible.sort((a, b) => {
    const score = (item: { semester: number }) =>
      item.semester <= semester ? semester - item.semester : 3 * (item.semester - semester);
    return score(a) - score(b) || a.semester - b.semester || a.order - b.order;
  });

  const limit = Math.max(1, Math.min(6, Math.floor(input.limit ?? 6)));
  const selected = eligible.slice(0, limit).map(course => ({
    code: course.code,
    title: catalog.get(course.code)!.title,
    semester: course.semester
  }));

  return { term: current.label, semester, upcoming: current.upcoming,
    usedSavedProgress: manual, courses: selected };
}
