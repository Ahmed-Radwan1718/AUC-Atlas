import type { ReactNode } from "react";

type AuthPageShellProps = {
  title: string;
  intro: string;
  eyebrow?: string;
  children: ReactNode;
};

export function AuthPageShell({
  title,
  intro,
  eyebrow,
  children,
}: AuthPageShellProps) {
  return (
    <main className="auth-page">
      <section className="auth-section">
        <div className="auth-section-inner">
          <div className="auth-section-header">
            {eyebrow ? <p className="auth-section-eyebrow">{eyebrow}</p> : null}
            <h1 className="auth-section-title">{title}</h1>
            <p className="auth-section-intro">{intro}</p>
          </div>

          <div className="auth-panel">{children}</div>
        </div>
      </section>
    </main>
  );
}
