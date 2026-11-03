import { NextResponse } from "next/server";
import type { DocumentData } from "firebase-admin/firestore";
import { cleanString, getErrorMessage, getErrorStatus, getTimestampMillis } from "@/lib/server/backend-utils";
import { getAdminAuth, getAdminFirestore } from "@/lib/server/firebase-admin";
import { consumeSecurityRateLimit } from "@/lib/server/rate-limit";
import { getOptionalSiteSessionUser } from "@/lib/server/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MATERIAL_SEARCH_WINDOW_MS = 60 * 1000;
const MATERIAL_SEARCH_MAX_REQUESTS = 20;
const MATERIAL_CACHE_DURATION_MS = 15 * 60 * 1000;

type IndexedMaterial = {
  id: string;
  data: DocumentData;
  createdAtMillis: number;
};

let materialIndexCache: { expiresAt: number; materials: IndexedMaterial[] } = {
  expiresAt: 0,
  materials: [],
};

function normalize(value: unknown): string {
  return cleanString(value, 500)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function getMaterialScore(query: string, data: DocumentData): number {
  const normalizedQuery = normalize(query);
  const terms = normalizedQuery.split(/\s+/).filter(Boolean);
  const title = normalize(data.title);
  const courseCode = normalize(data.courseCode);
  const searchableText = normalize(
    [
      data.title,
      data.courseCode,
      data.courseTitle,
      data.professor,
      data.semester,
      data.materialType || data.type || data.category,
      data.fileName,
    ].join(" "),
  );

  if (!terms.length || !terms.every((term) => searchableText.includes(term))) {
    return -1;
  }

  let score = 0;
  if (title === normalizedQuery) score += 500;
  else if (title.startsWith(normalizedQuery)) score += 300;
  else if (title.includes(normalizedQuery)) score += 180;

  if (courseCode === normalizedQuery) score += 260;
  else if (courseCode.startsWith(normalizedQuery)) score += 140;

  if (searchableText.includes(normalizedQuery)) score += 80;
  return score;
}

async function getMaterialIndex(): Promise<IndexedMaterial[]> {
  if (materialIndexCache.expiresAt > Date.now()) return materialIndexCache.materials;

  const collection = getAdminFirestore().collection("courseMaterials");
  let snapshot;

  try {
    snapshot = await collection
      .where("status", "==", "approved")
      .orderBy("createdAt", "desc")
      .limit(100)
      .get();
  } catch {
    snapshot = await collection.orderBy("createdAt", "desc").limit(100).get();
  }

  const materials: IndexedMaterial[] = [];
  snapshot.forEach((doc) => {
    const data = doc.data() || {};
    if (cleanString(data.status, 40).toLowerCase() !== "approved") return;

    materials.push({
      id: doc.id,
      data,
      createdAtMillis: getTimestampMillis(data.createdAt || data.createdAtIso),
    });
  });

  materialIndexCache = {
    expiresAt: Date.now() + MATERIAL_CACHE_DURATION_MS,
    materials,
  };
  return materials;
}

export async function GET(request: Request) {
  try {
    const query = cleanString(new URL(request.url).searchParams.get("q"), 100);
    const headers = { "Cache-Control": "no-store" };

    if (query.length < 2) {
      return NextResponse.json({ materials: [], materialsLocked: false }, { headers });
    }

    const decodedUser = await getOptionalSiteSessionUser(request, { checkRevoked: true });
    if (!decodedUser?.uid) {
      return NextResponse.json({ materials: [], materialsLocked: true }, { headers });
    }

    const userRecord = await getAdminAuth().getUser(decodedUser.uid);
    const email = String(userRecord.email || decodedUser.email || "").trim().toLowerCase();

    if (!userRecord.emailVerified || !email.endsWith("@aucegypt.edu")) {
      return NextResponse.json({ materials: [], materialsLocked: true }, { headers });
    }

    await consumeSecurityRateLimit({
      scope: "material-search-user",
      identifier: decodedUser.uid,
      maxAttempts: MATERIAL_SEARCH_MAX_REQUESTS,
      windowMs: MATERIAL_SEARCH_WINDOW_MS,
      message: "Too many material searches. Please try again shortly.",
    });

    const materials = (await getMaterialIndex())
      .map((indexedMaterial) => {
        const { data } = indexedMaterial;
        const score = getMaterialScore(query, data);
        if (score < 0) return null;

        return {
          id: indexedMaterial.id,
          title: cleanString(data.title || "Course material", 160),
          courseCode: cleanString(data.courseCode, 40).toUpperCase(),
          courseTitle: cleanString(data.courseTitle, 160),
          professor: cleanString(data.professor, 120),
          semester: cleanString(data.semester, 80),
          materialType: cleanString(
            data.materialType || data.type || data.category || "Material",
            80,
          ),
          score,
          createdAtMillis: indexedMaterial.createdAtMillis,
        };
      })
      .filter((material): material is NonNullable<typeof material> => Boolean(material))
      .sort(
        (a, b) =>
          b.score - a.score || b.createdAtMillis - a.createdAtMillis,
      )
      .slice(0, 20)
      .map(({ createdAtMillis: _createdAtMillis, ...material }) => material);

    return NextResponse.json({ materials, materialsLocked: false }, { headers });
  } catch (error) {
    return NextResponse.json(
      { error: getErrorMessage(error, "Could not search course materials.") },
      { status: getErrorStatus(error), headers: { "Cache-Control": "no-store" } },
    );
  }
}
