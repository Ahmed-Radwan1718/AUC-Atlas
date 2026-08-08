import Link from "next/link";

export const metadata = {
  title: "Privacy Notice"
};

export default function PrivacyPage() {
  return (
    <main className="legal-page-shell">
      <section className="legal-hero">
        <div>
          <p className="section-kicker">Privacy</p>
          <h1>Privacy Notice</h1>
          <p className="legal-meta">Last updated: August 7, 2026.</p>
        </div>
        <p>
          This notice explains how AUC Atlas handles account data, reviews,
          uploads, reports, academic tools, and technical security information.
        </p>
      </section>

      <section className="legal-document">
        <article className="legal-section">
          <h2>1. About This Privacy Notice</h2>
          <p>
            This Privacy Notice explains how personal data is processed when you
            visit or use AUC Atlas, including accounts, professor reviews, course
            materials, reports, academic tools, support messages, and security
            features.
          </p>
          <p>
            AUC Atlas is operated from the Arab Republic of Egypt and is intended
            to comply with applicable Egyptian personal-data protection law.
          </p>
        </article>

        <article className="legal-section">
          <h2>2. Privacy Contact</h2>
          <p>
            AUC Atlas is operated personally by Ahmed Hazem Radwan. Privacy
            requests, questions, complaints, or data-rights requests may be sent
            to ahmedradwan21@gmail.com.
          </p>
        </article>

        <article className="legal-section">
          <h2>3. Personal Data We Collect</h2>
          <p>Depending on how you use AUC Atlas, processed data may include:</p>
          <ul>
            <li>Account identifiers, names, AUC email addresses, student IDs, telephone numbers, majors, and profile photos.</li>
            <li>Authentication, session, two-factor authentication, login, browser, device, IP address, and security information.</li>
            <li>Professor reviews, ratings, comments, course links, semesters, reports, uploads, and saved academic-progress data.</li>
            <li>Course-material files and metadata such as title, course code, professor, file type, upload time, and moderation status.</li>
            <li>Messages and information you voluntarily provide when contacting AUC Atlas.</li>
          </ul>
        </article>

        <article className="legal-section">
          <h2>4. Accounts and Authentication</h2>
          <p>
            When you create or maintain an account, AUC Atlas may process your
            account details, verification status, authentication provider, account
            timestamps, security settings, and session information.
          </p>
          <p>
            If you use Google, GitHub, Facebook, or another supported sign-in
            provider, AUC Atlas may receive information made available by that
            provider according to the permissions you use.
          </p>
        </article>

        <article className="legal-section">
          <h2>5. Reviews, Uploads, and Anonymous Features</h2>
          <p>
            Reviews and uploads may include public content such as ratings,
            comments, course codes, semesters, file titles, upload metadata, and
            display names or profile photos when a submission is not anonymous.
          </p>
          <p>
            If an anonymous option is used, AUC Atlas is designed not to display
            your public identity with that submission. Internal identifiers may
            still be retained for moderation, deletion controls, security, abuse
            prevention, and legal compliance.
          </p>
        </article>

        <article className="legal-section">
          <h2>6. Why We Process Data</h2>
          <ul>
            <li>To create, verify, secure, manage, and delete accounts.</li>
            <li>To provide professor reviews, course materials, GPA tools, degree-progress tools, search, reports, and saved account features.</li>
            <li>To moderate content, prevent spam and abuse, enforce rules, investigate security events, and protect users.</li>
            <li>To maintain, debug, improve, and measure basic use of AUC Atlas.</li>
            <li>To comply with legal duties and establish, exercise, or defend legal rights.</li>
          </ul>
        </article>

        <article className="legal-section">
          <h2>7. Cookies and Browser Storage</h2>
          <p>
            AUC Atlas may use cookies, local storage, session storage, and similar
            technologies for authentication, security, preferences, visitor
            counting, login challenges, and site functionality.
          </p>
        </article>

        <article className="legal-section">
          <h2>8. Service Providers and Recipients</h2>
          <p>
            Personal data may be handled by infrastructure and service providers
            used for hosting, authentication, databases, storage, email, image
            delivery, security, analytics, or moderation. Public submissions may
            also be visible to other users according to the feature used.
          </p>
        </article>

        <article className="legal-section">
          <h2>9. Data Rights and Deletion</h2>
          <p>
            You may contact AUC Atlas to request access, correction, deletion,
            objection, or other privacy actions available under applicable law.
            Some information may be retained where necessary for security,
            moderation, legal compliance, dispute handling, backups, or abuse
            prevention.
          </p>
        </article>

        <article className="legal-section">
          <h2>10. Related Terms</h2>
          <p>
            This Privacy Notice should be read together with the{" "}
            <Link href="/terms">Terms of Service</Link>.
          </p>
        </article>
      </section>
    </main>
  );
}
