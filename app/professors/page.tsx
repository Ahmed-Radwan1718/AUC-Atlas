import type { Metadata } from "next";
import { ProfessorsDirectory } from "@/components/professors/ProfessorsDirectory";
import "./professors.css";

export const metadata: Metadata = {
  title: "Professors | AUC Atlas",
};

export default function ProfessorsPage() {
  return <ProfessorsDirectory />;
}
