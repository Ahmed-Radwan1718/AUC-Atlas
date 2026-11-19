import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import vm from "node:vm";
import ts from "typescript";

const source = readFileSync(new URL("../lib/mechanicalCourseRecommendations.ts", import.meta.url), "utf8");
const compiled = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 }
}).outputText;
const output: Record<string, any> = {};
vm.runInNewContext(compiled, { exports: output, module: { exports: output },
  Date, Intl, Map, Set, Number, Array, String }, { filename: "mechanicalCourseRecommendations.ts" });
const {
  enrollmentYearFromAucId, cairoAcademicTerm, completedMechanicalCourses,
  recommendMechanicalCourses, MECHANICAL_TERM_PLAN
} = output;
const catalog = MECHANICAL_TERM_PLAN.flat().map((code: string) => ({ code, title: code + " title" }));
const fall2026 = new Date("2026-11-19T12:00:00Z");

test("infers enrollment year only from a valid 900-prefixed ID", () => {
  assert.equal(enrollmentYearFromAucId("900258530", 2026), 2025);
  assert.equal(enrollmentYearFromAucId("900242111", 2026), 2024);
  assert.equal(enrollmentYearFromAucId("900279999", 2026), null);
  assert.equal(enrollmentYearFromAucId("123258530", 2026), null);
});

test("Cairo dates distinguish regular and upcoming terms", () => {
  assert.equal(cairoAcademicTerm(fall2026).label, "Fall 2026");
  assert.equal(cairoAcademicTerm(fall2026).upcoming, false);
  assert.equal(cairoAcademicTerm(new Date("2027-01-08T12:00:00Z")).label, "Spring 2027");
  assert.equal(cairoAcademicTerm(new Date("2027-01-08T12:00:00Z")).upcoming, true);
  assert.equal(cairoAcademicTerm(new Date("2027-07-08T12:00:00Z")).label, "Fall 2027");
});

test("fall junior recommendations follow prerequisites", () => {
  const result = recommendMechanicalCourses({ aucId: "900242111", catalog, today: fall2026 });
  assert.ok(result);
  assert.equal(result.semester, 5);
  const codes: string[] = Array.from(result.courses, (course: any) => course.code);
  assert.ok(codes.includes("ENGR 3202"));
  assert.ok(codes.includes("MENG 3207"));
  assert.ok(!codes.includes("MENG 3601"));
  assert.ok(!codes.includes("MENG 4980"));
});

test("degree keys resolve to actual completed courses", () => {
  const plan = { groups: [
    { items: ["PHYS 1011 - Physics I (3 cr.)"] },
    { items: ["MENG 3207 - Engineering Materials (3 cr.)"],
      subgroups: [{ items: ["MENG 3601 - Thermodynamics (3 cr.)"] }] }
  ] };
  const completed = completedMechanicalCourses(["0-0", "1-0", "1-0-0", "nope"], plan);
  assert.ok(completed.has("PHYS 1011"));
  assert.ok(completed.has("MENG 3207"));
  assert.ok(completed.has("MENG 3601"));
  assert.equal(completed.size, 3);
});

test("manually completed course is never recommended again", () => {
  const completed = new Set(MECHANICAL_TERM_PLAN.slice(0, 4).flat());
  completed.add("MENG 3207");
  const result = recommendMechanicalCourses({ aucId: "900242111", catalog,
    today: fall2026, completedCodes: completed, hasSavedProgress: true });
  assert.ok(result);
  assert.equal(result.usedSavedProgress, true);
  assert.ok(!result.courses.some((course: any) => course.code === "MENG 3207"));
});

test("never invents a course not present in the catalog", () => {
  const result = recommendMechanicalCourses({ aucId: "900242111", catalog: [], today: fall2026 });
  assert.ok(result);
  assert.equal(result.courses.length, 0);
});
