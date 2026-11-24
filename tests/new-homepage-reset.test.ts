import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { test } from "node:test";
import vm from "node:vm";
import ts from "typescript";

const root = new URL("../", import.meta.url);
const read = (path: string) => readFileSync(new URL(path, root), "utf8");
const exists = (path: string) => existsSync(new URL(path, root));

test("new homepage shows Get Started with a courses-and-professors search", () => {
  const page = read("app/homepagenew/page.tsx");
  assert.match(page, /<h1\b[^>]*>Get Started<\/h1>/);
  assert.match(page, /<HomeSearch scope="catalog"\s*\/>/);
  assert.match(page, /import "\.\/homepagenew\.css"/);
  assert.equal(exists("app/homepagenew/homepagenew.css"), true);
  assert.doesNotMatch(page, /NewHomepageAcademicSections|NewHomepageCourses|NewHomepageMaterials|fetch\(/);
});

test("the catalog search includes courses and professors, not study materials", () => {
  const search = read("features/home/HomeSearch.tsx");
  assert.match(search, /export type SearchScope = [^\n]*"catalog"/);
  assert.match(search, /const professorResults: SearchResult\[\] = professors\.map/);
  assert.match(search, /const courseResults: SearchResult\[\] = courses\.map/);
  assert.match(search, /\(scope === "catalog" && index !== 2\)/);
  assert.match(search, /const searchesMaterials = scope === "all" \|\| scope === "materials"/);
  assert.match(search, /if \(query\.length < 2 \|\| !searchesMaterials\) return/);
  assert.match(search, /scope === "catalog" \? "Search courses or professors"/);
  assert.match(search, /function HomeSearch\(\{ scope = "all" \}/);
});

test("catalog professor results match names only, without department or course matches", () => {
  const search = read("features/home/HomeSearch.tsx");
  assert.match(search, /const professorSearchFields = scope === "catalog"\s*\? \[professor\.name\]/);
  assert.match(search, /getMatchScore\(query, professor\.name, professorSearchFields\)/);
  assert.match(search, /\[query, materialState\.materials, scope\]/);
  // Broad department and course matching remains available to the original homepage.
  assert.match(search, /professor\.id, professor\.department, professor\.displayDepartment/);
  assert.match(search, /professor\.filterDepartment, professor\.course/);
});

test("retired personalized homepage modules are still removed", () => {
  for (const path of [
    "features/home/NewHomepageAcademicSections.tsx",
    "features/home/NewHomepageCourses.tsx",
    "features/home/NewHomepageMaterials.tsx",
    "features/home/NextSemesterProfessorsPreview.tsx",
    "app/api/homepage-course-recommendations/route.ts",
    "app/api/homepage-professor-recommendations/route.ts",
    "app/api/homepage-personalized-materials/route.ts",
    "lib/course-recommendations/homepagePlanner.ts",
    "lib/course-recommendations/newHomepageMechanicalPlan.ts",
    "lib/course-recommendations/newHomepageProfessorRecommendations.ts"
  ]) assert.equal(exists(path), false, path);
});

test("degree progression preview uses saved major and credit totals on new homepage", () => {
  const page = read("app/homepagenew/page.tsx");
  const preview = read("app/homepagenew/DegreeProgressPreview.tsx");
  const css = read("app/homepagenew/homepagenew.css");
  assert.match(page, /<DegreeProgressPreview \/>/);
  assert.match(preview, /from "\.\/degreeProgressSummary"/);
  assert.match(preview, /fetch\(url,/);
  assert.match(preview, /"\/api\/me"/);
  assert.match(preview, /"\/api\/academic-progress"/);
  assert.match(preview, /saved\.data\.degreeProgress\?\.major === major/);
  assert.match(preview, /calculateDegreeProgress\(plan\.groups, completedKeys\)/);
  assert.match(preview, /role="progressbar"/);
  assert.match(preview, /aria-valuenow=\{view\.progress\.percent\}/);
  assert.doesNotMatch(preview, /View requirements/);
  assert.doesNotMatch(preview, /href="\/degree-progression"/);
  assert.doesNotMatch(preview, /Based on the courses you have marked complete/);
  assert.match(preview, /status: "signed-out"/);
  assert.match(preview, /status: "no-major"/);
  assert.doesNotMatch(preview, /\/api\/academic-progress.*method: "POST"/);
  assert.match(css, /\.new-homepage-degree-track/);
  assert.match(css, /\.new-homepage-degree-fill/);
});

test("degree progress totals respect saved keys, elective caps and duplicate elective options", () => {
  const source = read("app/homepagenew/degreeProgressSummary.ts");
  const compiled = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 }
  }).outputText;
  const module = { exports: {} as Record<string, unknown> };
  vm.runInNewContext(compiled, { module, exports: module.exports });
  const calculate = module.exports.calculateDegreeProgress as (
    groups: unknown[], keys: string[]
  ) => { totalCredits: number; completedCredits: number; remainingCredits: number; percent: number };

  const groups = [
    { items: ["MATH 1001 - Intro (3 cr.)", "PHYS 1002 - Lab (1 cr.)"] },
    {
      creditGroup: "elective-cap", creditCap: 6,
      items: ["CSCE 1001 - Programming (3 cr.)", "CSCE 1002 - Data (3 cr.)"],
      subgroups: [{ items: ["CSCE 1001 - Programming (3 cr.)", "CSCE 1003 - Special (4 cr.)"] }]
    }
  ];
  const zero = calculate(groups, []);
  assert.equal(zero.totalCredits, 10);
  assert.equal(zero.completedCredits, 0);
  assert.equal(zero.percent, 0);

  const saved = calculate(groups, ["0-0", "1-0", "1-0-0", "1-0-1"]);
  assert.equal(saved.totalCredits, 10);
  assert.equal(saved.completedCredits, 9); // Core 3 + capped electives 6, not 3 + 3 + 4.
  assert.equal(saved.remainingCredits, 1);
  assert.equal(saved.percent, 90);
});

test("course directory redirects while individual courses remain accessible", () => {
  const directoryPage = read("app/courses/page.tsx");
  assert.match(directoryPage, /redirect\("\/homepagenew"\)/);
  assert.doesNotMatch(directoryPage, /<Courses\b/);

  const coursePage = read("app/courses/[slug]/page.tsx");
  assert.match(coursePage, /<Courses courseSlug=\{slug\}/);
  const search = read("features/home/HomeSearch.tsx");
  assert.match(search, /"\/courses\/" \+ encodeURIComponent\(slug\(code\)\)/);

  const header = read("components/Header.tsx");
  const footer = read("components/Footer.tsx");
  assert.doesNotMatch(header, /href:\s*"\/courses"/);
  assert.doesNotMatch(footer, /href="\/courses"/);
});

test("the original homepage and its API are preserved", () => {
  assert.match(read("app/page.tsx"), /import Home from "\.\.\/features\/home\/Home"/);
  assert.match(read("features/home/Home.tsx"), /homepage-overview/);
  assert.equal(exists("app/api/homepage-overview/route.ts"), true);
  assert.equal(exists("features/home/home.css"), true);
  assert.equal(exists("features/home/HomeSearch.tsx"), true);
});

test("semester course selection is a modal drawer with persistent multi-add results", () => {
  const planner = read("app/homepagenew/SemesterPlanner.tsx");
  const css = read("app/homepagenew/homepagenew.css");
  assert.match(planner, /<dialog ref=\{drawerRef\} className="new-homepage-course-drawer"/);
  assert.match(planner, /drawer\.showModal\(\)/);
  assert.match(planner, /onCancel=\{event => \{ event\.preventDefault\(\); closeCourseDrawer\(\);/);
  assert.match(planner, /setAddedThisSession\(previous => \[\.\.\.previous, code\]\)/);
  assert.match(planner, /!planned\.has\(code\) \|\| added\.has\(code\)/);
  assert.match(planner, /onClick=\{closeCourseDrawer\}>Done<\/button>/);
  assert.doesNotMatch(planner, /setAdding\(/);
  assert.match(css, /\.new-homepage-course-drawer::backdrop/);
  assert.match(css, /width: min\(520px, 100vw\)/);
});
