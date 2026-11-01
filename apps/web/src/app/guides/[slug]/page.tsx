import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { GUIDE_BODIES } from "@/content/guides";
import { GUIDES, guideBySlug } from "@/lib/guides";
import { pageMetadata } from "@/lib/seo";

export const dynamicParams = false;

export function generateStaticParams() {
  return GUIDES.map((g) => ({ slug: g.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const g = guideBySlug(slug);
  if (!g) return {};
  return pageMetadata({ title: g.title, description: g.description, path: `/guides/${g.slug}/`, noindex: !g.published });
}

export default async function GuidePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const g = guideBySlug(slug);
  const Body = GUIDE_BODIES[slug];
  if (!g || !Body) notFound();
  return <Body meta={g} />;
}
