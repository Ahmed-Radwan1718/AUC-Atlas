import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const wheel = readFileSync(new URL("../app/newhome/wheel-data.ts", import.meta.url), "utf8");
const campus = readFileSync(new URL("../app/newhome/page.tsx", import.meta.url), "utf8");

function majorsIn(group: string): string[] {
  const start = wheel.indexOf("  " + group + ": [");
  assert.ok(start >= 0, "Missing " + group + " major group");
  const end = wheel.indexOf("\n  ],", start);
  assert.ok(end > start);
  return [...wheel.slice(start, end).matchAll(/name: "([^"]+)"/g)]
    .map(match => match[1]);
}

test("Engineering and Sciences are disjoint, complete and fit one page each", () => {
  const engineering = majorsIn("engineering");
  const sciences = majorsIn("sciences");
  assert.equal(engineering.length, 6);
  assert.equal(sciences.length, 7);
  assert.equal(new Set([...engineering, ...sciences]).size, 13);
  for (const major of [
    "Mechanical Engineering", "Computer Engineering",
    "Electronics and Communications Engineering", "Construction Engineering",
    "Petroleum Engineering", "Architecture"
  ]) assert.ok(engineering.includes(major), major);
  for (const major of [
    "Computer Science", "Data Science", "Mathematics", "Physics",
    "Chemistry", "Biology", "Actuarial Science"
  ]) assert.ok(sciences.includes(major), major);
});

test("Five clickable building scenes include separate Engineering and Sciences", () => {
  assert.ok(campus.includes('building.id==="engineering"&&<Engineering night={night}/>'));
  assert.ok(campus.includes('building.id==="sciences"&&<Sciences night={night}/>'));
  assert.ok(campus.includes('name:"sciences-entrance"'));
  assert.ok(campus.includes('id:"sciences",size:'));
  assert.ok(campus.includes('id:"engineering",size:'));
  assert.doesNotMatch(campus, /building\.id==="sse"|SITE_POSITIONS\.sse/);
});

test("night sky remains free of oversized zoom-out star artifacts", () => {
  assert.ok(!campus.includes("<Stars "));
  assert.ok(!campus.includes("Sky, Stars"));
  assert.ok(campus.includes("minZoom={minZoom} maxZoom={maxZoom}"));
  assert.ok(campus.includes("const minZoom=Math.max(1.05,fitZoom*0.72)"));
  assert.ok(campus.includes("function campusFitZoom("));
});
