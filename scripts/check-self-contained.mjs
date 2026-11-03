import { readdir, readFile } from "node:fs/promises";
import { extname, join, relative } from "node:path";
import process from "node:process";

const ROOT = process.cwd();
const IGNORED_DIRECTORIES = new Set([".git", ".next", "node_modules"]);
const TEXT_EXTENSIONS = new Set([
  ".css",
  ".html",
  ".js",
  ".json",
  ".jsx",
  ".md",
  ".mjs",
  ".cjs",
  ".ts",
  ".tsx",
  ".txt",
  ".yaml",
  ".yml",
]);

const oldRepository = ["Ahmed-Radwan1718", "AUC-Atlas"].join("/");
const currentRepository = `${oldRepository}-v2.0`;
const violations = [];

async function scanDirectory(directory) {
  const entries = await readdir(directory, { withFileTypes: true });

  for (const entry of entries) {
    if (entry.isDirectory() && IGNORED_DIRECTORIES.has(entry.name)) continue;

    const absolutePath = join(directory, entry.name);

    if (entry.isDirectory()) {
      await scanDirectory(absolutePath);
      continue;
    }

    if (!entry.isFile() || !TEXT_EXTENSIONS.has(extname(entry.name))) continue;

    const content = await readFile(absolutePath, "utf8");
    const withoutCurrentRepository = content.split(currentRepository).join("");

    if (withoutCurrentRepository.includes(oldRepository)) {
      violations.push(relative(ROOT, absolutePath));
    }
  }
}

await scanDirectory(ROOT);

if (violations.length > 0) {
  console.error("Legacy AUC-Atlas repository references found:");
  for (const file of violations) console.error(`- ${file}`);
  process.exit(1);
}

console.log("Self-contained check passed: no references to the old AUC-Atlas repository.");
