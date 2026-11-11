import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import { createRequire } from "node:module";
import { readFileSync } from "node:fs";
import path from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import vm from "node:vm";
import ts from "typescript";

const require = createRequire(import.meta.url);
const directory = path.dirname(fileURLToPath(import.meta.url));
const source = ts.transpileModule(
  readFileSync(path.resolve(directory,"../server/materialUpload.ts"),"utf8"),
  {compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}
).outputText;

type Stored = Record<string,unknown>;
const maxSize = 25 * 1024 * 1024;
const request = (fileSize = 1024) => ({
  courseCode:"MATH 2010",courseTitle:"Calculus 2",professor:"AUC Professor",
  semester:"Fall 2026",materialType:"Past exam",title:"Midterm 2",
  fileName:"midterm.pdf",fileSize
});

function harness(seed: {
  stored?: Stored[];
  authorizations?: Stored[];
} = {}) {
  const collections = new Map<string,Map<string,Stored>>();
  const collection = (name:string) => {
    if(!collections.has(name))collections.set(name,new Map());
    return collections.get(name)!;
  };
  collection("users").set("student",{fullName:"AUC student"});
  for(const [index,data] of (seed.stored||[]).entries())
    collection("courseMaterials").set("existing-"+index,{uploaderUid:"student",...data});
  for(const [index,data] of (seed.authorizations||[]).entries())
    collection("materialUploadAuthorizations").set("pending-"+index,{uploaderUid:"student",...data});

  let limiterCount = 0;
  const rateLimits: Array<Record<string,unknown>> = [];
  const uploaded: Record<string,any> = {};
  const fieldValue = {serverTimestamp:()=>new Date()};
  class MockTimestamp { static fromDate(d:Date){return d;} toMillis(){return 0;} }
  const db = {
    collection(name:string) {
      return {
        doc(id:string) {
          return {
            kind:"doc",name,id,
            async get() {
              const data=collection(name).get(id);
              return {id,exists:Boolean(data),data:()=>data?{...data}:undefined};
            }
          };
        },
        where(field:string,op:string,value:string) {
          assert.equal(op,"==");
          return {kind:"query",name,field,value};
        }
      };
    },
    async runTransaction<T>(callback:(tx:any)=>Promise<T>):Promise<T> {
      const writes:Array<{kind:string;ref:any;data:Stored;merge?:boolean}> = [];
      const tx = {
        async get(ref:any) {
          if(ref.kind==="query")
            return {docs:[...collection(ref.name).entries()]
              .filter(([,data])=>data[ref.field]===ref.value)
              .map(([id,data])=>({id,data:()=>({...data})}))};
          const data=collection(ref.name).get(ref.id);
          return {id:ref.id,exists:Boolean(data),data:()=>data?{...data}:undefined};
        },
        create(ref:any,data:Stored) {writes.push({kind:"create",ref,data});},
        set(ref:any,data:Stored,options?:{merge?:boolean}) {
          writes.push({kind:"set",ref,data,merge:options?.merge});
        },
        update(ref:any,data:Stored) {writes.push({kind:"update",ref,data});}
      };
      const result=await callback(tx);
      for(const write of writes) {
        const target=collection(write.ref.name);
        if(write.kind==="create")assert.ok(!target.has(write.ref.id));
        target.set(write.ref.id,write.merge||write.kind==="update"
          ? {...(target.get(write.ref.id)||{}),...write.data}: {...write.data});
      }
      return result;
    }
  };
  const user={uid:"student",email:"student@aucegypt.edu"};
  const module:{exports:Record<string,any>}={exports:{}};
  const mockedRateLimit = async (settings:Record<string,unknown>) => {
    rateLimits.push(settings);
    if(++limiterCount>10)
      throw Object.assign(new Error("Rate limit reached."),{statusCode:429});
  };
  const providerFetch = async (url:string) => {
    if(url.includes("/details")) {
      return {ok:true,status:200,async json(){return {...uploaded};}};
    }
    if(url.includes("/files?")) {
      return {ok:true,status:200,async json(){return [];}};
    }
    if(url.includes("api.imagekit.io/v1/files/")) {
      return {ok:true,status:204,async json(){return {};}};
    }
    throw Error("Unexpected storage call: "+url);
  };
  vm.runInNewContext(source,{
    module,exports:module.exports,Buffer,Date,URLSearchParams,fetch:providerFetch,process:{
      env:{
        IMAGEKIT_PUBLIC_KEY:"public_test_key",
        IMAGEKIT_PRIVATE_KEY:"private_test_key",
        IMAGEKIT_URL_ENDPOINT:"https://ik.imagekit.io/test",
      }
    },
    require(id:string) {
      if(id==="node:crypto")return require("node:crypto");
      if(id==="firebase-admin/firestore")return {FieldValue:fieldValue,Timestamp:MockTimestamp};
      if(id==="./firebase")return {
        firestore:()=>db,
        firebaseAuth:()=>({async getUser(){return {email:user.email,emailVerified:true};}})
      };
      if(id==="./materialFiles")return {
        allowedMime:{pdf:"application/pdf"},maxMaterialBytes:()=>maxSize,
        safeFileName:(value:string)=>String(value).replace(/[\\/]/g,"").slice(0,240)
      };
      if(id==="./materials")return {serializeMaterialData:(id:string,data:Stored)=>({id,...data})};
      if(id==="./security")return {consumeRateLimit:mockedRateLimit};
      throw Error("Unexpected import "+id);
    }
  },{filename:"materialUpload.ts"});
  const api=module.exports as {
    authorizeMaterial:(user:any,body:any)=>Promise<any>;
    cancelMaterial:(user:any,body:any)=>Promise<any>;
    registerMaterial:(user:any,body:any)=>Promise<any>;
  };
  return {
    ...api,user,collections,collection,rateLimits,uploaded,
    authorize:(size?:number)=>api.authorizeMaterial(user,request(size))
  };
}

function verifyJwt(result:any) {
  const token=String(result.uploadParameters.token);
  const parts=token.split(".");
  assert.equal(parts.length,3);
  const header=JSON.parse(Buffer.from(parts[0],"base64url").toString());
  const payload=JSON.parse(Buffer.from(parts[1],"base64url").toString());
  const digest=createHmac("sha256","private_test_key")
    .update(parts[0]+"."+parts[1]).digest("base64url");
  assert.equal(parts[2],digest);
  assert.equal(header.alg,"HS256");
  assert.equal(header.kid,"public_test_key");
  return payload;
}

test("signed V2 JWT binds destination, privacy, overwrite controls and file size",async()=>{
  const app=harness();
  const auth=await app.authorize(4096);
  assert.equal(auth.uploadUrl,"https://upload.imagekit.io/api/v2/files/upload");
  assert.equal(auth.signature,undefined);
  assert.equal(auth.publicKey,undefined);
  const payload=verifyJwt(auth);
  assert.equal(payload.folder,"/auc-atlas/materials");
  assert.equal(payload.fileName,auth.imagekitFilePath.split("/").pop());
  assert.equal(payload.isPrivateFile,"true");
  assert.equal(payload.useUniqueFileName,"false");
  assert.equal(payload.overwriteFile,"false");
  assert.match(payload.checks,/file.size.*<= 4096/);
  assert.deepEqual(
    Object.keys(auth.uploadParameters).sort(),
    ["fileName","folder","isPrivateFile","useUniqueFileName","overwriteFile","checks","token"].sort()
  );
  assert.ok(payload.exp>payload.iat && payload.exp-payload.iat<=1800);
});

test("only two active authorizations may exist per student",async()=>{
  const app=harness();
  await app.authorize();
  await app.authorize();
  await assert.rejects(app.authorize(),{statusCode:429});
  assert.equal(app.collection("materialUploadAuthorizations").size,2);
});

test("pending authorizations count against storage quota, including legacy pending ones",async()=>{
  const app=harness({
    stored:[{size:240*1024*1024,status:"approved"}],
    authorizations:[{
      fileSize:10*1024*1024,
      expiresAt:new Date(Date.now()+60_000),
      cancelledAt:null,consumedAt:null
    }]
  });
  await assert.rejects(app.authorize(1024),{statusCode:413});
  assert.equal(app.collection("materialUploadAuthorizations").size,1);
});

test("expired/cancelled authorizations do not block fresh uploads",async()=>{
  const app=harness({
    authorizations:[
      {fileSize:maxSize,expiresAt:new Date(Date.now()-60*60*1000)},
      {fileSize:maxSize,expiresAt:new Date(Date.now()+60_000),cancelledAt:new Date()}
    ]
  });
  await app.authorize();
  assert.equal(app.collection("materialUploadAuthorizations").size,3);
});

test("cancelling removes a pending reservation from concurrency and quota checks",async()=>{
  const app=harness();
  const first=await app.authorize();
  const second=await app.authorize();
  await app.cancelMaterial(app.user,{authorizationId:first.authorizationId});
  const old=app.collection("materialUploadAuthorizations").get(first.authorizationId);
  assert.ok(old?.cancelledAt);
  await app.authorize();
  assert.equal(app.collection("materialUploadAuthorizations").size,3);
  assert.ok(app.collection("materialUploadAuthorizations").has(second.authorizationId));
});

test("registration changes an upload from pending quota to registered quota",async()=>{
  const app=harness();
  const auth=await app.authorize(2048);
  const id="abcdef0123456789abcdef01";
  Object.assign(app.uploaded,{
    fileId:id,filePath:auth.imagekitFilePath,name:auth.imagekitFilePath.split("/").pop(),
    size:2048,mime:"application/pdf",isPrivateFile:true
  });
  const registered=await app.registerMaterial(app.user,{
    uploadAuthorizationId:auth.authorizationId,
    imagekitFilePath:auth.imagekitFilePath,imagekitFileId:id
  });
  assert.equal(registered.alreadySaved,false);
  const saved=app.collection("courseMaterials").get("imagekit-"+id);
  assert.equal(saved?.size,2048);
  const pending=app.collection("materialUploadAuthorizations").get(auth.authorizationId);
  assert.ok(pending?.consumedAt);
  await app.authorize(2048);
});

test("hourly authorization rate limit applies even if a client cancels requests",async()=>{
  const app=harness();
  for(let i=0;i<10;i++){
    const auth=await app.authorize();
    await app.cancelMaterial(app.user,{authorizationId:auth.authorizationId});
  }
  await assert.rejects(app.authorize(),{statusCode:429});
  assert.equal(app.rateLimits.length,11);
  assert.equal(app.rateLimits[0].maxAttempts,10);
  assert.equal(app.rateLimits[0].windowMs,60*60*1000);
});

test("client only sends signed V2 parameters and no V1 signature fields",()=>{
  const client=readFileSync(path.resolve(directory,"../features/courses/materialUploadForm.ts"),"utf8");
  assert.match(client,/upload.imagekit.io\/api\/v2\/files\/upload/);
  assert.doesNotMatch(client,/formData.append\(\s*"signature"/);
  assert.doesNotMatch(client,/formData.append\(\s*"expire"/);
  assert.match(client,/Object.keys\(uploadParameters\)/);
});
