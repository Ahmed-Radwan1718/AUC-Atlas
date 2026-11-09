import { NextRequest, NextResponse } from "next/server";
import type { DocumentData } from "firebase-admin/firestore";
import { firestore, firebaseAuth } from "../../../server/firebase";
import { optionalSessionUser } from "../../../server/session";
import { consumeRateLimit, RateLimitError } from "../../../server/security";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type IndexedMaterial = { id: string; data: DocumentData; createdAtMillis: number };
let cache: { expiresAt: number; materials: IndexedMaterial[] } = { expiresAt: 0, materials: [] };
function clean(value: unknown, length: number): string {
  return String(value || "").trim().replace(/\s+/g, " ").slice(0, length);
}
function normalize(value: unknown) {
  return clean(value, 500).toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}
function timestampMillis(value: unknown): number {
  if (!value) return 0;
  if (typeof value === "object" && "toMillis" in value && typeof value.toMillis === "function") return value.toMillis() as number;
  if (typeof value === "object" && "seconds" in value && typeof value.seconds === "number") return value.seconds * 1000;
  const parsed = new Date(value as string).getTime();
  return Number.isFinite(parsed) ? parsed : 0;
}
function scoreMaterial(query: string, data: DocumentData) {
  const q = normalize(query);
  const terms = q.split(/\s+/).filter(Boolean);
  const title = normalize(data.title);
  const code = normalize(data.courseCode);
  const text = normalize([data.title, data.courseCode, data.courseTitle, data.professor,
    data.semester, data.materialType || data.type || data.category, data.fileName].join(" "));
  if (!terms.length || !terms.every(term => text.includes(term))) return -1;
  let score = title === q ? 500 : title.startsWith(q) ? 300 : title.includes(q) ? 180 : 0;
  if (code === q) score += 260;
  else if (code.startsWith(q)) score += 140;
  if (text.includes(q)) score += 80;
  return score;
}
async function materialIndex(): Promise<IndexedMaterial[]> {
  if (cache.expiresAt > Date.now()) return cache.materials;
  const collection = firestore().collection("courseMaterials");
  let snapshot;
  try {
    snapshot = await collection.where("status", "==", "approved")
      .orderBy("createdAt", "desc").limit(100).get();
  } catch {
    snapshot = await collection.orderBy("createdAt", "desc").limit(100).get();
  }
  const materials: IndexedMaterial[] = snapshot.docs.flatMap(doc => {
    const data = doc.data();
    if (clean(data.status, 40).toLowerCase() !== "approved") return [];
    return [{ id: doc.id, data, createdAtMillis: timestampMillis(data.createdAt || data.createdAtIso) }];
  });
  cache = { expiresAt: Date.now() + 15 * 60 * 1000, materials };
  return materials;
}
export async function GET(request: NextRequest) {
  const query = clean(request.nextUrl.searchParams.get("q"), 100);
  const headers = { "Cache-Control": "no-store" };
  if (query.length < 2) return NextResponse.json({ materials: [], materialsLocked: false }, { headers });
  try {
    const decoded = await optionalSessionUser(request);
    if (!decoded?.uid) return NextResponse.json({ materials: [], materialsLocked: true }, { headers });
    const user = await firebaseAuth().getUser(decoded.uid);
    const email = String(user.email || decoded.email || "").trim().toLowerCase();
    if (!user.emailVerified || !email.endsWith("@aucegypt.edu")) {
      return NextResponse.json({ materials: [], materialsLocked: true }, { headers });
    }
    await consumeRateLimit({
      scope: "material-search-user", identifier: decoded.uid,
      maxAttempts: 20, windowMs: 60 * 1000,
      message: "Too many material searches. Please try again shortly."
    });
    const indexed = await materialIndex();
    const scored = indexed.map(item => ({ ...item, score: scoreMaterial(query, item.data) }))
      .filter(item => item.score >= 0)
      .sort((a,b) => b.score - a.score || b.createdAtMillis - a.createdAtMillis).slice(0, 20)
      .map(item => ({
        id: item.id, title: clean(item.data.title || "Course material", 160),
        courseCode: clean(item.data.courseCode, 40).toUpperCase(),
        courseTitle: clean(item.data.courseTitle, 160),
        professor: clean(item.data.professor, 120),
        semester: clean(item.data.semester, 80),
        materialType: clean(item.data.materialType || item.data.type || item.data.category || "Material", 80),
        score: item.score
      }));
    return NextResponse.json({ materials: scored, materialsLocked: false }, { headers });
  } catch (error) {
    const status = error instanceof RateLimitError ? 429 : 500;
    return NextResponse.json({ error: error instanceof Error ? error.message : "Could not search course materials." },
      { status, headers: { ...headers, ...(error instanceof RateLimitError ? { "Retry-After": String(error.retryAfterSeconds) } : {}) } });
  }
}
