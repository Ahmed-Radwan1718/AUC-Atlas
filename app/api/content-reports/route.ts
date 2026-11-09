import { createHash } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { firestore, firebaseAuth } from "../../../server/firebase";
import { optionalSessionUser } from "../../../server/session";
import { consumeRateLimit, RateLimitError } from "../../../server/security";

export const runtime="nodejs";
export const dynamic="force-dynamic";
class ReportError extends Error{
  constructor(message:string,public readonly statusCode:number){super(message);}
}
const clean=(value:unknown,max:number)=>String(value??"").trim().replace(/\s+/g," ").slice(0,max);
async function reportTarget(type:string,id:string){
  const doc=await firestore().collection(type==="review"?"professorReviews":"courseMaterials").doc(id).get();
  if(!doc.exists)throw new ReportError("The reported content no longer exists.",404);
  const data=doc.data()||{};
  if(type==="material"&&clean(data.status,40).toLowerCase()!=="approved")
    throw new ReportError("The reported content is not available.",404);
  if(type==="review"){
    const professorName=clean(data.professorName||"Professor review",120),
      courseCode=clean(data.courseCode||data.courseTaken,60);
    return {
      ownerUid:clean(data.authorUid||data.authorUserId,160),
      label:clean(professorName+(courseCode?" · "+courseCode:""),240),
      snapshot:{
        professorName,courseCode,semesterTaken:clean(data.semesterTaken,60),rating:Number(data.rating||0),
        studentNote:String(data.studentNote||"").slice(0,360),
        authorUid:clean(data.authorUid||data.authorUserId,160),
        authorName:clean(data.authorName||"AUC student",80)
      }
    };
  }
  const title=clean(data.title||data.fileName||"Course material",240);
  return {
    ownerUid:clean(data.uploaderUid,160),label:title,
    snapshot:{
      title,fileName:clean(data.fileName,240),courseCode:clean(data.courseCode,60),
      professor:clean(data.professor,120),semester:clean(data.semester,60),
      materialType:clean(data.materialType||data.type||data.category||"Material",80),
      uploaderUid:clean(data.uploaderUid,160),
      uploaderDisplayName:clean(data.uploaderDisplayName||"AUC student",80),
      fileId:clean(data.fileId,160)
    }
  };
}
export async function POST(request:NextRequest){
  const headers={"Cache-Control":"no-store"};
  const user=await optionalSessionUser(request);
  if(!user)return NextResponse.json({error:"not-signed-in"},{status:401,headers});
  try {
    const record=await firebaseAuth().getUser(user.uid);
    const email=clean(record.email||user.email,240).toLowerCase();
    if(!record.emailVerified||!email.endsWith("@aucegypt.edu"))
      throw new ReportError("Please verify your AUC email address before reporting content.",403);
    await consumeRateLimit({scope:"content-report-user",identifier:user.uid,maxAttempts:10,
      windowMs:60*60*1000,message:"Too many content reports. Please try again later."});
    const body=await request.json().catch(()=>({}));
    const targetType=clean(body.targetType,20).toLowerCase(),
      targetId=clean(body.targetId,180),reason=String(body.reason??"").trim().slice(0,500);
    if(!["review","material"].includes(targetType))
      throw new ReportError("Choose valid content to report.",400);
    if(!/^[A-Za-z0-9_-]{6,180}$/.test(targetId))
      throw new ReportError("The reported content could not be found.",400);
    if(reason.length<3)throw new ReportError("Briefly explain why you are reporting this content.",400);
    const target=await reportTarget(targetType,targetId);
    if(target.ownerUid===user.uid)throw new ReportError("You cannot report your own content.",400);
    const db=firestore(),reportId=createHash("sha256").update([user.uid,targetType,targetId].join(":")).digest("hex"),
      ref=db.collection("contentReports").doc(reportId),createdAtIso=new Date().toISOString();
    await db.runTransaction(async tx=>{
      const existing=await tx.get(ref);
      if(existing.exists&&existing.data()?.status==="open")
        throw new ReportError("You have already reported this content.",409);
      tx.set(ref,{
        targetType,targetId,targetKey:targetType+":"+targetId,targetLabel:target.label,
        targetOwnerUid:target.ownerUid,targetSnapshot:target.snapshot,
        reason,reporterUid:user.uid,reporterEmail:email,status:"open",
        createdAt:FieldValue.serverTimestamp(),createdAtIso,
        updatedAt:FieldValue.serverTimestamp(),updatedAtIso:createdAtIso,
        resolvedAt:null,resolvedAtIso:"",resolvedByAdminUid:"",
        resolvedByAdminEmail:"",resolution:""
      });
    });
    return NextResponse.json({success:true,reportId},{status:201,headers});
  }catch(error){
    const status=error instanceof ReportError?error.statusCode:error instanceof RateLimitError?429:500;
    return NextResponse.json({error:error instanceof Error?error.message:"Could not submit the report."},
      {status,headers:{...headers,...(error instanceof RateLimitError?{"Retry-After":String(error.retryAfterSeconds)}:{})}});
  }
}
