import Script from "next/script";
import FaqAccordion from "./FaqAccordion";
import "./faq.css";

export const metadata = {
  title: "FAQ | AUC Atlas",
};

export default function FaqPage() {
  return (
    <>
      <div id="site-header-root" />
      <Script src="/site-header.js" strategy="afterInteractive" />

      <main className="info-page">
        <div className="info-inner">
          <section className="info-header">
            <p className="info-kicker">Frequently Asked Questions</p>
            <h1>FAQ</h1>
            <p>
              Quick answers about AUC Atlas, course pages, professor
              information, uploaded materials, and account features.
            </p>
          </section>

          <FaqAccordion />
        </div>
      </main>

      <div id="site-footer-root" />
    </>
  );
}
