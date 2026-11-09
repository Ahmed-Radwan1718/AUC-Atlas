"use strict";

const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const path = require("node:path");
const { test } = require("node:test");

const fromRoot = file => readFileSync(path.join(__dirname, "..", file), "utf8");

const contentModule = fromRoot("features/faq/faqContent.ts");
const encodedMarkup = contentModule.split("export const faqMarkup = ")[1]?.trim().replace(/;$/, "");
assert.ok(encodedMarkup, "FAQ server-rendered markup must be exported");
const faqMarkup = JSON.parse(encodedMarkup);

test("restores exactly 16 accessible original questions and answers", () => {
  assert.equal((faqMarkup.match(/<article class="faq-item">/g) || []).length, 16);
  const controls = [...faqMarkup.matchAll(/aria-controls="(faq-answer-\d+)"/g)]
    .map(match => match[1]);
  assert.equal(controls.length, 16);
  assert.equal(new Set(controls).size, 16);
  for (let i = 1; i <= 16; i++) {
    assert.equal(controls[i - 1], "faq-answer-" + i);
    assert.ok(faqMarkup.includes('id="faq-answer-' + i + '" hidden'),
      "Each collapsed answer must be present and hidden initially");
  }
  assert.ok(faqMarkup.includes("What can I use AUC Atlas for?"));
  assert.ok(faqMarkup.includes("Where can I find the full rules for using AUC Atlas?"));
});

test("FAQ internal links use live v2 routes and its CSS is isolated", () => {
  assert.ok(faqMarkup.includes('href="/privacy"'));
  assert.ok(faqMarkup.includes('href="/terms"'));
  assert.doesNotMatch(faqMarkup, /href="[^"]+\.html"/);
  assert.doesNotMatch(faqMarkup, /class="info-/);
  const css = fromRoot("features/faq/faq.css");
  assert.ok(css.includes(".faq-page"));
  assert.ok(css.includes(".faq-item.open"));
  assert.doesNotMatch(css, /\.info-/);
  assert.doesNotMatch(css, /^\s*(body|\*)\s*\{/m);
});

test("generated SEO metadata references canonical URLs and excludes private sections", () => {
  const sitemap = fromRoot("app/sitemap.ts");
  const robots = fromRoot("app/robots.ts");
  assert.ok(sitemap.includes('const ORIGIN = "https://aucatlas.com"'));
  for (const route of ["/faq", "/privacy", "/terms", "/professors", "/courses"]) {
    assert.ok(sitemap.includes('"' + route + '"'));
  }
  assert.ok(sitemap.includes("new Set<string>(publicPages)"), "Sitemap entries must be unique");
  assert.ok(sitemap.includes('"/professors/" + encodeURIComponent(professor.id)'));
  assert.ok(sitemap.includes('"/courses/" + encodeURIComponent(slug)'));
  assert.doesNotMatch(sitemap, /\.html"/);
  assert.ok(robots.includes('sitemap: "https://aucatlas.com/sitemap.xml"'));
  for (const route of ["/admin", "/accounts", "/api/"]) {
    assert.ok(robots.includes('"' + route + '"'));
  }
});
