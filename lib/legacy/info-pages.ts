import "server-only";

const LEGACY_RAW_BASE =
  "https://raw.githubusercontent.com/Ahmed-Radwan1718/AUC-Atlas/main";

export type LegacyInfoFile = "faq.html" | "privacy.html" | "terms.html";

const LINK_REPLACEMENTS: Array<[string, string]> = [
  ["index.html", "/"],
  ["professors.html", "/professors"],
  ["courses.html", "/courses"],
  ["gpa-calculator.html", "/gpa-calculator"],
  ["degree-progression.html", "/degree-progression"],
  ["faq.html", "/faq"],
  ["privacy.html", "/privacy"],
  ["terms.html", "/terms"],
];

function rewriteLegacyLinks(html: string) {
  return LINK_REPLACEMENTS.reduce((result, [legacyPath, nextPath]) => {
    return result
      .replaceAll(`href="${legacyPath}"`, `href="${nextPath}"`)
      .replaceAll(`href='${legacyPath}'`, `href='${nextPath}'`);
  }, html);
}

export async function getLegacyInfoPage(file: LegacyInfoFile) {
  const response = await fetch(`${LEGACY_RAW_BASE}/${file}`, {
    next: { revalidate: 86400 },
    headers: { Accept: "text/html" },
  });

  if (!response.ok) {
    throw new Error(`Could not load ${file} from the read-only legacy repository.`);
  }

  const source = await response.text();
  const main = source.match(/<main\s+class=["']info-page["'][^>]*>[\s\S]*?<\/main>/i);

  if (!main) {
    throw new Error(`Could not locate the info page markup in ${file}.`);
  }

  return rewriteLegacyLinks(main[0]);
}
