import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import vm from "node:vm";
import ts from "typescript";

const source = readFileSync(new URL("../features/courses/prerequisiteDisplay.ts", import.meta.url), "utf8");
const compiled = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 }
}).outputText;
const compiledModule: { exports: { summarizeCoursePrerequisite?: (value: string) => string } } = {
  exports: {}
};
vm.runInNewContext(compiled, {
  module: compiledModule,
  exports: compiledModule.exports
}, { filename: "prerequisiteDisplay.ts" });

const summarize = compiledModule.exports.summarizeCoursePrerequisite;
assert.ok(summarize, "Prerequisite formatter should be exported");

test("hides generic high-school and standing requirements", () => {
  assert.equal(summarize("Thanawiya Amma Science or equivalent."), "");
  assert.equal(summarize("None listed."), "");
  assert.equal(summarize("Senior standing and consent of instructor."), "");
  assert.equal(summarize("College level preparation course in Mathematics or MACT 1111."), "MACT 1111");
});

test("shows exemption exam only when explicitly offered", () => {
  assert.equal(summarize("Thanawiya Amma Science or equivalent or exemption exam"), "Exemption exam");
  assert.equal(summarize("MACT 1121 or exemption."), "MACT 1121 or Exemption exam");
  assert.equal(summarize("BIOL 1011 or exemption"), "BIOL 1011 or Exemption exam");
});

test("preserves course codes and explicit and/or relationships", () => {
  assert.equal(summarize("MACT 1122 and PHYS 1011"), "MACT 1122 and PHYS 1011");
  assert.equal(summarize("CSCE 1101 or DSCI 2410"), "CSCE 1101 or DSCI 2410");
  assert.equal(summarize("MACT 1121\nPHYS 1012 to be taken concurrently"), "MACT 1121, PHYS 1012");
  assert.equal(summarize("ECNG 3105, concurrent with ECNG 3109L."), "ECNG 3105, ECNG 3109L");
});
