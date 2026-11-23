import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import vm from "node:vm";
import ts from "typescript";

const read = (path: string) =>
  readFileSync(new URL("../" + path, import.meta.url), "utf8");
const compiled = ts.transpileModule(read("lib/course-recommendations/homepagePlanner.ts"), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 }
}).outputText;
const planner: Record<string, any> = {};
vm.runInNewContext(compiled, {
  exports: planner, Date, Intl, Set, Number, String
});
const plain = (value: unknown) => JSON.parse(JSON.stringify(value));

test("selected enrollment term determines the correct academic semester in Cairo", () => {
  const nov = new Date("2026-11-21T12:00:00Z");
  assert.deepEqual(plain(planner.semesterFromEnrollment("Fall 2024", nov)),
    { semester: 5, term: "Fall 2026", upcoming: false });
  assert.deepEqual(plain(planner.semesterFromEnrollment("Spring 2026", nov)),
    { semester: 2, term: "Fall 2026", upcoming: false });
  assert.deepEqual(plain(planner.semesterFromEnrollment("Fall 2026", nov)),
    { semester: 1, term: "Fall 2026", upcoming: false });
  assert.equal(planner.semesterFromEnrollment("Fall 2027", nov), null);
});

test("summer previews upcoming Fall instead of fabricating a summer semester", () => {
  const july = new Date("2026-07-10T12:00:00Z");
  assert.deepEqual(plain(planner.semesterFromEnrollment("Fall 2024", july)),
    { semester: 5, term: "Fall 2026", upcoming: true });
});

test("degree checklist keys map back to course codes without guessing passes", () => {
  const groups = [
    { items: ["CHEM 1005 - General Chemistry I (3 cr.)", "CHEM 1015 - General Chemistry Lab (1 cr.)"] },
    { items: ["MENG 2112 - Strength of Materials (3 cr.)"] },
    { subgroups: [{ items: ["MENG 4663 - Design of Renewable Energy Systems (3 cr.)"] }] }
  ];
  const codes = planner.completedCourseCodesFromChecklist(
    ["0-0", "1-0", "2-0-0", "0-90", "bogus"], groups);
  assert.deepEqual(Array.from(codes).sort(),
    ["CHEM 1005", "MENG 2112", "MENG 4663"]);
});

const fixedPlanCompiled = ts.transpileModule(
  read("lib/course-recommendations/newHomepageMechanicalPlan.ts"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 }
  }
).outputText;
const fixedPlans: Record<string, any> = {};
vm.runInNewContext(fixedPlanCompiled, {
  exports: fixedPlans, Array, Number
});

test("new homepage MENG semester 1 matches the supplied Fall list (18 credits)", () => {
  const plan = fixedPlans.getNewHomepageMechanicalSemesterPlan(1);
  assert.ok(plan);
  assert.deepEqual(plain(plan.courses.map((c: any) => [c.code, c.title, c.credits])), [
    ["CORE 1010", "Freshman Seminar", 3],
    ["RHET 1010", "Freshman Writing", 3],
    ["MACT 1121", "Calculus I", 3],
    ["ENGR 1005", "Engineering Drawing", 2],
    ["PHYS 1011", "Physics I", 3],
    ["PHYS 1012", "Physics I Lab", 1],
    ["SCI 1020", "Scientific Thinking", 3]
  ]);
  assert.deepEqual(plain(plan.requirements), []);
  assert.equal(plan.totalCredits, 18);
});

test("new homepage MENG semester 2 uses the supplied Spring list (16 credits)", () => {
  const plan = fixedPlans.getNewHomepageMechanicalSemesterPlan(2);
  assert.ok(plan);
  assert.deepEqual(plain(plan.courses.map((c: any) => [c.code, c.title, c.credits])), [
    ["MACT 1122", "Calculus II", 3],
    ["CHEM 1005", "General Chemistry I", 3],
    ["CHEM 1015", "General Chemistry Laboratory", 1],
    ["RHET 1020", "Research Writing", 3],
    ["PHIL 2100", "Philosophical Thinking", 3],
    ["LALT 1020", "Libraries and Learning Technologies", 0]
  ]);
  assert.deepEqual(plain(plan.requirements), [
    { id: "cultural-foundations", label: "Cultural Foundations elective", credits: 3 }
  ]);
  assert.equal(plan.totalCredits, 16);
  assert.ok(!plan.courses.some((c: any) => c.code === "ENGR 2102" || c.code === "MENG 2505"));
});

test("new homepage MENG semester 3 uses the supplied 17-credit plan", () => {
  const plan = fixedPlans.getNewHomepageMechanicalSemesterPlan(3);
  assert.ok(plan);
  assert.deepEqual(plain(plan.courses.map((c: any) => [c.code, c.title, c.credits])), [
    ["MACT 2123", "Calculus III", 3],
    ["ENGR 2102", "Engineering Mechanics I (Statics)", 3],
    ["PHYS 1021", "Physics II", 3],
    ["PHYS 1022", "Physics II Lab", 1],
    ["MENG 2505", "Mechanical Engineering Drawing", 1]
  ]);
  assert.deepEqual(plain(plan.requirements), [
    { id: "humanities-social-sciences", label: "Humanities and Social Sciences (HU/SS)", credits: 3 },
    { id: "egypt-studies", label: "Egypt Studies", credits: 3 }
  ]);
  assert.equal(plan.totalCredits, 17);
  assert.equal(plan.courses.length + plan.requirements.length, 7);
});

test("new homepage MENG semester 4 uses the supplied Spring list (16 credits)", () => {
  const plan = fixedPlans.getNewHomepageMechanicalSemesterPlan(4);
  assert.ok(plan);
  assert.deepEqual(plain(plan.courses.map((c: any) => [c.code, c.title, c.credits])), [
    ["ENGR 2104", "Engineering Mechanics II (Dynamics)", 3],
    ["MENG 2112", "Strength of Materials", 3],
    ["PHYS 2216", "Fundamentals of Circuits and Electronics", 2],
    ["PHYS 2217", "Circuits and Electronics Lab", 1],
    ["MACT 2141", "Differential Equations", 3],
    ["MENG 2202", "Computational Thinking and Programming Lab", 1]
  ]);
  assert.deepEqual(plain(plan.requirements), [
    { id: "arab-world-studies", label: "Arab World Studies", credits: 3 }
  ]);
  assert.equal(plan.totalCredits, 16);
  assert.equal(plan.courses.length, 6);
  assert.equal(plan.courses.length + plan.requirements.length, 7);
  assert.ok(!plan.courses.some((course: any) => course.code === "MACT 3224"));
});

test("new homepage has no invented plans beyond the four supplied semesters", () => {
  assert.equal(fixedPlans.getNewHomepageMechanicalSemesterPlan(0), null);
  assert.equal(fixedPlans.getNewHomepageMechanicalSemesterPlan(5), null);
  assert.equal(fixedPlans.getNewHomepageMechanicalSemesterPlan(8), null);
});

test("new homepage API uses fixed lists without the old course algorithm", () => {
  const route = read("app/api/homepage-course-recommendations/route.ts");
  const newHomepage = read("features/home/NewHomepageCourses.tsx");
  const oldHomepage = read("app/page.tsx");

  assert.match(newHomepage, /fetch\(url, \{/);
  assert.match(oldHomepage, /import Home from "\.\.\/features\/home\/Home"/);
  assert.match(route, /major !== "Mechanical Engineering"/);
  assert.match(route, /semesterFromEnrollment\(enrollmentTerm\)/);
  assert.match(route, /getNewHomepageMechanicalSemesterPlan\(semester\)/);
  assert.match(route, /status: "ready"/);
  assert.match(route, /status: "plan-pending"/);
  assert.doesNotMatch(route, /getMechanicalSemesterPlan|recommendMechanicalEarlyCourses/);
  assert.doesNotMatch(route, /completedCourseCodesFromChecklist|degreePlans1/);
  assert.doesNotMatch(route, /savedTools|degree-progress/);
});


test("semester selector is available for semesters 1–8 only on the new homepage", () => {
  const component = read("features/home/NewHomepageCourses.tsx");
  const route = read("app/api/homepage-course-recommendations/route.ts");
  const css = read("app/homepagenew/homepagenew.css");

  assert.match(component, /selectedSemester === null \? "" : "\?semester=" \+ selectedSemester/);
  assert.match(component, /aria-label="Browse course semesters"/);
  assert.match(component, /aria-label="Previous semester"/);
  assert.match(component, /aria-label="Next semester"/);
  assert.match(component, /disabled=\{shownSemester <= 1\}/);
  assert.match(component, /disabled=\{shownSemester >= 8\}/);
  assert.match(component, /setSelectedSemester\(Math\.max\(1, shownSemester - 1\)\)/);
  assert.match(component, /setSelectedSemester\(Math\.min\(8, shownSemester \+ 1\)\)/);
  assert.match(component, /homepagenew-semester-current/);
  assert.doesNotMatch(component, /homepagenew-semester-button|semesters\.map/);
  assert.match(css, /\.homepagenew-semester-arrow\s*\{/);
  assert.match(css, /\.homepagenew-semester-arrow:disabled/);
  assert.doesNotMatch(css.split(".homepagenew-course-empty {")[1]?.split("}")[0] ?? "", /border-top/);
  assert.match(route, /request\.nextUrl\.searchParams\.get\("semester"\)/);
  assert.match(route, /!\s*\/\^\[1-8\]\$\/\.test\(requested\)/);
  assert.match(route, /viewingCurrent && selected\.upcoming/);
  assert.doesNotMatch(read("app/page.tsx"), /NewHomepageCourses/);
});

test("switching semesters returns the fixed lists without changing saved student progress", async () => {
  const routeJs = ts.transpileModule(read("app/api/homepage-course-recommendations/route.ts"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 }
  }).outputText;
  const exports: Record<string, any> = {};

  vm.runInNewContext(routeJs, {
    exports,
    Number, String,
    console,
    require(id: string) {
      switch (id) {
        case "next/server":
          return { NextResponse: { json: (body: any, options: any) =>
            ({ body, statusCode: options?.status || 200 }) } };
        case "../../../server/session":
          return { optionalSessionUser: async () => ({ uid: "test-student" }) };
        case "../../../server/firebase":
          return { firestore: () => ({ collection: () => ({ doc: () => ({
            get: async () => ({ data: () => ({
              major: "Mechanical Engineering", enrollmentTerm: "Fall 2024"
            }) })
          }) }) }) };
        case "../../../lib/enrollmentTerm":
          return { isValidEnrollmentTerm: () => true };
        case "../../../lib/course-recommendations/homepagePlanner":
          return { semesterFromEnrollment: () =>
            ({ semester: 5, term: "Fall 2026", upcoming: false }) };
        case "../../../lib/course-recommendations/newHomepageMechanicalPlan":
          return fixedPlans;
        default:
          throw Error("Unexpected import: " + id);
      }
    }
  });

  const lookup = async (query: string) => {
    const result = await exports.GET({ nextUrl: { searchParams: new URLSearchParams(query) } });
    return plain(result);
  };

  const current = await lookup("");
  assert.equal(current.body.status, "plan-pending");
  assert.equal(current.body.semester, 5);
  assert.equal(current.body.term, "Fall 2026 · Semester 5");

  const first = await lookup("semester=1");
  assert.equal(first.statusCode, 200);
  assert.equal(first.body.status, "ready");
  assert.equal(first.body.semester, 1);
  assert.equal(first.body.totalCredits, 18);
  assert.deepEqual(first.body.courses.map((c: any) => c.code), [
    "CORE 1010", "RHET 1010", "MACT 1121", "ENGR 1005",
    "PHYS 1011", "PHYS 1012", "SCI 1020"
  ]);
  assert.equal(first.body.term, "Semester 1");

  const second = await lookup("semester=2");
  assert.equal(second.body.status, "ready");
  assert.equal(second.body.totalCredits, 16);
  assert.equal(second.body.requirements[0].label, "Cultural Foundations elective");

  const third = await lookup("semester=3");
  assert.equal(third.body.status, "ready");
  assert.equal(third.body.semester, 3);
  assert.equal(third.body.totalCredits, 17);
  assert.deepEqual(third.body.courses.map((c: any) => c.code),
    ["MACT 2123", "ENGR 2102", "PHYS 1021", "PHYS 1022", "MENG 2505"]);
  assert.deepEqual(third.body.requirements.map((r: any) => r.label),
    ["Humanities and Social Sciences (HU/SS)", "Egypt Studies"]);

  const fourth = await lookup("semester=4");
  assert.equal(fourth.body.status, "ready");
  assert.equal(fourth.body.semester, 4);
  assert.equal(fourth.body.totalCredits, 16);
  assert.deepEqual(fourth.body.courses.map((c: any) => c.code), [
    "ENGR 2104", "MENG 2112", "PHYS 2216", "PHYS 2217",
    "MACT 2141", "MENG 2202"
  ]);
  assert.deepEqual(fourth.body.requirements, [
    { id: "arab-world-studies", label: "Arab World Studies", credits: 3, timing: "due" }
  ]);

  const notYetAdded = await lookup("semester=8");
  assert.equal(notYetAdded.body.status, "plan-pending");
  assert.equal(notYetAdded.body.semester, 8);

  const invalid = await lookup("semester=9");
  assert.equal(invalid.statusCode, 400);
  assert.equal(invalid.body.status, "error");
});


test("new homepage course covers stay blank until artwork is chosen", () => {
  const page = read("features/home/NewHomepageCourses.tsx");
  const css = read("app/homepagenew/homepagenew.css");

  // All course cards (including electives) retain the same neutral cover space.
  assert.match(page, /<div className="homepagenew-course-cover" aria-hidden="true" \/>/);
  assert.match(page, /homepagenew-course-card homepagenew-course-elective/);
  assert.match(css, /\.homepagenew-course-cover\s*\{/);
  assert.match(css, /background: #ece6dc/);

  // Neither custom photos nor graphical artwork should be rendered.
  assert.doesNotMatch(page, /courseImages|<img|NewHomepageGraphicCover|hasGraphicCourseCover/);
  assert.doesNotMatch(css, /homepagenew-graphic-cover|homepagenew-graphic-art/);
  assert.doesNotMatch(read("app/page.tsx"), /NewHomepageGraphicCover/);
});

test("new homepage renders Cultural Foundations as a course-size non-clickable card", () => {
  const component = read("features/home/NewHomepageCourses.tsx");
  const css = read("app/homepagenew/homepagenew.css");

  assert.match(component, /courseCardEntries\(result\)\.map/);
  assert.match(component, /homepagenew-course-card homepagenew-course-elective/);
  assert.match(component, /<span className="homepagenew-course-code">CORE ELECTIVE<\/span>/);
  assert.match(component, /item\.requirement\.label/);
  assert.match(component, /item\.requirement\.credits/);
  assert.match(component, /zeroCreditIndex = result\.courses\.findIndex\(course => course\.credits === 0\)/);
  assert.doesNotMatch(component, /homepagenew-core-requirements|homepagenew-core-requirement/);
  assert.match(css, /\.homepagenew-course-elective/);
  assert.match(css, /a\.homepagenew-course-card:hover/);
  assert.doesNotMatch(css, /\.homepagenew-core-requirements/);
  assert.equal(fixedPlans.getNewHomepageMechanicalSemesterPlan(2).totalCredits, 16);
});


