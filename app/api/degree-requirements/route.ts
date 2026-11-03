import { NextResponse } from "next/server";
import requirementsData from "@/data/degree-requirements.json";
import type { DegreeRequirements } from "@/lib/degree-types";

export const dynamic = "force-dynamic";

// Static degree plans are vendored into v2; this route no longer reads the legacy site.
const requirements = requirementsData as DegreeRequirements;

export async function GET() {
  return NextResponse.json(
    { success: true, requirements },
    { headers: { "Cache-Control": "no-store" } },
  );
}
