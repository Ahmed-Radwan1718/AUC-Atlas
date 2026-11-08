"use client";
import { Fragment, useState } from "react";
import { faqItems } from "./faqData";
import styles from "./faq.module.css";

export default function FaqAccordion() {
  const [expandedIds, setExpandedIds] = useState<ReadonlySet<string>>(() => new Set());
  function toggle(id: string) {
    setExpandedIds((previous) => {
      const next = new Set(previous);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }
  return (
    <section className={styles["info-list"]} aria-label="Frequently asked questions">
      {faqItems.map(({ id, question, answer }) => {
        const isOpen = expandedIds.has(id);
        return (
          <article key={id} className={`${styles["info-item"]} ${isOpen ? styles.open : ""}`}>
            <h2>
              <button
                className={styles["info-toggle"]}
                type="button"
                aria-expanded={isOpen}
                aria-controls={id}
                onClick={() => toggle(id)}
              >
                <span>{question}</span>
                <span className={styles["info-toggle-icon"]} aria-hidden="true" />
              </button>
            </h2>
            <div
              id={id}
              className={`${styles["info-answer"]} ${isOpen ? styles.expanded : ""}`}
              aria-hidden={!isOpen}
              inert={!isOpen}
            >
              <div className={styles["answer-content"]}>
                <p>
                  {answer.map((part, index) =>
                    part.type === "link" ? (
                      <a key={index} href={part.href}>{part.text}</a>
                    ) : (
                      <Fragment key={index}>{part.text}</Fragment>
                    )
                  )}
                </p>
              </div>
            </div>
          </article>
        );
      })}
    </section>
  );
}
