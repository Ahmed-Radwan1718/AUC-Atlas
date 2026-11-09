// The original Firebase Admin initialization, deferred until credentials are present.
// Public/signed-out API validation and Next.js builds work without production secrets.
const admin = require("firebase-admin");

if (
  !admin.apps.length &&
  process.env.FIREBASE_PROJECT_ID &&
  process.env.FIREBASE_CLIENT_EMAIL &&
  process.env.FIREBASE_PRIVATE_KEY
) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: String(process.env.FIREBASE_PRIVATE_KEY || "").replace(/\\n/g, "\n")
    })
  });
}

export default admin;
