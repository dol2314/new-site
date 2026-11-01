// 공유 썸네일(1200x630)과 아이콘(512x512)을 Playwright로 그려 apps/web/public 에 저장한다.
// 사이트 이름이 바뀌면 다시 실행: NEXT_PUBLIC_SITE_NAME=이름 npm run make:og
import { mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { chromium } = require("playwright");

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const pub = join(root, "apps/web/public");
const name = (process.env.NEXT_PUBLIC_SITE_NAME || "차값계산소(가칭)").trim();
const font = `"Apple SD Gothic Neo","Noto Sans KR","WenQuanYi Zen Hei",sans-serif`;
const esc = (s) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);

const og = `<html><body style="margin:0;width:1200px;height:630px;display:flex;flex-direction:column;justify-content:center;padding:0 90px;box-sizing:border-box;background:#1f5fd1;color:#fff;font-family:${font}">
<div style="font-size:84px;font-weight:800;letter-spacing:-2px">${esc(name)}</div>
<div style="font-size:34px;margin-top:28px;opacity:.95;word-break:keep-all">자동차세 · 검사 · 전기차 보조금 · 취등록세 · 할부 · 충전요금</div>
<div style="font-size:30px;margin-top:40px;opacity:.85">공식 기준과 기준일로 계산합니다</div></body></html>`;

const firstChar = [...name][0] ?? "차";
const icon = `<html><body style="margin:0;width:512px;height:512px;display:flex;align-items:center;justify-content:center;background:#1f5fd1;color:#fff;font-family:${font};font-size:300px;font-weight:800">${esc(firstChar)}</body></html>`;

mkdirSync(join(pub, "og"), { recursive: true });
const browser = await chromium.launch();
try {
  const page = await browser.newPage({ viewport: { width: 1200, height: 630 } });
  await page.setContent(og);
  await page.screenshot({ path: join(pub, "og/default.png") });
  await page.setViewportSize({ width: 512, height: 512 });
  await page.setContent(icon);
  await page.screenshot({ path: join(pub, "icon.png") });
  console.log(`[og] 생성: og/default.png, icon.png (이름: ${name})`);
} finally {
  await browser.close();
}
