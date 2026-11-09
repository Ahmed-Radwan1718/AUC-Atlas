import type { NextRequest } from "next/server";
import { legacyAuthRoute } from "../../../server/authBridge";

export const runtime="nodejs";
export const dynamic="force-dynamic";

type Context={params:Promise<{auth:string}>};
async function dispatch(request:NextRequest,context:Context){
  const {auth}=await context.params;
  return legacyAuthRoute(request,auth);
}
export const GET=dispatch;
export const POST=dispatch;
export const PATCH=dispatch;
export const DELETE=dispatch;
