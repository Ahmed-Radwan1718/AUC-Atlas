import type { Metadata } from "next";
import { LegacyInfoPage } from "@/components/info/LegacyInfoPage";
import { getLegacyInfoPage } from "@/lib/legacy/info-pages";

export const metadata: Metadata = {
  title: "Privacy Notice | AUC Atlas",
};

export default async function PrivacyPage() {
  const html = await getLegacyInfoPage("privacy.html");
  return <LegacyInfoPage html={html} />;
}
