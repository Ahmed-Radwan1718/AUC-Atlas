import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "AUC Atlas",
  robots: { index: false, follow: false },
};

export default function NewHomePage() {
  return <main style={{ minHeight: "100dvh" }} />;
}
