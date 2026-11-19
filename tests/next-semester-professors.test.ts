import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import vm from "node:vm";
import ts from "typescript";

function compile(path: string) {
  const source = readFileSync(new URL("../" + path, import.meta.url), "utf8");
  return ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 }
  }).outputText;
}
const mechanical: Record<string, any> = {};
vm.runInNewContext(compile("lib/mechanicalCourseRecommendations.ts"), {
  exports: mechanical, Date, Intl, Map, Set, Number, Array, Object, String
}, { filename: "mechanicalCourseRecommendations.ts" });

const result: Record<string, any> = {};
vm.runInNewContext(compile("lib/nextSemesterProfessorRecommendations.ts"), {
  exports: result, Date, Intl, Map, Set, Number, Array, Object, String,
  require(id: string) {
    if (id === "./mechanicalCourseRecommendations") return mechanical;
    throw Error("Unexpected runtime import " + id);
  }
}, { filename: "nextSemesterProfessorRecommendations.ts" });

const { nextRegularSemesterDate, projectNextMechanicalSemester,
  rankProjectedCourseProfessors } = result;
const codes = [...new Set([
  ...mechanical.MECHANICAL_TERM_PLAN.flat(),
  ...mechanical.MECHANICAL_CORE_AND_ELECTIVE_OPTIONS.map((x: any) => x.code)
])];
const catalog = codes.map((code: string) => ({ code, title: code }));
const fall2026 = new Date("2026-11-20T12:00:00Z");

test("always targets the next regular term, including January and summer", () => {
  const cases = [
    ["2026-11-20", "Spring 2027"],
    ["2026-12-20", "Spring 2027"],
    ["2027-01-12", "Spring 2027"],
    ["2027-03-12", "Fall 2027"],
    ["2027-07-12", "Fall 2027"],
    ["2027-10-12", "Spring 2028"]
  ];
  for (const [today, expected] of cases) {
    const target = nextRegularSemesterDate(new Date(today + "T12:00:00Z"));
    assert.equal(mechanical.cairoAcademicTerm(target).label, expected, today);
  }
});

test("a fall junior is recommended spring courses, not fall courses", () => {
  const projected = projectNextMechanicalSemester({
    aucId: "900242111", catalog, today: fall2026
  });
  assert.ok(projected);
  assert.equal(projected.term, "Spring 2027");
  assert.equal(projected.semester, 6);
  assert.ok(projected.predictedCodes.includes("MENG 3209"));
  assert.ok(projected.predictedCodes.includes("MENG 3502"));
  assert.ok(projected.predictedCodes.includes("MENG 3505"));
  assert.ok(projected.predictedCodes.includes("MENG 3601"));
  assert.ok(projected.predictedCodes.includes("ENGR 3222"));
  assert.ok(!projected.predictedCodes.includes("MENG 3207"));
});

test("in January, spring itself is the target, not a term after spring", () => {
  const projected = projectNextMechanicalSemester({
    aucId: "900242111", catalog,
    today: new Date("2027-01-12T12:00:00Z")
  });
  assert.equal(projected?.term, "Spring 2027");
  assert.equal(projected?.semester, 6);
});

test("saved progress plus projected current courses unlock next-semester prerequisites", () => {
  const saved = new Set(mechanical.MECHANICAL_TERM_PLAN.slice(0, 4).flat());
  const projected = projectNextMechanicalSemester({
    aucId: "900242111", catalog, today: fall2026,
    completedCodes: saved, hasSavedProgress: true
  });
  assert.ok(projected);
  assert.equal(projected.usedSavedProgress, true);
  assert.ok(projected.predictedCodes.includes("MENG 3209"));
  assert.ok(projected.predictedCodes.includes("MENG 3505"));
  assert.ok(projected.predictedCodes.includes("MENG 3601"));
  assert.ok(!projected.predictedCodes.includes("MENG 3207"));
});

test("completed next-semester courses are not recommended again", () => {
  const saved = new Set(mechanical.MECHANICAL_TERM_PLAN.slice(0, 5).flat());
  saved.add("MENG 3209");
  const projected = projectNextMechanicalSemester({
    aucId: "900242111", catalog, today: fall2026,
    completedCodes: saved, hasSavedProgress: true
  });
  assert.ok(projected);
  assert.ok(!projected.predictedCodes.includes("MENG 3209"));
});

test("does not claim another semester after the tenth modeled semester", () => {
  const projected = projectNextMechanicalSemester({
    aucId: "900222111", catalog, today: new Date("2027-03-12T12:00:00Z")
  });
  assert.ok(projected);
  assert.equal(projected.predictedCodes.length, 0);
});

const professors = [
  { id: "good", name: "Professor Good", image: "https://res.cloudinary.com/dhtamisqn/image/upload/good.png" },
  { id: "bad", name: "Professor Bad", image: "user.png" },
  { id: "middle", name: "Professor Middle" },
  { id: "extra", name: "Professor Extra" }
];
type Review = {
  id: string; professorId: string; courseCode?: string; courseTaken?: string;
  rating: number; authorUid?: string; createdAt?: string;
};
const review = (professorId: string, code: string, rating: number, i: number): Review => ({
  id: professorId + "-" + code + "-" + i,
  professorId, courseCode: code, rating, authorUid: "student-" + i,
  createdAt: "2026-01-01T12:00:00Z"
});

test("classifies only five or more distinct reviews for the exact projected course", () => {
  const reviews = [
    ...Array.from({ length: 5 }, (_, i) => review("good", "MENG 3209", 5, i)),
    ...Array.from({ length: 5 }, (_, i) => review("bad", "MENG 3502", 1, i)),
    ...Array.from({ length: 5 }, (_, i) => review("middle", "MENG 3209", 3, i)),
    ...Array.from({ length: 5 }, (_, i) => review("extra", "MENG 3705", 5, i))
  ];
  const ranked = rankProjectedCourseProfessors({
    predictedCodes: ["MENG 3209", "MENG 3502"], professors, reviews
  });
  assert.deepEqual(Array.from(ranked.consider, (x: any) => x.professorId), ["good"]);
  assert.deepEqual(Array.from(ranked.avoid, (x: any) => x.professorId), ["bad"]);
  assert.equal(ranked.consider[0].courseCode, "MENG 3209");
  assert.equal(ranked.consider[0].averageRating, 5);
  assert.equal(ranked.avoid[0].image, "/user.png");
});

test("five submissions from one student do not count as five independent ratings", () => {
  const reviews = Array.from({ length: 5 }, (_, i) => ({
    ...review("good", "MENG 3209", 5, i), authorUid: "same-student"
  }));
  const ranked = rankProjectedCourseProfessors({
    predictedCodes: ["MENG 3209"], professors, reviews
  });
  assert.equal(ranked.consider.length, 0);
});

test("latest review from same author takes precedence over older duplicate", () => {
  const reviews = Array.from({ length: 5 }, (_, i) =>
    review("good", "MENG 3209", 5, i));
  reviews.push({
    ...review("good", "MENG 3209", 1, 0), id: "newer",
    createdAt: "2026-03-01T12:00:00Z"
  });
  const ranked = rankProjectedCourseProfessors({
    predictedCodes: ["MENG 3209"], professors, reviews
  });
  assert.equal(ranked.consider.length, 1);
  assert.equal(ranked.consider[0].averageRating, 4.2);
  assert.equal(ranked.consider[0].reviewCount, 5);
});

test("legacy courseTaken, valid 1-to-5 scores, and unknown professors", () => {
  const reviews: Review[] = [
    ...Array.from({ length: 5 }, (_, i) => ({
      ...review("bad", "MENG 3209", 1, i), courseCode: undefined,
      courseTaken: " meng 3209 "
    })),
    ...Array.from({ length: 5 }, (_, i) => review("not-listed", "MENG 3209", 1, i)),
    review("good", "MENG 3209", 0, 13),
    review("good", "MENG 3209", 6, 14)
  ];
  const ranked = rankProjectedCourseProfessors({
    predictedCodes: ["MENG 3209"], professors, reviews
  });
  assert.equal(ranked.avoid.length, 1);
  assert.equal(ranked.avoid[0].professorId, "bad");
});

test("no projected course code produces no professor recommendations", () => {
  const ranked = rankProjectedCourseProfessors({
    predictedCodes: [], professors,
    reviews: Array.from({ length: 5 }, (_, i) => review("good", "MENG 3209", 5, i))
  });
  assert.equal(ranked.consider.length, 0);
  assert.equal(ranked.avoid.length, 0);
});

test("server endpoint stays session protected and does not return student identifiers", () => {
  const code = readFileSync(new URL("../app/api/homepage-professor-recommendations/route.ts",
    import.meta.url), "utf8");
  assert.match(code, /optionalSessionUser\(request\)/);
  assert.match(code, /rankProjectedCourseProfessors\(/);
  assert.match(code, /"private, no-store"/);
  assert.doesNotMatch(code, /\.json\(\{\s*authorUid/);
});
