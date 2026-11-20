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
export type SuggestionKind = "major" | "core";
export type CourseSuggestion = {
  code: string; title: string; semester: number; credits: number; kind: SuggestionKind;
};
export type MechanicalRecommendation = {
  term: string;
  semester: number;
  upcoming: boolean;
  usedSavedProgress: boolean;
  totalCredits: number;
  targetCredits: number;
  courses: CourseSuggestion[];
  requirements: MechanicalCategoryRequirement[];
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
 * Recommend only actual required MENG/engineering courses and the three
 * fixed freshman writing/seminar courses. Never select a random Core category
 * elective or a specific concentration elective on the student's behalf.
 */
export const MECHANICAL_CORE_AND_ELECTIVE_OPTIONS: readonly {
  code: string; semester: number; kind: SuggestionKind;
}[] = [
  { code: "CORE 1010", semester: 1, kind: "core" },
  { code: "RHET 1010", semester: 1, kind: "core" },
  { code: "RHET 1020", semester: 2, kind: "core" }
];

export type MechanicalCategoryRequirement = {
  id: string;
  label: string;
  timing: string;
};

/**
 * Categories are planning reminders, not recommended classes or claims about
 * what the student still needs to take. Core category completion is not
 * recorded by the Mechanical Engineering Degree Progression checkboxes.
 * Freshman requirements may be completed across semesters 1–4 for engineers.
 * Other timings below are suggested planning windows, not registration rules.
 */
export const MECHANICAL_CATEGORY_REQUIREMENTS: readonly (
  MechanicalCategoryRequirement & { from: number; through: number }
)[] = [
  { id: "scientific-thinking", label: "Scientific Thinking",
    from: 1, through: 4, timing: "Any semester 1–4" },
  { id: "philosophical-thinking", label: "Philosophical Thinking",
    from: 1, through: 4, timing: "Any semester 1–4" },
  { id: "cultural-foundations", label: "Cultural Foundations",
    from: 1, through: 4, timing: "Choose a course by semester 4" },
  { id: "information-literacy", label: "Information Literacy",
    from: 1, through: 4, timing: "Complete by semester 4" },
  { id: "humanities-social-sciences", label: "Humanities and Social Sciences",
    from: 4, through: 6, timing: "Plan by semester 6" },
  { id: "egypt-studies", label: "Egypt Studies",
    from: 4, through: 7, timing: "Choose an approved course" },
  { id: "arab-world-studies", label: "Arab World Studies",
    from: 5, through: 8, timing: "Choose an approved course" },
  { id: "global-studies", label: "Global Studies",
    from: 6, through: 9, timing: "Choose an approved course" },
  { id: "concentration-electives", label: "Concentration Electives",
    from: 8, through: 10, timing: "Plan 15 credits across concentrations" },
  { id: "outside-major-capstone", label: "Outside-Major Capstone",
    from: 9, through: 10, timing: "Choose an approved capstone option" }
];

/** One-credit labs and two/four-credit requirements must not be counted as 3. */
export const MECHANICAL_CREDIT_OVERRIDES: Readonly<Record<string, number>> = {
  "CHEM 1015": 1,
  "ENGR 1005": 2,
  "PHYS 1012": 1,
  "PHYS 1022": 1,
  "MENG 2202": 1,
  "MENG 2505": 1,
  "PHYS 2216": 2,
  "PHYS 2217": 1,
  "MENG 3217": 1,
  "MENG 3446": 2,
  "MENG 4606": 4,
  "MENG 4950": 1,
  "MENG 4980": 1,
  "MENG 4981": 2
};

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
  "MENG 4950": ["ENGR 1005", "ENGR 2102", "ENGR 2104", "ENGR 3202", "ENGR 3212", "ENGR 3222"],
  "RHET 1020": ["RHET 1010"],

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
  const major = MECHANICAL_TERM_PLAN.flatMap((codes, index) =>
    codes.map((code, order) => ({
      code, semester: index + 1, order, kind: "major" as SuggestionKind
    }))
  );
  const extras = MECHANICAL_CORE_AND_ELECTIVE_OPTIONS.map((entry, order) => ({
    ...entry, order: 100 + order
  }));
  const plan = [...major, ...extras].filter(course => catalog.has(course.code));
  const manual = Boolean(input.hasSavedProgress && input.completedCodes?.size);
  const completed = manual
    ? new Set(input.completedCodes)
    : new Set(major.filter(course => course.semester < semester).map(course => course.code));

  // University Core checkboxes aren't part of Mechanical Degree Progression.
  // Provisionally infer earlier required freshman courses solely to satisfy
  // sequenced prerequisites, never to claim verified Core completion.
  for (const course of extras) {
    if (course.semester < semester) completed.add(course.code);
  }
  if (manual && semester >= 2) completed.add("MACT 1121");

  const candidates = plan.filter(course => {
    if (completed.has(course.code)) return false;
    // Required writing/seminar courses are tied to their first/second
    // semester, while saved progress can unlock some future major courses.
    const allowed = course.kind === "major"
      ? course.semester <= semester + (manual ? 1 : 0)
      : course.semester === semester;
    if (!allowed) return false;
    return (PREREQUISITES[course.code] || []).every(code => completed.has(code));
  });

  const priorities = (item: { kind: SuggestionKind; semester: number; order: number }) => {
    if (item.semester < semester) return 2; // uncompleted major backlog
    if (item.semester > semester) return 5;
    if (item.kind === "core") return 0;
    if (item.kind === "major") return 1;
    return 3;
  };
  candidates.sort((a, b) =>
    priorities(a) - priorities(b) || a.semester - b.semester || a.order - b.order
  );

  const maxCredits = 18;
  const targetCredits = 15; // Listed-course target; category electives are uncounted.
  const maxCourses = Math.max(1, Math.min(9, Math.floor(input.limit ?? 8)));
  let totalCredits = 0;
  const selected: CourseSuggestion[] = [];
  for (const candidate of candidates) {
    const credits = MECHANICAL_CREDIT_OVERRIDES[candidate.code] ?? 3;
    if (selected.length >= maxCourses || totalCredits + credits > maxCredits) continue;
    selected.push({
      code: candidate.code,
      title: catalog.get(candidate.code)!.title,
      credits, semester: candidate.semester, kind: candidate.kind
    });
    totalCredits += credits;
  }

  return {
    term: current.label, semester, upcoming: current.upcoming,
    usedSavedProgress: manual, totalCredits, targetCredits, courses: selected,
    requirements: MECHANICAL_CATEGORY_REQUIREMENTS
      .filter(requirement => semester >= requirement.from && semester <= requirement.through)
      .map(({ id, label, timing }) => ({ id, label, timing }))
  };
}
