/**
 * Enrollment means the academic term the student first joined AUC, not their
 * current numbered semester. This is a saved user preference; do not infer it
 * as confirmed solely from the AUC ID.
 */
const FIRST_SUPPORTED_YEAR = 2000;

function cairoYearMonth(now: Date): { year: number; month: number } {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Africa/Cairo", year: "numeric", month: "numeric"
  }).formatToParts(now);
  return {
    year: Number(parts.find(part => part.type === "year")?.value),
    month: Number(parts.find(part => part.type === "month")?.value)
  };
}

export function enrollmentTermOptions(now: Date = new Date()): string[] {
  const { year, month } = cairoYearMonth(now);
  const result: string[] = [];
  for (let y = year; y >= FIRST_SUPPORTED_YEAR; y--) {
    if (y < year || month >= 8) result.push("Fall " + y);
    result.push("Spring " + y);
  }
  return result;
}

export function isValidEnrollmentTerm(value: unknown, now: Date = new Date()): value is string {
  return typeof value === "string" && enrollmentTermOptions(now).includes(value);
}
