"use client";

import {
  type FormEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { CatalogResponse, Course, Professor } from "@/lib/types";

type Review = {
  id?: string;
  professorId?: string;
  professorName?: string;
  courseTaken?: string;
  courseCode?: string;
  semesterTaken?: string;
  rating?: number;
  recommendation?: string;
  recommendationReason?: string;
  attendancePolicy?: string;
  workload?: string;
  lectureUsefulness?: string;
  officeHours?: string;
  gradingStyle?: string;
  examDifficulty?: string;
  gradingTransparency?: string;
  feedbackQuality?: string;
  studentNote?: string;
  authorName?: string;
  authorPhotoURL?: string;
  createdAt?: string;
};

type ReviewResponse = {
  success?: boolean;
  reviews?: Review[];
  error?: string;
};

type MessageState = { text: string; type: "" | "error" | "success" };

type ReviewDraft = {
  courseTaken: string;
  semesterTaken: string;
  rating: string;
  recommendation: string;
  recommendationReason: string;
  attendancePolicy: string;
  workload: string;
  lectureUsefulness: string;
  officeHours: string;
  gradingStyle: string;
  examDifficulty: string;
  gradingTransparency: string;
  feedbackQuality: string;
  studentNote: string;
  isAnonymous: boolean;
};

const EMPTY_DRAFT: ReviewDraft = {
  courseTaken: "",
  semesterTaken: "",
  rating: "",
  recommendation: "",
  recommendationReason: "",
  attendancePolicy: "",
  workload: "",
  lectureUsefulness: "",
  officeHours: "",
  gradingStyle: "",
  examDifficulty: "",
  gradingTransparency: "",
  feedbackQuality: "",
  studentNote: "",
  isAnonymous: false,
};

const SEMESTERS = [
  "Fall 2026", "Summer 2026", "Spring 2026", "Winter 2026",
  "Fall 2025", "Summer 2025", "Spring 2025", "Winter 2025",
  "Fall 2024", "Summer 2024", "Spring 2024", "Winter 2024",
  "Fall 2023", "Summer 2023", "Spring 2023", "Winter 2023",
  "Fall 2022", "Summer 2022", "Spring 2022", "Winter 2022",
  "Fall 2021", "Summer 2021", "Spring 2021", "Winter 2021",
  "Fall 2020", "Summer 2020", "Spring 2020", "Winter 2020",
  "Fall 2019", "Summer 2019", "Spring 2019", "Winter 2019",
  "Fall 2018", "Summer 2018", "Spring 2018", "Winter 2018",
];

const STAT_CONFIGS: Array<{
  key: keyof Review;
  label: string;
  values: string[];
}> = [
  { key: "recommendation", label: "Would take again", values: ["Yes", "Depends", "No"] },
  { key: "workload", label: "Workload", values: ["Light", "Moderate", "Heavy"] },
  {
    key: "examDifficulty",
    label: "Exam difficulty",
    values: ["Easier than class material", "Matches class material", "Harder than class material", "No exams"],
  },
  {
    key: "gradingStyle",
    label: "Grading style",
    values: ["Exams-heavy", "Projects-heavy", "Assignments-heavy", "Participation-heavy", "Mixed"],
  },
  {
    key: "gradingTransparency",
    label: "Grading transparency",
    values: ["Rubric is clear", "Somewhat clear", "Unclear"],
  },
  {
    key: "lectureUsefulness",
    label: "Lecture usefulness",
    values: ["Essential", "Helpful", "Attending means less work at home", "Skippable", "Not lecture-based"],
  },
  {
    key: "attendancePolicy",
    label: "Attendance policy",
    values: ["Required", "Sometimes checked", "Not important", "Not sure"],
  },
  {
    key: "officeHours",
    label: "Office hours/help",
    values: ["Helpful", "Available but limited", "Hard to reach", "Did not use"],
  },
  {
    key: "feedbackQuality",
    label: "Feedback quality",
    values: ["Helpful", "Minimal", "None", "Not applicable"],
  },
];

function getProfessorImage(image?: string) {
  const value = String(image || "").trim();
  return !value || value === "user.png" ? "/user.png" : value;
}

function getInitials(name?: string) {
  const initials = String(name || "AUC student")
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");
  return initials || "A";
}

function normalizeCourseCode(value: unknown) {
  return String(value || "").replace(/\s+/g, " ").trim().toUpperCase();
}

function compactStatValue(value: string) {
  const values: Record<string, string> = {
    "Matches class material": "Matches class",
    "Easier than class material": "Easier than class",
    "Harder than class material": "Harder than class",
    "Sometimes checked": "Sometimes",
    "Available but limited": "Limited",
    "Did not use": "Not used",
    "Attending means less work at home": "Worth attending",
    "Rubric is clear": "Clear rubric",
  };
  return values[value] || value.replace(/-/g, " ");
}

function CoursePicker({
  courses,
  value,
  onChange,
}: {
  courses: Course[];
  value: string;
  onChange: (value: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function close(event: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) {
        setOpen(false);
        setQuery("");
      }
    }
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  const selected = courses.find((course) => course.code === value);
  const terms = query.toLowerCase().trim().split(/\s+/).filter(Boolean);
  const visible = courses.filter((course) => {
    const text = `${course.code} ${course.title}`.toLowerCase();
    return terms.every((term) => text.includes(term));
  });

  return (
    <div className={`review-choice${open ? " open" : ""}`} ref={rootRef}>
      <button
        className="review-choice-button"
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
      >
        <span>{selected ? `${selected.code} - ${selected.title}` : "Choose course"}</span>
      </button>
      <div className="review-choice-menu" hidden={!open}>
        <div className="review-choice-search-wrap">
          <input
            className="review-choice-search"
            type="search"
            placeholder="Search courses"
            aria-label="Search courses"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </div>
        {visible.map((course) => (
          <button
            className={`review-choice-option${course.code === value ? " is-selected" : ""}`}
            type="button"
            key={course.code}
            onClick={() => {
              onChange(course.code);
              setOpen(false);
              setQuery("");
            }}
          >
            {course.code} - {course.title}
          </button>
        ))}
        {!visible.length ? <p className="review-choice-empty">No matching courses.</p> : null}
      </div>
    </div>
  );
}

export function ProfessorProfile({ professor }: { professor: Professor }) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(true);
  const [reviewsError, setReviewsError] = useState("");
  const [courses, setCourses] = useState<Course[]>([]);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [reviewBusy, setReviewBusy] = useState(false);
  const [reviewMessage, setReviewMessage] = useState<MessageState>({ text: "", type: "" });
  const [draft, setDraft] = useState<ReviewDraft>(EMPTY_DRAFT);
  const [showAllStats, setShowAllStats] = useState(false);
  const [reportReview, setReportReview] = useState<Review | null>(null);
  const [reportReason, setReportReason] = useState("");
  const [reportBusy, setReportBusy] = useState(false);
  const [reportMessage, setReportMessage] = useState<MessageState>({ text: "", type: "" });

  const professorId = professor.id;

  useEffect(() => {
    let active = true;

    fetch("/api/catalog", { headers: { Accept: "application/json" } })
      .then((response) => {
        if (!response.ok) throw new Error("catalog");
        return response.json();
      })
      .then((data: CatalogResponse) => {
        if (active) setCourses(Array.isArray(data.courses) ? data.courses : []);
      })
      .catch(() => {});

    return () => {
      active = false;
    };
  }, []);

  async function loadReviews() {
    setReviewsLoading(true);
    setReviewsError("");

    try {
      const response = await fetch(
        `/api/professor-reviews?professorId=${encodeURIComponent(professorId)}`,
        { credentials: "same-origin", cache: "no-store", headers: { Accept: "application/json" } },
      );
      const data = (await response.json().catch(() => ({}))) as ReviewResponse;
      if (!response.ok) throw new Error(data.error || "Could not load reviews.");
      setReviews(Array.isArray(data.reviews) ? data.reviews : []);
    } catch (error) {
      setReviewsError(error instanceof Error ? error.message : "Could not load reviews right now.");
    } finally {
      setReviewsLoading(false);
    }
  }

  useEffect(() => {
    void loadReviews();
    // professorId changes only when this route changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [professorId]);

  useEffect(() => {
    const locked = reviewOpen || Boolean(reportReview);
    document.body.classList.toggle("review-modal-open", locked);
    return () => document.body.classList.remove("review-modal-open");
  }, [reviewOpen, reportReview]);

  const stats = useMemo(() => {
    return STAT_CONFIGS.map((config) => {
      const values = reviews
        .map((review) => String(review[config.key] || "").trim())
        .filter(Boolean);
      if (!values.length) return null;

      const counts = new Map<string, number>();
      values.forEach((value) => counts.set(value, (counts.get(value) || 0) + 1));
      const orderedValues = [...config.values];
      counts.forEach((_, value) => {
        if (!orderedValues.includes(value)) orderedValues.push(value);
      });
      const answers = orderedValues.map((value) => ({
        value,
        count: counts.get(value) || 0,
        percent: Math.round(((counts.get(value) || 0) / values.length) * 100),
      }));
      const top = answers.slice().sort((a, b) => b.count - a.count || orderedValues.indexOf(a.value) - orderedValues.indexOf(b.value))[0];
      return top?.count ? { label: config.label, top, answers } : null;
    }).filter((row): row is NonNullable<typeof row> => Boolean(row));
  }, [reviews]);

  const taughtCourses = useMemo(() => {
    const byCode = new Map(courses.map((course) => [normalizeCourseCode(course.code), course]));
    const selected = new Map<string, Course>();
    reviews.forEach((review) => {
      const code = normalizeCourseCode(review.courseCode || review.courseTaken);
      const course = byCode.get(code);
      if (course) selected.set(code, course);
    });
    return Array.from(selected.values()).sort((a, b) => a.code.localeCompare(b.code));
  }, [courses, reviews]);

  function updateDraft<K extends keyof ReviewDraft>(key: K, value: ReviewDraft[K]) {
    setDraft((current) => ({ ...current, [key]: value }));
  }

  function closeReview() {
    if (reviewBusy) return;
    setReviewOpen(false);
    setReviewMessage({ text: "", type: "" });
  }

  async function submitReview(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!draft.courseTaken || !draft.semesterTaken || !draft.rating) {
      setReviewMessage({ text: "Choose a course, semester, and overall rating.", type: "error" });
      return;
    }
    if (draft.recommendation === "Depends" && !draft.recommendationReason.trim()) {
      setReviewMessage({ text: "Please explain what the recommendation depends on.", type: "error" });
      return;
    }

    setReviewBusy(true);
    setReviewMessage({ text: "", type: "" });

    try {
      const response = await fetch("/api/professor-reviews", {
        method: "POST",
        credentials: "same-origin",
        headers: { Accept: "application/json", "Content-Type": "application/json" },
        body: JSON.stringify({
          professorId,
          professorName: professor.name,
          ...draft,
          rating: Number(draft.rating),
          recommendationReason:
            draft.recommendation === "Depends" ? draft.recommendationReason.trim() : "",
        }),
      });
      const data = (await response.json().catch(() => ({}))) as ReviewResponse;
      if (!response.ok || !data.success) {
        throw new Error(data.error || "Could not save your review. Please log in and try again.");
      }

      if (Array.isArray(data.reviews)) setReviews(data.reviews);
      else await loadReviews();
      setDraft(EMPTY_DRAFT);
      setReviewMessage({
        text: "Review submitted. Thanks for helping other students.",
        type: "success",
      });
      window.setTimeout(() => {
        setReviewOpen(false);
        setReviewMessage({ text: "", type: "" });
      }, 900);
    } catch (error) {
      setReviewMessage({
        text: error instanceof Error ? error.message : "Could not save your review. Please try again.",
        type: "error",
      });
    } finally {
      setReviewBusy(false);
    }
  }

  async function submitReport(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const reviewId = String(reportReview?.id || "");
    const reason = reportReason.trim();
    if (!reviewId) return;
    if (reason.length < 3) {
      setReportMessage({ text: "Briefly explain why you are reporting this content.", type: "error" });
      return;
    }

    setReportBusy(true);
    setReportMessage({ text: "", type: "" });
    try {
      const response = await fetch("/api/content-reports", {
        method: "POST",
        credentials: "same-origin",
        cache: "no-store",
        headers: { Accept: "application/json", "Content-Type": "application/json" },
        body: JSON.stringify({ targetType: "review", targetId: reviewId, reason }),
      });
      const data = (await response.json().catch(() => ({}))) as { error?: string };
      if (!response.ok && response.status !== 409) {
        throw new Error(data.error || "Could not submit the report.");
      }
      setReportMessage({ text: "Report submitted.", type: "success" });
      window.setTimeout(() => {
        setReportReview(null);
        setReportReason("");
        setReportMessage({ text: "", type: "" });
      }, 650);
    } catch (error) {
      setReportMessage({
        text: error instanceof Error ? error.message : "Could not submit the report.",
        type: "error",
      });
    } finally {
      setReportBusy(false);
    }
  }

  const visibleStats = showAllStats ? stats : stats.slice(0, 5);

  return (
    <main className="professors-page professor-profile-page">
      <div className="professors-inner">
        <section className="professors-header professor-profile-heading">
          <div><h1>{professor.name}</h1></div>
          <p>Check contact details, read the current short bio, and leave a course-specific review.</p>
        </section>

        <section className="professor-profile-grid">
          <article className="professor-profile-card">
            <div className="professor-profile-image">
              <img
                src={getProfessorImage(professor.image)}
                alt={professor.name}
                onError={(event) => {
                  event.currentTarget.onerror = null;
                  event.currentTarget.src = "/user.png";
                }}
              />
            </div>
            <div className="professor-profile-body">
              <div className="professor-profile-info">
                <div>
                  <span>Department</span>
                  <span className="professor-profile-value">{professor.department || "Department coming soon"}</span>
                </div>
                <div>
                  <span>Email</span>
                  {professor.email ? (
                    <span className="professor-profile-email">{professor.email}</span>
                  ) : (
                    <span className="professor-profile-email is-empty">Email coming soon</span>
                  )}
                </div>
                {taughtCourses.length ? (
                  <div>
                    <span>Teaches</span>
                    <span className="professor-profile-value professor-profile-course-list">
                      {taughtCourses.map((course) => (
                        <a
                          className="professor-profile-course-link"
                          href={`/courses/${encodeURIComponent(course.code.toLowerCase().replace(/\s+/g, "-"))}`}
                          key={course.code}
                        >
                          {course.title || course.code}
                        </a>
                      ))}
                    </span>
                  </div>
                ) : null}
              </div>

              <p className="professor-profile-bio">{professor.bio || "Bio coming soon."}</p>
              <button className="professor-review-toggle" type="button" onClick={() => setReviewOpen(true)}>
                Leave a review
              </button>
            </div>
          </article>

          <section className="professor-review-insights" aria-label={`Review stats for ${professor.name}`}>
            <div className="professor-review-insights-header">
              <div><span>Review stats</span><h2>Class patterns</h2></div>
              <p>{reviews.length ? "Based on student reviews" : "No review choices yet"}</p>
            </div>
            <div className="professor-review-stats">
              {reviewsLoading ? <p className="professor-review-status">Loading review stats...</p> : null}
              {!reviewsLoading && reviewsError ? <p className="professor-review-status">Could not load review stats right now.</p> : null}
              {!reviewsLoading && !reviewsError && !visibleStats.length ? (
                <p className="professor-review-status">Review stats will appear after students answer the review choices.</p>
              ) : null}
              {visibleStats.map((row) => (
                <div className="professor-review-stat-row" key={row.label}>
                  <div className="professor-review-stat-head">
                    <span className="professor-review-stat-label">{row.label}</span>
                    <div className="professor-review-stat-value">
                      <strong>{compactStatValue(row.top.value)}</strong><span aria-hidden="true">·</span><span>{row.top.percent}%</span>
                    </div>
                  </div>
                  <div className="professor-review-stat-track" role="img" aria-label={`${row.label}: ${compactStatValue(row.top.value)}, selected by ${row.top.percent}% of responses`}>
                    <span className="professor-review-stat-fill" style={{ width: `${row.top.percent}%` }} />
                  </div>
                  <details className="professor-review-stat-details">
                    <summary>More details</summary>
                    <div className="professor-review-stat-breakdown">
                      {row.answers.map((answer) => (
                        <div className="professor-review-stat-answer" key={answer.value}>
                          <div><span>{compactStatValue(answer.value)}</span><span>{answer.percent}%</span></div>
                          <div className="professor-review-stat-answer-track"><span style={{ width: `${answer.percent}%` }} /></div>
                        </div>
                      ))}
                    </div>
                  </details>
                </div>
              ))}
              {stats.length > 5 ? (
                <button className="professor-review-insights-more-toggle" type="button" onClick={() => setShowAllStats((value) => !value)}>
                  {showAllStats ? "Show less" : "Show more"}
                </button>
              ) : null}
            </div>
          </section>

          <section className="professor-reviews-section" aria-label={`Student reviews for ${professor.name}`}>
            <div className="professor-reviews-header">
              <div><span>Student reviews</span><h2>What students said</h2></div>
              <p>{reviewsLoading ? "Loading reviews..." : `${reviews.length} ${reviews.length === 1 ? "review" : "reviews"}`}</p>
            </div>
            <div className="professor-reviews-list">
              {reviewsLoading ? <p className="professor-review-status">Loading reviews...</p> : null}
              {!reviewsLoading && reviewsError ? <p className="professor-review-status">Could not load reviews right now.</p> : null}
              {!reviewsLoading && !reviewsError && !reviews.length ? <p className="professor-review-empty">No reviews yet. Be the first to leave one.</p> : null}
              {reviews.map((review) => {
                const rating = Math.max(0, Math.min(5, Math.round(Number(review.rating || 0))));
                return (
                  <article className="professor-review-card" key={review.id || `${review.createdAt}-${review.courseTaken}`}>
                    <div className="professor-review-card-top">
                      <div className="professor-review-author">
                        {review.authorPhotoURL ? (
                          <img className="professor-review-avatar" src={review.authorPhotoURL} alt={`${review.authorName || "AUC student"} profile photo`} />
                        ) : (
                          <span className="professor-review-avatar-fallback">{getInitials(review.authorName)}</span>
                        )}
                        <strong>{review.authorName || "AUC student"}</strong>
                      </div>
                      <span className="professor-review-rating" aria-label={rating ? `${rating} out of 5 stars` : "Not rated"}>
                        {rating ? `${"★".repeat(rating)}${"☆".repeat(5 - rating)}` : "Not rated"}
                      </span>
                    </div>
                    <div className="professor-review-context">
                      <span>{review.courseTaken || review.courseCode || "Course not listed"}</span>
                      <span>{review.semesterTaken || "Semester not listed"}</span>
                    </div>
                    <p className="professor-review-note">{review.studentNote || "No written note."}</p>
                    {review.id ? (
                      <div className="professor-review-card-actions">
                        <button className="professor-review-report-button" type="button" onClick={() => {
                          setReportReview(review);
                          setReportReason("");
                          setReportMessage({ text: "", type: "" });
                        }}>Report</button>
                      </div>
                    ) : null}
                  </article>
                );
              })}
            </div>
          </section>
        </section>
      </div>

      {reviewOpen ? (
        <div className="review-modal-shell" role="presentation">
          <button className="review-modal-backdrop" type="button" aria-label="Close review form" onClick={closeReview} />
          <form className="professor-review-form" aria-label="Professor review form" onSubmit={submitReview}>
            <div className="review-modal-header">
              <div><span>Professor review</span><h2>Leave a review</h2></div>
              <button className="review-close-button" type="button" aria-label="Close review form" onClick={closeReview}>×</button>
            </div>

            <div className="review-section-heading">Course context</div>
            <div className="review-field">
              <label>Course taken</label>
              <CoursePicker courses={courses} value={draft.courseTaken} onChange={(value) => updateDraft("courseTaken", value)} />
            </div>
            <div className="review-field">
              <label htmlFor="review-semester">Semester taken</label>
              <select id="review-semester" value={draft.semesterTaken} onChange={(event) => updateDraft("semesterTaken", event.target.value)} required>
                <option value="" disabled>Choose semester</option>
                {SEMESTERS.map((semester) => <option key={semester}>{semester}</option>)}
              </select>
            </div>
            <div className="review-field">
              <label htmlFor="review-rating">Overall rating</label>
              <select id="review-rating" value={draft.rating} onChange={(event) => updateDraft("rating", event.target.value)} required>
                <option value="" disabled>Choose rating</option>
                {[5, 4, 3, 2, 1].map((rating) => <option value={rating} key={rating}>{rating} stars</option>)}
              </select>
            </div>
            <div className="review-field">
              <label htmlFor="review-recommend">Would you recommend for this course?</label>
              <select id="review-recommend" value={draft.recommendation} onChange={(event) => updateDraft("recommendation", event.target.value)}>
                <option value="">Choose recommendation</option><option>Yes</option><option>Depends</option><option>No</option>
              </select>
            </div>
            {draft.recommendation === "Depends" ? (
              <div className="review-field full">
                <label htmlFor="review-recommend-reason">If your answer depends, what does it depend on?</label>
                <input id="review-recommend-reason" maxLength={220} placeholder="Example: Great for lectures, harder for exams" value={draft.recommendationReason} onChange={(event) => updateDraft("recommendationReason", event.target.value)} />
              </div>
            ) : null}

            <div className="review-section-heading">Class experience</div>
            <ReviewSelect label="Attendance policy" value={draft.attendancePolicy} placeholder="Choose attendance policy" options={["Required", "Sometimes checked", "Not important", "Not sure"]} onChange={(value) => updateDraft("attendancePolicy", value)} />
            <ReviewSelect label="Workload" value={draft.workload} placeholder="Choose workload" options={["Light", "Moderate", "Heavy"]} onChange={(value) => updateDraft("workload", value)} />
            <ReviewSelect label="Lecture usefulness" value={draft.lectureUsefulness} placeholder="Choose lecture usefulness" options={["Essential", "Helpful", "Skippable", "Not lecture-based"]} onChange={(value) => updateDraft("lectureUsefulness", value)} />
            <ReviewSelect label="Office hours/help" value={draft.officeHours} placeholder="Choose an option" options={["Helpful", "Available but limited", "Hard to reach", "Did not use"]} onChange={(value) => updateDraft("officeHours", value)} />

            <div className="review-section-heading">Grading and advice</div>
            <ReviewSelect label="Grading style" value={draft.gradingStyle} placeholder="Choose grading style" options={["Exams-heavy", "Projects-heavy", "Assignments-heavy", "Participation-heavy", "Mixed"]} onChange={(value) => updateDraft("gradingStyle", value)} />
            <ReviewSelect label="Exam difficulty" value={draft.examDifficulty} placeholder="Choose exam difficulty" options={["Easier than class material", "Matches class material", "Harder than class material", "No exams"]} onChange={(value) => updateDraft("examDifficulty", value)} />
            <ReviewSelect label="Grading transparency" value={draft.gradingTransparency} placeholder="Choose grading transparency" options={["Rubric is clear", "Somewhat clear", "Unclear"]} onChange={(value) => updateDraft("gradingTransparency", value)} />
            <ReviewSelect label="Feedback quality" value={draft.feedbackQuality} placeholder="Choose feedback quality" options={["Helpful", "Minimal", "None", "Not applicable"]} onChange={(value) => updateDraft("feedbackQuality", value)} />

            <div className="review-field full">
              <label htmlFor="review-note">Additional comments (optional)</label>
              <textarea id="review-note" maxLength={5000} value={draft.studentNote} onChange={(event) => updateDraft("studentNote", event.target.value)} />
            </div>
            <label className="review-anonymous-option">
              <span className="review-anonymous-copy"><strong>Post anonymously</strong><small>Your name and profile photo won’t appear with this review.</small></span>
              <input type="checkbox" checked={draft.isAnonymous} onChange={(event) => updateDraft("isAnonymous", event.target.checked)} />
            </label>
            <button className="review-submit-button" type="submit" disabled={reviewBusy}>{reviewBusy ? "Submitting..." : "Submit Review"}</button>
            {reviewMessage.text ? <p className={`review-form-message is-${reviewMessage.type}`}>{reviewMessage.text}</p> : null}
          </form>
        </div>
      ) : null}

      {reportReview ? (
        <div className="course-report-modal">
          <button className="course-report-backdrop" type="button" aria-label="Close report panel" onClick={() => !reportBusy && setReportReview(null)} />
          <section className="course-report-dialog" role="dialog" aria-modal="true" aria-labelledby="professor-review-report-title">
            <header className="course-report-header">
              <div><p className="course-report-kicker">Content moderation</p><h2 id="professor-review-report-title">Report review</h2><p>Tell us what is wrong with this review. Our moderators will review your report.</p></div>
              <button className="course-report-close" type="button" aria-label="Close report panel" onClick={() => !reportBusy && setReportReview(null)}>×</button>
            </header>
            <form className="course-report-form" onSubmit={submitReport}>
              <label className="course-report-field"><span>Reason for report</span><textarea maxLength={1000} placeholder="Describe the issue with this review..." required value={reportReason} onChange={(event) => setReportReason(event.target.value)} /></label>
              {reportMessage.text ? <p className={`course-report-status ${reportMessage.type}`}>{reportMessage.text}</p> : null}
              <div className="course-report-actions"><button className="course-report-cancel" type="button" disabled={reportBusy} onClick={() => setReportReview(null)}>Cancel</button><button className="course-report-submit" type="submit" disabled={reportBusy}>{reportBusy ? "Submitting..." : "Submit report"}</button></div>
            </form>
          </section>
        </div>
      ) : null}
    </main>
  );
}

function ReviewSelect({
  label,
  value,
  placeholder,
  options,
  onChange,
}: {
  label: string;
  value: string;
  placeholder: string;
  options: string[];
  onChange: (value: string) => void;
}) {
  const id = `review-${label.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
  return (
    <div className="review-field">
      <label htmlFor={id}>{label}</label>
      <select id={id} value={value} onChange={(event) => onChange(event.target.value)}>
        <option value="">{placeholder}</option>
        {options.map((option) => <option key={option}>{option}</option>)}
      </select>
    </div>
  );
}
