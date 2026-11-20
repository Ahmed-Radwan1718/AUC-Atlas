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

test("MENG semester 1 includes SCI 1020 and totals 18 credits", () => {
  const plan = mechanical.getMechanicalSemesterPlan(1);
  assert.ok(plan);
  assert.deepEqual(plain(plan.courses.map((course: any) => [course.code, course.credits])), [
    ["CORE 1010", 3], ["RHET 1010", 3], ["SCI 1020", 3],
    ["MACT 1121", 3], ["CHEM 1005", 3], ["CHEM 1015", 1], ["ENGR 1005", 2]
  ]);
  assert.equal(plan.totalCredits, 18);
});

test("MENG semester 2 excludes SCI 1020 and totals 13 credits", () => {
  const plan = mechanical.getMechanicalSemesterPlan(2);
  assert.ok(plan);
  assert.deepEqual(plain(plan.courses.map((course: any) => [course.code, course.credits])), [
    ["RHET 1020", 3], ["PHIL 2100", 3], ["LALT 1020", 0],
    ["MACT 1122", 3], ["PHYS 1011", 3], ["PHYS 1012", 1]
  ]);
  assert.equal(plan.totalCredits, 13);
});

test("universal Core credits stay in shared requirements", () => {
  const common = core.UNIVERSAL_CORE_REQUIREMENTS;
  assert.deepEqual(plain(common.map((x: any) => [x.code, x.credits])),
    [["CORE 1010", 3], ["RHET 1010", 3], ["SCI 1020", 3],
    ["RHET 1020", 3], ["LALT 1020", 0], ["PHIL 2100", 3]]);
  const all = mechanical.MECHANICAL_ENGINEERING_EARLY_SEMESTERS.flatMap((s: any) => s.courses);
  assert.equal(new Set(all.map((x: any) => x.code)).size, all.length);
});

test("no imaginary semester 3 plan while courses are still being defined", () => {
  assert.equal(mechanical.getMechanicalSemesterPlan(3), null);
  assert.equal(mechanical.getMechanicalSemesterPlan(0), null);
});

test("outstanding semester 1 courses carry into semester 2, with completed excluded", () => {
  const result = mechanical.recommendMechanicalEarlyCourses({
    semester: 2,
    completedCodes: new Set(["core 1010", "rhet 1010", "SCI 1020", "CHEM 1005", "CHEM 1015", "ENGR 1005"])
  });
  assert.deepEqual(plain(result.map((c: any) => [c.code, c.timing])), [
    ["MACT 1121", "overdue"],
    ["RHET 1020", "due"], ["PHIL 2100", "due"], ["LALT 1020", "due"],
    ["MACT 1122", "due"], ["PHYS 1011", "due"], ["PHYS 1012", "due"]
  ]);
});
