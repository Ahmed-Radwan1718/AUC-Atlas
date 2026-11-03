import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CourseDetail } from "@/components/courses/CourseDetail";
import { getCourseBySlug } from "@/features/courses/data";
import "../courses.css";
import "./course-detail.css";

type CourseDetailPageProps = {
  params: Promise<{ id: string }>;
};

function readCourseSlug(value: string) {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

export async function generateMetadata({ params }: CourseDetailPageProps): Promise<Metadata> {
  const { id } = await params;
  const course = getCourseBySlug(readCourseSlug(id));

  if (!course) {
    return { title: "Course Not Found - AUC Atlas" };
  }

  return {
    title: `${course.code} | AUC Atlas`,
    description:
      course.description ||
      `View ${course.code} ${course.title}, prerequisites, professors, and course materials on AUC Atlas.`,
  };
}

export default async function CourseDetailPage({ params }: CourseDetailPageProps) {
  const { id } = await params;
  const course = getCourseBySlug(readCourseSlug(id));

  if (!course) notFound();

  return <CourseDetail course={course} />;
}
