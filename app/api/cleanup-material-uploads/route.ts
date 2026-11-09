import type { NextRequest } from "next/server";
import { legacyAuthRoute } from "../../../server/authBridge";

// Dedicated route for the scheduled Vercel GET; the original handler is
// preserved behind the existing explicit, server-only legacy route bridge.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  return legacyAuthRoute(request, "cleanup-material-uploads");
}
