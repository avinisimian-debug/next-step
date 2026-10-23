import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/seo";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/api/", "/auth/", "/account", "/admin", "/moderation", "/registry-review", "/saved", "/journey", "/my-path", "/login", "/results", "/community/ask"],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
