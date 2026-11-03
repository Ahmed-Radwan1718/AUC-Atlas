import type { Metadata } from "next";
import { AdminDashboard } from "@/components/admin/AdminDashboard";
import "./admin.css";

export const metadata: Metadata = {
  title: "Admin Dashboard - AUC Atlas",
};

export default function AdminPage() {
  return <AdminDashboard />;
}
