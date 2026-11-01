// 공개·애드센스 신청 전 점검 (프롬프트 09 1단계). 빌드 결과(apps/web/out)를 크롤링한다.
//   npm run check:launch                 → 링크·구조·필수 페이지 검사
//   npm run check:launch -- --mobile     → + Playwright 모바일(360×640) 가로 넘침 검사·첫 화면 스크린샷(.cache/launch-shots)
//   npm run check:launch -- --report docs/adsense/check-result.md  → 결과를 마크다운으로도 저장
// 공개 뒤 구조를 미리 보려면 LAUNCH_PREVIEW=1 npm run build 후 실행(hold 없는 도구·글을 공개로 빌드, 로컬 전용).
// "공개 페이지" = data-draft 표시가 없는 페이지(정적 페이지 포함). 실패 항목이 있으면 종료 코드 1.
import { createServer } from "node:http";
import { createRequire } from "node:module";
import { existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { dirname, extname, join, relative, sep } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const out = join(root, "apps/web/out");
const args = process.argv.slice(2);
const mobile = args.includes("--mobile");
const reportPath = args.includes("--report") ? args[args.indexOf("--report") + 1] : null;
const TARGET = { tools: 5, guides: 20 };
const MIN_TEXT = 1500; // 공개 도구·글 본문 최소 글자 수(경고)

if (!existsSync(out)) {
  console.error("apps/web/out 이 없습니다. 먼저 npm run build 를 실행하세요.");
  process.exit(1);
}

const walk = (dir) =>
  readdirSync(dir).flatMap((n) => {
    const p = join(dir, n);
    if (statSync(p).isDirectory()) return n === "_next" ? [] : walk(p);
    return p.endsWith(".html") ? [p] : [];
  });
const toPath = (file) => {
  const rel = relative(out, file).split(sep).join("/");
  return rel === "index.html" ? "/" : `/${rel.replace(/index\.html$/, "").replace(/\.html$/, "")}`;
};
const resolveFile = (path) => {
  const clean = decodeURIComponent(path.split("#")[0].split("?")[0]);
  const cands = clean.endsWith("/") ? [join(out, clean, "index.html")] : [join(out, clean), join(out, `${clean}.html`), join(out, clean, "index.html")];
  return cands.find((c) => existsSync(c) && statSync(c).isFile()) ?? null;
};
const visibleText = (html) =>
  (html.match(/<main[\s\S]*?<\/main>/)?.[0] ?? html)
    .replace(/<(script|style)[\s\S]*?<\/\1>/g, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&[a-z#0-9]+;/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const pages = new Map(); // path → info
for (const file of walk(out)) {
  const path = toPath(file);
  if (path === "/404" || path === "/404/" || path.startsWith("/_not-found")) continue;
  const html = readFileSync(file, "utf8");
  const links = [...html.matchAll(/<a\s[^>]*href="([^"]+)"/g)].map((m) => m[1]).filter((h) => h.startsWith("/") && !h.startsWith("//"));
  pages.set(path, {
    path,
    html,
    draft: html.includes("data-draft"),
    noindex: /<meta[^>]+name="robots"[^>]+noindex/.test(html),
    kind: path.startsWith("/guides/") && path !== "/guides/" ? "guide" : html.includes('data-section="calculator"') ? "tool" : "page",
    text: visibleText(html),
    links: [...new Set(links.map((l) => l.split("#")[0].split("?")[0]))],
  });
}

const homeHtml = pages.get("/")?.html ?? "";
const buildMode = homeHtml.match(/<html[^>]*data-build="(\w+)"/)?.[1] ?? "unknown";
const errors = [];
const warns = [];
const pub = [...pages.values()].filter((p) => !p.draft);

// 1. 깨진 내부 링크 (모든 페이지)
for (const p of pages.values()) {
  for (const l of p.links) if (!resolveFile(l)) errors.push(`깨진 링크: ${p.path} → ${l}`);
}

// 2. 홈에서 클릭 수 (공개 페이지끼리만 따라감)
const depth = new Map([["/", 0]]);
const queue = ["/"];
while (queue.length) {
  const cur = queue.shift();
  const page = pages.get(cur);
  if (!page || page.draft) continue;
  for (const l of page.links) {
    const target = pages.get(l) ?? pages.get(l.endsWith("/") ? l : `${l}/`);
    if (!target || target.draft || depth.has(target.path)) continue;
    depth.set(target.path, depth.get(cur) + 1);
    queue.push(target.path);
  }
}
for (const p of pub) {
  const d = depth.get(p.path);
  if (d === undefined) errors.push(`홈에서 링크로 갈 수 없는 공개 페이지: ${p.path}`);
  else if (d > 3) errors.push(`홈에서 ${d}클릭 (3클릭 넘음): ${p.path}`);
}
// 공개 페이지가 공개 전 페이지로 링크하면 안 됨
for (const p of pub) {
  for (const l of p.links) {
    const t = pages.get(l);
    if (t?.draft) errors.push(`공개 페이지가 공개 전 페이지로 링크: ${p.path} → ${l}`);
  }
}

// 3. 빈 페이지·"준비 중"·얇은 본문
for (const p of pub) {
  for (const word of ["준비 중", "준비중", "Coming soon", "lorem"]) if (p.text.includes(word)) errors.push(`"${word}" 문구: ${p.path}`);
  if (p.text.includes("공개 전)")) errors.push(`공개 페이지에 "공개 전" 항목 표시: ${p.path}`);
  if ((p.kind === "tool" || p.kind === "guide") && p.text.length < MIN_TEXT) warns.push(`본문 ${p.text.length}자 (${MIN_TEXT}자 미만): ${p.path}`);
}

// 4. 필수 페이지
const need = { "/about/": "소개", "/contact/": "문의", "/privacy/": "개인정보처리방침", "/terms/": "이용약관" };
for (const [path, name] of Object.entries(need)) if (!pages.has(path)) errors.push(`필수 페이지 없음: ${name} (${path})`);
const privacy = pages.get("/privacy/")?.text ?? "";
for (const w of ["애드센스", "쿠키", "맞춤 광고"]) if (!privacy.includes(w)) errors.push(`개인정보처리방침에 "${w}" 없음`);
const operatorPending = [...pages.values()].filter((p) => p.text.includes("공개 전에 등록합니다")).map((p) => p.path);
if (operatorPending.length) warns.push(`운영자 이름·연락처 미설정 (NEXT_PUBLIC_OPERATOR_NAME/EMAIL): ${operatorPending.join(", ")}`);

// 5. ads.txt
const adsTxt = join(out, "ads.txt");
let adsStatus = "없음 (ADSENSE_PUB_ID 미설정)";
if (existsSync(adsTxt)) {
  const line = readFileSync(adsTxt, "utf8").trim();
  if (/^google\.com, pub-\d{16}, DIRECT, f08c47fec0942fa0$/m.test(line)) adsStatus = `형식 맞음: ${line}`;
  else errors.push(`ads.txt 형식 오류: ${line}`);
} else warns.push("ads.txt 없음 — 애드센스 신청 직전에 ADSENSE_PUB_ID 설정");

// 6. 수량
const pubTools = pub.filter((p) => p.kind === "tool");
const pubGuides = pub.filter((p) => p.kind === "guide");
if (pubTools.length < TARGET.tools) warns.push(`공개 도구 ${pubTools.length}개 (신청 목표 ${TARGET.tools}개)`);
if (pubGuides.length < TARGET.guides) warns.push(`공개 사례 글 ${pubGuides.length}편 (신청 목표 ${TARGET.guides}편)`);

// 7. 모바일
const mobileRows = [];
if (mobile) {
  const types = { ".html": "text/html; charset=utf-8", ".js": "text/javascript", ".css": "text/css", ".png": "image/png", ".svg": "image/svg+xml", ".txt": "text/plain", ".xml": "application/xml", ".json": "application/json", ".woff2": "font/woff2" };
  const server = createServer((req, res) => {
    const f = resolveFile(new URL(req.url, "http://x").pathname) ?? (() => {
      const p = join(out, decodeURIComponent(new URL(req.url, "http://x").pathname));
      return existsSync(p) && statSync(p).isFile() ? p : null;
    })();
    if (!f) {
      res.writeHead(404);
      return res.end();
    }
    res.writeHead(200, { "content-type": types[extname(f)] ?? "application/octet-stream" });
    res.end(readFileSync(f));
  });
  await new Promise((r) => server.listen(0, "127.0.0.1", r));
  const port = server.address().port;
  let chromium;
  try {
    ({ chromium } = createRequire(import.meta.url)("playwright"));
  } catch {
    console.error("--mobile 에는 Playwright가 필요합니다 (npm i -D playwright && npx playwright install chromium).");
    process.exit(1);
  }
  const browser = await chromium.launch();
  const shots = join(root, ".cache/launch-shots");
  mkdirSync(shots, { recursive: true });
  for (const p of pub) {
    const page = await browser.newPage({ viewport: { width: 360, height: 640 } });
    const external = [];
    page.on("request", (r) => {
      if (!r.url().startsWith(`http://127.0.0.1:${port}`)) external.push(r.url());
    });
    await page.goto(`http://127.0.0.1:${port}${p.path}`, { waitUntil: "networkidle" });
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    const name = p.path === "/" ? "home" : p.path.replace(/^\/|\/$/g, "").replace(/\//g, "__");
    const shot = join(shots, `${name}.png`);
    await page.screenshot({ path: shot });
    if (overflow > 0) errors.push(`모바일 가로 넘침 ${overflow}px: ${p.path}`);
    mobileRows.push({ path: p.path, overflow, shot: relative(root, shot), external: external.length });
    await page.close();
  }
  await browser.close();
  server.close();
}

// 초안 빌드에서는 공개 전 카드·초안 링크가 정상이라 구조 실패를 참고(경고)로만 본다
if (buildMode === "draft" && errors.length) {
  warns.unshift(...errors.map((e) => `[초안 빌드 참고] ${e}`));
  errors.length = 0;
  warns.unshift("초안 빌드입니다. 공개 뒤 구조는 LAUNCH_PREVIEW=1 npm run build 후 다시 실행하세요.");
}

// 결과
const lines = [];
lines.push(`# 공개 점검 결과 (scripts/check-launch.mjs)`, "");
lines.push(`- 빌드 모드: ${buildMode} (draft=공개 전, preview=LAUNCH_PREVIEW 로컬 점검, public=공개) · 전체 페이지 ${pages.size}개 · 공개 페이지 ${pub.length}개`);
lines.push(`- 공개 도구 ${pubTools.length}개 / 목표 ${TARGET.tools}개, 공개 사례 글 ${pubGuides.length}편 / 목표 ${TARGET.guides}편`);
lines.push(`- ads.txt: ${adsStatus}`, "");
lines.push("## 공개 페이지", "", "| 주소 | 종류 | 홈에서 클릭 | 본문 글자 |", "|---|---|---|---|");
for (const p of pub.sort((a, b) => a.path.localeCompare(b.path))) lines.push(`| ${p.path} | ${p.kind} | ${depth.get(p.path) ?? "도달 불가"} | ${p.text.length.toLocaleString("ko-KR")} |`);
if (mobile) {
  lines.push("", "## 모바일 (360×640)", "", "| 주소 | 가로 넘침 | 외부 요청 | 첫 화면 |", "|---|---|---|---|");
  for (const r of mobileRows) lines.push(`| ${r.path} | ${r.overflow > 0 ? `${r.overflow}px` : "없음"} | ${r.external} | ${r.shot} |`);
}
lines.push("", `## 실패 ${errors.length}개`, "", ...(errors.length ? errors.map((e) => `- ${e}`) : ["- 없음"]));
lines.push("", `## 경고 ${warns.length}개`, "", ...(warns.length ? warns.map((w) => `- ${w}`) : ["- 없음"]), "");
const md = lines.join("\n");
console.log(md);
if (reportPath) {
  mkdirSync(dirname(join(root, reportPath)), { recursive: true });
  writeFileSync(join(root, reportPath), md);
}
process.exit(errors.length ? 1 : 0);
