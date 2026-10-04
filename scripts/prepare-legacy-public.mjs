import { copyFile, mkdir, readdir } from "node:fs/promises";
import { extname, join, relative, resolve } from "node:path";

const projectRoot = process.cwd();
const publicRoot = resolve(projectRoot, "public");
const allowedRootExtensions = new Set([
  ".html",
  ".js",
  ".jpg",
  ".jpeg",
  ".png",
  ".svg",
  ".webp",
  ".gif",
  ".ico",
  ".xml",
  ".txt"
]);

function assertPublicTarget(targetPath) {
  const relativePath = relative(publicRoot, resolve(targetPath));

  if (relativePath.startsWith("..") || relativePath === "") {
    throw new Error(`Refusing to write outside the generated public directory: ${targetPath}`);
  }
}

async function copyDirectory(sourceDirectory, targetDirectory) {
  const entries = await readdir(sourceDirectory, { withFileTypes: true });

  await mkdir(targetDirectory, { recursive: true });

  for (const entry of entries) {
    const sourcePath = join(sourceDirectory, entry.name);
    const targetPath = join(targetDirectory, entry.name);

    assertPublicTarget(targetPath);

    if (entry.isDirectory()) {
      await copyDirectory(sourcePath, targetPath);
    } else if (entry.isFile()) {
      await copyFile(sourcePath, targetPath);
    }
  }
}

await mkdir(publicRoot, { recursive: true });

const rootEntries = await readdir(projectRoot, { withFileTypes: true });

for (const entry of rootEntries) {
  if (
    !entry.isFile() ||
    entry.name === "index.html" ||
    !allowedRootExtensions.has(extname(entry.name).toLowerCase())
  ) {
    continue;
  }

  const targetPath = join(publicRoot, entry.name);
  assertPublicTarget(targetPath);
  await copyFile(join(projectRoot, entry.name), targetPath);
}

await copyDirectory(join(projectRoot, "data"), join(publicRoot, "data"));
