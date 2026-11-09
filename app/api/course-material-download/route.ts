import { NextRequest, NextResponse } from "next/server";
import { firestore } from "../../../server/firebase";
import { optionalSessionUser } from "../../../server/session";
import { verifiedMaterialUser, MaterialUploadError } from "../../../server/materialUpload";
import { materialSource, MaterialFileError, allowedMime, maxMaterialBytes, safeFileName } from "../../../server/materialFiles";
import { consumeRateLimit, RateLimitError } from "../../../server/security";

export const runtime="nodejs";
export const dynamic="force-dynamic";

const jsonHeaders={"Cache-Control":"private, no-store, max-age=0","X-Content-Type-Options":"nosniff"};
export async function GET(request:NextRequest){
  const user=await optionalSessionUser(request);
  if(!user)return NextResponse.json({error:"Sign in to access course files."},{status:401,headers:jsonHeaders});
  try {
    await verifiedMaterialUser(user);
    await consumeRateLimit({
      scope:"course-material-download-user",identifier:user.uid,
      maxAttempts:120,windowMs:10*60*1000,
      message:"Too many course-material requests. Please try again later."
    });
    const id=String(request.nextUrl.searchParams.get("id")||"").trim();
    if(!/^[A-Za-z0-9_-]{1,160}$/.test(id))
      return NextResponse.json({error:"Invalid course material."},{status:400,headers:jsonHeaders});
    const doc=await firestore().collection("courseMaterials").doc(id).get();
    const data=doc.data()||{};
    if(!doc.exists || data.status==="rejected")
      return NextResponse.json({error:"Course material not found."},{status:404,headers:jsonHeaders});
    const fileName=safeFileName(data.fileName||"course-material");
    const ext=(fileName.match(/\.([a-z0-9]+)$/i)?.[1]||"").toLowerCase();
    const recordMime=String(data.fileType||"").split(";")[0].trim().toLowerCase();
    const mime=recordMime===allowedMime[ext]?recordMime:(allowedMime[ext]||"application/octet-stream");
    const disposition=String(request.nextUrl.searchParams.get("disposition")||"").trim().toLowerCase();
    const src=await materialSource(data);
    if(disposition==="office-url"){
      if(!["doc","docx","ppt","pptx","xls","xlsx"].includes(ext))
        return NextResponse.json({error:"Office preview is not supported for this file."},{status:400,headers:jsonHeaders});
      return NextResponse.json({url:src.inlineUrl||src.url},{headers:jsonHeaders});
    }
    const inline=disposition==="inline";
    if(!inline){
      const target=new URL(src.url);
      if(src.provider==="imagekit")target.searchParams.set("ik-attachment","true");
      const redirect=NextResponse.redirect(target.toString(),302);
      redirect.headers.set("Cache-Control","private, no-store, max-age=0");
      redirect.headers.set("X-Content-Type-Options","nosniff");
      return redirect;
    }
    const upstream=await fetch(src.inlineUrl||src.url,{redirect:"follow",cache:"no-store"});
    if(!upstream.ok||!upstream.body)
      return NextResponse.json({error:"Could not load course material."},{status:502,headers:jsonHeaders});
    const bytes=Number(upstream.headers.get("content-length"))||0;
    if(bytes>maxMaterialBytes())
      return NextResponse.json({error:"Course material is too large to preview."},{status:413,headers:jsonHeaders});
    const ascii=fileName.replace(/[^\x20-\x7e]/g,"_").replace(/["\\]/g,"_");
    const headers=new Headers(jsonHeaders);
    headers.set("Content-Type",mime);
    headers.set("Content-Disposition","inline; filename=\""+ascii+"\"; filename*=UTF-8''"+encodeURIComponent(fileName));
    if(bytes>0)headers.set("Content-Length",String(bytes));
    return new NextResponse(upstream.body,{status:200,headers});
  }catch(error){
    const code=error instanceof MaterialUploadError||error instanceof MaterialFileError?
      error.statusCode:error instanceof RateLimitError?429:502;
    const status=[400,401,403,404,413,429].includes(code)?code:502;
    return NextResponse.json({error:status===401?"Sign in to access course files.":
      status===403?"Verify your AUC email to access course files.":
      status===404?"Course material not found.":
      status===429?"Too many requests. Please try again later.":"Could not load course material."},{
      status,headers:{...jsonHeaders,...(error instanceof RateLimitError?{"Retry-After":String(error.retryAfterSeconds)}:{})}
    });
  }
}
