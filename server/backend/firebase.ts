import "server-only";

import type { Firestore } from "firebase-admin/firestore";
import { FieldPath, FieldValue, Timestamp } from "firebase-admin/firestore";
import { getAdminAuth, getAdminFirestore } from "@/lib/server/firebase-admin";

const firestoreFactory = Object.assign(
  (): Firestore => getAdminFirestore(),
  { FieldPath, FieldValue, Timestamp },
);

export const admin = {
  auth: getAdminAuth,
  firestore: firestoreFactory,
};
