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

test("new homepage MENG courses are pending until manual semester lists are supplied", () => {
  const route = read("app/api/homepage-course-recommendations/route.ts");
  const newHomepage = read("features/home/NewHomepageCourses.tsx");
  const oldHomepage = read("app/page.tsx");

  assert.match(newHomepage, /fetch\("\/api\/homepage-course-recommendations"/);
  assert.match(oldHomepage, /import Home from "\.\.\/features\/home\/Home"/);
  assert.match(route, /major !== "Mechanical Engineering"/);
  assert.match(route, /semesterFromEnrollment\(enrollmentTerm\)/);
  assert.match(route, /status: "plan-pending"/);
  assert.doesNotMatch(route, /getMechanicalSemesterPlan|recommendMechanicalEarlyCourses/);
  assert.doesNotMatch(route, /completedCourseCodesFromChecklist|degreePlans1/);
  assert.doesNotMatch(route, /savedTools|degree-progress|plan\.courses|plan\.coreCategories/);
});
