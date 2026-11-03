import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ProfessorProfile } from "@/components/professors/ProfessorProfile";
import { getProfessorById } from "@/features/professors/data";
import "../professors.css";
import "./professor-profile.css";
import "./review-stats-parity.css";

type ProfessorProfilePageProps = {
  params: Promise<{ id: string }>;
};

function readProfessorId(value: string) {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

export async function generateMetadata({
  params,
}: ProfessorProfilePageProps): Promise<Metadata> {
  const { id } = await params;
  const professor = getProfessorById(readProfessorId(id));

  if (!professor) {
    return { title: "Professor Not Found - AUC Atlas" };
  }

  return {
    title: `${professor.name} | AUC Atlas`,
    description:
      professor.bio ||
      `View ${professor.name}'s AUC Atlas profile, courses, ratings, and student reviews.`,
  };
}

export default async function ProfessorProfilePage({
  params,
}: ProfessorProfilePageProps) {
  const { id } = await params;
  const professor = getProfessorById(readProfessorId(id));

  if (!professor) notFound();

  return <ProfessorProfile professor={professor} />;
}
