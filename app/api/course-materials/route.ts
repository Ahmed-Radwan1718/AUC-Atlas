import { NextRequest, NextResponse } from "next/server";
import { optionalSessionUser } from "../../../server/session";
import { FieldValue } from "firebase-admin/firestore";
import { firestore } from "../../../server/firebase";
import { MaterialUploadError, registerMaterial, verifiedMaterialUser } from "../../../server/materialUpload";
import { getOwnedMaterial } from "../../../server/materials";
import { refreshMaterialDiscovery } from "../../../server/materialDiscovery";
import { deleteStoredCourseMaterial } from "../../../server/materialFiles";

import { courseMaterials, randomCourseMaterials, userMaterials } from "../../../server/materials";
import { consumeRateLimit, RateLimitError } from "../../../server/security";

export const runtime="nodejs";
export const dynamic="force-dynamic";
export async function GET(request:NextRequest){
  const headers={"Cache-Control":"no-store"};
  const user=await optionalSessionUser(request);
  if(!user)return NextResponse.json({error:"not-signed-in"},{status:401,headers});
  try{
    await verifiedMaterialUser(user);
    const query=request.nextUrl.searchParams;
    if(query.get("mine")==="true")return NextResponse.json({materials:await userMaterials(user.uid)},{headers});
    if(query.get("random")==="true"){
      await consumeRateLimit({
        scope:"course-material-random-user",identifier:user.uid,maxAttempts:30,windowMs:10*60*1000,
        message:"Too many random course-material requests. Please try again later."
      });
      return NextResponse.json({materials:await randomCourseMaterials(query.get("limit"))},{headers});
    }
    const code=String(query.get("courseCode")||"").trim().replace(/\s+/g," ").slice(0,40).toUpperCase();
    if(!code)return NextResponse.json({error:"Course not found."},{status:400,headers});
    return NextResponse.json({materials:await courseMaterials(code)},{headers});
  }catch(error){
    return NextResponse.json({error:error instanceof Error?error.message:"Could not load course materials."},{
      status:error instanceof MaterialUploadError?error.statusCode:error instanceof RateLimitError?429:500,
      headers:{...headers,...(error instanceof RateLimitError?{"Retry-After":String(error.retryAfterSeconds)}:{})}
    });
  }
}


const allowedMaterialTypes=new Set([
  "Notes","Slides","Syllabus","Past exam","Practice sheet","Lab file","Past assignments","Review sheet"
]);
async function mutate(request:NextRequest,method:"POST"|"PATCH"|"DELETE"){
  const headers={"Cache-Control":"no-store"};
  const user=await optionalSessionUser(request);
  if(!user)return NextResponse.json({error:"Sign in to manage course materials."},{status:401,headers});
  try{
    await verifiedMaterialUser(user);
    if(method!=="POST")await consumeRateLimit({
      scope:"course-material-mutation-user",identifier:user.uid,maxAttempts:30,windowMs:60*60*1000,
      message:"Too many course-material changes. Please try again later."
    });
    const body=await request.json().catch(()=>({})) as Record<string,unknown>;
    if(method==="POST"){
      const result=await registerMaterial(user,body);
      await refreshMaterialDiscovery(result.material.id,result.material.uploadGroupId);
      return NextResponse.json(result,{status:result.alreadySaved?200:201,headers});
    }
    const materialId=String(body.materialId||"").trim().slice(0,160);
    if(!materialId)throw new MaterialUploadError("Course material not found.",404);
    const owned=await getOwnedMaterial(materialId,user.uid);
    if(method==="PATCH"){
      const title=String(body.title||"").trim().slice(0,160);
      const type=String(body.materialType||body.type||body.category||"").trim();
      const materialType=[...allowedMaterialTypes].find(x=>x.toLowerCase()===type.toLowerCase());
      if(!title||!materialType)throw new MaterialUploadError(
        "Enter a material name and choose a valid category.",400);
      const status=String(owned.data.status||"approved").toLowerCase()==="rejected"?"rejected":"approved";
      await owned.ref.update({
        title,materialType,status,updatedAt:FieldValue.serverTimestamp(),updatedAtIso:new Date().toISOString()
      });
      await refreshMaterialDiscovery(materialId,owned.data.uploadGroupId);
      return NextResponse.json({success:true,materials:await userMaterials(user.uid)},{headers});
    }
    // Reject the Firestore record first so a failed provider cleanup cannot expose it.
    await owned.ref.update({
      status:"rejected",deletedAt:FieldValue.serverTimestamp(),deletedAtIso:new Date().toISOString()
    });
    await refreshMaterialDiscovery(materialId,owned.data.uploadGroupId);
    try { await deleteStoredCourseMaterial(owned.data); } catch { /* Material stays rejected if provider cleanup fails. */ }
    return NextResponse.json({success:true,materials:await userMaterials(user.uid)},{headers});
  }catch(error){
    const status=error instanceof MaterialUploadError?error.statusCode:
      error instanceof RateLimitError?429:
      typeof error==="object"&&error!==null&&"statusCode" in error?Number(error.statusCode)||500:500;
    return NextResponse.json({error:error instanceof Error?error.message:"Could not manage course materials."},{
      status,headers:{...headers,...(error instanceof RateLimitError?{"Retry-After":String(error.retryAfterSeconds)}:{})}
    });
  }
}
export async function POST(request:NextRequest){return mutate(request,"POST");}
export async function PATCH(request:NextRequest){return mutate(request,"PATCH");}
export async function DELETE(request:NextRequest){return mutate(request,"DELETE");}
