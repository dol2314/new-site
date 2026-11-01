import type { MetadataRoute } from "next";
import { publishedTools } from "@/lib/tools";
import { absoluteUrl, site } from "@/site.config";

export const dynamic = "force-static";

const STATIC_PATHS = ["/", "/about/", "/data/", "/contact/", "/privacy/", "/terms/"];

export default function sitemap(): MetadataRoute.Sitemap {
  if (!site.indexable) return [];
  return [...STATIC_PATHS, ...publishedTools().map((t) => t.path)].map((path) => ({ url: absoluteUrl(path) }));
}
