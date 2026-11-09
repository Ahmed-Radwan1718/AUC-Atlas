# Administrator dashboard migration

The original `admin.html`, `admin.js`, `api/admin.js`, and
`server/_lib/adminHelpers.js` are the reference implementation.
The original repository must remain read-only.

## Routes and architecture

- `/admin` renders the original dashboard layout and styles in a Next.js client
  component. The original interaction logic is preserved in
  `features/admin/adminRuntime.ts` and runs after the page mounts.
- `/api/admin` is an explicitly whitelisted route in the existing server-only
  `app/api/[auth]/route.ts` bridge. It invokes the preserved original server
  handler in `server/auth-legacy/routes/admin.js`.
- `server/auth-legacy/_lib/adminHelpers.js` is the original administrator
  authorization implementation. It uses the existing site session, checks the
  `ADMIN_UIDS` allowlist or Firebase custom `admin` claim, requires a fresh
  password check, and requires the existing account authenticator when enabled.
- The server stores fresh administrator access records in the original Firestore
  locations. Access tokens are scoped to the active site session and expire.
- Dashboard operations, moderation, user bans, session revocation and audit
  logging retain the original Firestore schema and action names. No new
  dependencies, databases or third-party services are introduced.

## Configuration

Reuse the original Firebase and security environment settings from
`.env.example`. Where the original relied on explicit administrator IDs,
set `ADMIN_UIDS` to the existing account UIDs in the deployment environment.
Alternatively, retain the original Firebase `admin: true` custom claims.
Do not commit UID lists or credentials to the repository.

## Verification

CI checks that `/admin` renders and that anonymous GET/POST requests to
`/api/admin` are denied. These checks do **not** validate real administrator
credentials, Firebase data, or privileged mutations.

Before production rollout, test with an explicitly provisioned disposable
administrator account and separately with a normal student account:

1. Anonymous and non-admin access is denied; never send dashboard data.
2. Admin password confirmation succeeds only for the signed-in admin.
3. An enabled authenticator requires a valid fresh six-digit code; invalid
   and expired challenges fail and are rate-limited.
4. Admin access expires and cannot be reused after site-session revocation.
5. Existing users, reviews, materials, reports, and audit logs display correctly.
6. Review deletion, material approval/deletion, report resolution, ban/unban,
   and session revocation produce the original Firestore updates and audit logs.
7. Compare dashboard desktop/mobile layouts, pagination, filters, overlays,
   keyboard interactions, and toast/confirmation behavior against the original.
8. Check moderation endpoints and notifications under actual deployment
   security headers and verified production-equivalent configuration.

The UI runtime intentionally remains DOM-driven and `@ts-nocheck` for exact
behavioral parity with the original. It is an isolated compatibility module;
a typed React refactor should be handled separately with browser regression
tests, not combined with sensitive backend migration.
