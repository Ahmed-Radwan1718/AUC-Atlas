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
  // Original homepage can still match professor IDs and course fields.
  assert.match(search, /professor\.name, professor\.id, professor\.course/);
  assert.doesNotMatch(search, /professor\.(?:department|displayDepartment|filterDepartment)/);
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
  assert.match(preview, /readSharedHomepageJson<HomepageAccount>/);
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
  assert.equal(exists("app/api/homepage-overview/route.ts"), false);
  assert.equal(exists("features/home/Home.tsx"), false);
  assert.equal(exists("features/home/home.css"), false);
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
  assert.match(insights, /\/api\/professor-reviews\?courseCodes=/);
  assert.match(insights, /response.status === 401/);
  assert.match(insights, /<SemesterInsights\b[^>]*codes=\{selected\.courses\}/);
  assert.match(insights, /<ProfessorColumn label="Consider" category="consider"/);
  assert.match(insights, /<ProfessorColumn label="Avoid" category="caution"/);
  assert.match(insights, /insight\.courseCode \+ ":" \+ insight\.professorId/);
  assert.match(insights, /summarizeCourseProfessors\(reviews, code\)/);
  assert.match(insights, /new-homepage-insights-person-course/);
  assert.doesNotMatch(insights, /function CourseInsights|new-homepage-insights-course-toggle/);
  assert.doesNotMatch(insights, /Explore professors for your planned courses\.|Based on available past and current student reviews/);
});

test("course insights reject unrelated and duplicate reviews and rank extremes even with one review", () => {
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
  assert.equal(result[2].professorId, "small");
  assert.equal(result[2].category, "caution");
  assert.equal(result[3].category, "other");
  const single = summarize([review("single-high", "one-high", 4), review("single-low", "one-low", 2), review("single-mid", "one-mid", 3)], "MENG3209");
  assert.deepEqual(Array.from(single, item => [item.professorId, item.category, item.reviewCount]), [
    ["one-high", "consider", 1], ["one-low", "caution", 1], ["one-mid", "other", 1]
  ]);
  assert.match(read("app/homepagenew/ProfessorInsights.tsx"), /insight\.reviewCount < 3 && <small>Limited reviews<\/small>/);
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

test("semester removal confirms populated semesters and persists intentionally empty plans", () => {
  const planner = read("app/homepagenew/SemesterPlanner.tsx");
  const route = read("app/api/semester-plan/route.ts");
  const css = read("app/homepagenew/homepagenew.css");
  assert.match(planner, /className="new-homepage-semester-delete"/);
  assert.match(planner, /onClick=\{requestDeleteSemester\}/);
  assert.match(planner, /if \(!selected.courses.length\) \{\s*deleteSemester\(\)/);
  assert.match(planner, /cancelDeleteRef.current\?\.focus/);
  assert.match(planner, /semesters.filter\(semester => semester.name !== selected.name\)/);
  assert.match(planner, /remaining\[Math.min\(index, remaining.length - 1\)\]/);
  assert.match(planner, /markEdited\(remaining\)/);
  assert.match(planner, /saved.hasSavedPlan \|\| saved.semesters.length/);
  assert.match(planner, /semesters.length \? nextRegularSemester\(semesters\[semesters.length - 1\].name\) : currentSemester\(\)/);
  assert.match(planner, /No semesters planned/);
  assert.match(route, /hasSavedPlan: savedPlan !== null/);
  assert.match(css, /\.new-homepage-semester-meta \{\s*justify-content: space-between/);
});

test("homepage ambient glows extend behind the header at the top", () => {
  const header = read("components/Header.tsx");
  const css = read("components/header.css");
  const homepage = read("app/homepagenew/homepagenew.css");
  assert.match(header, /data-home-at-top=\{pathname === "\/" && !homeScrolled/);
  assert.match(header, /setHomeScrolled\(window.scrollY > 12\)/);
  assert.match(header, /addEventListener\("scroll", update, \{ passive: true \}\)/);
  assert.match(css, /\[data-home-at-top="true"\] \{ background-color: transparent; \}/);
  assert.match(homepage, /circle 265px at 7% 90px/);
  assert.match(homepage, /circle 175px at -8% 75px/);
});


test("professor department metadata is optional and used by the directory filter", () => {
  const type = read("data/professors-type.ts");
  assert.match(type, /\bdepartment\?\s*:\s*string\b/);
  assert.doesNotMatch(type, /\b(?:displayDepartment|filterDepartment)\??\s*:/);
  const ids = new Set<string>();
  let assigned = 0;
  for (let part = 1; part <= 3; part++) {
    const source = read(`data/professors-${part}.ts`);
    assert.doesNotMatch(source, /\b(?:displayDepartment|filterDepartment)\??\s*:/);
    const compiled = ts.transpileModule(source, {
      compilerOptions: { module: ts.ModuleKind.CommonJS }
    }).outputText;
    const module = { exports: {} as Record<string, { id: string; department?: string }[]> };
    vm.runInNewContext(compiled, { module, exports: module.exports });
    for (const professor of module.exports[`professorRecords${part}`]) {
      assert.ok(!ids.has(professor.id), `Duplicate professor ID: ${professor.id}`);
      ids.add(professor.id);
      if (professor.department !== undefined) {
        assert.equal(typeof professor.department, "string");
        assert.ok(professor.department.trim().length > 0);
        assert.equal(professor.department, professor.department.trim());
        assert.notEqual(professor.department, "Department coming soon");
        assigned++;
      }
    }
  }
  assert.ok(assigned > 0, "Professor department metadata should be populated");
  const directory = read("features/professors/Professors.tsx");
  assert.match(directory, /const departmentChoices = professorDepartmentChoices\(professors\)/);
  assert.match(directory, /matchesProfessorDepartment\(item, selectedDepartments\)/);
  assert.match(directory, /aria-expanded=\{departmentOpen\}/);
  assert.match(directory, /aria-controls="department-filter-options"/);
  assert.match(directory, /id="department-filter-options" inert=\{!departmentOpen\}/);
  assert.match(directory, /toggle\(selectedDepartments, department, setSelectedDepartments\)/);
  assert.doesNotMatch(directory, /\b(?:displayDepartment|filterDepartment)\b/);
  assert.doesNotMatch(read("features/professors/profileMarkup.ts"), /professor-profile-department/);
  assert.match(read("features/home/HomeSearch.tsx"), /course\.department/);
});

test("department choices are sorted, deduplicated and include unassigned professors", () => {
  const source = read("features/professors/departmentFilter.ts");
  const compiled = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS }
  }).outputText;
  type Record = { department?: string };
  const module = { exports: {} as {
    professorDepartmentChoices: (items: Record[]) => string[];
    matchesProfessorDepartment: (item: Record, selected: string[]) => boolean;
    unassignedDepartment: string;
  } };
  vm.runInNewContext(compiled, { module, exports: module.exports });
  const { professorDepartmentChoices, matchesProfessorDepartment, unassignedDepartment } = module.exports;
  const items = [{ department: "Physics" }, { department: "Arts" }, { department: "Physics" }, {}, { department: " " }];
  assert.deepEqual(Array.from(professorDepartmentChoices(items)), ["Arts", "Physics", unassignedDepartment]);
  assert.deepEqual(Array.from(professorDepartmentChoices([{ department: "Arts" }])), ["Arts"]);
  assert.ok(items.every(item => matchesProfessorDepartment(item, [])));
  assert.ok(matchesProfessorDepartment(items[0], ["Arts", "Physics"]));
  assert.ok(matchesProfessorDepartment(items[1], ["Arts", "Physics"]));
  assert.ok(!matchesProfessorDepartment(items[0], ["Arts"]));
  assert.ok(!matchesProfessorDepartment(items[3], ["Arts", "Physics"]));
  assert.ok(matchesProfessorDepartment(items[3], [unassignedDepartment]));
  assert.ok(matchesProfessorDepartment(items[4], [unassignedDepartment]));
});


test("activity history is a standalone private route in the hamburger menu", () => {
  const page = read("app/activity-history/page.tsx");
  const markup = read("features/accounts/accountsMarkup.ts");
  const runtime = read("features/accounts/accountRuntime.ts");
  const accountMarkup = markup.slice(markup.indexOf("export const markup ="), markup.indexOf("export const activityMarkup ="));
  const activityMarkup = markup.slice(markup.indexOf("export const activityMarkup ="));
  assert.match(page, /<Accounts activityOnly \/>/);
  assert.match(page, /index: false/);
  assert.doesNotMatch(accountMarkup, /account-panel-reviews|account-review-editor-form|Activity history/);
  assert.match(activityMarkup, /account-panel-reviews/);
  assert.match(activityMarkup, /account-review-editor-form/);
  assert.match(activityMarkup, /account-material-editor-form/);
  assert.doesNotMatch(activityMarkup, /account-sidebar/);
  assert.match(read("components/Header.tsx"), /href: "\/activity-history", label: "Activity history"/);
  assert.match(runtime, /window.location.replace\("\/activity-history"\)/);
  assert.match(runtime, /activityOnly \? "\/activity-history" : "\/accounts"/);
});


test("My account uses a unified layout while retaining security verification", () => {
  const markup = read("features/accounts/accountsMarkup.ts");
  const account = markup.slice(markup.indexOf("export const markup ="), markup.indexOf("export const activityMarkup ="));
  const runtime = read("features/accounts/accountRuntime.ts");
  assert.doesNotMatch(account, /account-sidebar|data-account-panel/);
  assert.match(account, /is-unified-account/);
  assert.match(account, /account-panel-details/);
  assert.match(account, /account-panel-security/);
  assert.match(account, /account-security-unlock/);
  assert.match(account, /account-unified-management/);
  assert.match(runtime, /const accessGranted = await requestSecurityPanelAccess\(\);\s*if \(accessGranted && root\.isConnected\) revealAccountSecurity\(\)/);
  assert.match(runtime, /if \(accountTwoFactor\.appEnabled\) \{\s*if \(securityGateMessage\)/);
  assert.match(runtime, /accountSecurityPanel\.hidden = false/);
});


test("course search animates result changes without changing search or navigation behavior", () => {
  const home = read("features/home/HomeSearch.tsx");
  const planner = read("app/homepagenew/SemesterPlanner.tsx");
  const motion = read("lib/useSearchResultMotion.ts");
  assert.match(home, /useSearchResultMotion\(resultsRef, resultSignature, visible, true\)/);
  assert.match(planner, /useSearchResultMotion\(suggestionsRef,/);
  assert.match(home, /data-search-motion-key=\{result.type \+ result.href \+ result.title\}/);
  assert.match(planner, /data-search-motion-key=\{course.code\}/);
  assert.match(motion, /prefers-reduced-motion: reduce/);
  assert.match(motion, /animation.cancel\(\)/);
  assert.match(motion, /before - y/);
  assert.match(motion, /duration: 220/);
  assert.doesNotMatch(motion, /setTimeout|setInterval/);
});


test("homepage shares in-flight account and academic reads without retaining settled private data", async () => {
  const source = ts.transpileModule(read("lib/sharedHomepageReads.ts"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 }
  }).outputText;
  const module = { exports: {} as Record<string, any> };
  let calls = 0;
  vm.runInNewContext(source, {
    module, exports: module.exports, AbortController,
    fetch: async (_url: string, options: any) => {
      calls++;
      assert.equal(options.cache, "no-store");
      assert.equal(options.credentials, "same-origin");
      return { ok: true, json: async () => ({ signedIn: true }) };
    }
  });
  const { readSharedHomepageJson, cancelSharedHomepageReads } = module.exports;
  const a = readSharedHomepageJson("/api/me");
  const b = readSharedHomepageJson("/api/me");
  assert.equal(a, b);
  await Promise.all([a,b]);
  assert.equal(calls, 1);
  await Promise.all([readSharedHomepageJson("/api/academic-progress"),readSharedHomepageJson("/api/academic-progress")]);
  assert.equal(calls, 2);
  await readSharedHomepageJson("/api/me");
  assert.equal(calls, 3);
  const cancelled = readSharedHomepageJson("/api/me");
  cancelSharedHomepageReads();
  await assert.rejects(cancelled, /cancelled/);
  assert.equal(calls, 4);
});
