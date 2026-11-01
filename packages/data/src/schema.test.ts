import { describe, expect, it } from "vitest";
import { validateSourcedValue, type SourcedValue } from "./schema";

const ok: SourcedValue = {
  value: 200,
  unit: "원/cc",
  source_name: "지방세법",
  source_url: "https://www.law.go.kr/",
  effective_date: "2026-01-01",
  checked_at: "2026-11-01",
  verified: true,
};

describe("validateSourcedValue", () => {
  it("모든 필드가 있으면 통과", () => expect(validateSourcedValue(ok)).toEqual([]));
  it("http 주소는 거부", () =>
    expect(validateSourcedValue({ ...ok, source_url: "http://example.com" })).toHaveLength(1));
  it("날짜 형식 오류", () =>
    expect(validateSourcedValue({ ...ok, checked_at: "2026/11/01" })[0]).toContain("checked_at"));
  it("verified 누락", () =>
    expect(validateSourcedValue({ ...ok, verified: undefined as unknown as boolean })[0]).toContain("verified"));
});
