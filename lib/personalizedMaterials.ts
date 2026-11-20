type MaterialRecord = {
  id: string;
  data: Record<string, unknown>;
};

export type PersonalizedMaterial = {
  id: string;
  title: string;
  courseCode: string;
  materialType: string;
  createdAt: string;
  href: string;
};

const clean = (value: unknown, max = 160) =>
  String(value ?? "").trim().replace(/\s+/g, " ").slice(0, max);
const codeOf = (value: unknown) => clean(value, 40).toUpperCase();

function timestampMillis(value: unknown): number {
  if (!value) return 0;
  if (typeof value === "object" && value !== null) {
    if ("toMillis" in value && typeof value.toMillis === "function")
      return Number(value.toMillis()) || 0;
    if ("seconds" in value && typeof value.seconds === "number")
      return value.seconds * 1000;
  }
  const n = new Date(value as string).getTime();
  return Number.isFinite(n) ? n : 0;
}

/**
 * Recent uploads from projected courses only. Never show deleted/rejected
 * material, unrelated classes or private uploader data. One card per upload
 * group prevents a multi-file bundle from flooding the homepage.
 */
export function selectPersonalizedMaterials(input: {
  courseCodes: readonly string[];
  records: readonly MaterialRecord[];
  limit?: number;
}): PersonalizedMaterial[] {
  const eligible = new Set(input.courseCodes.map(codeOf));
  if (!eligible.size) return [];

  const count = Math.max(1, Math.min(8, Math.floor(input.limit ?? 4)));
  const sorted = input.records
    .map(record => ({
      ...record,
      ms: timestampMillis(record.data.createdAt || record.data.createdAtIso)
    }))
    .sort((a, b) => b.ms - a.ms || b.id.localeCompare(a.id));

  const groups = new Set<string>();
  const results: PersonalizedMaterial[] = [];

  for (const record of sorted) {
    const data = record.data;
    const courseCode = codeOf(data.courseCode);
    if (!eligible.has(courseCode) || clean(data.status, 30).toLowerCase() === "rejected"
      || !/^[A-Za-z0-9_-]{1,160}$/.test(record.id) || record.ms <= 0) continue;
    const title = clean(data.title || data.fileName, 160);
    if (!title) continue;
    const group = clean(data.uploadGroupId, 180);
    const key = courseCode + "|" + (group || record.id);
    if (groups.has(key)) continue;
    groups.add(key);

    const fileName = clean(data.fileName, 240);
    const isPdf = /\.pdf$/i.test(fileName) || clean(data.fileType, 80).toLowerCase() === "application/pdf";
    results.push({
      id: record.id, title, courseCode,
      materialType: clean(data.materialType || data.type || data.category, 60) || "Material",
      createdAt: new Date(record.ms).toISOString(),
      href: "/api/course-material-download?id=" + encodeURIComponent(record.id)
        + (isPdf ? "&disposition=inline" : "")
    });
    if (results.length >= count) break;
  }
  return results;
}
