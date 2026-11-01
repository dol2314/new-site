import { describe, expect, it } from "vitest";
import { calcRegistrationTax, type RegistrationTaxInput, type RegistrationTaxParams } from "./registrationTax";

// 가짜 매개변수(법령값 아님): 세율 10%/5%, 면세점 1,000원, 한도는 작은 숫자로 — 분기·선택·절사만 검증
const P: RegistrationTaxParams = {
  rates: { passenger: 0.1, compact: 0.05 },
  taxFreeThresholdWon: 1_000,
  truncateUnit: 10,
  evRelief: { capWon: 5_000, until: "2026-12-31" },
  hydrogenRelief: { capWon: 5_000, until: "2027-12-31" },
  compactRelief: { capWon: 3_000, until: "2027-12-31" },
  multiChild: { until: "2027-12-31", threePlus: { vanExempt: true, otherPassengerCapWon: 5_000 }, two: { vanRate: 0.5, otherPassengerRate: 0.5, otherPassengerThresholdWon: 5_000, otherPassengerFixedWon: 2_500 } },
  minimumTax: { exemptOverWon: 8_000, reliefRate: 0.85 },
};
const base: RegistrationTaxInput = { price: 100_000, vatIncluded: false, compact: false, powertrain: "ice", seats7to10: false, childrenUnder18: 0, acquiredOn: "2026-06-01" };

describe("calcRegistrationTax", () => {
  it("기본: 과세표준 × 세율", () => expect(calcRegistrationTax(base, P).payable).toBe(10_000));
  it("부가세 포함 가격은 10/11", () => {
    const r = calcRegistrationTax({ ...base, price: 110_000, vatIncluded: true }, P);
    expect(r.base).toBe(100_000);
  });
  it("시가표준액이 더 크면 시가표준액", () => {
    const r = calcRegistrationTax({ ...base, standardValue: 120_000 }, P);
    expect([r.base, r.baseFrom, r.computedTax]).toEqual([120_000, "standard-value", 12_000]);
  });
  it("면세점 이하는 0", () => expect(calcRegistrationTax({ ...base, price: 1_000 }, P).payable).toBe(0));
  it("전기차: 한도 공제", () => expect(calcRegistrationTax({ ...base, powertrain: "electric" }, P).payable).toBe(5_000));
  it("전기차: 일몰 지나면 감면 없음 + 안내", () => {
    const r = calcRegistrationTax({ ...base, powertrain: "electric", acquiredOn: "2027-01-01" }, P);
    expect(r.payable).toBe(10_000);
    expect(r.expired.map((e) => e.label)).toEqual(["전기자동차 감면"]);
  });
  it("경형: 세율 5% + 한도 이하면 면제", () => {
    const r = calcRegistrationTax({ ...base, compact: true, price: 50_000 }, P); // 2,500 ≤ 3,000
    expect([r.computedTax, r.payable]).toEqual([2_500, 0]);
  });
  it("다자녀 3명 7~10인승: 면제지만 산출세액이 기준 초과면 85%", () => {
    const r = calcRegistrationTax({ ...base, childrenUnder18: 3, seats7to10: true }, P); // 10,000 > 8,000
    expect(r.relief?.minimumTaxApplied).toBe(true);
    expect(r.payable).toBe(1_500);
  });
  it("다자녀 3명 7~10인승: 산출세액이 기준 이하면 전액 면제", () =>
    expect(calcRegistrationTax({ ...base, price: 70_000, childrenUnder18: 3, seats7to10: true }, P).payable).toBe(0));
  it("다자녀 2명 그 밖의 승용: 기준 초과면 고정 공제", () =>
    expect(calcRegistrationTax({ ...base, childrenUnder18: 2 }, P).payable).toBe(7_500));
  it("다자녀 2명 그 밖의 승용: 기준 이하면 50%", () =>
    expect(calcRegistrationTax({ ...base, price: 40_000, childrenUnder18: 2 }, P).payable).toBe(2_000));
  it("감면 여러 개면 큰 것 하나만 (전기 5,000 vs 다자녀2 2,500)", () => {
    const r = calcRegistrationTax({ ...base, powertrain: "electric", childrenUnder18: 2 }, P);
    expect(r.relief?.id).toBe("ev");
    expect(r.otherReliefs.map((x) => x.id)).toEqual(["multi-child-2"]);
  });
  it("전기차 면제는 최소납부 예외: 산출세액이 커도 한도 이하면 전액", () => {
    const P2 = { ...P, evRelief: { capWon: 50_000, until: "2026-12-31" } };
    expect(calcRegistrationTax({ ...base, powertrain: "electric" }, P2).payable).toBe(0);
  });
  it("음수 가격 거부", () => expect(() => calcRegistrationTax({ ...base, price: -1 }, P)).toThrow(RangeError));
});
