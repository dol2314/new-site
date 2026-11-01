// 사례 분석 글끼리 문단 유사도 검사(대량·복제 글 방지, CLAUDE.md 규칙 6).
// 각 글의 문단(<p>, <li>)을 글자 3-gram 집합으로 만들고, 다른 글의 문단과 겹침(Jaccard)이 0.3 이상이면 실패.
// 숫자는 비교에서 뺀다(같은 형식 문장에 숫자만 바뀐 글도 잡기 위해).
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const dir = join(root, "apps/web/out/guides");
const LIMIT = 0.3;
const MIN_LEN = 40; // 너무 짧은 문단은 비교하지 않음

if (!existsSync(dir)) {
  console.log("사례 글 없음");
  process.exit(0);
}
const paras = (html) => {
  const article = html.match(/<article[\s\S]*?<\/article>/)?.[0] ?? "";
  return [...article.matchAll(/<(p|li)[^>]*>([\s\S]*?)<\/\1>/g)]
    .map((m) => m[2].replace(/<[^>]+>/g, "").replace(/[\d,.]+/g, "#").replace(/\s+/g, " ").trim())
    .filter((t) => t.length >= MIN_LEN && !t.startsWith("예시 조건은") && !t.startsWith("검수일"));
};
const grams = (t) => {
  const s = new Set();
  for (let i = 0; i + 3 <= t.length; i++) s.add(t.slice(i, i + 3));
  return s;
};
const jaccard = (a, b) => {
  let inter = 0;
  for (const g of a) if (b.has(g)) inter++;
  return inter / (a.size + b.size - inter || 1);
};

const docs = readdirSync(dir)
  .filter((n) => existsSync(join(dir, n, "index.html")))
  .map((slug) => ({ slug, paras: paras(readFileSync(join(dir, slug, "index.html"), "utf8")).map((t) => ({ t, g: grams(t) })) }));

let fails = 0;
for (let i = 0; i < docs.length; i++) {
  for (let j = i + 1; j < docs.length; j++) {
    for (const a of docs[i].paras) {
      for (const b of docs[j].paras) {
        const sim = jaccard(a.g, b.g);
        if (sim >= LIMIT) {
          fails++;
          console.log(`실패 ${sim.toFixed(2)}: ${docs[i].slug} ↔ ${docs[j].slug}\n  - ${a.t.slice(0, 80)}\n  - ${b.t.slice(0, 80)}`);
        }
      }
    }
  }
}
console.log(`사례 글 ${docs.length}편, 문단 ${docs.reduce((s, d) => s + d.paras.length, 0)}개 비교 · 기준 ${LIMIT} · 실패 ${fails}`);
process.exit(fails ? 1 : 0);
