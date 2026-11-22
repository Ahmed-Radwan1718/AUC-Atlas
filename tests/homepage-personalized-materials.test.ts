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
    { id: "calc-ii", courseCode: "MACT 1122", status: "approved",
      title: "Calculus II practice", materialType: "Notes", createdAt: 290 },
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
              { code: "ENGR 1005", title: "Engineering Drawing" },
              { code: "CORE 1010", title: "Freshman Seminar" }
            ] } : value === 2 ? { courses: [
              { code: "MACT 1122", title: "Calculus II" },
              { code: "CHEM 1005", title: "General Chemistry I" }
            ] } : null
        };
        default: throw Error("Unexpected import: " + id);
      }
    }
  });

  return {
    get: (query = "") => exports.GET({ nextUrl: { searchParams: new URLSearchParams(query) } }),
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
  assert.ok(!response.body.courses.some((course: any) => course.code === "CORE 1010"));
  assert.equal(response.body.courses[0].materials[0].href,
    "/api/course-material-download?id=sci-new");
  assert.equal(app.materialReads, 4);
  assert.deepEqual(app.calls.map(call => call.code), ["SCI 1020", "ENGR 1005", "CORE 1010"]);
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

test("selecting semester 2 shows Calculus II even if calculated enrollment is semester 4", async () => {
  const app = harness({ semester: 4 });
  const response = await app.get("semester=2");
  assert.equal(response.status, 200);
  assert.equal(response.body.status, "ready");
  assert.equal(response.body.semester, 2);
  assert.equal(response.body.currentSemester, 4);
  assert.equal(response.body.preview, true);
  assert.equal(response.body.fallback, false);
  assert.equal(response.body.courses[0].title, "Calculus II");
  assert.equal(response.body.courses[0].materials[0].id, "calc-ii");
  assert.deepEqual(app.calls.map(call => call.code), ["MACT 1122", "CHEM 1005"]);
});

test("a missing current-semester plan previews semester 2 without claiming current enrollment", async () => {
  const app = harness({ semester: 4 });
  const response = await app.get();
  assert.equal(response.body.status, "ready");
  assert.equal(response.body.semester, 2);
  assert.equal(response.body.currentSemester, 4);
  assert.equal(response.body.preview, true);
  assert.equal(response.body.fallback, true);
  assert.equal(response.body.courses[0].materials[0].id, "calc-ii");
});

test("an explicitly requested unlisted semester does not show another semester's files", async () => {
  const app = harness({ semester: 4 });
  const response = await app.get("semester=4");
  assert.equal(response.body.status, "plan-pending");
  assert.equal(response.body.semester, 4);
  assert.equal(app.materialReads, 0);
});

test("invalid requested semesters are rejected before reading materials", async () => {
  const app = harness();
  const response = await app.get("semester=9");
  assert.equal(response.status, 400);
  assert.equal(response.body.status, "error");
  assert.equal(app.materialReads, 0);
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

test("course browsing and the materials accordion share an explicit semester", () => {
  const sections = read("features/home/NewHomepageAcademicSections.tsx");
  const page = read("app/homepagenew/page.tsx");
  const materials = read("features/home/NewHomepageMaterials.tsx");
  const endpoint = read("app/api/homepage-personalized-materials/route.ts");
  assert.match(sections, /<NewHomepageMaterials viewingSemester=\{viewingSemester\} \/>/);
  assert.match(sections, /<NewHomepageCourses onSemesterSelect=\{setViewingSemester\} \/>/);
  assert.doesNotMatch(page, /<NewHomepageMaterials\s*\/>/);
  assert.ok(materials.includes('(viewingSemester === null ? "" : "?semester=" + viewingSemester)'));
  assert.doesNotMatch(materials, /setSemesterOverride|homepagenew-material-semesters|Browse material semesters/);
  assert.match(endpoint, /request\.nextUrl\.searchParams\.get\("semester"\)/);
});

test("new homepage omits the extra professor disclaimer and materials semester selector", () => {
  const professors = read("features/home/NextSemesterProfessorsPreview.tsx");
  const materials = read("features/home/NewHomepageMaterials.tsx");
  const css = read("app/homepagenew/homepagenew.css");
  assert.doesNotMatch(professors, /Based on reviews for the listed courses|Teaching assignments for the upcoming semester are not confirmed/);
  assert.doesNotMatch(materials, /Browse material semesters|homepagenew-material-semester-button/);
  assert.ok(!css.includes(".homepagenew-material-semesters"));
});

test("courses without any approved materials are excluded entirely", async () => {
  const app = harness();
  const response = await app.get();
  const codes = response.body.courses.map((course: any) => course.code);
  assert.ok(!codes.includes("CORE 1010"));
  assert.ok(response.body.courses.every((course: any) => course.materials.length > 0));
});

test("UI never renders empty course rows and provides a helpful empty state", () => {
  const component = read("features/home/NewHomepageMaterials.tsx");
  assert.match(component, /result\.courses\.filter\(course => course\.materials\.length > 0\)/);
  assert.match(component, /No materials have been uploaded for this semester's courses yet/);
  assert.doesNotMatch(component, /No materials yet|No materials have been uploaded for this course yet/);
});

test("course material accordions start closed and only open after a click", () => {
  const component = read("features/home/NewHomepageMaterials.tsx");
  assert.match(component, /useState<string>\(""\)/);
  assert.match(component, /setOpenedCourse\(""\)/);
  assert.match(component, /const open = course\.code === openedCourse/);
  assert.match(component, /onClick=\{\(\) => setOpenedCourse\(open \? "" : course\.code\)\}/);
  assert.doesNotMatch(component, /openedCourse === null \? ordered\[0\]/);
});
