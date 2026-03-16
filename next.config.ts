/** @type {import('next').NextConfig} */
const nextConfig = {
  turbopack: {},
  pwa: {
    dest: "public",
    disable: process.env.NODE_ENV === "development",
    register: true,
    skipWaiting: true,
  },
};

const withPWA = require("next-pwa");

module.exports = withPWA(nextConfig);
