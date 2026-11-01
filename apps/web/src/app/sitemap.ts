import type { MetadataRoute } from "next";
import { publishedGuides } from "@/lib/guides";
import { publishedTools } from "@/lib/tools";
import { absoluteUrl, site } from "@/site.config";

export const dynamic = "force-static";

const STATIC_PATHS = ["/", "/about/", "/data/", "/contact/", "/privacy/", "/terms/"];

export default function sitemap(): MetadataRoute.Sitemap {
  if (!site.indexable) return [];
  const guides = publishedGuides();
  const guidePaths = guides.length ? ["/guides/", ...guides.map((g) => `/guides/${g.slug}/`)] : [];
  return [...STATIC_PATHS, ...publishedTools().map((t) => t.path), ...guidePaths].map((path) => ({ url: absoluteUrl(path) }));
}
