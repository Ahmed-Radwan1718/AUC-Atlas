import { NextRequest, NextResponse } from "next/server";
import { firestore } from "../../../server/firebase";
import { optionalSessionUser } from "../../../server/session";
import { firebaseAuth } from "../../../server/firebase";
import { FieldValue } from "firebase-admin/firestore";
import {
  ReviewError, buildFields, validateFields, authorProfile, professorReviews, courseReviews,
  authorReviews, ownedReview, submitReview, serializeReview
} from "../../../server/professorReviews";
import { consumeRateLimit, requestIp, RateLimitError } from "../../../server/security";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Summary = { reviewCount: number; averageRating: number };
let summaryCache: { expiresAt: number; summaries: Record<string, Summary> | null }
  = { expiresAt: 0, summaries: null };

async function getSummaries(): Promise<Record<string, Summary>> {
  if (summaryCache.summaries && summaryCache.expiresAt > Date.now()) return summaryCache.summaries;
  const snapshot = await firestore().collection("professorReviews").select("professorId", "rating").get();
  const totals = new Map<string, { reviewCount: number; ratingCount: number; ratingTotal: number }>();
  snapshot.forEach(doc => {
    const data = doc.data();
    const professorId = String(data.professorId || "").trim().replace(/\s+/g, " ").slice(0, 80);
    const rating = Number(data.rating || 0);
    if (!professorId) return;
    const summary = totals.get(professorId) || { reviewCount: 0, ratingCount: 0, ratingTotal: 0 };
    summary.reviewCount += 1;
    if (Number.isFinite(rating) && rating >= 1 && rating <= 5) {
      summary.ratingCount += 1;
      summary.ratingTotal += rating;
    }
    totals.set(professorId, summary);
  });
  const summaries: Record<string, Summary> = {};
  for (const [professorId, item] of totals) {
    summaries[professorId] = {
      reviewCount: item.reviewCount,
      averageRating: item.ratingCount ? Math.round((item.ratingTotal / item.ratingCount) * 100) / 100 : 0
    };
  }
  summaryCache = { expiresAt: Date.now() + 60 * 60 * 1000, summaries };
  return summaries;
}
export async function GET(request: NextRequest) {
  const headers = { "Cache-Control": "private, no-store" };
  const user = await optionalSessionUser(request);
  if (!user) return NextResponse.json(
    { error: "Sign in with a verified AUC account to view professor reviews." },
    { status: 401, headers }
  );
  const query = request.nextUrl.searchParams;
  try {
    if ((query.get("summaries") || query.get("summary")) === "true") {
      await consumeRateLimit({
        scope: "professor-review-summaries-ip", identifier: requestIp(request),
        maxAttempts: 60, windowMs: 60 * 1000,
        message: "Too many professor-review summary requests. Please try again later."
      });
      return NextResponse.json({ summaries: await getSummaries() }, {
        headers
      });
    }

    const mine = (query.get("mine") || query.get("author") || "").trim().slice(0,20);
    if(mine==="true"||mine==="me"){
      return NextResponse.json({ reviews: await authorReviews(user.uid) }, { headers });
    }
    const courseCode=String(query.get("courseCode")||query.get("courseTaken")||"").trim().toUpperCase().slice(0,60);
    if(courseCode) return NextResponse.json({ reviews: await courseReviews(courseCode) }, { headers });
    const professorId=String(query.get("professorId")||"").trim().replace(/\s+/g," ").slice(0,80);
    if(!professorId)throw new ReviewError("Professor or course not found.",400);
    if(query.get("countOnly")==="true"){
      const snapshot=await firestore().collection("professorReviews").where("professorId","==",professorId).count().get();
      return NextResponse.json({ reviewCount:Number(snapshot.data().count||0) }, { headers });
    }
    return NextResponse.json({ reviews:await professorReviews(professorId) }, { headers });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Could not load reviews." }, {
      status: error instanceof ReviewError ? error.statusCode : error instanceof RateLimitError ? 429 : 500,
      headers: {
        ...headers,
        ...(error instanceof ReviewError && error.retryAfterSeconds ? { "Retry-After": String(error.retryAfterSeconds) } :
          error instanceof RateLimitError ? { "Retry-After": String(error.retryAfterSeconds) } : {})
      }
    });
  }
}

async function mutate(request:NextRequest,method:"POST"|"PATCH"|"DELETE"){
  const user=await optionalSessionUser(request);
  if(!user)return NextResponse.json({error:"not-signed-in"},{status:401});
  try {
    const body=method==="DELETE"?{}:(await request.json().catch(()=>({}))) as Record<string,unknown>;
    const collection=firestore().collection("professorReviews");
    if(method!=="POST") await consumeRateLimit({
      scope:"professor-review-mutation-user", identifier:user.uid, maxAttempts:30,
      windowMs:60*60*1000, message:"Too many professor-review changes. Please try again later."
    });
    const reviewId=String(request.nextUrl.searchParams.get("reviewId")||request.nextUrl.searchParams.get("id")||body.reviewId||body.id||"").trim();
    if(method==="DELETE"){
      if(!reviewId)throw new ReviewError("Review not found.",400);
      const owned=await ownedReview(reviewId,user.uid);
      await owned.ref.delete();
      return NextResponse.json({success:true,reviews:await authorReviews(user.uid)});
    }
    const record=await firebaseAuth().getUser(user.uid);
    if(!record.emailVerified)throw new ReviewError("Please verify your email address before submitting a professor review.",403);
    const owned=method==="PATCH"?(reviewId?await ownedReview(reviewId,user.uid):null):null;
    if(method==="PATCH"&&!owned)throw new ReviewError("Review not found.",400);
    const fields=buildFields(body,owned?.data||{});
    validateFields(fields);
    const profile=await authorProfile(user);
    const timestamp=new Date().toISOString();
    if(method==="PATCH"&&owned){
      await owned.ref.update({
        ...fields,authorUid:user.uid,authorUserId:user.uid,...profile,
        updatedAt:FieldValue.serverTimestamp(),updatedAtIso:timestamp
      });
      return NextResponse.json({success:true,review:serializeReview(await owned.ref.get()),
        reviews:await authorReviews(user.uid)});
    }
    const ref=await submitReview(user,fields,{
      ...fields,authorUid:user.uid,authorUserId:user.uid,...profile,
      createdAt:FieldValue.serverTimestamp(),createdAtIso:timestamp
    });
    return NextResponse.json({success:true,review:serializeReview(await ref.get()),
      reviews:await professorReviews(String(fields.professorId))},{status:201});
  } catch(error) {
    const status=error instanceof ReviewError?error.statusCode:error instanceof RateLimitError?429:500;
    const retry=error instanceof ReviewError?error.retryAfterSeconds:error instanceof RateLimitError?error.retryAfterSeconds:undefined;
    return NextResponse.json({error:error instanceof Error?error.message:"Could not save review."},
      {status,headers:retry?{"Retry-After":String(retry)}:{}});
  }
}
export async function POST(request:NextRequest){return mutate(request,"POST");}
export async function PATCH(request:NextRequest){return mutate(request,"PATCH");}
export async function DELETE(request:NextRequest){return mutate(request,"DELETE");}
