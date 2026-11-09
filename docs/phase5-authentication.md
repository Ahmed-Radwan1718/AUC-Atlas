# Authentication migration (Phase 5)

This phase migrates the original AUC Atlas authentication and account-management UI and its existing security handlers to Next.js. The previous production repository remains read-only.

## Available pages
- `/login`: password, Google popup, email sign-in code, app TOTP challenge, email recovery
- `/signup`: AUC email and ID enrollment, email verification
- `/forgot-password`: Firebase password reset email
- `/accounts`: original account details, activity history, password/security, TOTP enrollment, Google account linking, sessions, uploads and reviews

## Server endpoints
The server-only, whitelisted `app/api/[auth]/route.ts` bridge maps the original security handlers for `login`, `signup`, `logout`, `forgot-password`, `google-auth`, `login-code`, `verify-login-authenticator`, `authenticator`, `sessions`, `change-password`, `delete-account` and `profile-photo`. `/api/me` also uses the original editable profile handler. Other academic endpoints retain their Next.js TypeScript routes.

The original authentication and account-protection logic currently lives inside `server/auth-legacy`, with its behavior preserved during migration. It remains server-only, uses the original Firebase account/session data, and is not a completed native TypeScript rewrite.

## Environment
Copy `.env.example` to `.env.local`; fill in the **existing** project's configuration without committing secrets. Reuse the original `SECURITY_CODE_SECRET` and `TOTP_ENCRYPTION_KEY`. Changing the encryption key prevents existing authenticator secrets from being decrypted; changing the session secret invalidates previously issued session identifiers. The current production settings also require Firebase email/password and Google OAuth providers, verified domains for OAuth, and a configured Resend sender for code delivery.

## Automated checks
`npm run typecheck` and `npm run build` must pass. The GitHub Actions smoke suite serves the production build, checks public/authenticated-page HTML, and checks signed-out/error responses for the auth API without using private credentials.

## Manual tests still required before launch
1. Sign up with a disposable `@aucegypt.edu` test identity; confirm verification email, successful verification, and refusal of unverified login.
2. Test valid password login, invalid-password attempts and rate limiting; inspect `HttpOnly`, `Secure` (on HTTPS), and `SameSite=Lax` session cookies.
3. Test Google connection from My Account, Google login for a previously connected account, and rejection of unlinked Google accounts.
4. Test email sign-in codes, expiry, resends and brute-force throttles.
5. Enable an authenticator, test successful and incorrect TOTP, email recovery, disabling it, and security panel re-authentication.
6. Verify session listing/revocation, logout clearing cookies, password changes, account deletion and profile photo updates.
7. Test owned-review and owned-material modification and data persistence across reloads.
8. Compare each form and modal visually and interactively with the original at desktop/mobile widths.

Passing a build does **not** mean these live-account flows have been verified.
