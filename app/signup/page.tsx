import type { Metadata } from "next";
import { AuthPageShell } from "@/components/auth/AuthPageShell";
import { SignupForm } from "@/components/auth/SignupForm";

export const metadata: Metadata = {
  title: "Create Account - AUC Atlas",
};

export default function SignupPage() {
  return (
    <AuthPageShell
      title="Create Account"
      intro="Create an account to save professors, manage course materials, and keep your AUC Atlas reviews in one place."
    >
      <SignupForm />
    </AuthPageShell>
  );
}
