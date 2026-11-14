import { type DocumentData, type Transaction, type QueryDocumentSnapshot } from "firebase-admin/firestore";
import { firestore } from "./firebase";

// The entire rating summary fits in one small Firestore document for the
// existing AUC professor catalog. Reads do not scale with review count.
export type RatingReview = { professorId?: unknown; professorName?: unknown; rating?: unknown };
type Totals = { professorName: string; reviewCount: number; ratedCount: number; ratingTotal: number };
export type RatingSnapshot = { version: 1; ready: true; reviewCount: number; professors: Record<string, Totals> };
export type RatingChange = { before: RatingReview | null; after: RatingReview | null };
const clean = (v: unknown, n: number) => String(v ?? "").trim().replace(/\s+/g," ").slice(0,n);
const ref = () => firestore().collection("professorRatingSummaries").doc("global");
const valid = (v: unknown) => {
  const n = Number(v || 0);
  return Number.isFinite(n) && n >= 1 && n <= 5 ? n : null;
};
export const emptyRatingSnapshot = (): RatingSnapshot =>
  ({ version: 1, ready: true, reviewCount: 0, professors: {} });
function ready(value: DocumentData | undefined): value is RatingSnapshot {
  return Boolean(value && value.version === 1 && value.ready === true &&
    Number.isSafeInteger(value.reviewCount) && value.professors &&
    typeof value.professors === "object" && !Array.isArray(value.professors));
}

// Pure reducer: raw review counts include unrated legacy records, but average
// ratings and the homepage rankings include only ratings between 1 and 5.
export function withRatingChanges(snapshot: RatingSnapshot, changes: RatingChange[]): RatingSnapshot {
  const grouped = new Map(Object.entries(snapshot.professors));
  let reviewCount = snapshot.reviewCount;
  for (const change of changes) {
    for (const [review,delta] of [[change.before,-1],[change.after,1]] as const) {
      if (!review) continue;
      reviewCount += delta;
      const id = clean(review.professorId,80);
      if (!id) continue;
      const row: Totals = { ...(grouped.get(id) || {
        professorName:"",reviewCount:0,ratedCount:0,ratingTotal:0
      }) };
      row.reviewCount += delta;
      const rating = valid(review.rating);
      if (rating !== null) { row.ratedCount += delta; row.ratingTotal += rating * delta; }
      if (delta > 0 && !row.professorName) row.professorName = clean(review.professorName,120);
      if (row.reviewCount <= 0) grouped.delete(id);
      else grouped.set(id,row);
    }
  }
  return {
    version:1,ready:true,reviewCount:Math.max(0,reviewCount),
    professors:Object.fromEntries(grouped)
  };
}

/**
 * The first authenticated ratings request seeds the snapshot in one
 * transaction. Review creates, updates, deletes and account deletions all
 * transact against the same document, so concurrent changes cannot be lost.
 * After initialization, homepage and directory reads cost one document each.
 */
export async function getProfessorRatingSnapshot(): Promise<RatingSnapshot> {
  const summaryRef=ref();
  const existing=await summaryRef.get();
  if (ready(existing.data())) return existing.data() as RatingSnapshot;
  const db=firestore();
  return db.runTransaction(async tx=>{
    const current=await tx.get(summaryRef);
    if (ready(current.data())) return current.data() as RatingSnapshot;
    const reviews=await tx.get(db.collection("professorReviews")
      .select("professorId","professorName","rating"));
    const built=withRatingChanges(emptyRatingSnapshot(),reviews.docs.map((doc:QueryDocumentSnapshot)=>({
      before:null,after:doc.data()
    })));
    tx.set(summaryRef,built);
    return built;
  },{maxAttempts:4});
}

// Must be called INSIDE the same transaction that changes the review docs,
// after all reads and before any writes. If not seeded yet, mark it unready:
// the first reader will build the exact totals from committed reviews.
export async function updateRatingSummaryInTransaction(tx:Transaction,changes:RatingChange[]):Promise<void>{
  if (!changes.length) return;
  const summaryRef=ref();
  const existing=await tx.get(summaryRef);
  const data=existing.data();
  if (!ready(data)) {
    tx.set(summaryRef,{version:1,ready:false},{merge:true});
  } else {
    tx.set(summaryRef,withRatingChanges(data as RatingSnapshot,changes));
  }
}

export function professorDirectorySummaries(snapshot:RatingSnapshot){
  const result:Record<string,{reviewCount:number;averageRating:number}>={};
  for (const [id,row] of Object.entries(snapshot.professors)) {
    result[id]={
      reviewCount:row.reviewCount,
      averageRating:row.ratedCount?Math.round(row.ratingTotal/row.ratedCount*100)/100:0
    };
  }
  return result;
}

export function homepageProfessorRankings(snapshot:RatingSnapshot){
  return Object.entries(snapshot.professors).flatMap(([professorId,row])=>
    row.ratedCount?[{
      professorId,professorName:row.professorName,reviewCount:row.ratedCount,
      averageRating:Math.round(row.ratingTotal/row.ratedCount*100)/100
    }]:[]
  ).sort((a,b)=>b.averageRating-a.averageRating
    || b.reviewCount-a.reviewCount || a.professorName.localeCompare(b.professorName));
}
