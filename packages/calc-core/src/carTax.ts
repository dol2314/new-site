/**
 * 자동차세(비영업용 승용) + 지방교육세 + 연납 공제.
 *
 * 세율·경감률·공제율 같은 법령값은 이 파일에 쓰지 않는다. 모두 CarTaxParams로 받아서 계산한다.
 * 실제 값은 packages/data 의 연도별 데이터 파일(공식 출처·기준일·verified 포함)에서 온다.
 *
 * 아래 "규칙" 주석의 계산 방식도 법령(지방세법 제127조·제128조, 같은 법 시행령)으로 확인해야 하는 항목이다.
 * 확인 전까지 이 함수를 쓰는 화면은 공개하지 않는다(packages/data RULES 의 verified 참고).
 */
import { truncateTo } from "./money";
import { daysInYear, diffDays, formatDate } from "./dates";

export type FuelType = "gasoline" | "diesel" | "lpg" | "hybrid" | "electric" | "hydrogen";

/** 배기량이 maxCc 이하인 구간의 cc당 세액. maxCc가 null이면 그 위 전부. 오름차순. */
export interface CcBracket {
  maxCc: number | null;
  wonPerCc: number;
}

export interface CarTaxParams {
  ccBrackets: CcBracket[];
  /** 배기량으로 과세하지 않는 승용차(전기·수소 등)의 연 세액 */
  flatAnnualWon: number;
  /** 지방교육세율 (자동차세액에 곱함) */
  educationTaxRate: number;
  /** 차령 경감: 차령이 startAge 이상이면 (차령 - startAge + 1) × perYearRate, 최대 maxRate */
  ageReduction: { startAge: number; perYearRate: number; maxRate: number };
  /** 끝수 처리 단위(원). 이 단위 미만 절사 */
  truncateUnit: number;
}

export interface CarTaxInput {
  fuelType: FuelType;
  /** 배기량(cc). 전기·수소는 무시 */
  displacementCc?: number;
  /** 최초 등록 연도 */
  firstRegisteredYear: number;
  /** 과세 연도 */
  taxYear: number;
}

export interface Breakdown {
  label: string;
  value: number;
  rule: string;
}

export interface CarTaxResult {
  carAge: number;
  ageReductionRate: number;
  /** 자동차세(연) */
  carTax: number;
  /** 지방교육세(연) */
  educationTax: number;
  /** 연 합계 */
  annualTotal: number;
  breakdown: Breakdown[];
}

const FLAT_FUELS: FuelType[] = ["electric", "hydrogen"];

/**
 * 차령. 규칙(확인 필요): 과세 연도 - 최초 등록 연도 + 1.
 * 실제 법령의 차령 기준일·상반기/하반기 등록 처리와 다를 수 있다.
 */
export function carAge(firstRegisteredYear: number, taxYear: number): number {
  if (!Number.isInteger(firstRegisteredYear) || !Number.isInteger(taxYear)) throw new RangeError("연도는 정수");
  if (taxYear < firstRegisteredYear) throw new RangeError("과세 연도가 등록 연도보다 앞섬");
  return taxYear - firstRegisteredYear + 1;
}

export function ageReductionRate(age: number, p: CarTaxParams["ageReduction"]): number {
  if (age < p.startAge) return 0;
  const raw = (age - p.startAge + 1) * p.perYearRate;
  return Math.min(round6(raw), p.maxRate);
}

export function calcCarTax(input: CarTaxInput, params: CarTaxParams): CarTaxResult {
  const breakdown: Breakdown[] = [];
  let base: number;

  if (FLAT_FUELS.includes(input.fuelType)) {
    base = params.flatAnnualWon;
    breakdown.push({ label: "기본 세액(정액)", value: base, rule: "배기량으로 과세하지 않는 승용차의 연 세액" });
  } else {
    const cc = input.displacementCc;
    if (cc === undefined || !Number.isFinite(cc) || cc <= 0) throw new RangeError("배기량(cc)을 입력해야 함");
    const bracket = params.ccBrackets.find((b) => b.maxCc === null || cc <= b.maxCc);
    if (!bracket) throw new RangeError(`배기량 구간 없음: ${cc}cc`);
    base = cc * bracket.wonPerCc;
    breakdown.push({ label: "기본 세액", value: base, rule: `${cc}cc × cc당 ${bracket.wonPerCc}원` });
  }

  const age = carAge(input.firstRegisteredYear, input.taxYear);
  const rate = ageReductionRate(age, params.ageReduction);
  const reduced = base * (1 - rate);
  if (rate > 0) {
    breakdown.push({ label: "차령 경감", value: -(base - reduced), rule: `차령 ${age}년 → ${round6(rate * 100)}% 경감` });
  }
  const carTax = truncateTo(reduced, params.truncateUnit);
  const educationTax = truncateTo(carTax * params.educationTaxRate, params.truncateUnit);
  breakdown.push({ label: "자동차세", value: carTax, rule: `${params.truncateUnit}원 미만 절사` });
  breakdown.push({ label: "지방교육세", value: educationTax, rule: `자동차세 × ${round6(params.educationTaxRate * 100)}%` });

  return { carAge: age, ageReductionRate: rate, carTax, educationTax, annualTotal: carTax + educationTax, breakdown };
}

export interface PrepayParams {
  /** 법정 연납 공제율 */
  rate: number;
  /** 연납 신청 가능 월 (예: [1, 3, 6, 9]) */
  months: number[];
  educationTaxRate: number;
  truncateUnit: number;
}

export interface PrepayResult {
  payMonth: number;
  /** 공제 대상 기간(일): 납부 월 다음 달 1일 ~ 12월 31일 */
  coveredDays: number;
  /** 실제 절감률 = rate × coveredDays / 연 일수 */
  effectiveRate: number;
  carTaxDiscount: number;
  /** 지방교육세 감소분 포함 총 절감액 */
  totalSaving: number;
  payAmount: number;
  breakdown: Breakdown[];
}

/**
 * 연납 공제. 규칙(확인 필요): 공제액 = 연 자동차세 × 공제율 × (납부 월 다음 달 1일부터 12월 31일까지 일수 ÷ 연 일수).
 * 지방교육세는 공제 후 자동차세에 다시 교육세율을 곱한다.
 */
export function calcPrepay(annual: Pick<CarTaxResult, "carTax">, payMonth: number, year: number, p: PrepayParams): PrepayResult {
  if (!p.months.includes(payMonth)) throw new RangeError(`연납 신청 월이 아님: ${payMonth}월`);
  const start = formatDate(Date.UTC(year, payMonth, 1)); // 다음 달 1일
  const end = formatDate(Date.UTC(year, 11, 31));
  const coveredDays = diffDays(start, end) + 1;
  const yearDays = daysInYear(year);
  const effectiveRate = p.rate * (coveredDays / yearDays);
  const carTaxDiscount = truncateTo(annual.carTax * effectiveRate, p.truncateUnit);
  const carTaxAfter = annual.carTax - carTaxDiscount;
  const eduAfter = truncateTo(carTaxAfter * p.educationTaxRate, p.truncateUnit);
  const eduBefore = truncateTo(annual.carTax * p.educationTaxRate, p.truncateUnit);
  const totalSaving = carTaxDiscount + (eduBefore - eduAfter);
  return {
    payMonth,
    coveredDays,
    effectiveRate,
    carTaxDiscount,
    totalSaving,
    payAmount: carTaxAfter + eduAfter,
    breakdown: [
      { label: "공제 대상 기간", value: coveredDays, rule: `${start} ~ ${end} (${yearDays}일 중)` },
      { label: "자동차세 공제", value: -carTaxDiscount, rule: `자동차세 × ${round6(p.rate * 100)}% × ${coveredDays}/${yearDays}` },
      { label: "지방교육세 감소", value: -(eduBefore - eduAfter), rule: "공제 후 자동차세 기준으로 다시 계산" },
    ],
  };
}

function round6(n: number): number {
  return Math.round(n * 1e6) / 1e6;
}
