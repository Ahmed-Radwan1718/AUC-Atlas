import type { Metadata } from "next";
import { LegacyInfoPage } from "@/components/info/LegacyInfoPage";
import { getLegacyInfoPage } from "@/lib/legacy/info-pages";

export const metadata: Metadata = {
  title: "Terms of Service | AUC Atlas",
};

export default async function TermsPage() {
  const html = await getLegacyInfoPage("terms.html");
  return <LegacyInfoPage html={html} />;
}
