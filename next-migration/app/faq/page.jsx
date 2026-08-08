import Link from "next/link";

export const metadata = {
  title: "FAQ"
};

const questions = [
  {
    question: "What can I use AUC Atlas for?",
    answer: <>Browse professors and courses, read student reviews, find shared course materials, calculate GPA, track degree progress, and search across student resources in one place.</>
  },
  {
    question: "Is AUC Atlas an official AUC website?",
    answer: <>No. AUC Atlas is an independent student resource and is not operated by or officially affiliated with The American University in Cairo.</>
  },
  {
    question: "Do I need an account to use the site?",
    answer: <>You can browse many parts without an account. Features tied to identity or saved activity, such as reviews, uploads, reports, and saved progress, may require sign-in.</>
  },
  {
    question: "How should I use professor reviews?",
    answer: <>Use reviews as one source of information, not as a final verdict. Teaching style, workload, grading, attendance, and course structure can vary by semester and student.</>
  },
  {
    question: "What course materials can I upload?",
    answer: <>Upload useful academic resources that you have permission to share, such as your own notes, summaries, review sheets, study guides, and practice material.</>
  },
  {
    question: "What should I never upload?",
    answer: <>Do not upload copyrighted books, paid material, private messages, personal information, malware, restricted exams, or files you do not have permission to distribute.</>
  },
  {
    question: "Are the GPA calculator results official?",
    answer: <>No. The GPA calculator is a planning tool. Your official GPA is the one recorded by AUC.</>
  },
  {
    question: "Can I rely on the degree progression tracker for graduation?",
    answer: <>Use it as a planning aid, not as an official degree audit. Confirm graduation requirements through official AUC records and your academic advisor.</>
  },
  {
    question: "Where can I find the full rules?",
    answer: <>Read the <Link href="/terms">Terms of Service</Link> and <Link href="/privacy">Privacy Notice</Link>.</>
  }
];

export default function FaqPage() {
  return (
    <main className="content-page-shell">
      <section className="content-hero">
        <div>
          <p className="section-kicker">Help center</p>
          <h1>FAQ</h1>
        </div>
        <p>Answers to the questions students are most likely to have while using AUC Atlas.</p>
      </section>

      <section className="content-list" aria-label="Frequently asked questions">
        {questions.map((item) => (
          <details className="content-card content-details" key={item.question}>
            <summary>
              <span>{item.question}</span>
              <span aria-hidden="true">+</span>
            </summary>
            <div className="content-answer">
              <p>{item.answer}</p>
            </div>
          </details>
        ))}
      </section>
    </main>
  );
}
