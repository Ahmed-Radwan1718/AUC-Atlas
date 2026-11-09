import Courses from "../../../features/courses/Courses";

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return <Courses courseSlug={slug} />;
}
