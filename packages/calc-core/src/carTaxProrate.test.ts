import { describe, expect, it } from "vitest";
import { calcCarTax } from "./carTax";
import { calcTransferProrate, type ProrateParams } from "./carTaxProrate";
import { FAKE_CAR_TAX } from "./fixtures.test-util";

// ★법령값 아님★ 산식만 검증 (법령값은 packages/data official.test.ts)
const P: ProrateParams = {
  minCollectWon: 1_000,
  halfBasisMinAge: 3,
  transferDayOwner: "buyer",
  educationTaxRate: 0.1,
  truncateUnit: 10,
};
const old = calcCarTax(
  {
    fuelType: "gasoline",
    displacementCc: 1500,
    ageStartDate: "2020-03-01",
    taxYear: 2027,
  },
  FAKE_CAR_TAX,
); // 기분 10,500
const young = calcCarTax(
  {
    fuelType: "gasoline",
    displacementCc: 1500,
    ageStartDate: "2026-03-01",
    taxYear: 2027,
  },
  FAKE_CAR_TAX,
); // 차령 2, 연세액 30,000

describe("calcTransferProrate", () => {
  it("차령 3년 이상: 기분세액 × 일수 ÷ 기분 일수 (1기분 181일)", () => {
    expect(old.halves[0].carTax).toBe(10_500);
    const r = calcTransferProrate(old, "2027-04-15", 2027, P);
    expect([r.half, r.halfDays, r.basis]).toEqual([1, 181, "half"]);
    // 1/1~4/14 = 104일 → 10,500×104/181 = 6,033.1 → 6,030 / 교육세 603 → 600
    expect([
      r.seller.from,
      r.seller.to,
      r.seller.days,
      r.seller.carTax,
      r.seller.total,
    ]).toEqual(["2027-01-01", "2027-04-14", 104, 6_030, 6_630]);
    // 4/15~6/30 = 77일 → 4,466.8 → 4,460 / 446 → 440
    expect([
      r.buyer.from,
      r.buyer.to,
      r.buyer.days,
      r.buyer.carTax,
      r.buyer.total,
    ]).toEqual(["2027-04-15", "2027-06-30", 77, 4_460, 4_900]);
    // 양수인은 2기분 전액도 낸다
    expect(r.buyerYearTotal).toBe(4_900 + old.halves[1].total);
    expect(r.sellerYearTotal).toBe(6_630);
  });
  it("차령 3년 미만: 연세액 × 일수 ÷ 365", () => {
    const r = calcTransferProrate(young, "2027-04-15", 2027, P);
    expect(r.basis).toBe("annual");
    // 30,000×104/365 = 8,547.9 → 8,540 / 30,000×77/365 = 6,328.7 → 6,320
    expect([r.seller.carTax, r.buyer.carTax]).toEqual([8_540, 6_320]);
  });
  it("이전일 당일을 양도인 몫으로 두면 하루가 옮겨간다", () => {
    const r = calcTransferProrate(old, "2027-04-15", 2027, {
      ...P,
      transferDayOwner: "seller",
    });
    expect([r.seller.days, r.seller.to, r.buyer.days, r.buyer.from]).toEqual([
      105,
      "2027-04-15",
      76,
      "2027-04-16",
    ]);
  });
  it("2기분(184일) 이전: 양도인은 1기분 전액 + 2기분 일할", () => {
    const r = calcTransferProrate(old, "2027-10-20", 2027, P);
    // 7/1~10/19 = 111일 → 10,500×111/184 = 6,334.2 → 6,330 / 633 → 630
    expect([r.half, r.halfDays, r.seller.days, r.seller.carTax]).toEqual([
      2, 184, 111, 6_330,
    ]);
    expect(r.sellerYearTotal).toBe(6_960 + old.halves[0].total);
    expect(r.buyerYearTotal).toBe(r.buyer.total);
  });
  it("최소 징수액 미만은 징수하지 않음", () => {
    const r = calcTransferProrate(young, "2027-01-03", 2027, P);
    // 2일 → 30,000×2/365 = 164 → 160 < 1,000
    expect([
      r.seller.days,
      r.seller.carTax,
      r.seller.total,
      r.seller.waived,
    ]).toEqual([2, 0, 0, true]);
  });
  it("정액(전기 등)은 차령과 관계없이 연세액 기준", () => {
    const ev = calcCarTax(
      { fuelType: "electric", ageStartDate: "2015-03-01", taxYear: 2027 },
      FAKE_CAR_TAX,
    );
    const r = calcTransferProrate(ev, "2027-04-15", 2027, P);
    // 50,000×104/365 = 14,246.5 → 14,240
    expect([r.basis, r.seller.carTax]).toEqual(["annual", 14_240]);
  });
  it("과세연도 밖 날짜는 거부", () => {
    expect(() => calcTransferProrate(old, "2026-12-31", 2027, P)).toThrow(
      RangeError,
    );
  });
});
