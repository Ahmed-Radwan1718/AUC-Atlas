import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { test } from "node:test";
import vm from "node:vm";
import ts from "typescript";
import { fileURLToPath } from "node:url";

const base = path.dirname(fileURLToPath(import.meta.url));
const read = (name: string) => readFileSync(path.resolve(base,"..",name),"utf8");
type JsonResponse = { body: Record<string,any>; status: number; headers: Record<string,string> };
type Session = { uid: string } | null;
function response(body: Record<string,any>, options?: {status?:number;headers?:Record<string,string>}):JsonResponse {
  return { body, status: options?.status || 200, headers: options?.headers || {} };
}
function runRoute(file: string, authenticated: boolean) {
  let reviewReads = 0;
  let materialReads = 0;
  let authorizedReadCalls = 0;
  const session: Session = authenticated ? {uid:"verified-auc-student"} : null;
  const mockReview = {
    ReviewError: class ReviewError extends Error {statusCode = 400; retryAfterSeconds?:number;},
    professorReviews: async () => {authorizedReadCalls++; return [{id:"review-private"}];},
    courseReviews: async (code: string) => {authorizedReadCalls++; if (code === "FAIL1000") throw Error("Query failed"); return [{id:"course-review-private"}];},
    authorReviews: async () => {authorizedReadCalls++; return [{id:"my-private-review"}];},
    buildFields:()=>({}),validateFields:()=>{},authorProfile:async()=>({}),
    ownedReview:async()=>({}),submitReview:async()=>({}),serializeReview:()=>({})
  };
  const reviewDocs = [
    {id:"one",data:()=>({professorId:"prof-1",professorName:"Professor One",rating:5,createdAtIso:"2026-01-01T00:00:00Z"})},
    {id:"two",data:()=>({professorId:"prof-1",professorName:"Professor One",rating:3,createdAtIso:"2026-01-02T00:00:00Z"})}
  ];
  const materialDocs = [{id:"material-1",data:()=>({
    status:"approved",courseCode:"MATH 2010",title:"Past exam",
    createdAtIso:"2026-01-01T00:00:00Z",fileName:"exam.pdf"
  })}];
  const snapshot = (name:string)=>({
    docs:name==="professorReviews"?reviewDocs:materialDocs,
    forEach(callback:(doc:any)=>void){for(const doc of name==="professorReviews"?reviewDocs:materialDocs)callback(doc);}
  });
  const db = {
    collection(name:string) {
      let statusFilter = "";
      if(name==="professorReviews")reviewReads++;
      else if(name==="courseMaterials")materialReads++;
      else throw Error("Unexpected collection: "+name);
      const query = {
        count(){return {get:async()=>({data:()=>({count:name==="professorReviews"?2:statusFilter==="rejected"?0:1})})};},
        select(..._fields:string[]){return {get:async()=>snapshot(name)};},
        where(field:string,_operator:string,value:string){if(field==="status")statusFilter=value;return this;},
        orderBy(..._args:any[]){return this;},
        limit(_count:number){return this;},
        get:async()=>snapshot(name)
      };
      return query;
    }
  };
  let rateLimits = 0;
  const exports:{exports:Record<string,any>}={exports:{}};
  const source=ts.transpileModule(read(file),{
    compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}
  }).outputText;
  vm.runInNewContext(source,{
    module:exports,exports:exports.exports,Date,Map,Set,Promise,URLSearchParams,
    require(id:string) {
      if(id==="next/server") return {NextResponse:{json:response}};
      if(id.endsWith("/server/session")||id==="../../../server/session")
        return {optionalSessionUser:async()=>session};
      if(id==="../../../server/firebase")
        return {firestore:()=>db,firebaseAuth:()=>({getUser:async()=>({emailVerified:true})})};
      if(id==="firebase-admin/firestore")return {FieldValue:{serverTimestamp:()=>new Date()}};
      if(id==="../../../server/professorRatingSummaries") return {
        getProfessorRatingSnapshot:async()=>({
          version:1,ready:true,reviewCount:2,
          professors:{"prof-1":{
            professorName:"Professor One",reviewCount:2,ratedCount:2,ratingTotal:8
          }}
        }),
        professorDirectorySummaries:(stats:any)=>Object.fromEntries(
          Object.entries(stats.professors).map(([id,row]:any)=>[
            id,{reviewCount:row.reviewCount,averageRating:row.ratingTotal/row.ratedCount}
          ])
        ),
        homepageProfessorRankings:(stats:any)=>Object.entries(stats.professors)
          .map(([professorId,row]:any)=>({
            professorId,professorName:row.professorName,
            reviewCount:row.ratedCount,averageRating:row.ratingTotal/row.ratedCount
          })),
        updateRatingSummaryInTransaction:async()=>{}
      };
      if(id==="../../../server/professorReviews")return mockReview;
      if(id==="../../../server/security")return {
        consumeRateLimit:async()=>{rateLimits++;},
        requestIp:()=>"127.0.0.1",RateLimitError:class RateLimitError extends Error{}
      };
      throw Error("Unexpected import "+id+" from "+file);
    }
  },{filename:file});
  const api=exports.exports as {GET:(request:any)=>Promise<JsonResponse>};
  const get=(query:string)=>api.GET({nextUrl:{searchParams:new URLSearchParams(query)}});
  return {get,get reviewReads(){return reviewReads;},get materialReads(){return materialReads;},
    get authorizedReadCalls(){return authorizedReadCalls;},get rateLimits(){return rateLimits;}};
}

test("unauthenticated requests cannot read reviews, summaries, course reviews, counts or owned reviews",async()=>{
  const app=runRoute("app/api/professor-reviews/route.ts",false);
  for(const query of [
    "?summaries=true","?summary=true","?professorId=prof-1",
    "?professorId=prof-1&countOnly=true","?courseCode=MATH2010","?courseCodes=MATH2010,MACT1122","?mine=true"
  ]) {
    const result=await app.get(query);
    assert.equal(result.status,401,query);
    assert.match(result.body.error,/verified AUC account/i,query);
    assert.equal(result.headers["Cache-Control"],"private, no-store",query);
  }
  assert.equal(app.reviewReads,0);
  assert.equal(app.authorizedReadCalls,0);
  assert.equal(app.rateLimits,0);
});

test("verified sessions retain review list, course list, personal history and summary access",async()=>{
  const app=runRoute("app/api/professor-reviews/route.ts",true);
  const reviews=await app.get("?professorId=prof-1");
  const course=await app.get("?courseCode=MATH2010");
  const mine=await app.get("?mine=true");
  const summary=await app.get("?summaries=true");
  const count=await app.get("?professorId=prof-1&countOnly=true");
  for(const item of [reviews,course,mine,summary,count]){
    assert.equal(item.status,200);
    assert.equal(item.headers["Cache-Control"],"private, no-store");
  }
  assert.equal((reviews.body.reviews as any[])[0].id,"review-private");
  assert.equal((course.body.reviews as any[])[0].id,"course-review-private");
  assert.equal((mine.body.reviews as any[])[0].id,"my-private-review");
  assert.equal(summary.body.summaries["prof-1"].reviewCount,2);
  assert.equal(summary.body.summaries["prof-1"].averageRating,4);
  assert.equal(count.body.reviewCount,2);
});

test("signed-out professor UI offers sign-in and never calls review count cache",()=>{
  const listing=read("features/professors/Professors.tsx");
  const profile=read("features/professors/reviewPresentation.ts");
  const search=read("features/home/HomeSearch.tsx");
  assert.match(listing,/reviewsLocked/);
  assert.match(listing,/href="\/login"/);
  assert.match(profile,/renderProfessorReviewsLocked/);
  assert.match(profile,/href="\/login"/);
  assert.doesNotMatch(search,/reviewCache|cachedReviewCount/);
  assert.match(search,/Sign in to see reviews/);
});


test("search counts use one authenticated summary request and preserve zero, singular, and locked states", async () => {
  const source = ts.transpileModule(read("features/home/searchReviewCounts.ts"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 }
  }).outputText;
  const module = { exports: {} as Record<string, any> };
  let calls = 0;
  let status = 200;
  let payload: any = { summaries: { "prof-1": { reviewCount: 1 }, "prof-2": { reviewCount: 12 } } };
  const signal = new AbortController().signal;
  vm.runInNewContext(source, {
    module, exports: module.exports,
    fetch: async (url: string, options: any) => {
      calls++;
      assert.equal(url, "/api/professor-reviews?summaries=true");
      assert.equal(options.credentials, "same-origin");
      assert.equal(options.cache, "no-store");
      assert.equal(options.signal, signal);
      return { status, ok: status === 200, json: async () => payload };
    }
  });
  const { loadSearchReviewCounts, searchProfessorReviewCount } = module.exports;
  const ready = await loadSearchReviewCounts(signal);
  assert.equal(searchProfessorReviewCount(ready, "prof-1"), 1);
  assert.equal(searchProfessorReviewCount(ready, "prof-2"), 12);
  assert.equal(searchProfessorReviewCount(ready, "absent"), 0);
  assert.equal(searchProfessorReviewCount(ready, "__proto__"), 0);
  assert.equal(calls, 1);
  status = 401;
  assert.equal(searchProfessorReviewCount(await loadSearchReviewCounts(signal), "prof-1"), "locked");
  status = 500;
  assert.equal(searchProfessorReviewCount(await loadSearchReviewCounts(signal), "prof-1"), null);
  status = 200;
  payload = { summaries: { "prof-1": { reviewCount: -1 } } };
  assert.equal((await loadSearchReviewCounts(signal)).status, "error");
});

test("search rows do not issue requests and the shared counts are invalidated on session changes", () => {
  const search = read("features/home/HomeSearch.tsx");
  assert.doesNotMatch(search, /countOnly=true|getReviewCount\(/);
  assert.match(search, /\}, \[needsReviewCounts\]\)/);
  assert.match(search, /window\.addEventListener\("storage", onStorage\)/);
  assert.match(search, /window\.addEventListener\(SEARCH_REVIEW_SESSION_ENDED, onSessionEnded\)/);
  assert.match(read("components/Header.tsx"), /window\.dispatchEvent\(new Event\(SEARCH_REVIEW_SESSION_ENDED\)\)/);
});


test("semester reviews use one protected batch with deduplication and partial failure handling", async () => {
  const app = runRoute("app/api/professor-reviews/route.ts", true);
  const result = await app.get("?courseCodes=MATH2010,MACT1122,MATH2010,FAIL1000");
  assert.equal(result.status, 200);
  assert.equal(result.headers["Cache-Control"], "private, no-store");
  assert.deepEqual(Array.from(result.body.courses, (row: any) => row.courseCode), ["MATH2010","MACT1122","FAIL1000"]);
  assert.equal(result.body.courses[0].reviews[0].id, "course-review-private");
  assert.equal(result.body.courses[2].reviews, null);
  assert.equal(app.authorizedReadCalls, 3);
  assert.equal(app.rateLimits, 1);
  const invalid = await app.get("?courseCodes=" + Array.from({ length: 21 }, (_, i) => "MATH" + (2000+i)).join(","));
  assert.equal(invalid.status, 400);
  assert.equal(app.authorizedReadCalls, 3);
});
