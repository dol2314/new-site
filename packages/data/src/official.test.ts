/**
 * 확인된 법령값으로 엔진을 검증한다. 기대값은 법령 산식으로 손으로 계산한 값
 * (지방세법 제127조·제128조·제151조, 시행령 제122조·제125조, 국고금 관리법 제47조, 자동차관리법 시행령 별표 2).
 */
import { calcCarTax, calcEvSubsidy, calcInspectionPenalty, calcPrepay, inspectionWindow, penaltyForDays } from "@site/calc-core";
import { describe, expect, it } from "vitest";
import { carTaxData, evSubsidyData, inspectionData } from "./params";

const d26 = carTaxData(2026);
const d27 = carTaxData(2027);

describe("자동차세 데이터 확인 상태", () => {
  it("2026·2027 모두 확인 완료", () => {
    expect(d26.missing).toEqual([]);
    expect(d27.missing).toEqual([]);
  });
});

describe("자동차세 (법령값)", () => {
  it("1999cc 신차: 연 519,740원 (기분 199,900 + 교육세 59,970)", () => {
    // A = 1,999 × 200 = 399,800 → A/2 = 199,900 / 교육세 59,970 — 언론 보도 쏘나타 1999cc 예시와도 같음
    const r = calcCarTax({ fuelType: "gasoline", displacementCc: 1999, ageStartDate: "2026-03-02", taxYear: 2026 }, d26.tax);
    expect(r.halves.map((h) => h.total)).toEqual([259_870, 259_870]);
    expect(r.annualTotal).toBe(519_740);
  });
  it("배기량 경계: 1000cc는 80원, 1001cc는 140원", () => {
    expect(calcCarTax({ fuelType: "gasoline", displacementCc: 1000, ageStartDate: "2026-01-02", taxYear: 2026 }, d26.tax).baseAnnual).toBe(80_000);
    expect(calcCarTax({ fuelType: "gasoline", displacementCc: 1001, ageStartDate: "2026-01-02", taxYear: 2026 }, d26.tax).baseAnnual).toBe(140_140);
    expect(calcCarTax({ fuelType: "gasoline", displacementCc: 1601, ageStartDate: "2026-01-02", taxYear: 2026 }, d26.tax).baseAnnual).toBe(320_200);
  });
  it("차령 5년(15% 경감): 기분 169,915 → 169,910원, 교육세 50,973 → 50,970원", () => {
    const r = calcCarTax({ fuelType: "gasoline", displacementCc: 1999, ageStartDate: "2022-03-10", taxYear: 2026 }, d26.tax);
    expect(r.halves.map((h) => [h.carAge, h.carTax, h.educationTax])).toEqual([[5, 169_910, 50_970], [5, 169_910, 50_970]]);
  });
  it("7월 이후 기산: 기분별 차령이 달라 경감도 다름", () => {
    // 기산 2023-08-01, 2026년: 1기분 n=3(5%), 2기분 n=4(10%)
    const r = calcCarTax({ fuelType: "gasoline", displacementCc: 1999, ageStartDate: "2023-08-01", taxYear: 2026 }, d26.tax);
    expect(r.halves.map((h) => h.carTax)).toEqual([189_900, 179_910]); // 189,905 → 189,900 / 179,910
  });
  it("차령 12년 초과는 12년(50% 경감)", () => {
    const r = calcCarTax({ fuelType: "gasoline", displacementCc: 1999, ageStartDate: "2010-01-05", taxYear: 2026 }, d26.tax);
    expect(r.halves[0].carAge).toBe(17);
    expect(r.halves[0].carTax).toBe(99_950);
  });
  it("전기차: 연 10만원 + 교육세 3만원, 차령 경감 없음", () => {
    const r = calcCarTax({ fuelType: "electric", ageStartDate: "2015-01-05", taxYear: 2026 }, d26.tax);
    expect(r.annualTotal).toBe(130_000);
  });
});

describe("연납 공제 (법령값, 2027년)", () => {
  // 1999cc, 기산 2026-03-02 → 2027년 차령 2(경감 없음), 연 자동차세 399,800원
  const tax = calcCarTax({ fuelType: "gasoline", displacementCc: 1999, ageStartDate: "2026-03-02", taxYear: 2027 }, d27.tax);
  it("1월: 399,800 × 334/365 × 5% = 18,292.2 → 낼 자동차세 381,500, 교육세 114,450, 23,790원 절약", () => {
    const r = calcPrepay(tax, 1, 2027, d27.prepay);
    expect(r.coveredDays).toBe(334);
    expect(r.payTotal).toBe(495_950);
    expect(r.saving).toBe(23_790);
  });
  it("3월: 4/1~12/31 = 275일", () => expect(calcPrepay(tax, 3, 2027, d27.prepay).coveredDays).toBe(275));
  it("6월: 제2기분 199,900 × 5% = 9,995 → 공제 10,000원(끝수 처리)", () =>
    expect(calcPrepay(tax, 6, 2027, d27.prepay).carTaxDiscount).toBe(10_000));
  it("9월: 199,900 × 92/184 × 5% = 4,997.5 → 공제 5,000원", () => expect(calcPrepay(tax, 9, 2027, d27.prepay).carTaxDiscount).toBe(5_000));
});

describe("정기검사 (법령값)", () => {
  const ins = inspectionData();
  it("검사 기간: 만료일 전 90일 ~ 후 31일", () =>
    expect(inspectionWindow("2027-06-09", ins.params)).toEqual({ expiry: "2027-06-09", start: "2027-03-11", end: "2027-07-10" }));
  it("과태료 구간 (별표 2 소목)", () => {
    expect(penaltyForDays(1, ins.params)).toBe(40_000);
    expect(penaltyForDays(30, ins.params)).toBe(40_000);
    expect(penaltyForDays(33, ins.params)).toBe(40_000);
    expect(penaltyForDays(34, ins.params)).toBe(60_000);
    expect(penaltyForDays(114, ins.params)).toBe(580_000);
    expect(penaltyForDays(115, ins.params)).toBe(600_000);
    expect(penaltyForDays(400, ins.params)).toBe(600_000);
  });
  it("상한 도달: 지연 115일째", () =>
    expect(calcInspectionPenalty("2027-06-09", "2027-07-11", ins.params).capReachedOn).toBe("2027-11-02"));
  it("과태료 기능은 지연기간 기산일 확인 전까지 공개 불가", () => expect(ins.missing.penalty).toEqual(["rules.overdueCount"]));
  it("검사 기간 기능은 공개 가능", () => expect(ins.missing.window).toEqual([]));
});

describe("전기차 보조금 (제주 공공데이터 2026-09-17)", () => {
  it("차종 120개, 지역 데이터 기능은 확인 완료", () => {
    const d = evSubsidyData(2026);
    expect(d.models).toHaveLength(120);
    expect(d.missing.regionData).toEqual([]);
    expect(d.missing.nationwide).toEqual(["rules.nationalUniform"]);
    expect(d.missing.conversion).toEqual(["rules.conversionEligibility"]);
  });
  it("EV3 롱레인지 2WD 19인치, 제주: 국비 555만 + 도비 382만 = 937만원, 전환지원 포함 1,067만원", () => {
    const m = evSubsidyData(2026).models.find((x) => x.name === "EV3 롱레인지 2WD 19인치");
    expect(m).toBeDefined();
    expect(calcEvSubsidy({ model: m!, region: "jeju", conversion: false }).total).toBe(9_370_000);
    expect(calcEvSubsidy({ model: m!, region: "jeju", conversion: true }).total).toBe(10_670_000);
  });
  it("단종 표시는 이름에서 떼고 discontinued로", () => {
    const atto = evSubsidyData(2026).models.find((x) => x.name === "BYD ATTO 3");
    expect(atto?.discontinued).toBe(true);
  });
});
