"use client";

import { useState } from "react";

const faqItems = [
  {
    id: 1,
    question: "What is AUC Atlas?",
    answer:
      "AUC Atlas is a student-focused website for browsing professors, courses, GPA tools, and student-uploaded academic materials in one place.",
  },
  {
    id: 2,
    question: "Is AUC Atlas officially affiliated with AUC?",
    answer:
      "No. AUC Atlas is an independent student resource and is not an official American University in Cairo website.",
  },
  {
    id: 3,
    question: "How do course material uploads work?",
    answer:
      "When materials are uploaded, they can be tied to a course, professor, and semester. Uploaded files may be reviewed, organized, removed, or hidden if they are unsafe, irrelevant, inaccurate, or not allowed.",
  },
  {
    id: 4,
    question: "What should I upload?",
    answer:
      "Upload useful course materials such as notes, review sheets, slides, summaries, practice questions, or study files that you have permission to share.",
  },
  {
    id: 5,
    question: "What should I not upload?",
    answer:
      "Do not upload copyrighted books, paid materials, private messages, exams that are not allowed to be shared, personal data, malware, or anything you do not have permission to distribute.",
  },
  {
    id: 6,
    question: "Can materials be removed?",
    answer:
      "Yes. AUC Atlas may remove files or information if they are reported, inaccurate, harmful, private, copyrighted, spam, or otherwise unsuitable for the site.",
  },
];

export default function FaqAccordion() {
  const [openItems, setOpenItems] = useState([]);

  function toggleItem(id) {
    setOpenItems((currentItems) =>
      currentItems.includes(id)
        ? currentItems.filter((itemId) => itemId !== id)
        : [...currentItems, id]
    );
  }

  return (
    <section className="info-list" aria-label="Frequently asked questions">
      {faqItems.map((item) => {
        const isOpen = openItems.includes(item.id);
        const answerId = `faq-answer-${item.id}`;

        return (
          <article
            className={`info-item${isOpen ? " open" : ""}`}
            key={item.id}
          >
            <h2>
              <button
                className="info-toggle"
                type="button"
                aria-expanded={isOpen}
                aria-controls={answerId}
                onClick={() => toggleItem(item.id)}
              >
                <span>{item.question}</span>
                <span className="info-toggle-icon" aria-hidden="true" />
              </button>
            </h2>

            <div className="info-answer" id={answerId}>
              <p>{item.answer}</p>
            </div>
          </article>
        );
      })}

      <article
        className={`info-item${openItems.includes(7) ? " open" : ""}`}
      >
        <h2>
          <button
            className="info-toggle"
            type="button"
            aria-expanded={openItems.includes(7)}
            aria-controls="faq-answer-7"
            onClick={() => toggleItem(7)}
          >
            <span>Where can I read the rules?</span>
            <span className="info-toggle-icon" aria-hidden="true" />
          </button>
        </h2>

        <div className="info-answer" id="faq-answer-7">
          <p>
            Read the <a href="terms.html">Terms of Service</a> and{" "}
            <a href="privacy.html">Privacy Policy</a> for more details.
          </p>
        </div>
      </article>
    </section>
  );
}
