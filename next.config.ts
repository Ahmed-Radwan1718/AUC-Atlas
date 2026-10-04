import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        source: "/index.html",
        destination: "/",
        permanent: true
      },
      {
        source: "/gpa-calculator.html",
        destination: "/gpa-calculator",
        permanent: true
      }
    ];
  }
};

export default nextConfig;
