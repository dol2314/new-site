import type { Metadata } from "next";
import { absoluteUrl, site } from "@/site.config";

interface PageMetaInput {
  title: string;
  description: string;
  /** "/about/"처럼 "/"로 시작하고 끝나는 경로 */
  path: `/${string}` | "/";
  /** 공개 전 페이지 등 개별적으로 noindex가 필요할 때 */
  noindex?: boolean;
}

/** 페이지별 metadata: canonical·og·twitter를 페이지 고유값으로 채운다. */
export function pageMetadata({ title, description, path, noindex }: PageMetaInput): Metadata {
  const url = absoluteUrl(path);
  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      type: "website",
      locale: site.locale,
      siteName: site.name,
      title,
      description,
      url,
      images: [{ url: site.ogImage, width: 1200, height: 630, alt: site.name }],
    },
    twitter: { card: "summary_large_image", title, description, images: [site.ogImage] },
    // 공개 전(site.indexable=false)에는 모든 페이지 noindex. 공개 후에는 noindex를 요청한 페이지만.
    ...(!site.indexable ? { robots: { index: false, follow: false } } : noindex ? { robots: { index: false, follow: true } } : {}),
  };
}

export interface Crumb {
  name: string;
  path: string;
}

export function breadcrumbJsonLd(crumbs: Crumb[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [{ name: "홈", path: "/" }, ...crumbs].map((c, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: c.name,
      item: absoluteUrl(c.path),
    })),
  };
}

export function siteJsonLd() {
  return [
    {
      "@context": "https://schema.org",
      "@type": "WebSite",
      name: site.name,
      url: absoluteUrl("/"),
      inLanguage: "ko-KR",
      description: site.description,
    },
    {
      "@context": "https://schema.org",
      "@type": "Organization",
      name: site.name,
      url: absoluteUrl("/"),
      logo: absoluteUrl("/icon.png"),
    },
  ];
}
