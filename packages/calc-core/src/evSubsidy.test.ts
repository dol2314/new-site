import { describe, expect, it } from "vitest";
import { calcEvSubsidy, type EvModel } from "./evSubsidy";

// 가짜 차종(법령·공고 값 아님) — 합산·단위·입력 처리만 검증
const M: EvModel = {
  id: "X|테스트",
  maker: "X",
  name: "테스트",
  category: "일반승용",
  discontinued: false,
  national: 100,
  conversionNational: 20,
  local: { a: 50 },
  conversionLocal: { a: 5 },
};

describe("calcEvSubsidy", () => {
  it("데이터 지역: 국비 + 지방비, 만원 → 원", () => {
    const r = calcEvSubsidy({ model: M, region: "a", conversion: false });
    expect([r.national, r.local, r.total, r.localFrom]).toEqual([1_000_000, 500_000, 1_500_000, "data"]);
  });
  it("전환지원 포함", () => expect(calcEvSubsidy({ model: M, region: "a", conversion: true }).total).toBe(1_750_000));
  it("데이터 없는 지역 + 직접 입력", () => {
    const r = calcEvSubsidy({ model: M, region: null, userLocal: 30, conversion: true, userConversionLocal: 3 });
    expect([r.local, r.localFrom, r.conversionLocal, r.total]).toEqual([300_000, "user", 30_000, 1_530_000]);
  });
  it("지방비 입력 안 하면 국비만", () => {
    const r = calcEvSubsidy({ model: M, region: null, conversion: false });
    expect([r.local, r.localFrom, r.total]).toEqual([null, "none", 1_000_000]);
  });
  it("데이터 지역이 있으면 직접 입력보다 데이터 우선", () =>
    expect(calcEvSubsidy({ model: M, region: "a", userLocal: 999, conversion: false }).local).toBe(500_000));
  it("음수 입력 거부", () => expect(() => calcEvSubsidy({ model: M, region: null, userLocal: -1, conversion: false })).toThrow(RangeError));
});
