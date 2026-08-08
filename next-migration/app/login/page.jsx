import Link from "next/link";

export const metadata = {
  title: "Login",
  description: "Log in to AUC Atlas with your verified AUC student account."
};

export default function LoginPage() {
  return (
    <main className="auth-page-shell">
      <section className="auth-card">
        <p className="section-kicker">Account access</p>
        <h1>Log in to AUC Atlas.</h1>
        <p>
          Access course materials, degree progress, account settings, saved
          history, and student-only features.
        </p>

        <form className="auth-form">
          <label>
            <span>Email</span>
            <input type="email" placeholder="name@aucegypt.edu" />
          </label>

          <label>
            <span>Password</span>
            <input type="password" placeholder="Enter your password" />
          </label>

          <button type="button">Log in</button>
        </form>

        <div className="auth-switch">
          <span>New to AUC Atlas?</span>
          <Link href="/signup">Create account</Link>
        </div>
      </section>
    </main>
  );
}
