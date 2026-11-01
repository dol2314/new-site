import type { MetadataRoute } from "next";
import { absoluteUrl, site } from "@/site.config";

export const dynamic = "force-static";

export default function robots(): MetadataRoute.Robots {
  if (!site.indexable) {
    // 공개 전: 미완성 사이트가 색인되지 않게 전체 차단
    return { rules: [{ userAgent: "*", disallow: "/" }] };
  }
  return {
    rules: [{ userAgent: "*", allow: "/" }],
    sitemap: absoluteUrl("/sitemap.xml"),
  };
}
