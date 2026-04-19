import type { MetadataRoute } from "next";

export const dynamic = "force-static";

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://at-tasbih.app";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: BASE_URL, changeFrequency: "weekly", priority: 1 },
    { url: `${BASE_URL}/listes`, changeFrequency: "monthly", priority: 0.8 },
    { url: `${BASE_URL}/stats`, changeFrequency: "monthly", priority: 0.7 },
    { url: `${BASE_URL}/about`, changeFrequency: "monthly", priority: 0.5 },
    { url: `${BASE_URL}/aide`, changeFrequency: "monthly", priority: 0.5 },
    { url: `${BASE_URL}/privacy`, changeFrequency: "yearly", priority: 0.3 },
  ];
}
