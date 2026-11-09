# Deployment security configuration

This migration restores the security-related response headers from the original
AUC Atlas Vercel configuration through **Next.js** `next.config.ts` instead of
copying a legacy `vercel.json`. The legacy file also contains a scheduled cleanup
job and HTML rewrites, neither of which should be blindly imported into v2.
Next.js already serves the dynamic professor and course routes natively.

## What is enforced

- Content Security Policy (CSP): self-hosted resources by default; blocks
  browser plugins/object embeds; restricts where pages can be framed and where
  forms submit; limits external scripts, styles, images, connections, media,
  iframes, workers, and manifests.
- The allowlists retain Firebase/Google authentication popups, Cloudinary
  profile photos/uploads, ImageKit uploads/delivery, and existing AUC/faculty
  image sources. If `IMAGEKIT_URL_ENDPOINT` is a custom HTTPS delivery
  domain, the build includes its origin in the CSP. Rebuild after changing it.
- In production, CSP excludes `'unsafe-eval'`. Development allows eval
  for Next.js Fast Refresh and websocket connections for HMR.
- Existing legacy UI and Next.js hydration require `'unsafe-inline'` for
  scripts/styles. Reducing these exceptions to nonce/hash-based enforcement
  is a separate, browser-tested migration.
- `X-Content-Type-Options: nosniff`, strict cross-origin referrer policy,
  `Cross-Origin-Opener-Policy: same-origin-allow-popups` (compatible with
  Google/Firebase sign-in), restrictive browser `Permissions-Policy`,
  `X-Frame-Options: SAMEORIGIN`, and 1-year HTTPS HSTS with subdomains.
- The administrator page is marked not indexable. The admin and account
  pages request private no-store caching; note that Next.js may control cache
  headers on static pages independently.

All these response headers apply to pages and API responses through Next.js.
The shared CI workflow smoke-tests representative page and API responses.

## Firestore rules: restored, not automatically deployed

`firestore.rules` and `firebase.json` are exact copies of the original site's
deny-all rules. Direct Firebase client SDK reads/writes are denied across all
collections, including for authenticated users. The site's server-only Firebase
Admin SDK is expected to perform authenticated operations after app-level
authorization, and bypasses Firestore rules. **This does not restrict service
account access; keep Admin SDK credentials private and IAM permissions scoped.**

Committing these files to GitHub or deploying Next.js to Vercel does **not**
publish Firestore rules to the live Firebase project. Before deploying rules:

1. Check the active Firebase project in the console and compare its live
   Firestore rules with this repository's source; do not overwrite intentional
   independent changes without approval.
2. Confirm the deployed site does not rely on direct client Firestore
   reads/writes. The migrated application is designed to use server APIs.
3. Test with the Firebase emulator against a staging project where possible,
   including anonymous and signed-in client SDK requests.
4. With the correct project selected and Firebase CLI installed, deploy
   intentionally using `firebase deploy --only firestore:rules --project <id>`.
   Then verify the published rules in the Firebase console.

Do not set up automated rules publishing using unverified service accounts.

## Browser acceptance checks (not covered by CI)

Test the production/staging deployment with the browser console open for CSP
violations:

- Google/Firebase popup authentication and recovery
- Admin password verification and authenticator challenge
- Professor portraits (including AUC, ASU and MENA Observatory images)
- ImageKit uploads and delivery, Cloudinary profile photo upload, and file
  previews/downloads (including Microsoft Office preview in a new tab)
- Search, reviews, degree progression, and account updates

If a specific CSP block occurs, add only the required verified origin and
test again. Do not replace CSP with permissive wildcards. HSTS only takes
effect in browsers over HTTPS; confirm your actual domain and subdomains use
HTTPS before rollout.
