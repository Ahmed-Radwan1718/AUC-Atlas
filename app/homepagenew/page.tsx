import type { Metadata } from "next";
import NewHomepageAcademicSections from "../../features/home/NewHomepageAcademicSections";
import NewHomepageMaterials from "../../features/home/NewHomepageMaterials";
import "./homepagenew.css";

export const metadata: Metadata = {
  title: "AUC Atlas",
  robots: { index: false, follow: false },
};

export default function NewHomePage() {
  return (
    <main className="homepagenew-main">
      <NewHomepageAcademicSections />
      <NewHomepageMaterials />
    </main>
  );
}
