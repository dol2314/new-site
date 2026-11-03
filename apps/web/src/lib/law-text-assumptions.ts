/**
 * 글·도구 문장에 숫자나 전제로 직접 적은 법령값 목록.
 *
 * 숫자 대부분은 데이터에서 계산해 자동으로 바뀌지만, 제목·설명·계산 방법 문장처럼 사람이 직접 쓴 부분은 데이터가 바뀌어도
 * 그대로 남는다. 연말 법 개정으로 데이터를 고치면 빌드할 때 여기서 걸러, 다시 써야 할 파일을 알려 준다.
 *
 * 법이 바뀌었을 때: 아래 files의 문장을 새 값에 맞게 고친 뒤, 이 파일의 기대값(holds 조건)을 새 값으로 바꾼다.
 * 절차: docs/runbook/year-end-law-update.md
 */
import { calcCarTax, calcPrepay, calcRegistrationTax } from "@site/calc-core";
import {
  CAR_TAX_YEARS,
  EV_SUBSIDY_YEARS,
  carTaxData,
  registrationTaxData,
} from "@site/data";

export interface TextAssumption {
  id: string;
  /** 문장이 전제로 삼은 내용 */
  what: string;
  holds: boolean;
  /** 값이 바뀌면 다시 써야 할 파일 (apps/web/src 기준) */
  files: string[];
}

const reg = registrationTaxData().params;
const cars = CAR_TAX_YEARS.map(carTaxData);
const c27 = carTaxData(2027);
const allCars = (f: (d: (typeof cars)[number]) => boolean) => cars.every(f);

// 제목·요약에 직접 쓴 계산 결과
const ev45 = (acquiredOn: string) =>
  calcRegistrationTax(
    {
      price: 45_000_000,
      vatIncluded: true,
      compact: false,
      powertrain: "electric",
      seats7to10: false,
      childrenUnder18: 0,
      acquiredOn,
    },
    reg,
  ).payable;
const prepayExample = calcPrepay(
  calcCarTax(
    {
      fuelType: "gasoline",
      displacementCc: 1999,
      ageStartDate: "2025-03-10",
      taxYear: 2027,
    },
    c27.tax,
  ),
  1,
  2027,
  c27.prepay,
).saving;
const evYearTotal = calcCarTax(
  { fuelType: "electric", ageStartDate: "2026-03-01", taxYear: 2027 },
  c27.tax,
).annualTotal;

export const LAW_TEXT_ASSUMPTIONS: TextAssumption[] = [
  {
    id: "ev-relief-ends-2026",
    what: "전기차 취득세 감면(140만원 한도)이 2026-12-31 취득분까지 — 12월 vs 1월 인도 비교 문장의 전제",
    holds:
      reg.evRelief.until === "2026-12-31" && reg.evRelief.capWon === 1_400_000,
    files: [
      "lib/guides.ts (ev-acquisition-tax-year-end 제목·설명)",
      "content/guides/ev-acquisition-tax-year-end.tsx",
      "content/guides/ev-acquisition-tax-after-end.tsx (감면 종료 뒤 판 전체)",
      "content/guides/ev-vs-gasoline-5-years.tsx (1월 인도 감면 없음 문장, 12월 인도 항목)",
      "content/guides/compact-ev-real-price.tsx (1월 인도는 경차 감면, 12월은 전기차 감면)",
      "app/registration-tax/page.tsx (12월·1월 비교 사례 제목·문장)",
      "app/car-loan/page.tsx (12월 인도 vs 1월 인도 사례)",
    ],
  },
  {
    id: "ev-title-diff-140",
    what: "1편 제목 '12월에 인도받으면 140만원 덜 낸다' (4,500만원 전기차 12월 vs 1월 취득세 차이)",
    holds: ev45("2027-01-05") - ev45("2026-12-20") === 1_400_000,
    files: ["lib/guides.ts (ev-acquisition-tax-year-end 제목)"],
  },
  {
    id: "ev-after-title-286",
    what: "1편 '감면 종료 뒤' 판 제목 '4,500만원 전기차는 이제 286만원' (2027년 취득, 감면 없음)",
    holds: Math.floor(ev45("2027-01-15") / 10_000) === 286,
    files: [
      "lib/guides.ts (ev-acquisition-tax-year-end의 afterEvReliefEnd 제목)",
      "content/guides/ev-acquisition-tax-after-end.tsx",
    ],
  },
  {
    id: "reg-rates",
    what: "취득세율 승용 7%·경차 4%, 면세점 50만원, 최소납부세제 200만원 초과 시 85% 감면",
    holds:
      reg.rates.passenger === 0.07 &&
      reg.rates.compact === 0.04 &&
      reg.taxFreeThresholdWon === 500_000 &&
      reg.minimumTax.exemptOverWon === 2_000_000 &&
      reg.minimumTax.reliefRate === 0.85,
    files: [
      "app/registration-tax/page.tsx (설명·계산 방법)",
      "app/car-loan/page.tsx (계산 방법)",
      "lib/guides.ts (multi-child-car-acquisition-tax 설명 '200만원·15%', compact-car-acquisition-tax 설명 '4%')",
    ],
  },
  {
    id: "compact-multichild-until-2027",
    what: "경차 감면(75만원 한도)·다자녀 감면 기한 2027-12-31",
    holds:
      reg.compactRelief.capWon === 750_000 &&
      reg.compactRelief.until === "2027-12-31" &&
      reg.multiChild.until === "2027-12-31",
    files: ["lib/guides.ts (compact-car-acquisition-tax 제목 '75만원')"],
  },
  {
    id: "prepay-rate-5",
    what: "연납 공제 이자율 5%, 신고납부 기간 1·3·6·9월",
    holds: allCars(
      (d) =>
        d.prepay.rate === 0.05 &&
        d.prepay.periods.map((p) => p.month).join() === "1,3,6,9",
    ),
    files: [
      "app/car-tax/page.tsx (계산 방법·기준표)",
      "content/guides/car-tax-prepay-timing.tsx (계산식 문구, FAQ)",
      "content/guides/car-tax-prepay-calendar.tsx (계산식 문구, '지금 5%')",
    ],
  },
  {
    id: "prepay-title-22600",
    what: "2편 제목 '2,000cc급은 1월에 22,600원 아낀다'",
    holds: prepayExample === 22_600,
    files: ["lib/guides.ts (car-tax-prepay-timing 제목)"],
  },
  {
    id: "car-tax-structure",
    what: "지방교육세 30%, 차령 경감 연 5%·최대 50%(12년), 정액 대상 1년 10만원 이하 6월 일괄 고지 기준 10만원",
    holds: allCars(
      (d) =>
        d.tax.educationTaxRate === 0.3 &&
        d.tax.ageReduction.perYearRate === 0.05 &&
        d.tax.ageReduction.maxAge === 12 &&
        d.smallTaxThresholdWon === 100_000,
    ),
    files: [
      "app/car-tax/page.tsx (계산 방법·FAQ)",
      "content/guides/ev-car-tax-flat-rate.tsx ('10만원 이하' 문장)",
    ],
  },
  {
    id: "ev-car-tax-130k",
    what: "전기차 자동차세 1년 13만원(정액 10만원 + 교육세 30%) — 6편 제목·FAQ",
    holds: evYearTotal === 130_000,
    files: [
      "lib/guides.ts (ev-car-tax-flat-rate 제목)",
      "content/guides/ev-car-tax-flat-rate.tsx (FAQ '13만원')",
    ],
  },
  {
    id: "ev-subsidy-2026-guideline",
    what: "보조금 설명이 2026년 지침 기준(가격 기준 5,300만·8,500만원, 2027년 강화 '계획')",
    holds: EV_SUBSIDY_YEARS[EV_SUBSIDY_YEARS.length - 1] === 2026,
    files: [
      "app/ev-subsidy/page.tsx (가격 기준 문장, FAQ)",
      "content/guides/ev-acquisition-tax-year-end.tsx (2027년 보조금 기준 강화 계획 문장)",
      "content/guides/ev-subsidy-extra-support.tsx, ev-conversion-subsidy.tsx, compact-ev-real-price.tsx ('2026년 지침' 표현)",
    ],
  },
];

/** 빌드 때 호출: 전제가 하나라도 깨졌으면 고칠 파일 목록과 함께 멈춘다 */
export function checkLawTextAssumptions(): void {
  const broken = LAW_TEXT_ASSUMPTIONS.filter((a) => !a.holds);
  if (broken.length === 0) return;
  const lines = broken.map(
    (a) => `- [${a.id}] ${a.what}\n    고칠 파일: ${a.files.join(" / ")}`,
  );
  throw new Error(
    `[법령값 변경 확인] 글·도구 문장에 직접 적은 법령값과 데이터가 다릅니다.\n${lines.join("\n")}\n` +
      "문장을 고친 뒤 apps/web/src/lib/law-text-assumptions.ts의 기대값을 갱신하세요. 절차: docs/runbook/year-end-law-update.md",
  );
}
