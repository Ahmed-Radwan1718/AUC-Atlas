import { NextRequest, NextResponse } from "next/server";
import type { QueryDocumentSnapshot } from "firebase-admin/firestore";
import { firestore } from "../../../server/firebase";
import { optionalSessionUser } from "../../../server/session";
import { verifiedMaterialUser, MaterialUploadError } from "../../../server/materialUpload";
import { serializeMaterialData } from "../../../server/materials";
import { consumeRateLimit, RateLimitError } from "../../../server/security";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const headers = { "Cache-Control": "private, no-store" };
const pageSize = 24;
const batchSize = pageSize + 1;
// Keep a scan budget for legacy type/semester fields and free-text filtering.
// Every batch is restricted to the selected course in Firestore.
const maxScannedPerPage = 300;
const materialTypes = new Set([
  "notes", "slides", "syllabus", "past exam", "practice sheet",
  "lab file", "past assignments", "review sheet"
]);
const clean = (value: unknown, max: number) => String(value ?? "").trim().replace(/\s+/g," ").slice(0,max);
const normalize = (value: unknown) => clean(value,500).toLowerCase().replace(/[^a-z0-9]+/g," ").trim();

function matchesMaterial(data: Record<string,unknown>, terms: string[], type: string, semester: string, courseCode: string) {
  if (clean(data.status,40).toLowerCase() === "rejected") return false;
  if (courseCode && normalize(data.courseCode) !== courseCode) return false;
  if (type && normalize(data.materialType || data.type || data.category) !== type) return false;
  if (semester && normalize(data.semester) !== semester) return false;
  if (!terms.length) return true;
  const content = normalize([
    data.title, data.fileName, data.courseCode, data.courseTitle, data.professor,
    data.semester, data.materialType || data.type || data.category
  ].join(" "));
  return terms.every(term => content.includes(term));
}

export async function GET(request: NextRequest) {
  const user = await optionalSessionUser(request);
  if (!user) return NextResponse.json({
    error: "Sign in with a verified AUC account to browse materials.", materialsLocked: true
  }, { status: 401, headers });

  try {
    const params = request.nextUrl.searchParams;
    // Uploads store canonical uppercase course codes. Require a course so the
    // directory cannot accidentally scan materials belonging to everyone.
    const courseCode = clean(params.get("courseCode"), 40).toUpperCase();
    if (!courseCode) return NextResponse.json({
      error: "Select a course before browsing materials."
    }, { status: 400, headers });

    const rawQuery = clean(params.get("q"), 100);
    const terms = normalize(rawQuery).split(/\s+/).filter(Boolean);
    const rawType = normalize(params.get("type"));
    const type = rawType && materialTypes.has(rawType) ? rawType : "";
    const semester = normalize(clean(params.get("semester"), 80));
    const cursor = clean(params.get("cursor"), 160);
    if (cursor && !/^[a-zA-Z0-9_-]{1,160}$/.test(cursor))
      return NextResponse.json({ error: "Invalid materials page cursor." }, { status: 400, headers });

    await verifiedMaterialUser(user);
    await consumeRateLimit({
      scope: "material-directory-user", identifier: user.uid,
      maxAttempts: 30, windowMs: 60 * 1000,
      message: "Too many materials requests. Please try again shortly."
    });

    const collection = firestore().collection("courseMaterials");
    // Type/semester may be stored under legacy field names, and older uploads
    // can lack a status. Preserve those records by filtering after the course query.
    const baseQuery = collection.where("courseCode", "==", courseCode)
      .orderBy("createdAt", "desc");
    let after: QueryDocumentSnapshot | null = null;
    if (cursor) {
      const snapshot = await collection.doc(cursor).get();
      if (!snapshot.exists || !snapshot.get("createdAt") ||
          clean(snapshot.get("courseCode"), 40).toUpperCase() !== courseCode)
        return NextResponse.json({
          error: "Materials have changed. Restart your search."
        }, { status: 400, headers });
      after = snapshot as QueryDocumentSnapshot;
    }

    const materials: ReturnType<typeof serializeMaterialData>[] = [];
    let scanned = 0;
    let hasMore = false;
    let lastId = "";

    while (scanned < maxScannedPerPage && materials.length < pageSize) {
      // Fetch at most the remaining visible slots plus one lookahead document.
      // This avoids the old 60-document read when only 24 files are needed.
      const limit = Math.min(batchSize, pageSize - materials.length + 1,
        maxScannedPerPage - scanned);
      const query = after ? baseQuery.startAfter(after) : baseQuery;
      const snapshot = await query.limit(limit).get();
      if (!snapshot.docs.length) break;

      let consumed = 0;
      for (const doc of snapshot.docs) {
        consumed++;
        after = doc;
        lastId = doc.id;
        scanned++;
        if (matchesMaterial(doc.data(), terms, type, semester, courseCode))
          materials.push(serializeMaterialData(doc.id, doc.data()));
        if (materials.length === pageSize) break;
      }

      if (materials.length === pageSize) {
        if (consumed < snapshot.docs.length) {
          // Lookahead is already available; keep the cursor on the last
          // displayed document so the next page does not skip the lookahead.
          hasMore = true;
        } else if (snapshot.docs.length < limit) {
          hasMore = false;
        } else {
          // The last matching file was the batch's final document. Check whether
          // another one exists rather than showing an empty extra page.
          const next = await baseQuery.startAfter(after!).limit(1).get();
          hasMore = next.docs.length > 0;
        }
        break;
      }

      if (snapshot.docs.length < limit) break;
      hasMore = true;
    }

    return NextResponse.json({
      materials,
      hasMore: hasMore && Boolean(lastId),
      nextCursor: hasMore && lastId ? lastId : null
    }, { headers });
  } catch (error) {
    const status = error instanceof MaterialUploadError ? error.statusCode :
      error instanceof RateLimitError ? 429 : 500;
    return NextResponse.json({
      error: error instanceof RateLimitError ? error.message :
        status === 403 ? "Verify your AUC email before browsing materials." :
        status === 500 ? "Could not load study materials." :
        error instanceof Error ? error.message : "Could not load study materials."
    }, { status, headers: {...headers,...(error instanceof RateLimitError
      ? {"Retry-After":String(error.retryAfterSeconds)} : {})} });
  }
}
