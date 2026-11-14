import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { test } from "node:test";
import vm from "node:vm";
import ts from "typescript";
import { fileURLToPath } from "node:url";

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"..");
const read=(p:string)=>readFileSync(path.join(root,p),"utf8");
const compiled=ts.transpileModule(read("server/professorRatingSummaries.ts"),{
  compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}
}).outputText;
type RawReview={professorId?:string;professorName?:string;rating?:number};
function harness(initial:RawReview[]=[]){
  const raw=new Map(initial.map((x,i)=>["review-"+i,{...x}]));
  let stored:any=undefined,sourceScans=0,summaryReads=0;
  const summaryRef={kind:"summary",async get(){
    summaryReads++;return {exists:Boolean(stored),data:()=>stored};
  }};
  const query={kind:"reviews"};
  const db={
    collection(name:string){
      if(name==="professorRatingSummaries")return {doc(id:string){
        assert.equal(id,"global");return summaryRef;
      }};
      if(name==="professorReviews")return {select(...names:string[]){
        assert.equal(names.join(","),"professorId,professorName,rating");
        return query;
      }};
      throw Error("Unexpected collection: "+name);
    },
    async runTransaction<T>(fn:(transaction:any)=>Promise<T>):Promise<T>{
      const staged:{data:any}|null={data:null};
      let hasWrite=false;
      const transaction={
        async get(ref:any){
          if(ref===summaryRef){summaryReads++;return {exists:Boolean(stored),data:()=>stored};}
          if(ref===query){
            sourceScans++;
            return {docs:[...raw].map(([id,data])=>({id,data:()=>({...data})}))};
          }
          throw Error("Unexpected transaction read.");
        },
        set(ref:any,data:any,options?:{merge:boolean}){
          assert.equal(ref,summaryRef);
          staged.data=options?.merge?{...stored,...data}:data;
          hasWrite=true;
        }
      };
      const result=await fn(transaction);
      if(hasWrite)stored=staged.data;
      return result;
    }
  };
  const module:{exports:Record<string,any>}={exports:{}};
  vm.runInNewContext(compiled,{
    module,exports:module.exports,Promise,Date,Map,Number,Object,
    require(id:string){
      if(id==="./firebase")return {firestore:()=>db};
      throw Error("Unexpected import "+id);
    }
  },{filename:"professorRatingSummaries.ts"});
  const api=module.exports as {
    getProfessorRatingSnapshot:()=>Promise<any>;
    updateRatingSummaryInTransaction:(tx:any,changes:any[])=>Promise<void>;
    professorDirectorySummaries:(stats:any)=>Record<string,any>;
    homepageProfessorRankings:(stats:any)=>any[];
  };
  return {api,db,raw,get sourceScans(){return sourceScans;},
    get summaryReads(){return summaryReads;},get stored(){return stored;}};
}

const x=(professorId:string,rating:number,name?:string)=>
  ({professorId,professorName:name||professorId,rating});

test("bootstraps once and later homepage/directory calls do not rescan reviews",async()=>{
  const app=harness([x("p1",5),x("p1",3),x("p2",2),x("p3",0)]);
  const first=await app.api.getProfessorRatingSnapshot();
  assert.equal(first.reviewCount,4);
  assert.equal(app.sourceScans,1);
  const directory=app.api.professorDirectorySummaries(first);
  assert.equal(directory.p1.reviewCount,2);
  assert.equal(directory.p1.averageRating,4);
  assert.equal(directory.p3.reviewCount,1);
  assert.equal(directory.p3.averageRating,0);
  const rankings=app.api.homepageProfessorRankings(first);
  assert.deepEqual(Array.from(rankings).map(x=>x.professorId),["p1","p2"]);
  assert.equal(rankings[0].averageRating,4);
  const second=await app.api.getProfessorRatingSnapshot();
  assert.equal(second.reviewCount,4);
  assert.equal(app.sourceScans,1);
});

test("a new review updates both total count and professor rating atomically",async()=>{
  const app=harness([x("p1",5)]);
  await app.api.getProfessorRatingSnapshot();
  await app.db.runTransaction(async tx=>{
    await app.api.updateRatingSummaryInTransaction(tx,[{before:null,after:x("p1",3)}]);
  });
  assert.equal(app.stored.reviewCount,2);
  assert.equal(app.stored.professors.p1.reviewCount,2);
  assert.equal(app.stored.professors.p1.ratedCount,2);
  assert.equal(app.api.professorDirectorySummaries(app.stored).p1.averageRating,4);
  assert.equal(app.sourceScans,1);
});

test("editing a review moves counts and ratings between professors",async()=>{
  const app=harness([x("p1",5),x("p1",3)]);
  await app.api.getProfessorRatingSnapshot();
  await app.db.runTransaction(async tx=>{
    await app.api.updateRatingSummaryInTransaction(tx,[{
      before:x("p1",5),after:x("p2",1)
    }]);
  });
  assert.equal(app.stored.reviewCount,2);
  assert.equal(app.stored.professors.p1.reviewCount,1);
  assert.equal(app.stored.professors.p1.ratingTotal,3);
  assert.equal(app.stored.professors.p2.ratingTotal,1);
  const ranked=app.api.homepageProfessorRankings(app.stored);
  assert.equal(ranked[0].professorId,"p1");
});

test("deleting reviews removes abandoned professor summaries and keeps counts exact",async()=>{
  const app=harness([x("p1",2)]);
  await app.api.getProfessorRatingSnapshot();
  await app.db.runTransaction(async tx=>{
    await app.api.updateRatingSummaryInTransaction(tx,[{before:x("p1",2),after:null}]);
  });
  assert.equal(app.stored.reviewCount,0);
  assert.equal(Object.keys(app.stored.professors).length,0);
  assert.equal(app.api.homepageProfessorRankings(app.stored).length,0);
});

test("writes before initial bootstrap leave it unready, so legacy reviews are counted once",async()=>{
  const app=harness([x("p1",4)]);
  await app.db.runTransaction(async tx=>{
    await app.api.updateRatingSummaryInTransaction(tx,[{before:null,after:x("p1",2)}]);
  });
  assert.equal(app.stored.ready,false);
  app.raw.set("new-review",x("p1",2));
  const latest=await app.api.getProfessorRatingSnapshot();
  assert.equal(latest.reviewCount,2);
  assert.equal(app.api.professorDirectorySummaries(latest).p1.averageRating,3);
  assert.equal(app.sourceScans,1);
});

test("bulk account deletion updates the one summary document in a single transaction",async()=>{
  const app=harness([x("p1",4),x("p2",2)]);
  await app.api.getProfessorRatingSnapshot();
  await app.db.runTransaction(async tx=>{
    await app.api.updateRatingSummaryInTransaction(tx,[
      {before:x("p1",4),after:null},{before:x("p2",2),after:null}
    ]);
  });
  assert.equal(app.stored.reviewCount,0);
  assert.equal(Object.keys(app.stored.professors).length,0);
});

test("all actual review deletion/write paths maintain the rating summaries",()=>{
  const submit=read("server/professorReviews.ts");
  const reviews=read("app/api/professor-reviews/route.ts");
  const admin=read("server/auth-legacy/routes/admin.ts");
  const account=read("server/auth-legacy/routes/delete-account.ts");
  const home=read("app/api/homepage-overview/route.ts");
  assert.match(submit,/updateRatingSummaryInTransaction\(tx,/);
  assert.match(reviews,/updateRatingSummaryInTransaction\(tx,/);
  assert.match(admin,/updateRatingSummaryInTransaction\(tx,/);
  assert.match(account,/deleteQueryReviews/);
  assert.match(home,/getProfessorRatingSnapshot/);
  assert.doesNotMatch(home,/rankedProfessors\(/);
});
