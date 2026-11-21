"use client";

import { useState } from "react";
import NewHomepageCourses from "./NewHomepageCourses";
import NextSemesterProfessorsPreview from "./NextSemesterProfessorsPreview";

/**
 * Keeps the next-semester professor preview in sync with the semester
 * currently being explored in Your Courses. This does not update a
 * student's saved enrollment term or degree progress.
 */
export default function NewHomepageAcademicSections() {
  const [viewingSemester, setViewingSemester] = useState<number | null>(null);
  return (
    <>
      <NewHomepageCourses onSemesterSelect={setViewingSemester} />
      <NextSemesterProfessorsPreview viewingSemester={viewingSemester} />
    </>
  );
}
