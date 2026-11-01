import { describe, expect, it } from "vitest";
import { validateSourcedValue, type SourcedValue } from "./schema";

// 형식 검증용 예시 값(법령값 아님)
const ok: SourcedValue = {
  value: 123,
  unit: "원",
  source_name: "예시 출처",
  source_url: "https://www.law.go.kr/",
  effective_date: "2026-01-01",
  checked_at: "2026-11-01",
  verified: true,
};
const pending: SourcedValue = {
  value: null,
  unit: "원",
  source_name: "예시 출처",
  source_url: "https://www.law.go.kr/",
  effective_date: null,
  checked_at: null,
  verified: false,
  candidate: 100,
  candidate_source: "2차 자료",
};

describe("validateSourcedValue", () => {
  it("확인된 값 통과", () => expect(validateSourcedValue(ok)).toEqual([]));
  it("확인 전 값(null + 후보) 통과", () => expect(validateSourcedValue(pending)).toEqual([]));
  it("http 주소 거부", () => expect(validateSourcedValue({ ...ok, source_url: "http://example.com" })).toHaveLength(1));
  it("날짜 형식 오류", () => expect(validateSourcedValue({ ...ok, checked_at: "2026/11/01" })[0]).toContain("checked_at"));
  it("verified인데 value 없음", () => expect(validateSourcedValue({ ...ok, value: null }).join()).toContain("value 없음"));
  it("verified인데 후보값 남음", () => expect(validateSourcedValue({ ...ok, candidate: 1 }).join()).toContain("candidate"));
  it("verified 누락", () =>
    expect(validateSourcedValue({ ...ok, verified: undefined as unknown as boolean }).join()).toContain("verified"));
});
