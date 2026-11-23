import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { test } from "node:test";

const root = new URL("../", import.meta.url);
const read = (path: string) => readFileSync(new URL(path, root), "utf8");
const exists = (path: string) => existsSync(new URL(path, root));

test("new homepage is blank, with no course, professor or material functionality", () => {
  const page = read("app/homepagenew/page.tsx");
  assert.match(page, /return <main style=\{\{ minHeight: "100dvh" \}\} \/>/);
  assert.doesNotMatch(page, /NewHomepage|NewHomepageAcademicSections|homepagenew\.css|fetch\(/);
  assert.equal(exists("app/homepagenew/homepagenew.css"), false);
  for (const path of [
    "features/home/NewHomepageAcademicSections.tsx",
    "features/home/NewHomepageCourses.tsx",
    "features/home/NewHomepageMaterials.tsx",
    "features/home/NextSemesterProfessorsPreview.tsx",
    "app/api/homepage-course-recommendations/route.ts",
    "app/api/homepage-professor-recommendations/route.ts",
    "app/api/homepage-personalized-materials/route.ts",
    "lib/course-recommendations/homepagePlanner.ts",
    "lib/course-recommendations/newHomepageMechanicalPlan.ts",
    "lib/course-recommendations/newHomepageProfessorRecommendations.ts"
  ]) assert.equal(exists(path), false, path);
});

test("the original homepage and its API are preserved", () => {
  assert.match(read("app/page.tsx"), /import Home from "\.\.\/features\/home\/Home"/);
  assert.match(read("features/home/Home.tsx"), /homepage-overview/);
  assert.equal(exists("app/api/homepage-overview/route.ts"), true);
  assert.equal(exists("features/home/home.css"), true);
  assert.equal(exists("features/home/HomeSearch.tsx"), true);
});
