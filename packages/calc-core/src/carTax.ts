/**
 * 비영업용 승용자동차 자동차세 + 지방교육세 + 연납(연세액 일시납부) 공제.
 *
 * 법령값(세율·경감률·공제 이자율·기간)은 이 파일에 쓰지 않는다. CarTaxParams·PrepayParams로 받는다.
 * 실제 값과 출처는 packages/data/data/car-tax/{연도}.json.
 *
 * 계산 구조 (2026-11-01 국가법령정보센터 현행본으로 확인):
 * - 연세액 A = 배기량 × cc당 세액 (지방세법 제127조제1항제1호) / 전기 등 그 밖의 승용 = 정액 (같은 항 제3호)
 * - 차령 경감은 배기량 과세 승용차에만, 기분(1~6월, 7~12월)별로:
 *     각 기분세액 = A/2 - (A/2 × 5/100)(n - 2), 2 ≤ n ≤ 12, 12년 초과는 12년 (같은 항 제2호)
 * - 기분별 차령 n (지방세법 시행령 제122조제2항, 기산일은 자동차관리법 시행령 제3조):
 *     기산일이 1~6월: 과세연도 - 기산연도 + 1 (두 기분 같음)
 *     기산일이 7~12월: 1기분 = 과세연도 - 기산연도, 2기분 = 과세연도 - 기산연도 + 1
 * - 지방교육세 = 납부할 자동차세액 × 30% (지방세법 제151조제1항제7호)
 * - 10원 미만 끝수 버림 (지방세기본법 제59조 → 국고금 관리법 제47조제1항). 기분별 징수금마다 적용한다.
 * - 연납 공제 (지방세법 제128조제3항, 시행령 제125조제3항·제6항): PrepayPeriod.basis 참고
 *
 * 범위 밖: 영업용·승합·화물, 연중 신규등록의 일할계산(이전 일할계산은 carTaxProrate.ts), 지자체 조례로 바꾼 세율(법 제127조제3항, 제151조제2항).
 */
import {
  daysInYear,
  diffDays,
  formatDate,
  parseDate,
  type IsoDate,
} from "./dates";
import { truncateTo } from "./money";

export type FuelType =
  | "gasoline"
  | "diesel"
  | "lpg"
  | "hybrid"
  | "electric"
  | "hydrogen";

export interface CcBracket {
  /** 이 배기량 이하. null이면 그 위 전부. 오름차순 */
  maxCc: number | null;
  wonPerCc: number;
}

export interface CarTaxParams {
  ccBrackets: CcBracket[];
  /** 그 밖의 승용자동차(전기 등) 연세액 */
  flatAnnualWon: number;
  educationTaxRate: number;
  /** 기분세액 경감: (min(n, maxAge) - minAge) × perYearRate, n ≤ minAge면 0 */
  ageReduction: { perYearRate: number; minAge: number; maxAge: number };
  truncateUnit: number;
}

export interface CarTaxInput {
  fuelType: FuelType;
  /** 배기량(cc). 전기·수소는 무시 */
  displacementCc?: number;
  /** 차령기산일 (ageStartDate()로 구함) */
  ageStartDate: IsoDate;
  taxYear: number;
}

export interface Breakdown {
  label: string;
  value: number;
  rule: string;
}

export interface HalfTax {
  /** 1 = 제1기분(1~6월, 6월 납기), 2 = 제2기분(7~12월, 12월 납기) */
  half: 1 | 2;
  carAge: number;
  reductionRate: number;
  carTax: number;
  educationTax: number;
  total: number;
}

export interface CarTaxResult {
  /** 경감 전 연세액 A */
  baseAnnual: number;
  halves: [HalfTax, HalfTax];
  carTax: number;
  educationTax: number;
  annualTotal: number;
  /** 배기량이 아닌 정액 과세(전기 등) */
  flat: boolean;
  breakdown: Breakdown[];
}

const FLAT_FUELS: FuelType[] = ["electric", "hydrogen"];

/**
 * 차령기산일. 제작연도에 등록된 차는 최초 신규등록일, 아니면 제작연도의 말일 (자동차관리법 시행령 제3조).
 * productionYear를 모르면 최초등록일을 쓴다(대부분 제작연도에 등록됨).
 */
export function ageStartDate(
  firstRegisteredAt: IsoDate,
  productionYear?: number,
): IsoDate {
  const regYear = new Date(parseDate(firstRegisteredAt)).getUTCFullYear();
  if (productionYear === undefined || productionYear === regYear)
    return firstRegisteredAt;
  if (productionYear > regYear)
    throw new RangeError("제작연도가 등록연도보다 늦음");
  return `${productionYear}-12-31`;
}

/** 기분별 차령 (지방세법 시행령 제122조제2항) */
export function carAgeByHalf(
  start: IsoDate,
  taxYear: number,
): [number, number] {
  const d = new Date(parseDate(start));
  const y = d.getUTCFullYear();
  if (taxYear < y) throw new RangeError("과세연도가 차령기산일보다 앞섬");
  const firstHalfStart = d.getUTCMonth() < 6; // 1~6월
  const second = taxYear - y + 1;
  return [firstHalfStart ? second : taxYear - y, second];
}

export function reductionRate(
  age: number,
  p: CarTaxParams["ageReduction"],
): number {
  const n = Math.min(age, p.maxAge);
  if (n <= p.minAge) return 0;
  return round6((n - p.minAge) * p.perYearRate);
}

export function calcCarTax(
  input: CarTaxInput,
  params: CarTaxParams,
): CarTaxResult {
  const flat = FLAT_FUELS.includes(input.fuelType);
  const breakdown: Breakdown[] = [];
  let A: number;
  if (flat) {
    A = params.flatAnnualWon;
    breakdown.push({
      label: "연세액(정액)",
      value: A,
      rule: "전기 등 그 밖의 승용자동차 — 차령 경감 없음",
    });
  } else {
    const cc = input.displacementCc;
    if (cc === undefined || !Number.isFinite(cc) || cc <= 0)
      throw new RangeError("배기량(cc)을 입력해야 함");
    const bracket = params.ccBrackets.find(
      (b) => b.maxCc === null || cc <= b.maxCc,
    );
    if (!bracket) throw new RangeError(`배기량 구간 없음: ${cc}cc`);
    A = cc * bracket.wonPerCc;
    breakdown.push({
      label: "연세액(경감 전)",
      value: A,
      rule: `${cc}cc × cc당 ${bracket.wonPerCc}원`,
    });
  }

  const ages = carAgeByHalf(input.ageStartDate, input.taxYear);
  const halves = ([1, 2] as const).map((half, i) => {
    const age = ages[i] as number;
    const rate = flat ? 0 : reductionRate(age, params.ageReduction);
    const raw = A / 2 - (A / 2) * rate;
    const carTax = truncateTo(raw, params.truncateUnit);
    const educationTax = truncateTo(
      carTax * params.educationTaxRate,
      params.truncateUnit,
    );
    return {
      half,
      carAge: age,
      reductionRate: rate,
      carTax,
      educationTax,
      total: carTax + educationTax,
    };
  }) as [HalfTax, HalfTax];

  for (const h of halves) {
    breakdown.push({
      label: `제${h.half}기분 자동차세`,
      value: h.carTax,
      rule:
        h.reductionRate > 0
          ? `A/2에서 차령 ${h.carAge}년 경감 ${round6(h.reductionRate * 100)}%`
          : `A/2 (차령 ${h.carAge}년, 경감 없음)`,
    });
  }
  const carTax = halves[0].carTax + halves[1].carTax;
  const educationTax = halves[0].educationTax + halves[1].educationTax;
  breakdown.push({
    label: "지방교육세",
    value: educationTax,
    rule: `기분별 자동차세 × ${round6(params.educationTaxRate * 100)}%`,
  });
  return {
    baseAnnual: A,
    halves,
    carTax,
    educationTax,
    annualTotal: carTax + educationTax,
    flat,
    breakdown,
  };
}

/**
 * 연납 공제 계산식 종류 (지방세법 제128조제3항 표):
 * - "annual-prorated": 연세액 × (납부기한 다음 날~12월 31일 일수 / 365, 윤년 366) × 이자율   — 1월, 3월
 * - "second-half": 제2기분세액 × 이자율                                                   — 6월
 * - "second-half-prorated": 제2기분세액 × (납부기한 다음 날~12월 31일 일수 / 184) × 이자율   — 9월
 */
export type PrepayBasis =
  | "annual-prorated"
  | "second-half"
  | "second-half-prorated";

export interface PrepayPeriod {
  month: number;
  /** 신고납부기간 "MM-DD" */
  start: string;
  end: string;
  basis: PrepayBasis;
}

export interface PrepayParams {
  /** 대통령령으로 정하는 이자율 */
  rate: number;
  periods: PrepayPeriod[];
  /** second-half-prorated 계산식의 분모 일수 */
  secondHalfDays: number;
  educationTaxRate: number;
  truncateUnit: number;
}

export interface PrepayResult {
  month: number;
  periodStart: IsoDate;
  periodEnd: IsoDate;
  /** 납부기한 다음 날 ~ 12월 31일 일수 (6월 방식은 해당 없음 → null) */
  coveredDays: number | null;
  carTaxDiscount: number;
  /** 공제 후 연 자동차세 + 지방교육세 */
  payTotal: number;
  /** 고지대로 낼 때보다 줄어드는 금액 (지방교육세 감소 포함) */
  saving: number;
  breakdown: Breakdown[];
}

export function calcPrepay(
  tax: CarTaxResult,
  month: number,
  year: number,
  p: PrepayParams,
): PrepayResult {
  const period = p.periods.find((x) => x.month === month);
  if (!period) throw new RangeError(`연납 신고납부 월이 아님: ${month}월`);
  const periodStart = `${year}-${period.start}`;
  const periodEnd = `${year}-${period.end}`;
  const nextDay = formatDate(parseDate(periodEnd) + 86_400_000);
  const days = diffDays(nextDay, `${year}-12-31`) + 1;
  const second = tax.halves[1].carTax;

  let raw: number;
  let rule: string;
  let coveredDays: number | null = days;
  switch (period.basis) {
    case "annual-prorated":
      raw = tax.carTax * (days / daysInYear(year)) * p.rate;
      rule = `연세액 ${tax.carTax.toLocaleString("ko-KR")}원 × ${days}/${daysInYear(year)} × ${round6(p.rate * 100)}%`;
      break;
    case "second-half":
      raw = second * p.rate;
      coveredDays = null;
      rule = `제2기분세액 ${second.toLocaleString("ko-KR")}원 × ${round6(p.rate * 100)}%`;
      break;
    case "second-half-prorated":
      raw = second * (days / p.secondHalfDays) * p.rate;
      rule = `제2기분세액 ${second.toLocaleString("ko-KR")}원 × ${days}/${p.secondHalfDays} × ${round6(p.rate * 100)}%`;
      break;
  }

  const payCarTax = truncateTo(tax.carTax - raw, p.truncateUnit);
  const payEdu = truncateTo(payCarTax * p.educationTaxRate, p.truncateUnit);
  const payTotal = payCarTax + payEdu;
  return {
    month,
    periodStart,
    periodEnd,
    coveredDays,
    carTaxDiscount: tax.carTax - payCarTax,
    payTotal,
    saving: tax.annualTotal - payTotal,
    breakdown: [
      { label: "공제 계산", value: Math.round(raw), rule },
      {
        label: "공제 후 자동차세",
        value: payCarTax,
        rule: `${p.truncateUnit}원 미만 버림`,
      },
      {
        label: "지방교육세",
        value: payEdu,
        rule: `공제 후 자동차세 × ${round6(p.educationTaxRate * 100)}%`,
      },
    ],
  };
}

function round6(n: number): number {
  return Math.round(n * 1e6) / 1e6;
}

export interface SplitInstallments {
  /** 3월 16~31일: 제1기분 자동차세 절반 + 그 교육세 */
  march: number;
  /** 6월 납기: 제1기분 나머지 */
  june: number;
  /** 9월 16~30일: 제2기분 자동차세 절반 + 그 교육세 */
  september: number;
  /** 12월 납기: 제2기분 나머지 */
  december: number;
  total: number;
}

/**
 * 분할납부(지방세법 제128조제1항 단서): 신청하면 각 기분세액의 절반을 3월·9월에 먼저 낸다. 공제는 없다.
 * 끝수 처리(가정): 기분 자동차세의 절반을 truncateUnit 미만 버림, 교육세는 그 금액 × 교육세율 버림, 나머지는 납기분.
 * 법령에 분할분 끝수 처리가 따로 없어 실제 고지액과 몇십 원 다를 수 있다.
 */
export function splitInstallments(
  tax: CarTaxResult,
  educationTaxRate: number,
  truncateUnit: number,
): SplitInstallments {
  const part = (h: HalfTax) => {
    const car = truncateTo(h.carTax / 2, truncateUnit);
    const first = car + truncateTo(car * educationTaxRate, truncateUnit);
    return [first, h.total - first] as const;
  };
  const [march, june] = part(tax.halves[0]);
  const [september, december] = part(tax.halves[1]);
  return {
    march,
    june,
    september,
    december,
    total: march + june + september + december,
  };
}
