import type { Metadata } from "next";
import HomeNew from "../../features/home/HomeNew";

// This is an opt-in concept preview, not a replacement for the main homepage.
export const metadata: Metadata = {
  title: "AUC Atlas | Cinematic 3D prototype",
  description: "Explore an experimental real-world 3D building scan and browse AUC majors, courses, and student materials.",
  robots: { index: false, follow: false }
};

export default function HomeNewPage() {
  return <HomeNew />;
}
