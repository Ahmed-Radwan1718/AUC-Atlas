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

## Upload abuse controls (v2)

- The upload authorizer requires a verified AUC session and uses a Firestore-backed limit
  of **10 authorization attempts per account per rolling hour**. Cancelled/failed
  attempts still count against this limit.
- A student may have at most **two unexpired, unconsumed upload authorizations**.
  Authorizations are reserved atomically with a per-user limit document, so parallel
  requests cannot bypass the concurrent-upload check.
- The student's **250 MB default storage quota includes registered course materials
  and pending upload sizes**. Five minutes of grace after token expiry remain
  reserved while a successful upload can still be registered.
- ImageKit **V2** upload JWTs bind the authorized filename, fixed
  `/auc-atlas/materials` folder, private-file flag, no-overwrite settings, and
  a server-enforced size check to a short-lived signed token. The private key stays
  server-side. V1 upload signatures are no longer issued.
- Cancelled authorizations stop reserving quota immediately. If a client uploads
  after cancelling (while a previously issued token is still valid), the scheduled
  cleanup will remove the unregistered object after expiry.
- The existing scheduled cleanup continues deleting abandoned files and removing
  consumed authorization metadata. It does not change any registered material.

### Production verification

ImageKit V2 is a provider API change. Before relying on production uploads, test one
PDF and one Office document on a staging ImageKit account, and confirm that exceeding
the signed file-size limit, modifying the upload folder or removing `isPrivateFile`
is rejected by ImageKit. GitHub CI uses mocks, not live ImageKit credentials.

The scheduled cleanup processes at most 100 expired authorizations per daily run.
Monitor `scanned` and `failed` counts as traffic increases; a saturated queue
needs a higher-capacity cleanup strategy or a more frequent schedule where supported.
