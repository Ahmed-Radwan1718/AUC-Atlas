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
const plain = (value: unknown) => JSON.parse(JSON.stringify(value));

type Options = {
  signedIn?: boolean; verified?: boolean; semester?: number;
  major?: string; indexReady?: boolean; largeUpload?: boolean;
};
type Row = {
  id: string; courseCode: string; status: string; title: string;
  materialType: string; createdAt: number; uploadGroupId?: string;
  professor?: string; semester?: string; fileName?: string;
  fileType?: string; size?: number;
};

function harness(options: Options = {}) {
  const calls: Array<{ code: string; sort: string; limit: number }> = [];
  const groupCalls: Array<{ id: string; limit: number }> = [];
  let profileReads = 0;
  let materialReads = 0;
  const semester = options.semester ?? 1;
  const exports: Record<string, any> = {};
  const data: Row[] = [
    { id: "sci-new", courseCode: "SCI 1020", status: "approved",
      title: "Lecture Slides", professor: "Tamer Shoeib",
      semester: "Summer 2025", materialType: "Slides",
      fileName: "Chapter 6.pdf", fileType: "application/pdf", size: 2400000,
      uploadGroupId: "sci-bundle", createdAt: 200 },
    { id: "sci-extra", courseCode: "SCI 1020", status: "approved",
      title: "Lecture Slides", professor: "Tamer Shoeib",
      semester: "Summer 2025", materialType: "Slides",
      fileName: "Chapter 4.pdf", fileType: "application/pdf", size: 900000,
      uploadGroupId: "sci-bundle", createdAt: 199 },
    { id: "sci-rejected", courseCode: "SCI 1020", status: "rejected",
      title: "Lecture Slides", materialType: "Slides", uploadGroupId: "sci-bundle",
      fileName: "Rejected.pdf", createdAt: 198 },
    { id: "sci-old", courseCode: "SCI 1020", status: "approved",
      title: "Scientific thinking notes", materialType: "Notes",
      fileName: "Notes.pdf", createdAt: 180 },
    { id: "engr", courseCode: "ENGR 1005", status: "approved",
      title: "Engineering drawing", materialType: "Notes",
      fileName: "Drawing.pdf", createdAt: 175 },
    { id: "calc-ii", courseCode: "MACT 1122", status: "approved",
      title: "Calculus II practice", materialType: "Notes",
      fileName: "Practice.pdf", createdAt: 290 },
    { id: "dynamics", courseCode: "ENGR 2104", status: "approved",
      title: "Dynamics practice", materialType: "Notes",
      fileName: "Dynamics.pdf", createdAt: 292 },
    { id: "chem", courseCode: "CHEM 1005", status: "approved",
      title: "Chemistry notes", materialType: "Notes",
      fileName: "Chem.pdf", createdAt: 170 },
    // Data corruption or an accidental ID reuse must not leak another course
    // when the bundle is fetched from the global uploadGroupId index.
    { id: "cross-course", courseCode: "CHEM 1005", status: "approved",
      title: "Not a Scientific Thinking file", materialType: "Slides",
      fileName: "WrongCourse.pdf", uploadGroupId: "sci-bundle", createdAt: 300 }
  ];
  if (options.largeUpload) {
    for (let i = 0; i < 40; i++) {
      data.push({ id: "sci-long-" + i, courseCode: "SCI 1020",
        status: "approved", title: "Lecture Slides",
        professor: "Tamer Shoeib", semester: "Summer 2025",
        materialType: "Slides", fileName: "Chapter " + i + ".pdf",
        uploadGroupId: "sci-bundle", createdAt: 260 - i });
    }
  }
  const snapshot = (rows: Row[]) => ({
    docs: rows.map(row => ({ id: row.id, data: () => ({ ...row }) }))
  });
  const courseCollection = {
    where(field: string, op: string, value: string) {
      assert.equal(op, "==");
      if (field === "uploadGroupId") {
        return {
          limit(limit: number) {
            groupCalls.push({ id: value, limit });
            return {
              async get() {
                if (options.indexReady === false) throw Error("Missing group index");
                const rows = data.filter(row => row.uploadGroupId === value).slice(0, limit);
                materialReads += rows.length;
                return snapshot(rows);
              }
            };
          }
        };
      }
      assert.equal(field, "courseCode");
      return {
        orderBy(sort: string, direction: string) {
          assert.equal(sort, "createdAt");
          assert.equal(direction, "desc");
          return {
            limit(limit: number) {
              calls.push({ code: value, sort, limit });
              return {
                async get() {
                  if (options.indexReady === false)
                    throw Error("FAILED_PRECONDITION: missing course-material index");
                  const rows = data.filter(row => row.courseCode === value)
                    .sort((a, b) => b.createdAt - a.createdAt).slice(0, limit);
                  materialReads += rows.length;
                  return snapshot(rows);
                }
              };
            }
          };
        }
      };
    }
  };

  vm.runInNewContext(transpiled, {
    exports, String, Number, Promise, console, Map, Date,
    require(id: string) {
      switch (id) {
        case "next/server": return { NextResponse: { json: (body: any, init: any) =>
          ({ body, status: init.status, headers: init.headers }) } };
        case "../../../server/session": return {
          optionalSessionUser: async () => options.signedIn === false
            ? null : { uid: "student", email: "user@aucegypt.edu" }
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
          serializeMaterialData: (id: string, raw: Row) => ({
            id, title: raw.title, fileName: raw.fileName || "",
            fileType: raw.fileType || "", size: raw.size || 0,
            courseCode: raw.courseCode, uploadGroupId: raw.uploadGroupId || "",
            professor: raw.professor || "", semester: raw.semester || "",
            materialType: raw.materialType,
            createdAt: new Date(1700000000000 + raw.createdAt * 1000).toISOString(),
            status: raw.status,
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
            ] } : value === 4 ? { courses: [
              { code: "ENGR 2104", title: "Engineering Mechanics II (Dynamics)" },
              { code: "MENG 2112", title: "Strength of Materials" },
              { code: "PHYS 2216", title: "Fundamentals of Circuits and Electronics" },
              { code: "PHYS 2217", title: "Circuits and Electronics Lab" },
              { code: "MACT 2141", title: "Differential Equations" },
              { code: "MACT 3224", title: "Probability and Statistics" },
              { code: "MENG 2202", title: "Computational Thinking and Programming Lab" }
            ] } : null
        };
        default: throw Error("Unexpected import: " + id);
      }
    }
  });

  return {
    get: (query = "") => exports.GET({ nextUrl: { searchParams: new URLSearchParams(query) } }),
    get calls() { return calls; },
    get groupCalls() { return groupCalls; },
    get materialReads() { return materialReads; },
    get profileReads() { return profileReads; }
  };
}

test("homepage groups upload files under one title with professor and all file names", async () => {
  const app = harness();
  const response = await app.get();
  assert.equal(response.status, 200);
  assert.equal(response.body.status, "ready");
  assert.equal(response.body.term, "Fall 2026");
  assert.deepEqual(plain(response.body.courses.map((course: any) => course.code)),
    ["SCI 1020", "ENGR 1005"]);
  const uploads = response.body.courses[0].materials;
  assert.deepEqual(plain(uploads.map((upload: any) => upload.id)),
    ["sci-bundle", "sci-old"]);
  assert.equal(uploads[0].title, "Lecture Slides");
  assert.equal(uploads[0].professor, "Tamer Shoeib");
  assert.equal(uploads[0].semester, "Summer 2025");
  assert.deepEqual(plain(uploads[0].files.map((file: any) => file.fileName)),
    ["Chapter 6.pdf", "Chapter 4.pdf"]);
  assert.equal(uploads[0].files[0].href,
    "/api/course-material-download?id=sci-new");
  assert.ok(!JSON.stringify(uploads).includes("WrongCourse.pdf"));
  assert.ok(!JSON.stringify(uploads).includes("Rejected.pdf"));
  assert.ok(!response.body.courses.some((course: any) => course.code === "CORE 1010"));
  assert.deepEqual(app.groupCalls, [{ id: "sci-bundle", limit: 100 }]);
  assert.deepEqual(app.calls.map(call => call.code),
    ["SCI 1020", "ENGR 1005", "CORE 1010"]);
  assert.ok(app.calls.every(call => call.sort === "createdAt" && call.limit === 36));
});

test("a large bundle includes files that were outside the newest-file query", async () => {
  const app = harness({ largeUpload: true });
  const response = await app.get();
  const upload = response.body.courses[0].materials[0];
  assert.equal(upload.id, "sci-bundle");
  assert.equal(upload.files.length, 42);
  assert.ok(upload.files.some((file: any) => file.fileName === "Chapter 0.pdf"));
  assert.ok(upload.files.some((file: any) => file.fileName === "Chapter 39.pdf"));
  assert.equal(app.groupCalls[0].limit, 100);
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

test("selecting semester 2 includes Calculus II even when enrollment is semester 4", async () => {
  const app = harness({ semester: 4 });
  const response = await app.get("semester=2");
  assert.equal(response.status, 200);
  assert.equal(response.body.status, "ready");
  assert.equal(response.body.semester, 2);
  assert.equal(response.body.currentSemester, 4);
  assert.equal(response.body.preview, true);
  assert.equal(response.body.fallback, false);
  assert.equal(response.body.courses[0].title, "Calculus II");
  assert.equal(response.body.courses[0].materials[0].files[0].id, "calc-ii");
});

test("semester 4 materials are available for its course codes", async () => {
  const app = harness({ semester: 4 });
  const response = await app.get("semester=4");
  assert.equal(response.body.status, "ready");
  assert.equal(response.body.semester, 4);
  assert.equal(response.body.preview, false);
  assert.equal(response.body.courses[0].code, "ENGR 2104");
  assert.equal(response.body.courses[0].materials[0].files[0].id, "dynamics");
  assert.deepEqual(app.calls.map(call => call.code),
    ["ENGR 2104", "MENG 2112", "PHYS 2216", "PHYS 2217",
     "MACT 2141", "MACT 3224", "MENG 2202"]);
});

test("missing current-semester plan previews semester 2 without claiming current enrollment", async () => {
  const app = harness({ semester: 5 });
  const response = await app.get();
  assert.equal(response.body.status, "ready");
  assert.equal(response.body.semester, 2);
  assert.equal(response.body.currentSemester, 5);
  assert.equal(response.body.preview, true);
  assert.equal(response.body.fallback, true);
  assert.equal(response.body.courses[0].materials[0].files[0].id, "calc-ii");
});

test("explicit unlisted and invalid semesters do not leak other semester files", async () => {
  const missing = harness({ semester: 5 });
  const response = await missing.get("semester=5");
  assert.equal(response.body.status, "plan-pending");
  assert.equal(missing.materialReads, 0);
  const invalid = harness();
  const bad = await invalid.get("semester=9");
  assert.equal(bad.status, 400);
  assert.equal(bad.body.status, "error");
  assert.equal(invalid.materialReads, 0);
});

test("missing material index returns error with no broad scan", async () => {
  const app = harness({ indexReady: false });
  const response = await app.get();
  assert.equal(response.status, 500);
  assert.equal(response.body.status, "error");
  assert.equal(app.materialReads, 0);
});

test("homepage maintains course accordion, no empty rows, and no redundant semester controls", () => {
  const component = read("features/home/NewHomepageMaterials.tsx");
  const wrapper = read("features/home/NewHomepageAcademicSections.tsx");
  const css = read("app/homepagenew/homepagenew.css");
  assert.match(component, /<strong>\{course\.title\}<\/strong>/);
  assert.match(component, /homepagenew-material-course-code/);
  assert.match(component, /<span aria-hidden="true">·<\/span>/);
  assert.match(component, /aria-expanded=\{open\}/);
  assert.match(component, /setOpenedCourse\(open \? "" : course\.code\)/);
  assert.ok(component.includes('useState<string>("")'));
  assert.match(component, /courseHref\(course\.code\)/);
  assert.match(component, /result\.courses\.filter\(course => course\.materials\.length > 0\)/);
  assert.match(component, /No materials have been uploaded for this semester's courses yet/);
  assert.doesNotMatch(component, /No materials yet|No materials have been uploaded for this course yet/);
  assert.ok(component.includes('(viewingSemester === null ? "" : "?semester=" + viewingSemester)'));
  assert.match(wrapper, /<NewHomepageMaterials viewingSemester=\{viewingSemester\} \/>/);
  assert.doesNotMatch(component, /homepagenew-materials-context|Course materials preview|course updated this week/);
  assert.doesNotMatch(component, /Browse material semesters|homepagenew-material-semester-button/);
  assert.ok(css.includes("font-size: 6.5px;"));
  assert.ok(css.includes(".homepagenew-material-course-code { font-size: 6px; }"));
});

test("clicking an upload expands its full file list; file previews are distinct from downloads", () => {
  const component = read("features/home/NewHomepageMaterials.tsx");
  const route = read("app/api/homepage-personalized-materials/route.ts");
  assert.match(component, /onClick=\{\(\) => setOpenedUpload\(uploadOpen \? "" : uploadKey\)\}/);
  assert.match(component, /material\.files\.map\(file =>/);
  assert.match(component, /material\.professor/);
  assert.match(component, /previewFile\(file, setPreviewError\)/);
  assert.match(component, /url\.searchParams\.set\("disposition", "inline"\)/);
  assert.match(component, /url\.searchParams\.set\("disposition", "office-url"\)/);
  assert.match(component, /"\/api\/content-reports"/);
  assert.ok(!component.includes("href={material.href}"));
  assert.match(route, /where\("uploadGroupId", "==", uploadGroupId\)/);
  assert.match(route, /files: files\.map\(file => \(\{/);
});
