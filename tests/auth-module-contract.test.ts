import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import ts from "typescript";

const authDirectory = fileURLToPath(new URL("../server/auth-legacy/", import.meta.url));

function typescriptFiles(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const location = path.join(directory, entry.name);
    if (entry.isDirectory()) return typescriptFiles(location);
    return entry.isFile() && location.endsWith(".ts") ? [location] : [];
  });
}

test("Firebase Admin default export is imported correctly throughout authentication", () => {
  const firebaseSource = readFileSync(path.join(authDirectory, "_lib/firebaseAdmin.ts"), "utf8");
  assert.match(firebaseSource, /export\s+default\s+admin\s*;/);

  let importCount = 0;
  for (const filename of typescriptFiles(authDirectory)) {
    const source = ts.createSourceFile(
      filename, readFileSync(filename, "utf8"), ts.ScriptTarget.Latest, true
    );

    function visit(node: ts.Node): void {
      if (
        ts.isCallExpression(node) &&
        ts.isIdentifier(node.expression) &&
        node.expression.text === "require" &&
        node.arguments.length === 1 &&
        ts.isStringLiteral(node.arguments[0]) &&
        /(?:^|\/)firebaseAdmin(?:\.ts)?$/.test(node.arguments[0].text)
      ) {
        importCount += 1;
        assert.ok(
          ts.isPropertyAccessExpression(node.parent) &&
            node.parent.expression === node &&
            node.parent.name.text === "default",
          filename + " must access the Firebase Admin default export"
        );
      }
      ts.forEachChild(node, visit);
    }
    visit(source);
  }
  assert.ok(importCount >= 4, "Expected Firebase Admin to be imported by backend modules");
});
