// Deduplicate concurrent reads only. Never retain settled private data or cache it
// across accounts. Each consumer owns its own mounted/abort guard.
type SharedRead = { response: Response; data: unknown };
const pending = new Map<string, { controller: AbortController; promise: Promise<SharedRead> }>();

export function cancelSharedHomepageReads() {
  for (const entry of pending.values()) entry.controller.abort();
  pending.clear();
}

export function readSharedHomepageJson<T>(url: "/api/me" | "/api/academic-progress"): Promise<{ response: Response; data: T }> {
  const existing = pending.get(url);
  if (existing) return existing.promise as Promise<{ response: Response; data: T }>;
  const controller = new AbortController();
  const promise = (async () => {
    const response = await fetch(url, {
      credentials: "same-origin", cache: "no-store", signal: controller.signal,
      headers: { Accept: "application/json" }
    });
    const data: unknown = await response.json().catch(() => ({}));
    if (controller.signal.aborted) throw new Error("Account read cancelled");
    return { response, data };
  })();
  const entry = { controller, promise };
  pending.set(url, entry);
  const release = () => { if (pending.get(url) === entry) pending.delete(url); };
  void promise.then(release, release);
  return promise as Promise<{ response: Response; data: T }>;
}

export type HomepageAccount = { signedIn?: boolean; user?: { major?: string; enrollmentTerm?: string } };
export type HomepageProgress = { degreeProgress?: { major?: string; completedKeys?: string[] } | null };
