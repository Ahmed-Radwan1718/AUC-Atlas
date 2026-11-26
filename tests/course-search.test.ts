import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import vm from "node:vm";
import ts from "typescript";

function loadTs(relativePath: string): Record<string, any> {
  const source = readFileSync(new URL(relativePath, import.meta.url), "utf8");
  const compiled = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 }
  }).outputText;
  const module = { exports: {} as Record<string, any> };
  vm.runInNewContext(compiled, { module, exports: module.exports }, { filename: relativePath });
  return module.exports;
}

const { searchCatalogCourses } = loadTs("../features/courses/courseSearch.ts");
const { courseEntries } = loadTs("../data/course-entries.ts");
const { subjectLabels } = loadTs("../data/course-meta.ts");

const catalog = (courseEntries as Array<[string, string]>).map(([code, title]) => {
  const [subject, number = ""] = code.split(" ");
  return {
    code, title, subject, department: subjectLabels[subject] || subject,
    level: number.charAt(0) + "000 Level"
  };
});

const find = (query: string, selectedSubjects: string[] = []) =>
  searchCatalogCourses(catalog, query, selectedSubjects) as typeof catalog;

test("covers every catalog course and finds codes with or without spaces", () => {
  assert.ok(catalog.length >= 1000);
  for (const course of catalog) {
    assert.equal(find(course.code)[0]?.code, course.code, course.code);
    assert.equal(find(course.code.replace(/\s+/g, ""))[0]?.code, course.code, course.code);
  }
});

test("understands student shorthand, Roman numerals, and shortened course titles", () => {
  assert.equal(find("calc 2")[0]?.code, "MACT 1122");
  assert.equal(find("calc ii")[0]?.code, "MACT 1122");
  assert.equal(find("calc 3")[0]?.code, "MACT 2123");
  assert.equal(find("gen chem 2")[0]?.code, "CHEM 1006");
  assert.equal(find("organic chem ii")[0]?.code, "CHEM 3006");
  assert.equal(find("diff eq")[0]?.code, "MACT 2141");
  assert.equal(find("strength materials")[0]?.code, "MENG 2112");
  assert.equal(find("math1122")[0]?.code, "MACT 1122");
});

test("distinguishes course sequences from course levels", () => {
  const chemSecond = find("chem 2");
  assert.ok(chemSecond.length > 0);
  assert.equal(chemSecond[0].code, "CHEM 1006");
  assert.ok(chemSecond.every(course => course.subject === "CHEM"));
  assert.ok(chemSecond.every(course => /\bII\b/i.test(course.title)));
  assert.ok(!chemSecond.some(course => course.code === "CHEM 2003"));

  const levelSearch = find("chem 2000");
  assert.ok(levelSearch.some(course => course.code === "CHEM 2003"));
  assert.ok(levelSearch.every(course => course.code.startsWith("CHEM 2")));
  assert.ok(!levelSearch.some(course => course.code === "CHEM 3006"));

  const levelOnly = find("2000 level");
  assert.ok(levelOnly.length > 30);
  assert.ok(levelOnly.every(course => course.level === "2000 Level"));
});

test("prioritizes exact codes and supports partial code prefixes", () => {
  assert.equal(find("CHEM 2003")[0]?.code, "CHEM 2003");
  assert.equal(find("chem2003")[0]?.code, "CHEM 2003");
  assert.ok(find("chem 200").some(course => course.code === "CHEM 2006"));
  assert.ok(find("chem 200").every(course => course.code.startsWith("CHEM 200")));
  assert.equal(find("1122")[0]?.code, "MACT 1122");
});

test("misspellings work as a fallback without flooding exact searches", () => {
  assert.ok(find("calculas").some(course => course.code === "MACT 1122"));
  assert.equal(find("calculus ii")[0]?.code, "MACT 1122");
  assert.ok(find("calculus ii").every(course => course.title.includes("Calculus II")));
  assert.equal(find("zzzzzznonsense").length, 0);
});

test("subject filters are respected with shorthand and typo matching", () => {
  assert.equal(find("calc 2", ["CHEM"]).length, 0);
  assert.equal(find("calc 2", ["MACT"])[0]?.code, "MACT 1122");
  assert.ok(find("chem 2", ["CHEM"]).every(course => course.subject === "CHEM"));
  assert.ok(find("", ["PHYS"]).every(course => course.subject === "PHYS"));
});

test("department searches still discover courses across the full catalog", () => {
  assert.ok(find("computer science").some(course => course.subject === "CSCE"));
  assert.ok(find("accounting").some(course => course.subject === "ACCT"));
  assert.ok(find("mechanics 2").some(course => course.code === "ENGR 2104"));
});

test("professor Teaches links use actual catalog course URLs, deduplicate and escape titles", () => {
  const source = readFileSync(new URL("../features/professors/professorInsights.ts", import.meta.url), "utf8");
  const compiled = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 }
  }).outputText;
  const module = { exports: {} as Record<string, any> };
  const row = { hidden: false };
  const list = { innerHTML: "", textContent: "", removeAttribute() {} };
  vm.runInNewContext(compiled, {
    module, exports: module.exports, window: {},
    document: { getElementById(id: string) { return id === "professor-teaches-row" ? row : list; } },
    require(name: string) {
      assert.equal(name, "../../data/courses");
      return { courses: [...catalog, { code: "TEST 1000", title: "A & B <C>" }] };
    }
  });
  const render = module.exports.renderProfessorCourses;
  render([{ courseCode: "MACT 1122" }, { courseCode: "mact 1122" }, { courseCode: "TEST 1000" }, { courseCode: "UNKNOWN 1234" }]);
  assert.equal(row.hidden, false);
  assert.equal(list.innerHTML, '<a class="professor-profile-course-link" href="/courses/mact-1122">Calculus II</a>, <a class="professor-profile-course-link" href="/courses/test-1000">A &amp; B &lt;C&gt;</a>');
  render([]);
  assert.equal(row.hidden, true);
  assert.equal(list.textContent, "");
});
