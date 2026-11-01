import { describe, expect, it } from "vitest";
import { calcChargingCost, tierForKw, type ChargeTier } from "./charging";

// ★법령·공식 요금 아님★ 산식만 검증
const TIERS: ChargeTier[] = [
  { minKw: 0, maxKw: 30, wonPerKwh: 100 },
  { minKw: 30, maxKw: 100, wonPerKwh: 200 },
  { minKw: 100, maxKw: null, wonPerKwh: 300 },
];

describe("tierForKw", () => {
  it("하한 포함, 상한 미포함", () => {
    expect(tierForKw(7, TIERS).wonPerKwh).toBe(100);
    expect(tierForKw(30, TIERS).wonPerKwh).toBe(200);
    expect(tierForKw(99.9, TIERS).wonPerKwh).toBe(200);
    expect(tierForKw(100, TIERS).wonPerKwh).toBe(300);
    expect(tierForKw(350, TIERS).wonPerKwh).toBe(300);
  });
  it("0 이하 출력은 거부", () =>
    expect(() => tierForKw(0, TIERS)).toThrow(RangeError));
});

describe("calcChargingCost", () => {
  it("1,000km ÷ 5km/kWh = 200kWh, 한 방식이면 × 단가", () => {
    const r = calcChargingCost({
      monthlyKm: 1000,
      kmPerKwh: 5,
      mix: [{ label: "a", share: 1, wonPerKwh: 100 }],
    });
    expect([
      r.kwh,
      r.monthlyCost,
      r.annualCost,
      r.wonPerKm,
      r.fuel,
      r.monthlyDiff,
    ]).toEqual([200, 20_000, 240_000, 20, null, null]);
  });
  it("비율대로 나눠 방식마다 반올림", () => {
    // 1,000/6 = 166.67kWh → 70% 116.67 × 101 = 11,783.3 → 11,783 / 30% 50 × 333 = 16,650
    const r = calcChargingCost({
      monthlyKm: 1000,
      kmPerKwh: 6,
      mix: [
        { label: "집", share: 0.7, wonPerKwh: 101 },
        { label: "급속", share: 0.3, wonPerKwh: 333 },
      ],
    });
    expect(r.items.map((i) => [i.kwh, i.cost])).toEqual([
      [116.7, 11_783],
      [50, 16_650],
    ]);
    expect(r.monthlyCost).toBe(28_433);
  });
  it("주유비 비교: 1,000km ÷ 10km/L × 1,500원 = 150,000원", () => {
    const r = calcChargingCost({
      monthlyKm: 1000,
      kmPerKwh: 5,
      mix: [{ label: "a", share: 1, wonPerKwh: 100 }],
      fuel: { kmPerLiter: 10, wonPerLiter: 1500 },
    });
    expect([
      r.fuel?.liters,
      r.fuel?.monthlyCost,
      r.fuel?.wonPerKm,
      r.monthlyDiff,
    ]).toEqual([100, 150_000, 150, 130_000]);
  });
  it("비율 합이 100%가 아니면 거부", () =>
    expect(() =>
      calcChargingCost({
        monthlyKm: 1000,
        kmPerKwh: 5,
        mix: [
          { label: "a", share: 0.5, wonPerKwh: 100 },
          { label: "b", share: 0.4, wonPerKwh: 100 },
        ],
      }),
    ).toThrow(/100%/));
  it("전비 0은 거부", () =>
    expect(() =>
      calcChargingCost({
        monthlyKm: 1000,
        kmPerKwh: 0,
        mix: [{ label: "a", share: 1, wonPerKwh: 1 }],
      }),
    ).toThrow(RangeError));
});
