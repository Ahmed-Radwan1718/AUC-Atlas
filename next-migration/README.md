# AUC Atlas — incremental Next.js migration

This is an isolated Next.js 16 + TypeScript workspace on the migration branch. It does not replace the existing production HTML/JavaScript deployment.

## Migrated
- `/faq`: all 16 original questions and answers in typed data, React accordion, CSS Module, responsive styling, accessible controls, and reduced-motion support.
- `/faq.html` redirects to `/faq`.
- `/` redirects to `/faq` in this FAQ-only preview.

## Run locally

Requires Node.js >= 20.9.0 (Node 22 recommended).

```bash
cd next-migration
npm install
npm run typecheck
npm run build
npm run dev
```

Open http://localhost:3000/faq. Commit the generated package lockfile before deploying.

## Integration limitations

- Leave the existing Vercel production root and `vercel.json` unchanged until the rest of the pages and APIs are migrated.
- The shared header and footer are temporarily copied as legacy scripts under `public/`; they will be replaced by React/TypeScript components later. Navigation to unmigrated pages opens the live website, and the footer FAQ link opens `/faq`.
- This isolated workspace does not yet implement the auth and analytics API routes (`/api/me`, `/api/logout`, `/api/weekly-visitors`). Account-dependent header behavior and visitor tracking require integration before production cutover.
- FAQ links to privacy and terms open their original live pages until those pages migrate.
- No Firebase credentials, database contents, existing API routes, or original site files were changed.
- Validate keyboard interaction and visual parity in a browser before merging.
