import "server-only";

// Match the site's ADMIN_UIDS allowlist and current Firebase admin custom claim.
// Do not trust browser input, profile data or stale session claims.
export function hasCurrentAdminRole(uid: string, claims?: Record<string, unknown>): boolean {
  const safeUid = uid.trim();
  if (!safeUid) return false;
  const allowed = new Set((process.env.ADMIN_UIDS || "").split(/[\s,]+/).map(value => value.trim()).filter(Boolean));
  return allowed.has(safeUid) || claims?.admin === true;
}
