import { NextResponse } from "next/server";
import { cleanString, getErrorStatus, getRequestIp } from "@/lib/server/backend-utils";
import { FieldValue, getAdminFirestore } from "@/lib/server/firebase-admin";
import { consumeSecurityRateLimit } from "@/lib/server/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const POPULARITY_TIME_ZONE = "Africa/Cairo";
const POPULARITY_WINDOW_DAYS = 30;
const POPULAR_COURSE_LIMIT = 8;
const COURSE_VIEW_IP_WINDOW_MS = 60 * 60 * 1000;
const COURSE_VIEW_MAX_POSTS_PER_IP = 120;
const COURSE_VIEW_REPEAT_WINDOW_MS = 24 * 60 * 60 * 1000;
const COURSE_VIEW_MAX_PER_COURSE_AND_IP = 5;

function normalizeCourseCode(value: unknown): string {
  return cleanString(value, 40).toUpperCase();
}

function isValidCourseCode(value: string): boolean {
  return /^[A-Z0-9]{2,12}(?: [A-Z0-9]{1,12}){1,2}$/.test(value);
}

function getCairoDateKey(date: Date): string {
  const dateParts = new Intl.DateTimeFormat("en-US", {
    timeZone: POPULARITY_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const calendarDate: Record<string, number> = {};

  dateParts.forEach((part) => {
    if (part.type !== "literal") calendarDate[part.type] = Number(part.value);
  });

  return [
    String(calendarDate.year).padStart(4, "0"),
    String(calendarDate.month).padStart(2, "0"),
    String(calendarDate.day).padStart(2, "0"),
  ].join("-");
}

function getPopularityWindowStart(): string {
  const todayParts = getCairoDateKey(new Date()).split("-").map(Number);
  const startDate = new Date(Date.UTC(todayParts[0], todayParts[1] - 1, todayParts[2]));
  startDate.setUTCDate(startDate.getUTCDate() - (POPULARITY_WINDOW_DAYS - 1));
  return startDate.toISOString().slice(0, 10);
}

async function getPopularCourses() {
  const periodStart = getPopularityWindowStart();
  const snapshot = await getAdminFirestore()
    .collection("courseDailyViews")
    .where("date", ">=", periodStart)
    .get();
  const totals: Record<string, number> = Object.create(null) as Record<string, number>;

  snapshot.forEach((doc) => {
    const data = doc.data() || {};
    const courseCode = normalizeCourseCode(data.courseCode);
    const count = Math.max(0, Number(data.count) || 0);
    if (!isValidCourseCode(courseCode) || !count) return;
    totals[courseCode] = (totals[courseCode] || 0) + count;
  });

  const popularCourses = Object.keys(totals)
    .map((courseCode) => ({ courseCode, views: totals[courseCode] }))
    .sort((a, b) => b.views - a.views || a.courseCode.localeCompare(b.courseCode))
    .slice(0, POPULAR_COURSE_LIMIT);

  return { periodStart, popularCourses };
}

export async function GET() {
  try {
    const popularity = await getPopularCourses();
    return NextResponse.json(
      {
        periodDays: POPULARITY_WINDOW_DAYS,
        periodStart: popularity.periodStart,
        popularCourses: popularity.popularCourses,
      },
      {
        headers: {
          "Cache-Control":
            "public, max-age=60, s-maxage=300, stale-while-revalidate=600",
        },
      },
    );
  } catch {
    return NextResponse.json(
      { error: "Could not process course popularity." },
      { status: 500, headers: { "Cache-Control": "private, no-store, max-age=0" } },
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
    const courseCode = normalizeCourseCode(body.courseCode);

    if (!isValidCourseCode(courseCode)) {
      return NextResponse.json(
        { error: "Enter a valid course code." },
        { status: 400 },
      );
    }

    const date = getCairoDateKey(new Date());
    const requestIp = getRequestIp(request);

    try {
      await consumeSecurityRateLimit({
        scope: "course-popularity-ip",
        identifier: requestIp,
        maxAttempts: COURSE_VIEW_MAX_POSTS_PER_IP,
        windowMs: COURSE_VIEW_IP_WINDOW_MS,
        message: "Too many course-view requests from this connection.",
      });
      await consumeSecurityRateLimit({
        scope: `course-popularity-course:${date}:${courseCode}`,
        identifier: requestIp,
        maxAttempts: COURSE_VIEW_MAX_PER_COURSE_AND_IP,
        windowMs: COURSE_VIEW_REPEAT_WINDOW_MS,
        message: "This course has already received several views from this connection.",
      });
    } catch (error) {
      if (getErrorStatus(error) !== 429) throw error;
      return NextResponse.json(
        { success: true, counted: false },
        { headers: { "Cache-Control": "private, no-store, max-age=0" } },
      );
    }

    await getAdminFirestore()
      .collection("courseDailyViews")
      .doc(`${date}--${encodeURIComponent(courseCode)}`)
      .set(
        {
          courseCode,
          date,
          count: FieldValue.increment(1),
          updatedAt: FieldValue.serverTimestamp(),
        },
        { merge: true },
      );

    return NextResponse.json(
      { success: true, counted: true },
      { headers: { "Cache-Control": "private, no-store, max-age=0" } },
    );
  } catch {
    return NextResponse.json(
      { error: "Could not process course popularity." },
      { status: 500, headers: { "Cache-Control": "private, no-store, max-age=0" } },
    );
  }
}
