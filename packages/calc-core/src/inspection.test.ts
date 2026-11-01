import { describe, expect, it } from "vitest";
import { calcInspectionPenalty, estimateExpiry, inspectionWindow, penaltyForDays } from "./inspection";
import { FAKE_INSPECTION } from "./fixtures.test-util";

// FAKE 매개변수: 만료일 ±10일, 1~20일 1,000원, 21일부터 5일마다 +500원, 상한 5,000원 (법령값 아님)
describe("inspectionWindow", () => {
  it("만료일 전후", () =>
    expect(inspectionWindow("2027-03-15", FAKE_INSPECTION)).toEqual({ expiry: "2027-03-15", start: "2027-03-05", end: "2027-03-25" }));
});

describe("penaltyForDays", () => {
  it("0일이면 0원", () => expect(penaltyForDays(0, FAKE_INSPECTION)).toBe(0));
  it("첫 구간 끝", () => expect(penaltyForDays(20, FAKE_INSPECTION)).toBe(1_000));
  it("둘째 구간 시작", () => expect(penaltyForDays(21, FAKE_INSPECTION)).toBe(1_000));
  it("5일 지나면 가산", () => expect(penaltyForDays(26, FAKE_INSPECTION)).toBe(1_500));
  it("상한", () => expect(penaltyForDays(1_000, FAKE_INSPECTION)).toBe(5_000));
});

describe("calcInspectionPenalty", () => {
  it("기간 전", () => expect(calcInspectionPenalty("2027-03-15", "2027-03-01", FAKE_INSPECTION).status).toBe("before-window"));
  it("기간 마지막 날은 과태료 없음", () => {
    const r = calcInspectionPenalty("2027-03-15", "2027-03-25", FAKE_INSPECTION);
    expect(r.status).toBe("in-window");
    expect(r.amountWon).toBe(0);
  });
  it("기간 끝난 다음 날 = 지연 1일", () => {
    const r = calcInspectionPenalty("2027-03-15", "2027-03-26", FAKE_INSPECTION);
    expect(r.daysOverdue).toBe(1);
    expect(r.amountWon).toBe(1_000);
  });
  it("상한 도달일: 21일 + 8단계(40일) = 지연 61일", () => {
    // 1,000 + 8×500 = 5,000 → 지연 21+40=61일째
    expect(calcInspectionPenalty("2027-03-15", "2027-03-26", FAKE_INSPECTION).capReachedOn).toBe("2027-05-25");
  });
});

describe("estimateExpiry", () => {
  const cycle = { firstAfterYears: 4, everyYears: 2 };
  it("첫 만료일", () => expect(estimateExpiry("2023-06-10", "2026-01-01", cycle, FAKE_INSPECTION)).toBe("2027-06-09"));
  it("첫 기간을 지나면 다음 주기", () => expect(estimateExpiry("2023-06-10", "2027-07-01", cycle, FAKE_INSPECTION)).toBe("2029-06-09"));
  it("기간 안이면 그 만료일", () => expect(estimateExpiry("2023-06-10", "2027-06-15", cycle, FAKE_INSPECTION)).toBe("2027-06-09"));
});
