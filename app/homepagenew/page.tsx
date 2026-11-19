import type { Metadata } from "next";
import NewHomepageCourses from "../../features/home/NewHomepageCourses";
import NextSemesterProfessorsPreview from "../../features/home/NextSemesterProfessorsPreview";
import "./homepagenew.css";

export const metadata: Metadata = {
  title: "AUC Atlas",
  robots: { index: false, follow: false },
};

export default function NewHomePage() {
  return (
    <main className="homepagenew-main">
      <NewHomepageCourses />
      <NextSemesterProfessorsPreview />
    </main>
  );
}
