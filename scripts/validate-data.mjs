// 데이터 파일의 확인 상태를 보고한다. 형식 검사는 packages/data 테스트(data-files.test.ts)가 한다.
//   node scripts/validate-data.mjs          → 콘솔 요약 (확인 전 값, 180일 지난 값)
//   node scripts/validate-data.mjs --write  → docs/data/checklist.md 갱신 (운영자 확인용 체크리스트)
import { mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const dataDir = join(root, "packages/data/data");
const STALE_DAYS = 180;
const today = new Date().toISOString().slice(0, 10);

const files = (function walk(d) {
  return readdirSync(d).flatMap((n) => {
    const p = join(d, n);
    return statSync(p).isDirectory() ? walk(p) : p.endsWith(".json") ? [p] : [];
  });
})(dataDir).sort();

const pending = [];
const stale = [];
let total = 0;
for (const file of files) {
  const doc = JSON.parse(readFileSync(file, "utf8"));
  const rel = relative(dataDir, file);
  for (const section of ["values", "rules"]) {
    for (const [key, v] of Object.entries(doc[section] ?? {})) {
      total += 1;
      const item = { file: rel, title: doc.title ?? doc.topic, key: `${section}.${key}`, ...v };
      if (!v.verified) pending.push(item);
      else if (v.checked_at && (Date.parse(today) - Date.parse(v.checked_at)) / 86_400_000 > STALE_DAYS) stale.push(item);
    }
  }
}

console.log(`데이터 항목 ${total}개 · 확인 전 ${pending.length}개 · ${STALE_DAYS}일 지난 확인 ${stale.length}개`);
for (const p of pending) console.log(`  [확인 전] ${p.file} ${p.key} — ${p.todo ?? ""}`);
for (const s of stale) console.log(`  [재확인] ${s.file} ${s.key} (마지막 확인 ${s.checked_at})`);

if (process.argv.includes("--write")) {
  const fmt = (x) => (x === undefined || x === null ? "—" : `\`${JSON.stringify(x)}\``);
  const byFile = new Map();
  for (const p of pending) byFile.set(p.file, [...(byFile.get(p.file) ?? []), p]);
  let md = `# 데이터 확인 체크리스트\n\n- 생성: ${today} (\`node scripts/validate-data.mjs --write\`)\n- 확인 전 ${pending.length}개 / 전체 ${total}개\n\n`;
  md += "## 확인하는 방법\n\n1. 출처 링크(법령 조문·공식 안내)를 열어 값을 확인한다.\n2. 데이터 파일에서 `value`에 확인한 값, `effective_date`에 시행일, `checked_at`에 확인한 날, `verified`를 `true`로 바꾸고 `candidate`·`candidate_source`·`todo`를 지운다.\n3. 후보값과 다르면 후보값은 버리고 법령 값을 쓴다. 규칙(rules) 항목은 calc-core 함수의 산식이 법령과 같은지 확인하고, 다르면 함수와 테스트를 고친다.\n4. `npm test`(형식 검사) → 이 스크립트를 다시 실행해 목록을 갱신한다.\n\n";
  for (const [file, items] of byFile) {
    md += `## \`${file}\` — ${items[0].title}\n\n| 항목 | 확인할 것 | 출처 | 후보값 (계산에 안 씀) | 후보값 근거 |\n|---|---|---|---|---|\n`;
    for (const i of items) {
      md += `| \`${i.key}\` | ${i.todo ?? ""} | [${i.source_name}](${encodeURI(i.source_url)}) | ${fmt(i.candidate)} | ${i.candidate_source ?? "—"} |\n`;
    }
    md += "\n";
  }
  const outFile = join(root, "docs/data/checklist.md");
  mkdirSync(dirname(outFile), { recursive: true });
  writeFileSync(outFile, md);
  console.log(`\n작성: ${relative(root, outFile)}`);
}
