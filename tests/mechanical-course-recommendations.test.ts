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
  recommendMechanicalCourses, MECHANICAL_TERM_PLAN, MECHANICAL_CORE_AND_ELECTIVE_OPTIONS
} = output;
const allCodes = [...new Set([
  ...MECHANICAL_TERM_PLAN.flat(),
  ...MECHANICAL_CORE_AND_ELECTIVE_OPTIONS.map((item: any) => item.code)
])];
const catalog = allCodes.map((code: string) => ({ code, title: code + " title" }));
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



test("credits include labs, rhetoric, core and major courses in one 15-18 hour load", () => {
  const values = [
    ["900262111", 15, 6], // 1st semester: freshman core + maths/chemistry/engineering
    ["900252111", 16, 6], // Fall 2026: third semester
    ["900242111", 16, 6], // Fall 2026: fifth semester
    ["900232111", 17, 6]  // Fall 2026: seventh semester
  ] as const;
  for (const [aucId, expectedCredits, expectedCourses] of values) {
    const result = recommendMechanicalCourses({ aucId, catalog, today: fall2026 });
    assert.ok(result);
    assert.equal(result.totalCredits, expectedCredits, aucId);
    assert.equal(result.courses.length, expectedCourses, aucId);
    assert.ok(result.totalCredits >= 15 && result.totalCredits <= 18, aucId);
    assert.equal(result.totalCredits,
      result.courses.reduce((sum: number, item: any) => sum + item.credits, 0));
  }
});

test("freshmen see mandatory writing and seminar together with major requirements", () => {
  const first = recommendMechanicalCourses({ aucId: "900262111", catalog, today: fall2026 });
  assert.ok(first);
  assert.ok(first.courses.some((x: any) => x.code === "RHET 1010" && x.kind === "core"));
  assert.ok(first.courses.some((x: any) => x.code === "CORE 1010" && x.kind === "core"));
  assert.equal(first.courses.find((x: any) => x.code === "CHEM 1015").credits, 1);
});

test("core electives are identified as options and never counted as required major courses", () => {
  const second = recommendMechanicalCourses({ aucId: "900262111",
    catalog, today: new Date("2027-03-19T12:00:00Z") });
  assert.ok(second);
  assert.equal(second.totalCredits, 17);
  assert.ok(second.courses.some((x: any) => x.code === "RHET 1020" && x.kind === "core"));
  assert.ok(second.courses.some((x: any) => x.code === "CORE 1130" && x.kind === "core-option"));
  assert.ok(second.courses.every((x: any) => x.credits >= 1));
});

test("credits are capped at 18 rather than capped at four courses", () => {
  const cohort = recommendMechanicalCourses({ aucId: "900232111", catalog,
    today: new Date("2027-03-19T12:00:00Z") });
  assert.ok(cohort);
  assert.ok(cohort.courses.length > 4);
  assert.ok(cohort.totalCredits <= 18);
});

test("spring semesters also include core or elective credits without exceeding 18", () => {
  const cases = [
    ["900252111", 16], // Semester 4
    ["900242111", 18], // Semester 6
    ["900232111", 16]  // Semester 8
  ] as const;
  for (const [aucId, expectedCredits] of cases) {
    const actual = recommendMechanicalCourses({
      aucId, catalog, today: new Date("2027-03-19T12:00:00Z")
    });
    assert.ok(actual);
    assert.equal(actual.totalCredits, expectedCredits, aucId);
    assert.ok(actual.courses.some((x: any) => x.kind !== "major"), aucId);
  }
});

test("only fifteen credits of concentration examples are proposed across the pathway", () => {
  const chosen = MECHANICAL_CORE_AND_ELECTIVE_OPTIONS
    .filter((x: any) => x.kind === "concentration-option");
  assert.equal(chosen.length, 5);
  assert.equal(chosen.length * 3, 15);
});

test("never invents a course not present in the catalog", () => {
  const result = recommendMechanicalCourses({ aucId: "900242111", catalog: [], today: fall2026 });
  assert.ok(result);
  assert.equal(result.courses.length, 0);
});
