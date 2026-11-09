import { courses } from "../../data/courses";
import { initializeCatalog, normalizeCourseCode } from "./courseDiscovery";
import { renderCourseDetail } from "./courseDetail";
import { setupCourseUploadStart } from "./materialUploadDialog";

function canonicalSlug(value: string) {
  return value.trim().toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-+|-+$/g,"");
}
export function initializeCourses(courseSlug = ""): void {
  const root = document.getElementById("courses-list-view");
  if(!root || root.dataset.atlasCoursesInitialized === "true") return;
  root.dataset.atlasCoursesInitialized = "true";

  setupCourseUploadStart();

  const legacy = new URLSearchParams(window.location.search).get("course");
  const slug = courseSlug || (legacy ? canonicalSlug(legacy) : "");
  const selected = slug ? courses.find(course => canonicalSlug(course.code) === slug) : null;
  const requested = selected ? normalizeCourseCode(selected.code) : slug
    ? normalizeCourseCode(slug.replace(/-/g," ")) : "";
  if(requested && renderCourseDetail(requested)) return;

  initializeCatalog();
}
