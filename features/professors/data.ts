import professorRecords from "@/data/professors.json";
import type { Professor } from "@/lib/types";

const PROFESSOR_NAME_OVERRIDES: Record<string, string> = {
  "h-rizzo": "Helen Rizzo",
};

export function normalizeProfessorId(value: unknown) {
  return String(value || "")
    .toLowerCase()
    .trim()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export const professors = (professorRecords as Professor[]).map((professor) => {
  const id = normalizeProfessorId(professor.id || professor.name);
  const name = PROFESSOR_NAME_OVERRIDES[id];

  return name ? { ...professor, name } : professor;
});

export function getProfessorById(id: string) {
  const normalizedId = normalizeProfessorId(id);

  return (
    professors.find(
      (professor) => normalizeProfessorId(professor.id || professor.name) === normalizedId,
    ) || null
  );
}
