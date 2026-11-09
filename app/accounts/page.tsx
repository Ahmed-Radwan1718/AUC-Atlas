import type { Metadata } from "next";
import Accounts from "../../features/accounts/Accounts";

export const metadata: Metadata = { title: "My Account | AUC Atlas" };
export default function Page() { return <Accounts />; }
