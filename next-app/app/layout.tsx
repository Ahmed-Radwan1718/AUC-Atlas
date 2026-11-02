import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";
import SiteFooter from "@/components/SiteFooter";
import SiteHeader from "@/components/SiteHeader";

export const metadata: Metadata = {
  title: "AUC Atlas | Professors, Courses & Student Materials",
  description: "AUC Atlas",
  icons: {
    icon: "/favicon.svg",
    apple: "/logo.svg",
  },
  openGraph: {
    title: "AUC Atlas | Professors, Courses & Student Materials",
    images: [{ url: "/logo.svg", width: 512, height: 512, alt: "AUC Atlas logo" }],
  },
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <SiteHeader />
        {children}
        <SiteFooter />
      </body>
    </html>
  );
}
