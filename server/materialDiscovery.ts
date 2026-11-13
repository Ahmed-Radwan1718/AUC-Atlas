// Group-level, randomly ordered material previews. No full collection scans.
import { createHash, randomUUID } from "node:crypto";
import {
  FieldPath, type DocumentData, type DocumentSnapshot,
  type QuerySnapshot, type QueryDocumentSnapshot
} from "firebase-admin/firestore";
import { firestore } from "./firebase";
import { serializeMaterialData, type Material } from "./materials";

const INDEX = "materialDiscovery";
const PROGRESS = "materialDiscoveryState";
const BATCH_SIZE = 32;
const LEASE_MS = 90_000;

const clean = (v: unknown, n = 80) =>
  String(v ?? "").trim().replace(/\s+/g, " ").slice(0, n);
const eligible = (d: DocumentData) => d.status !== "rejected";
const groupKey = (id: string, d: DocumentData) => clean(d.uploadGroupId) || id;
function indexIdentity(group: string) {
  const digest = createHash("sha256").update(group).digest("hex");
  return {
    id: digest,
    randomKey: Number.parseInt(digest.slice(0, 13), 16) / 0x10000000000000
  };
}
function millis(v: unknown): number {
  if (!v) return 0;
  if (typeof v === "object" && "toMillis" in v && typeof v.toMillis === "function")
    return Number(v.toMillis()) || 0;
  if (typeof v === "object" && "seconds" in v && typeof v.seconds === "number")
    return v.seconds * 1000;
  const date = new Date(String(v)).getTime();
  return Number.isFinite(date) ? date : 0;
}

type Choice = { id: string; indexId: string; randomKey: number; sortMillis: number; material: Material };
function choice(doc: QueryDocumentSnapshot<DocumentData>): Choice | null {
  const data = doc.data();
  if (!eligible(data)) return null;
  const key = indexIdentity(groupKey(doc.id, data));
  return {
    id: doc.id, indexId: key.id, randomKey: key.randomKey,
    sortMillis: millis(data.createdAt || data.createdAtIso),
    material: serializeMaterialData(doc.id, data)
  };
}
function newer(a: Choice, b: Choice): boolean {
  return a.sortMillis > b.sortMillis || (a.sortMillis === b.sortMillis && a.id > b.id);
}
function newerThanIndex(a: Choice, current: DocumentData | undefined): boolean {
  return !current || a.sortMillis > Number(current.sortMillis || 0) ||
    (a.sortMillis === Number(current.sortMillis || 0) &&
      a.id > String(current.representativeId || ""));
}
function entry(c: Choice) {
  return {randomKey:c.randomKey,representativeId:c.id,sortMillis:c.sortMillis,material:c.material};
}

// Recompute only the affected upload group after edits, deletion or approval.
export async function refreshMaterialDiscovery(materialId: string, uploadGroupId: unknown) {
  const db = firestore();
  const group = clean(uploadGroupId);
  const indexRef = db.collection(INDEX).doc(indexIdentity(group || materialId).id);
  const materialCollection = db.collection("courseMaterials");
  await db.runTransaction(async tx => {
    const source = group
      ? await tx.get(materialCollection.where("uploadGroupId", "==", group))
      : await tx.get(materialCollection.doc(materialId));
    const docs = group
      ? (source as QuerySnapshot<DocumentData>).docs
      : (source as DocumentSnapshot<DocumentData>).exists
        ? [source as QueryDocumentSnapshot<DocumentData>] : [];
    let selected: Choice | null = null;
    for (const doc of docs) {
      const c = choice(doc);
      if (c && (!selected || newer(c, selected))) selected = c;
    }
    if (selected) tx.set(indexRef, entry(selected));
    else tx.delete(indexRef);
  });
}

// A shared lease and cursor backfill old uploads in 32-document pages. This is
// a one-time process amortized over visits, not a scan on every page load.
async function backfillPage() {
  const db = firestore();
  const stateRef = db.collection(PROGRESS).doc("v1");
  const token = randomUUID();
  const claimed = await db.runTransaction(async tx => {
    const state = (await tx.get(stateRef)).data() || {};
    if (state.complete || Number(state.leaseUntilMs || 0) > Date.now()) return false;
    tx.set(stateRef,{leaseOwner:token,leaseUntilMs:Date.now()+LEASE_MS},{merge:true});
    return true;
  });
  if (!claimed) return;
  await db.runTransaction(async tx => {
    const state = (await tx.get(stateRef)).data() || {};
    if (state.leaseOwner !== token) return;
    const cursor = clean(state.cursor, 180);
    let query = db.collection("courseMaterials").orderBy(FieldPath.documentId()).limit(BATCH_SIZE);
    if (cursor) query = query.startAfter(cursor);
    const source = await tx.get(query);
    const groups = new Map<string,Choice>();
    for (const doc of source.docs) {
      const c = choice(doc);
      if (!c) continue;
      const previous = groups.get(c.indexId);
      if (!previous || newer(c, previous)) groups.set(c.indexId, c);
    }
    const choices = [...groups.values()];
    const indexed = await Promise.all(choices.map(c => tx.get(db.collection(INDEX).doc(c.indexId))));
    // Read everything before writing, and do not overwrite a newer group
    // representative added in an earlier batch or during an upload.
    for (let i=0;i<choices.length;i++) {
      if (newerThanIndex(choices[i], indexed[i].data()))
        tx.set(db.collection(INDEX).doc(choices[i].indexId),entry(choices[i]));
    }
    tx.set(stateRef,{
      cursor:source.docs.at(-1)?.id || cursor, complete:source.size < BATCH_SIZE,
      leaseOwner:"",leaseUntilMs:0
    },{merge:true});
  });
}

export async function randomCourseMaterials(limit: unknown): Promise<Material[]> {
  const count = Math.max(1, Math.min(12, Math.floor(Number(limit) || 6)));
  await backfillPage();
  const query = firestore().collection(INDEX).orderBy("randomKey","asc");
  const first = await query.startAt(Math.random()).limit(count).get();
  const docs = [...first.docs];
  if (docs.length < count) {
    const wrapped = await query.limit(count-docs.length).get();
    docs.push(...wrapped.docs);
  }
  return docs.map(doc => doc.data().material as Material).filter(Boolean).slice(0,count);
}
