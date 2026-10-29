import { getSecurityHeaders } from "./security-headers.mjs";

/** @type {import('next').NextConfig} */
const nextConfig = {
  poweredByHeader: false,
  async headers() {
    return [
      { source: "/:path*", headers: Object.entries(getSecurityHeaders()).map(([key, value]) => ({ key, value })) },
      { source: "/api/:path*", headers: [{ key: "Cache-Control", value: "private, no-store, max-age=0" }] },
    ];
  },
  experimental: {
    reactCompiler: true,
  },
};

export default nextConfig;
