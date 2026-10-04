import Script from "next/script";
import { HomePage } from "@/components/HomePage";

export default function Page() {
  return (
    <>
      <HomePage />
      <Script src="/home-search.js" strategy="afterInteractive" />
    </>
  );
}
