import { createHash, randomBytes } from "node:crypto";
import { NextResponse } from "next/server";
import type { DocumentReference } from "firebase-admin/firestore";
import { cleanString, getCookie, getErrorStatus, getRequestIp } from "@/lib/server/backend-utils";
import { FieldValue, getAdminFirestore } from "@/lib/server/firebase-admin";
import { consumeSecurityRateLimit } from "@/lib/server/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const VISITOR_TIME_ZONE = "Africa/Cairo";
const VISITOR_COOKIE_NAME = "aucAtlasUniqueVisitor";
const VISITOR_COOKIE_MAX_AGE_SECONDS = 365 * 24 * 60 * 60;
const VISITOR_COOKIE_PATTERN = /^[A-Za-z0-9_-]{43}$/;
const VISITOR_RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000;
const VISITOR_MAX_POSTS_PER_WINDOW = 30;
const AUTOMATED_VISITOR_PATTERN =
  /(bot|crawler|spider|slurp|archiver|preview|fetcher|monitor|headless|phantomjs|selenium|playwright|puppeteer|lighthouse|pagespeed|google-extended|chatgpt-user|anthropic-ai|claude-user|cohere-ai|perplexity-user|bytespider|ccbot|diffbot|imagesiftbot|omgilibot|youbot|applebot-extended|meta-externalagent|facebookexternalhit|bingpreview|python-requests|python-urllib|curl\/|wget\/|node-fetch|axios\/|postmanruntime)/i;

function isAutomatedVisitor(request: Request): boolean {
  const userAgent = String(request.headers.get("user-agent") || "").trim();
  return !userAgent || AUTOMATED_VISITOR_PATTERN.test(userAgent);
}

function requestIsSecure(request: Request): boolean {
  const forwardedProtocol = String(request.headers.get("x-forwarded-proto") || "")
    .split(",")[0]
    .trim()
    .toLowerCase();

  return (
    forwardedProtocol === "https" ||
    new URL(request.url).protocol === "https:" ||
    process.env.NODE_ENV === "production"
  );
}

function getVisitorCookieValue(request: Request, visitorId: string): string {
  const attributes = [
    `${VISITOR_COOKIE_NAME}=${visitorId}`,
    "Path=/",
    `Max-Age=${VISITOR_COOKIE_MAX_AGE_SECONDS}`,
    "HttpOnly",
    "SameSite=Lax",
  ];

  if (requestIsSecure(request)) attributes.push("Secure");
  return attributes.join("; ");
}

function getOrCreateVisitorId(request: Request) {
  const existingVisitorId = getCookie(request, VISITOR_COOKIE_NAME);
  if (VISITOR_COOKIE_PATTERN.test(existingVisitorId)) {
    return { visitorId: existingVisitorId, setCookie: "" };
  }

  const visitorId = randomBytes(32).toString("base64url");
  return { visitorId, setCookie: getVisitorCookieValue(request, visitorId) };
}

function getWeeklyVisitorHash(visitorId: string, weekStart: string): string {
  return createHash("sha256").update(`${weekStart}:${visitorId}`).digest("hex");
}

function getCurrentWeekStart(): string {
  const dateParts = new Intl.DateTimeFormat("en-US", {
    timeZone: VISITOR_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const calendarDate: Record<string, number> = {};

  dateParts.forEach((part) => {
    if (part.type !== "literal") calendarDate[part.type] = Number(part.value);
  });

  const cairoDate = new Date(
    Date.UTC(calendarDate.year, calendarDate.month - 1, calendarDate.day),
  );
  const daysSinceMonday = (cairoDate.getUTCDay() + 6) % 7;
  cairoDate.setUTCDate(cairoDate.getUTCDate() - daysSinceMonday);
  return cairoDate.toISOString().slice(0, 10);
}

async function getWeeklyVisitCount(countRef: DocumentReference) {
  const countSnapshot = await countRef.get();
  const countData = countSnapshot.exists ? countSnapshot.data() || {} : {};
  return Math.max(0, Number(countData.count) || 0);
}

function json(
  body: unknown,
  status = 200,
  setCookie = "",
): NextResponse {
  const response = NextResponse.json(body, {
    status,
    headers: { "Cache-Control": "private, no-store, max-age=0" },
  });
  if (setCookie) response.headers.set("Set-Cookie", setCookie);
  return response;
}

export async function GET() {
  try {
    const weekStart = getCurrentWeekStart();
    const countRef = getAdminFirestore()
      .collection("weeklyUniqueVisitorCounts")
      .doc(weekStart);

    return json({ weeklyVisits: await getWeeklyVisitCount(countRef), weekStart });
  } catch {
    return json({ error: "Could not process the weekly visit count." }, 500);
  }
}

export async function POST(request: Request) {
  try {
    const db = getAdminFirestore();
    const weekStart = getCurrentWeekStart();
    const countRef = db.collection("weeklyUniqueVisitorCounts").doc(weekStart);

    if (isAutomatedVisitor(request)) {
      return json({
        weeklyVisits: await getWeeklyVisitCount(countRef),
        weekStart,
        counted: false,
      });
    }

    const { visitorId, setCookie } = getOrCreateVisitorId(request);
    const visitorRef = countRef
      .collection("visitors")
      .doc(getWeeklyVisitorHash(visitorId, weekStart));
    const existingVisitorSnapshot = await visitorRef.get();

    if (existingVisitorSnapshot.exists) {
      return json(
        {
          weeklyVisits: await getWeeklyVisitCount(countRef),
          weekStart,
          counted: false,
        },
        200,
        setCookie,
      );
    }

    try {
      await consumeSecurityRateLimit({
        scope: "weekly-unique-visitors-ip",
        identifier: getRequestIp(request),
        maxAttempts: VISITOR_MAX_POSTS_PER_WINDOW,
        windowMs: VISITOR_RATE_LIMIT_WINDOW_MS,
        message: "Too many visitor-count requests from this connection.",
      });
    } catch (error) {
      if (getErrorStatus(error) !== 429) throw error;
      return json(
        {
          weeklyVisits: await getWeeklyVisitCount(countRef),
          weekStart,
          counted: false,
        },
        200,
        setCookie,
      );
    }

    let weeklyVisits = 0;
    let counted = false;

    await db.runTransaction(async (transaction) => {
      const visitorSnapshot = await transaction.get(visitorRef);
      const countSnapshot = await transaction.get(countRef);
      const countData = countSnapshot.exists ? countSnapshot.data() || {} : {};
      weeklyVisits = Math.max(0, Number(countData.count) || 0);

      if (visitorSnapshot.exists) return;

      weeklyVisits += 1;
      counted = true;
      transaction.set(visitorRef, {
        weekStart,
        firstSeenAt: FieldValue.serverTimestamp(),
      });
      transaction.set(
        countRef,
        {
          count: weeklyVisits,
          weekStart,
          timeZone: VISITOR_TIME_ZONE,
          updatedAt: FieldValue.serverTimestamp(),
        },
        { merge: true },
      );
    });

    return json({ weeklyVisits, weekStart, counted }, 200, setCookie);
  } catch {
    return json({ error: "Could not process the weekly visit count." }, 500);
  }
}
