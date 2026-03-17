/** @type {import('next').NextConfig} */
const withPWA = require("next-pwa");

let nextConfig = {
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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  delete (nextConfig as any).pwa;
}

module.exports = nextConfig;
