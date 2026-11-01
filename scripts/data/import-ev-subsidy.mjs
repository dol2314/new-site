// 전기차 보조금 원본 CSV → packages/data/data/ev-subsidy/{연도}.json
// 원본: packages/data/raw/ev-subsidy/ (README 참고). 금액 단위는 원본과 같이 만원.
import { readFileSync, readdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "../..");
const rawDir = join(root, "packages/data/raw/ev-subsidy");
const outDir = join(root, "packages/data/data/ev-subsidy");
const CHECKED = process.env.CHECKED_AT ?? "2026-11-01";

function parseCsv(text) {
  const lines = text.replace(/^﻿/, "").split(/\r?\n/).filter((l) => l.trim());
  const head = lines[0].split(",").map((s) => s.trim());
  return lines.slice(1).map((l) => {
    const cells = l.split(",").map((s) => s.trim());
    return Object.fromEntries(head.map((h, i) => [h, cells[i] ?? ""]));
  });
}

const num = (s, where) => {
  if (!/^\d+$/.test(s)) throw new Error(`숫자가 아님: "${s}" (${where})`);
  return Number(s);
};

const jejuFile = readdirSync(rawDir).find((f) => /^jeju-\d{4}-\d{2}-\d{2}\.cp949\.csv$/.test(f));
if (!jejuFile) throw new Error("제주 원본 CSV 없음");
const rows = parseCsv(new TextDecoder("euc-kr").decode(readFileSync(join(rawDir, jejuFile))));
const year = num(rows[0]["기준년도"], "기준년도");
const baseDate = rows[0]["데이터기준일자"];

const seen = new Set();
const models = rows.map((r, i) => {
  const where = `${jejuFile} ${i + 2}행`;
  if (r["기준년도"] !== String(year) || r["데이터기준일자"] !== baseDate) throw new Error(`기준년도·기준일이 섞임 (${where})`);
  const rawName = r["차종"];
  const discontinued = rawName.startsWith("(단종)");
  const name = rawName.replace(/^\(단종\)\s*/, "");
  const id = `${r["제조수입사"]}|${name}`;
  if (seen.has(id)) throw new Error(`중복 차종: ${id} (${where})`);
  seen.add(id);
  return {
    id,
    maker: r["제조수입사"],
    name,
    category: r["구분"],
    discontinued,
    national: num(r["국비보조금지원금액(만원)"], where),
    conversionNational: num(r["전환지원 국비 지원금액(만원)"], where),
    local: { jeju: num(r["지방비보조금지원금액(만원)"], where) },
    conversionLocal: { jeju: num(r["전환지원 지방비 지원금액(만원)"], where) },
  };
});
models.sort((a, b) => a.maker.localeCompare(b.maker, "ko") || a.name.localeCompare(b.name, "ko"));

// 지침: 운영자가 무공해차 통합누리집에서 내려받아 제공(2026-11-01). PDF는 저장소에 넣지 않고 판·쪽·해시만 기록한다.
const GUIDE_NAME = "「2026년 전기자동차 보급사업」 보조금 업무처리지침(기후에너지환경부, 2026-06-23판, PDF sha256 191f608eafa6bfb4…)";
const GUIDE_URL = "https://ev.or.kr/";
const GUIDE_DATE = "2026-06-23";
const SRC_NAME = "공공데이터포털 「제주특별자치도_전기자동차보조금지원대상현황_20260917」(제주특별자치도 제공, 이용허락범위 제한 없음)";
const SRC_URL = "https://www.data.go.kr/data/15048678/fileData.do";
const doc = {
  topic: "ev-subsidy",
  year,
  title: `${year}년 전기승용차 구매보조금 (차종별 국비·전환지원금, 지역별 지방비)`,
  scope: "전기승용차(일반승용·경소형). 화물·승합·이륜, 법인·기관 구매는 범위 밖",
  regions: { jeju: { name: "제주특별자치도", baseDate, source_url: SRC_URL } },
  values: {
    models: {
      value: models,
      unit: "만원",
      source_name: SRC_NAME,
      source_url: SRC_URL,
      effective_date: baseDate,
      checked_at: CHECKED,
      verified: true,
      note: `차종 ${models.length}개. 국비·전환지원 국비는 제주 파일의 값이다. 지방비(local)는 지역별로 따로 확인한 값만 넣는다.`,
    },
  },
  rules: {
    nationalUniform: guide(
      "국비는 차종별로 지침 별표 1(성능·가격계수·안전계수 등)에 따라 국비 기준으로 산정. 지자체는 국비의 30% 이상을 지방비로 편성하고 국비 수준에 비례해 차종별로 차등 산정",
      "4-1-1·4-1-2 (9~10쪽)",
      "가격계수(기본가격 5,300만원 미만 100%, 8,500만원 미만 50%, 그 이상 0%)는 차종별 국비에 이미 반영됨. 2027년에 5,000만원/8,000만원으로 강화 계획(계획 단계)",
    ),
    conversionEligibility: guide(
      "최초 등록 후 3년 이상 지난 내연기관차(하이브리드 제외)를 판매 또는 폐차하고, 그 차를 3년 이상 보유한 개인이 전기차를 사는 경우. 2026-01-01 이후 판매·폐차분부터. 가족 간 증여·판매는 제외",
      "4-1-2 (10쪽)",
      "전환지원 국비 = 일반 국비 500만원 이상이면 100만원, 미만이면 100만원 × 국비/500 (만원 미만 반올림)",
    ),
  },
  guideRules: {
    lowIncomeRate: guideValue(0.2, "비율", "차상위 이하 계층 개인: 해당 차량 국비 지원액의 20% 추가", "4-1-2 (10쪽)"),
    youthFirstCarRate: guideValue(0.2, "비율", "청년(19~34세) 개인이 생애 첫 자동차로 전기차를 살 때: 국비 지원액의 20% 추가", "4-1-2 (10쪽)"),
    multiChildManwon: guideValue({ 2: 100, 3: 200, 4: 300 }, "만원", "18세 이하 자녀 2명 100만원, 3명 200만원, 4명 이상 300만원 (정액, 비율 추가지원 뒤에 더함)", "4-1-1·4-1-2 (9~10쪽)"),
    conversion: guideValue({ maxManwon: 100, fullAtNationalManwon: 500 }, "만원", "전환지원 국비 최대 100만원, 일반 국비 500만원 미만이면 비례", "4-1-2 (10쪽)"),
    bmsScrap: guideValue({ manwon: 20, until: "2026-12-31" }, "만원", "BMS 안전기능 업데이트가 안 되는 노후 전기차를 폐차하고 재구매: 20만원 (2026-12-31까지)", "4-1-2 (10쪽)"),
    localMinRatio: guideValue(0.3, "비율", "지자체는 지원건별 국비의 최소 30% 이상 지방비를 지급하도록 편성. 추가지원금은 국비·지방비 비율대로 분담", "4-1-1 (9쪽)"),
  },
};

function guide(value, where, note) {
  return { value, unit: "규칙", source_name: `${GUIDE_NAME} ${where}`, source_url: GUIDE_URL, effective_date: GUIDE_DATE, checked_at: CHECKED, verified: true, note };
}
function guideValue(value, unit, note, where) {
  return { value, unit, source_name: `${GUIDE_NAME} ${where}`, source_url: GUIDE_URL, effective_date: GUIDE_DATE, checked_at: CHECKED, verified: true, note };
}

// 지침 규칙도 다른 값과 같은 형식 검사를 받도록 values로 합친다
Object.assign(doc.values, doc.guideRules);
delete doc.guideRules;

writeFileSync(join(outDir, `${year}.json`), JSON.stringify(doc, null, 2) + "\n");
console.log(`작성: packages/data/data/ev-subsidy/${year}.json — 차종 ${models.length}개 (기준일 ${baseDate}, 단종 ${models.filter((m) => m.discontinued).length}개)`);
