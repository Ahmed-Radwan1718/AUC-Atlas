import type { Metadata } from "next";
import { CoursesDirectory } from "@/components/courses/CoursesDirectory";
import "./courses.css";

export const metadata: Metadata = {
  title: "Courses | AUC Atlas",
};

export default function CoursesPage() {
  return <CoursesDirectory />;
}
