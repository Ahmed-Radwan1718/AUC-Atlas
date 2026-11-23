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
      <section className="new-homepage-hero" aria-labelledby="new-homepage-title">
        <h1 id="new-homepage-title">Get Started</h1>
        <HomeSearch scope="catalog" />
      </section>
      <DegreeProgressPreview />
    </main>
  );
}
