import type { MetadataRoute } from "next";
import { getCanonicalUrl } from "@/lib/site";

const siteUrl = getCanonicalUrl();

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/schedules", "/invites", "/api"],
    },
    sitemap: `${siteUrl}/sitemap.xml`,
    host: siteUrl,
  };
}
