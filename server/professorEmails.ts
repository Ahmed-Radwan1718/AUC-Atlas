import { professors } from "../data/professors";

// AUC Atlas is student-only. Reuse the canonical professor records rather than
// maintaining a second list that would become outdated after faculty updates.
// This module is only imported by server-side authentication and session code.
const professorEmails = new Set(
  professors
    .map(professor => String(professor.email || "").trim().toLowerCase())
    .filter(Boolean)
);

export function isProfessorEmail(email: unknown): boolean {
  return professorEmails.has(String(email || "").trim().toLowerCase());
}

export function assertStudentAccountEmail(email: unknown): void {
  if (!isProfessorEmail(email)) return;

  throw Object.assign(
    new Error(
      "This email address is not eligible for an AUC Atlas student account. " +
      "If you believe this is a mistake, please contact support."
    ),
    { statusCode: 403, code: "student-email-ineligible" }
  );
}
