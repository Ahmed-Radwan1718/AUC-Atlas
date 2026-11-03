import type { Metadata } from "next";
import { NotificationsPage } from "@/components/notifications/NotificationsPage";
import "./notifications.css";

export const metadata: Metadata = {
  title: "Notifications | AUC Atlas",
};

export default function NotificationsRoute() {
  return <NotificationsPage />;
}
