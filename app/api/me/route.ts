import type { NextRequest } from "next/server";
import { legacyAuthRoute } from "../../../server/authBridge";
export const runtime="nodejs";
export const dynamic="force-dynamic";
export async function GET(request:NextRequest) { return legacyAuthRoute(request,"me"); }
export async function PATCH(request:NextRequest) { return legacyAuthRoute(request,"me"); }
