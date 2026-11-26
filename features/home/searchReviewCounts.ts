export type SearchReviewCounts =
  | { status: "loading" | "locked" | "error" }
  | { status: "ready"; counts: Record<string, number> };

export const SEARCH_REVIEW_SESSION_ENDED = "auc-atlas:search-review-session-ended";

export async function loadSearchReviewCounts(signal: AbortSignal): Promise<SearchReviewCounts> {
  try {
    const response = await fetch("/api/professor-reviews?summaries=true", {
      credentials: "same-origin", cache: "no-store", signal,
      headers: { Accept: "application/json" }
    });
    if (response.status === 401) return { status: "locked" };
    if (!response.ok) return { status: "error" };
    const data = await response.json();
    const summaries = data?.summaries;
    if (!summaries || typeof summaries !== "object" || Array.isArray(summaries)) return { status: "error" };
    const counts: Record<string, number> = Object.create(null);
    for (const [id, summary] of Object.entries(summaries)) {
      const count = (summary as { reviewCount?: unknown } | null)?.reviewCount;
      if (typeof count !== "number" || !Number.isSafeInteger(count) || count < 0) return { status: "error" };
      counts[id] = count;
    }
    return { status: "ready", counts };
  } catch {
    return { status: "error" };
  }
}

export function searchProfessorReviewCount(state: SearchReviewCounts, id: string): number | "locked" | null {
  if (state.status === "locked") return "locked";
  if (state.status !== "ready") return null;
  return Object.hasOwn(state.counts, id) ? state.counts[id] : 0;
}
