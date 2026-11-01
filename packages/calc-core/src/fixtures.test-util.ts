/**
 * 테스트 전용 가짜 매개변수. ★법령값이 아니다★ 구간 찾기·절사·경감·날짜 계산 같은 산식만 검증한다.
 * 법령값 검증은 packages/data 의 확인된 데이터로 하는 official.test.ts 에서 한다.
 */
import type { CarTaxParams, PrepayParams } from "./carTax";
import type { InspectionParams } from "./inspection";

export const FAKE_CAR_TAX: CarTaxParams = {
  ccBrackets: [
    { maxCc: 1000, wonPerCc: 10 },
    { maxCc: 2000, wonPerCc: 20 },
    { maxCc: null, wonPerCc: 30 },
  ],
  flatAnnualWon: 50_000,
  educationTaxRate: 0.1,
  ageReduction: { perYearRate: 0.1, minAge: 2, maxAge: 5 },
  truncateUnit: 10,
};

export const FAKE_PREPAY: PrepayParams = {
  rate: 0.1,
  periods: [
    { month: 1, start: "01-16", end: "01-31", basis: "annual-prorated" },
    { month: 6, start: "06-16", end: "06-30", basis: "second-half" },
    { month: 9, start: "09-16", end: "09-30", basis: "second-half-prorated" },
  ],
  secondHalfDays: 184,
  educationTaxRate: 0.1,
  truncateUnit: 10,
};

export const FAKE_INSPECTION: InspectionParams = {
  windowDaysBefore: 10,
  windowDaysAfter: 10,
  penaltyTiers: [
    { fromDay: 1, toDay: 20, baseWon: 1_000 },
    { fromDay: 21, toDay: null, baseWon: 1_000, stepDays: 5, stepWon: 500 },
  ],
  penaltyCapWon: 5_000,
};
