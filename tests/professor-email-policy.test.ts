import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import vm from "node:vm";
import ts from "typescript";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (file: string) => readFileSync(path.join(root, file), "utf8");

type ProfessorEntry = { email?: string };
type Policy = {
  isProfessorEmail: (email: unknown) => boolean;
  assertStudentAccountEmail: (email: unknown) => void;
};

const compiled = ts.transpileModule(read("server/professorEmails.ts"), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 }
}).outputText;

function policyFor(professors: ProfessorEntry[]): Policy {
  const exports: Record<string, any> = {};
  vm.runInNewContext(compiled, {
    exports,
    require(id: string) {
      assert.equal(id, "../data/professors");
      return { professors };
    }
  }, { filename: "server/professorEmails.ts" });
  return exports as Policy;
}

function emailsFromSource(): ProfessorEntry[] {
  return ["data/professors-1.ts", "data/professors-2.ts", "data/professors-3.ts"]
    .flatMap(file => [...read(file).matchAll(/\bemail:\s*"([^"]*)"/g)]
      .map(match => ({ email: match[1] })));
}

test("professor email policy reads current faculty records from all three files", () => {
  const records = emailsFromSource();
  const populated = records.filter(record => record.email?.trim());
  assert.ok(populated.length > 200, "Expected published faculty emails");
  const policy = policyFor(records);
  for (const { email } of populated) {
    assert.equal(policy.isProfessorEmail(email), true, email);
  }
  assert.equal(policy.isProfessorEmail("eslammath@aucegypt.edu"), true);
  assert.equal(policy.isProfessorEmail("dina.abdelfattah@aucegypt.edu"), true);
  assert.equal(policy.isProfessorEmail("new.student@aucegypt.edu"), false);
});

test("policy normalizes email case and whitespace without blocking missing records", () => {
  const policy = policyFor([
    { email: " Faculty.Name@AUCegypt.edu " },
    { email: "" },
    {},
    { email: "  " }
  ]);
  assert.equal(policy.isProfessorEmail("FACULTY.NAME@aucegypt.edu"), true);
  assert.equal(policy.isProfessorEmail(" faculty.name@aucegypt.edu "), true);
  assert.equal(policy.isProfessorEmail(""), false);
  assert.equal(policy.isProfessorEmail("student@aucegypt.edu"), false);
  assert.doesNotThrow(() => policy.assertStudentAccountEmail("student@aucegypt.edu"));
  assert.throws(() => policy.assertStudentAccountEmail("faculty.name@aucegypt.edu"),
    (error: any) => {
      assert.equal(error.statusCode, 403);
      assert.equal(error.code, "student-email-ineligible");
      assert.match(error.message, /not eligible for an AUC Atlas student account/);
      return true;
    });
});

test("both legacy authentication and modern API sessions apply the shared policy", () => {
  const legacy = read("server/auth-legacy/_lib/securityHelpers.ts");
  const session = read("server/session.ts");
  const signup = read("server/auth-legacy/routes/signup.ts");
  const passwordLogin = read("server/auth-legacy/routes/login.ts");
  const loginCode = read("server/auth-legacy/routes/login-code.ts");
  const google = read("server/auth-legacy/routes/google-auth.ts");

  assert.match(legacy, /assertStudentAccountEmail\(normalizedEmail\)/);
  assert.match(legacy, /ensureAllowedAucEmail\(authoritativeEmail, "continue"\)/);
  assert.match(legacy, /ensureDecodedUserHasAllowedAucEmail\(decodedToken, "continue"\)/);
  assert.match(session, /isProfessorEmail\(decoded.email\)/);
  assert.match(session, /isProfessorEmail\(accountEmail\)/);

  assert.ok(signup.indexOf('ensureAllowedAucEmail(email, "create an account")') <
    signup.indexOf("admin.auth().createUser({"));
  assert.match(passwordLogin, /ensureAllowedAucEmail\(email, "log in"\)/);
  assert.match(loginCode, /ensureAllowedAucEmail\(/);
  assert.match(google, /ensureAllowedAucEmail\(/);
});
