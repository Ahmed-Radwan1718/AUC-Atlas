const crypto = require("crypto");
const admin = require("../server/_lib/firebaseAdmin");

const { getSiteSessionUser } = require("../server/_lib/securityHelpers");

function createImageKitAuthError(message, statusCode) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

async function ensureVerifiedAucUser(req) {
  const decodedUser = await getSiteSessionUser(req, {
    checkRevoked: true
  });
  const userRecord = await admin.auth().getUser(decodedUser.uid);
  const email = String(userRecord.email || decodedUser.email || "").trim().toLowerCase();

  if (!userRecord.emailVerified || !email.endsWith("@aucegypt.edu")) {
    throw createImageKitAuthError("Please verify your AUC email address before uploading materials.", 403);
  }
}

module.exports = async function handler(req, res) {
  try {
    if (req.method !== "GET") {
      res.setHeader("Allow", "GET");
      return res.status(405).json({ error: "Method not allowed" });
    }

    await ensureVerifiedAucUser(req);

    const privateKey = process.env.IMAGEKIT_PRIVATE_KEY;
    const publicKey = process.env.IMAGEKIT_PUBLIC_KEY;
    const urlEndpoint = process.env.IMAGEKIT_URL_ENDPOINT;

    if (!privateKey || !publicKey || !urlEndpoint) {
      throw createImageKitAuthError("ImageKit environment variables are missing.", 500);
    }

    const token = crypto.randomUUID ? crypto.randomUUID() : crypto.randomBytes(16).toString("hex");
    const expire = Math.floor(Date.now() / 1000) + 30 * 60;
    const signature = crypto
      .createHmac("sha1", privateKey)
      .update(token + expire)
      .digest("hex");

    res.setHeader("Cache-Control", "no-store");
    return res.status(200).json({
      token,
      expire,
      signature,
      publicKey,
      urlEndpoint
    });
  } catch (error) {
    res.setHeader("Cache-Control", "no-store");
    return res.status(error.statusCode || 500).json({
      error: error.message || "Could not prepare upload."
    });
  }
};
