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
const batchSize = 60;
// Each request scans a bounded part of the collection, while the cursor
// allows students to continue through older uploads without a 500-file cutoff.
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
    await verifiedMaterialUser(user);
    await consumeRateLimit({
      scope: "material-directory-user", identifier: user.uid,
      maxAttempts: 30, windowMs: 60 * 1000,
      message: "Too many materials requests. Please try again shortly."
    });

    const params = request.nextUrl.searchParams;
    const rawQuery = clean(params.get("q"),100);
    const terms = normalize(rawQuery).split(/\s+/).filter(Boolean);
    // A selected course is an exact filter, not a loose text match that could
    // accidentally include another course with a similar code.
    const courseCode = normalize(clean(params.get("courseCode"),40));
    const rawType = normalize(params.get("type"));
    const type = rawType && materialTypes.has(rawType) ? rawType : "";
    const semester = normalize(clean(params.get("semester"),80));
    const cursor = clean(params.get("cursor"),160);
    if (cursor && !/^[a-zA-Z0-9_-]{1,160}$/.test(cursor))
      return NextResponse.json({error:"Invalid materials page cursor."},{status:400,headers});

    const collection = firestore().collection("courseMaterials");
    let after: QueryDocumentSnapshot | null = null;
    if (cursor) {
      const snapshot = await collection.doc(cursor).get();
      if (!snapshot.exists || !snapshot.get("createdAt"))
        return NextResponse.json({error:"Materials have changed. Restart your search."},{status:400,headers});
      after = snapshot as QueryDocumentSnapshot;
    }

    const materials: ReturnType<typeof serializeMaterialData>[] = [];
    let scanned = 0;
    let hasMore = true;
    let lastId = "";

    while (scanned < maxScannedPerPage && materials.length < pageSize) {
      const limit = Math.min(batchSize,maxScannedPerPage-scanned);
      let query = collection.orderBy("createdAt","desc");
      if (after) query = query.startAfter(after);
      const snapshot = await query.limit(limit).get();
      if (!snapshot.docs.length) { hasMore = false; break; }

      for (const doc of snapshot.docs) {
        after = doc;
        lastId = doc.id;
        scanned++;
        const data = doc.data();
        if (matchesMaterial(data,terms,type,semester,courseCode))
          materials.push(serializeMaterialData(doc.id,data));
        if (materials.length >= pageSize) break;
      }

      if (materials.length >= pageSize) break;
      if (snapshot.docs.length < limit) { hasMore = false; break; }
    }

    return NextResponse.json({
      materials,
      hasMore,
      nextCursor: hasMore ? lastId : null
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
