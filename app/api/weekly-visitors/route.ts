import { createHash, randomBytes } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { firestore } from "../../../server/firebase";
import { consumeRateLimit, requestIp, RateLimitError } from "../../../server/security";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const timeZone = "Africa/Cairo";
const cookieName = "aucAtlasUniqueVisitor";
const cookieMaxAge = 365 * 24 * 60 * 60;
const visitorPattern = /^[A-Za-z0-9_-]{43}$/;
const botPattern = /(bot|crawler|spider|slurp|archiver|preview|fetcher|monitor|headless|phantomjs|selenium|playwright|puppeteer|lighthouse|pagespeed|google-extended|chatgpt-user|anthropic-ai|claude-user|cohere-ai|perplexity-user|bytespider|ccbot|diffbot|imagesiftbot|omgilibot|youbot|applebot-extended|meta-externalagent|facebookexternalhit|bingpreview|python-requests|python-urllib|curl\/|wget\/|node-fetch|axios\/|postmanruntime)/i;
const carryoverMonth = "2026-11-01";
const carryoverWeek = "2026-11-02";

function cairoParts() {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone, year: "numeric", month: "2-digit", day: "2-digit"
  }).formatToParts(new Date());
  const calendar = Object.fromEntries(parts.filter(item => item.type !== "literal")
    .map(item => [item.type, Number(item.value)]));
  return { year: calendar.year, month: calendar.month, day: calendar.day };
}
function monthStart(): string {
  const calendar = cairoParts();
  return calendar.year + "-" + String(calendar.month).padStart(2, "0") + "-01";
}
function weekStart(): string {
  const calendar = cairoParts();
  const cairoDate = new Date(Date.UTC(calendar.year, calendar.month - 1, calendar.day));
  const daysSinceMonday = (cairoDate.getUTCDay() + 6) % 7;
  cairoDate.setUTCDate(cairoDate.getUTCDate() - daysSinceMonday);
  return cairoDate.toISOString().slice(0, 10);
}
function visitorHash(visitorId: string, start: string): string {
  return createHash("sha256").update(start + ":" + visitorId).digest("hex");
}
function visitorId(request: NextRequest): { value: string; created: boolean } {
  const existing = request.cookies.get(cookieName)?.value || "";
  return visitorPattern.test(existing)
    ? { value: existing, created: false }
    : { value: randomBytes(32).toString("base64url"), created: true };
}
function isBot(request: NextRequest): boolean {
  const userAgent = String(request.headers.get("user-agent") || "").trim();
  return !userAgent || botPattern.test(userAgent);
}
function visitResponse(count: number, monthly: boolean, start: string, counted?: boolean,
  cookie?: { value: string; created: boolean }): NextResponse {
  const payload = monthly ? { monthlyVisits: count, monthStart: start } : { weeklyVisits: count, weekStart: start };
  const response = NextResponse.json(typeof counted === "boolean" ? { ...payload, counted } : payload, {
    headers: { "Cache-Control": "private, no-store, max-age=0" }
  });
  if (cookie?.created) {
    response.cookies.set(cookieName, cookie.value, {
      maxAge: cookieMaxAge, path: "/", sameSite: "lax", httpOnly: true,
      secure: process.env.NODE_ENV === "production"
    });
  }
  return response;
}
async function getCount(ref: import("firebase-admin/firestore").DocumentReference): Promise<number> {
  const snapshot = await ref.get();
  return Math.max(0, Number((snapshot.exists ? snapshot.data() || {} : {}).count) || 0);
}
async function carryOverNovember(
  db: ReturnType<typeof firestore>, countRef: import("firebase-admin/firestore").DocumentReference,
  start: string
) {
  if (start !== carryoverMonth) return;
  const legacyRef = db.collection("weeklyUniqueVisitorCounts").doc(carryoverWeek);
  await db.runTransaction(async transaction => {
    const monthSnapshot = await transaction.get(countRef);
    const data = monthSnapshot.exists ? monthSnapshot.data() || {} : {};
    if (data.carryoverWeekStart === carryoverWeek) return;
    const weekSnapshot = await transaction.get(legacyRef);
    const weekData = weekSnapshot.exists ? weekSnapshot.data() || {} : {};
    const weeklyCount = Math.max(0, Math.floor(Number(weekData.count) || 0));
    if (!weeklyCount) return;
    transaction.set(countRef, {
      count: Math.max(0, Math.floor(Number(data.count) || 0)) + weeklyCount,
      carryoverWeekStart: carryoverWeek,
      carriedWeeklyVisits: weeklyCount,
      updatedAt: FieldValue.serverTimestamp()
    }, { merge: true });
  });
}
async function handle(request: NextRequest, isPost: boolean) {
  try {
    const db = firestore();
    const monthly = request.nextUrl.searchParams.get("period") === "month";
    const start = monthly ? monthStart() : weekStart();
    const countRef = db.collection(monthly ? "monthlyUniqueVisitorCounts" : "weeklyUniqueVisitorCounts").doc(start);
    if (monthly) await carryOverNovember(db, countRef, start);
    if (!isPost) return visitResponse(await getCount(countRef), monthly, start);
    if (isBot(request)) return visitResponse(await getCount(countRef), monthly, start, false);
    const cookie = visitorId(request);
    const visitorRef = countRef.collection("visitors").doc(visitorHash(cookie.value, start));
    if ((await visitorRef.get()).exists) {
      return visitResponse(await getCount(countRef), monthly, start, false, cookie);
    }
    try {
      await consumeRateLimit({
        scope: monthly ? "monthly-unique-visitors-ip" : "weekly-unique-visitors-ip",
        identifier: requestIp(request), maxAttempts: 30, windowMs: 60 * 60 * 1000,
        message: "Too many visitor-count requests from this connection."
      });
    } catch (error) {
      if (!(error instanceof RateLimitError)) throw error;
      return visitResponse(await getCount(countRef), monthly, start, false, cookie);
    }
    let count = 0, counted = false;
    await db.runTransaction(async transaction => {
      const seen = await transaction.get(visitorRef);
      const countSnapshot = await transaction.get(countRef);
      const countData = countSnapshot.exists ? countSnapshot.data() || {} : {};
      const carried = monthly && start === carryoverMonth && countData.carryoverWeekStart === carryoverWeek;
      const previousRef = carried
        ? db.collection("weeklyUniqueVisitorCounts").doc(carryoverWeek).collection("visitors")
          .doc(visitorHash(cookie.value, carryoverWeek))
        : null;
      const previous = previousRef ? await transaction.get(previousRef) : null;
      count = Math.max(0, Number(countData.count) || 0);
      if (seen.exists) return;
      const periodField = monthly ? "monthStart" : "weekStart";
      transaction.set(visitorRef, { [periodField]: start, firstSeenAt: FieldValue.serverTimestamp() });
      if (previous?.exists) return;
      count += 1;
      counted = true;
      transaction.set(countRef, {
        count, [periodField]: start, timeZone,
        updatedAt: FieldValue.serverTimestamp()
      }, { merge: true });
    });
    return visitResponse(count, monthly, start, counted, cookie);
  } catch {
    return NextResponse.json({ error: "Could not process the visit count." }, {
      status: 500, headers: { "Cache-Control": "private, no-store, max-age=0" }
    });
  }
}
export async function GET(request: NextRequest) { return handle(request, false); }
export async function POST(request: NextRequest) { return handle(request, true); }
