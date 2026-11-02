import { describe, expect, it } from "vitest";
import { calcLoan, depositInterestWhilePaying } from "./loan";
import { calcPurchase } from "./purchase";

// 기준값: 1,000만원 · 연 5% · 36개월. 원리금균등 월 납입금 = P·r/(1−(1+r)^−n) = 299,708.97 → 299,709원
describe("calcLoan", () => {
  const base = { principal: 10_000_000, annualRate: 0.05, months: 36 } as const;
  it("원리금균등: 월 299,709원, 원금 합계 = 원금", () => {
    const r = calcLoan({ ...base, method: "equal-payment" });
    expect(r.firstPayment).toBe(299_709);
    expect(r.schedule.reduce((s, x) => s + x.principal, 0)).toBe(10_000_000);
    expect(r.schedule[35]!.balance).toBe(0);
    // 산식 총이자 299,708.97×36 − 1,000만 = 789,523 — 원 단위 반올림 차이만 허용
    expect(Math.abs(r.totalInterest - 789_523)).toBeLessThanOrEqual(36);
  });
  it("원금균등: 1회차 = 277,778 + 41,667, 총이자 약 770,833원", () => {
    const r = calcLoan({ ...base, method: "equal-principal" });
    expect(r.firstPayment).toBe(277_778 + 41_667);
    expect(Math.abs(r.totalInterest - 770_833)).toBeLessThanOrEqual(36);
    expect(r.schedule[35]!.balance).toBe(0);
  });
  it("원금균등이 원리금균등보다 이자가 적다", () =>
    expect(
      calcLoan({ ...base, method: "equal-principal" }).totalInterest,
    ).toBeLessThan(
      calcLoan({ ...base, method: "equal-payment" }).totalInterest,
    ));
  it("유예 40%: 월 196,492원, 마지막에 400만원 + 마지막 달 납입금", () => {
    const r = calcLoan({ ...base, method: "balloon", balloonRate: 0.4 });
    expect(r.firstPayment).toBe(196_492);
    expect(r.balloon).toBe(4_000_000);
    expect(r.lastPayment).toBeGreaterThan(4_000_000);
    expect(Math.abs(r.totalInterest - 1_073_714)).toBeLessThanOrEqual(36);
  });
  it("무이자: 월 = 원금/개월", () => {
    const r = calcLoan({
      principal: 3_600_000,
      annualRate: 0,
      months: 36,
      method: "equal-payment",
    });
    expect([r.firstPayment, r.totalInterest]).toEqual([100_000, 0]);
  });
  it("범위 밖 입력 거부", () => {
    expect(() =>
      calcLoan({ ...base, months: 0, method: "equal-payment" }),
    ).toThrow(RangeError);
    expect(() =>
      calcLoan({ ...base, annualRate: 0.5, method: "equal-payment" }),
    ).toThrow(RangeError);
    expect(() =>
      calcLoan({ ...base, method: "balloon", balloonRate: 1 }),
    ).toThrow(RangeError);
  });
});

describe("calcPurchase", () => {
  const i = {
    price: 45_000_000,
    subsidy: 9_000_000,
    registrationTax: 1_463_630,
    extra: 300_000,
    downPayment: 5_000_000,
    financeTaxAndExtra: false,
  };
  it("실구매가 = 차값 − 보조금 + 취득세 + 기타", () => {
    const r = calcPurchase(i);
    expect([r.carPayable, r.realPrice]).toEqual([36_000_000, 37_763_630]);
    expect([r.financed, r.cashAtStart]).toEqual([
      31_000_000,
      5_000_000 + 1_463_630 + 300_000,
    ]);
  });
  it("취득세·기타도 할부에 넣으면", () => {
    const r = calcPurchase({ ...i, financeTaxAndExtra: true });
    expect([r.financed, r.cashAtStart]).toEqual([32_763_630, 5_000_000]);
  });
  it("보조금이 차값보다 크면 오류", () =>
    expect(() => calcPurchase({ ...i, subsidy: 50_000_000 })).toThrow(
      RangeError,
    ));
});

describe("depositInterestWhilePaying", () => {
  it("12개월 무이자 1,200만원, 예금 연 12%: 잔액 1,200·1,100·…·100만원 × 1% = 780만원 × 1% = 78만원", () => {
    const loan = calcLoan({
      principal: 12_000_000,
      annualRate: 0,
      months: 12,
      method: "equal-payment",
    });
    expect(depositInterestWhilePaying(loan, 12_000_000, 0.12)).toBe(780_000);
  });
  it("예금 이율 0이면 0", () => {
    const loan = calcLoan({
      principal: 1_000_000,
      annualRate: 0.05,
      months: 6,
      method: "equal-payment",
    });
    expect(depositInterestWhilePaying(loan, 1_000_000, 0)).toBe(0);
  });
});
