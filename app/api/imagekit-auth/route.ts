import { NextRequest, NextResponse } from "next/server";
import { optionalSessionUser } from "../../../server/session";
import { authorizeMaterial, cancelMaterial, MaterialUploadError, verifiedMaterialUser } from "../../../server/materialUpload";
import { RateLimitError } from "../../../server/security";

export const runtime="nodejs";
export const dynamic="force-dynamic";

export async function POST(request:NextRequest){
  const headers={"Cache-Control":"no-store"};
  const user=await optionalSessionUser(request);
  if(!user)return NextResponse.json({error:"Sign in to upload course materials."},{status:401,headers});
  try{
    const body=await request.json().catch(()=>({})) as Record<string,unknown>;
    const action=String(body.action||"").trim().toLowerCase();
    if(action==="cancel"){
      await verifiedMaterialUser(user);
      return NextResponse.json(await cancelMaterial(user,body),{headers});
    }
    return NextResponse.json(await authorizeMaterial(user,body),{headers});
  }catch(error){
    const status=error instanceof MaterialUploadError?error.statusCode:error instanceof RateLimitError?429:500;
    return NextResponse.json({error:error instanceof Error?error.message:"Could not prepare upload."},{status,headers:{...headers,...(error instanceof RateLimitError?{"Retry-After":String(error.retryAfterSeconds)}:{})}});
  }
}
