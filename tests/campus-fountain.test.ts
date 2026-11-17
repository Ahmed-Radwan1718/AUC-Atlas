import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const campus = readFileSync(new URL("../app/newhome/page.tsx", import.meta.url), "utf8");
const fountain = readFileSync(new URL("../app/newhome/fountain.tsx", import.meta.url), "utf8");

test("central plaza tree and grass planter are replaced with a fountain", () => {
  assert.ok(campus.includes('import Fountain from "./fountain"'));
  assert.ok(campus.includes('<Fountain position={[0,0,PLAZA_Z]} night={night}/>'));
  assert.ok(!campus.includes('<RoundTree position={[0,0,PLAZA_Z]}'));
  assert.ok(!campus.includes('<circleGeometry args={[7.1,48]}/>'));
});

test("fountain has animated jets, droplets, pool waves, and reduced motion", () => {
  assert.match(fountain, /QuadraticBezierCurve3/);
  assert.match(fountain, /tubeGeometry/);
  assert.match(fountain, /useFrame\(/);
  assert.match(fountain, /setMatrixAt\(/);
  assert.match(fountain, /uFountainTime/);
  assert.match(fountain, /ripples\.current\.forEach/);
  assert.match(fountain, /prefers-reduced-motion: reduce/);
  assert.match(fountain, /night\*3\.2/);
});
