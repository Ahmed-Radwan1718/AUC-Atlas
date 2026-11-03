import type { Metadata } from "next";
import { GpaCalculator } from "@/components/gpa/GpaCalculator";
import "./gpa-calculator.css";

export const metadata: Metadata = {
  title: "GPA Calculator | AUC Atlas",
};

export default function GpaCalculatorPage() {
  return <GpaCalculator />;
}
