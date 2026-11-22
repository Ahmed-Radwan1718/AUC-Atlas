import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import ts from "typescript";

const read = (path: string) =>
  readFileSync(new URL("../" + path, import.meta.url), "utf8");

const source = read("server/auth-legacy/routes/passkeys.ts");

test("passkey server module has valid TypeScript and WebAuthn verification calls", () => {
  const parsed = ts.createSourceFile("passkeys.ts", source, ts.ScriptTarget.Latest, true);
  assert.equal((parsed as ts.SourceFile & { parseDiagnostics: readonly ts.Diagnostic[] }).parseDiagnostics.length, 0);
  assert.match(source, /generateRegistrationOptions/);
  assert.match(source, /verifyRegistrationResponse/);
  assert.match(source, /generateAuthenticationOptions/);
  assert.match(source, /verifyAuthenticationResponse/);
  assert.match(source, /requireUserVerification: true/);
  assert.match(source, /residentKey: "required"/);
  assert.match(source, /authenticatorAttachment: "platform"/);
  assert.match(source, /attestationType: "none"/);
});

test("passkey challenges are short-lived, single use and bound to verified origin", () => {
  assert.match(source, /const CHALLENGE_EXPIRES_MS = 5 \* 60 \* 1000/);
  assert.match(source, /data\.consumedAt/);
  assert.match(source, /runTransaction/);
  assert.match(source, /verifiedOrigin\(req\)/);
  assert.match(source, /data\.origin !== currentOrigin\.origin/);
  assert.match(source, /expectedChallenge: data\.challenge/);
  assert.match(source, /expectedOrigin: data\.origin/);
  assert.match(source, /expectedRPID: data\.rpID/);
  assert.match(source, /"https:\/\/www\." \+ RP_ID/);
});

test("passkey enrollment requires a recent authenticated and optionally 2FA-unlocked security session", () => {
  assert.match(source, /getSiteSessionUser\(req, \{ checkRevoked: true \}\)/);
  assert.match(source, /requireSecurityPanelAccess\(req, decoded\)/);
  assert.match(source, /requireRecentLogin\(decoded\)/);
  assert.match(source, /user\.emailVerified/);
  assert.match(source, /ensureAllowedAucEmail/);
  assert.match(source, /MAX_KEYS_PER_USER = 10/);
  assert.match(source, /collection\("passkeyCredentials"\)/);
});

test("passkey login honors the existing 2FA challenge and session cookies", () => {
  assert.match(source, /verifyAuthenticationResponse/);
  assert.match(source, /createLoginChallenge\(uid, res,/);
  assert.match(source, /authMethod: "passkey"/);
  assert.match(source, /createSiteSessionForUid\(uid, res, req\)/);
  assert.match(source, /newCounter/);
  assert.match(source, /tx\.delete\(global\)/);
});

test("UI changes stay in Account Security, with invisible autofill on existing login", () => {
  const markup = read("features/accounts/accountsMarkup.ts");
  const loginMarkup = read("features/auth/loginMarkup.ts");
  const accountRuntime = read("features/accounts/accountRuntime.ts");
  const loginRuntime = read("features/auth/loginRuntime.ts");
  const bridge = read("server/authBridge.ts");
  assert.match(markup, /account-passkey-section/);
  assert.match(markup, /account-passkey-add-button/);
  assert.match(markup, /account-passkey-list/);
  assert.ok(loginMarkup.includes('username webauthn'));
  assert.match(accountRuntime, /startRegistration\(\{ optionsJSON: begin\.options \}\)/);
  assert.match(accountRuntime, /requestPasskey\("remove"/);
  assert.match(loginRuntime, /startAuthentication\(/);
  assert.match(loginRuntime, /useBrowserAutofill: true/);
  assert.match(bridge, /"passkeys": \(\) => require/);
  assert.doesNotMatch(read("features/auth/signupMarkup.ts"), /passkey/);
});

test("passkey authentication can complete existing email 2FA recovery", () => {
  const code = read("server/auth-legacy/routes/login-code.ts");
  assert.ok(code.includes('["password", "passkey"].includes(loginChallenge.authMethod)'));
});
