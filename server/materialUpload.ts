import { randomBytes, randomUUID, createHmac } from "node:crypto";
import { FieldValue, Timestamp, type DocumentReference, type DocumentData } from "firebase-admin/firestore";
import type { DecodedIdToken } from "firebase-admin/auth";
import { firebaseAuth, firestore } from "./firebase";
import { allowedMime, maxMaterialBytes, safeFileName, MaterialFileError } from "./materialFiles";
import { serializeMaterialData } from "./materials";

export class MaterialUploadError extends Error {
  constructor(message: string, public readonly statusCode: number) { super(message); }
}
const clean = (v: unknown, n: number) => String(v ?? "").trim().replace(/\s+/g, " ").slice(0, n);
const bool = (v: unknown) => typeof v === "boolean" ? v : clean(v, 10).toLowerCase() === "true";
const validTypes = ["Notes", "Slides", "Syllabus", "Past exam", "Practice sheet", "Lab file", "Past assignments", "Review sheet"];
const getType = (v: unknown) => validTypes.find(t => t.toLowerCase() === clean(v, 80).toLowerCase()) || "";
const ext = (filename: string) => (filename.match(/\.([a-z0-9]+)$/i)?.[1] || "").toLowerCase();
const normalizeMime = (v: unknown) => clean(v, 160).split(";")[0].trim().toLowerCase();
const pathPattern = /^\/auc-atlas\/materials\/[a-f0-9]{36}\.(?:pdf|docx?|pptx?|xlsx?|jpe?g|png)$/i;
const idPattern = /^[a-f0-9]{24}$/i;
const authorizationPattern = /^[a-f0-9]{36}$/i;
const mimeFor = (fileName: string) => allowedMime[ext(fileName)] || "";
const maxQuota = () => {
  const value = Number(process.env.COURSE_MATERIAL_USER_QUOTA_BYTES);
  return Number.isSafeInteger(value) && value > 0 ? Math.min(value, 5*1024*1024*1024) : 250*1024*1024;
};
const authTtl = () => {
  const value = Number(process.env.COURSE_MATERIAL_UPLOAD_AUTH_TTL_SECONDS);
  return Number.isSafeInteger(value) && value > 0 ? Math.min(value, 1800) : 900;
};
function imageKitKeys() {
  const publicKey = clean(process.env.IMAGEKIT_PUBLIC_KEY, 200);
  const privateKey = clean(process.env.IMAGEKIT_PRIVATE_KEY, 500);
  const endpoint = clean(process.env.IMAGEKIT_URL_ENDPOINT, 500);
  if (!publicKey || !privateKey || !endpoint || !endpoint.startsWith("https://"))
    throw new MaterialUploadError("ImageKit course-material storage is not configured.", 500);
  return {publicKey, privateKey};
}
export async function verifiedMaterialUser(user: DecodedIdToken) {
  const record = await firebaseAuth().getUser(user.uid);
  const email = clean(record.email || user.email, 240).toLowerCase();
  if (!record.emailVerified || !email.endsWith("@aucegypt.edu"))
    throw new MaterialUploadError("Please verify your AUC email address before accessing course materials.", 403);
  const profile = await firestore().collection("users").doc(user.uid).get();
  const data = profile.data() || {};
  return {uid: user.uid, email, displayName:clean(data.fullName || record.displayName || email.split("@")[0] || "AUC student",80),
    photoURL:clean(data.photoURL || record.photoURL,500)};
}
export async function totalStoredBytes(uid: string) {
  const records = await firestore().collection("courseMaterials").where("uploaderUid","==",uid).get();
  return records.docs.reduce((sum, doc) => {
    const data = doc.data();
    return clean(data.status, 40).toLowerCase() === "rejected" ? sum : sum + Math.max(0, Number(data.size) || 0);
  },0);
}
export async function authorizeMaterial(user: DecodedIdToken, body: Record<string, unknown>) {
  const profile = await verifiedMaterialUser(user);
  const courseCode = clean(body.courseCode, 40).toUpperCase();
  const courseTitle = clean(body.courseTitle, 160);
  const professor = clean(body.professor, 120);
  const semester = clean(body.semester, 80);
  const materialType = getType(body.materialType || body.type || body.category);
  const title = clean(body.title, 160);
  const isAnonymous = bool(body.isAnonymous);
  const fileName = safeFileName(body.fileName);
  const fileType = mimeFor(fileName);
  const fileSize = Number(body.fileSize);
  const maxBytes = maxMaterialBytes();
  if (!courseCode || !professor || !semester || !materialType || !title || !fileType ||
    !Number.isSafeInteger(fileSize) || fileSize <= 0 || fileSize > maxBytes)
    throw new MaterialUploadError("Choose a supported course-material file up to 25MB.",400);
  if (await totalStoredBytes(profile.uid) + fileSize > maxQuota())
    throw new MaterialUploadError("Your course-material storage quota has been reached.",413);

  const {publicKey, privateKey} = imageKitKeys();
  const authorizationId = randomBytes(18).toString("hex");
  const filePath = "/auc-atlas/materials/" + authorizationId + "." + ext(fileName);
  if (!pathPattern.test(filePath)) throw new MaterialUploadError("Could not prepare the ImageKit upload.",400);
  const ttl = authTtl();
  const expire = Math.floor(Date.now()/1000) + ttl;
  const token = randomUUID();
  const signature = createHmac("sha1", privateKey).update(token+expire).digest("hex");
  const date = new Date(expire*1000);
  const db = firestore();
  await db.collection("materialUploadAuthorizations").doc(authorizationId).set({
    authorizationId, uploaderUid:profile.uid, courseCode, courseTitle, professor, semester,
    materialType, title, isAnonymous, fileName, uploadFileName:fileName,
    fileSize, fileType, storageKey:filePath, storageProvider:"imagekit",
    folder:"/auc-atlas/materials", uploaderDisplayName:profile.displayName,
    uploaderPhotoURL:profile.photoURL, createdAt:FieldValue.serverTimestamp(),
    createdAtIso:new Date().toISOString(), expiresAt:Timestamp.fromDate(date),
    consumedAt:null, cancelledAt:null
  });
  return {
    authorizationId, storageKey:filePath, imagekitFilePath:filePath,
    uploadUrl:"https://upload.imagekit.io/api/v1/files/upload",
    publicKey, token, expire, signature,
    uploadParameters:{
      fileName:filePath.split("/").pop(), folder:"/auc-atlas/materials",
      isPrivateFile:"true",useUniqueFileName:"false",overwriteFile:"false"
    },
    fileType, expiresAt:date.toISOString(),
    limits:{maxFileBytes:maxBytes,userQuotaBytes:maxQuota()}
  };
}
function expiryMillis(value: unknown): number {
  if (!value) return 0;
  if (value instanceof Timestamp) return value.toMillis();
  if (typeof value === "object" && "seconds" in value && typeof value.seconds === "number") return value.seconds*1000;
  return Number.isFinite(new Date(String(value)).getTime()) ? new Date(String(value)).getTime() : 0;
}
function validateAuthorization(data: DocumentData, id: string, uid: string) {
  if (clean(data.authorizationId,80)!==id || clean(data.uploaderUid,160)!==uid)
    throw new MaterialUploadError("Could not verify this upload authorization.",403);
  if (data.consumedAt || data.cancelledAt || data.cleanupStartedAt)
    throw new MaterialUploadError("This upload authorization has already been used.",409);
  if (!expiryMillis(data.expiresAt) || expiryMillis(data.expiresAt)+5*60*1000 <= Date.now())
    throw new MaterialUploadError("This upload authorization has expired.",410);
  return data;
}
async function fileMetadata(fileId: string) {
  const {privateKey}=imageKitKeys();
  const response=await fetch("https://api.imagekit.io/v1/files/"+fileId+"/details",{
    headers:{Accept:"application/json", Authorization:"Basic "+Buffer.from(privateKey+":").toString("base64")},
    cache:"no-store"
  });
  if(response.status===404)throw new MaterialUploadError("Could not verify the uploaded course material.",404);
  if(!response.ok)throw new MaterialUploadError("Could not verify the uploaded course material.",502);
  const file=await response.json() as Record<string,unknown>;
  if(file.fileId!==fileId)throw new MaterialUploadError("Could not verify the uploaded course material.",400);
  return file;
}
async function deleteImagekitFile(fileId: string) {
  const {privateKey}=imageKitKeys();
  await fetch("https://api.imagekit.io/v1/files/"+fileId,{
    method:"DELETE", headers:{Authorization:"Basic "+Buffer.from(privateKey+":").toString("base64")},
    cache:"no-store"
  }).catch(()=>null);
}
export async function cancelMaterial(user:DecodedIdToken,body:Record<string,unknown>) {
  const id=clean(body.authorizationId,80);
  if(!authorizationPattern.test(id))return {success:true};
  const ref=firestore().collection("materialUploadAuthorizations").doc(id);
  let filePath="";
  await firestore().runTransaction(async tx=>{
    const snapshot=await tx.get(ref);
    if(!snapshot.exists)return;
    const d=snapshot.data()||{};
    if(d.uploaderUid!==user.uid || d.consumedAt)return;
    filePath=clean(d.storageKey,100);
    tx.set(ref,{cancelledAt:FieldValue.serverTimestamp()},{merge:true});
  });
  if(pathPattern.test(filePath)){
    // Pending uploaded files are deleted after cancellation, only if path identity matches.
    const key=imageKitKeys();
    const name=filePath.split("/").pop();
    const q=new URLSearchParams({path:"/auc-atlas/materials/",name:name||"",limit:"100"});
    const response=await fetch("https://api.imagekit.io/v1/files?"+q,{
      headers:{Authorization:"Basic "+Buffer.from(key.privateKey+":").toString("base64")},
      cache:"no-store"
    }).catch(()=>null);
    if(response?.ok){
      const files=await response.json().catch(()=>[]);
      if(Array.isArray(files)){
        for(const file of files)if(file.filePath===filePath && idPattern.test(String(file.fileId)))
          await deleteImagekitFile(String(file.fileId));
      }
    }
  }
  return {success:true};
}
export async function registerMaterial(user:DecodedIdToken,body:Record<string,unknown>) {
  const profile = await verifiedMaterialUser(user);
  const authId=clean(body.uploadAuthorizationId,80);
  const submittedPath=clean(body.imagekitFilePath,100);
  const fileId=clean(body.imagekitFileId,160);
  const group=clean(body.uploadGroupId,80);
  if (!authorizationPattern.test(authId)||!idPattern.test(fileId)||!pathPattern.test(submittedPath))
    throw new MaterialUploadError("Could not verify this upload authorization.",400);
  const db=firestore();
  const authRef=db.collection("materialUploadAuthorizations").doc(authId);
  const snapshot=await authRef.get();
  if(!snapshot.exists)throw new MaterialUploadError("Could not verify this upload authorization.",400);
  const authorized=validateAuthorization(snapshot.data()||{},authId,user.uid);
  const fileName=safeFileName(authorized.fileName);
  const expectedMime=normalizeMime(authorized.fileType);
  const fileSize=Number(authorized.fileSize);
  const storageKey=clean(authorized.storageKey,100);
  if(authorized.storageProvider!=="imagekit" || submittedPath!==storageKey ||
    !expectedMime || mimeFor(fileName)!==expectedMime || !Number.isSafeInteger(fileSize) ||
    fileSize<=0 || fileSize>maxMaterialBytes())
    throw new MaterialUploadError("Could not verify this upload authorization.",400);
  const file=await fileMetadata(fileId);
  const samePath=file.filePath===storageKey;
  const providerMime=normalizeMime(file.mime);
  const providerMimeAllowed=!providerMime||providerMime==="application/octet-stream"||providerMime===expectedMime;
  if(!samePath || file.name!==storageKey.split("/").pop() || file.isPrivateFile!==true ||
    Number(file.size)!==fileSize || !providerMimeAllowed){
    if(samePath)await deleteImagekitFile(fileId);
    throw new MaterialUploadError("The uploaded file type, privacy setting, or size is not allowed.",400);
  }
  const materialRef=db.collection("courseMaterials").doc("imagekit-"+fileId);
  const uploadLimitRef=db.collection("materialUploadLimits").doc(user.uid);
  const materialType=getType(authorized.materialType);
  const isAnonymous=bool(authorized.isAnonymous);
  const createdAtIso=new Date().toISOString();
  const stored:Record<string,unknown>={
    courseCode:clean(authorized.courseCode,40).toUpperCase(),courseTitle:clean(authorized.courseTitle,160),
    professor:clean(authorized.professor,120),semester:clean(authorized.semester,80),
    materialType,uploadGroupId:/^[A-Za-z0-9-]{8,80}$/.test(group)?group:"single-"+authId,
    isAnonymous,title:clean(authorized.title,160),fileName,
    fileUrl:"",filePath:"",fileId, storageKey,storageProvider:"imagekit",
    imagekitFileId:fileId,imagekitFilePath:storageKey,size:fileSize,fileType:expectedMime,
    status:"approved",uploaderUid:user.uid,uploaderDisplayName:profile.displayName,
    uploaderPhotoURL:profile.photoURL,createdAt:FieldValue.serverTimestamp(),createdAtIso
  };
  let previous:DocumentData|null=null;
  await db.runTransaction(async tx=>{
    const [authorization,material,limits]=await Promise.all([
      tx.get(authRef),tx.get(materialRef),tx.get(uploadLimitRef)
    ]);
    validateAuthorization(authorization.data()||{},authId,user.uid);
    if(material.exists){
      const data=material.data()||{};
      if(data.uploaderUid!==user.uid||data.status==="rejected")
        throw new MaterialUploadError("This uploaded file is already registered.",409);
      previous=data;
    }else tx.set(materialRef,stored);
    tx.update(authRef,{
      consumedAt:FieldValue.serverTimestamp(),registeredFileId:fileId,
      registeredStorageKey:storageKey,registeredImageKitFileId:fileId,
      registeredImageKitFilePath:storageKey,registeredMaterialId:materialRef.id
    });
    if(limits.data()?.activeAuthorizationId===authId){
      tx.set(uploadLimitRef,{
        activeAuthorizationId:"",activeAuthorizationExpiresAt:null,updatedAt:FieldValue.serverTimestamp()
      },{merge:true});
    }
  });
  return {material:serializeMaterialData(materialRef.id,previous||stored),alreadySaved:Boolean(previous)};
}
