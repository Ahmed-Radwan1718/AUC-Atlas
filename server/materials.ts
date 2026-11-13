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
  return {
    id, courseCode: data.courseCode || "", courseTitle: data.courseTitle || "",
    professor: data.professor || "", semester: data.semester || "",
    materialType: data.materialType || data.type || data.category || "",
    uploadGroupId: data.uploadGroupId || "", title: data.title || "",
    fileName: data.fileName || "", fileUrl: "",
    downloadUrl: id ? "/api/course-material-download?id=" + encodeURIComponent(id) : "",
    fileId: "", size: Number(data.size || 0), fileType: data.fileType || "",
    status: data.status === "rejected" ? "rejected" : "approved",
    // Uploader identities stay on the server for moderation and ownership.
    createdAt: ms ? new Date(ms).toISOString() : (data.createdAtIso || "")
  };
}
const serializeMaterial=(doc:QueryDocumentSnapshot)=>serializeMaterialData(doc.id,doc.data());
export async function courseMaterials(courseCode:string):Promise<Material[]> {
  const snapshot=await firestore().collection("courseMaterials").where("courseCode","==",courseCode).limit(100).get();
  return snapshot.docs.map(serializeMaterial).filter(x=>x.status!=="rejected")
    .sort((a,b)=>millis(b.createdAt)-millis(a.createdAt));
}
export { randomCourseMaterials } from "./materialDiscovery";
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
