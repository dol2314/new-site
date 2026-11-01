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

describe("추가지원 (가짜 규칙)", () => {
  const R = {
    lowIncomeRate: 0.1,
    youthFirstCarRate: 0.1,
    multiChildManwon: { "2": 10, "3": 20, "4": 30 },
    conversion: { maxManwon: 20, fullAtNationalManwon: 100 },
    bmsScrap: { manwon: 5, until: "2026-12-31" },
    localMinRatio: 0.3,
  };
  it("비율 추가지원 둘 + 다자녀 정액", () => {
    const r = calcEvSubsidy({ model: M, region: "a", conversion: false, lowIncome: true, youthFirstCar: true, children: 3 }, R);
    // 국비 100만 + 지방 50만 + 10만 + 10만 + 20만
    expect(r.total).toBe(1_900_000);
    expect([r.rateAdditions, r.multiChild]).toEqual([200_000, 200_000]);
  });
  it("자녀 5명은 4명 이상 구간", () => expect(calcEvSubsidy({ model: M, region: "a", conversion: false, children: 5 }, R).multiChild).toBe(300_000));
  it("자녀 1명은 없음", () => expect(calcEvSubsidy({ model: M, region: "a", conversion: false, children: 1 }, R).multiChild).toBe(0));
  it("추가지원 중 지방비 몫: 추가 × 지방/(국비+지방)", () => {
    const r = calcEvSubsidy({ model: M, region: "a", conversion: false, children: 3 }, R);
    expect(r.additionalLocalShare).toBe(Math.round((200_000 * 500_000) / 1_500_000));
  });
  it("BMS 기한 지나면 0", () => {
    expect(calcEvSubsidy({ model: M, region: "a", conversion: false, bmsScrap: true, appliedOn: "2026-12-31" }, R).bms).toBe(50_000);
    expect(calcEvSubsidy({ model: M, region: "a", conversion: false, bmsScrap: true, appliedOn: "2027-01-01" }, R).bms).toBe(0);
  });
  it("직접 입력 지방비가 최소 비율보다 적으면 표시", () =>
    expect(calcEvSubsidy({ model: M, region: null, userLocal: 20, conversion: false }, R).localBelowMinimum).toBe(true));
  it("전환지원 산식", async () => {
    const { expectedConversionNational } = await import("./evSubsidy");
    expect(expectedConversionNational(100, R.conversion)).toBe(20);
    expect(expectedConversionNational(55, R.conversion)).toBe(11);
  });
});
