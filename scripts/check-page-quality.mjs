// 도구 페이지 품질 검사 (기획안 3-3절 8개 항목). 빌드 결과(apps/web/out)를 읽는다.
//   node scripts/check-page-quality.mjs            → 모든 도구 페이지
//   node scripts/check-page-quality.mjs car-tax    → 한 도구만
// 실패(구조 누락)는 종료 코드 1. 경고(검수 전, 미확인 링크, 확인 대기 기능, 초안 표시)는 공개 전에 해결할 목록.
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const out = join(root, "apps/web/out");
const TOOL_IDS = ["car-tax", "inspection", "ev-subsidy", "registration-tax", "car-loan", "ev-charging"];
const SECTIONS = ["summary", "calculator", "examples", "method", "table", "faq", "next", "disclaimer"];
const only = process.argv[2];

let failed = 0;
for (const id of only ? [only] : TOOL_IDS) {
  const file = join(out, id, "index.html");
  if (!existsSync(file)) {
    if (only) {
      console.error(`${id}: 빌드 결과에 페이지 없음`);
      failed += 1;
    }
    continue;
  }
  const html = readFileSync(file, "utf8");
  const errors = [];
  const warns = [];
  const count = (re) => (html.match(re) ?? []).length;

  for (const s of SECTIONS) if (!html.includes(`data-section="${s}"`)) errors.push(`섹션 없음: ${s}`);
  const summary = html.match(/data-section="summary"[^>]*>([\s\S]*?)<\/section>/)?.[1] ?? "";
  if ((summary.match(/<p>/g) ?? []).length < 3) errors.push("요약 3문장 미만");
  if (count(/data-example="true"/g) < 3) errors.push(`사례 ${count(/data-example="true"/g)}개 (3개 이상 필요)`);
  if (count(/data-faq-item="true"/g) < 5) errors.push(`FAQ ${count(/data-faq-item="true"/g)}개 (5개 이상 필요)`);
  if (!/class="sources"/.test(html)) errors.push("출처 목록 없음");
  if (/확인 전<\/span>|시행 확인 전/.test(html)) errors.push("출처에 확인 전 값이 있음");
  if (count(/<h1[\s>]/g) !== 1) errors.push("h1이 1개가 아님");

  if (html.includes("data-unreviewed")) warns.push("운영자 검수 전 (tools.ts reviewed=false)");
  if (count(/data-link-verified="false"/g)) warns.push(`확인 안 된 공식 링크 ${count(/data-link-verified="false"/g)}개 (lib/links.ts)`);
  if (html.includes("data-pending")) warns.push("데이터 확인 대기 중인 기능 있음 (data-pending)");
  if (html.includes("data-draft")) warns.push("공개 전 초안 (tools.ts published=false)");

  const status = errors.length ? "실패" : warns.length ? "통과(경고)" : "통과";
  console.log(`\n[${id}] ${status} — 사례 ${count(/data-example="true"/g)} · FAQ ${count(/data-faq-item="true"/g)}`);
  for (const e of errors) console.log(`  실패: ${e}`);
  for (const w of warns) console.log(`  경고: ${w}`);
  if (errors.length) failed += 1;
}
process.exit(failed ? 1 : 0);
