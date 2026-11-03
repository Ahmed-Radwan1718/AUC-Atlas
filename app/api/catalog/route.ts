import { NextResponse } from "next/server";
import { courses } from "@/features/courses/data";
import { professors } from "@/features/professors/data";

export async function GET() {
  return NextResponse.json(
    { courses, professors },
    {
      headers: {
        "Cache-Control": "public, max-age=300, stale-while-revalidate=3600",
      },
    },
  );
}
