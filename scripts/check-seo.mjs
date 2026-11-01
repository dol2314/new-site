// 빌드 결과(apps/web/out)의 HTML을 검사한다. 실패 항목이 있으면 종료 코드 1.
// 공개 전 모드(NEXT_PUBLIC_SITE_INDEXABLE != "true"): 모든 페이지 noindex + robots.txt 전체 차단이어야 한다.
// 공개 모드: title·description·canonical 고유, og:image·og:url, h1 1개, robots 메타 중복 없음, 사이트맵·운영자 정보 확인.
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join, relative, sep } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const out = join(root, "apps/web/out");
const indexable = (process.env.NEXT_PUBLIC_SITE_INDEXABLE ?? "") === "true";
const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(/\/+$/, "");

if (!existsSync(out)) {
  console.error("apps/web/out 이 없습니다. 먼저 npm run build 를 실행하세요.");
  process.exit(1);
}

const errors = [];
const warnings = [];
const err = (file, msg) => errors.push(`${file}: ${msg}`);

function walk(dir) {
  return readdirSync(dir).flatMap((name) => {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) return name === "_next" ? [] : walk(p);
    return p.endsWith(".html") ? [p] : [];
  });
}

const decode = (s) =>
  s.replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#x27;|&#39;/g, "'");

function metaTags(html) {
  return [...html.matchAll(/<meta\s+([^>]*?)\/?>/g)].map((m) => {
    const attrs = {};
    for (const a of m[1].matchAll(/([\w:-]+)="([^"]*)"/g)) attrs[a[1].toLowerCase()] = decode(a[2]);
    return attrs;
  });
}

function pageInfo(html) {
  const metas = metaTags(html);
  const by = (key, val) => metas.filter((m) => m[key] === val).map((m) => m.content ?? "");
  const head = html.split("</head>")[0] ?? "";
  return {
    titles: [...head.matchAll(/<title>([^<]*)<\/title>/g)].map((m) => decode(m[1])),
    descriptions: by("name", "description"),
    robots: by("name", "robots"),
    canonicals: [...html.matchAll(/<link\s+[^>]*rel="canonical"[^>]*>/g)].map((m) => (m[0].match(/href="([^"]*)"/) ?? [])[1] ?? ""),
    ogImage: by("property", "og:image"),
    ogUrl: by("property", "og:url"),
    h1: (html.match(/<h1[\s>]/g) ?? []).length,
    lang: (html.match(/<html[^>]*\slang="([^"]*)"/) ?? [])[1],
    operatorPending: html.includes("공개 전에 등록합니다"),
  };
}

const files = walk(out);
const seen = { title: new Map(), description: new Map(), canonical: new Map() };
let pages = 0;

for (const file of files) {
  const rel = relative(out, file).split(sep).join("/");
  const is404 = rel === "404.html" || rel.startsWith("_not-found") || rel === "404/index.html";
  const info = pageInfo(readFileSync(file, "utf8"));

  if (info.lang !== "ko") err(rel, `html lang="${info.lang}" (ko 여야 함)`);
  if (info.titles.length !== 1) err(rel, `title ${info.titles.length}개`);
  if (info.robots.length > 1) err(rel, `robots 메타 ${info.robots.length}개 (중복): ${info.robots.join(" | ")}`);
  const noindex = info.robots.some((r) => /noindex/.test(r));

  if (is404) {
    if (!noindex) err(rel, "404 페이지에 noindex 없음");
    if (!/찾을 수 없습니다/.test(readFileSync(file, "utf8"))) err(rel, "한국어 404 문구 없음");
    continue;
  }

  pages += 1;
  if (indexable && noindex) err(rel, "공개 모드인데 noindex");
  if (!indexable && !noindex) err(rel, "공개 전 모드인데 noindex 아님");
  if (info.h1 !== 1) err(rel, `h1 ${info.h1}개`);
  if (info.descriptions.length !== 1 || !info.descriptions[0]) err(rel, "description 없음/중복");
  if (info.canonicals.length !== 1) err(rel, `canonical ${info.canonicals.length}개`);
  const canonical = info.canonicals[0] ?? "";
  const expected = `${siteUrl}/${rel.replace(/index\.html$/, "")}`;
  if (canonical && canonical !== expected) err(rel, `canonical "${canonical}" ≠ 기대값 "${expected}"`);
  if (info.ogImage.length === 0) err(rel, "og:image 없음");
  if (info.ogUrl[0] !== canonical) err(rel, `og:url "${info.ogUrl[0]}" ≠ canonical`);
  if (indexable && info.operatorPending) err(rel, "공개 모드인데 운영자 정보가 비어 있음 (NEXT_PUBLIC_OPERATOR_NAME/EMAIL)");

  for (const [key, val] of [["title", info.titles[0]], ["description", info.descriptions[0]], ["canonical", canonical]]) {
    if (!val) continue;
    const prev = seen[key].get(val);
    if (prev) err(rel, `${key} 중복 (${prev}와 같음): ${val}`);
    else seen[key].set(val, rel);
  }
}

// robots.txt, sitemap.xml
const robotsTxt = existsSync(join(out, "robots.txt")) ? readFileSync(join(out, "robots.txt"), "utf8") : "";
const sitemap = existsSync(join(out, "sitemap.xml")) ? readFileSync(join(out, "sitemap.xml"), "utf8") : "";
const sitemapUrls = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
if (!robotsTxt) errors.push("robots.txt 없음");
if (!indexable) {
  if (!/Disallow:\s*\/\s*$/m.test(robotsTxt)) errors.push("공개 전 모드인데 robots.txt가 전체 차단이 아님");
  if (sitemapUrls.length) errors.push(`공개 전 모드인데 사이트맵에 URL ${sitemapUrls.length}개`);
} else {
  if (!/Sitemap:\s*https?:\/\//.test(robotsTxt)) errors.push("robots.txt에 Sitemap 없음");
  if (sitemapUrls.length === 0) errors.push("사이트맵이 비어 있음");
  if (sitemapUrls.length > 0 && sitemapUrls.length !== pages)
    warnings.push(`사이트맵 URL ${sitemapUrls.length}개 / 페이지 ${pages}개 (도구 페이지 published 여부 확인)`);
  if (!siteUrl.startsWith("https://")) errors.push(`공개 모드인데 사이트 주소가 https가 아님: ${siteUrl}`);
}
if (!existsSync(join(out, "rss.xml"))) errors.push("rss.xml 없음");
if (!existsSync(join(out, "og/default.png"))) errors.push("og/default.png 없음 (npm run make:og)");
if (!existsSync(join(out, "ads.txt"))) warnings.push("ads.txt 없음 (ADSENSE_PUB_ID 미설정 — 애드센스 신청 전 설정)");

console.log(`모드: ${indexable ? "공개" : "공개 전(noindex)"} · 사이트 주소: ${siteUrl}`);
console.log(`HTML ${files.length}개 (일반 페이지 ${pages}개) · 사이트맵 URL ${sitemapUrls.length}개`);
for (const w of warnings) console.log(`경고: ${w}`);
if (errors.length) {
  for (const e of errors) console.error(`실패: ${e}`);
  console.error(`\n실패 ${errors.length}건`);
  process.exit(1);
}
console.log("통과");
