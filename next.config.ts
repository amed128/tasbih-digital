import withPWA from "next-pwa";
import type { NextConfig } from "next";

type NextConfigWithPWA = NextConfig & {
  pwa?: {
    dest?: string;
    disable?: boolean;
    register?: boolean;
    skipWaiting?: boolean;
  };
};

let nextConfig: NextConfigWithPWA = {
  turbopack: {},
  pwa: {
    dest: "public",
    disable: process.env.NODE_ENV === "development",
    register: true,
    skipWaiting: true,
  },
};

nextConfig = withPWA(nextConfig);

// Remove `pwa` key to avoid Next.js warning about unrecognized config options.
// The plugin has already applied the PWA settings.
if (nextConfig && typeof nextConfig === "object" && "pwa" in nextConfig) {
  delete nextConfig.pwa;
}

export default nextConfig;
