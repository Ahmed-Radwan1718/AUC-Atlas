import type { Metadata } from "next";
import FaqAccordion from "./FaqAccordion";
import styles from "./faq.module.css";
export const metadata: Metadata = {
  title: "FAQ",
  description: "Answers to common questions about AUC Atlas, professor reviews, course materials, GPA planning, and privacy.",
};
export default function FaqPage() {
  return (
    <main className={styles["info-page"]}>
      <div className={styles["info-inner"]}>
        <section className={styles["info-header"]}>
          <p className={styles["info-kicker"]}>Frequently Asked Questions</p>
          <h1>FAQ</h1>
          <p>A practical overview of common AUC Atlas questions, written to help students use the site clearly and responsibly.</p>
        </section>
        <FaqAccordion />
      </div>
    </main>
  );
}
