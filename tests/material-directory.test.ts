import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import vm from "node:vm";
import ts from "typescript";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)),"..");
const read = (file:string) => readFileSync(path.join(root,file),"utf8");
const compiled = ts.transpileModule(read("app/api/material-directory/route.ts"),{
  compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}
}).outputText;

type Row = {id:string;data:Record<string,any>};
const demo=(index:number, overrides:Record<string,any>={})=>({
  id:"file-"+String(index).padStart(4,"0"),
  data:{
    status:"approved",createdAt:new Date(2026,10,11,12,index),
    title:"Exam "+index,fileName:"exam-"+index+".pdf",
    courseCode:"MATH 2010",courseTitle:"Calculus II",
    materialType:"Past exam",professor:"Professor A",
    semester:"Fall 2026",size:1024,authorUid:"private-user",
    ...overrides
  }
});
function harness({authorized=true,files=[]}:{authorized?:boolean;files?:Row[]}={}) {
  const sorted=[...files].sort((a,b)=>
    b.data.createdAt.getTime()-a.data.createdAt.getTime() ||
    b.id.localeCompare(a.id));
  const ids=new Map(sorted.map(row=>[row.id,row]));
  let reads=0,verified=0,rateLimitCalls=0;
  const module:{exports:Record<string,any>}={exports:{}};
  const snapshots=sorted.map(row=>({
    id:row.id,exists:true,data:()=>({...row.data}),
    get:(key:string)=>row.data[key]
  }));
  const db={
    collection(name:string) {
      assert.equal(name,"courseMaterials");
      reads++;
      return {
        doc(id:string){
          return {get:async()=>{
            const data=ids.get(id)?.data;
            return {
              exists:Boolean(data),
              id,
              data:()=>data,
              get:(key:string)=>data?.[key]
            };
          }};
        },
        orderBy(field:string,direction:string){
          assert.equal(field,"createdAt");
          assert.equal(direction,"desc");
          let afterId:string|null=null;
          return {
            startAfter(doc:{id:string}){
              afterId=doc.id;
              return this;
            },
            async get(){return {docs:snapshots};},
            limit(amount:number){
              return {
                async get(){
                  const index=afterId===null?0:snapshots.findIndex(row=>row.id===afterId)+1;
                  const result=snapshots.slice(index,index+amount);
                  reads+=result.length;
                  return {docs:result};
                }
              };
            }
          };
        }
      };
    }
  };
  const json=(body:any,options?:{status?:number;headers?:Record<string,string>})=>
    ({body,status:options?.status||200,headers:options?.headers||{}});
  vm.runInNewContext(compiled,{
    module,exports:module.exports,
    Promise,Date,Set,Map,URLSearchParams,
    require(id:string){
      if(id==="next/server")return {NextResponse:{json}};
      if(id==="../../../server/firebase")return {firestore:()=>db};
      if(id==="../../../server/session")return {optionalSessionUser:async()=>authorized?{uid:"student"}:null};
      if(id==="../../../server/materialUpload")return {
        verifiedMaterialUser:async()=>{verified++;},
        MaterialUploadError:class MaterialUploadError extends Error{
          statusCode:number;
          constructor(message:string,statusCode:number){super(message);this.statusCode=statusCode;}
        }
      };
      if(id==="../../../server/materials")return {
        serializeMaterialData:(id:string,data:Record<string,any>)=>({
          id,title:data.title,courseCode:data.courseCode,
          courseTitle:data.courseTitle,materialType:data.materialType,
          semester:data.semester,professor:data.professor,fileName:data.fileName,
          downloadUrl:"/api/course-material-download?id="+id
        })
      };
      if(id==="../../../server/security")return {
        consumeRateLimit:async()=>{rateLimitCalls++;},
        RateLimitError:class RateLimitError extends Error{}
      };
      throw Error("Unexpected import "+id);
    }
  },{filename:"material-directory/route.ts"});
  const get=async (params:string)=>{
    const query=new URLSearchParams(params);
    return await module.exports.GET({nextUrl:{searchParams:query}});
  };
  return {get,get reads(){return reads;},get verified(){return verified;},get rateLimitCalls(){return rateLimitCalls;}};
}

test("an unsigned visitor cannot enumerate files or query Firestore",async()=>{
  const app=harness({authorized:false,files:[demo(1)]});
  const result=await app.get("q=MATH");
  assert.equal(result.status,401);
  assert.equal(result.body.materialsLocked,true);
  assert.equal(app.reads,0);
  assert.equal(app.verified,0);
});

test("verified students receive private, downloadable file results without uploader identities",async()=>{
  const app=harness({files:[demo(1)]});
  const result=await app.get("");
  assert.equal(result.status,200);
  assert.equal(result.headers["Cache-Control"],"private, no-store");
  assert.equal(result.body.materials.length,1);
  assert.equal(result.body.materials[0].title,"Exam 1");
  assert.equal(result.body.materials[0].downloadUrl,"/api/course-material-download?id=file-0001");
  assert.equal(result.body.materials[0].authorUid,undefined);
  assert.equal(app.verified,1);
  assert.equal(app.rateLimitCalls,1);
});

test("paginated directory continues without skipping or duplicating material",async()=>{
  const app=harness({files:Array.from({length:55},(_,i)=>demo(i))});
  const one=await app.get("");
  assert.equal(one.body.materials.length,24);
  assert.equal(one.body.hasMore,true);
  assert.ok(one.body.nextCursor);
  const two=await app.get("cursor="+encodeURIComponent(one.body.nextCursor));
  assert.equal(two.body.materials.length,24);
  const three=await app.get("cursor="+encodeURIComponent(two.body.nextCursor));
  assert.equal(three.body.materials.length,7);
  assert.equal(three.body.hasMore,false);
  const ids=[...one.body.materials,...two.body.materials,...three.body.materials].map((x:any)=>x.id);
  assert.equal(new Set(ids).size,55);
});

test("searches titles, course codes, professors, and filters material type and semester",async()=>{
  const app=harness({files:[
    demo(1,{title:"Practice 1",materialType:"Practice sheet",professor:"Dr Example",semester:"Spring 2026"}),
    demo(2,{title:"Lecture 2",materialType:"Slides"}),
    demo(3,{title:"Practice 2",materialType:"Practice sheet",semester:"Fall 2026"})
  ]});
  const result=await app.get("q=practice&type=Practice%20sheet&semester=Spring%202026");
  assert.deepEqual(Array.from(result.body.materials).map((x:any)=>x.id),["file-0001"]);
  assert.equal(result.body.hasMore,false);
  const professor=await app.get("q=example");
  assert.deepEqual(Array.from(professor.body.materials).map((x:any)=>x.id),["file-0001"]);
  const course=await app.get("q=math%202010");
  assert.equal(course.body.materials.length,3);
});

test("rejected files never appear, even when matching the search",async()=>{
  const app=harness({files:[demo(1,{status:"rejected"}),demo(2)]});
  const result=await app.get("");
  assert.deepEqual(Array.from(result.body.materials).map((x:any)=>x.id),["file-0002"]);
});

test("sparse searches can continue beyond the bounded scan window",async()=>{
  const files=Array.from({length:320},(_,i)=>demo(i));
  files[0].data.title="Needle material";
  const app=harness({files});
  const one=await app.get("q=needle");
  assert.equal(one.body.materials.length,0);
  assert.equal(one.body.hasMore,true);
  const two=await app.get("q=needle&cursor="+one.body.nextCursor);
  assert.equal(two.body.materials.length,1);
  assert.equal(two.body.materials[0].title,"Needle material");
  assert.equal(two.body.hasMore,false);
});

test("invalid cursor is rejected instead of querying arbitrary documents",async()=>{
  const app=harness({files:[demo(1)]});
  const result=await app.get("cursor=../users");
  assert.equal(result.status,400);
});

test("the main route changes to materials while individual course pages stay on the original view",()=>{
  const home=read("app/courses/page.tsx");
  const detail=read("app/courses/[slug]/page.tsx");
  const navbar=read("components/Header.tsx");
  const component=read("features/courses/MaterialsDirectory.tsx");
  assert.match(home,/MaterialsDirectory/);
  assert.match(detail,/return <Courses courseSlug={slug}/);
  assert.match(navbar,/href: "\/courses", label: "Materials"/);
  assert.match(component,/\/api\/material-directory/);
  assert.match(component,/file\.downloadUrl/); // secure links are provided by the server
  assert.match(component,/setupCourseUploadStart/);
  // The large decorative hero was removed; keep the upload action accessible.
  assert.doesNotMatch(component,/materials-hub-hero|Find the material\./);
  assert.match(component,/material-finder-head/);
  assert.match(component,/material-finder-course/);
  assert.match(component,/role="combobox"/);
  assert.match(component,/material-finder-radios/);
  assert.match(component,/material-finder-semester/);
  assert.match(component,/material-finder-results-title/);
  assert.match(component,/uploadGroupId/);
  assert.match(component,/DownloadIcon/);
  assert.match(component,/id="course-upload-start"/);
  const css=read("features/courses/materials-directory.css");
  assert.doesNotMatch(css,/materials-hub-hero|materials-art-/);
  assert.match(css,/material-finder-file/);
  assert.doesNotMatch(component,/Recently uploaded|materials-type-chip/);

});

test("course selection is an exact filter, not a fuzzy match with another course",async()=>{
  const app=harness({files:[
    demo(1,{courseCode:"MACT 1121",title:"Final exam",materialType:"Past exam"}),
    demo(2,{courseCode:"MACT 1122",title:"Final exam",materialType:"Past exam"}),
    demo(3,{courseCode:"MACT 1121",title:"Lecture notes",materialType:"Notes"})
  ]});
  const results=await app.get("courseCode=MACT%201121&type=Past%20exam");
  assert.equal(results.status,200);
  assert.deepEqual(Array.from(results.body.materials).map((file:any)=>file.id),["file-0001"]);
  const all=await app.get("courseCode=MACT%201121");
  assert.equal(all.body.materials.length,2);
});
