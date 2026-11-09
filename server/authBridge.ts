import "server-only";
import { NextRequest, NextResponse } from "next/server";

type LegacyReply = {
  status: (value: number) => LegacyReply;
  json: (value: unknown) => LegacyReply;
  send: (value: unknown) => LegacyReply;
  end: (value?: unknown) => LegacyReply;
  getHeader: (name: string) => string | string[] | undefined;
  setHeader: (name: string, value: string | string[]) => LegacyReply;
};
type LegacyHandler = (request: {
  method: string;
  headers: Record<string,string>;
  query: Record<string,string|string[]>;
  body: Record<string,unknown>;
  socket: {remoteAddress:string};
}, response: LegacyReply) => Promise<unknown>;

// Server-only compatibility boundary: retain the original authentication and security code.
// We intentionally do not expose the legacy handler through arbitrary user-selected paths.
const handlers: Record<string,() => LegacyHandler> = {
  "admin": () => require("./auth-legacy/routes/admin.js"),
  "cleanup-material-uploads": () => require("./auth-legacy/routes/cleanup-material-uploads.ts").default,
  "login": () => require("./auth-legacy/routes/login.ts").default,
  "me": () => require("./auth-legacy/routes/me.js"),
  "signup": () => require("./auth-legacy/routes/signup.ts").default,
  "logout": () => require("./auth-legacy/routes/logout.ts").default,
  "forgot-password": () => require("./auth-legacy/routes/forgot-password.ts").default,
  "google-auth": () => require("./auth-legacy/routes/google-auth.ts").default,
  "login-code": () => require("./auth-legacy/routes/login-code.js"),
  "verify-login-authenticator": () => require("./auth-legacy/routes/verify-login-authenticator.ts").default,
  "authenticator": () => require("./auth-legacy/routes/authenticator.ts").default,
  "sessions": () => require("./auth-legacy/routes/sessions.ts").default,
  "change-password": () => require("./auth-legacy/routes/change-password.ts").default,
  "delete-account": () => require("./auth-legacy/routes/delete-account.ts").default,
  "profile-photo": () => require("./auth-legacy/routes/profile-photo.ts").default
};

export function knownAuthRoute(name: string) { return Object.hasOwn(handlers,name); }

export async function legacyAuthRoute(request: NextRequest, routeName: string): Promise<NextResponse> {
  const getHandler = handlers[routeName];
  if (!getHandler) return NextResponse.json({error:"Not found."},{status:404});
  if (routeName==="logout" && request.method!=="POST") {
    return NextResponse.json({error:"Method not allowed."},{status:405,headers:{Allow:"POST"}});
  }
  if (!["GET","POST","PATCH","DELETE"].includes(request.method)) {
    return NextResponse.json({error:"Method not allowed."},{status:405,headers:{Allow:"GET, POST, PATCH, DELETE"}});
  }
  // Deny cross-origin browser requests that could mutate a cookie-authenticated account.
  if(request.method!=="GET"){
    const origin=request.headers.get("origin");
    if(origin){
      try {
        if(new URL(origin).origin!==request.nextUrl.origin){
          return NextResponse.json({error:"Cross-origin account requests are not allowed."},{status:403});
        }
      }catch{
        return NextResponse.json({error:"Invalid request origin."},{status:403});
      }
    }
  }

  const maxBodyBytes=routeName==="profile-photo" ? 7*1024*1024 : 128*1024;
  const declaredSize=Number(request.headers.get("content-length")||0);
  if(Number.isFinite(declaredSize) && declaredSize>maxBodyBytes){
    return NextResponse.json({error:"Request is too large."},{status:413});
  }
  let body: Record<string, unknown> = {};
  if (request.method!=="GET"&&request.method!=="DELETE" || request.headers.get("content-length") !== null) {
    const raw=await request.text();
    if(raw.length>maxBodyBytes) return NextResponse.json({error:"Request is too large."},{status:413});
    if(raw.trim()){
      try {
        const parsed: unknown=JSON.parse(raw);
        if(!parsed||typeof parsed!=="object"||Array.isArray(parsed))
          return NextResponse.json({error:"Invalid request body."},{status:400});
        body=parsed as Record<string,unknown>;
      }catch{
        return NextResponse.json({error:"Invalid JSON request."},{status:400});
      }
    }
  }
  const query: Record<string,string|string[]>={};
  request.nextUrl.searchParams.forEach((value,key)=>{
    const prev=query[key];
    if(prev===undefined)query[key]=value;
    else if(Array.isArray(prev))prev.push(value);
    else query[key]=[prev,value];
  });
  const reqHeaders=Object.fromEntries(request.headers.entries());
  let status=200, responseBody: unknown=null;
  let complete=false;
  const responseHeaders=new Map<string,string|string[]>();
  const reply: LegacyReply={
    status(value) { status=Number.isInteger(value)&&value>=100&&value<=599?value:500;return reply; },
    json(value) { responseBody=value;complete=true;return reply; },
    send(value) { responseBody=value;complete=true;return reply; },
    end(value) { responseBody=value??null;complete=true;return reply; },
    getHeader(name) { return responseHeaders.get(name.toLowerCase()); },
    setHeader(name,value) { responseHeaders.set(name.toLowerCase(),value);return reply; }
  };

  try {
    await getHandler()({
      method:request.method,headers:reqHeaders,query,body,
      socket:{remoteAddress:reqHeaders["x-real-ip"]||""}
    },reply);
    if(!complete) throw Error("Auth handler did not produce a response.");
    const headers=new Headers({
      "Cache-Control":"private, no-store, max-age=0",
      "X-Content-Type-Options":"nosniff"
    });
    for(const [key,value] of responseHeaders){
      if(key==="set-cookie") {
        for(const cookie of Array.isArray(value)?value:[value])headers.append("Set-Cookie",cookie);
      }else headers.set(key,Array.isArray(value)?value.join(", "):value);
    }
    const response=new NextResponse(
      typeof responseBody==="string"?responseBody:JSON.stringify(responseBody),
      {status,headers}
    );
    if(!headers.has("content-type"))response.headers.set("Content-Type",
      typeof responseBody==="string"?"text/plain; charset=utf-8":"application/json; charset=utf-8");
    return response;
  } catch {
    return NextResponse.json({error:"Could not process this account request."},
      {status:500,headers:{"Cache-Control":"private, no-store, max-age=0"}});
  }
}
