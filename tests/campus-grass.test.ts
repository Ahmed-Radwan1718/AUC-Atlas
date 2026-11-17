import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const source = readFileSync(new URL("../app/newhome/grass.tsx", import.meta.url), "utf8");
const campus = readFileSync(new URL("../app/newhome/page.tsx", import.meta.url), "utf8");

test("campus lawn fills the space around all five buildings without covering routes", () => {
  assert.match(campus, /<CampusGrass night=\{night\} paths=\{ROAD_SEGMENTS\}/);
  assert.match(campus, /plots=\{LAWN_CLEARINGS\} plazaZ=\{PLAZA_Z\}/);
  assert.match(source, /distanceToSegmentSquared/);
  assert.match(source, /plot\.size\[0\]/);
  assert.match(source, /plazaZ/);
  assert.match(source, /isLawn\(px, pz, paths, plots, plazaZ\)/);
});

test("grass uses GPU instancing, wind, realistic lighting and reduced motion", () => {
  assert.match(source, /<instancedMesh/);
  assert.match(source, /onBeforeCompile/);
  assert.match(source, /uGrassTime/);
  assert.match(source, /uGrassMotion/);
  assert.match(source, /prefers-reduced-motion: reduce/);
  assert.match(source, /MeshStandardMaterial/);
  assert.match(source, /new Color\("#688069"\)/);
  assert.match(source, /new Color\("#849a7a"\)/);
  assert.match(source, /z \+= 3\.1/);
  assert.match(source, /const widths = \[0\.22, 0\.17, 0\.096, 0\.008\]/);
  assert.doesNotMatch(source, /Math\.random\(\)/);
  assert.doesNotMatch(source, /emissiveIntensity:/);
});
