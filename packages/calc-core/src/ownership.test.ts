import { describe, expect, it } from "vitest";
import { calcCarTax } from "./carTax";
import { calcNewRegistrationTax } from "./carTaxProrate";
import { FAKE_CAR_TAX } from "./fixtures.test-util";
import { calcOwnershipCost } from "./ownership";

// ★법령값 아님★ 산식만 검증
const NR = {
  minCollectWon: 1_000,
  halfBasisMinAge: 3,
  educationTaxRate: 0.1,
  truncateUnit: 10,
};
const tax = calcCarTax(
  {
    fuelType: "gasoline",
    displacementCc: 1500,
    ageStartDate: "2027-04-15",
    taxYear: 2027,
  },
  FAKE_CAR_TAX,
); // 연 30,000, 기분 15,000

describe("calcNewRegistrationTax", () => {
  it("1기분 등록: 등록일~6/30 77일 → 30,000×77/365 = 6,328.7 → 6,320 + 교육세 630, 2기분 16,500 전액", () => {
    const r = calcNewRegistrationTax(tax, "2027-04-15", NR);
    expect([r.half, r.days, r.carTax, r.total, r.yearTotal]).toEqual([
      1, 77, 6_320, 6_950, 23_450,
    ]);
  });
  it("2기분 등록: 10/20~12/31 73일 → 6,000 + 600", () => {
    const t = calcCarTax(
      {
        fuelType: "gasoline",
        displacementCc: 1500,
        ageStartDate: "2027-10-20",
        taxYear: 2027,
      },
      FAKE_CAR_TAX,
    );
    const r = calcNewRegistrationTax(t, "2027-10-20", NR);
    expect([r.half, r.days, r.total, r.yearTotal]).toEqual([
      2, 73, 6_600, 6_600,
    ]);
  });
  it("최소 징수액 미만이면 0", () => {
    const t = calcCarTax(
      {
        fuelType: "gasoline",
        displacementCc: 1500,
        ageStartDate: "2027-12-31",
        taxYear: 2027,
      },
      FAKE_CAR_TAX,
    );
    const r = calcNewRegistrationTax(t, "2027-12-31", NR);
    expect([r.days, r.total, r.waived]).toEqual([1, 0, true]);
  });
});

describe("calcOwnershipCost", () => {
  const r = calcOwnershipCost({
    start: "2027-04-15",
    years: 3,
    purchase: 1_000_000,
    fuelType: "gasoline",
    displacementCc: 1500,
    carTaxParamsFor: () => FAKE_CAR_TAX,
    newRegistration: { minCollectWon: 1_000, halfBasisMinAge: 3 },
    annualEnergy: 365_000,
    annualInsurance: 0,
  });
  it("첫해는 등록일부터 연말(261일)만, 차령 경감은 3년차부터", () => {
    expect(r.rows.map((x) => [x.year, x.carTax, x.energy])).toEqual([
      [2027, 23_450, 261_000],
      [2028, 33_000, 365_000],
      [2029, 29_700, 365_000],
    ]);
  });
  it("합계와 누적", () => {
    expect(r.totals).toEqual({
      purchase: 1_000_000,
      carTax: 86_150,
      energy: 991_000,
      insurance: 0,
      all: 2_077_150,
    });
    expect(r.rows[2]!.cumulative).toBe(2_077_150);
  });
  it("기간 0년은 거부", () =>
    expect(() =>
      calcOwnershipCost({
        start: "2027-01-01",
        years: 0,
        purchase: 0,
        fuelType: "electric",
        carTaxParamsFor: () => FAKE_CAR_TAX,
        newRegistration: { minCollectWon: 0, halfBasisMinAge: 3 },
        annualEnergy: 0,
        annualInsurance: 0,
      }),
    ).toThrow(RangeError));
});
