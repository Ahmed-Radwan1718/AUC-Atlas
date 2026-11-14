import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import vm from "node:vm";
import ts from "typescript";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (file: string) => readFileSync(path.join(root, file), "utf8");
const source = ts.transpileModule(read("server/auth-legacy/routes/google-auth.ts"), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 }
}).outputText;

type Seed = {
  uid?: string;
  userData?: Record<string, any> | null;
  userEmail?: string;
  emailVerified?: boolean;
  providerUid?: string | null;
  signInProvider?: string;
  twoFactor?: Record<string, boolean>;
};

function harness(seed: Seed = {}) {
  const uid = seed.uid || "existing-student";
  const providerUid = seed.providerUid === undefined ? "google-sub-123" : seed.providerUid;
  const record = {
    uid,
    email: seed.userEmail || "student@aucegypt.edu",
    emailVerified: seed.emailVerified !== false,
    displayName: "Existing Student",
    photoURL: "",
    providerData: providerUid === null ? [] : [{
      providerId: "google.com", uid: providerUid, email: "student@gmail.com"
    }]
  };
  let profile: Record<string, any> | null = seed.userData === null ? null : {
    fullName: "Existing Student",
    email: "student@aucegypt.edu",
    photoURL: "profile.png",
    ...(seed.userData || {}),
    ...(seed.twoFactor ? { twoFactor: seed.twoFactor } : {})
  };
  const updates: Record<string, any>[] = [];
  const sessions: string[] = [];
  const challenges: string[] = [];
  const deletions: string[] = [];
  const ref = {
    async get() {
      return { exists: Boolean(profile), data: () => profile ? { ...profile } : undefined };
    },
    async set(data: Record<string, any>, options: { merge?: boolean } = {}) {
      updates.push(data);
      profile = options.merge ? { ...(profile || {}), ...data } : data;
    }
  };
  const db = {
    collection(name: string) {
      assert.equal(name, "users");
      return { doc(id: string) {
        assert.equal(id, uid);
        return ref;
      } };
    }
  };
  const firestore = Object.assign(() => db, {
    FieldValue: { serverTimestamp: () => "test-timestamp" }
  });
  const firebase = {
    auth: () => ({
      async verifyIdToken(token: string) {
        assert.equal(token, "test-id-token");
        return {
          uid,
          email: record.email,
          firebase: { sign_in_provider: seed.signInProvider || "google.com" }
        };
      },
      async getUser(id: string) {
        assert.equal(id, uid);
        return record;
      },
      async updateUser(id: string, changes: Record<string, any>) {
        assert.equal(id, uid);
        Object.assign(record, changes);
        return record;
      },
      async createCustomToken(id: string) {
        assert.equal(id, uid);
        return "test-custom-token";
      },
      async deleteUser(id: string) {
        deletions.push(id);
      }
    }),
    firestore
  };
  const exports: Record<string, any> = {};
  vm.runInNewContext(source, {
    exports,
    process: { env: {
      FIREBASE_PROJECT_ID: "test-project",
      FIREBASE_WEB_API_KEY: "test-key"
    } },
    require(id: string) {
      if (id === "../_lib/firebaseAdmin") return { default: firebase };
      if (id === "../_lib/securityHelpers") return {
        ensureAllowedAucEmail(email: string) {
          if (!email.endsWith("@aucegypt.edu")) {
            throw Object.assign(new Error("An AUC email is required."), { statusCode: 403 });
          }
          return email;
        },
        getOptionalSiteSessionUser: async () => ({ uid, email: record.email }),
        getSiteSessionUser: async () => ({ uid, email: record.email }),
        createSiteSessionForUid: async (id: string) => { sessions.push(id); },
        createLoginChallenge: async (id: string) => { challenges.push(id); }
      };
      if (id === "../_lib/securityRateLimits") return {
        getRequestIp: () => "127.0.0.1",
        consumeSecurityRateLimit: async () => {}
      };
      throw new Error("Unexpected import: " + id);
    }
  }, { filename: "server/auth-legacy/routes/google-auth.ts" });

  async function call(method = "POST", action = "login") {
    let status = 200;
    const response = {
      setHeader(_key: string, _value: string) {},
      status(next: number) { status = next; return this; },
      json(body: Record<string, any>) { return { status, body }; }
    };
    return await exports.default({
      method,
      body: { action, idToken: "test-id-token" }
    }, response) as { status: number; body: Record<string, any> };
  }
  return { call, sessions, challenges, deletions, updates,
    get profile() { return profile; }, record };
}

test("existing Firebase Google provider is recognized without a Firestore connection marker", async () => {
  const app = harness();
  const state = await app.call("GET");
  assert.equal(state.status, 200);
  assert.equal(state.body.connected, true);
  assert.equal(state.body.googleEmail, "student@gmail.com");
  assert.equal(app.updates.length, 0);
});

test("linked Google login uses the existing account and repairs missing metadata", async () => {
  const app = harness();
  const result = await app.call();
  assert.equal(result.status, 200);
  assert.equal(result.body.success, true);
  assert.equal(result.body.user.uid, "existing-student");
  assert.equal(result.body.user.photoURL, "profile.png");
  assert.equal(result.body.requiresTwoFactor, false);
  assert.equal(app.sessions.length, 1);
  assert.equal(app.sessions[0], "existing-student");
  assert.equal(app.profile?.googleConnection.providerUid, "google-sub-123");
  assert.equal(app.profile?.fullName, "Existing Student");
  assert.equal(app.record.emailVerified, true);
});

test("a stale Firestore connection marker is repaired using Firebase provider identity", async () => {
  const app = harness({ userData: { googleConnection: { providerUid: "obsolete-google-sub" } } });
  assert.equal((await app.call()).status, 200);
  assert.equal(app.profile?.googleConnection.providerUid, "google-sub-123");
  assert.equal(app.updates.length, 1);
});

test("an already-confirmed connection signs in without rewriting the profile", async () => {
  const app = harness({ userData: { googleConnection: { providerUid: "google-sub-123" } } });
  assert.equal((await app.call()).status, 200);
  assert.equal(app.updates.length, 0);
});

test("Google login never creates an AUC Atlas profile for an unregistered account", async () => {
  const app = harness({ userData: null });
  const result = await app.call();
  assert.equal(result.status, 403);
  assert.equal(app.sessions.length, 0);
  assert.equal(app.updates.length, 0);
});

test("a Firestore marker alone cannot authorize a Google login", async () => {
  const app = harness({
    providerUid: null,
    userData: { googleConnection: { providerUid: "google-sub-123" } }
  });
  const result = await app.call();
  assert.equal(result.status, 403);
  assert.equal(app.sessions.length, 0);
  assert.equal(app.updates.length, 0);
});

test("unverified AUC email cannot be upgraded by Google sign-in", async () => {
  const app = harness({ emailVerified: false });
  const result = await app.call();
  assert.equal(result.status, 403);
  assert.match(result.body.error, /verify your AUC email/i);
  assert.equal(app.record.emailVerified, false);
  assert.equal(app.sessions.length, 0);
  assert.equal(app.updates.length, 0);
});

test("a verified non-AUC Firebase email cannot borrow a profile AUC email", async () => {
  const app = harness({ userEmail: "outside@gmail.com" });
  assert.equal((await app.call()).status, 403);
  assert.equal(app.sessions.length, 0);
  assert.equal(app.updates.length, 0);
});

test("the login token must actually be authenticated through Google", async () => {
  const app = harness({ signInProvider: "password" });
  assert.equal((await app.call()).status, 401);
  assert.equal(app.sessions.length, 0);
  assert.equal(app.updates.length, 0);
});

test("existing accounts with two-factor enabled still receive their login challenge", async () => {
  const app = harness({ twoFactor: { appEnabled: true, emailEnabled: false } });
  const result = await app.call();
  assert.equal(result.status, 200);
  assert.equal(result.body.requiresTwoFactor, true);
  assert.equal(result.body.method, "app");
  assert.equal(app.challenges[0], "existing-student");
  assert.equal(app.sessions.length, 0);
});

test("login stays a sign-in operation; account linking handles stale provider data", () => {
  const login = read("features/auth/loginRuntime.ts");
  const accounts = read("features/accounts/accountRuntime.ts");
  assert.match(login, /signInWithPopup\s*\(/);
  assert.doesNotMatch(login, /linkWithPopup\s*\(/);
  assert.match(accounts, /await reload\(currentUser\)/);
  assert.match(accounts, /error\.code !== "auth\/provider-already-linked"/);
});
