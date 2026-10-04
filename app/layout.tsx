import type { Metadata, Viewport } from "next";
import Script from "next/script";
import type { ReactNode } from "react";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://aucatlas.com"),
  title: "AUC Atlas | Professors, Courses & Student Materials",
  openGraph: {
    images: [
      {
        url: "/logo.svg",
        width: 512,
        height: 512,
        type: "image/svg+xml",
        alt: "AUC Atlas logo"
      }
    ]
  },
  icons: {
    icon: [{ url: "/favicon.svg", type: "image/svg+xml" }],
    apple: [{ url: "/logo.svg", sizes: "180x180" }]
  }
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <Script src="/data/courses.js" strategy="beforeInteractive" />
        <Script src="/data/professor-data.js" strategy="beforeInteractive" />
        <SiteHeader />
        {children}
        <SiteFooter />
      </body>
    </html>
  );
}
