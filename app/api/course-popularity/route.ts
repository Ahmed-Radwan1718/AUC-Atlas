import { NextRequest, NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { firestore } from "../../../server/firebase";
import { consumeRateLimit, RateLimitError, requestIp } from "../../../server/security";

export const runtime="nodejs";
export const dynamic="force-dynamic";
const normalize=(v:unknown)=>String(v??"").trim().replace(/\s+/g," ").slice(0,40).toUpperCase();
const valid=(code:string)=>/^[A-Z0-9]{2,12}(?: [A-Z0-9]{1,12}){1,2}$/.test(code);
function cairoDate() {
  const parts=new Intl.DateTimeFormat("en-US", {timeZone:"Africa/Cairo", year:"numeric",month:"2-digit",day:"2-digit"}).formatToParts(new Date());
  const date=Object.fromEntries(parts.filter(p=>p.type!=="literal").map(p=>[p.type,p.value]));
  return date.year+"-"+date.month+"-"+date.day;
}
function windowStart(){
  const [year,month,day]=cairoDate().split("-").map(Number);
  const date=new Date(Date.UTC(year,month-1,day));
  date.setUTCDate(date.getUTCDate()-29);
  return date.toISOString().slice(0,10);
}
export async function GET(){
  try{
    const start=windowStart();
    const snapshot=await firestore().collection("courseDailyViews").where("date",">=",start).get();
    const totals=new Map<string,number>();
    snapshot.forEach(doc=>{
      const data=doc.data(), code=normalize(data.courseCode),count=Math.max(0,Number(data.count)||0);
      if(valid(code)&&count)totals.set(code,(totals.get(code)||0)+count);
    });
    const popularCourses=[...totals].map(([courseCode,views])=>({courseCode,views}))
      .sort((a,b)=>b.views-a.views||a.courseCode.localeCompare(b.courseCode)).slice(0,8);
    return NextResponse.json({periodDays:30,periodStart:start,popularCourses},
      {headers:{"Cache-Control":"public, max-age=60, s-maxage=300, stale-while-revalidate=600"}});
  }catch{return NextResponse.json({error:"Could not process course popularity."},{status:500});}
}
export async function POST(request:NextRequest){
  try {
    const data=await request.json().catch(()=>({})),code=normalize(data.courseCode);
    if(!valid(code))return NextResponse.json({error:"Enter a valid course code."},{status:400});
    const date=cairoDate(),ip=requestIp(request);
    try {
      await consumeRateLimit({scope:"course-popularity-ip",identifier:ip,maxAttempts:120,windowMs:3600000,
        message:"Too many course-view requests from this connection."});
      await consumeRateLimit({scope:"course-popularity-course:"+date+":"+code,identifier:ip,
        maxAttempts:5,windowMs:86400000,
        message:"This course has already received several views from this connection."});
    }catch(error){
      if(!(error instanceof RateLimitError))throw error;
      return NextResponse.json({success:true,counted:false},{headers:{"Cache-Control":"private, no-store, max-age=0"}});
    }
    await firestore().collection("courseDailyViews").doc(date+"--"+encodeURIComponent(code))
      .set({courseCode:code,date,count:FieldValue.increment(1),updatedAt:FieldValue.serverTimestamp()},{merge:true});
    return NextResponse.json({success:true,counted:true},{headers:{"Cache-Control":"private, no-store, max-age=0"}});
  }catch{return NextResponse.json({error:"Could not process course popularity."},{status:500});}
}
