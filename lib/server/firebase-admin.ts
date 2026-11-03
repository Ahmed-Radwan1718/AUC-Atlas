import "server-only";

import { cert, getApps, initializeApp, type App } from "firebase-admin/app";
import { getAuth, type Auth } from "firebase-admin/auth";
import {
  FieldValue,
  getFirestore,
  Timestamp,
  type Firestore,
} from "firebase-admin/firestore";

let cachedApp: App | undefined;
let cachedAuth: Auth | undefined;
let cachedFirestore: Firestore | undefined;

export function getFirebaseAdminApp(): App {
  if (cachedApp) return cachedApp;

  const existingApp = getApps()[0];
  if (existingApp) {
    cachedApp = existingApp;
    return existingApp;
  }

  const projectId = String(process.env.FIREBASE_PROJECT_ID || "").trim();
  const clientEmail = String(process.env.FIREBASE_CLIENT_EMAIL || "").trim();
  const privateKey = String(process.env.FIREBASE_PRIVATE_KEY || "").replace(
    /\\n/g,
    "\n",
  );

  if (!projectId || !clientEmail || !privateKey) {
    throw new Error("Firebase Admin is not configured.");
  }

  cachedApp = initializeApp({
    credential: cert({ projectId, clientEmail, privateKey }),
  });

  return cachedApp;
}

export function getAdminAuth(): Auth {
  cachedAuth ||= getAuth(getFirebaseAdminApp());
  return cachedAuth;
}

export function getAdminFirestore(): Firestore {
  cachedFirestore ||= getFirestore(getFirebaseAdminApp());
  return cachedFirestore;
}

export { FieldValue, Timestamp };
