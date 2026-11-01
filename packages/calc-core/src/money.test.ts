import { describe, expect, it } from "vitest";
import { formatWon, roundTo, truncateTo } from "./money";

describe("truncateTo", () => {
  it("10원 미만 절사", () => expect(truncateTo(12_345, 10)).toBe(12_340));
  it("이미 단위에 맞으면 그대로", () => expect(truncateTo(12_340, 10)).toBe(12_340));
  it("음수는 0 쪽으로 절사", () => expect(truncateTo(-12_345, 10)).toBe(-12_340));
  it("단위가 0이면 오류", () => expect(() => truncateTo(1, 0)).toThrow(RangeError));
});

describe("roundTo", () => {
  it("0.5는 올림", () => expect(roundTo(12_345, 10)).toBe(12_350));
  it("미만은 내림", () => expect(roundTo(12_344, 10)).toBe(12_340));
  it("음수 대칭", () => expect(roundTo(-12_345, 10)).toBe(-12_350));
});

describe("formatWon", () => {
  it("천 단위 쉼표 + 원", () => expect(formatWon(1_234_567)).toBe("1,234,567원"));
  it("NaN이면 오류", () => expect(() => formatWon(Number.NaN)).toThrow(RangeError));
});
