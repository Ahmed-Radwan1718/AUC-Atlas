import type { Metadata } from "next";
import LegalAccordion from "../../features/legal/LegalAccordion";
import { privacyMarkup } from "../../features/legal/privacyContent";
import "../../features/legal/privacy.css";

export const metadata: Metadata = { title: "Privacy Notice | AUC Atlas" };

export default function PrivacyPage() {
  return (
    <>
      <main className="info-page" dangerouslySetInnerHTML={{ __html: privacyMarkup }} />
      <LegalAccordion translate />
    </>
  );
}
