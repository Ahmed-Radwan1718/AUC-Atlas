import { FieldValue, Timestamp, type DocumentSnapshot, type QueryDocumentSnapshot } from "firebase-admin/firestore";
import type { DecodedIdToken } from "firebase-admin/auth";
import { firebaseAuth, firestore } from "./firebase";
import { updateRatingSummaryInTransaction } from "./professorRatingSummaries";

type Payload = Record<string, unknown>;
type ReviewData = Record<string, unknown>;
export class ReviewError extends Error {
  constructor(message: string, public readonly statusCode: number, public readonly retryAfterSeconds?: number) {
    super(message);
  }
}
const validChoices: Record<string, string[]> = {
  recommendation: ["Yes", "Depends", "No"],
  attendancePolicy: ["Required", "Sometimes checked", "Not important", "Not sure"],
  workload: ["Light", "Moderate", "Heavy"],
  lectureUsefulness: ["Essential", "Helpful", "Attending means less work at home", "Skippable", "Not lecture-based"],
  officeHours: ["Helpful", "Available but limited", "Hard to reach", "Did not use"],
  gradingStyle: ["Exams-heavy", "Projects-heavy", "Assignments-heavy", "Participation-heavy", "Mixed"],
  examDifficulty: ["Easier than class material", "Matches class material", "Harder than class material", "No exams"],
  gradingTransparency: ["Rubric is clear", "Somewhat clear", "Unclear"],
  feedbackQuality: ["Helpful", "Minimal", "None", "Not applicable"]
};
const clean = (v: unknown, n: number) => String(v ?? "").trim().replace(/\s+/g, " ").slice(0,n);
const note = (v: unknown,n:number) => String(v??"").trim().slice(0,n);
function selected(value: unknown, key: string): string {
  const text=clean(value,80);
  const transformed=key==="gradingTransparency"&&text==="Rubrics clear"?"Rubric is clear":text;
  return validChoices[key].includes(transformed)?transformed:"";
}
function bool(value: unknown): boolean {
  return typeof value==="boolean"?value:clean(value,10).toLowerCase()==="true";
}
function millis(value: unknown) {
  if(!value)return 0;
  if(value instanceof Timestamp)return value.toMillis();
  if(typeof value==="object"&&"seconds" in value&&typeof value.seconds==="number") return value.seconds*1000;
  const time=new Date(value as string).getTime();
  return Number.isFinite(time)?time:0;
}
export function serializeReview(snapshot: QueryDocumentSnapshot | DocumentSnapshot): Record<string,unknown> {
  const d=(snapshot.data()||{}) as ReviewData;
  const createdAt=millis(d.createdAt);
  const anonymous=bool(d.isAnonymous);
  return {
    id:snapshot.id,
    professorId:d.professorId||"", professorName:d.professorName||"",
    courseTaken:clean(d.courseCode||d.courseTaken,60).toUpperCase(),
    courseCode:clean(d.courseCode||d.courseTaken,60).toUpperCase(),
    semesterTaken:d.semesterTaken||"", rating:Number(d.rating||0),
    recommendation:d.recommendation||"", recommendationReason:d.recommendationReason||"",
    attendancePolicy:d.attendancePolicy||"", workload:d.workload||"",
    lectureUsefulness:d.lectureUsefulness||"", officeHours:d.officeHours||"",
    gradingStyle:d.gradingStyle||"", examDifficulty:d.examDifficulty||"",
    gradingTransparency:d.gradingTransparency==="Rubrics clear"?"Rubric is clear":(d.gradingTransparency||""),
    feedbackQuality:d.feedbackQuality||"", studentNote:d.studentNote||"",
    isAnonymous:anonymous,
    authorName:anonymous?"Anonymous student":(d.authorName||"AUC student"),
    authorPhotoURL:anonymous?"":(d.authorPhotoURL||""),
    createdAt:createdAt?new Date(createdAt).toISOString():(d.createdAtIso||"")
  };
}
export function buildFields(payload: Payload, existing: Payload = {}): ReviewData {
  const get=(key:string)=>Object.prototype.hasOwnProperty.call(payload,key)?payload[key]:existing[key];
  const recommendation=selected(get("recommendation"),"recommendation");
  const courseCode=clean(get("courseCode")||get("courseTaken"),60).toUpperCase();
  return {
    professorId:clean(existing.professorId||payload.professorId,80),
    professorName:clean(existing.professorName||payload.professorName,120),
    courseCode,courseTaken:courseCode, semesterTaken:clean(get("semesterTaken"),60),
    isAnonymous:bool(get("isAnonymous")),rating:Number(get("rating")||0),
    recommendation, recommendationReason:recommendation==="Depends"?note(get("recommendationReason"),5000):"",
    attendancePolicy:selected(get("attendancePolicy"),"attendancePolicy"),
    workload:selected(get("workload"),"workload"),
    lectureUsefulness:selected(get("lectureUsefulness"),"lectureUsefulness"),
    officeHours:selected(get("officeHours"),"officeHours"),
    gradingStyle:selected(get("gradingStyle"),"gradingStyle"),
    examDifficulty:selected(get("examDifficulty"),"examDifficulty"),
    gradingTransparency:selected(get("gradingTransparency"),"gradingTransparency"),
    feedbackQuality:selected(get("feedbackQuality"),"feedbackQuality"),
    studentNote:note(get("studentNote"),5000)
  };
}
export function validateFields(value: ReviewData) {
  if(!value.professorId||!value.professorName) throw new ReviewError("Professor not found.",400);
  if(!value.courseTaken) throw new ReviewError("Please enter the course taken.",400);
  if(!value.semesterTaken) throw new ReviewError("Please enter the semester taken.",400);
  if(!Number.isInteger(value.rating)||Number(value.rating)<1||Number(value.rating)>5)
    throw new ReviewError("Please choose a star rating.",400);
  if(!value.recommendation)throw new ReviewError("Please choose a recommendation.",400);
  if(value.recommendation==="Depends"&&!value.recommendationReason)
    throw new ReviewError("Please explain what it depends on.",400);
}
export async function authorProfile(user:DecodedIdToken) {
  const record=await firebaseAuth().getUser(user.uid);
  const snapshot=await firestore().collection("users").doc(user.uid).get();
  const d=snapshot.data()||{};
  const email=record.email||d.email||user.email||"";
  return {
    authorName:clean(d.fullName||record.displayName||email.split("@")[0]||"AUC student",80),
    authorPhotoURL:clean(d.photoURL||record.photoURL||"",500)
  };
}
const byDate=(a:Record<string,unknown>,b:Record<string,unknown>)=>millis(b.createdAt)-millis(a.createdAt);
export async function professorReviews(id:string) {
  const snapshot=await firestore().collection("professorReviews").where("professorId","==",id).limit(100).get();
  return snapshot.docs.map(serializeReview).sort(byDate);
}
export async function courseReviews(code:string) {
  const collection=firestore().collection("professorReviews"),result=new Map<string,Record<string,unknown>>();
  const [current,legacy]=await Promise.all([
    collection.where("courseCode","==",code).limit(100).get(),
    collection.where("courseTaken","==",code).limit(100).get()
  ]);
  for(const snapshot of [current,legacy])snapshot.forEach(doc=>result.set(doc.id,serializeReview(doc)));
  return [...result.values()].sort(byDate);
}
export async function authorReviews(uid:string) {
  const collection=firestore().collection("professorReviews"),result=new Map<string,Record<string,unknown>>();
  const [current,legacy]=await Promise.all([
    collection.where("authorUid","==",uid).limit(100).get(),
    collection.where("authorUserId","==",uid).limit(100).get()
  ]);
  for(const snapshot of [current,legacy])snapshot.forEach(doc=>result.set(doc.id,serializeReview(doc)));
  return [...result.values()].sort(byDate);
}
export async function ownedReview(id:string,uid:string) {
  const ref=firestore().collection("professorReviews").doc(id);
  const snapshot=await ref.get();const data=snapshot.data()||{};
  if(!snapshot.exists || (data.authorUid!==uid&&data.authorUserId!==uid))
    throw new ReviewError("You do not have permission to change that review.",403);
  return {ref,data};
}
export async function submitReview(user:DecodedIdToken,fields:ReviewData,reviewData:ReviewData){
  const db=firestore(),collection=db.collection("professorReviews");
  const ref=collection.doc(),limitRef=db.collection("users").doc(user.uid)
    .collection("reviewSubmissionLimits").doc("hourly");
  const existing=collection.where("professorId","==",fields.professorId).where("authorUid","==",user.uid).limit(5);
  const legacy=collection.where("professorId","==",fields.professorId).where("authorUserId","==",user.uid).limit(5);
  const now=Date.now(),windowMs=60*60*1000;
  await db.runTransaction(async tx=>{
    const [limit,old,newer]=await Promise.all([tx.get(limitRef),tx.get(existing),tx.get(legacy)]);
    const ids=new Set([...old.docs,...newer.docs].map(d=>d.id));
    if(ids.size>=5)throw new ReviewError("You can leave a maximum of 5 reviews for each professor.",409);
    const d=limit.data()||{},started=millis(d.windowStartedAt),active=started>0&&now<started+windowMs;
    const count=active?Math.max(0,Number(d.count||0)):0;
    if(active&&count>=35)throw new ReviewError("Too many reviews submitted. Please try again later.",429,
      Math.ceil((started+windowMs-now)/1000));
    const current=active?started:now;
    await updateRatingSummaryInTransaction(tx,[{before:null,after:reviewData}]);
    tx.set(limitRef,{count:count+1,windowStartedAt:Timestamp.fromMillis(current),
      lastSubmissionAt:FieldValue.serverTimestamp(),expiresAt:Timestamp.fromMillis(current+windowMs)});
    tx.set(ref,reviewData);
  });
  return ref;
}
