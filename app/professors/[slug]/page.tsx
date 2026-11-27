import ProfessorProfile from "../../../features/professors/ProfessorProfile";
import { professors } from "../../../data/professors";

// Pre-render the public profile for every catalog ID. Private reviews remain
// client-fetched through the authenticated API, including on static pages.
export function generateStaticParams(): { slug: string }[] {
  return Array.from(new Set(professors.map(professor => professor.id).filter(Boolean)),
    slug => ({ slug }));
}

export default function Page() {
  return <ProfessorProfile />;
}
