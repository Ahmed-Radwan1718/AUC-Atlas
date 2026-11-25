import type { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { optionalSessionUser } from "../../server/session";
import { firebaseAuth } from "../../server/firebase";
import { hasCurrentAdminRole } from "../../server/adminRole";
import PlazaMap from "./PlazaMap";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Campus map | AUC Atlas",
  description: "Administrator preview of the campus map.",
  robots: { index: false, follow: false },
};

export default async function Page() {
  const session = await optionalSessionUser({ cookies: await cookies() });
  if (!session) redirect("/");
  // Read the authoritative current role, not a potentially stale token claim.
  const user = await firebaseAuth().getUser(session.uid).catch(() => null);
  if (!user || user.disabled || !hasCurrentAdminRole(user.uid, user.customClaims)) redirect("/");
  return <PlazaMap />;
}
