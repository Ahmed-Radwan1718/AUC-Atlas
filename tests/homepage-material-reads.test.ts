import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import vm from "node:vm";
import ts from "typescript";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (name: string) => readFileSync(path.join(root, name), "utf8");
type Material = { id: string; data: Record<string, unknown> };
const docs: Material[] = [
  ...Array.from({ length: 180 }, (_, i) => ({
    id: "rejected-" + i,
    data: { status: "rejected", title: "Physics notes", courseCode: "PHYS 1011", createdAt: i + 200 }
  })),
  ...Array.from({ length: 125 }, (_, i) => ({
    id: "approved-" + i,
    data: { status: "approved", title: "Physics notes " + i, courseCode: "PHYS 1011", createdAt: i + 1 }
  }))
];

function harness(route: "homepage" | "search", indexReady = true) {
  const calls: Array<{ status: string; field: string; limit: number }> = [];
  let materialDocumentReads = 0;
  let unfilteredQueries = 0;
  let sessionChecks = 0;
  const collection = {
    count() {
      return { get: async () => ({ data: () => ({ count: docs.length }) }) };
    },
    where(field: string, operator: string, status: string) {
      assert.equal(field, "status");
      assert.equal(operator, "==");
      return {
        count() {
          return { get: async () => ({
            data: () => ({ count: docs.filter(item => item.data.status === status).length })
          }) };
        },
        orderBy(sortField: string, direction: string) {
          assert.equal(sortField, "createdAt");
          assert.equal(direction, "desc");
          return {
            limit(limit: number) {
              calls.push({ status, field: sortField, limit });
              return {
                async get() {
                  if (!indexReady) throw Error("FAILED_PRECONDITION: missing composite index");
                  const rows = docs.filter(item => item.data.status === status)
                    .sort((a, b) => Number(b.data.createdAt) - Number(a.data.createdAt))
                    .slice(0, limit);
                  materialDocumentReads += rows.length;
                  return { docs: rows.map(item => ({
                    id: item.id,
                    data: () => ({ ...item.data })
                  })) };
                }
              };
            }
          };
        }
      };
    },
    orderBy(_field: string, _direction: string) {
      unfilteredQueries += 1;
      throw Error("Unfiltered material query is forbidden in this test");
    }
  };
  const exportsObj: { exports: Record<string, any> } = { exports: {} };
  const source = ts.transpileModule(read(route === "homepage"
    ? "app/api/homepage-overview/route.ts"
    : "app/api/search-materials/route.ts"), {
      compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 }
    }).outputText;
  const json = (body: any, opts?: { status?: number; headers?: Record<string, string> }) =>
    ({ body, status: opts?.status || 200, headers: opts?.headers || {} });
  vm.runInNewContext(source, {
    module: exportsObj, exports: exportsObj.exports,
    Date, Promise, Map, Set, Number,
    require(name: string) {
      if (name === "next/server") return { NextResponse: { json } };
      if (name === "../../../server/firebase") return {
        firestore: () => ({ collection: (key: string) => {
          assert.equal(key, "courseMaterials");
          return collection;
        } }),
        firebaseAuth: () => ({ getUser: async () => ({
          email: "student@aucegypt.edu", emailVerified: true
        }) })
      };
      if (name === "../../../server/session") return {
        optionalSessionUser: async () => {
          sessionChecks += 1;
          return route === "homepage" ? null : { uid: "student", email: "student@aucegypt.edu" };
        }
      };
      if (name === "../../../server/professorRatingSummaries") return {
        getProfessorRatingSnapshot: async () => null,
        homepageProfessorRankings: () => []
      };
      if (name === "../../../server/security") return {
        consumeRateLimit: async () => {},
        RateLimitError: class RateLimitError extends Error {}
      };
      throw Error("Unexpected import " + name);
    }
  });
  return {
    get: async (query = "") => exportsObj.exports.GET({
      nextUrl: { searchParams: new URLSearchParams(query) }
    }),
    get reads() { return materialDocumentReads; },
    get calls() { return calls; },
    get unfilteredQueries() { return unfilteredQueries; },
    get sessionChecks() { return sessionChecks; }
  };
}

test("public homepage reads only three approved material documents", async () => {
  const app = harness("homepage");
  const response = await app.get();
  assert.equal(response.status, 200);
  assert.equal(response.body.latestMaterials.length, 3);
  assert.equal(response.body.materialCount, 125);
  assert.equal(response.body.reviewsLocked, true);
  assert.equal(app.reads, 3);
  assert.deepEqual(app.calls.map(call => ({ ...call })), [
    { status: "approved", field: "createdAt", limit: 3 }
  ]);
  assert.equal(app.unfilteredQueries, 0);
});

test("homepage never scans unrelated records if its required index is missing", async () => {
  const app = harness("homepage", false);
  const response = await app.get();
  assert.equal(response.status, 500);
  assert.equal(app.reads, 0);
  assert.equal(app.unfilteredQueries, 0);
});

test("material search only queries approved materials, and reuses warm instance cache", async () => {
  const app = harness("search");
  const first = await app.get("q=physics");
  const second = await app.get("q=physics");
  assert.equal(first.status, 200);
  assert.equal(first.body.materials.length, 20);
  assert.equal(second.status, 200);
  assert.equal(app.reads, 100);
  assert.deepEqual(app.calls.map(call => ({ ...call })), [
    { status: "approved", field: "createdAt", limit: 100 }
  ]);
  assert.equal(app.unfilteredQueries, 0);
});

test("material search cannot silently run a 100-document unfiltered fallback", async () => {
  const app = harness("search", false);
  const response = await app.get("q=physics");
  assert.equal(response.status, 500);
  assert.equal(app.reads, 0);
  assert.equal(app.unfilteredQueries, 0);
});
