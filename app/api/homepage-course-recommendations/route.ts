import { NextRequest, NextResponse } from "next/server";
import { optionalSessionUser } from "../../../server/session";

// Keep the homepage API contract while its recommendation logic is rebuilt.
// No student records, degree plans, reviews or materials are read here.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const headers = { "Cache-Control": "private, no-store" };

export async function GET(request: NextRequest) {
  const user = await optionalSessionUser(request);
  return NextResponse.json(
    user
      ? { status: "unsupported-major", courses: [] }
      : { status: "sign-in", courses: [] },
    { headers }
  );
}
