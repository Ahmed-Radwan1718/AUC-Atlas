import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { test } from "node:test";

const root = new URL("../", import.meta.url);
const read = (path: string) => readFileSync(new URL(path, root), "utf8");
const exists = (path: string) => existsSync(new URL(path, root));

test("new homepage shows Get Started with a courses-and-professors search", () => {
  const page = read("app/homepagenew/page.tsx");
  assert.match(page, /<h1\b[^>]*>Get Started<\/h1>/);
  assert.match(page, /<HomeSearch scope="catalog"\s*\/>/);
  assert.match(page, /import "\.\/homepagenew\.css"/);
  assert.equal(exists("app/homepagenew/homepagenew.css"), true);
  assert.doesNotMatch(page, /NewHomepageAcademicSections|NewHomepageCourses|NewHomepageMaterials|fetch\(/);
});

test("the catalog search includes courses and professors, not study materials", () => {
  const search = read("features/home/HomeSearch.tsx");
  assert.match(search, /export type SearchScope = [^\n]*"catalog"/);
  assert.match(search, /const professorResults: SearchResult\[\] = professors\.map/);
  assert.match(search, /const courseResults: SearchResult\[\] = courses\.map/);
  assert.match(search, /\(scope === "catalog" && index !== 2\)/);
  assert.match(search, /const searchesMaterials = scope === "all" \|\| scope === "materials"/);
  assert.match(search, /if \(query\.length < 2 \|\| !searchesMaterials\) return/);
  assert.match(search, /scope === "catalog" \? "Search courses or professors"/);
  assert.match(search, /function HomeSearch\(\{ scope = "all" \}/);
});

test("catalog professor results match names only, without department or course matches", () => {
  const search = read("features/home/HomeSearch.tsx");
  assert.match(search, /const professorSearchFields = scope === "catalog"\s*\? \[professor\.name\]/);
  assert.match(search, /getMatchScore\(query, professor\.name, professorSearchFields\)/);
  assert.match(search, /\[query, materialState\.materials, scope\]/);
  // Broad department and course matching remains available to the original homepage.
  assert.match(search, /professor\.id, professor\.department, professor\.displayDepartment/);
  assert.match(search, /professor\.filterDepartment, professor\.course/);
});

test("retired personalized homepage modules are still removed", () => {
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

test("course directory redirects while individual courses remain accessible", () => {
  const directoryPage = read("app/courses/page.tsx");
  assert.match(directoryPage, /redirect\("\/homepagenew"\)/);
  assert.doesNotMatch(directoryPage, /<Courses\b/);

  const coursePage = read("app/courses/[slug]/page.tsx");
  assert.match(coursePage, /<Courses courseSlug=\{slug\}/);
  const search = read("features/home/HomeSearch.tsx");
  assert.match(search, /"\/courses\/" \+ encodeURIComponent\(slug\(code\)\)/);

  const header = read("components/Header.tsx");
  const footer = read("components/Footer.tsx");
  assert.doesNotMatch(header, /href:\s*"\/courses"/);
  assert.doesNotMatch(footer, /href="\/courses"/);
});

test("the original homepage and its API are preserved", () => {
  assert.match(read("app/page.tsx"), /import Home from "\.\.\/features\/home\/Home"/);
  assert.match(read("features/home/Home.tsx"), /homepage-overview/);
  assert.equal(exists("app/api/homepage-overview/route.ts"), true);
  assert.equal(exists("features/home/home.css"), true);
  assert.equal(exists("features/home/HomeSearch.tsx"), true);
});
