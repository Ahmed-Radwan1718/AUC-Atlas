import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const campus = readFileSync(new URL("../app/newhome/page.tsx", import.meta.url), "utf8");
const css = readFileSync(new URL("../app/newhome/newhome.module.css", import.meta.url), "utf8");

test("the 3D campus always uses daytime sun and sky without a clock cycle", () => {
  assert.ok(campus.includes('const DAYLIGHT_SUN: Position = [-80, 135, 90]'));
  assert.ok(campus.includes('<Sky sunPosition={DAYLIGHT_SUN}'));
  assert.ok(campus.includes('<directionalLight position={DAYLIGHT_SUN}'));
  assert.ok(campus.includes("const night=0;"));
  assert.ok(campus.includes("<Campus onSelect={setSelectedSchool}/>"));
  assert.ok(!campus.includes("celestialState("));
  assert.ok(!campus.includes("setInterval("));
  assert.ok(!campus.includes("new Date("));
  assert.ok(!campus.includes("<NightBloom"));
  assert.ok(!campus.includes("atNight"));
});

test("the page shell uses a light sky while wind and water remain enabled", () => {
  assert.match(css, /background: linear-gradient\(180deg, #d9e8f2/);
  assert.ok(campus.includes('<Fountain position={[0,0,PLAZA_Z]} night={night}/>'));
  assert.ok(campus.includes("<CampusGrass night={night} paths={ROAD_SEGMENTS}"));
});
