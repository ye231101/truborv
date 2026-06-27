import os from "os";

/** @type {import('next').NextConfig} */
const apiOrigin = process.env.NEXT_PUBLIC_SERVER_URL || "http://localhost:8000";

/** LAN IPs so dev works when opening http://<machine-ip>:3000 (Next.js 16 blocks unknown dev origins). */
function getLocalNetworkOrigins() {
  const origins = new Set();
  for (const iface of Object.values(os.networkInterfaces())) {
    for (const addr of iface ?? []) {
      if (addr.family === "IPv4" && !addr.internal) {
        origins.add(addr.address);
      }
    }
  }
  return [...origins];
}

const allowedDevOrigins = [
  ...getLocalNetworkOrigins(),
  ...(process.env.ALLOWED_DEV_ORIGINS?.split(",")
    .map((origin) => origin.trim())
    .filter(Boolean) ?? []),
];

const nextConfig = {
  allowedDevOrigins,
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  async rewrites() {
    return [
      {
        source: "/viewpro/:path*",
        destination: `${apiOrigin}/:path*`,
      },
    ];
  },
};

export default nextConfig;
