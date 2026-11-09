# FAQ page and sitemap migration

The original public FAQ page has been restored at `/faq` in the Next.js
application, preserving its 16 questions and answers, visual styles, accessible
accordion buttons, and 440 ms open / 320 ms close animations. Users who prefer
reduced motion receive instantaneous expansion. The FAQ's privacy and terms
links now use v2's actual route paths.

The FAQ HTML is server-rendered for accessibility and indexing. Its CSS classes
are prefixed `faq-` so they cannot interfere with the existing Terms and
Privacy pages, which also use the original `info-` classes.

## Sitemap: live v2 routes rather than obsolete URLs

The original `sitemap.xml` listed legacy `.html` routes, as well as several
informational pages which are absent in v2. Copying it verbatim would advertise
broken pages. The Next.js `app/sitemap.ts` generates
`https://aucatlas.com/sitemap.xml` directly from the current public
catalog. It includes:

- The homepage, professors, courses, GPA calculator, degree progression,
  FAQ, privacy, and terms.
- Every public professor profile by its existing ID-based slug.
- Every unique course page by the same canonical course-code slug used by
  the UI. Duplicate catalog codes are deduplicated automatically.

It deliberately does not list account, authentication, administrator, API,
or retired `.html` pages. It does not invent `lastmod` dates.

The accompanying `app/robots.ts` advertises the canonical sitemap via
`/robots.txt` and asks search engines not to crawl private/auth/admin/API
paths. Robots directives are not an access-control mechanism: server
authorization still protects private resources.

## Validation and deployment

GitHub Actions verifies the FAQ route, its content and last answer,
`/sitemap.xml`, `/robots.txt`, the presence of representative professor and
course URLs, unique sitemap entries, the absence of private/legacy URLs, and
the existing application typecheck/build and API smoke tests.

The canonical site origin matches the original sitemap:
`https://aucatlas.com`. If the production domain changes, update it in
`app/sitemap.ts` and `app/robots.ts` together. After deploying the v2
site to its verified production project, inspect the generated sitemap and
submit `https://aucatlas.com/sitemap.xml` to Google Search Console.

Source-level and HTTP tests do not replace interactive browser QA of the FAQ
accordion, especially animation interruption and small-screen rendering.
