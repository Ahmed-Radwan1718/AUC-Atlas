import type { Metadata } from "next";
import { DegreeProgression } from "@/components/degree/DegreeProgression";
import "./degree-progression.css";

export const metadata: Metadata = {
  title: "My Account | AUC Atlas",
};

export default function DegreeProgressionPage() {
  return <DegreeProgression />;
}
