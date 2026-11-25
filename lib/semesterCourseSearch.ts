type SearchCourse = { code: string; title: string };

/** Search the whole site catalog, regardless of the student's major. */
export function searchSemesterCourses<T extends SearchCourse>(
  catalog: readonly T[], query: string, canShow: (code: string) => boolean
): T[] {
  const needle = query.trim().toLowerCase().replace(/\s+/g, " ");
  if (!needle) return [];
  const compactNeedle = needle.replace(/\s+/g, "");
  const compactCode = (code: string) => code.toLowerCase().replace(/\s+/g, "");
  return catalog.filter(course =>
    canShow(course.code) &&
    (compactCode(course.code).includes(compactNeedle) ||
      course.title.toLowerCase().includes(needle))
  ).sort((a, b) =>
    Number(compactCode(b.code) === compactNeedle) - Number(compactCode(a.code) === compactNeedle) ||
    Number(compactCode(b.code).startsWith(compactNeedle)) - Number(compactCode(a.code).startsWith(compactNeedle)) ||
    a.code.localeCompare(b.code)
  ).slice(0, 50);
}
