export const metadata = {
  title: "Account",
  description: "Manage your AUC Atlas profile, security, reviews, uploads, and academic progress."
};

const accountSections = [
  {
    title: "Profile",
    copy: "Name, major, photo, and student profile details."
  },
  {
    title: "Security",
    copy: "Password, sessions, recovery, and two-factor authentication."
  },
  {
    title: "Activity History",
    copy: "Reviews, course materials, reports, and account actions."
  },
  {
    title: "Degree Progress",
    copy: "Saved academic progress and requirement tracking."
  }
];

export default function AccountPage() {
  return (
    <main className="tool-page-shell">
      <section className="tool-hero">
        <div>
          <p className="section-kicker">My Account</p>
          <h1>One place for your student profile.</h1>
        </div>

        <p>
          This replacement account page keeps the old account areas but puts
          them into one consistent dashboard surface.
        </p>
      </section>

      <section className="account-section-grid">
        {accountSections.map((section) => (
          <article className="account-section-card" key={section.title}>
            <span>{section.title}</span>
            <h2>{section.title}</h2>
            <p>{section.copy}</p>
          </article>
        ))}
      </section>
    </main>
  );
}
