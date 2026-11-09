import type { NextConfig } from "next";

// Next.js native response headers replace the security-only portion of the
// original Vercel configuration. Do not copy its old HTML rewrites: v2 has
// real /professors/[slug] and /courses/[slug] Next.js routes.
const development = process.env.NODE_ENV !== "production";

// ImageKit supports custom HTTPS delivery domains. Include the deployment's
// configured delivery origin without allowing arbitrary insecure CSP origins.
function configuredImageKitOrigin(): string | null {
  const endpoint = process.env.IMAGEKIT_URL_ENDPOINT;
  if (!endpoint) return null;
  try {
    const parsed = new URL(endpoint);
    return parsed.protocol === "https:" ? parsed.origin : null;
  } catch {
    return null;
  }
}

const imageKitOrigin = configuredImageKitOrigin();
const contentSecurityPolicy = [
  "default-src 'self'",
  "base-uri 'self'",
  "object-src 'none'",
  "frame-ancestors 'self'",
  "form-action 'self'",
  [
    "script-src 'self' 'unsafe-inline'",
    ...(development ? ["'unsafe-eval'"] : []),
    "https://www.gstatic.com",
    "https://apis.google.com",
    "https://accounts.google.com",
    "https://www.google.com",
  ].join(" "),
  "style-src 'self' 'unsafe-inline' https://www.gstatic.com https://fonts.googleapis.com",
  [
    "img-src 'self' data: blob:",
    "https://res.cloudinary.com",
    "https://*.imagekit.io",
    ...(imageKitOrigin ? [imageKitOrigin] : []),
    // Current AUC Atlas professor portraits, including third-party faculty sites.
    "https://www.aucegypt.edu",
    "https://eng.asu.edu.eg",
    "https://menaobservatory.ai",
    "https://flagcdn.com https://*.flagcdn.com",
    "https://www.gstatic.com https://fonts.gstatic.com",
    "https://www.google.com https://*.googleusercontent.com",
    "https://storage.googleapis.com https://firebasestorage.googleapis.com",
  ].join(" "),
  [
    "connect-src 'self'",
    ...(development ? ["ws: wss:"] : []),
    "https://api.cloudinary.com",
    "https://upload.imagekit.io",
    "https://*.googleapis.com",
    "https://*.firebaseapp.com",
    "https://www.google.com",
    "https://speed.cloudflare.com",
  ].join(" "),
  "frame-src 'self' https://*.firebaseapp.com https://accounts.google.com https://www.google.com",
  "font-src 'self' data: https://fonts.gstatic.com",
  [
    "media-src 'self' blob: https://res.cloudinary.com https://*.imagekit.io",
    ...(imageKitOrigin ? [imageKitOrigin] : []),
  ].join(" "),
  "worker-src 'self' blob:",
  "manifest-src 'self'",
  ...(development ? [] : ["upgrade-insecure-requests"]),
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: contentSecurityPolicy },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // Google/Firebase authentication uses a popup.
  { key: "Cross-Origin-Opener-Policy", value: "same-origin-allow-popups" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=(), usb=()" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" },
];

const nextConfig: NextConfig = {
  reactStrictMode: true,
  async headers() {
    return [
      { source: "/:path*", headers: securityHeaders },
      {
        source: "/admin",
        headers: [
          { key: "X-Robots-Tag", value: "noindex, nofollow, noarchive" },
          { key: "Cache-Control", value: "private, no-store, max-age=0" },
        ],
      },
      {
        source: "/accounts",
        headers: [{ key: "Cache-Control", value: "private, no-store, max-age=0" }],
      },
    ];
  },
};

export default nextConfig;
