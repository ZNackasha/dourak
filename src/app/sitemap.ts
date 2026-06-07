import type { MetadataRoute } from "next";
import { getCanonicalUrl } from "@/lib/site";

const siteUrl = getCanonicalUrl();

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: siteUrl,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1,
    },
  ];
}
