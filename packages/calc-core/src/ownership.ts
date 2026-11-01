/**
 * 차를 산 날부터 N개 과세연도 동안 드는 돈: 실구매가 + 자동차세 + 연료·충전비 + 보험료.
 *
 * - 기간: 등록(취득)일 ~ (등록 연도 + N − 1)년 12월 31일. 첫해는 등록일부터 연말까지만 센다.
 * - 자동차세: 첫해는 calcNewRegistrationTax(등록 기분 일할 + 남은 기분 전액), 다음 해부터 연세액 전액(차령 경감 반영).
 *   연도별 세율은 carTaxParamsFor(year)로 받는다. 데이터가 없는 미래 연도는 호출하는 쪽이 현행 세율을 넘기고 화면에 밝힌다.
 * - 연료·충전비·보험료: 1년 금액 × 그 해에 차를 가진 날 비율. 원 단위 반올림.
 * 중고 시세(감가), 정비비, 할부 이자는 넣지 않는다(공식 기준이 없거나 사람마다 다름).
 */
import { calcCarTax, type CarTaxParams, type FuelType } from "./carTax";
import {
  calcNewRegistrationTax,
  type NewRegistrationParams,
} from "./carTaxProrate";
import { daysInYear, diffDays, type IsoDate } from "./dates";

export interface OwnershipInput {
  start: IsoDate;
  years: number;
  /** 실구매가 (차값 − 보조금 + 취득세 + 기타 비용) */
  purchase: number;
  fuelType: FuelType;
  displacementCc?: number;
  carTaxParamsFor: (year: number) => CarTaxParams;
  newRegistration: Omit<
    NewRegistrationParams,
    "educationTaxRate" | "truncateUnit"
  >;
  /** 1년 연료·충전비 */
  annualEnergy: number;
  /** 1년 보험료 */
  annualInsurance: number;
}

export interface OwnershipRow {
  year: number;
  /** 그 해에 차를 가진 날 비율 (첫해만 1 미만) */
  fraction: number;
  carTax: number;
  energy: number;
  insurance: number;
  /** 첫해는 실구매가 포함 */
  cumulative: number;
}

export interface OwnershipResult {
  rows: OwnershipRow[];
  totals: {
    purchase: number;
    carTax: number;
    energy: number;
    insurance: number;
    all: number;
  };
}

export function calcOwnershipCost(i: OwnershipInput): OwnershipResult {
  if (!Number.isInteger(i.years) || i.years < 1)
    throw new RangeError("기간은 1년 이상");
  if (i.annualEnergy < 0 || i.annualInsurance < 0 || i.purchase < 0)
    throw new RangeError("금액은 0 이상");
  const y0 = Number(i.start.slice(0, 4));
  const rows: OwnershipRow[] = [];
  let cumulative = i.purchase;
  for (let k = 0; k < i.years; k++) {
    const year = y0 + k;
    const params = i.carTaxParamsFor(year);
    const tax = calcCarTax(
      {
        fuelType: i.fuelType,
        displacementCc: i.displacementCc,
        ageStartDate: i.start,
        taxYear: year,
      },
      params,
    );
    const fraction =
      k === 0 ? (diffDays(i.start, `${year}-12-31`) + 1) / daysInYear(year) : 1;
    const carTax =
      k === 0
        ? calcNewRegistrationTax(tax, i.start, {
            ...i.newRegistration,
            educationTaxRate: params.educationTaxRate,
            truncateUnit: params.truncateUnit,
          }).yearTotal
        : tax.annualTotal;
    const energy = Math.round(i.annualEnergy * fraction);
    const insurance = Math.round(i.annualInsurance * fraction);
    cumulative += carTax + energy + insurance;
    rows.push({ year, fraction, carTax, energy, insurance, cumulative });
  }
  const sum = (f: (r: OwnershipRow) => number) =>
    rows.reduce((s, r) => s + f(r), 0);
  const totals = {
    purchase: i.purchase,
    carTax: sum((r) => r.carTax),
    energy: sum((r) => r.energy),
    insurance: sum((r) => r.insurance),
    all: 0,
  };
  totals.all =
    totals.purchase + totals.carTax + totals.energy + totals.insurance;
  return { rows, totals };
}
