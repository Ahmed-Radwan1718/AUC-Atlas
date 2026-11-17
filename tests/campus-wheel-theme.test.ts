import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const css = readFileSync(new URL("../app/newhome/major-wheel.module.css", import.meta.url), "utf8");
const wheel = readFileSync(new URL("../app/newhome/major-wheel.tsx", import.meta.url), "utf8");

test("major wheel uses light surfaces, dark text, and gold accents", () => {
  assert.ok(css.includes("background: rgba(250, 248, 243, .86)"));
  assert.ok(css.includes("color: #2e2923"));
  assert.ok(wheel.includes('fill={hovered === i ? "#d7af76" : "#ffffff"}'));
  assert.ok(wheel.includes('r={INNER - 6} fill="#ffffff"'));
  assert.ok(wheel.includes('stroke="#c5a06a"'));
  assert.ok(!wheel.includes('#0c1829'));
  assert.ok(!wheel.includes('rgba(60,77,97'));
});

test("course requirements panel shares white-and-gold styling", () => {
  assert.ok(css.includes("background: #ffffff"));
  assert.ok(css.includes("color: #342f28"));
  assert.ok(css.includes("background: #f5ead9"));
  assert.ok(!css.includes("rgba(20, 33, 50, .96)"));
  assert.ok(!css.includes("#1b2d40"));
});
