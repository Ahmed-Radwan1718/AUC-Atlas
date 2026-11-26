"use client";

import { Analytics } from "@vercel/analytics/next";

const publicPaths = new Set([
  "/", "/professors", "/courses", "/degree-progression",
  "/gpa-calculator", "/faq", "/privacy", "/terms"
]);

export default function SiteAnalytics() {
  return (
    <Analytics beforeSend={event => {
      try {
        const url = new URL(event.url, window.location.origin);
        // Only count known public page routes; exclude admin, map, account,
        // activity history, authentication and any unrecognized paths.
        if (url.origin !== window.location.origin) return null;
        if (!publicPaths.has(url.pathname) &&
            !/^\/(?:professors|courses)\/[a-z0-9-]+\/?$/.test(url.pathname)) return null;
        url.search = "";
        url.hash = "";
        return { ...event, url: url.toString() };
      } catch {
        return null;
      }
    }} />
  );
}
