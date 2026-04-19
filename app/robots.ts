import type { MetadataRoute } from "next";

export const dynamic = "force-static";

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://at-tasbih.app";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/" },
    sitemap: `${BASE_URL}/sitemap.xml`,
  };
}
