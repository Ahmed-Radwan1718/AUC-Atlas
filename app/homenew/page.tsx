import type { Metadata } from "next";
import HomeNew from "../../features/home/HomeNew";

// This is an opt-in concept preview, not a replacement for the main homepage.
export const metadata: Metadata = {
  title: "AUC Atlas | Search-first homepage preview",
  description: "Find AUC course materials and professor reviews in one search.",
  robots: { index: false, follow: false }
};

export default function HomeNewPage() {
  return <HomeNew />;
}
