# Homepage approved-material Firestore index

## Required before merging/deploying the API changes

In the **AUC-Atlas** Firebase project, open **Cloud Firestore → Database
(default) → Indexes → Manual → Add index → Create structured index**.

Create a **composite collection index** with:

| Property | Value |
| --- | --- |
| Collection ID | `courseMaterials` |
| Field 1 | `status` — Ascending |
| Field 2 | `createdAt` — Descending |
| Query scope | **Collection** |

Firestore may display a third, automatically managed `__name__` field.
Do not add this field manually.

Wait until the **Status** column shows **Enabled**. Keep the existing
`courseCode` ascending + `createdAt` descending index intact.

Once this index is enabled, merge the PR into `main`. The repository records
both composite indexes in `firestore.indexes.json`, but **committing the
file does not create an index in the live Firebase project**.

Do not run an indexes-only Firebase CLI deployment without first reconciling
this file against any indexes already present in production: index deployment
may delete indexes not declared in the configuration.

## Why this index matters

`/api/homepage-overview` queries the three newest approved materials. The
previous missing-index fallback would read up to **20 documents across all
statuses** and filter them in application code. That fallback is removed:
with the index, Firestore returns at most three approved documents. If the
index is missing, the homepage overview returns an error instead of falling
back to an unfiltered scan.

`/api/search-materials` has the same indexed query for the 100 newest
approved materials per warm server instance. Its old unfiltered fallback
has also been removed. Its 15-minute **per-instance** search cache remains
unchanged; this change does not eliminate that separate potential 100-document
read cost on cold instances or expired caches.

Homepage count aggregations, session validation and any other queries remain
separate sources of Firestore billing. Expected read savings depend on how
often production previously hit the fallback. Check Firestore Query Insights
to measure the difference after deployment.
