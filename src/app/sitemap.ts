import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  return [
    {
      url: "https://www.agilebegins.in",
      lastModified: now,
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: "https://www.agilebegins.in/workshop",
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: "https://www.agilebegins.in/about-us",
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.6,
    },
    {
      url: "https://www.agilebegins.in/contact-us",
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.6,
    },
    {
      url: "https://www.agilebegins.in/privacy-policy",
      lastModified: now,
      changeFrequency: "yearly",
      priority: 0.4,
    },
    {
      url: "https://www.agilebegins.in/terms-and-conditions",
      lastModified: now,
      changeFrequency: "yearly",
      priority: 0.4,
    },
    {
      url: "https://www.agilebegins.in/refund-cancellation",
      lastModified: now,
      changeFrequency: "yearly",
      priority: 0.4,
    },
  ];
}