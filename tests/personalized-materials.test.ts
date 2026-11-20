import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import vm from "node:vm";
import ts from "typescript";

const read = (name: string) =>
  readFileSync(new URL("../" + name, import.meta.url), "utf8");

const compiled = ts.transpileModule(read("lib/personalizedMaterials.ts"), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 }
}).outputText;
const exported: Record<string, any> = {};
vm.runInNewContext(compiled, {
  exports: exported, module: { exports: exported },
  Date, Map, Set, Number, Math, String
}, { filename: "personalizedMaterials.ts" });
const { selectPersonalizedMaterials } = exported;

const row = (id: string, courseCode: string, createdAt: unknown,
  extra: Record<string, unknown> = {}) => ({
  id, data: {
    courseCode, createdAt, title: "Notes " + id,
    status: "approved", materialType: "Notes", fileName: id + ".pdf",
    ...extra
  }
});

test("only projected course codes appear; newest uploads are first", () => {
  const selected = selectPersonalizedMaterials({
    courseCodes: ["MENG 3207"],
    records: [
      row("old", "MENG 3207", "2026-10-10T12:00:00Z"),
      row("unrelated", "MENG 3601", "2026-11-19T12:00:00Z"),
      row("new", "MENG 3207", "2026-11-18T12:00:00Z")
    ]
  });
  assert.deepEqual(Array.from(selected, (x: any) => x.id), ["new", "old"]);
});

test("rejected uploads cannot appear even if newest", () => {
  const selected = selectPersonalizedMaterials({
    courseCodes: ["MENG 3207"], records: [
      row("hidden", "MENG 3207", "2026-11-20T12:00:00Z", { status: "rejected" }),
      row("allowed", "MENG 3207", "2026-11-19T12:00:00Z")
    ]
  });
  assert.equal(selected.length, 1);
  assert.equal(selected[0].id, "allowed");
});

test("legacy uploads without status remain visible", () => {
  const selected = selectPersonalizedMaterials({
    courseCodes: ["MACT 3224"], records: [
      row("legacy", "MACT 3224", "2026-11-15T12:00:00Z", { status: undefined })
    ]
  });
  assert.equal(selected.length, 1);
});

test("bundle uploads only occupy one row even if many files", () => {
  const selected = selectPersonalizedMaterials({
    courseCodes: ["MENG 3207"], records: [
      row("same1", "MENG 3207", "2026-11-20T12:00:00Z", { uploadGroupId: "bundle1" }),
      row("same2", "MENG 3207", "2026-11-19T12:00:00Z", { uploadGroupId: "bundle1" }),
      row("separate", "MENG 3207", "2026-11-18T12:00:00Z")
    ]
  });
  assert.deepEqual(Array.from(selected, (x: any) => x.id), ["same1", "separate"]);
});

test("invalid material IDs and missing titles do not produce broken links", () => {
  const selected = selectPersonalizedMaterials({
    courseCodes: ["MENG 3207"], records: [
      row("../oops", "MENG 3207", "2026-11-20T12:00:00Z"),
      row("untitled", "MENG 3207", "2026-11-20T12:00:00Z", { title: "", fileName: "" }),
      row("valid", "MENG 3207", "2026-11-19T12:00:00Z")
    ]
  });
  assert.equal(selected.length, 1);
  assert.equal(selected[0].id, "valid");
});

test("uses the authenticated download endpoint and inline PDF preview", () => {
  const selected = selectPersonalizedMaterials({
    courseCodes: ["MENG 3207"], records: [
      row("pdf123", "MENG 3207", "2026-11-20T12:00:00Z"),
      row("slides321", "MENG 3207", "2026-11-19T12:00:00Z", {
        fileName: "slides.pptx", fileType: "application/vnd.openxmlformats-officedocument.presentationml.presentation"
      })
    ]
  });
  assert.equal(selected[0].href, "/api/course-material-download?id=pdf123&disposition=inline");
  assert.equal(selected[1].href, "/api/course-material-download?id=slides321");
  assert.ok(selected.every((x: any) => !("uploaderUid" in x)));
});

test("works with Firestore timestamp objects and legacy categories", () => {
  const selected = selectPersonalizedMaterials({
    courseCodes: ["mEng 3207"], records: [
      row("legacy", "MENG 3207", { toMillis: () => 1795120000000 }, {
        title: "", fileName: "assignment.pdf", materialType: "", category: "Past exam"
      })
    ]
  });
  assert.equal(selected.length, 1);
  assert.equal(selected[0].title, "assignment.pdf");
  assert.equal(selected[0].materialType, "Past exam");
});

test("limits the visible list without counting rejected or duplicate rows", () => {
  const records = [
    row("rejected", "MENG 3207", "2026-11-21", { status: "rejected" }),
    ...Array.from({ length: 9 }, (_, i) =>
      row("file" + i, "MENG 3207", new Date(Date.UTC(2026, 10, 20 - i))))
  ];
  const selected = selectPersonalizedMaterials({
    courseCodes: ["MENG 3207"], records, limit: 4
  });
  assert.equal(selected.length, 4);
  assert.deepEqual(Array.from(selected, (x: any) => x.id), ["file0", "file1", "file2", "file3"]);
});

test("homepage API is private, bounded, indexed, and never uses random global discovery", () => {
  const code = read("app/api/homepage-personalized-materials/route.ts");
  assert.match(code, /optionalSessionUser\(request\)/);
  assert.match(code, /verifiedMaterialUser\(user\)/);
  assert.match(code, /recommendMechanicalCourses\(/);
  assert.match(code, /where\("courseCode", "in", courseCodes\)/);
  assert.match(code, /orderBy\("createdAt", "desc"\)/);
  assert.match(code, /\.limit\(80\)/);
  assert.match(code, /"private, no-store"/);
  assert.doesNotMatch(code, /randomCourseMaterials|\.collection\("courseMaterials"\)\.get\(/);
});

test("new materials section is rendered only on experimental homepage", () => {
  const page = read("app/homepagenew/page.tsx");
  const component = read("features/home/NewHomepageMaterials.tsx");
  assert.match(page, /<NewHomepageMaterials \/>/);
  assert.match(component, /\/api\/homepage-personalized-materials/);
  assert.match(component, /No materials have been uploaded/);
});
