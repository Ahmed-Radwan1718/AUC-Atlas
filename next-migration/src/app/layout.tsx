import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "AUC Atlas", template: "%s | AUC Atlas" },
  icons: { icon: "/favicon.svg", apple: "/logo.svg" },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        {/* Temporary shared-header bridge until its own migration. */}
        <div id="site-header-root" />
        <Script src="/site-header.js" strategy="afterInteractive" />
        {children}
      </body>
    </html>
  );
}
