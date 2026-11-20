import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import vm from "node:vm";
import ts from "typescript";

const source = readFileSync(
  new URL("../lib/course-recommendations/universalCore.ts", import.meta.url),
  "utf8"
);
const compiled = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 }
}).outputText;
const module = { exports: {} as Record<string, any> };
vm.runInNewContext(compiled, {
  module, exports: module.exports, Number, Array, Set
}, { filename: "universalCore.ts" });
const requirements = module.exports.UNIVERSAL_CORE_REQUIREMENTS as Array<{
  code: string; preferredSemester: number; suggestedSemesters: number[];
}>;
const recommend = module.exports.recommendUniversalCoreCourses as (input: {
  semester: number; completedCodes?: ReadonlySet<string> | readonly string[];
}) => Array<{ code: string; timing: string }>;

// The tested module executes in an isolated VM realm. Convert VM arrays/objects
// to ordinary values before strict comparison, so equivalent recommendations
// are not rejected solely because their Array prototypes belong to another realm.
function assertPlainDeepEqual(actual: unknown, expected: unknown) {
  assert.deepEqual(JSON.parse(JSON.stringify(actual)), expected);
}

test("all six university-wide courses have the specified preferred semester", () => {
  assertPlainDeepEqual(requirements.map(x => [x.code, x.preferredSemester]), [
    ["CORE 1010", 1], ["RHET 1010", 1], ["SCI 1020", 1],
    ["RHET 1020", 2], ["LALT 1020", 2], ["PHIL 2100", 2]
  ]);
  assertPlainDeepEqual(Array.from(requirements.find(x => x.code === "SCI 1020")!.suggestedSemesters), [1, 2]);
  assertPlainDeepEqual(Array.from(requirements.find(x => x.code === "PHIL 2100")!.suggestedSemesters), [1, 2]);
});

test("first semester suggests only its three prioritized common courses", () => {
  assertPlainDeepEqual(recommend({ semester: 1 }).map(x => x.code),
    ["CORE 1010", "RHET 1010", "SCI 1020"]);
});

test("second semester includes missed first-semester courses before its own", () => {
  assertPlainDeepEqual(recommend({ semester: 2 }).map(x => [x.code, x.timing]), [
    ["CORE 1010", "overdue"], ["RHET 1010", "overdue"], ["SCI 1020", "overdue"],
    ["RHET 1020", "due"], ["LALT 1020", "due"], ["PHIL 2100", "due"]
  ]);
});

test("completed courses are excluded, regardless of capitalization or spacing", () => {
  assertPlainDeepEqual(recommend({
    semester: 2, completedCodes: new Set(["core   1010", "SCI 1020", "RHET 1010", "rhet 1020"])
  }).map(x => x.code), ["LALT 1020", "PHIL 2100"]);
});

test("outstanding Core requirements remain visible beyond second semester", () => {
  assertPlainDeepEqual(recommend({
    semester: 4, completedCodes: ["CORE 1010", "RHET 1010", "SCI 1020", "RHET 1020"]
  }).map(x => x.code), ["LALT 1020", "PHIL 2100"]);
  assertPlainDeepEqual(recommend({ semester: 0 }), []);
});
