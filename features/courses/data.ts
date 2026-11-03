import courseRecords from "@/data/courses.json";
import type { Course } from "@/lib/types";

export const courses = courseRecords as Course[];

export function normalizeCourseCode(value: unknown) {
  return String(value || "").replace(/\s+/g, " ").trim().toUpperCase();
}

export function getCourseSlug(value: unknown) {
  return normalizeCourseCode(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function getCourseByCode(code: string) {
  const normalized = normalizeCourseCode(code);
  return courses.find((course) => normalizeCourseCode(course.code) === normalized) || null;
}

export function getCourseBySlug(slug: string) {
  const normalizedSlug = String(slug || "").trim().toLowerCase();
  return courses.find((course) => getCourseSlug(course.code) === normalizedSlug) || null;
}
