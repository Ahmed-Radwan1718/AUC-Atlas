import "server-only";

import { faqInfoHtml } from "@/data/info-pages/faq";
import { privacyInfoHtml } from "@/data/info-pages/privacy";
import { termsInfoHtml } from "@/data/info-pages/terms";

export type LegacyInfoFile = "faq.html" | "privacy.html" | "terms.html";

const INFO_PAGES: Record<LegacyInfoFile, string> = {
  "faq.html": faqInfoHtml,
  "privacy.html": privacyInfoHtml,
  "terms.html": termsInfoHtml,
};

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
  return rewriteLegacyLinks(INFO_PAGES[file]);
}
