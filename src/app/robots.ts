import type { MetadataRoute } from "next";

import { env } from "@/lib/env";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = env.appUrl();

  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // Keep API endpoints out of the index — they return JSON, not pages.
      disallow: ["/api/"],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}