import type { Metadata } from "next";
import HomeSearch from "../features/home/HomeSearch";
import DegreeProgressPreview from "./homepagenew/DegreeProgressPreview";
import SemesterPlanner from "./homepagenew/SemesterPlanner";
import "./homepagenew/homepagenew.css";

export const metadata: Metadata = {
  title: "AUC Atlas | Professors, Courses & Student Materials",
  alternates: { canonical: "https://aucatlas.com/" },
};

export default function HomePage() {
  return (
    <main className="new-homepage">
      <section className="new-homepage-hero" aria-labelledby="new-homepage-title">
        <h1 id="new-homepage-title">Get Started</h1>
        <HomeSearch scope="catalog" />
      </section>
      <DegreeProgressPreview />
      <SemesterPlanner />
    </main>
  );
}
