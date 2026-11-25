import type { Metadata } from "next";
import Accounts from "../../features/accounts/Accounts";

export const metadata: Metadata = {
  title: "Activity history | AUC Atlas",
  robots: { index: false, follow: false }
};

export default function Page() { return <Accounts activityOnly />; }
