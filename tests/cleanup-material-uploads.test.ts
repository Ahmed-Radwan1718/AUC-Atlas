"use strict";

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import * as path from "node:path";
import { test } from "node:test";
import vm from "node:vm";
import ts from "typescript";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const __dirname = path.dirname(fileURLToPath(import.meta.url));

const cleanupSource = ts.transpileModule(
  readFileSync(
    path.resolve(__dirname, "../server/auth-legacy/routes/cleanup-material-uploads.ts"),
    "utf8"
  ),
  { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }
).outputText;
const CRON_SECRET = "mock-cron-secret-with-at-least-32-characters";

function createHarness(options: any = {}) {
  const authorizations = new Map(
    Object.entries(options.authorizations || {}).map(([id, data]) => [id, { ...(data as Record<string, unknown>) }])
  );
  const limits = new Map(
    Object.entries(options.limits || {}).map(([id, data]) => [id, { ...(data as Record<string, unknown>) }])
  );
  const deletedFiles: any[] = [];
  let queries = 0;

  const getCollectionMap = (ref: any) =>
    ref.collection === "materialUploadAuthorizations" ? authorizations : limits;

  const db = {
    collection(collection: string) {
      return {
        doc(id: string) {
          return { collection, id };
        },
        where(field: string, op: string, threshold: Date) {
          assert.equal(collection, "materialUploadAuthorizations");
          assert.equal(field, "expiresAt");
          assert.equal(op, "<=");
          return {
            orderBy(sortField: string, direction: string) {
              assert.equal(sortField, "expiresAt");
              assert.equal(direction, "asc");
              return {
                limit(count: number) {
                  return {
                    async get() {
                      queries += 1;
                      return {
                        docs: [...authorizations.entries()]
                          .filter(([, data]) => data.expiresAt instanceof Date &&
                            data.expiresAt.getTime() <= threshold.getTime())
                          .sort((a, b) => a[1].expiresAt - b[1].expiresAt)
                          .slice(0, count)
                          .map(([id]) => ({ ref: { collection, id } }))
                      };
                    }
                  };
                }
              };
            }
          };
        }
      };
    },
    async runTransaction(callback: any) {
      const operations: any[] = [];
      const transaction = {
        async get(ref: any) {
          const current = getCollectionMap(ref).get(ref.id);
          return { exists: Boolean(current), data: () => current ? { ...current } : undefined };
        },
        set(ref: any, data: any, settings?: any) {
          operations.push({ operation: "set", ref, data, merge: settings?.merge === true });
        },
        delete(ref: any) {
          operations.push({ operation: "delete", ref });
        }
      };
      const result = await callback(transaction);
      for (const action of operations) {
        const collection = getCollectionMap(action.ref);
        if (action.operation === "delete") {
          collection.delete(action.ref.id);
        } else {
          collection.set(action.ref.id,
            action.merge ? { ...(collection.get(action.ref.id) || {}), ...action.data } : action.data);
        }
      }
      return result;
    }
  };

  const firestore = () => db;
  firestore.Timestamp = { fromDate: (date: Date) => date };
  firestore.FieldValue = { serverTimestamp: () => new Date() };
  const module: { exports: any } = { exports: {} };
  vm.runInNewContext(cleanupSource, {
    module,
    exports: module.exports,
    Buffer,
    Date,
    process: { env: { CRON_SECRET: options.secret === undefined ? CRON_SECRET : options.secret } },
    require(id: string) {
      if (id === "crypto") return require("node:crypto");
      if (id === "../_lib/firebaseAdmin") return { firestore };
      if (id === "../_lib/courseMaterialStorage") {
        return {
          async deletePendingCourseMaterial(cleanup: any) {
            deletedFiles.push({ ...cleanup });
            if (options.failDeletion) throw new Error("Mock storage failure");
            return true;
          }
        };
      }
      throw new Error("Unexpected server dependency: " + id);
    }
  }, { filename: "cleanup-material-uploads.ts" });

  async function request(method: string, authorization?: string) {
    const response = {
      statusCode: 200,
      headers: {} as Record<string, string>,
      body: null as any,
      setHeader(name: string, value: string) { this.headers[name.toLowerCase()] = value; return this; },
      status(code: number) { this.statusCode = code; return this; },
      json(body: any) { this.body = body; return this; }
    };
    await module.exports.default({
      method,
      headers: authorization ? { authorization } : {}
    }, response);
    return response;
  }

  return {
    request,
    authorizations,
    limits,
    deletedFiles,
    get queryCount() { return queries; }
  };
}

test("denies anonymous and wrong bearer tokens without reading Firestore", async () => {
  const service = createHarness();
  const anonymous = await service.request("GET");
  assert.equal(anonymous.statusCode, 401);
  assert.equal(anonymous.body.error, "Unauthorized");
  const invalid = await service.request("GET", "Bearer wrong-token");
  assert.equal(invalid.statusCode, 401);
  assert.equal(service.queryCount, 0);
  assert.equal(service.deletedFiles.length, 0);
});

test("fails closed if CRON_SECRET is missing or too short", async () => {
  for (const secret of ["", "short"]) {
    const service = createHarness({ secret });
    const response = await service.request("GET", "Bearer " + secret);
    assert.equal(response.statusCode, 401);
    assert.equal(service.queryCount, 0);
  }
});

test("only GET can initiate cleanup", async () => {
  const service = createHarness();
  const response = await service.request("POST", "Bearer " + CRON_SECRET);
  assert.equal(response.statusCode, 405);
  assert.equal(response.headers.allow, "GET");
  assert.equal(service.queryCount, 0);
});

test("expired pending files are deleted; consumed records lose only metadata; grace period is honored", async () => {
  const expired = new Date(Date.now() - 60 * 60 * 1000);
  const withinGrace = new Date(Date.now() - 5 * 60 * 1000);
  const service = createHarness({
    authorizations: {
      pending: {
        expiresAt: expired,
        uploaderUid: "student-1",
        storageKey: "/auc-atlas/materials/example.pdf",
        storageProvider: "imagekit",
        consumedAt: null
      },
      consumed: {
        expiresAt: expired,
        uploaderUid: "student-2",
        consumedAt: new Date(Date.now() - 30 * 60 * 1000),
        storageProvider: "imagekit"
      },
      recent: {
        expiresAt: withinGrace,
        uploaderUid: "student-3",
        storageKey: "/auc-atlas/materials/recent.pdf",
        consumedAt: null
      }
    },
    limits: {
      "student-1": { activeAuthorizationId: "pending" },
      "student-2": { activeAuthorizationId: "consumed" }
    }
  });
  const response = await service.request("GET", "Bearer " + CRON_SECRET);
  assert.equal(response.statusCode, 200);
  assert.equal(response.body.success, true);
  assert.equal(response.body.scanned, 2);
  assert.equal(response.body.filesDeleted, 1);
  assert.equal(response.body.metadataRemoved, 1);
  assert.equal(response.body.failed, 0);
  assert.equal(service.deletedFiles.length, 1);
  assert.equal(service.deletedFiles[0].authorizationId, "pending");
  assert.equal(service.deletedFiles[0].storageProvider, "imagekit");
  assert.equal(service.authorizations.has("pending"), false);
  assert.equal(service.authorizations.has("consumed"), false);
  assert.equal(service.authorizations.has("recent"), true);
  assert.equal(service.limits.get("student-1").activeAuthorizationId, "");
  assert.equal(service.limits.get("student-2").activeAuthorizationId, "");
});

test("provider failure preserves the authorization and active marker for a later retry", async () => {
  const service = createHarness({
    failDeletion: true,
    authorizations: {
      pending: {
        expiresAt: new Date(Date.now() - 60 * 60 * 1000),
        uploaderUid: "student-1",
        storageProvider: "imagekit",
        storageKey: "/auc-atlas/materials/example.pdf"
      }
    },
    limits: {
      "student-1": { activeAuthorizationId: "pending" }
    }
  });
  const response = await service.request("GET", "Bearer " + CRON_SECRET);
  assert.equal(response.statusCode, 200);
  assert.equal(response.body.scanned, 1);
  assert.equal(response.body.failed, 1);
  assert.equal(response.body.filesDeleted, 0);
  assert.equal(service.authorizations.has("pending"), true);
  assert.equal(service.limits.get("student-1").activeAuthorizationId, "pending");
});

test("a successful authenticated run with no expired authorizations is a no-op", async () => {
  const service = createHarness();
  const response = await service.request("GET", "Bearer " + CRON_SECRET);
  assert.equal(response.statusCode, 200);
  assert.equal(response.body.scanned, 0);
  assert.equal(response.body.filesDeleted, 0);
  assert.equal(service.deletedFiles.length, 0);
});
