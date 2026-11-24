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

const creditsByCode = buildCourseCreditMap(DEGREE_REQUIREMENTS as Record<string, Plan>);
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
