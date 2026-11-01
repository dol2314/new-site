import { describe, expect, it } from "vitest";
import { ageStartDate, calcCarTax, calcPrepay, carAgeByHalf, reductionRate } from "./carTax";
import { FAKE_CAR_TAX, FAKE_PREPAY } from "./fixtures.test-util";

// 기대값은 FAKE 매개변수로 손으로 계산한 값(산식 검증용, 법령값 아님)
describe("ageStartDate (차령기산일 규칙)", () => {
  it("제작연도에 등록 → 등록일", () => expect(ageStartDate("2024-08-10", 2024)).toBe("2024-08-10"));
  it("제작연도 모름 → 등록일", () => expect(ageStartDate("2024-08-10")).toBe("2024-08-10"));
  it("이전 연도 제작 → 제작연도 말일", () => expect(ageStartDate("2025-02-03", 2024)).toBe("2024-12-31"));
  it("제작연도가 늦으면 오류", () => expect(() => ageStartDate("2024-02-03", 2025)).toThrow(RangeError));
});

describe("carAgeByHalf (기분별 차령)", () => {
  it("1~6월 기산: 두 기분 같음", () => expect(carAgeByHalf("2023-06-30", 2026)).toEqual([4, 4]));
  it("7~12월 기산: 1기분이 1 적음", () => expect(carAgeByHalf("2023-07-01", 2026)).toEqual([3, 4]));
  it("기산 당해 7월 이후 등록: 1기분 0", () => expect(carAgeByHalf("2026-09-01", 2026)).toEqual([0, 1]));
  it("과세연도가 앞서면 오류", () => expect(() => carAgeByHalf("2026-01-01", 2025)).toThrow(RangeError));
});

describe("reductionRate", () => {
  const p = FAKE_CAR_TAX.ageReduction; // (min(n,5) - 2) × 10%
  it("minAge 이하 0", () => expect(reductionRate(2, p)).toBe(0));
  it("1단계", () => expect(reductionRate(3, p)).toBe(0.1));
  it("maxAge에서 멈춤", () => expect(reductionRate(9, p)).toBe(0.3));
});

describe("calcCarTax", () => {
  it("1000cc 첫 구간, 신차", () => {
    const r = calcCarTax({ fuelType: "gasoline", displacementCc: 1000, ageStartDate: "2026-02-01", taxYear: 2026 }, FAKE_CAR_TAX);
    expect(r.baseAnnual).toBe(10_000);
    expect(r.halves.map((h) => h.carTax)).toEqual([5_000, 5_000]);
    expect(r.annualTotal).toBe(11_000);
  });
  it("1001cc는 둘째 구간", () =>
    expect(calcCarTax({ fuelType: "gasoline", displacementCc: 1001, ageStartDate: "2026-02-01", taxYear: 2026 }, FAKE_CAR_TAX).baseAnnual).toBe(20_020));
  it("기분별 차령이 다르면 기분별 경감도 다름 + 기분별 절사", () => {
    // A = 1999×20 = 39,980, A/2 = 19,990. 기산 2023-08 → 2026년 차령 [3,4] → 경감 [10%, 20%]
    // 1기: 17,991 → 17,990 / 교육세 1,799 → 1,790 · 2기: 15,992 → 15,990 / 1,599 → 1,590
    const r = calcCarTax({ fuelType: "hybrid", displacementCc: 1999, ageStartDate: "2023-08-15", taxYear: 2026 }, FAKE_CAR_TAX);
    expect(r.halves.map((h) => h.carAge)).toEqual([3, 4]);
    expect(r.halves.map((h) => h.carTax)).toEqual([17_990, 15_990]);
    expect(r.halves.map((h) => h.educationTax)).toEqual([1_790, 1_590]);
    expect(r.carTax).toBe(33_980);
  });
  it("정액(전기)은 차령 경감 없음", () => {
    const r = calcCarTax({ fuelType: "electric", ageStartDate: "2015-01-01", taxYear: 2026 }, FAKE_CAR_TAX);
    expect(r.flat).toBe(true);
    expect(r.carTax).toBe(50_000);
  });
  it("배기량 누락 오류", () =>
    expect(() => calcCarTax({ fuelType: "gasoline", ageStartDate: "2026-01-01", taxYear: 2026 }, FAKE_CAR_TAX)).toThrow(RangeError));
});

describe("calcPrepay", () => {
  // 연세액 36,500 (A/2 = 18,250씩), 교육세 10%
  const tax = calcCarTax({ fuelType: "electric", ageStartDate: "2026-01-01", taxYear: 2027 }, { ...FAKE_CAR_TAX, flatAnnualWon: 36_500 });
  it("1월: 연세액 × 334/365 × 10%", () => {
    const r = calcPrepay(tax, 1, 2027, FAKE_PREPAY);
    expect(r.coveredDays).toBe(334);
    // 36,500 × 334/365 × 0.1 = 3,340 → 자동차세 33,160 / 교육세 3,316 → 3,310
    expect(r.carTaxDiscount).toBe(3_340);
    expect(r.payTotal).toBe(33_160 + 3_310);
    // 고지 기준 연 합계: 기분별 교육세 1,825 → 1,820 (절사) ×2 = 3,640 → 40,140
    expect(tax.annualTotal).toBe(40_140);
    expect(r.saving).toBe(40_140 - (33_160 + 3_310));
  });
  it("윤년 1월은 335/366", () => expect(calcPrepay(tax, 1, 2028, FAKE_PREPAY).coveredDays).toBe(335));
  it("6월: 제2기분 × 10%", () => {
    const r = calcPrepay(tax, 6, 2027, FAKE_PREPAY);
    expect(r.coveredDays).toBeNull();
    expect(r.carTaxDiscount).toBe(1_830); // 18,250 × 0.1 = 1,825 → 36,500-1,825=34,675 → 34,670
  });
  it("9월: 제2기분 × 92/184 × 10%", () => {
    const r = calcPrepay(tax, 9, 2027, FAKE_PREPAY);
    expect(r.coveredDays).toBe(92);
    expect(r.carTaxDiscount).toBe(920); // 18,250 × 0.5 × 0.1 = 912.5 → 35,587.5 → 35,580
  });
  it("허용 안 된 월", () => expect(() => calcPrepay(tax, 3, 2027, FAKE_PREPAY)).toThrow(RangeError));
});
