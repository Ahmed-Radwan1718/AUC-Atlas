import type { MetadataRoute } from "next";
import { courses } from "../data/courses";
import { professors } from "../data/professors";

// Production canonical URLs; legacy *.html routes and pages absent from v2
// must not be advertised as live URLs to search engines.
const ORIGIN = "https://aucatlas.com";
const publicPages = [
  "/",
  "/professors",
  "/courses",
  "/gpa-calculator",
  "/degree-progression",
  "/faq",
  "/privacy",
  "/terms",
] as const;

function courseSlug(code: string): string {
  // This matches the canonicalSlug/getCourseSlug logic used by the course UI.
  return code.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

export default function sitemap(): MetadataRoute.Sitemap {
  const urls = new Set<string>(publicPages);

  // Professor IDs are the actual /professors/[slug] route parameters.
  for (const professor of professors) {
    if (professor.id) urls.add("/professors/" + encodeURIComponent(professor.id));
  }

  // Several catalog entries share the same course code: publish each
  // canonical course URL once, not multiple duplicate sitemap entries.
  for (const course of courses) {
    const slug = courseSlug(course.code);
    if (slug) urls.add("/courses/" + encodeURIComponent(slug));
  }

  return Array.from(urls, path => ({
    url: ORIGIN + path,
  }));
}
