import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { test } from "node:test";
import vm from "node:vm";
import ts from "typescript";
import { fileURLToPath } from "node:url";

const base = path.dirname(fileURLToPath(import.meta.url));
const source = ts.transpileModule(
  readFileSync(path.resolve(base, "../server/auth-legacy/_lib/aucIdClaims.ts"), "utf8"),
  { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }
).outputText;

function harness(initial: {
  auth?: Record<string, boolean>;
  users?: Record<string, Record<string, unknown>>;
  reservations?: Record<string, Record<string, unknown>>;
} = {}) {
  const auth = new Map(Object.entries(initial.auth || {}));
  const users = new Map(Object.entries(initial.users || {}));
  const reservations = new Map(Object.entries(initial.reservations || {}));
  const dbMaps: Record<string, Map<string, Record<string, unknown>>> = {
    users, accountAucIds: reservations
  };
  const snapshot = (id: string, record?: Record<string, unknown>) => ({
    id, exists: Boolean(record), data: () => record ? { ...record } : undefined
  });
  const db = {
    collection(name: string) {
      const collection = dbMaps[name];
      assert.ok(collection, "Unexpected collection: " + name);
      return {
        doc(id: string) {
          return { name, id, async get() { return snapshot(id, collection.get(id)); } };
        },
        where(field: string, operator: string, value: string) {
          assert.equal(operator, "==");
          return {
            limit(count: number) {
              return {
                async get() {
                  return {
                    docs: [...collection.entries()]
                      .filter(([, data]) => data[field] === value)
                      .slice(0, count)
                      .map(([id, data]) => snapshot(id, data))
                  };
                }
              };
            }
          };
        }
      };
    },
    async runTransaction(callback: (transaction: any) => Promise<unknown>) {
      const writes: Array<{ ref: any; data: any; merge: boolean }> = [];
      const result = await callback({
        get: async (ref: any) => snapshot(ref.id, dbMaps[ref.name].get(ref.id)),
        set(ref: any, data: any, opts?: { merge?: boolean }) {
          writes.push({ ref, data, merge: opts?.merge === true });
        }
      });
      for (const { ref, data, merge } of writes) {
        const collection = dbMaps[ref.name];
        collection.set(ref.id, merge ? { ...(collection.get(ref.id) || {}), ...data } : data);
      }
      return result;
    }
  };
  const firestore = () => db;
  firestore.FieldValue = { serverTimestamp: () => new Date("2026-11-11T00:00:00Z") };
  const firebase = {
    firestore,
    auth: () => ({
      async getUser(uid: string) {
        if (!auth.has(uid)) {
          throw Object.assign(new Error("Not found"), { code: "auth/user-not-found" });
        }
        return { uid, emailVerified: auth.get(uid) };
      }
    })
  };
  const module = { exports: {} as Record<string, any> };
  vm.runInNewContext(source, {
    module, exports: module.exports,
    require(id: string) {
      assert.equal(id, "./firebaseAdmin");
      return { default: firebase };
    }
  }, { filename: "aucIdClaims.ts" });
  const claims = module.exports as {
    ensureAucIdCanCreateAccount: (id: string) => Promise<string>;
    claimVerifiedAucId: (uid: string) => Promise<void>;
  };
  return { ...claims, users, reservations, auth };
}

test("signup allows unverified legacy reservations and pending user profiles", async () => {
  const app = harness({
    auth: { old: false, pending: false },
    users: { old: { aucId: "900123456" }, pending: { aucIdLookupKey: "900123456" } },
    reservations: { "900123456": { uid: "old" } }
  });
  assert.equal(await app.ensureAucIdCanCreateAccount("900123456"), "900123456");
  assert.equal(app.reservations.get("900123456")?.uid, "old");
});

test("signup refuses already verified AUC IDs, including old reservations", async () => {
  const app = harness({
    auth: { old: true },
    users: { old: { aucId: "900123456" } },
    reservations: { "900123456": { uid: "old" } }
  });
  await assert.rejects(app.ensureAucIdCanCreateAccount("900123456"), { statusCode: 409 });
});

test("unverified accounts cannot claim an ID", async () => {
  const app = harness({ auth: { student: false }, users: { student: { aucId: "900123456" } } });
  await assert.rejects(app.claimVerifiedAucId("student"), { statusCode: 403 });
  assert.equal(app.reservations.size, 0);
});

test("verified sign-in claims the ID atomically, and repeat sign-in is idempotent", async () => {
  const app = harness({
    auth: { student: true },
    users: { student: { aucId: "900123456", aucIdClaimStatus: "pending_verification" } }
  });
  await app.claimVerifiedAucId("student");
  assert.equal(app.reservations.get("900123456")?.uid, "student");
  assert.ok(app.reservations.get("900123456")?.verifiedAt);
  assert.equal(app.users.get("student")?.aucIdClaimStatus, "verified");
  await app.claimVerifiedAucId("student");
  assert.equal(app.reservations.get("900123456")?.uid, "student");
});

test("a verified account cannot displace another verified account", async () => {
  const app = harness({
    auth: { first: true, second: true },
    users: {
      first: { aucId: "900123456" },
      second: { aucId: "900123456" }
    }
  });
  await app.claimVerifiedAucId("first");
  await assert.rejects(app.claimVerifiedAucId("second"), { statusCode: 409 });
  assert.equal(app.reservations.get("900123456")?.uid, "first");
});

test("verified account may reclaim a legacy reservation held by an unverified signup", async () => {
  const app = harness({
    auth: { legacy: false, verified: true },
    users: {
      legacy: { aucId: "900123456" },
      verified: { aucId: "900123456" }
    },
    reservations: { "900123456": { uid: "legacy" } }
  });
  await app.claimVerifiedAucId("verified");
  assert.equal(app.reservations.get("900123456")?.uid, "verified");
  assert.ok(app.reservations.get("900123456")?.verifiedAt);
});

test("new signup does not write a reservation; session creation finalizes it", () => {
  const signup = readFileSync(path.resolve(base, "../server/auth-legacy/routes/signup.ts"), "utf8");
  const sessions = readFileSync(path.resolve(base, "../server/auth-legacy/_lib/securityHelpers.ts"), "utf8");
  assert.doesNotMatch(signup, /reserveAccountAucId|accountAucIds/);
  assert.match(signup, /aucIdClaimStatus: "pending_verification"/);
  assert.match(sessions, /await claimVerifiedAucId\(decodedToken.uid\)/);
});
