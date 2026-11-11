import type { Metadata } from "next";
import MaterialsDirectory from "../../features/courses/MaterialsDirectory";

export const metadata: Metadata = {
  title: "Study Materials | AUC Atlas",
  description: "Browse past exams, notes, slides, practice sheets, and student-shared AUC study materials."
};

export default function Page() {
  return <MaterialsDirectory />;
}
