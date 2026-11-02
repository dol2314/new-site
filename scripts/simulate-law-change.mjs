// 연말 법 개정 모의 점검: 데이터 파일을 잠깐 바꿔 빌드·테스트를 돌리고, 무엇이 멈추는지 보고한 뒤 원래대로 되돌린다.
//   node scripts/simulate-law-change.mjs                 → 모든 시나리오
//   node scripts/simulate-law-change.mjs ev-extend       → 한 시나리오
// 실제 데이터를 고치는 도구가 아니다. 끝나면(오류·중단 포함) 파일을 반드시 원래 내용으로 되돌린다.
import { execSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const REG = "packages/data/data/registration-tax/rules.json";
const CAR27 = "packages/data/data/car-tax/2027.json";

const SCENARIOS = {
  "no-change": {
    what: "개정 없음 — 확인일만 갱신",
    patch: { [REG]: (d) => void (d.values.evRelief.checked_at = "2026-12-31"), [CAR27]: (d) => void (d.values.prepayRate.checked_at = "2026-12-31") },
  },
  "ev-extend": {
    what: "전기차 취득세 감면 1년 연장(한도 그대로)",
    patch: { [REG]: (d) => void (d.values.evRelief.value.until = "2027-12-31") },
  },
  "ev-extend-reduced": {
    what: "전기차 취득세 감면 연장 + 한도 70만원으로 축소",
    patch: { [REG]: (d) => Object.assign(d.values.evRelief.value, { until: "2027-12-31", capWon: 700_000 }) },
  },
  "ev-extend-phased": {
    what: "전기차 감면 연장, 2026년 취득분 140만원·2027년 취득분 70만원 (기간별 한도 earlier 사용)",
    patch: {
      [REG]: (d) => void (d.values.evRelief.value = { capWon: 700_000, until: "2027-12-31", earlier: [{ capWon: 1_400_000, until: "2026-12-31" }] }),
    },
  },
  "prepay-3": {
    what: "2027년 연납 공제 이자율 5% → 3%",
    patch: { [CAR27]: (d) => void (d.values.prepayRate.value = 0.03) },
  },
  "ev-flat-up": {
    what: "2027년 전기차 등 정액 자동차세 10만원 → 12만원",
    patch: { [CAR27]: (d) => void (d.values.flatAnnualWon.value = 120_000) },
  },
};

const only = process.argv[2];
const names = only ? [only] : Object.keys(SCENARIOS);
if (only && !SCENARIOS[only]) {
  console.error(`시나리오 없음: ${only}. 가능: ${Object.keys(SCENARIOS).join(", ")}`);
  process.exit(1);
}

const files = [REG, CAR27];
const originals = Object.fromEntries(files.map((f) => [f, readFileSync(join(root, f), "utf8")]));
const restore = () => {
  for (const [f, text] of Object.entries(originals)) writeFileSync(join(root, f), text);
};
process.on("SIGINT", () => {
  restore();
  process.exit(130);
});

const run = (cmd) => {
  try {
    return { ok: true, out: execSync(cmd, { cwd: root, stdio: "pipe", encoding: "utf8", maxBuffer: 64 * 1024 * 1024 }) };
  } catch (e) {
    return { ok: false, out: `${e.stdout ?? ""}\n${e.stderr ?? ""}` };
  }
};

const results = [];
try {
  for (const name of names) {
    const sc = SCENARIOS[name];
    restore();
    for (const [f, fn] of Object.entries(sc.patch)) {
      const d = JSON.parse(originals[f]);
      fn(d);
      writeFileSync(join(root, f), `${JSON.stringify(d, null, 2)}\n`);
    }
    const build = run("npm run build");
    const ids = [...new Set([...build.out.matchAll(/- \[([\w-]+)\]/g)].map((m) => m[1]))];
    const test = run("npm test -w packages/data");
    const failedTests = [...test.out.matchAll(/^\s*FAIL\s+\S+\s+>\s+(.+)$/gm)].map((m) => m[1].trim());
    results.push({ name, what: sc.what, buildOk: build.ok, ids, testOk: test.ok, failedTests: [...new Set(failedTests)] });
    console.log(`\n[${name}] ${sc.what}`);
    console.log(`  빌드: ${build.ok ? "통과" : "멈춤"}${ids.length ? ` — 깨진 전제: ${ids.join(", ")}` : ""}`);
    if (!build.ok && !ids.length) console.log(build.out.split("\n").filter((l) => /error|Error/.test(l)).slice(0, 5).join("\n"));
    console.log(`  데이터 테스트: ${test.ok ? "통과" : `실패 ${results.at(-1).failedTests.length}건`}`);
    for (const t of results.at(-1).failedTests.slice(0, 8)) console.log(`    - ${t}`);
  }
} finally {
  restore();
  run("npm run build");
  console.log("\n데이터 파일을 원래대로 되돌리고 다시 빌드했습니다.");
}
