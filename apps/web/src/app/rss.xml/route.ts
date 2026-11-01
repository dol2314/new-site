import { absoluteUrl, site } from "@/site.config";

export const dynamic = "force-static";

/** 사례 글(/guides/)이 생기면 여기에 항목을 추가한다(프롬프트 08). */
const ITEMS: { title: string; path: string; date: string; description: string }[] = [];

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

export function GET() {
  const items = ITEMS.map(
    (i) =>
      `<item><title>${esc(i.title)}</title><link>${absoluteUrl(i.path)}</link><guid>${absoluteUrl(i.path)}</guid><pubDate>${new Date(i.date).toUTCString()}</pubDate><description>${esc(i.description)}</description></item>`,
  ).join("");
  const xml = `<?xml version="1.0" encoding="UTF-8"?><rss version="2.0"><channel><title>${esc(site.name)}</title><link>${absoluteUrl("/")}</link><description>${esc(site.description)}</description><language>ko</language>${items}</channel></rss>`;
  return new Response(xml, { headers: { "Content-Type": "application/rss+xml; charset=utf-8" } });
}
