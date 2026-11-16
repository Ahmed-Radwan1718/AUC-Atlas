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
  const sorted=[...files].filter(row=>row.data.createdAt).sort((a,b)=>
    b.data.createdAt.getTime()-a.data.createdAt.getTime() ||
    b.id.localeCompare(a.id));
  const ids=new Map(sorted.map(row=>[row.id,row]));
  let reads=0,cursorReads=0,verified=0,rateLimitCalls=0;
  const queriedCodes:string[]=[];
  const requestedLimits:number[]=[];
  const module:{exports:Record<string,any>}={exports:{}};

  const snapshot=(row:Row)=>({
    id:row.id,exists:true,data:()=>({...row.data}),
    get:(key:string)=>row.data[key]
  });
  const query=(rows:Row[],afterId:string|null=null)=>({
    orderBy(field:string,direction:string){
      assert.equal(field,"createdAt");
      assert.equal(direction,"desc");
      return this;
    },
    startAfter(doc:{id:string}){
      return query(rows,doc.id);
    },
    limit(amount:number){
      requestedLimits.push(amount);
      return {
        async get(){
          const index=afterId===null?0:rows.findIndex(row=>row.id===afterId)+1;
          assert.ok(index>=0,"Cursor must refer to a document in the queried course");
          const docs=rows.slice(index,index+amount).map(snapshot);
          reads+=docs.length;
          return {docs};
        }
      };
    }
  });
  const db={
    collection(name:string) {
      assert.equal(name,"courseMaterials");
      return {
        doc(id:string){
          return {get:async()=>{
            cursorReads++;
            reads++;
            const data=ids.get(id)?.data;
            return {
              exists:Boolean(data),id,
              data:()=>data,
              get:(key:string)=>data?.[key]
            };
          }};
        },
        where(field:string,operator:string,code:string){
          assert.equal(field,"courseCode");
          assert.equal(operator,"==");
          queriedCodes.push(code);
          return query(sorted.filter(row=>row.data.courseCode===code));
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
          courseTitle:data.courseTitle,materialType:data.materialType||data.type||data.category,
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
  return {
    get,
    get reads(){return reads;},
    get cursorReads(){return cursorReads;},
    get queriedCodes(){return [...queriedCodes];},
    get requestedLimits(){return [...requestedLimits];},
    get verified(){return verified;},
    get rateLimitCalls(){return rateLimitCalls;}
  };
}

test("an unsigned visitor cannot enumerate files or query Firestore",async()=>{
  const app=harness({authorized:false,files:[demo(1)]});
  const result=await app.get("courseCode=MATH%202010&q=MATH");
  assert.equal(result.status,401);
  assert.equal(result.body.materialsLocked,true);
  assert.equal(app.reads,0);
  assert.equal(app.verified,0);
});

test("verified students receive private, downloadable file results without uploader identities",async()=>{
  const app=harness({files:[demo(1)]});
  const result=await app.get("courseCode=MATH%202010");
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
  const one=await app.get("courseCode=MATH%202010");
  assert.equal(one.body.materials.length,24);
  assert.equal(one.body.hasMore,true);
  assert.ok(one.body.nextCursor);
  const two=await app.get("courseCode=MATH%202010&cursor="+encodeURIComponent(one.body.nextCursor));
  assert.equal(two.body.materials.length,24);
  const three=await app.get("courseCode=MATH%202010&cursor="+encodeURIComponent(two.body.nextCursor));
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
  const result=await app.get("courseCode=MATH%202010&q=practice&type=Practice%20sheet&semester=Spring%202026");
  assert.deepEqual(Array.from(result.body.materials).map((x:any)=>x.id),["file-0001"]);
  assert.equal(result.body.hasMore,false);
  const professor=await app.get("courseCode=MATH%202010&q=example");
  assert.deepEqual(Array.from(professor.body.materials).map((x:any)=>x.id),["file-0001"]);
  const course=await app.get("courseCode=MATH%202010&q=math%202010");
  assert.equal(course.body.materials.length,3);
});

test("rejected files never appear, even when matching the search",async()=>{
  const app=harness({files:[demo(1,{status:"rejected"}),demo(2)]});
  const result=await app.get("courseCode=MATH%202010");
  assert.deepEqual(Array.from(result.body.materials).map((x:any)=>x.id),["file-0002"]);
});

test("sparse searches can continue beyond the bounded scan window",async()=>{
  const files=Array.from({length:320},(_,i)=>demo(i));
  files[0].data.title="Needle material";
  const app=harness({files});
  const one=await app.get("courseCode=MATH%202010&q=needle");
  assert.equal(one.body.materials.length,0);
  assert.equal(one.body.hasMore,true);
  const two=await app.get("courseCode=MATH%202010&q=needle&cursor="+one.body.nextCursor);
  assert.equal(two.body.materials.length,1);
  assert.equal(two.body.materials[0].title,"Needle material");
  assert.equal(two.body.hasMore,false);
});

test("invalid cursor is rejected instead of querying arbitrary documents",async()=>{
  const app=harness({files:[demo(1)]});
  const result=await app.get("courseCode=MATH%202010&cursor=../users");
  assert.equal(result.status,400);
});

test("the Courses landing and existing course detail routes remain available",()=>{
  const home=read("app/courses/page.tsx");
  const detail=read("app/courses/[slug]/page.tsx");
  const navbar=read("components/Header.tsx");
  const component=read("features/courses/Courses.tsx");
  assert.match(home,/import Courses from/);
  assert.match(home,/return <Courses \/>/);
  assert.doesNotMatch(home,/MaterialsDirectory/);
  assert.match(detail,/return <Courses courseSlug={slug}/);
  assert.match(navbar,/href: "\/courses", label: "Courses"/);
  assert.match(component,/initializeCourses\(courseSlug\)/);
  assert.match(component,/id="course-search-input"/);
  assert.match(component,/id="courses-home-content"/);
  assert.match(component,/id="course-browse-grid"/);
  assert.match(component,/id="course-recent-materials"/);
  assert.match(component,/id="course-materials-list"/);
  assert.match(component,/id="course-upload-start"/);
  assert.match(component,/CourseDialogs/);
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

test("the directory requires a selected course and never performs a global scan",async()=>{
  const app=harness({files:[demo(1)]});
  const response=await app.get("");
  assert.equal(response.status,400);
  assert.equal(app.reads,0);
  assert.deepEqual(app.queriedCodes,[]);
  assert.equal(app.verified,0);
});

test("course filtering happens in Firestore before any document is billed",async()=>{
  const unrelated=Array.from({length:320},(_,i)=>demo(1000+i,{courseCode:"ECON 2011"}));
  const app=harness({files:[...unrelated,demo(1),demo(2),demo(3)]});
  const response=await app.get("courseCode=math%202010");
  assert.equal(response.status,200);
  assert.equal(response.body.materials.length,3);
  assert.deepEqual(app.queriedCodes,["MATH 2010"]);
  assert.equal(app.reads,3);
  assert.ok(app.requestedLimits.every(limit=>limit<=25));
});

test("a full page fetches only 25 docs and preserves its lookahead for the next page",async()=>{
  const app=harness({files:Array.from({length:80},(_,i)=>demo(i))});
  const first=await app.get("courseCode=MATH%202010");
  assert.equal(first.body.materials.length,24);
  assert.equal(first.body.hasMore,true);
  assert.equal(app.reads,25);
  assert.deepEqual(app.requestedLimits,[25]);

  const second=await app.get("courseCode=MATH%202010&cursor="+first.body.nextCursor);
  assert.equal(second.body.materials.length,24);
  assert.equal(second.body.hasMore,true);
  assert.equal(second.body.materials[0].id,"file-0055");
  assert.equal(app.cursorReads,1);
  assert.ok(app.requestedLimits.every(limit=>limit<=25));
});

test("cursor cannot reference a document in another course",async()=>{
  const app=harness({files:[demo(1),demo(2,{courseCode:"PHYS 1011"})]});
  const response=await app.get("courseCode=MATH%202010&cursor=file-0002");
  assert.equal(response.status,400);
  assert.equal(app.queriedCodes.length,0);
  assert.equal(app.cursorReads,1);
});

test("legacy material type and missing approval status still match",async()=>{
  const app=harness({files:[
    demo(1,{status:undefined,materialType:undefined,type:"Past exam"}),
    demo(2,{materialType:undefined,category:"Past exam",semester:"Spring 2026"}),
    demo(3,{status:"rejected",materialType:"Past exam"})
  ]});
  const response=await app.get("courseCode=MATH%202010&type=Past%20exam");
  assert.deepEqual(Array.from(response.body.materials).map((material:any)=>material.id),
    ["file-0002","file-0001"]);
});
