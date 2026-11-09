import type { LegacyRequest, LegacyReply } from "../legacyTypes";

const {
  clearCurrentSiteSession
} = require("../_lib/securityHelpers");

export default async function handler(req: LegacyRequest, res: LegacyReply) {
  if (
    req.method !== "POST" &&
    req.method !== "GET"
  ) {
    return res.status(405).json({
      error: "Method not allowed"
    });
  }

  res.setHeader("Cache-Control", "no-store");

  await clearCurrentSiteSession(req, res);

  return res.status(200).json({
    success: true
  });
};
