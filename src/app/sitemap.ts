import type { MetadataRoute } from "next";
import { getRepository } from "@/lib/data/repository";
import { PATHWAY_ORDER } from "@/lib/domain/pathways";
import { SITE_URL, pathwayHref } from "@/lib/seo";

// Pages that are the same for everyone. Personal pages (saved, journey, account) are left out and blocked in robots.ts.
const STATIC = ["/", "/questionnaire", "/institutions", "/community", "/compare", "/about", "/plan", "/accessibility", "/privacy", "/cookies", "/terms", "/credits"];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const institutions = await getRepository().listPublic();
  return [
    ...STATIC.map((path) => ({ url: `${SITE_URL}${path}`, priority: path === "/" ? 1 : 0.6 })),
    ...PATHWAY_ORDER.map((p) => ({ url: `${SITE_URL}${pathwayHref(p)}`, priority: 0.9 })),
    ...institutions.map((i) => ({
      url: `${SITE_URL}/institutions/${i.slug}`,
      lastModified: i.lastVerified,
      priority: 0.7,
    })),
  ];
}
