import type { Metadata } from "next";
import { AuthPageShell } from "@/components/auth/AuthPageShell";
import { ForgotPasswordForm } from "@/components/auth/ForgotPasswordForm";

export const metadata: Metadata = {
  title: "Forgot Password - AUC Atlas",
};

export default function ForgotPasswordPage() {
  return (
    <AuthPageShell
      eyebrow="Account Recovery"
      title="Forgot Password"
      intro="Enter your account email address and we will send you a password reset link."
    >
      <ForgotPasswordForm />
    </AuthPageShell>
  );
}
