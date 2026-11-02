/**
 * 확인된 법령값으로 엔진을 검증한다. 기대값은 법령 산식으로 손으로 계산한 값
 * (지방세법 제127조·제128조·제151조, 시행령 제122조·제125조, 국고금 관리법 제47조, 자동차관리법 시행령 별표 2).
 */
import { ageStartDate, splitInstallments, calcCarTax, calcLoan, depositInterestWhilePaying, calcNewRegistrationTax, calcOwnershipCost, calcChargingCost, tierForKw, calcTransferProrate, calcEvSubsidy, calcRegistrationTax, expectedConversionNational, calcInspectionPenalty, calcPrepay, inspectionWindow, penaltyForDays } from "@site/calc-core";
import { describe, expect, it } from "vitest";
import { carTaxData, carTaxProrateData, evChargingData, ownershipData, evSubsidyData, inspectionData, registrationTaxData } from "./params";

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

describe("연납 사례 글 숫자 (2027년, 1,999cc 휘발유 2025-03 등록)", () => {
  const d = carTaxData(2027);
  const t = calcCarTax({ fuelType: "gasoline", displacementCc: 1999, ageStartDate: "2025-03-10", taxYear: 2027 }, d.tax);
  it("연납 규칙 출처 확인 완료", () => expect(d.missing).toEqual([]));
  it("차령 3년 5% 경감: 반기 199,900 − 9,995 = 189,905 → 189,900원, 1년 고지 493,740원", () =>
    expect([t.halves[0].carTax, t.carTax, t.annualTotal]).toEqual([189_900, 379_800, 493_740]));
  it("1월 연납: 379,800 × 334/365 × 5% 공제 → 자동차세 362,420 + 교육세 108,720 = 471,140원, 22,600원 절약 (글 제목 숫자)", () => {
    const r = calcPrepay(t, 1, 2027, d.prepay);
    expect([r.coveredDays, r.payTotal, r.saving]).toEqual([334, 471_140, 22_600]);
  });
  it("3·6·9월 절약액 18,610 · 12,350 · 6,180원", () =>
    expect([3, 6, 9].map((m) => calcPrepay(t, m, 2027, d.prepay).saving)).toEqual([18_610, 12_350, 6_180]));
});

describe("이전 일할계산 (법령값, 2027년)", () => {
  const d = carTaxData(2027);
  const pr = carTaxProrateData(2027);
  it("확인 전 항목은 이전일 당일 귀속 규칙 하나뿐", () => expect(pr.missing).toEqual(["rules.prorateDayBoundary"]));
  it("2천원 미만 미징수, 차령 3년 이상은 기분 기준 (제130조제4항, 시행령 제126조)", () =>
    expect([pr.params.minCollectWon, pr.params.halfBasisMinAge]).toEqual([2_000, 3]));
  // 아래는 후보값(이전일 당일 = 양수인)으로 계산한 사례 글 숫자. 규칙 확인 후 기대값을 다시 본다.
  const t = calcCarTax({ fuelType: "gasoline", displacementCc: 1999, ageStartDate: "2025-03-10", taxYear: 2027 }, d.tax);
  it("[후보값] 4/15 이전등록: 189,900 × 104/181 → 109,110 + 32,730 / 189,900 × 77/181 → 80,780 + 24,230", () => {
    const r = calcTransferProrate(t, "2027-04-15", 2027, pr.previewParams);
    expect([r.seller.days, r.seller.total, r.buyer.days, r.buyer.total]).toEqual([104, 141_840, 77, 105_010]);
  });
  it("[후보값] 998cc를 1/10에 넘기면 판 사람 몫 1,880원 < 2천원 → 0원", () => {
    const k = calcCarTax({ fuelType: "gasoline", displacementCc: 998, ageStartDate: "2025-03-10", taxYear: 2027 }, d.tax);
    const r = calcTransferProrate(k, "2027-01-10", 2027, pr.previewParams);
    expect([r.seller.days, r.seller.carTax, r.seller.waived]).toEqual([9, 0, true]);
  });
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
    expect(d.missing.nationwide).toEqual([]);
    expect(d.missing.conversion).toEqual([]);
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

describe("취득세 (법령값)", () => {
  const { params: p, missing } = registrationTaxData();
  const base = { vatIncluded: true, compact: false, powertrain: "ice" as const, seats7to10: false, childrenUnder18: 0, acquiredOn: "2026-11-01" };
  it("확인 완료", () => expect(missing).toEqual([]));
  it("부가세 포함 2,500만원 승용: 22,727,272 × 7% = 1,590,909 → 1,590,900원", () =>
    expect(calcRegistrationTax({ ...base, price: 25_000_000 }, p).payable).toBe(1_590_900));
  it("전기차 부가세 포함 4,500만원: 산출 2,863,630원 − 140만 = 1,463,630원 (2026년 취득)", () => {
    const r = calcRegistrationTax({ ...base, price: 45_000_000, powertrain: "electric" }, p);
    expect([r.computedTax, r.payable]).toEqual([2_863_630, 1_463_630]);
  });
  it("같은 전기차를 2027-01-02에 취득하면 현행법상 감면 없음", () => {
    const r = calcRegistrationTax({ ...base, price: 45_000_000, powertrain: "electric", acquiredOn: "2027-01-02" }, p);
    expect(r.payable).toBe(2_863_630);
    expect(r.expired[0]?.until).toBe("2026-12-31");
  });
  it("경차 부가세 포함 1,500만원: 13,636,363 × 4% = 545,450원 ≤ 75만 → 0원", () =>
    expect(calcRegistrationTax({ ...base, price: 15_000_000, compact: true }, p).payable).toBe(0));
  it("자녀 3명, 7인승 4,000만원(부가세 포함): 산출 2,545,450원 > 200만 → 85% 감면, 381,820원", () => {
    const r = calcRegistrationTax({ ...base, price: 40_000_000, seats7to10: true, childrenUnder18: 3 }, p);
    // 2,545,454 → 2,545,450 / 감면 2,545,450 × 0.85 = 2,163,632.5 → 2,163,630 / 낼 세액 381,820
    expect([r.computedTax, r.relief?.amount, r.payable]).toEqual([2_545_450, 2_163_630, 381_820]);
  });
  it("경형 전기차 2,800만원(부가세 포함): 산출 1,018,180원 — 2026년 전기차 감면 0원, 2027년 경차 감면(75만)만 남아 268,180원", () => {
    const c = { ...base, price: 28_000_000, compact: true, powertrain: "electric" as const };
    const d = calcRegistrationTax({ ...c, acquiredOn: "2026-12-20" }, p);
    const j = calcRegistrationTax({ ...c, acquiredOn: "2027-01-05" }, p);
    expect([d.computedTax, d.payable, j.payable]).toEqual([1_018_180, 0, 268_180]);
  });
  it("수소전기차 7,000만원(부가세 포함): 산출 4,454,540원 − 140만 = 3,054,540원, 2027년에도 같음", () => {
    const h = { ...base, price: 70_000_000, powertrain: "hydrogen" as const };
    const d = calcRegistrationTax({ ...h, acquiredOn: "2026-12-20" }, p);
    const j = calcRegistrationTax({ ...h, acquiredOn: "2027-01-05" }, p);
    expect([d.computedTax, d.payable, j.payable]).toEqual([4_454_540, 3_054_540, 3_054_540]);
  });
  it("면세점: 50만원 이하 0원", () => expect(calcRegistrationTax({ ...base, price: 500_000, vatIncluded: false }, p).payable).toBe(0));
});

describe("보조금 지침 (2026-06-23) 규칙", () => {
  const d = evSubsidyData(2026);
  const fake = (national: number) => ({ id: "x", maker: "x", name: "x", category: "일반승용", discontinued: false, national, conversionNational: 0, local: {}, conversionLocal: {} });
  it("지침 계산 예시: 국비 500만원, 차상위 + 자녀 3명 → 500 + 500×20% + 200 = 800만원", () => {
    const r = calcEvSubsidy({ model: fake(500), region: null, conversion: false, lowIncome: true, children: 3 }, d.rules);
    expect(r.total).toBe(8_000_000);
  });
  it("지침 계산 예시: 청년 생애 첫 차 추가 100만원, 지방비가 국비의 30%면 지방비 몫 100×30/130 ≈ 23만원", () => {
    const r = calcEvSubsidy({ model: fake(500), region: null, userLocal: 150, conversion: false, youthFirstCar: true }, d.rules);
    expect(r.rateAdditions).toBe(1_000_000);
    expect(Math.round((r.additionalLocalShare ?? 0) / 10_000)).toBe(23);
  });
  it("차종 120개 모두 전환지원 국비가 지침 산식과 일치", () => {
    const bad = d.models.filter((m) => m.conversionNational !== expectedConversionNational(m.national, d.rules.conversion));
    expect(bad.map((m) => `${m.name}: ${m.national} → ${m.conversionNational}`)).toEqual([]);
  });
  it("모든 차종의 제주 지방비가 국비의 30% 이상", () => {
    const low = d.models.filter((m) => (m.local.jeju ?? 0) < m.national * d.rules.localMinRatio);
    expect(low.map((m) => m.name)).toEqual([]);
  });
});

describe("전기차 공공 충전요금 (기후에너지환경부, 2026-08-01 시행)", () => {
  const c = evChargingData();
  it("확인 완료", () => expect(c.missing).toEqual([]));
  it("5단계: 7kW 295.0 · 50kW 325.6 · 100kW 348.4 · 350kW 393.1원/kWh", () =>
    expect([7, 30, 50, 100, 199, 200, 350].map((kw) => tierForKw(kw, c.publicTiers).wonPerKwh)).toEqual([295, 307.2, 325.6, 348.4, 348.4, 393.1, 393.1]));
  it("개편 폭: 완속 324.4 → 295.0 (−29.4원), 초급속 347.2 → 393.1 (+45.9원) — 보도자료 숫자와 일치", () => {
    expect(Math.round((324.4 - tierForKw(7, c.publicTiers).wonPerKwh) * 10) / 10).toBe(29.4);
    expect(Math.round((tierForKw(350, c.publicTiers).wonPerKwh - 347.2) * 10) / 10).toBe(45.9);
  });
  it("사례 글 4편: 300kWh × 100~200kW 348.4원 = 104,520원, 완속 80% + 초급속 20% = 70,800 + 23,586 = 94,386원", () => {
    const f = calcChargingCost({ monthlyKm: 1500, kmPerKwh: 5, mix: [{ label: "x", share: 1, wonPerKwh: tierForKw(100, c.publicTiers).wonPerKwh }] });
    const m = calcChargingCost({
      monthlyKm: 1500,
      kmPerKwh: 5,
      mix: [
        { label: "완속", share: 0.8, wonPerKwh: tierForKw(7, c.publicTiers).wonPerKwh },
        { label: "초급속", share: 0.2, wonPerKwh: tierForKw(350, c.publicTiers).wonPerKwh },
      ],
    });
    expect([f.kwh, f.monthlyCost, m.monthlyCost]).toEqual([300, 104_520, 94_386]);
  });
  it("월 1,500km · 5km/kWh: 완속만 88,500원, 200kW 이상만 117,930원", () => {
    const run = (kw: number) => calcChargingCost({ monthlyKm: 1500, kmPerKwh: 5, mix: [{ label: "x", share: 1, wonPerKwh: tierForKw(kw, c.publicTiers).wonPerKwh }] }).monthlyCost;
    expect([run(7), run(350)]).toEqual([88_500, 117_930]);
  });
});

describe("신규등록 일할계산·5년 비용 (2027년 세율)", () => {
  const o = ownershipData();
  const nr = { ...o.newRegistration, educationTaxRate: 0.3, truncateUnit: 10 };
  it("확인 완료, 마지막 데이터 연도 2027", () => expect([o.missing, o.latestYear]).toEqual([[], 2027]));
  it("전기차 2027-01-05 등록: 100,000 × 177/365 = 48,493 → 48,490 + 14,540, 2기분 65,000 → 그해 128,030원", () => {
    const t = calcCarTax({ fuelType: "electric", ageStartDate: "2027-01-05", taxYear: 2027 }, o.carTaxByYear[2027]!);
    const r = calcNewRegistrationTax(t, "2027-01-05", nr);
    expect([r.days, r.carTax, r.educationTax, r.yearTotal]).toEqual([177, 48_490, 14_540, 128_030]);
  });
  it("1,598cc 휘발유 2027-01-05 등록, 5개 연도 자동차세: 그해 일할 + 2028(차령 2) 경감 없음 + 2029 5% + 2030 10% + 2031 15%", () => {
    const r = calcOwnershipCost({
      start: "2027-01-05",
      years: 5,
      purchase: 0,
      fuelType: "gasoline",
      displacementCc: 1598,
      carTaxParamsFor: (y) => o.carTaxByYear[Math.min(y, o.latestYear)]!,
      newRegistration: o.newRegistration,
      annualEnergy: 0,
      annualInsurance: 0,
    });
    // 연세액 1,598 × 140 = 223,720 / 첫해 223,720 × 177/365 = 108,488 → 108,480 + 32,540 = 141,020, 2기분 111,860 + 33,550 = 145,410
    // 2029 5%: 106,267 → 106,260 + 31,870 = 138,130 × 2 / 2030 10%: 100,670 + 30,200 / 2031 15%: 95,080 + 28,520
    expect(r.rows.map((x) => x.carTax)).toEqual([286_430, 290_820, 276_260, 261_740, 247_200]);
  });
});

describe("사례 글 5편 숫자: 전기차 vs 휘발유차 5개 연도 (2027-01-04 등록, 1년 15,000km)", () => {
  const o = ownershipData();
  const c = evChargingData();
  const { params: rp } = registrationTaxData();
  const regIn = (price: number, powertrain: "electric" | "ice") => ({ price, vatIncluded: true, compact: false, powertrain, seats7to10: false, childrenUnder18: 0, acquiredOn: "2027-01-04" });
  const common = { start: "2027-01-04", years: 5, carTaxParamsFor: (y: number) => o.carTaxByYear[Math.min(y, o.latestYear)]!, newRegistration: o.newRegistration, annualInsurance: 0 };
  it("전기차 43,929,736원 vs 휘발유차 43,879,884원 (공공 완속 295원, 연비 12km/L·1,700원 가정)", () => {
    const evReal = 45_000_000 - 9_000_000 + calcRegistrationTax(regIn(45_000_000, "electric"), rp).payable;
    const iceReal = 30_000_000 + calcRegistrationTax(regIn(30_000_000, "ice"), rp).payable;
    const ev = calcOwnershipCost({ ...common, purchase: evReal, fuelType: "electric", annualEnergy: (15_000 / 5) * tierForKw(7, c.publicTiers).wonPerKwh });
    const ice = calcOwnershipCost({ ...common, purchase: iceReal, fuelType: "gasoline", displacementCc: 1598, annualEnergy: (15_000 / 12) * 1_700 });
    expect([evReal, iceReal, ev.totals.carTax, ice.totals.carTax, ev.totals.all, ice.totals.all]).toEqual([38_863_630, 31_909_090, 648_380, 1_363_260, 43_929_736, 43_879_884]);
  });
});

describe("사례 글 6~8편 숫자", () => {
  const t = carTaxData(2027).tax;
  const { params: rp } = registrationTaxData();
  const c = evChargingData();
  it("6편: 전기차 1년 130,000원, 998cc 새 차 103,780원, 1,353cc는 차령 12년에 123,100원", () => {
    const y = (cc: number | undefined, age: number, f: "gasoline" | "electric" = "gasoline") =>
      calcCarTax({ fuelType: f, displacementCc: cc, ageStartDate: `${2027 - age + 1}-03-01`, taxYear: 2027 }, t).annualTotal;
    expect([y(undefined, 1, "electric"), y(998, 1), y(1353, 11), y(1353, 12)]).toEqual([130_000, 103_780, 135_420, 123_100]);
  });
  it("7편: 경차 2,062만원까지 0원(산출 749,810원), 2,063만원부터 과세, 1,800만원 일반 승용은 1,145,450원", () => {
    const tx = (price: number, compact = true) =>
      calcRegistrationTax({ price, vatIncluded: true, compact, powertrain: "ice", seats7to10: false, childrenUnder18: 0, acquiredOn: "2027-03-15" }, rp);
    expect([tx(20_620_000).computedTax, tx(20_620_000).payable, tx(20_630_000).payable > 0, tx(18_000_000, false).payable]).toEqual([749_810, 0, true, 1_145_450]);
  });
  it("8편: 개편 전 100kW 미만 324.4 / 이상 347.2원, 1,000km·6km/kWh 완속만 한 달 −4,900원", () => {
    const run = (tiers: typeof c.publicTiers) =>
      calcChargingCost({ monthlyKm: 1000, kmPerKwh: 6, mix: [{ label: "x", share: 1, wonPerKwh: tierForKw(7, tiers).wonPerKwh }] }).monthlyCost;
    expect([tierForKw(50, c.publicTiersBefore).wonPerKwh, tierForKw(100, c.publicTiersBefore).wonPerKwh, run(c.publicTiers) - run(c.publicTiersBefore)]).toEqual([324.4, 347.2, -4_900]);
  });
});

describe("사례 글 9~11편 숫자", () => {
  const { params: rp } = registrationTaxData();
  const ev = evSubsidyData(2026);
  it("9편: 세 자녀 7인승 4,000만원 381,820원, 5인승 1,145,450원, 두 자녀 7인승 1,272,730원, 3,142만원까지 0원", () => {
    const tx = (o: { price?: number; seats7to10?: boolean; childrenUnder18?: number }) =>
      calcRegistrationTax({ price: 40_000_000, vatIncluded: true, compact: false, powertrain: "ice", seats7to10: true, childrenUnder18: 3, acquiredOn: "2027-04-01", ...o }, rp).payable;
    expect([tx({}), tx({ seats7to10: false }), tx({ childrenUnder18: 2 }), tx({ price: 31_420_000 }), tx({ price: 31_430_000 })]).toEqual([381_820, 1_145_450, 1_272_730, 0, 300_020]);
  });
  it("10편: 국비 500만원 차, 청년 첫 차 + 자녀 2명 = 700만원, 차상위 + 전환지원 = 700만원", () => {
    const model = { id: "x", maker: "x", name: "x", category: "승용", discontinued: false, national: 500, conversionNational: 100, local: {}, conversionLocal: {} };
    const run = (o: object) => calcEvSubsidy({ model, region: null, conversion: false, ...o }, ev.rules).total;
    expect([run({ youthFirstCar: true, children: 2 }), run({ lowIncome: true, conversion: true })]).toEqual([7_000_000, 7_000_000]);
  });
  it("11편: 3,000만원 연 6% 36개월 원리금균등 월 912,658원, 총이자 2,855,692원, 예금 3% 이자 1,270,291원", () => {
    const l = calcLoan({ principal: 30_000_000, annualRate: 0.06, months: 36, method: "equal-payment" });
    expect([l.firstPayment, l.totalInterest, depositInterestWhilePaying(l, 30_000_000, 0.03)]).toEqual([912_658, 2_855_692, 1_270_291]);
  });
});

describe("사례 글 12~14편 숫자", () => {
  const t = carTaxData(2027).tax;
  const o = ownershipData();
  const tax = (start: string, year = 2027) => calcCarTax({ fuelType: "gasoline", displacementCc: 1999, ageStartDate: start, taxYear: year }, o.carTaxByYear[Math.min(year, o.latestYear)]!).annualTotal;
  it("12편: 2022년 3월 등록 415,780원 vs 9월 등록 428,770원, 해 넘긴 재고차 2028년 506,740원", () =>
    expect([tax("2022-03-10"), tax("2022-09-10"), tax(ageStartDate("2027-01-15", 2026), 2028), tax("2015-03-10")]).toEqual([415_780, 428_770, 506_740, 259_860]));
  it("13편: 1,999cc 2027-03-02 등록 그해 432,150원, 7-01 등록 262,000원, 전기차 12-31 등록 0원(2천원 미만)", () => {
    const nr = { ...o.newRegistration, educationTaxRate: t.educationTaxRate, truncateUnit: t.truncateUnit };
    const first = (reg: string, f: "gasoline" | "electric" = "gasoline") =>
      calcNewRegistrationTax(calcCarTax({ fuelType: f, displacementCc: f === "electric" ? undefined : 1999, ageStartDate: reg, taxYear: 2027 }, t), reg, nr);
    expect([first("2027-03-02").yearTotal, first("2027-07-01").yearTotal, first("2027-12-31", "electric").yearTotal]).toEqual([432_150, 262_000, 0]);
  });
  it("14편: 4,000만원 연 6% 36개월 40% 유예 — 월 810,126원, 마지막 16,810,147원, 원리금균등보다 이자 1,356,966원 더", () => {
    const b = calcLoan({ principal: 40_000_000, annualRate: 0.06, months: 36, method: "balloon", balloonRate: 0.4 });
    const e = calcLoan({ principal: 40_000_000, annualRate: 0.06, months: 36, method: "equal-payment" });
    expect([b.firstPayment, b.lastPayment, b.totalInterest - e.totalInterest]).toEqual([810_126, 16_810_147, 1_356_966]);
  });
});

describe("사례 글 15~17편 숫자", () => {
  const t = carTaxData(2027).tax;
  const { params: rp } = registrationTaxData();
  it("15편: 2,497cc 2022-04 등록 2027년 분할납부 합계 = 1년 세금, 1월 연납 공제 > 0", () => {
    const x = calcCarTax({ fuelType: "gasoline", displacementCc: 2497, ageStartDate: "2022-04-20", taxYear: 2027 }, t);
    const sp = splitInstallments(x, t.educationTaxRate, t.truncateUnit);
    expect([x.halves[0].carAge, x.halves[0].reductionRate, sp.total]).toEqual([6, 0.2, x.annualTotal]);
    expect(sp.march + sp.june).toBe(x.halves[0].total);
  });
  it("16편: 시가표준액 1,300만원 차 — 1,500만원 거래 1,050,000원, 1,000만원 신고 910,000원, 30만원 거래·시가표준액 80만원 56,000원", () => {
    const u = (price: number, sv: number | null) =>
      calcRegistrationTax({ price, vatIncluded: false, standardValue: sv, compact: false, powertrain: "ice", seats7to10: false, childrenUnder18: 0, acquiredOn: "2027-02-15" }, rp).payable;
    expect([u(15_000_000, 13_000_000), u(10_000_000, 13_000_000), u(300_000, 800_000), u(300_000, 400_000)]).toEqual([1_050_000, 910_000, 56_000, 0]);
  });
  it("17편: 3,500만원 연 7% 48개월 — 선수금 10% 늘리면 이자 감소 > 같은 돈 예금(3%) 이자", () => {
    const l = (p: number) => calcLoan({ principal: p, annualRate: 0.07, months: 48, method: "equal-payment" });
    const save = l(35_000_000).totalInterest - l(31_500_000).totalInterest;
    const dep = depositInterestWhilePaying(l(3_500_000), 3_500_000, 0.03);
    expect(save).toBeGreaterThan(dep);
  });
});
