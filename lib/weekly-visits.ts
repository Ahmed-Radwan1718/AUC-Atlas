"use client";

const WEEKLY_VISIT_CACHE_KEY = "aucAtlasWeeklyVisitCache";
const WEEKLY_VISIT_CACHE_DURATION_MS = 30 * 60 * 1000;

let weeklyVisitRequest: Promise<number | null> | null = null;

function clearLegacyUniqueVisitorId() {
  try {
    window.localStorage.removeItem("aucAtlasVisitorId");
  } catch {
    // Local storage is unavailable.
  }

  try {
    window.sessionStorage.removeItem("aucAtlasVisitorId");
  } catch {
    // Session storage is unavailable.
  }
}

function getCachedWeeklyVisitCount() {
  try {
    const cached = JSON.parse(
      window.sessionStorage.getItem(WEEKLY_VISIT_CACHE_KEY) || "null"
    ) as { savedAt?: unknown; weeklyVisits?: unknown } | null;
    const savedAt = Number(cached?.savedAt);
    const weeklyVisits = Number(cached?.weeklyVisits);

    if (
      !cached ||
      !Number.isFinite(savedAt) ||
      Date.now() - savedAt > WEEKLY_VISIT_CACHE_DURATION_MS ||
      !Number.isFinite(weeklyVisits)
    ) {
      return null;
    }

    return Math.max(0, weeklyVisits);
  } catch {
    return null;
  }
}

function cacheWeeklyVisitCount(weeklyVisits: number) {
  try {
    window.sessionStorage.setItem(
      WEEKLY_VISIT_CACHE_KEY,
      JSON.stringify({
        savedAt: Date.now(),
        weeklyVisits
      })
    );
  } catch {
    // Session storage is unavailable.
  }
}

export function trackWeeklyVisit() {
  if (weeklyVisitRequest) {
    return weeklyVisitRequest;
  }

  clearLegacyUniqueVisitorId();

  const cachedWeeklyVisits = getCachedWeeklyVisitCount();

  if (cachedWeeklyVisits !== null) {
    window.aucAtlasWeeklyVisits = cachedWeeklyVisits;
    weeklyVisitRequest = Promise.resolve(cachedWeeklyVisits);
    window.aucAtlasWeeklyVisitsPromise = weeklyVisitRequest;
    return weeklyVisitRequest;
  }

  weeklyVisitRequest = fetch("/api/weekly-visitors", {
    method: "POST",
    credentials: "same-origin",
    cache: "no-store",
    headers: {
      Accept: "application/json"
    }
  })
    .then(async (response) => {
      if (!response.ok) {
        throw new Error("Could not update weekly visits.");
      }

      return (await response.json()) as { weeklyVisits?: unknown };
    })
    .then((data) => {
      const weeklyVisits = Math.max(0, Number(data.weeklyVisits) || 0);
      window.aucAtlasWeeklyVisits = weeklyVisits;
      cacheWeeklyVisitCount(weeklyVisits);
      return weeklyVisits;
    })
    .catch(() => null);

  window.aucAtlasWeeklyVisitsPromise = weeklyVisitRequest;
  return weeklyVisitRequest;
}

declare global {
  interface Window {
    aucAtlasWeeklyVisits?: number;
    aucAtlasWeeklyVisitsPromise?: Promise<number | null>;
  }
}
