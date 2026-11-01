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
    nationalUniform: {
      value: null,
      unit: "규칙",
      source_name: `${year}년 전기자동차 보급사업 보조금 업무처리지침(기후에너지환경부)`,
      source_url: "https://ev.or.kr/",
      effective_date: null,
      checked_at: null,
      verified: false,
      todo: "제주 파일의 국비 금액이 다른 지역에도 똑같이 적용되는지 지침 원문으로 확인 (무공해차 통합누리집은 자동 수집 불가 — 운영자가 지침 PDF를 내려받아 확인)",
    },
    conversionEligibility: {
      value: null,
      unit: "규칙",
      source_name: `${year}년 전기자동차 보급사업 보조금 업무처리지침(기후에너지환경부)`,
      source_url: "https://ev.or.kr/",
      effective_date: null,
      checked_at: null,
      verified: false,
      todo: "전환지원금을 받는 조건(내연기관차 폐차·판매, 보유 기간, 신청 기한 등)을 지침 원문으로 확인",
    },
  },
};

writeFileSync(join(outDir, `${year}.json`), JSON.stringify(doc, null, 2) + "\n");
console.log(`작성: packages/data/data/ev-subsidy/${year}.json — 차종 ${models.length}개 (기준일 ${baseDate}, 단종 ${models.filter((m) => m.discontinued).length}개)`);
