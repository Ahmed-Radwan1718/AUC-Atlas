import type { Metadata } from "next";
import { AuthPageShell } from "@/components/auth/AuthPageShell";
import { LoginForm } from "@/components/auth/LoginForm";

export const metadata: Metadata = {
  title: "Log In - AUC Atlas",
};

export default function LoginPage() {
  return (
    <AuthPageShell
      title="Log In"
      intro="Log in to manage your AUC Atlas profile, saved professors, course materials, and student reviews."
    >
      <LoginForm />
    </AuthPageShell>
  );
}
