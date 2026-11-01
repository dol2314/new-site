import { describe, expect, it } from "vitest";
import { ageReductionRate, calcCarTax, calcPrepay, carAge } from "./carTax";
import { FAKE_CAR_TAX, FAKE_PREPAY } from "./fixtures.test-util";

// 모든 기대값은 FAKE 매개변수로 손으로 계산한 값이다(법령값 검증 아님).
describe("carAge / ageReductionRate", () => {
  it("등록 연도 = 1년", () => expect(carAge(2026, 2026)).toBe(1));
  it("과세 연도가 앞서면 오류", () => expect(() => carAge(2026, 2025)).toThrow(RangeError));
  it("시작 차령 전엔 경감 없음", () => expect(ageReductionRate(2, FAKE_CAR_TAX.ageReduction)).toBe(0));
  it("시작 차령에서 1단계", () => expect(ageReductionRate(3, FAKE_CAR_TAX.ageReduction)).toBe(0.1));
  it("상한", () => expect(ageReductionRate(20, FAKE_CAR_TAX.ageReduction)).toBe(0.3));
});

describe("calcCarTax", () => {
  it("구간 경계: 1000cc는 첫 구간", () => {
    const r = calcCarTax({ fuelType: "gasoline", displacementCc: 1000, firstRegisteredYear: 2026, taxYear: 2026 }, FAKE_CAR_TAX);
    expect(r.carTax).toBe(10_000);
    expect(r.educationTax).toBe(1_000);
    expect(r.annualTotal).toBe(11_000);
  });
  it("구간 경계: 1001cc는 둘째 구간", () => {
    const r = calcCarTax({ fuelType: "gasoline", displacementCc: 1001, firstRegisteredYear: 2026, taxYear: 2026 }, FAKE_CAR_TAX);
    expect(r.carTax).toBe(20_020);
  });
  it("차령 경감 + 절사: 1999cc, 차령 4년(20% 경감)", () => {
    // 1999 × 20 = 39,980 → ×0.8 = 31,984 → 10원 미만 절사 31,980 / 교육세 3,198 → 3,190
    const r = calcCarTax({ fuelType: "hybrid", displacementCc: 1999, firstRegisteredYear: 2023, taxYear: 2026 }, FAKE_CAR_TAX);
    expect(r.carAge).toBe(4);
    expect(r.carTax).toBe(31_980);
    expect(r.educationTax).toBe(3_190);
  });
  it("전기차는 정액", () => {
    const r = calcCarTax({ fuelType: "electric", firstRegisteredYear: 2026, taxYear: 2026 }, FAKE_CAR_TAX);
    expect(r.carTax).toBe(50_000);
  });
  it("배기량 누락 오류", () =>
    expect(() => calcCarTax({ fuelType: "gasoline", firstRegisteredYear: 2026, taxYear: 2026 }, FAKE_CAR_TAX)).toThrow(RangeError));
});

describe("calcPrepay", () => {
  const annual = { carTax: 36_500 };
  it("1월 납부: 2/1~12/31 = 334일 (평년)", () => {
    const r = calcPrepay(annual, 1, 2027, FAKE_PREPAY);
    expect(r.coveredDays).toBe(334);
    // 36,500 × 0.1 × 334/365 = 3,340
    expect(r.carTaxDiscount).toBe(3_340);
  });
  it("9월 납부: 10/1~12/31 = 92일", () => expect(calcPrepay(annual, 9, 2027, FAKE_PREPAY).coveredDays).toBe(92));
  it("윤년은 366일 기준", () => {
    const r = calcPrepay(annual, 1, 2028, FAKE_PREPAY);
    expect(r.coveredDays).toBe(335);
    expect(r.effectiveRate).toBeCloseTo(0.1 * 335 / 366, 10);
  });
  it("총 절감액 = 자동차세 공제 + 교육세 감소", () => {
    const r = calcPrepay(annual, 1, 2027, FAKE_PREPAY);
    // 교육세: 전 3,650 → 후 (33,160×0.1=3,316→3,310) → 340 감소
    expect(r.totalSaving).toBe(3_340 + 340);
    expect(r.payAmount).toBe(33_160 + 3_310);
  });
  it("허용되지 않은 월 거부", () => expect(() => calcPrepay(annual, 2, 2027, FAKE_PREPAY)).toThrow(RangeError));
});
