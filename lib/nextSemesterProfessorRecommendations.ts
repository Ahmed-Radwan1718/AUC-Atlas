import {
  cairoAcademicTerm, recommendMechanicalCourses,
  type CourseSuggestion, type MechanicalCatalogCourse
} from "./mechanicalCourseRecommendations";
import type { Professor } from "../data/professors-type";

export type NextSemesterProjection = {
  term: string;
  semester: number;
  courses: CourseSuggestion[];
  predictedCodes: string[];
  usedSavedProgress: boolean;
};

export type ProfessorReviewForRecommendation = {
  id: string;
  professorId?: unknown;
  courseCode?: unknown;
  courseTaken?: unknown;
  rating?: unknown;
  authorUid?: unknown;
  authorUserId?: unknown;
  createdAt?: unknown;
};

export type CourseProfessorRecommendation = {
  professorId: string;
  professorName: string;
  courseCode: string;
  image: string;
  averageRating: number;
  reviewCount: number;
};

type ProfessorRankingResult = {
  consider: CourseProfessorRecommendation[];
  avoid: CourseProfessorRecommendation[];
};

const normalize = (value: unknown) => String(value ?? "").trim().replace(/\s+/g, " ").toUpperCase();

/**
 * A student chooses professors for the next regular Fall/Spring term.
 * Winter/January and summer/June-August target the upcoming regular semester,
 * rather than skipping forward an additional semester.
 */
export function nextRegularSemesterDate(today: Date): Date {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Africa/Cairo", year: "numeric", month: "numeric"
  }).formatToParts(today);
  const year = Number(parts.find(part => part.type === "year")?.value);
  const month = Number(parts.find(part => part.type === "month")?.value);
  if (month === 1) return new Date(Date.UTC(year, 2, 15, 12));
  if (month >= 2 && month <= 8) return new Date(Date.UTC(year, 9, 15, 12));
  return new Date(Date.UTC(year + 1, 2, 15, 12));
}

/** Project classes, do not imply actual registration or teaching assignments. */
export function projectNextMechanicalSemester(input: {
  aucId: unknown;
  completedCodes?: ReadonlySet<string>;
  hasSavedProgress?: boolean;
  catalog: readonly MechanicalCatalogCourse[];
  today?: Date;
}): NextSemesterProjection | null {
  const today = input.today || new Date();
  const targetDate = nextRegularSemesterDate(today);
  const current = recommendMechanicalCourses({ ...input, today, limit: 8 });
  if (!current) return null;
  const targetTerm = cairoAcademicTerm(targetDate).label;
  const manual = Boolean(input.hasSavedProgress && input.completedCodes?.size);

  // Saved checkboxes describe completed work, but students may be taking
  // additional recommended courses now. When predicting the following term,
  // conditionally assume those current-term courses are passed. Never assume
  // anything about courses in the target term (e.g. during winter/summer).
  const completed = new Set(input.completedCodes || []);
  if (manual && current.term !== targetTerm) {
    for (const course of current.courses) {
      if (course.semester <= current.semester) completed.add(course.code);
    }
  }

  const upcoming = recommendMechanicalCourses({
    ...input,
    today: targetDate,
    limit: 8,
    completedCodes: manual ? completed : input.completedCodes
  });
  if (!upcoming) return null;
  // An already modeled tenth-semester student has no reliable following-term
  // pathway; do not present a recycled "semester 10" as the next term.
  if (upcoming.semester === current.semester && current.term !== targetTerm) {
    return { term: targetTerm, semester: upcoming.semester, courses: [],
      predictedCodes: [], usedSavedProgress: manual };
  }

  return {
    term: upcoming.term, semester: upcoming.semester,
    courses: upcoming.courses,
    predictedCodes: upcoming.courses.map(course => course.code),
    usedSavedProgress: manual
  };
}

function reviewDate(value: unknown): number {
  if (!value) return 0;
  if (typeof value === "object" && value !== null) {
    if ("toMillis" in value && typeof value.toMillis === "function") {
      return Number(value.toMillis()) || 0;
    }
    if ("seconds" in value && typeof value.seconds === "number") {
      return value.seconds * 1000;
    }
  }
  const parsed = new Date(value as string).getTime();
  return Number.isFinite(parsed) ? parsed : 0;
}

/**
 * All ranking evidence comes from reviews for these exact projected courses.
 * Each reviewer contributes at most one rating per professor-course pair, so
 * five submissions by the same student cannot clear the five-review floor.
 */
export function rankProjectedCourseProfessors(input: {
  predictedCodes: readonly string[];
  reviews: readonly ProfessorReviewForRecommendation[];
  professors: readonly Pick<Professor, "id" | "name" | "image">[];
  minReviews?: number;
  limit?: number;
}): ProfessorRankingResult {
  const allowed = new Set(input.predictedCodes.map(normalize));
  const catalog = new Map(input.professors.map(professor => [professor.id, professor]));
  const grouped = new Map<string, Map<string, { rating: number; date: number }>>();
  const max = Math.max(1, Math.min(8, Math.floor(input.limit ?? 5)));
  const threshold = Math.max(5, Math.floor(input.minReviews ?? 5));

  for (const review of input.reviews) {
    const professorId = String(review.professorId ?? "").trim();
    const code = normalize(review.courseCode || review.courseTaken);
    const rating = Number(review.rating);
    if (!catalog.has(professorId) || !allowed.has(code)
      || !Number.isInteger(rating) || rating < 1 || rating > 5) continue;

    const groupKey = professorId + "|" + code;
    const reviewerId = String(review.authorUid || review.authorUserId || "").trim();
    const authorKey = reviewerId ? "author:" + reviewerId : "legacy:" + review.id;
    const group = grouped.get(groupKey) || new Map<string, { rating: number; date: number }>();
    const date = reviewDate(review.createdAt);
    if (!group.has(authorKey) || date > group.get(authorKey)!.date) {
      group.set(authorKey, { rating, date });
    }
    grouped.set(groupKey, group);
  }

  const consider: CourseProfessorRecommendation[] = [];
  const avoid: CourseProfessorRecommendation[] = [];
  for (const [key, ratings] of grouped) {
    if (ratings.size < threshold) continue;
    const splitAt = key.indexOf("|");
    const professorId = key.slice(0, splitAt);
    const courseCode = key.slice(splitAt + 1);
    const profile = catalog.get(professorId)!;
    const average = [...ratings.values()].reduce((sum, value) => sum + value.rating, 0) / ratings.size;
    const entry: CourseProfessorRecommendation = {
      professorId, professorName: profile.name, courseCode,
      image: profile.image?.startsWith("https://res.cloudinary.com/")
        ? profile.image : "/user.png",
      averageRating: Math.round(average * 10) / 10, reviewCount: ratings.size
    };
    if (average >= 4) consider.push(entry);
    else if (average <= 2.7) avoid.push(entry);
  }
  const byName = (a: CourseProfessorRecommendation, b: CourseProfessorRecommendation) =>
    a.professorName.localeCompare(b.professorName) || a.courseCode.localeCompare(b.courseCode);
  consider.sort((a, b) => b.averageRating - a.averageRating || b.reviewCount - a.reviewCount || byName(a, b));
  avoid.sort((a, b) => a.averageRating - b.averageRating || b.reviewCount - a.reviewCount || byName(a, b));
  return { consider: consider.slice(0, max), avoid: avoid.slice(0, max) };
}
