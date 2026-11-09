let pending: Promise<number | null> | null = null;
const cacheKey = "aucAtlasMonthlyVisitCache";
const cacheDuration = 30 * 60 * 1000;

function cairoMonth(): string {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Africa/Cairo", year: "numeric", month: "2-digit"
  }).formatToParts(new Date());
  return (parts.find(item => item.type === "year")?.value || "") + "-"
    + (parts.find(item => item.type === "month")?.value || "");
}
function cachedCount(): number | null {
  try {
    const value = JSON.parse(sessionStorage.getItem(cacheKey) || "null");
    const count = Number(value?.monthlyVisits);
    if (!value || value.monthKey !== cairoMonth()
      || !Number.isFinite(Number(value.savedAt))
      || Date.now() - Number(value.savedAt) > cacheDuration || !Number.isFinite(count)) return null;
    return Math.max(0, count);
  } catch { return null; }
}
function track(): Promise<number | null> {
  try {
    localStorage.removeItem("aucAtlasVisitorId");
    sessionStorage.removeItem("aucAtlasVisitorId");
  } catch {}
  if (/\/admin(?:\.html)?\/?$/.test(window.location.pathname)) return Promise.resolve(null);
  const cached = cachedCount();
  if (cached !== null) return Promise.resolve(cached);
  return fetch("/api/weekly-visitors?period=month", {
    method: "POST", credentials: "same-origin", cache: "no-store",
    headers: { Accept: "application/json" }
  }).then(response => {
    if (!response.ok) throw Error("Could not update monthly visits.");
    return response.json();
  }).then(data => {
    const count = Math.max(0, Number(data.monthlyVisits) || 0);
    try {
      sessionStorage.setItem(cacheKey, JSON.stringify({
        savedAt: Date.now(), monthKey: cairoMonth(), monthlyVisits: count
      }));
    } catch {}
    return count;
  }).catch(() => null);
}
export function monthlyVisits(): Promise<number | null> {
  if (!pending) pending = track();
  return pending;
}
export async function homepageMonthlyVisits(): Promise<number | null> {
  const count = await monthlyVisits();
  if (count !== null) return count;
  try {
    const response = await fetch("/api/weekly-visitors?period=month", {
      method: "GET", credentials: "same-origin", cache: "no-store",
      headers: { Accept: "application/json" }
    });
    if (!response.ok) return null;
    const data = await response.json();
    const value = Number(data.monthlyVisits);
    return Number.isFinite(value) ? value : null;
  } catch { return null; }
}
