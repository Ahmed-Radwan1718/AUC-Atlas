# Material-directory query index

The materials directory now queries `courseMaterials` by an **exact, uppercase**
`courseCode` and orders the results by `createdAt` descending. This avoids
scanning materials from unrelated courses but requires the following Firestore
composite index in the production database:

| Collection | Query scope | Field | Order |
| --- | --- | --- | --- |
| `courseMaterials` | Collection | `courseCode` | Ascending |
| | | `createdAt` | Descending |

The index definition is recorded in `firestore.indexes.json` and referenced in
`firebase.json`.

**Deployment order matters:** Create and wait for this index to finish building
in Firebase Console > Firestore Database > Indexes **before deploying the API
change**. Otherwise `/api/material-directory` may return HTTP 500 because
Firestore needs an index. Alternatively, use Firebase CLI to deploy indexes
once any existing indexes in the production project have been incorporated
into the index configuration. Do **not** deploy the index file as a replacement
for an existing, larger index set without reconciling that configuration first.

The API now requires `courseCode`; callers without one receive HTTP 400.
Stored material records from the current upload path use uppercase course codes.
Older records with noncanonical course-code casing or whitespace would need a
one-time metadata normalization to be found by the exact query. Legacy type,
category and missing status fields are still handled by the post-query filter.

The in-process directory only scans up to 300 documents **within that course**
per page request when free-text/type/semester filters are sparse. Searches with
many matching uploads can still reach this cap; dedicated normalized filter
fields or a search index would be a further read optimization.

## Scope of savings

This change optimizes only `/api/material-directory`. The current
`/courses/[slug]` detail view uses `/api/course-materials`, which was already
filtered by course. The `MaterialsDirectory` component is currently not
imported by any public page, so deployment alone may not change production
read totals unless callers actually use the directory endpoint.
