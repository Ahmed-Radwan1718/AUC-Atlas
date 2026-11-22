/**
 * New homepage: course-relevant faculty suggestions.
 *
 * The connection to a course must come from a review for that exact course,
 * not a matching department or a strong overall score alone.
 * Small course samples may be shown as preliminary positive signals, but
 * professors are NEVER put into the "avoid" panel on sparse course feedback.
 */
export type CourseRating = {
  id: string;
  professorId: string;
  courseCode: string;
  rating: number;
};
export type ProfessorListing = { id: string; name: string; image?: string };
export type OverallProfessorRating = {
  professorId: string;
  averageRating: number;
  reviewCount: number;
};
export type RatedCourseProfessor = {
  professorId: string;
  professorName: string;
  courseCode: string;
  image: string;
  averageRating: number;
  reviewCount: number;
  ratingBasis: "course" | "overall";
  courseReviewCount: number;
  limitedEvidence: boolean;
};

export const MIN_COURSE_REVIEWS_TO_AVOID = 3;
export const SUGGESTIONS_PER_GROUP = 10;

function courseCode(value: string): string {
  return value.toUpperCase().trim().replace(/\s+/g, " ");
}

const round = (n: number) => Math.round(n * 100) / 100;

export function rankProfessorsForCourses(
  requestedCourses: readonly string[],
  reviews: readonly CourseRating[],
  directory: readonly ProfessorListing[],
  overallRatings: readonly OverallProfessorRating[] = []
): { consider: RatedCourseProfessor[]; avoid: RatedCourseProfessor[] } {
  const wanted = new Set(requestedCourses.map(courseCode));
  const known = new Map(directory.map(p => [p.id, p]));
  const overall = new Map(overallRatings.map(r => [r.professorId, r]));
  const seen = new Set<string>();
  const groups = new Map<string, { professorId: string; courseCode: string; total: number; count: number }>();

  for (const review of reviews) {
    const id = String(review.professorId || "").trim();
    const code = courseCode(String(review.courseCode || ""));
    const stars = Number(review.rating);
    const reviewId = String(review.id || "").trim();
    if (!id || !reviewId || !known.has(id) || !wanted.has(code)
      || !Number.isInteger(stars) || stars < 1 || stars > 5 || seen.has(reviewId)) continue;
    seen.add(reviewId); // Same review can appear under legacy and current course fields.
    const key = code + ":" + id;
    const row = groups.get(key) || { professorId: id, courseCode: code, total: 0, count: 0 };
    row.total += stars;
    row.count++;
    groups.set(key, row);
  }

  const candidates = [...groups.values()].map(row => {
    const professor = known.get(row.professorId)!;
    const courseAverage = round(row.total / row.count);
    const global = overall.get(row.professorId);
    const hasUsefulOverall = row.count < MIN_COURSE_REVIEWS_TO_AVOID
      && global && global.reviewCount >= 3 && global.averageRating >= 4
      && courseAverage >= 4;
    return {
      professorId: row.professorId,
      professorName: professor.name,
      courseCode: row.courseCode,
      image: professor.image || "",
      averageRating: hasUsefulOverall ? global.averageRating : courseAverage,
      reviewCount: hasUsefulOverall ? global.reviewCount : row.count,
      ratingBasis: hasUsefulOverall ? "overall" as const : "course" as const,
      courseReviewCount: row.count,
      limitedEvidence: row.count < MIN_COURSE_REVIEWS_TO_AVOID,
      courseAverage
    };
  });

  const consider = candidates.filter(row =>
    // One verified course review can surface a *preliminary* positive option.
    // For a small sample corroborated by global reviews, show the global score.
    row.courseAverage >= 4 && row.averageRating >= 4
  ).sort((a, b) =>
    Number(b.courseReviewCount >= 3) - Number(a.courseReviewCount >= 3)
    || b.courseReviewCount - a.courseReviewCount
    || b.reviewCount - a.reviewCount
    || b.averageRating - a.averageRating
    || a.professorName.localeCompare(b.professorName)
  ).slice(0, SUGGESTIONS_PER_GROUP);

  const avoid = candidates.filter(row =>
    row.courseReviewCount >= MIN_COURSE_REVIEWS_TO_AVOID && row.courseAverage <= 2
  ).sort((a, b) => a.courseAverage - b.courseAverage
    || b.courseReviewCount - a.courseReviewCount
    || a.professorName.localeCompare(b.professorName)
  ).slice(0, SUGGESTIONS_PER_GROUP);

  // Keep only fields specified by the public API contract.
  const serialize = ({ courseAverage: _ignored, ...candidate }: typeof candidates[number]) => candidate;
  return { consider: consider.map(serialize), avoid: avoid.map(serialize) };
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
