import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import vm from "node:vm";
import ts from "typescript";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const source = readFileSync(path.join(root, "server/materialDiscovery.ts"), "utf8");
const js = ts.transpileModule(source, {
  compilerOptions: {module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}
}).outputText;

type Row = { id:string; data: Record<string,any> };
function material(id:string, group:string, date:number, status="approved"):Row {
  return {id,data:{
    uploadGroupId:group, createdAtIso:new Date(date).toISOString(),
    status,title:id,courseCode:"MATH 2010",fileName:id+".pdf"
  }};
}

function harness(rows:Row[], pivot=0) {
  const tables = new Map<string,Map<string,Record<string,any>>>([
    ["courseMaterials",new Map(rows.map(row=>[row.id,{...row.data}]))],
    ["materialDiscovery",new Map()],
    ["materialDiscoveryState",new Map()]
  ]);
  const reads:Record<string,number> = {courseMaterials:0,materialDiscovery:0,materialDiscoveryState:0};
  type Ref = {kind:"ref";collection:string;id:string};
  type Query = {
    kind:"query";collection:string;field:string;direction:string;
    condition?:{field:string;value:string};
    after?:string; pivot?:number; max?:number;
    limit:(max:number)=>Query;startAt:(n:number)=>Query;startAfter:(id:string)=>Query;
    get:()=>Promise<any>
  };
  function doc(ref:Ref) {
    const data = tables.get(ref.collection)!.get(ref.id);
    return {id:ref.id,exists:Boolean(data),data:()=>data?{...data}:undefined};
  }
  function query(collection:string, fields:Partial<Query>={}):Query {
    const q:Query = {
      kind:"query",collection,field:fields.field||"__name__",
      direction:fields.direction||"asc",condition:fields.condition,
      after:fields.after,pivot:fields.pivot,max:fields.max,
      limit(max){return query(collection,{...q,max});},
      startAt(pivot){return query(collection,{...q,pivot});},
      startAfter(after){return query(collection,{...q,after});},
      async get(){return execute(q);}
    };
    return q;
  }
  function execute(q:Query) {
    let entries=[...tables.get(q.collection)!.entries()];
    if (q.condition) entries=entries.filter(([,data])=>data[q.condition!.field]===q.condition!.value);
    entries.sort((a,b)=>{
      const left=q.field==="__name__"?a[0]:a[1][q.field];
      const right=q.field==="__name__"?b[0]:b[1][q.field];
      const order=left<right?-1:left>right?1:a[0].localeCompare(b[0]);
      return q.direction==="desc"?-order:order;
    });
    if (q.after) entries=entries.filter(([id])=>id>q.after!);
    if (q.pivot!==undefined) entries=entries.filter(([,data])=>Number(data[q.field])>=q.pivot!);
    if (q.max!==undefined) entries=entries.slice(0,q.max);
    reads[q.collection]+=entries.length;
    return {size:entries.length,docs:entries.map(([id])=>doc({kind:"ref",collection:q.collection,id}))};
  }
  const db = {
    collection(name:string) {
      if (!tables.has(name)) throw Error("Unexpected collection "+name);
      return {
        doc(id:string):Ref {return {kind:"ref",collection:name,id};},
        orderBy(field:string,direction="asc"){return query(name,{field,direction});},
        where(field:string,op:string,value:string) {
          assert.equal(op,"==");
          return query(name,{condition:{field,value}});
        }
      };
    },
    runTransaction<T>(fn:(tx:any)=>Promise<T>):Promise<T>{
      const tx={
        async get(ref:Ref|Query){
          if(ref.kind==="query")return execute(ref);
          reads[ref.collection]++;
          return doc(ref);
        },
        set(ref:Ref,data:Record<string,any>,options?:{merge:boolean}) {
          const collection=tables.get(ref.collection)!;
          collection.set(ref.id,options?.merge
            ? {...(collection.get(ref.id)||{}),...data}:data);
        },
        delete(ref:Ref){tables.get(ref.collection)!.delete(ref.id);}
      };
      return fn(tx);
    }
  };
  const module:{exports:Record<string,any>}={exports:{}};
  const testMath=Object.create(Math);
  testMath.random=()=>pivot;
  vm.runInNewContext(js,{
    module,exports:module.exports,Promise,Date,Map,Number,Math:testMath,
    require(id:string) {
      if (id==="node:crypto")return require("node:crypto");
      if (id==="firebase-admin/firestore")return {FieldPath:{documentId:()=>"__name__"}};
      if (id==="./firebase")return {firestore:()=>db};
      if (id==="./materials")return {
        serializeMaterialData:(id:string,data:any)=>({id,...data})
      };
      throw Error("Unexpected import "+id);
    }
  },{filename:"materialDiscovery.ts"});
  return {
    api:module.exports as {
      randomCourseMaterials:(n:number)=>Promise<Row["data"][]>;
      refreshMaterialDiscovery:(id:string,group:string)=>Promise<void>;
    },
    tables,reads
  };
}

test("first visit reads at most one 32-document migration batch, not the whole collection",async()=>{
  const app=harness(Array.from({length:180},(_,i)=>
    material("file-"+String(i).padStart(4,"0"),"group-"+i,Date.UTC(2026,10,1,i%24))));
  const result=await app.api.randomCourseMaterials(6);
  assert.equal(result.length,6);
  assert.ok(app.reads.courseMaterials<=32);
  assert.equal(app.tables.get("materialDiscovery")!.size,32);
  assert.equal(app.tables.get("materialDiscoveryState")!.get("v1")?.complete,false);
});

test("index contains one entry per group, always representing the newest non-rejected file",async()=>{
  const now=Date.UTC(2026,10,13);
  const app=harness([
    material("older","group-a",now-1000),
    material("newer","group-a",now),
    material("rejected","group-c",now,"rejected"),
    material("other","group-b",now-500),
    material("legacy","",now+100)
  ]);
  const results=await app.api.randomCourseMaterials(6);
  const ids=results.map(item=>item.id).sort();
  assert.deepEqual(ids,["legacy","newer","other"]);
  assert.equal(app.tables.get("materialDiscovery")!.size,3);
});

test("after backfill, opening Courses reads no material documents",async()=>{
  const app=harness(Array.from({length:15},(_,i)=>
    material("file-"+i,"group-"+i,Date.UTC(2026,10,13,i))));
  await app.api.randomCourseMaterials(6);
  const oldReads=app.reads.courseMaterials;
  const second=await app.api.randomCourseMaterials(6);
  assert.equal(second.length,6);
  assert.equal(app.reads.courseMaterials,oldReads);
  assert.ok(app.reads.materialDiscovery<= 12+2+15);
});

test("editing or rejecting a group representative updates the index without scanning unrelated uploads",async()=>{
  const now=Date.UTC(2026,10,13);
  const app=harness([
    material("a-old","shared",now-500),
    material("a-new","shared",now),
    material("unrelated","other",now+100)
  ]);
  await app.api.randomCourseMaterials(6);
  const stored=app.tables.get("courseMaterials")!;
  stored.get("a-new")!.status="rejected";
  const before=app.reads.courseMaterials;
  await app.api.refreshMaterialDiscovery("a-new","shared");
  assert.equal(app.reads.courseMaterials-before,2);
  const results=await app.api.randomCourseMaterials(6);
  assert.deepEqual(results.map(item=>item.id).sort(),["a-old","unrelated"]);
});

test("selection wraps around the index and still returns distinct upload groups",async()=>{
  const app=harness(Array.from({length:8},(_,i)=>
    material("file-"+i,"group-"+i,Date.UTC(2026,10,13,i))),0.9999999);
  await app.api.randomCourseMaterials(6);
  const results=await app.api.randomCourseMaterials(6);
  assert.equal(results.length,6);
  assert.equal(new Set(results.map(item=>item.id)).size,6);
});
