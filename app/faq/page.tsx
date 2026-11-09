import type { Metadata } from "next";
import FaqAccordion from "../../features/faq/FaqAccordion";
import { faqMarkup } from "../../features/faq/faqContent";
import "../../features/faq/faq.css";

export const metadata: Metadata = {
  title: "FAQ | AUC Atlas",
  description: "Answers to common AUC Atlas questions about professors, reviews, course materials, GPA, degree planning, accounts, and privacy.",
};

export default function FaqPage() {
  return (
    <>
      <main className="faq-page" dangerouslySetInnerHTML={{ __html: faqMarkup }} />
      <FaqAccordion />
    </>
  );
}
