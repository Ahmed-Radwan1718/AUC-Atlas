import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import vm from "node:vm";
import ts from "typescript";

function transpile(path: string): string {
  return ts.transpileModule(readFileSync(new URL("../" + path, import.meta.url), "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 }
  }).outputText;
}
const core: Record<string, any> = {};
vm.runInNewContext(transpile("lib/course-recommendations/universalCore.ts"), {
  exports: core, Set, Array, String, Number
});
const mechanical: Record<string, any> = {};
vm.runInNewContext(transpile("lib/course-recommendations/mechanicalEngineering.ts"), {
  exports: mechanical, Set, Array, String, Number, Map,
  require(id: string) {
    if (id === "./universalCore") return core;
    throw Error("Unexpected import: " + id);
  }
});
const plain = (value: unknown) => JSON.parse(JSON.stringify(value));

test("MENG semester 1 follows the revised seven-course plan and totals 18 credits", () => {
  const plan = mechanical.getMechanicalSemesterPlan(1);
  assert.ok(plan);
  assert.deepEqual(plain(plan.courses.map((c: any) => [c.code, c.title, c.credits])), [
    ["CORE 1010", "Freshman Seminar", 3],
    ["RHET 1010", "Freshman Writing", 3],
    ["MACT 1121", "Calculus I", 3],
    ["PHYS 1011", "Physics I", 3],
    ["PHYS 1012", "Physics I Lab", 1],
    ["SCI 1020", "Scientific Thinking", 3],
    ["ENGR 1005", "Engineering Drawing", 2]
  ]);
  assert.equal(plan.totalCredits, 18);
});

test("MENG semester 2 follows the revised eight-course plan and totals 17 credits", () => {
  const plan = mechanical.getMechanicalSemesterPlan(2);
  assert.ok(plan);
  assert.deepEqual(plain(plan.courses.map((c: any) => [c.code, c.title, c.credits])), [
    ["PHIL 2100", "Philosophical Thinking", 3],
    ["CHEM 1005", "General Chemistry I", 3],
    ["CHEM 1015", "Chemistry I Lab", 1],
    ["RHET 1020", "Research Writing", 3],
    ["MACT 1122", "Calculus II", 3],
    ["ENGR 2102", "Engineering Mechanics I (Statics)", 3],
    ["MENG 2505", "Mechanical Engineering Drawing", 1],
    ["LALT 1020", "Libraries and Learning Technologies", 0]
  ]);
  assert.equal(plan.totalCredits, 17);
});

test("universal Core credits stay in shared requirements", () => {
  const common = core.UNIVERSAL_CORE_REQUIREMENTS;
  assert.deepEqual(plain(common.map((x: any) => [x.code, x.credits])),
    [["CORE 1010", 3], ["RHET 1010", 3], ["SCI 1020", 3],
    ["RHET 1020", 3], ["LALT 1020", 0], ["PHIL 2100", 3]]);
  const all = mechanical.MECHANICAL_ENGINEERING_EARLY_SEMESTERS.flatMap((s: any) => s.courses);
  assert.equal(new Set(all.map((x: any) => x.code)).size, all.length);
});

test("MENG semester 3 includes four named courses and two Core category slots (16 credits)", () => {
  const plan = mechanical.getMechanicalSemesterPlan(3);
  assert.ok(plan);
  assert.deepEqual(plain(plan.courses.map((c: any) => [c.code, c.title, c.credits])), [
    ["ENGR 2104", "Dynamics", 3],
    ["MACT 2123", "Calculus III", 3],
    ["PHYS 1021", "Physics II", 3],
    ["PHYS 1022", "Physics II Lab", 1]
  ]);
  assert.deepEqual(plain(plan.coreCategories.map((c: any) => [c.categoryId, c.title, c.credits])), [
    ["arab-world-studies", "Arab World Studies Core", 3],
    ["cultural-explorations", "Cultural Explorations Core", 3]
  ]);
  assert.deepEqual(plain(plan.requirements.map((r: any) => r.kind === "core-category" ? r.title : r.code)), [
    "ENGR 2104", "MACT 2123", "PHYS 1021", "PHYS 1022",
    "Arab World Studies Core", "Cultural Explorations Core"
  ]);
  assert.equal(plan.totalCredits, 16);
  assert.equal(plan.courses.reduce((sum: number, c: any) => sum + c.credits, 0), 10);
});

test("MENG semester 4 has six courses plus Humanities and Social Sciences Core (16 credits)", () => {
  const plan = mechanical.getMechanicalSemesterPlan(4);
  assert.ok(plan);
  assert.deepEqual(plain(plan.courses.map((c: any) => [c.code, c.title, c.credits])), [
    ["MACT 2141", "Differential Equations", 3],
    ["MENG 2112", "Strength of Materials", 3],
    ["MENG 2601", "Fluid Mechanics Fundamentals", 3],
    ["MENG 2202", "Computational Thinking and Programming Lab", 1],
    ["PHYS 2216", "Fundamentals of Circuits and Electronics", 2],
    ["PHYS 2217", "Circuits and Electronics Lab", 1]
  ]);
  assert.deepEqual(plain(plan.coreCategories.map((c: any) => [c.categoryId, c.title, c.credits])), [
    ["humanities-and-social-sciences", "Humanities and Social Sciences Core", 3]
  ]);
  assert.deepEqual(plain(plan.requirements.map((r: any) => r.kind === "core-category" ? r.title : r.code)), [
    "MACT 2141", "MENG 2112", "MENG 2601", "MENG 2202", "PHYS 2216", "PHYS 2217",
    "Humanities and Social Sciences Core"
  ]);
  assert.equal(plan.courses.reduce((sum: number, c: any) => sum + c.credits, 0), 13);
  assert.equal(plan.totalCredits, 16);
});

test("later semesters remain undefined until their courses are supplied", () => {
  assert.equal(mechanical.getMechanicalSemesterPlan(5), null);
  assert.equal(mechanical.getMechanicalSemesterPlan(0), null);
});

test("outstanding semester 1 courses carry into semester 2, with completed excluded", () => {
  const result = mechanical.recommendMechanicalEarlyCourses({
    semester: 2,
    completedCodes: new Set(["core 1010", "rhet 1010", "SCI 1020", "PHYS 1011", "PHYS 1012", "ENGR 1005"])
  });
  assert.deepEqual(plain(result.map((c: any) => [c.code, c.timing])), [
    ["MACT 1121", "overdue"],
    ["PHIL 2100", "due"], ["CHEM 1005", "due"], ["CHEM 1015", "due"],
    ["RHET 1020", "due"], ["MACT 1122", "due"], ["ENGR 2102", "due"],
    ["MENG 2505", "due"], ["LALT 1020", "due"]
  ]);
});

test("semester 3 recommendations include named courses but do not invent Core course codes", () => {
  const previouslyCompleted = mechanical.MECHANICAL_ENGINEERING_EARLY_SEMESTERS
    .filter((semester: any) => semester.semester < 3)
    .flatMap((semester: any) => semester.courses.map((course: any) => course.code));
  const suggested = mechanical.recommendMechanicalEarlyCourses({
    semester: 3, completedCodes: previouslyCompleted
  });
  assert.deepEqual(plain(suggested.map((course: any) => [course.code, course.timing])), [
    ["ENGR 2104", "due"],
    ["MACT 2123", "due"],
    ["PHYS 1021", "due"],
    ["PHYS 1022", "due"]
  ]);
  assert.equal(suggested.some((course: any) => course.kind === "core-category"), false);
});

test("semester 4 suggestions show only outstanding named courses, not a fabricated Core code", () => {
  const previouslyCompleted = mechanical.MECHANICAL_ENGINEERING_EARLY_SEMESTERS
    .filter((plan: any) => plan.semester < 4)
    .flatMap((plan: any) => plan.courses.map((course: any) => course.code));
  const suggested = mechanical.recommendMechanicalEarlyCourses({
    semester: 4, completedCodes: [...previouslyCompleted, "MENG 2202"]
  });
  assert.deepEqual(plain(suggested.map((course: any) => [course.code, course.timing])), [
    ["MACT 2141", "due"],
    ["MENG 2112", "due"],
    ["MENG 2601", "due"],
    ["PHYS 2216", "due"],
    ["PHYS 2217", "due"]
  ]);
  assert.equal(suggested.some((course: any) => course.kind === "core-category"), false);
});
