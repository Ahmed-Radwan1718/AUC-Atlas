import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "AUC Atlas",
  robots: { index: false, follow: false },
};

// This experimental homepage is intentionally blank.
// The original homepage at / remains unchanged.
export default function NewHomePage() {
  return <main style={{ minHeight: "100dvh" }} />;
}
