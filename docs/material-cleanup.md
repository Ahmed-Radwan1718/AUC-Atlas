# Expired course-material upload cleanup

This restores the original AUC Atlas scheduled cleanup behavior in the Next.js
v2 migration. The original repository was only used as a read-only reference.

## What is scheduled

- Vercel cron invokes `GET /api/cleanup-material-uploads` once per day at
  **03:00 UTC** (`0 3 * * *`). Vercel cron schedules use UTC, and exact
  invocation timing can depend on the Vercel plan.
- The route is implemented as an explicit Next.js Node.js route and uses the
  unchanged original cleanup logic through the server-only authorization bridge.
- The endpoint requires `Authorization: Bearer <CRON_SECRET>`; the original
  handler verifies it with a timing-safe comparison and refuses requests when
  `CRON_SECRET` is missing or shorter than 16 characters. Only GET is accepted.
- Every run scans up to **100** `materialUploadAuthorizations` records whose
  `expiresAt` is at least **15 minutes** in the past. It processes up to **5**
  records concurrently.
- Completed/consumed authorizations have their stale authorization metadata
  removed, **not** the corresponding registered `courseMaterials` file.
- Abandoned, unconsumed authorizations have their pending ImageKit or legacy
  Cloudinary object removed through the existing provider-specific deletion
  helpers. After successful deletion the authorization record is removed, and
  the user's active authorization marker is cleared if it still matches.
- Failed provider deletions are counted and retain metadata for retry on a
  later run; the handler returns JSON counts `scanned`, `filesDeleted`,
  `metadataRemoved`, `skipped`, and `failed`.

## Deployment requirements

1. Deploy **v2** from this repository as a Vercel project. The existing
   connected production project must not be assumed to be v2 without
   verifying its Git repository.
2. Set a strong random `CRON_SECRET` in **that v2 project's Production
   environment** (at least 16 characters; 32+ random bytes recommended).
   Never add the real value to source control or a public URL.
3. Retain the original Firebase Admin SDK credentials, `IMAGEKIT_PRIVATE_KEY`,
   and Cloudinary credentials so cleanup can find/remove the correct objects.
4. Redeploy the production project and verify the job appears in Vercel
   Cron Jobs. Vercel sends the bearer token automatically when
   `CRON_SECRET` is configured. Scheduled jobs run only for production
   deployments.
5. Monitor execution results, especially nonzero `failed` counts. The
   queue is bounded to 100 records per invocation, so a backlog may need
   multiple runs; do not raise concurrency without measuring provider limits.
6. Confirm upload registration and cancellation, completed uploads,
   expired pending uploads, and missing/already-deleted provider files against
   a staging Firebase project before relying on unattended production cleanup.

## Verification

- The GitHub workflow runs a mock-driven unit test suite for authorization,
  method restrictions, expired-file deletion, consumed-record preservation,
  and provider-failure behavior.
- The workflow also verifies unauthorized requests are rejected by the
  real Next.js HTTP route, the `vercel.json` cron path/schedule, and that the
  production build still succeeds.
- These checks do **not** publish the schedule to an actual v2 Vercel project
  or exercise production Firebase and storage credentials.

Do not reintroduce the original `vercel.json` rewrites or security headers:
Next.js handles v2's dynamic professor/course routes, and the response
security headers are already configured in `next.config.ts`.
