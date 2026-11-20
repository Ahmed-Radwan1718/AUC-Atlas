import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import vm from "node:vm";
import ts from "typescript";

const read = (path: string) => readFileSync(new URL("../" + path, import.meta.url), "utf8");
const compiled = ts.transpileModule(read("lib/enrollmentTerm.ts"), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 }
}).outputText;
const exported: Record<string, any> = {};
vm.runInNewContext(compiled, {
  exports: exported, Date, Intl, Number, String, Array
});
const { enrollmentTermOptions, isValidEnrollmentTerm } = exported;

test("enrollment terms are academic seasons and cannot be in the future", () => {
  const now = new Date("2026-11-20T12:00:00Z");
  const terms: string[] = Array.from(enrollmentTermOptions(now));
  assert.deepEqual(terms.slice(0, 5),
    ["Fall 2026", "Spring 2026", "Fall 2025", "Spring 2025", "Fall 2024"]);
  assert.equal(isValidEnrollmentTerm("Fall 2024", now), true);
  assert.equal(isValidEnrollmentTerm("Fall 2027", now), false);
  assert.equal(isValidEnrollmentTerm("Summer 2025", now), false);
  assert.equal(isValidEnrollmentTerm("Spring 1999", now), false);
  assert.equal(isValidEnrollmentTerm("Spring 2020", now), true);
  assert.equal(isValidEnrollmentTerm("Fall 2020", now), true);
  assert.equal(isValidEnrollmentTerm("Fall 2019", now), false);
  assert.equal(terms.at(-1), "Spring 2020");
  assert.deepEqual(Array.from(enrollmentTermOptions(new Date("2026-04-15T12:00:00Z"))).slice(0, 2),
    ["Spring 2026", "Fall 2025"]);
});

test("onboarding uses the exact same 39 majors as Account Details", () => {
  const list = read("data/major-options.ts");
  const options = [...list.matchAll(/^\s+"([^"]+)",?$/gm)].map(match => match[1]);
  const markup = read("features/accounts/accountsMarkup.ts");
  const accountOptions = [...markup.matchAll(/data-major-value=\\\"([^"]+)\\\"/g)]
    .map(match => match[1]).filter(Boolean);
  assert.equal(options.length, 39);
  assert.deepEqual(options, accountOptions);
});

test("setup is mandatory only for missing fields and persists both", () => {
  const gate = read("components/ProfileSetupGate.tsx");
  const route = read("app/api/profile-onboarding/route.ts");
  const layout = read("app/layout.tsx");
  assert.match(layout, /<ProfileSetupGate \/>/);
  assert.match(gate, /showModal\(\)/);
  assert.match(gate, /onCancel=\{event => event.preventDefault\(\)\}/);
  assert.match(gate, /!profile\.major\?\.trim\(\)/);
  assert.match(gate, /!profile\.enrollmentTerm\?\.trim\(\)/);
  assert.match(route, /optionalSessionUser\(request\)/);
  assert.match(route, /runTransaction/);
  assert.match(route, /!original\.major \? \{ major \} : \{\}/);
  assert.match(route, /!original\.enrollmentTerm \? \{ enrollmentTerm \} : \{\}/);
});
