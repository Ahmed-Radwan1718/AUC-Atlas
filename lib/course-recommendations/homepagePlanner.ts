/**
 * Homepage schedule helpers. Enrollment is user-selected; AUC ID is never
 * treated as proof that a semester or course was completed.
 */
export type ScheduledSemester = {
  readonly semester: number;
  readonly term: string;
  readonly upcoming: boolean;
};

export function semesterFromEnrollment(enrollmentTerm: string, now: Date = new Date()): ScheduledSemester | null {
  const match = /^(Spring|Fall) (20\d{2})$/.exec(enrollmentTerm.trim());
  if (!match || !Number.isFinite(now.getTime())) return null;

  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Africa/Cairo", year: "numeric", month: "numeric"
  }).formatToParts(now);
  const year = Number(parts.find(part => part.type === "year")?.value);
  const month = Number(parts.find(part => part.type === "month")?.value);
  if (!Number.isInteger(year) || !Number.isInteger(month)) return null;

  // June/July have no regular semester: preview the upcoming Fall term.
  const upcoming = month === 6 || month === 7;
  const season = month >= 8 || upcoming ? "Fall" : "Spring";
  const startIndex = Number(match[2]) * 2 + (match[1] === "Fall" ? 1 : 0);
  const targetIndex = year * 2 + (season === "Fall" ? 1 : 0);
  const semester = targetIndex - startIndex + 1;
  return semester >= 1 ? { semester, term: season + " " + year, upcoming } : null;
}

export type DegreeChecklistGroup = {
  readonly items?: readonly string[];
  readonly subgroups?: readonly { readonly items?: readonly string[] }[];
};

/**
 * Degree Progression stores checkbox keys ("0-0", "1-3", etc.), not
 * course codes. Resolve them with the same group/item indexing the UI uses.
 */
export function completedCourseCodesFromChecklist(
  savedKeys: readonly string[],
  groups: readonly DegreeChecklistGroup[]
): Set<string> {
  const checked = new Set(savedKeys);
  const completed = new Set<string>();
  function include(key: string, item: string) {
    if (!checked.has(key)) return;
    const match = /^([A-Z]{2,5}\s+\d{4}[A-Z]?)\s*-\s*/.exec(item);
    if (match) completed.add(match[1].replace(/\s+/g, " "));
  }
  groups.forEach((group, groupIndex) => {
    (group.items ?? []).forEach((item, itemIndex) => include(groupIndex + "-" + itemIndex, item));
    (group.subgroups ?? []).forEach((subgroup, subgroupIndex) => {
      (subgroup.items ?? []).forEach((item, itemIndex) =>
        include(groupIndex + "-" + subgroupIndex + "-" + itemIndex, item));
    });
  });
  return completed;
}
