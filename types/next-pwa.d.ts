declare module "next-pwa" {
  import type { NextConfig } from "next";

  type NextPWAConfig = {
    dest?: string;
    disable?: boolean;
    register?: boolean;
    skipWaiting?: boolean;
    // Allow extra properties too
    [key: string]: unknown;
  };

  type NextConfigWithPWA = NextConfig & {
    pwa?: NextPWAConfig;
  };

  function nextPWA(nextConfig?: NextConfigWithPWA): NextConfigWithPWA;

  export default nextPWA;
}
