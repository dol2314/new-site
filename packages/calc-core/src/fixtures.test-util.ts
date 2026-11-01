/**
 * 테스트 전용 매개변수. ★법령값이 아니다★ 산식(구간 찾기, 절사, 경감, 날짜 계산)을 검증하려고
 * 일부러 실제 값과 헷갈리지 않는 숫자를 썼다. 실제 값은 packages/data 에서 확인 후 넣는다.
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
  ageReduction: { startAge: 3, perYearRate: 0.1, maxRate: 0.3 },
  truncateUnit: 10,
};

export const FAKE_PREPAY: PrepayParams = { rate: 0.1, months: [1, 3, 6, 9], educationTaxRate: 0.1, truncateUnit: 10 };

export const FAKE_INSPECTION: InspectionParams = {
  windowDaysBefore: 10,
  windowDaysAfter: 10,
  penaltyTiers: [
    { fromDay: 1, toDay: 20, baseWon: 1_000 },
    { fromDay: 21, toDay: null, baseWon: 1_000, stepDays: 5, stepWon: 500 },
  ],
  penaltyCapWon: 5_000,
};
