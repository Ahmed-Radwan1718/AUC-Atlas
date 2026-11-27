import Courses from "../../../features/courses/Courses";
import { courses } from "../../../data/courses";

// Pre-render the public catalog at build time. Keep the existing fallback for
// non-canonical and unknown slugs; protected materials still load via the API.
export function generateStaticParams(): { slug: string }[] {
  const slugs = new Set(courses.map(course => course.code.trim().toLowerCase()
    .replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "")).filter(Boolean));
  return Array.from(slugs, slug => ({ slug }));
}

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return <Courses courseSlug={slug} />;
}
