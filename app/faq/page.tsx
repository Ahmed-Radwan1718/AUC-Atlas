import type { Metadata } from "next";
import { LegacyInfoPage } from "@/components/info/LegacyInfoPage";
import { getLegacyInfoPage } from "@/lib/legacy/info-pages";

export const metadata: Metadata = {
  title: "FAQ | AUC Atlas",
};

export default async function FaqPage() {
  const html = await getLegacyInfoPage("faq.html");
  return <LegacyInfoPage html={html} />;
}
