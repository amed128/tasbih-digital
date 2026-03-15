declare module "next-pwa" {
  import type { NextConfig } from "next";

  type NextPWAConfig = {
    dest?: string;
    disable?: boolean;
    register?: boolean;
    skipWaiting?: boolean;
    // Allow extra properties too
    [key: string]: any;
  };

  type WithPWA = (nextConfig?: NextConfig) => NextConfig;

  function nextPWA(config?: NextPWAConfig): WithPWA;

  export default nextPWA;
}
