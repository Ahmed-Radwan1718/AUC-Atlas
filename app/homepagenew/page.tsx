import type { Metadata } from "next";
import "./homepagenew.css";

export const metadata: Metadata = {
  title: "AUC Atlas",
  robots: { index: false, follow: false },
};

// Layout-only examples. Replace these with personalized course recommendations later.
// Add an image URL to a course when its own uploaded cover is available.
const exampleCourses: { code: string; title: string; image?: string }[] = [
  { code: "MENG 3601", title: "Fundamentals of Thermodynamics" },
  { code: "MENG 3207", title: "Engineering Materials" },
  { code: "ENGR 3202", title: "Engineering Analysis and Computation I" },
  { code: "MACT 3224", title: "Probability and Statistics" },
];

function courseLink(code: string) {
  const slug = code.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  return "/courses/" + slug;
}

export default function NewHomePage() {
  return (
    <main className="homepagenew-main">
      <section className="homepagenew-courses" aria-labelledby="homepagenew-courses-title">
        <div className="homepagenew-courses-heading">
          <h1 id="homepagenew-courses-title">Your Courses</h1>
          <span className="homepagenew-courses-preview">Example courses</span>
        </div>

        <div className="homepagenew-courses-grid">
          {exampleCourses.map(course => (
            <a className="homepagenew-course-card" href={courseLink(course.code)} key={course.code}>
              <div className="homepagenew-course-cover" aria-hidden="true">
                {course.image && <img src={course.image} alt="" loading="lazy" />}
              </div>
              <div className="homepagenew-course-info">
                <span className="homepagenew-course-code">{course.code}</span>
                <span className="homepagenew-course-name">{course.title}</span>
              </div>
            </a>
          ))}
        </div>
      </section>
    </main>
  );
}
