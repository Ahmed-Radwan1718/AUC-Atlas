import type { NextApiHandler } from "next";
import { clearCurrentSiteSession } from "@/server/backend/security";

const handler: NextApiHandler = async (req, res) => {
  if (req.method !== "POST" && req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }
  res.setHeader("Cache-Control", "no-store");
  await clearCurrentSiteSession(req, res);
  return res.status(200).json({ success: true });
};

export default handler;
