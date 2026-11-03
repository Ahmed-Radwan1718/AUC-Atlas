import type { Metadata } from "next";
import type { ReactNode } from "react";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import "./globals.css";
import "./header-parity.css";
import "./info-pages.css";
import "./auth.css";

export const metadata: Metadata = {
  title: "AUC Atlas | Professors, Courses & Student Materials",
  icons: {
    icon: "/favicon.svg",
    apple: "/logo.svg",
  },
  openGraph: {
    title: "AUC Atlas | Professors, Courses & Student Materials",
    images: [
      {
        url: "/logo.svg",
        width: 512,
        height: 512,
        alt: "AUC Atlas logo",
      },
    ],
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
