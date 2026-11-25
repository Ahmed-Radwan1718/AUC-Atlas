import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import vm from "node:vm";
import ts from "typescript";

const read = (path: string) => readFileSync(new URL("../" + path, import.meta.url), "utf8");

test("only configured UIDs or a boolean current Firebase admin claim grant admin role", () => {
  const source = ts.transpileModule(read("server/adminRole.ts"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 }
  }).outputText;
  const module = { exports: {} as { hasCurrentAdminRole?: (uid: string, claims?: Record<string, unknown>) => boolean } };
  vm.runInNewContext(source, { module, exports: module.exports, process: { env: { ADMIN_UIDS: "allowed, another" } },
    require(name: string) { assert.equal(name, "server-only"); return {}; } });
  const role = module.exports.hasCurrentAdminRole!;
  assert.equal(role("allowed"), true);
  assert.equal(role("another"), true);
  assert.equal(role("other", {admin: true}), true);
  assert.equal(role("other"), false);
  assert.equal(role("other", {admin: "true"}), false);
  assert.equal(role("", {admin: true}), false);
});

test("map is dynamically gated on the server before rendering", () => {
  const page = read("app/campus-map/page.tsx");
  assert.ok(page.includes('dynamic = "force-dynamic"'));
  assert.ok(page.includes("await optionalSessionUser({ cookies: await cookies() })"));
  assert.ok(page.includes('if (!session) redirect("/")'));
  assert.ok(page.includes("firebaseAuth().getUser(session.uid).catch(() => null)"));
  assert.ok(page.includes('if (!user || user.disabled || !hasCurrentAdminRole(user.uid, user.customClaims)) redirect("/")'));
  assert.ok(page.indexOf("!hasCurrentAdminRole") < page.indexOf("return <PlazaMap"));
  assert.ok(read("components/Header.tsx").includes('href !== "/campus-map" || user?.isAdmin === true'));
  assert.ok(read("server/auth-legacy/routes/me.ts").includes("isAdmin: !userRecord.disabled && hasCurrentAdminRole"));
});
