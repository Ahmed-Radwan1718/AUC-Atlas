import Link from "next/link";

export const metadata = {
  title: "Terms of Service"
};

export default function TermsPage() {
  return (
    <main className="legal-page-shell">
      <section className="legal-hero">
        <div>
          <p className="section-kicker">Terms</p>
          <h1>Terms of Service</h1>
          <p className="legal-meta">Last updated: August 7, 2026.</p>
        </div>
        <p>
          These terms govern use of AUC Atlas, including accounts, professor
          reviews, course materials, GPA tools, degree-progress tools, reports,
          uploads, downloads, and related features.
        </p>
      </section>

      <section className="legal-document">
        <article className="legal-section">
          <h2>1. Acceptance</h2>
          <p>
            By accessing AUC Atlas, creating an account, submitting a review,
            uploading or downloading material, saving academic information, or
            using any feature of the service, you agree to these Terms.
          </p>
          <p>If you do not agree to these Terms, you must not use AUC Atlas.</p>
        </article>

        <article className="legal-section">
          <h2>2. Independent Student Resource</h2>
          <p>
            AUC Atlas is an independent student-oriented platform. It is not
            owned, operated, sponsored, endorsed, approved, or controlled by The
            American University in Cairo.
          </p>
          <p>
            Nothing on AUC Atlas is an official academic decision, university
            policy, registration instruction, or guarantee.
          </p>
        </article>

        <article className="legal-section">
          <h2>3. Accounts and Eligibility</h2>
          <p>
            If you create an account, you must provide accurate information where
            reasonably required, protect your credentials, and prevent
            unauthorized access to your account.
          </p>
          <p>
            You must not sell, transfer, borrow, steal, share, or misuse another
            person's account, university email address, authentication code, or
            session.
          </p>
        </article>

        <article className="legal-section">
          <h2>4. Academic Information</h2>
          <p>
            AUC Atlas may display course descriptions, professor information,
            reviews, ratings, academic requirements, uploaded material, and other
            student or public information.
          </p>
          <p>
            Academic information can change or contain errors. Always verify
            registration, prerequisites, graduation requirements, deadlines, and
            official academic decisions through AUC's official systems and your
            academic advisor.
          </p>
        </article>

        <article className="legal-section">
          <h2>5. GPA and Degree Tools</h2>
          <p>
            GPA and degree-progression tools are planning aids only. They are not
            official GPA records, transcripts, degree audits, or graduation
            eligibility decisions.
          </p>
        </article>

        <article className="legal-section">
          <h2>6. Reviews and Community Content</h2>
          <p>
            Professor reviews and ratings reflect individual user experiences and
            opinions. AUC Atlas does not guarantee that every review is complete,
            representative, current, or factually correct.
          </p>
          <ul>
            <li>Keep reviews factual and based on your own academic experience.</li>
            <li>Do not harass, threaten, impersonate, defame, or publish private information.</li>
            <li>Do not manipulate ratings through fake accounts, automation, payment, retaliation, or coordinated abuse.</li>
          </ul>
        </article>

        <article className="legal-section">
          <h2>7. Course Materials and Copyright</h2>
          <p>
            You may upload educational material only when you own the necessary
            rights, have permission, or otherwise have a lawful basis to share it.
          </p>
          <ul>
            <li>Do not upload copyrighted textbooks, paid course packs, stolen files, malware, or restricted university material.</li>
            <li>Do not upload confidential exams, answer keys, assessment material, or anything intended to facilitate cheating.</li>
            <li>Remove unnecessary personal information before uploading files.</li>
          </ul>
        </article>

        <article className="legal-section">
          <h2>8. User Content License</h2>
          <p>
            You remain responsible for content you submit. By submitting content,
            you grant AUC Atlas a non-exclusive, royalty-free license to host,
            store, display, moderate, back up, deliver, and use that content only
            as reasonably necessary to operate and protect the service.
          </p>
        </article>

        <article className="legal-section">
          <h2>9. Prohibited Use and Security</h2>
          <ul>
            <li>Do not attempt unauthorized access to accounts, APIs, databases, files, admin functions, or protected systems.</li>
            <li>Do not introduce malware, abuse rate limits, scrape unlawfully, disrupt service availability, or exploit vulnerabilities.</li>
            <li>Do not use AUC Atlas for phishing, credential theft, fraud, harassment, extortion, or other unlawful conduct.</li>
          </ul>
        </article>

        <article className="legal-section">
          <h2>10. Moderation and Removal</h2>
          <p>
            AUC Atlas may review, reject, remove, hide, restrict, preserve, or
            investigate content where reasonably necessary to enforce these Terms,
            protect users, address reports, comply with law, reduce legal risk, or
            protect service security.
          </p>
        </article>

        <article className="legal-section">
          <h2>11. Service Availability</h2>
          <p>
            AUC Atlas may add, modify, redesign, restrict, suspend, discontinue,
            or replace features. The service does not guarantee uninterrupted
            availability, permanent access to files, compatibility with every
            device, or immediate correction of every error.
          </p>
        </article>

        <article className="legal-section">
          <h2>12. Privacy</h2>
          <p>
            Personal-data processing is governed by the{" "}
            <Link href="/privacy">Privacy Notice</Link>.
          </p>
        </article>
      </section>
    </main>
  );
}
