import type { Metadata } from "next";
import LegalAccordion from "../../features/legal/LegalAccordion";
import { termsMarkup } from "../../features/legal/termsContent";
import "../../features/legal/terms.css";

export const metadata: Metadata = { title: "Terms of Service | AUC Atlas" };

export default function TermsPage() {
  return (
    <>
      <main className="info-page" dangerouslySetInnerHTML={{ __html: termsMarkup }} />
      <LegalAccordion />
    </>
  );
}
