import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import vm from "node:vm";
import ts from "typescript";

const read = (path: string) =>
  readFileSync(new URL("../" + path, import.meta.url), "utf8");
const transpiled = ts.transpileModule(
  read("app/api/homepage-personalized-materials/route.ts"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 }
  }
).outputText;

type Options = { signedIn?: boolean; verified?: boolean; semester?: number;
  major?: string; indexReady?: boolean };

function harness(options: Options = {}) {
  const calls: Array<{ code: string; sort: string; limit: number }> = [];
  let profileReads = 0;
  let materialReads = 0;
  const semester = options.semester ?? 1;
  const exports: Record<string, any> = {};
  const data = [
    { id: "sci-new", courseCode: "SCI 1020", status: "approved",
      title: "Scientific method", materialType: "Notes", createdAt: 200 },
    { id: "sci-rejected", courseCode: "SCI 1020", status: "rejected",
      title: "Rejected upload", materialType: "Notes", createdAt: 190 },
    { id: "sci-old", courseCode: "SCI 1020", status: "approved",
      title: "Scientific thinking slides", materialType: "Slides", createdAt: 180 },
    { id: "engr", courseCode: "ENGR 1005", status: "approved",
      title: "Engineering drawing", materialType: "Notes", createdAt: 175 },
    { id: "unrelated", courseCode: "CHEM 1005", status: "approved",
      title: "Not a semester one course", materialType: "Notes", createdAt: 300 }
  ];
  const courseCollection = {
    where(field: string, op: string, code: string) {
      assert.equal(field, "courseCode");
      assert.equal(op, "==");
      return {
        orderBy(sort: string, direction: string) {
          assert.equal(sort, "createdAt");
          assert.equal(direction, "desc");
          return {
            limit(limit: number) {
              calls.push({ code, sort, limit });
              return {
                async get() {
                  if (options.indexReady === false)
                    throw Error("FAILED_PRECONDITION: missing course-material index");
                  const matching = data.filter(row => row.courseCode === code)
                    .sort((a, b) => b.createdAt - a.createdAt).slice(0, limit);
                  materialReads += matching.length;
                  return { docs: matching.map(row => ({
                    id: row.id, data: () => ({ ...row })
                  })) };
                }
              };
            }
          };
        }
      };
    }
  };

  vm.runInNewContext(transpiled, {
    exports, String, Number, Promise, console,
    require(id: string) {
      switch (id) {
        case "next/server": return { NextResponse: { json: (body: any, init: any) =>
          ({ body, status: init.status, headers: init.headers }) } };
        case "../../../server/session": return {
          optionalSessionUser: async () =>
            options.signedIn === false ? null : { uid: "student", email: "user@aucegypt.edu" }
        };
        case "../../../server/firebase": return {
          firebaseAuth: () => ({ getUser: async () => ({
            email: "user@aucegypt.edu", emailVerified: options.verified !== false
          }) }),
          firestore: () => ({ collection: (name: string) => {
            if (name === "courseMaterials") return courseCollection;
            assert.equal(name, "users");
            return { doc: () => ({ get: async () => {
              profileReads += 1;
              return { data: () => ({
                major: options.major ?? "Mechanical Engineering",
                enrollmentTerm: "Fall 2026"
              }) };
            } }) };
          } })
        };
        case "../../../server/materials": return {
          serializeMaterialData: (id: string, raw: any) => ({
            id, title: raw.title, fileName: "", materialType: raw.materialType,
            createdAt: "2026-11-21T10:00:00Z", status: raw.status,
            downloadUrl: "/api/course-material-download?id=" + id
          })
        };
        case "../../../lib/enrollmentTerm": return {
          isValidEnrollmentTerm: () => true
        };
        case "../../../lib/course-recommendations/homepagePlanner": return {
          semesterFromEnrollment: () =>
            ({ semester, term: "Fall 2026", upcoming: false })
        };
        case "../../../lib/course-recommendations/newHomepageMechanicalPlan": return {
          getNewHomepageMechanicalSemesterPlan: (value: number) =>
            value === 1 ? { courses: [
              { code: "SCI 1020", title: "Scientific Thinking" },
              { code: "ENGR 1005", title: "Engineering Drawing" }
            ] } : null
        };
        default: throw Error("Unexpected import: " + id);
      }
    }
  });

  return {
    get: () => exports.GET({}),
    get calls() { return calls; },
    get materialReads() { return materialReads; },
    get profileReads() { return profileReads; }
  };
}

test("current-semester materials are grouped, filtered and linked to secure downloads", async () => {
  const app = harness();
  const response = await app.get();
  assert.equal(response.status, 200);
  assert.equal(response.body.status, "ready");
  assert.equal(response.body.term, "Fall 2026");
  assert.deepEqual(JSON.parse(JSON.stringify(response.body.courses.map((course: any) => course.code))),
    ["SCI 1020", "ENGR 1005"]);
  assert.deepEqual(JSON.parse(JSON.stringify(response.body.courses[0].materials.map((item: any) => item.id))),
    ["sci-new", "sci-old"]);
  assert.equal(response.body.courses[0].title, "Scientific Thinking");
  assert.equal(response.body.courses[0].materials[0].href,
    "/api/course-material-download?id=sci-new");
  assert.equal(app.materialReads, 4);
  assert.deepEqual(app.calls.map(call => call.code), ["SCI 1020", "ENGR 1005"]);
  assert.ok(app.calls.every(call => call.sort === "createdAt" && call.limit === 12));
});

test("signed-out and unverified accounts cannot receive uploaded material details", async () => {
  const signedOut = harness({ signedIn: false });
  assert.equal((await signedOut.get()).body.status, "sign-in");
  assert.equal(signedOut.materialReads, 0);
  const unverified = harness({ verified: false });
  assert.equal((await unverified.get()).body.status, "verify-email");
  assert.equal(unverified.profileReads, 0);
  assert.equal(unverified.materialReads, 0);
});

test("missing semester plans never leak materials from other semesters", async () => {
  const app = harness({ semester: 3 });
  const response = await app.get();
  assert.equal(response.body.status, "plan-pending");
  assert.equal(app.materialReads, 0);
  assert.equal(app.calls.length, 0);
});

test("missing material index returns an error without any broad fallback scan", async () => {
  const app = harness({ indexReady: false });
  const response = await app.get();
  assert.equal(response.status, 500);
  assert.equal(response.body.status, "error");
  assert.equal(app.materialReads, 0);
});

test("homepage course materials use expandable title-first course headings", () => {
  const page = read("features/home/NewHomepageMaterials.tsx");
  const css = read("app/homepagenew/homepagenew.css");
  assert.match(page, /<strong>\{course\.title\}<\/strong>/);
  assert.match(page, /homepagenew-material-course-code/);
  assert.match(page, /<span aria-hidden="true">·<\/span>/);
  assert.match(page, /aria-expanded=\{open\}/);
  assert.match(page, /setOpenedCourse\(open \? "" : course\.code\)/);
  assert.match(page, /course\.materials\.map\(material =>/);
  assert.match(page, /courseHref\(course\.code\)/);
  assert.match(css, /\.homepagenew-material-course-identity strong/);
  assert.match(css, /color: #a69d91/);
});
