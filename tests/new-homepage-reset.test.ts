import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { test } from "node:test";
import vm from "node:vm";
import ts from "typescript";

const root = new URL("../", import.meta.url);
const read = (path: string) => readFileSync(new URL(path, root), "utf8");
const exists = (path: string) => existsSync(new URL(path, root));

test("new homepage shows Get Started with a courses-and-professors search", () => {
  const page = read("app/page.tsx");
  assert.match(page, /<h1\b[^>]*>Get Started<\/h1>/);
  assert.match(page, /<HomeSearch scope="catalog"\s*\/>/);
  assert.match(page, /import "\.\/homepagenew\/homepagenew\.css"/);
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
  const page = read("app/page.tsx");
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
  assert.match(directoryPage, /redirect\("\/"\)/);
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

test("the new homepage is canonical and the experimental URL redirects", () => {
  const page = read("app/page.tsx");
  assert.match(page, /<HomeSearch scope="catalog"\s*\/>/);
  assert.match(page, /<SemesterPlanner\s*\/>/);
  assert.match(page, /canonical: "https:\/\/aucatlas\.com\/"/);
  assert.doesNotMatch(page, /index:\s*false|features\/home\/Home"/);
  assert.match(read("app/homepagenew/page.tsx"), /permanentRedirect\("\/"\)/);
  const header = read("components/Header.tsx");
  assert.match(header, /usesNewNavbar = pathname === "\/"/);
  assert.match(header, /href="\/" className="site-header-logo"/);
  assert.equal(exists("app/api/homepage-overview/route.ts"), true);
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


test("Professor Insights follows live planner state and uses protected course review reads", () => {
  const planner = read("app/homepagenew/SemesterPlanner.tsx");
  const insights = read("app/homepagenew/ProfessorInsights.tsx");
  assert.match(planner, /<ProfessorInsights semesters=\{semesters\} current=\{currentSemester\(\)\} account=\{account\} \/>/);
  assert.match(insights, /aria-label="Professor insights semester"/);
  assert.match(insights, /\/api\/professor-reviews\?courseCode=/);
  assert.match(insights, /response.status === 401/);
  assert.match(insights, /<SemesterInsights\b[^>]*codes=\{selected\.courses\}/);
  assert.match(insights, /<ProfessorColumn label="Consider" category="consider"/);
  assert.match(insights, /<ProfessorColumn label="Avoid" category="caution"/);
  assert.match(insights, /insight\.courseCode \+ ":" \+ insight\.professorId/);
  assert.match(insights, /summarizeCourseProfessors\(data\.reviews, code\)/);
  assert.match(insights, /new-homepage-insights-person-course/);
  assert.doesNotMatch(insights, /function CourseInsights|new-homepage-insights-course-toggle/);
  assert.doesNotMatch(insights, /Explore professors for your planned courses\.|Based on available past and current student reviews/);
});

test("course insights reject unrelated and duplicate reviews, avoid overclaiming small samples, and rank extremes", () => {
  const source = read("app/homepagenew/professorInsightsSummary.ts");
  const compiled = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 }
  }).outputText;
  const module = { exports: {} as Record<string, unknown> };
  vm.runInNewContext(compiled, { module, exports: module.exports });
  type Insight = { professorId: string; category: string; averageRating: number; reviewCount: number; themes: string[] };
  const summarize = module.exports.summarizeCourseProfessors as (reviews: unknown[], code: string) => Insight[];
  const review = (id: string, professorId: string, rating: number, courseCode = "MENG 3209") =>
    ({ id, professorId, professorName: professorId, rating, courseCode, lectureUsefulness: "Helpful" });
  const reviews = [
    review("a", "high", 5), review("b", "high", 5), review("c", "high", 4),
    review("a", "high", 5), review("d", "high", 1, "MENG 3402"),
    review("e", "low", 1), review("f", "low", 2), review("g", "low", 2),
    review("h", "small", 1), review("i", "small", 1),
    review("j", "bad", 0), review("k", "mid", 3), review("l", "mid", 3), review("m", "mid", 3)
  ];
  const result = summarize(reviews, "MENG3209");
  assert.equal(result.length, 4);
  assert.equal(result[0].professorId, "high");
  assert.equal(result[0].reviewCount, 3);
  assert.equal(result[0].category, "consider");
  assert.equal(result[0].averageRating, 14 / 3);
  assert.equal(result[0].themes[0], "Lectures: Helpful (3/3 responses)");
  assert.equal(result[1].professorId, "low");
  assert.equal(result[1].category, "caution");
  assert.equal(result[2].category, "other");
  assert.equal(result[3].category, "limited");
  assert.equal(summarize([], "MENG 3209").length, 0);
});


test("semester credit cap uses actual catalog credits and preserves legacy plans for cleanup", () => {
  const source = read("lib/semesterCredits.ts");
  const compiled = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 }
  }).outputText;
  const module = { exports: {} as Record<string, any> };
  const codes = Array.from({ length: 8 }, (_, i) => "MENG " + (4200 + i));
  const items = codes.map(code => code + " - Course (3 cr.)");
  items.push("CHEM 1015 - Laboratory (1 cr.)", "TEST 1000 - Training (0 cr.)",
    "TEST 2000 - Variable (1-4 cr.)", "TEST 3000 - Combined (3 cr. + 1 cr.)");
  vm.runInNewContext(compiled, {
    module, exports: module.exports,
    require(id: string) {
      assert.equal(id, "../data/degree-requirements");
      return { DEGREE_REQUIREMENTS: { Test: { groups: [{ items }] } } };
    }
  });
  const { courseCredits, semesterCreditSummary, canAddSemesterCourse, semesterCreditViolation } = module.exports;
  assert.equal(courseCredits("CHEM 1015"), 1);
  assert.equal(courseCredits("TEST 1000"), 0);
  assert.equal(courseCredits("TEST 2000"), 4);
  assert.equal(courseCredits("TEST 3000"), 4);
  assert.equal(courseCredits("UNKNOWN 1000"), null);
  const seven = codes.slice(0, 7);
  assert.equal(semesterCreditSummary(seven).total, 21);
  assert.equal(canAddSemesterCourse(seven, codes[7]), false);
  assert.equal(canAddSemesterCourse(seven, "CHEM 1015"), false);
  assert.equal(canAddSemesterCourse(seven, "TEST 1000"), true);
  assert.equal(canAddSemesterCourse(codes.slice(0, 6), codes[6]), true);
  assert.equal(canAddSemesterCourse([], "UNKNOWN 1000"), false);
  const semester = (courses: string[]) => [{ name: "Fall 2026", courses }];
  assert.equal(semesterCreditViolation(semester(seven)), null);
  assert.match(semesterCreditViolation(semester(codes)), /maximum 21 credits/);
  assert.equal(semesterCreditViolation(semester(codes), semester(codes)), null);
  assert.equal(semesterCreditViolation(semester(seven), semester(codes)), null);
  assert.match(semesterCreditViolation(semester([...codes, "TEST 1000"]), semester(codes)), /maximum 21 credits/);
  assert.match(semesterCreditViolation(semester(["UNKNOWN 1000"])), /credit values are unavailable/);
  assert.equal(semesterCreditViolation(semester([]), semester(["UNKNOWN 1000"])), null);
  assert.match(read("app/api/semester-plan/route.ts"), /semesterCreditViolation\(semesters, previous\)/);
  assert.match(read("app/homepagenew/SemesterPlanner.tsx"), /canAddSemesterCourse\(selected.courses, code\)/);
});

test("semester planner uses a non-interactive skeleton until saved data loads", () => {
  const planner = read("app/homepagenew/SemesterPlanner.tsx");
  const css = read("app/homepagenew/homepagenew.css");
  const skeleton = planner.slice(planner.indexOf("function SemesterPlannerSkeleton()"), planner.indexOf("export default function SemesterPlanner()"));
  assert.match(planner, /account === "loading" \? \(\s*<SemesterPlannerSkeleton \/>\s*\) : \(/);
  assert.match(planner, /aria-busy=\{account === "loading"\}/);
  assert.match(skeleton, /aria-label="Loading semester plan"/);
  assert.match(skeleton, /new-homepage-semester-tabs/);
  assert.match(skeleton, /new-homepage-semester-meta/);
  assert.match(skeleton, /new-homepage-semester-courses/);
  assert.doesNotMatch(skeleton, /<button\b|<a\b|<input\b|onClick/);
  assert.match(css, /\.new-homepage-semester-skeleton-block/);
  assert.match(css, /animation: new-homepage-insights-shimmer/);
  assert.match(css, /\.new-homepage-semester-skeleton-block \{ animation: none; \}/);
});

test("the global header uses a centered logo and an accessible left navigation drawer", () => {
  const header = read("components/Header.tsx");
  const css = read("components/header.css");
  assert.doesNotMatch(header, /<nav className="site-header-nav"/);
  assert.match(header, /aria-controls="atlas-navigation-drawer"/);
  assert.match(header, /<dialog ref=\{drawerRef\} id="atlas-navigation-drawer"/);
  assert.match(header, /drawer\.showModal\(\)/);
  assert.match(header, /onCancel=\{event => \{ event\.preventDefault\(\); setNavOpen\(false\); \}\}/);
  for (const route of ["/professors", "/gpa-calculator", "/degree-progression", "/faq"]) {
    assert.ok(header.includes(route));
  }
  assert.doesNotMatch(header, /Semester planner|new-homepage-semester-title/);
  assert.match(read("app/homepagenew/SemesterPlanner.tsx"), /id="new-homepage-semester-title"/);
  assert.match(css, /\.site-header \.hamburger-toggle\s*\{\s*grid-column: 1/);
  assert.match(css, /@keyframes atlas-nav-slide-in\s*\{\s*from\s*\{\s*transform: translateX\(-100%\)/);
  assert.match(css, /prefers-reduced-motion: reduce/);
});

test("degree progression is a standalone academic page, not an account panel", () => {
  const page = read("features/progression/DegreeProgression.tsx");
  const runtime = read("features/progression/degreeRuntime.ts");
  const css = read("features/progression/progression.css");
  const account = read("features/accounts/accountsMarkup.ts");
  const header = read("components/Header.tsx");
  assert.doesNotMatch(page, /account-sidebar|degree-logout-sidebar/);
  assert.doesNotMatch(runtime, /degree-logout-sidebar|logoutButton/);
  assert.doesNotMatch(account, /degree-progression/);
  assert.doesNotMatch(header, /floating-degree-link/);
  assert.match(header, /href: "\/degree-progression", label: "Degree progression"/);
  assert.match(css, /\.degree-page \.degree-inner \{ width: 100%; max-width: 860px;/);
  assert.match(page, /id="degree-save-progress"/);
  assert.match(page, /id="degree-loading"/);
  assert.match(runtime, /"\/api\/academic-progress"/);
  assert.match(read("app/degree-progression/page.tsx"), /<DegreeProgression \/>/);
  assert.match(read("app/page.tsx"), /<DegreeProgressPreview \/>/);
});
