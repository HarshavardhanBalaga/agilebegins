import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/admin/",
        "/api/",
        "/login/",
        "/register/",
        "/forgot-password/",
        "/verify-email/",
      ],
    },
    sitemap: "https://www.agilebegins.in/sitemap.xml",
  };
}