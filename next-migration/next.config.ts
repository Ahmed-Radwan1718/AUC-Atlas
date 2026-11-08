import type { NextConfig } from "next";
const nextConfig: NextConfig = {
  async redirects() { return [{ source: "/faq.html", destination: "/faq", permanent: true }]; },
};
export default nextConfig;
