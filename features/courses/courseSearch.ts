/**
 * Local, deterministic course search. All titles/codes/departments come from
 * the catalog; the aliases below only describe common student vocabulary.
 * No external search service or per-course mappings are necessary.
 */
export type SearchCourse = {
  code: string;
  title: string;
  subject: string;
  department: string;
  level: string;
};

const aliases: Record<string, string> = {
  calc: "calculus", cal: "calculus",
  diff: "differential", eq: "equation", eqs: "equation",
  equations: "equation", equation: "equation",
  gen: "general", intro: "introduction", introductory: "introduction",
  org: "organic", lab: "laboratory", labs: "laboratory",
  chem: "chemistry", phys: "physics", bio: "biology",
  stats: "statistic", stat: "statistic", statistics: "statistic",
  probs: "probability", prob: "probability",
  econ: "economics", acct: "accounting", comp: "computer",
  sci: "science", mech: "mechanics", engr: "engineering",
  mgmt: "management", psych: "psychology", hist: "history",
  comm: "communication", pol: "political"
};

const subjects: Record<string, string> = {
  math: "MACT", maths: "MACT", mathematics: "MACT",
  cs: "CSCE", chemistry: "CHEM", physics: "PHYS",
  biology: "BIOL", biol: "BIOL",
  accounting: "ACCT", economics: "ECON"
};

const numerals: Record<string, string> = {
  i: "1", ii: "2", iii: "3", iv: "4", v: "5",
  vi: "6", vii: "7", viii: "8", ix: "9", x: "10"
};

const ignore = new Set(["a", "an", "and", "for", "in", "of", "on", "the", "to", "with", "at"]);
const levels = new Set(["1000", "2000", "3000", "4000", "5000", "6000"]);

function clean(text: string): string {
  return String(text || "")
    .normalize("NFKD").replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/([a-z])(\d)/g, "$1 $2")
    .replace(/(\d)([a-z])/g, "$1 $2")
    .replace(/[^a-z0-9]+/g, " ").trim();
}

function canonical(token: string): string {
  if (numerals[token]) return numerals[token];
  const replacement = aliases[token] || token;
  if (replacement.length > 4 && replacement.endsWith("s") &&
      !replacement.endsWith("ss") && !replacement.endsWith("is") &&
      !replacement.endsWith("us")) {
    return replacement.slice(0, -1);
  }
  return replacement;
}

function tokens(text: string): string[] {
  return clean(text).split(/\s+/).filter(Boolean)
    .filter(token => !ignore.has(token))
    .map(canonical);
}

function compact(text: string): string {
  return String(text || "").toLowerCase().replace(/[^a-z0-9]/g, "");
}

function distanceWithin(left: string, right: string, max: number): boolean {
  if (Math.abs(left.length - right.length) > max) return false;
  let prior = Array.from({ length: right.length + 1 }, (_, n) => n);
  for (let i = 1; i <= left.length; i++) {
    const current = [i];
    let lowest = current[0];
    for (let j = 1; j <= right.length; j++) {
      const cost = left[i - 1] === right[j - 1] ? 0 : 1;
      const value = Math.min(prior[j] + 1, current[j - 1] + 1, prior[j - 1] + cost);
      current.push(value);
      lowest = Math.min(lowest, value);
    }
    if (lowest > max) return false;
    prior = current;
  }
  return prior[right.length] <= max;
}

/** Exact, prefix, and conservative typo matches. Numbers are never fuzzy. */
function wordMatch(query: string, candidate: string): { value: number; fuzzy: boolean } | null {
  if (query === candidate) return { value: 120, fuzzy: false };
  if (query.length >= 3 && candidate.startsWith(query)) return { value: 85, fuzzy: false };
  if (/^\d+$/.test(query) || /^\d+$/.test(candidate) || query.length < 4) return null;
  const threshold = query.length >= 7 ? 2 : 1;
  if (distanceWithin(query, candidate, threshold)) return { value: 40, fuzzy: true };
  return null;
}

type Indexed<T extends SearchCourse> = {
  course: T;
  index: number;
  title: string[];
  department: string[];
  subject: string;
  code: string;
  codeCompact: string;
  level: string;
};

function indexCourses<T extends SearchCourse>(catalog: readonly T[]): Indexed<T>[] {
  return catalog.map((course, index) => ({
    course, index, title: tokens(course.title), department: tokens(course.department),
    subject: course.subject.toUpperCase(),
    code: clean(course.code),
    codeCompact: compact(course.code),
    level: clean(course.level).split(" ")[0]
  }));
}

const cachedIndexes = new WeakMap<object, Indexed<SearchCourse>[]>();

function getIndex<T extends SearchCourse>(catalog: readonly T[]): Indexed<T>[] {
  const existing = cachedIndexes.get(catalog);
  if (existing) return existing as Indexed<T>[];
  const index = indexCourses(catalog);
  cachedIndexes.set(catalog, index);
  return index;
}

type Ranked<T> = { course: T; score: number; fuzzy: boolean; order: number };

/**
 * Returns the whole matching set, ranked by relevance (not catalog order).
 * A fuzzy result is used only if there are no direct/prefix matches.
 * Subject filters remain authoritative.
 */
export function searchCatalogCourses<T extends SearchCourse>(
  catalog: readonly T[], rawQuery: string, selectedSubjects: readonly string[] = []
): T[] {
  const queryText = clean(rawQuery);
  const index = getIndex(catalog);
  const selected = new Set(selectedSubjects.map(subject => subject.toUpperCase()));
  if (!queryText) {
    return index.filter(item => !selected.size || selected.has(item.subject)).map(item => item.course);
  }

  const parts = queryText.split(" ").filter(Boolean);
  const subjectCodes = new Set(index.map(item => item.subject));
  const hintedSubject = (subjects[parts[0]] || parts[0].toUpperCase());
  const subjectHint = subjectCodes.has(hintedSubject) ? hintedSubject : "";
  const titleParts = subjectHint ? parts.slice(1) : parts;
  const level = titleParts.find(part => levels.has(part)) || "";
  const meaningfulTerms = titleParts.filter(part => part !== "level" && part !== level)
    .filter(part => !ignore.has(part)).map(canonical);
  const codeQuery = compact(rawQuery);
  const codeParts = codeQuery.match(/^([a-z]{2,7})(\d{2,4}[a-z]?)$/);
  const codeSubject = codeParts ? (subjects[codeParts[1]] || codeParts[1].toUpperCase()) : "";
  const codePrefix = codeParts && subjectCodes.has(codeSubject) ? codeSubject.toLowerCase() + codeParts[2] : "";
  const bareNumber = /^\d{4}$/.test(queryText) && !levels.has(queryText) ? queryText : "";

  const hits: Ranked<T>[] = [];
  for (const item of index) {
    if (selected.size && !selected.has(item.subject)) continue;

    // Course codes always outrank text searches, including when users omit spaces.
    if (item.codeCompact === codeQuery || (codePrefix && item.codeCompact === codePrefix)) {
      hits.push({ course: item.course, score: 16000, fuzzy: false, order: item.index });
      continue;
    }
    if (codePrefix && item.codeCompact.startsWith(codePrefix)) {
      hits.push({ course: item.course, score: 13000 - (item.codeCompact.length - codePrefix.length), fuzzy: false, order: item.index });
      continue;
    }
    if (bareNumber && item.codeCompact.endsWith(bareNumber)) {
      hits.push({ course: item.course, score: 12000, fuzzy: false, order: item.index });
      continue;
    }

    if (subjectHint && item.subject !== subjectHint) continue;
    if (level && item.level !== level) continue;
    if (!meaningfulTerms.length) {
      if (subjectHint || level) hits.push({ course: item.course, score: 2000, fuzzy: false, order: item.index });
      continue;
    }

    let score = 0;
    let fuzzy = false;
    let titleCount = 0;
    let rejected = false;
    for (const term of meaningfulTerms) {
      const bestTitle = item.title.map(word => wordMatch(term, word))
        .filter((found): found is { value: number; fuzzy: boolean } => Boolean(found))
        .sort((a, b) => b.value - a.value)[0];
      if (bestTitle) {
        score += bestTitle.value;
        titleCount++;
        fuzzy ||= bestTitle.fuzzy;
        continue;
      }
      const bestDepartment = item.department.map(word => wordMatch(term, word))
        .filter((found): found is { value: number; fuzzy: boolean } => Boolean(found))
        .sort((a, b) => b.value - a.value)[0];
      if (!bestDepartment) {
        rejected = true;
        break;
      }
      score += Math.round(bestDepartment.value * 0.4);
      fuzzy ||= bestDepartment.fuzzy;
    }
    if (rejected) continue;

    const fullTitle = item.title.join(" ");
    const fullQuery = meaningfulTerms.join(" ");
    let rank = titleCount === meaningfulTerms.length ? 8000 : 4000;
    if (titleCount === meaningfulTerms.length && fullTitle === fullQuery) rank = 11500;
    else if (titleCount === meaningfulTerms.length && fullTitle.startsWith(fullQuery)) rank = 10000;
    rank += score + (subjectHint ? 250 : 0) + (level ? 150 : 0);
    if (fuzzy) rank -= 1200;
    hits.push({ course: item.course, score: rank, fuzzy, order: item.index });
  }

  // Do not clutter good results with plausible but unrelated misspellings.
  const direct = hits.some(hit => !hit.fuzzy);
  return hits.filter(hit => !direct || !hit.fuzzy)
    .sort((a, b) => b.score - a.score || a.order - b.order)
    .map(hit => hit.course);
}
