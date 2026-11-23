import type { Metadata } from "next";
import HomeSearch from "../../features/home/HomeSearch";
import DegreeProgressPreview from "./DegreeProgressPreview";
import "./homepagenew.css";

export const metadata: Metadata = {
  title: "Get Started | AUC Atlas",
  robots: { index: false, follow: false },
};

// The experimental homepage is isolated from the original homepage at /.
export default function NewHomePage() {
  return (
    <main className="new-homepage">
      <section className="new-homepage-hero" aria-label="Search courses and professors">
        <HomeSearch scope="catalog" />
      </section>
      <DegreeProgressPreview />
    </main>
  );
}
