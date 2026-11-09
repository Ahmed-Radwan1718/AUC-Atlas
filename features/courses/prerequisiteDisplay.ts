/**
 * Concise course-page prerequisite summary. The original catalog text stays
 * untouched in data/course-meta.ts; only the displayed text is simplified.
 * Non-course eligibility prose is deliberately omitted from this UI.
 */
export function summarizeCoursePrerequisite(value: string): string {
  const source = String(value || "");
  const codePattern = /\b[A-Z]{2,5}\s*\d{4}[A-Z]?\b/gi;
  const seen = new Set<string>();
  let summary = "";
  let previousEnd = -1;

  for (const match of source.matchAll(codePattern)) {
    const code = match[0].toUpperCase().replace(/\s+/g, " ");
    if (seen.has(code)) continue;
    seen.add(code);

    if (summary) {
      // Keep explicit course alternatives/conjunctions without copying
      // lengthy requirements such as high-school qualifications or standing.
      const between = source.slice(previousEnd, match.index);
      const directRelation = !/[.\n;]/.test(between);
      const separator = directRelation && /\bor\b/i.test(between)
        ? " or "
        : directRelation && /\band\b/i.test(between)
          ? " and "
          : ", ";
      summary += separator;
    }
    summary += code;
    previousEnd = match.index! + match[0].length;
  }

  if (/\bexempt(?:ion|ed)?\b/i.test(source)) {
    return summary ? summary + " or Exemption exam" : "Exemption exam";
  }

  return summary;
}
