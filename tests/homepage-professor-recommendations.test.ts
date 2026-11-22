import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import vm from "node:vm";
import ts from "typescript";

const read = (path: string) =>
  readFileSync(new URL("../" + path, import.meta.url), "utf8");
const compile = (path: string) =>
  ts.transpileModule(read(path), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 }
  }).outputText;
const plain = (value: unknown) => JSON.parse(JSON.stringify(value));

function moduleFrom(path: string): Record<string, any> {
  const exports: Record<string, any> = {};
  vm.runInNewContext(compile(path), { exports, Promise, Date, Number, String, Map, Set });
  return exports;
}
const rankings = moduleFrom("lib/course-recommendations/newHomepageProfessorRecommendations.ts");
const mechanical = moduleFrom("lib/course-recommendations/newHomepageMechanicalPlan.ts");
const directory = [
  { id: "prof-good", name: "Highly Rated", image: "/good.png" },
  { id: "prof-low", name: "Lower Rated", image: "/low.png" },
  { id: "prof-thin", name: "Sparse Reviews" }
];

test("semester preview advances real terms and respects summer enrollment previews", () => {
  assert.deepEqual(plain(rankings.nextAcademicSemester({
    semester: 1, term: "Fall 2026", upcoming: false
  })), { semester: 2, term: "Spring 2027" });
  assert.deepEqual(plain(rankings.nextAcademicSemester({
    semester: 2, term: "Spring 2027", upcoming: false
  })), { semester: 3, term: "Fall 2027" });
  assert.deepEqual(plain(rankings.nextAcademicSemester({
    semester: 5, term: "Fall 2026", upcoming: true
  })), { semester: 5, term: "Fall 2026" });
  assert.equal(rankings.nextAcademicSemester({
    semester: 1, term: "unknown", upcoming: false
  }), null);
});

test("positive matches are allowed with limited samples; avoid requires three course reviews", () => {
  const rows = [
    { id: "a", professorId: "prof-good", courseCode: "CHEM 1005", rating: 5 },
    { id: "b", professorId: "prof-good", courseCode: "CHEM 1005", rating: 4 },
    { id: "c", professorId: "prof-good", courseCode: "CHEM 1005", rating: 5 },
    { id: "a", professorId: "prof-good", courseCode: "CHEM 1005", rating: 5 }, // legacy duplicate
    { id: "d", professorId: "prof-low", courseCode: "CHEM 1005", rating: 1 },
    { id: "e", professorId: "prof-low", courseCode: "CHEM 1005", rating: 2 },
    { id: "f", professorId: "prof-low", courseCode: "CHEM 1005", rating: 1 },
    { id: "g", professorId: "prof-thin", courseCode: "CHEM 1005", rating: 1 },
    { id: "h", professorId: "prof-thin", courseCode: "CHEM 1005", rating: 1 },
    { id: "i", professorId: "prof-good", courseCode: "PHYS 1011", rating: 1 },
    { id: "j", professorId: "unknown", courseCode: "CHEM 1005", rating: 5 },
    { id: "k", professorId: "prof-low", courseCode: "CHEM 1005", rating: 0 },
    { id: "l", professorId: "prof-low", courseCode: "CHEM 1005", rating: 6 }
  ];
  const result = plain(rankings.rankProfessorsForCourses(["CHEM 1005"], rows, directory));
  assert.equal(result.consider.length, 1);
  assert.equal(result.avoid.length, 1);
  assert.deepEqual(result.consider[0], {
    professorId: "prof-good", professorName: "Highly Rated", courseCode: "CHEM 1005",
    image: "/good.png", averageRating: 4.67, reviewCount: 3,
    ratingBasis: "course", courseReviewCount: 3, limitedEvidence: false
  });
  assert.deepEqual(result.avoid[0], {
    professorId: "prof-low", professorName: "Lower Rated", courseCode: "CHEM 1005",
    image: "/low.png", averageRating: 1.33, reviewCount: 3,
    ratingBasis: "course", courseReviewCount: 3, limitedEvidence: false
  });
  assert.deepEqual(plain(rankings.rankProfessorsForCourses(["MACT 1122"], rows, directory)),
    { consider: [], avoid: [] });
});

test("great overall ratings support a small verified course sample without inventing course teaching", () => {
  const rows = [
    { id: "1", professorId: "prof-good", courseCode: "CHEM 1005", rating: 5 },
    { id: "2", professorId: "prof-low", courseCode: "CHEM 1005", rating: 1 },
    { id: "3", professorId: "prof-thin", courseCode: "PHYS 1011", rating: 5 }
  ];
  const overall = [
    { professorId: "prof-good", averageRating: 4.8, reviewCount: 17 },
    { professorId: "prof-low", averageRating: 5, reviewCount: 20 },
    { professorId: "prof-thin", averageRating: 5, reviewCount: 40 }
  ];
  const result = plain(rankings.rankProfessorsForCourses(["CHEM 1005"], rows, directory, overall));
  assert.equal(result.consider.length, 1);
  assert.deepEqual(result.consider[0], {
    professorId: "prof-good", professorName: "Highly Rated",
    courseCode: "CHEM 1005", image: "/good.png",
    averageRating: 4.8, reviewCount: 17,
    ratingBasis: "overall", courseReviewCount: 1, limitedEvidence: true
  });
  // Strong global ratings don't qualify a professor with no course-specific link.
  assert.ok(!result.consider.some((p: any) => p.professorId === "prof-thin"));
  // Never put a professor into "avoid" based on a lone bad review.
  assert.equal(result.avoid.length, 0);

  const withoutOverall = plain(rankings.rankProfessorsForCourses(["CHEM 1005"], rows, directory));
  assert.equal(withoutOverall.consider[0].reviewCount, 1);
  assert.equal(withoutOverall.consider[0].ratingBasis, "course");
  assert.equal(withoutOverall.consider[0].limitedEvidence, true);
});

test("a good overall rating never hides three consistently poor reviews for the target course", () => {
  const rows = [1, 2, 3].map(i => ({
    id: "n" + i, professorId: "prof-low", courseCode: "CHEM 1005", rating: i === 1 ? 2 : 1
  }));
  const overall = [{ professorId: "prof-low", averageRating: 4.9, reviewCount: 60 }];
  const result = plain(rankings.rankProfessorsForCourses(["CHEM 1005"], rows, directory, overall));
  assert.equal(result.consider.length, 0);
  assert.equal(result.avoid.length, 1);
  assert.equal(result.avoid[0].ratingBasis, "course");
  assert.equal(result.avoid[0].averageRating, 1.33);
});

type ReviewDoc = {
  id: string;
  professorId: string;
  rating: number;
  courseCode?: string;
  courseTaken?: string;
};

function routeHarness({
  signedIn = true,
  major = "Mechanical Engineering",
  enrollmentTerm = "Fall 2026",
  rows = [] as ReviewDoc[],
  overall = [] as { professorId: string; averageRating: number; reviewCount: number }[]
} = {}) {
  let reviewsQueried = 0;
  let profileReads = 0;
  const db = {
    collection(collection: string) {
      if (collection === "users") return {
        doc(id: string) {
          assert.equal(id, "student-1");
          return { async get() {
            profileReads++;
            return { data: () => ({ major, enrollmentTerm }) };
          } };
        }
      };
      if (collection === "professorReviews") return {
        where(field: string, operation: string, code: string) {
          assert.ok(field === "courseCode" || field === "courseTaken");
          assert.equal(operation, "==");
          return {
            select(...fields: string[]) {
              assert.deepEqual(fields, ["professorId", "rating", "courseCode", "courseTaken"]);
              return {
                limit(n: number) {
                  assert.equal(n, 150);
                  return { async get() {
                    reviewsQueried++;
                    return { docs: rows.filter(row => row[field as "courseCode" | "courseTaken"] === code)
                      .map(row => ({ id: row.id, data: () => row })) };
                  } };
                }
              };
            }
          };
        }
      };
      throw Error("Unexpected collection: " + collection);
    }
  };
  const exports: Record<string, any> = {};
  vm.runInNewContext(compile("app/api/homepage-professor-recommendations/route.ts"), {
    exports, console, Promise, Number, String,
    require(id: string) {
      switch (id) {
        case "next/server":
          return { NextResponse: { json: (body: any, options: any) =>
            ({ body, status: options?.status || 200, headers: options?.headers }) } };
        case "../../../server/firebase":
          return { firestore: () => db };
        case "../../../server/session":
          return { optionalSessionUser: async () => signedIn ? { uid: "student-1" } : null };
        case "../../../server/professorRatingSummaries":
          return {
            getProfessorRatingSnapshot: async () => ({ populated: true }),
            homepageProfessorRankings: () => overall
          };
        case "../../../data/professors":
          return { professors: directory };
        case "../../../lib/enrollmentTerm":
          return { isValidEnrollmentTerm: (v: string) => Boolean(v) };
        case "../../../lib/course-recommendations/homepagePlanner":
          return { semesterFromEnrollment: () =>
            ({ semester: 1, term: "Fall 2026", upcoming: false }) };
        case "../../../lib/course-recommendations/newHomepageMechanicalPlan":
          return mechanical;
        case "../../../lib/course-recommendations/newHomepageProfessorRecommendations":
          return rankings;
        default:
          throw Error("Unexpected dependency: " + id);
      }
    }
  });
  return {
    async get(query = "") {
      const nextUrl = { searchParams: new URLSearchParams(query) };
      return plain(await exports.GET({ nextUrl }));
    },
    get reviewsQueried() { return reviewsQueried; },
    get profileReads() { return profileReads; }
  };
}

test("authenticated semester 1 students receive professor ratings for semester 2", async () => {
  const rows: ReviewDoc[] = [
    { id: "a", professorId: "prof-good", rating: 5, courseCode: "CHEM 1005", courseTaken: "CHEM 1005" },
    { id: "b", professorId: "prof-good", rating: 5, courseCode: "CHEM 1005", courseTaken: "CHEM 1005" },
    { id: "c", professorId: "prof-good", rating: 5, courseCode: "CHEM 1005", courseTaken: "CHEM 1005" },
    { id: "d", professorId: "prof-low", rating: 2, courseTaken: "RHET 1020" },
    { id: "e", professorId: "prof-low", rating: 1, courseTaken: "RHET 1020" },
    { id: "f", professorId: "prof-low", rating: 2, courseTaken: "RHET 1020" }
  ];
  const app = routeHarness({ rows });
  const current = await app.get();
  assert.equal(current.status, 200);
  assert.equal(current.body.status, "ready");
  assert.equal(current.body.semester, 2);
  assert.equal(current.body.term, "Spring 2027");
  assert.deepEqual(current.body.predictedCourses,
    plain(mechanical.getNewHomepageMechanicalSemesterPlan(2).courses.map((c: any) => c.code)));
  assert.equal(current.body.consider.length, 1);
  assert.equal(current.body.consider[0].professorId, "prof-good");
  assert.equal(current.body.consider[0].reviewCount, 3);
  assert.equal(current.body.avoid.length, 1);
  assert.equal(current.body.avoid[0].courseCode, "RHET 1020");
  assert.equal(app.reviewsQueried, current.body.predictedCourses.length * 2);

  const browsing = await app.get("semester=2");
  assert.equal(browsing.body.status, "ready");
  assert.equal(browsing.body.term, "Semester 2");
  assert.equal(browsing.body.consider[0].professorId, "prof-good");
  assert.equal(browsing.headers["Cache-Control"], "private, no-store");
});

test("never invent suggestions when the upcoming plan or reviews are missing", async () => {
  const app = routeHarness();
  const empty = await app.get();
  assert.equal(empty.body.status, "ready");
  assert.deepEqual(empty.body.consider, []);
  assert.deepEqual(empty.body.avoid, []);

  const before = app.reviewsQueried;
  const missingPlan = await app.get("semester=3");
  assert.equal(missingPlan.body.status, "plan-pending");
  assert.equal(missingPlan.body.semester, 3);
  assert.equal(app.reviewsQueried, before);
  const ninth = await app.get("semester=9");
  assert.equal(ninth.body.status, "plan-pending");
  assert.equal(ninth.body.semester, 9);

  const invalid = await app.get("semester=99");
  assert.equal(invalid.status, 400);
  assert.equal(app.reviewsQueried, before);
});

test("professor ratings remain private to valid student sessions and supported majors", async () => {
  const anonymous = routeHarness({ signedIn: false });
  const unauth = await anonymous.get();
  assert.equal(unauth.body.status, "sign-in");
  assert.equal(anonymous.profileReads, 0);
  assert.equal(anonymous.reviewsQueried, 0);

  const otherMajor = routeHarness({ major: "Architecture" });
  const unsupported = await otherMajor.get();
  assert.equal(unsupported.body.status, "unsupported-major");
  assert.equal(otherMajor.reviewsQueried, 0);
});

test("new homepage professor section follows the course selector, without changing legacy homepage", () => {
  const wrapper = read("features/home/NewHomepageAcademicSections.tsx");
  const page = read("app/homepagenew/page.tsx");
  const courses = read("features/home/NewHomepageCourses.tsx");
  const preview = read("features/home/NextSemesterProfessorsPreview.tsx");
  const css = read("app/homepagenew/homepagenew.css");
  assert.match(page, /<NewHomepageAcademicSections \/>/);
  assert.match(wrapper, /<NewHomepageCourses onSemesterSelect=\{setViewingSemester\} \/>/);
  assert.match(wrapper, /<NextSemesterProfessorsPreview viewingSemester=\{viewingSemester\} \/>/);
  assert.match(courses, /onSemesterSelect\?\.\(selectedSemester\)/);
  assert.match(preview, /"\?semester=" \+ viewingSemester/);
  assert.doesNotMatch(preview, /viewingSemester \+ 1/);
  assert.match(preview, /"Professors for Semester " \+ viewingSemester/);
  assert.match(preview, /status === "plan-pending"/);
  assert.match(preview, /Future teaching assignments are not confirmed/);
  assert.match(preview, /professor\.ratingBasis === "overall"/);
  assert.match(preview, /professor\.limitedEvidence/);
  assert.match(css, /\.homepagenew-professor-context/);
  assert.doesNotMatch(read("app/page.tsx"), /NewHomepageAcademicSections/);
});
