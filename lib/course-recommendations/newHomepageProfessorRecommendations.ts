/**
 * New-homepage professor suggestions.
 *
 * Only count star ratings for the exact course and catalogued professor.
 * A global professor average or matching department is NOT evidence of
 * teaching a specific course. Sparse feedback must not be called an "avoid".
 */
export type CourseRating = {
  id: string;
  professorId: string;
  courseCode: string;
  rating: number;
};

export type ProfessorListing = {
  id: string;
  name: string;
  image?: string;
};

export type RatedCourseProfessor = {
  professorId: string;
  professorName: string;
  courseCode: string;
  image: string;
  averageRating: number;
  reviewCount: number;
};

export const MIN_COURSE_REVIEWS = 3;
export const SUGGESTIONS_PER_GROUP = 5;

function courseCode(value: string): string {
  return value.toUpperCase().trim().replace(/\s+/g, " ");
}

export function rankProfessorsForCourses(
  requestedCourses: readonly string[],
  reviews: readonly CourseRating[],
  directory: readonly ProfessorListing[]
): { consider: RatedCourseProfessor[]; avoid: RatedCourseProfessor[] } {
  const wanted = new Set(requestedCourses.map(courseCode));
  const known = new Map(directory.map(p => [p.id, p]));
  const uniqueReviews = new Set<string>();
  const groups = new Map<string, { professorId: string; courseCode: string; total: number; count: number }>();

  for (const review of reviews) {
    const id = String(review.professorId || "").trim();
    const code = courseCode(String(review.courseCode || ""));
    const stars = Number(review.rating);
    const reviewId = String(review.id || "").trim();
    if (!id || !reviewId || !known.has(id) || !wanted.has(code)
      || !Number.isInteger(stars) || stars < 1 || stars > 5) continue;
    // The same review can be returned by both current and legacy course queries.
    if (uniqueReviews.has(reviewId)) continue;
    uniqueReviews.add(reviewId);
    const key = code + ":" + id;
    const row = groups.get(key) || { professorId: id, courseCode: code, total: 0, count: 0 };
    row.total += stars;
    row.count++;
    groups.set(key, row);
  }

  const eligible = [...groups.values()]
    .filter(row => row.count >= MIN_COURSE_REVIEWS)
    .map(row => ({
      professorId: row.professorId,
      professorName: known.get(row.professorId)!.name,
      courseCode: row.courseCode,
      image: known.get(row.professorId)!.image || "",
      averageRating: Math.round((row.total / row.count) * 100) / 100,
      reviewCount: row.count
    }));

  const consider = eligible.filter(row => row.averageRating >= 4)
    .sort((a, b) => b.averageRating - a.averageRating ||
      b.reviewCount - a.reviewCount || a.professorName.localeCompare(b.professorName))
    .slice(0, SUGGESTIONS_PER_GROUP);
  const avoid = eligible.filter(row => row.averageRating <= 2)
    .sort((a, b) => a.averageRating - b.averageRating ||
      b.reviewCount - a.reviewCount || a.professorName.localeCompare(b.professorName))
    .slice(0, SUGGESTIONS_PER_GROUP);

  return { consider, avoid };
}

export function nextAcademicSemester(
  current: { semester: number; term: string; upcoming: boolean }
): { semester: number; term: string } | null {
  const match = /^(Spring|Fall) (20\d{2})$/.exec(current.term);
  if (!match) return null;
  if (current.upcoming) return { semester: current.semester, term: current.term };
  const next = match[1] === "Fall"
    ? "Spring " + (Number(match[2]) + 1)
    : "Fall " + match[2];
  return { semester: current.semester + 1, term: next };
}
