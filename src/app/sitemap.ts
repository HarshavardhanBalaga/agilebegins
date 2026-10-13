import type { MetadataRoute } from "next";

import { env } from "@/lib/env";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = env.appUrl();
  const now = new Date();

  // Only list routes that actually render a page. API routes are excluded —
  // adding them would trigger "Submitted URL not found" errors in Search
  // Console. Add new public pages here as they are created.
  return [
    {
      url: baseUrl,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 1,
    },
  ];
}