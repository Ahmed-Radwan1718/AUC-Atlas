import { courseEntries } from "./course-entries";
import { courseDescriptions1 } from "./course-descriptions-1";
import { courseDescriptions2 } from "./course-descriptions-2";
import { courseDescriptions3 } from "./course-descriptions-3";
import { courseDescriptions4 } from "./course-descriptions-4";
import { courseDescriptions5 } from "./course-descriptions-5";
import { coursePrerequisites, subjectLabels } from "./course-meta";

export type Course = { code: string; title: string; description: string; prerequisite: string; subject: string; department: string; level: string };
const descriptions: Record<string,string> = { ...courseDescriptions1, ...courseDescriptions2, ...courseDescriptions3, ...courseDescriptions4, ...courseDescriptions5 };
export const courses: Course[] = courseEntries.map(([code, title]) => {
  const [subject, number = ""] = code.split(" ");
  return { code, title, description: descriptions[code] || "", prerequisite: coursePrerequisites[code] || "", subject, department: subjectLabels[subject] || subject, level: number.charAt(0) + "000 Level" };
});
