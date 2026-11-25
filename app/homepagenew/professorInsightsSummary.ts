export type CourseReview = {
  id?: string; professorId?: string; professorName?: string;
  courseCode?: string; courseTaken?: string; rating?: number;
  lectureUsefulness?: string; gradingTransparency?: string;
  examDifficulty?: string; feedbackQuality?: string; workload?: string;
  officeHours?: string;
};

export type ProfessorInsight = {
  professorId: string; professorName: string; reviewCount: number;
  averageRating: number; category: "consider" | "caution" | "other";
  themes: string[];
};

const normalizeCode = (value?: string) => String(value || "").toUpperCase().replace(/\s+/g, "");

const fields = [
  ["lectureUsefulness", "Lectures"], ["gradingTransparency", "Grading"],
  ["examDifficulty", "Exams"], ["feedbackQuality", "Feedback"],
  ["workload", "Workload"], ["officeHours", "Office hours"]
] as const;

function recurringThemes(reviews: CourseReview[]): string[] {
  const themes: { text: string; count: number; share: number }[] = [];
  for (const [field, label] of fields) {
    const answers = reviews.map(review => String(review[field] || "").trim()).filter(Boolean);
    const counts = new Map<string, number>();
    for (const answer of answers) counts.set(answer, (counts.get(answer) || 0) + 1);
    const top = [...counts].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))[0];
    if (!top || top[1] < 2 || top[1] / answers.length <= 0.5) continue;
    themes.push({ text: label + ": " + top[0] + " (" + top[1] + "/" + answers.length + " responses)",
      count: top[1], share: top[1] / answers.length });
  }
  return themes.sort((a, b) => b.share - a.share || b.count - a.count)
    .slice(0, 2).map(theme => theme.text);
}

export function summarizeCourseProfessors(reviews: readonly CourseReview[], code: string): ProfessorInsight[] {
  const groups = new Map<string, CourseReview[]>();
  const seen = new Set<string>();
  for (const review of reviews) {
    if (!review || normalizeCode(review.courseCode || review.courseTaken) !== normalizeCode(code)) continue;
    const id = String(review.professorId || "").trim();
    const rating = Number(review.rating);
    if (!id || !Number.isInteger(rating) || rating < 1 || rating > 5) continue;
    if (review.id && seen.has(review.id)) continue;
    if (review.id) seen.add(review.id);
    const group = groups.get(id) || [];
    group.push(review);
    groups.set(id, group);
  }
  const results: ProfessorInsight[] = [...groups].map(([professorId, group]) => {
    const reviewCount = group.length;
    const averageRating = group.reduce((total, review) => total + Number(review.rating), 0) / reviewCount;
    const category = averageRating >= 4 ? "consider" :
      averageRating <= 2 ? "caution" : "other";
    return { professorId, professorName: group.find(review => review.professorName?.trim())?.professorName || "Professor",
      reviewCount, averageRating, category, themes: recurringThemes(group) };
  });
  const order = { consider: 0, caution: 1, other: 2 };
  return results.sort((a, b) => order[a.category] - order[b.category] ||
    (a.category === "caution" ? a.averageRating - b.averageRating : b.averageRating - a.averageRating) ||
    b.reviewCount - a.reviewCount || a.professorId.localeCompare(b.professorId));
}
