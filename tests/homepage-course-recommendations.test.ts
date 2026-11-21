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

test("new homepage has no invented plans beyond the two supplied semesters", () => {
  assert.equal(fixedPlans.getNewHomepageMechanicalSemesterPlan(0), null);
  assert.equal(fixedPlans.getNewHomepageMechanicalSemesterPlan(3), null);
  assert.equal(fixedPlans.getNewHomepageMechanicalSemesterPlan(5), null);
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

  const notYetAdded = await lookup("semester=8");
  assert.equal(notYetAdded.body.status, "plan-pending");
  assert.equal(notYetAdded.body.semester, 8);

  const invalid = await lookup("semester=9");
  assert.equal(invalid.statusCode, 400);
  assert.equal(invalid.body.status, "error");
});
