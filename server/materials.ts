import { firestore } from "./firebase";
import type { DocumentData, QueryDocumentSnapshot } from "firebase-admin/firestore";

export type Material = ReturnType<typeof serializeMaterial>;
const clean = (v: unknown, length: number) => String(v ?? "").trim().replace(/\s+/g, " ").slice(0, length);
function millis(value: unknown): number {
  if (!value) return 0;
  if (typeof value === "object" && "toMillis" in value && typeof value.toMillis === "function") return value.toMillis() as number;
  if (typeof value === "object" && "seconds" in value && typeof value.seconds === "number") return value.seconds * 1000;
  const date = new Date(value as string).getTime();
  return Number.isFinite(date) ? date : 0;
}
export function serializeMaterialData(id: string, data: DocumentData) {
  const ms = millis(data.createdAt || data.createdAtIso);
  const anonymous = data.isAnonymous === true || clean(data.isAnonymous,10).toLowerCase() === "true";
  return {
    id, courseCode: data.courseCode || "", courseTitle: data.courseTitle || "",
    professor: data.professor || "", semester: data.semester || "",
    materialType: data.materialType || data.type || data.category || "",
    uploadGroupId: data.uploadGroupId || "", title: data.title || "",
    fileName: data.fileName || "", fileUrl: "",
    downloadUrl: id ? "/api/course-material-download?id=" + encodeURIComponent(id) : "",
    fileId: "", size: Number(data.size || 0), fileType: data.fileType || "",
    status: data.status === "rejected" ? "rejected" : "approved",
    isAnonymous: anonymous, uploaderUid: anonymous ? "" : (data.uploaderUid || ""),
    uploaderDisplayName: anonymous ? "Anonymous student" : (data.uploaderDisplayName || "AUC student"),
    uploaderPhotoURL: anonymous ? "" : (data.uploaderPhotoURL || ""),
    createdAt: ms ? new Date(ms).toISOString() : (data.createdAtIso || "")
  };
}
const serializeMaterial=(doc:QueryDocumentSnapshot)=>serializeMaterialData(doc.id,doc.data());
export async function courseMaterials(courseCode:string):Promise<Material[]> {
  const snapshot=await firestore().collection("courseMaterials").where("courseCode","==",courseCode).limit(100).get();
  return snapshot.docs.map(serializeMaterial).filter(x=>x.status!=="rejected")
    .sort((a,b)=>millis(b.createdAt)-millis(a.createdAt));
}
export async function randomCourseMaterials(limit:unknown):Promise<Material[]> {
  const cap=Math.max(1,Math.min(12,Math.floor(Number(limit)||6)));
  const snapshot=await firestore().collection("courseMaterials").get();
  const grouped=new Map<string,Material>();
  snapshot.forEach(doc=>{
    const item=serializeMaterial(doc);
    if(item.status==="rejected")return;
    const key=clean(item.uploadGroupId,80)||item.id;
    const previous=grouped.get(key);
    if(!previous||millis(item.createdAt)>millis(previous.createdAt))grouped.set(key,item);
  });
  const results=[...grouped.values()];
  for(let i=results.length-1;i>0;i--){
    const j=Math.floor(Math.random()*(i+1));
    [results[i],results[j]]=[results[j],results[i]];
  }
  return results.slice(0,cap);
}
export async function userMaterials(uid:string):Promise<Material[]>{
  const snapshot=await firestore().collection("courseMaterials")
    .where("uploaderUid","==",uid).limit(200).get();
  return snapshot.docs.map(serializeMaterial).filter(item=>item.status!=="rejected")
    .sort((a,b)=>millis(b.createdAt)-millis(a.createdAt));
}

export async function getOwnedMaterial(materialId:string,uid:string){
  if(!/^[A-Za-z0-9_-]{1,160}$/.test(materialId)){
    const error=new Error("Course material not found.") as Error & {statusCode:number};
    error.statusCode=404;throw error;
  }
  const ref=firestore().collection("courseMaterials").doc(materialId);
  const snapshot=await ref.get();
  if(!snapshot.exists){
    const error=new Error("Course material not found.") as Error & {statusCode:number};
    error.statusCode=404;throw error;
  }
  const data=snapshot.data()||{};
  if(clean(data.uploaderUid,160)!==uid){
    const error=new Error("You cannot manage this course material.") as Error & {statusCode:number};
    error.statusCode=403;throw error;
  }
  if(data.status==="rejected"){
    const error=new Error("Course material not found.") as Error & {statusCode:number};
    error.statusCode=404;throw error;
  }
  return {ref,data};
}
