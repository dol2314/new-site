// 연말 법 개정 영향 지도: 기한이 다가오거나 "재확인" 표시가 있는 데이터 값과, 그 값을 쓰는 화면·글, 문장 전제 목록을 만든다.
//   node scripts/law-impact.mjs                → 화면에 출력
//   node scripts/law-impact.mjs --write        → docs/data/law-impact.md 로 저장
import { readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { dirname, join, relative, sep } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const dataDir = join(root, "packages/data/data");
const srcDir = join(root, "apps/web/src");
const TODAY = new Date().toISOString().slice(0, 10);
const HORIZON_DAYS = 430; // 다음 해 연말까지

const walk = (d, ext) =>
  readdirSync(d).flatMap((n) => {
    const p = join(d, n);
    return statSync(p).isDirectory() ? walk(p, ext) : ext.some((e) => p.endsWith(e)) ? [p] : [];
  });
const days = (a, b) => Math.round((Date.parse(b) - Date.parse(a)) / 86_400_000);

// 1. 지켜볼 데이터 값
const watched = [];
for (const f of walk(dataDir, [".json"])) {
  const doc = JSON.parse(readFileSync(f, "utf8"));
  for (const sec of ["values", "rules"]) {
    for (const [k, v] of Object.entries(doc[sec] ?? {})) {
      if (!v || typeof v !== "object" || !("source_name" in v)) continue;
      const until = v.value && typeof v.value === "object" && !Array.isArray(v.value) ? v.value.until : undefined;
      const soon = until && days(TODAY, until) >= -31 && days(TODAY, until) <= HORIZON_DAYS;
      const recheck = /재확인/.test(v.note ?? "");
      if (soon || recheck) watched.push({ file: relative(dataDir, f).split(sep).join("/"), key: `${sec}.${k}`, name: k, until, recheck, v });
    }
  }
}

// 2. 값을 쓰는 코드 (이름 + 그 값을 쓰는 엔진 함수)
const ALIASES = {
  evRelief: ["evRelief", "calcRegistrationTax"],
  hydrogenRelief: ["hydrogenRelief", "calcRegistrationTax"],
  compactRelief: ["compactRelief", "calcRegistrationTax"],
  multiChild: ["multiChild", "calcRegistrationTax"],
  bmsScrap: ["bmsScrap"],
  prepayRate: ["prepay.rate", "calcPrepay"],
  prepayPeriods: ["prepay.periods", "calcPrepay"],
};
const carTaxDefault = ["calcCarTax", "carTaxData", "ownershipData", "carTaxProrateData"];
const srcFiles = walk(srcDir, [".ts", ".tsx"]).filter((f) => !f.endsWith("law-text-assumptions.ts"));
const srcText = new Map(srcFiles.map((f) => [f, readFileSync(f, "utf8")]));
const toUrl = (f) => {
  const rel = relative(srcDir, f).split(sep).join("/");
  let m = rel.match(/^content\/guides\/(.+)\.tsx$/);
  if (m && m[1] !== "index") return `/guides/${m[1]}/`;
  m = rel.match(/^app\/(.+)\/(page|[A-Z]\w+)\.tsx$/);
  if (m && !m[1].includes("[")) return `/${m[1]}/`;
  return null;
};
for (const w of watched) {
  const ids = ALIASES[w.name] ?? (w.file.startsWith("car-tax/") ? carTaxDefault : [w.name]);
  const urls = new Set();
  for (const [f, t] of srcText) if (ids.some((id) => t.includes(id))) {
    const u = toUrl(f);
    if (u) urls.add(u);
  }
  w.urls = [...urls].sort();
}

// 3. 문장 전제 (lib/law-text-assumptions.ts)
const at = readFileSync(join(srcDir, "lib/law-text-assumptions.ts"), "utf8");
const assumptions = [...at.matchAll(/id: "([\w-]+)",\s*what: "([^"]+)",[\s\S]*?files: \[([\s\S]*?)\],/g)].map((m) => ({
  id: m[1],
  what: m[2],
  files: [...m[3].matchAll(/"([^"]+)"/g)].map((x) => x[1]),
}));

const fmt = (v) => {
  const s = JSON.stringify(v.value);
  return s.length > 80 ? `${s.slice(0, 77)}...` : s;
};
const lines = [
  `# 연말 법 개정 영향 지도`,
  "",
  `생성: ${TODAY} (\`node scripts/law-impact.mjs --write\`). 절차는 [docs/runbook/year-end-law-update.md](../runbook/year-end-law-update.md).`,
  "",
  `## 1. 확인할 데이터 값 (${watched.length}개)`,
  "",
  "기한이 1년 안에 끝나거나 \"12월 말 재확인\" 표시가 있는 값입니다.",
  "",
  "| 파일 | 값 | 지금 값 | 기한 | 출처 | 쓰는 화면·글 |",
  "|---|---|---|---|---|---|",
  ...watched.map(
    (w) =>
      `| ${w.file} | \`${w.key}\` | \`${fmt(w.v)}\` | ${w.until ?? "—"} | [${w.v.source_name.slice(0, 40)}…](${encodeURI(w.v.source_url)}) | ${w.urls.length ? w.urls.join(", ") : "—"} |`,
  ),
  "",
  `## 2. 문장에 직접 적은 전제 (${assumptions.length}개)`,
  "",
  "데이터를 고쳐 아래 전제가 깨지면 빌드가 멈추고, 고칠 파일을 알려 줍니다(`apps/web/src/lib/law-text-assumptions.ts`).",
  "",
  ...assumptions.flatMap((a) => [`- **${a.id}** — ${a.what}`, ...a.files.map((f) => `  - ${f}`)]),
  "",
];
const md = lines.join("\n");
if (process.argv.includes("--write")) {
  writeFileSync(join(root, "docs/data/law-impact.md"), md);
  console.log(`docs/data/law-impact.md 저장 — 데이터 값 ${watched.length}개, 문장 전제 ${assumptions.length}개`);
} else console.log(md);
