import type { Metadata } from "next";
import HomeTest from "./HomeTest";

export const metadata: Metadata = {
  title: "Homepage Concept | AUC Atlas",
  description: "An isolated homepage redesign preview for AUC Atlas.",
  robots: { index: false, follow: false },
};

export default function HomeTestPage() {
  return <HomeTest />;
}
