import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const page = readFileSync(new URL("../app/newhome/page.tsx", import.meta.url), "utf8");
const wheel = readFileSync(new URL("../app/newhome/major-wheel.tsx", import.meta.url), "utf8");
const wheelCss = readFileSync(new URL("../app/newhome/major-wheel.module.css", import.meta.url), "utf8");
const sceneCss = readFileSync(new URL("../app/newhome/newhome.module.css", import.meta.url), "utf8");

test("building selection transitions smoothly into a wheel and reverses on close", () => {
  assert.ok(page.includes("const [closingWheel,setClosingWheel]=useState(false)"));
  assert.ok(page.includes("onSelect={openWheel}"));
  assert.ok(page.includes("closing={closingWheel} onClose={closeWheel} onExited={finishClosingWheel}"));
  assert.ok(page.includes("styles.sceneFocused"));
  assert.ok(wheel.includes("onAnimationEnd={event =>"));
  assert.ok(wheel.includes("if (closing && event.target === event.currentTarget) onExited();"));
  assert.ok(wheelCss.includes("animation: overlayEnter"));
  assert.ok(wheelCss.includes("animation: overlayExit"));
  assert.ok(wheelCss.includes("animation: wheelEnter"));
  assert.ok(wheelCss.includes("animation: wheelExit"));
  assert.ok(sceneCss.includes(".sceneFocused"));
});
test("major labels enter in sequence and reduced-motion users dismiss immediately", () => {
  assert.ok(wheel.includes('animationDelay: (0.12 + i * 0.045) + "s"'));
  assert.ok(wheel.includes('animationDelay: (0.22 + i * 0.045) + "s"'));
  assert.ok(page.includes('window.matchMedia("(prefers-reduced-motion: reduce)").matches'));
  assert.ok(wheelCss.includes("@media (prefers-reduced-motion: reduce)"));
  assert.ok(sceneCss.includes("@media (prefers-reduced-motion:reduce)"));
});
