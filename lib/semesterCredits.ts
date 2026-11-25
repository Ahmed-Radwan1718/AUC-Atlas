import { DEGREE_REQUIREMENTS } from "../data/degree-requirements";

export const SEMESTER_CREDIT_LIMIT = 21;
export const SEMESTER_COURSE_LIMIT = 20;

type Group = { items?: string[]; subgroups?: Group[] };
type Plan = { groups?: Group[] };

// Degree plans include credit-bearing labs, zero-credit courses and ranges.
// Use the upper bound of variable-credit courses so the cap cannot be exceeded.
export function buildCourseCreditMap(plans: Record<string, Plan>): Map<string, number> {
  const credits = new Map<string, number>();
  const totals = new Map<string, number>();
  function visit(group: Group) {
    for (const item of group.items || []) {
      const match = item.match(/^\s*([A-Z]{2,8}\s+\d{3,4}[A-Z]?)\s+-.*\(([^()]*(?:cr\.?)[^()]*)\)\s*$/i);
      if (!match) continue;
      const code = match[1].toUpperCase().replace(/\s+/g, " ");
      const raw = match[2];
      const range = raw.match(/(\d+(?:\.\d+)?)\s*-\s*(\d+(?:\.\d+)?)/);
      const numbers = raw.match(/\d+(?:\.\d+)?/g);
      if (!numbers && !/\bno\s+cr\b/i.test(raw)) continue;
      const value = range ? Number(range[2]) : (numbers || []).reduce((sum, n) => sum + Number(n), 0);
      // A degree-wide repeatable-course total is not the per-enrollment value.
      const target = /\btotal\b/i.test(raw) ? totals : credits;
      target.set(code, Math.max(target.get(code) ?? 0, value));
    }
    group.subgroups?.forEach(visit);
  }
  Object.values(plans).forEach(plan => plan.groups?.forEach(visit));
  for (const [code, total] of totals) if (!credits.has(code)) credits.set(code, total);
  return credits;
}

// Catalog courses outside the degree-plan checklists still need real credit
// values for both the drawer and server-side semester validation.
// Source: AUC 2024–2025 catalog extract, Core Curriculum and program requirements:
// https://catalog.aucegypt.edu/mime/media/view/40/2130/Extract%2B2024-2025%2Bupdated.pdf
// ARIC 2098: https://www.coursicle.com/aucegypt/courses/ARIC/2098/
// BIOL 4910 has a 1–4 credit range; use its upper bound.
const supplementalCatalogCredits: Readonly<Record<string, number>> = {
  "ALWT 3919": 3,
  "AMST 1090": 3,
  "AMST 2096": 3,
  "AMST 2190": 3,
  "ARCH 2501": 3,
  "ARIC 1099": 3,
  "ARIC 2001": 3,
  "ARIC 2098": 3,
  "ARIC 2101": 3,
  "ARIC 2206": 3,
  "ARIC 2271": 3,
  "ARIC 3098": 3,
  "ARIC 3108": 3,
  "ARIC 3109": 3,
  "ARIC 3116": 3,
  "ARIC 3324": 3,
  "ARIC 3344": 3,
  "BIOL 1010": 4,
  "BIOL 1040": 3,
  "BIOL 1098": 4,
  "BIOL 1150": 3,
  "BIOL 1410": 4,
  "BIOL 1930": 3,
  "BIOL 4690": 1,
  "BIOL 4691": 2,
  "BIOL 4910": 4,
  "BUSC 4001": 3,
  "CHEM 2001": 3,
  "CORE 1010": 3,
  "CORE 1099": 3,
  "CORE 1130": 3,
  "CORE 2096": 3,
  "CORE 2097": 3,
  "CORE 2098": 3,
  "ECLT 1023": 3,
  "ECON 4081": 3,
  "ECON 4082": 1,
  "EDUC 1099": 3,
  "EDUC 2011": 3,
  "EGPT 5153": 3,
  "FILM 4250": 3,
  "FILM 4260": 3,
  "HIST 2096": 3,
  "HIST 2097": 3,
  "LALT 1020": 0,
  "LING 2200": 3,
  "LING 2201": 3,
  "LING 2220": 3,
  "LING 2230": 3,
  "MENG 2200": 3,
  "MUSC 2000": 3,
  "MUSC 2010": 3,
  "PHIL 2010": 3,
  "PHIL 2099": 3,
  "PHIL 2100": 3,
  "POLS 1001": 3,
  "POLS 2096": 3,
  "POLS 4000": 3,
  "POLS 4090": 3,
  "POLS 4104": 3,
  "PSYC 2099": 3,
  "PSYC 3021": 3,
  "PSYC 3022": 3,
  "RHET 1010": 3,
  "RHET 1020": 3,
  "RHET 3130": 3,
  "SCI 1020": 3,
  "SEMR 1023": 3,
  "SEMR 1099": 3,
  "SEMR 1110": 3,
  "SOC 2201": 3,
  "SOC 2401": 3,
  "SOC 2402": 3,
  "SOC 2403": 3,
  "THTR 1099": 3,
  "THTR 1101": 3,
  "THTR 2601": 1,
  "THTR 2603": 1,
};

const creditsByCode = buildCourseCreditMap(DEGREE_REQUIREMENTS as Record<string, Plan>);
for (const [code, credits] of Object.entries(supplementalCatalogCredits)) {
  if (!creditsByCode.has(code)) creditsByCode.set(code, credits);
}
export function courseCredits(code: string): number | null {
  return creditsByCode.get(code.trim().toUpperCase().replace(/\s+/g, " ")) ?? null;
}

export function semesterCreditSummary(codes: readonly string[]) {
  let total = 0;
  const unknown: string[] = [];
  for (const code of codes) {
    const credits = courseCredits(code);
    if (credits === null) unknown.push(code);
    else total += credits;
  }
  return { total, unknown, overLimit: total > SEMESTER_CREDIT_LIMIT };
}

export function canAddSemesterCourse(codes: readonly string[], code: string): boolean {
  const current = semesterCreditSummary(codes);
  const credits = courseCredits(code);
  return codes.length < SEMESTER_COURSE_LIMIT && !codes.includes(code) &&
    current.unknown.length === 0 && !current.overLimit && credits !== null &&
    current.total + credits <= SEMESTER_CREDIT_LIMIT;
}

type Semester = { name: string; courses: string[] };
// Preserve legacy overloaded plans: unchanged selections or removals can be saved,
// but no additions are permitted to a semester that still exceeds the cap or has unknown credits.
export function semesterCreditViolation(next: readonly Semester[], previous: readonly Semester[] = []): string | null {
  const old = new Map(previous.map(semester => [semester.name, new Set(semester.courses)]));
  for (const semester of next) {
    const summary = semesterCreditSummary(semester.courses);
    if (!summary.overLimit && !summary.unknown.length) continue;
    const prior = old.get(semester.name);
    if (prior && semester.courses.every(code => prior.has(code))) continue;
    return summary.unknown.length
      ? semester.name + ": credit values are unavailable for one or more courses."
      : semester.name + ": maximum " + SEMESTER_CREDIT_LIMIT + " credits.";
  }
  return null;
}
