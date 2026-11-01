import { describe, expect, it } from "vitest";
import { addDays, addYears, daysInYear, diffDays, parseDate } from "./dates";

describe("dates", () => {
  it("없는 날짜 거부", () => expect(() => parseDate("2026-02-30")).toThrow(RangeError));
  it("형식 오류 거부", () => expect(() => parseDate("2026/01/01")).toThrow(RangeError));
  it("월말 넘기기", () => expect(addDays("2026-01-31", 1)).toBe("2026-02-01"));
  it("윤년 2월", () => expect(addDays("2028-02-28", 1)).toBe("2028-02-29"));
  it("날짜 차이", () => expect(diffDays("2026-01-01", "2026-12-31")).toBe(364));
  it("2월 29일 + 1년 = 2월 28일", () => expect(addYears("2028-02-29", 1)).toBe("2029-02-28"));
  it("윤년 일수", () => {
    expect(daysInYear(2027)).toBe(365);
    expect(daysInYear(2028)).toBe(366);
    expect(daysInYear(2100)).toBe(365);
  });
});
