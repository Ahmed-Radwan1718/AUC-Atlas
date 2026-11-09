import type { Metadata } from "next";
import Admin from "../../features/admin/Admin";

export const metadata: Metadata = {
  title: "Admin Dashboard - AUC Atlas",
  robots: { index: false, follow: false },
};

export default function Page() {
  return <Admin />;
}
