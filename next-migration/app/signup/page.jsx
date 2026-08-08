import Link from "next/link";

export const metadata = {
  title: "Sign Up",
  description: "Create an AUC Atlas account with your AUC email."
};

export default function SignupPage() {
  return (
    <main className="auth-page-shell">
      <section className="auth-card">
        <p className="section-kicker">Create account</p>
        <h1>Start with your AUC email.</h1>
        <p>
          A verified account keeps materials, reviews, degree progress, and
          student-only tools connected to the right community.
        </p>

        <form className="auth-form">
          <label>
            <span>Full name</span>
            <input type="text" placeholder="Your name" />
          </label>

          <label>
            <span>AUC email</span>
            <input type="email" placeholder="name@aucegypt.edu" />
          </label>

          <label>
            <span>Password</span>
            <input type="password" placeholder="Create a password" />
          </label>

          <button type="button">Create account</button>
        </form>

        <div className="auth-switch">
          <span>Already have an account?</span>
          <Link href="/login">Log in</Link>
        </div>
      </section>
    </main>
  );
}
