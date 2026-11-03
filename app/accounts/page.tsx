import type { Metadata } from "next";
import { AccountDashboard } from "@/components/account/AccountDashboard";
import "./accounts.css";

export const metadata: Metadata = {
  title: "My Account - AUC Atlas",
};

export default function AccountsPage() {
  return <AccountDashboard />;
}
