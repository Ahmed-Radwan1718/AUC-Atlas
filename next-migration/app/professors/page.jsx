import ProfessorsBrowser from "./ProfessorsBrowser";

export const metadata = {
  title: "Professors",
  description: "Browse AUC professor profiles, departments, ratings, and student review context."
};

export default function ProfessorsPage() {
  return <ProfessorsBrowser />;
}
