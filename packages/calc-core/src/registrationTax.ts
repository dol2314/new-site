/**
 * 비영업용 승용자동차 취득세 (개인 구입).
 * 법령값은 RegistrationTaxParams로 받는다 (packages/data/data/registration-tax/rules.json).
 *
 * 구조 (2026-11-01 국가법령정보센터 현행본 확인):
 * - 과세표준: 사실상취득가격(부가세 제외, 개인은 할부이자 제외). 신고가액이 시가표준액보다 적으면 시가표준액 (지방세법 제10조의5①2, 시행령 제18조)
 * - 50만원 이하 면세점 (지방세법 제17조)
 * - 세율: 승용 7%, 경자동차 4% (지방세법 제12조①2가)
 * - 감면 후보: 전기차·수소차 140만원 한도(지특법 제66조④⑤), 경형 75만원 한도(제67조①), 다자녀(제22조의2) — 취득일이 일몰 전이어야 함
 * - 감면은 가장 큰 것 하나만 (지특법 제180조). 면제 대상이라도 산출세액 200만원 초과면 85%만 감면, 제66조 등은 예외 (제177조의2)
 * - 지방교육세 없음(지방세법 제150조), 농어촌특별세 없음(농어촌특별세법 제4조제10호의2)
 * 범위 밖: 공채 매입, 번호판·등록 수수료, 장애인·국가유공자 감면, 영업용·승합·화물, 지자체 감면조례.
 */
import type { Breakdown } from "./carTax";
import { parseDate, type IsoDate } from "./dates";
import { truncateTo } from "./money";

export interface CapRelief {
  capWon: number;
  until: IsoDate;
}

export interface RegistrationTaxParams {
  rates: { passenger: number; compact: number };
  taxFreeThresholdWon: number;
  truncateUnit: number;
  evRelief: CapRelief;
  hydrogenRelief: CapRelief;
  compactRelief: CapRelief;
  multiChild: {
    until: IsoDate;
    threePlus: { vanExempt: boolean; otherPassengerCapWon: number };
    two: { vanRate: number; otherPassengerRate: number; otherPassengerThresholdWon: number; otherPassengerFixedWon: number };
  };
  minimumTax: { exemptOverWon: number; reliefRate: number };
}

export type Powertrain = "ice" | "hybrid" | "electric" | "hydrogen";

export interface RegistrationTaxInput {
  /** 사실상취득가격(원). vatIncluded면 부가세 포함 가격 */
  price: number;
  vatIncluded: boolean;
  /** 중고차 등: 시가표준액(원). 알면 넣는다 */
  standardValue?: number | null;
  compact: boolean;
  powertrain: Powertrain;
  /** 승차정원 7~10명 승용 */
  seats7to10: boolean;
  /** 18세 미만 자녀 수 (다자녀 감면 신청할 때만) */
  childrenUnder18: number;
  acquiredOn: IsoDate;
}

export interface Relief {
  id: "ev" | "hydrogen" | "compact" | "multi-child-3" | "multi-child-2";
  label: string;
  amount: number;
  rule: string;
  /** 최소납부세제로 85%만 감면됐는지 */
  minimumTaxApplied: boolean;
}

export interface RegistrationTaxResult {
  base: number;
  baseFrom: "price" | "standard-value";
  taxFree: boolean;
  rate: number;
  computedTax: number;
  /** 적용된 감면(가장 큰 것). 없으면 null */
  relief: Relief | null;
  /** 해당했지만 더 작아서 적용 안 된 감면들 */
  otherReliefs: Relief[];
  /** 일몰로 적용 안 된 감면 안내 */
  expired: { label: string; until: IsoDate }[];
  payable: number;
  breakdown: Breakdown[];
}

const within = (date: IsoDate, until: IsoDate) => parseDate(date) <= parseDate(until);

/** 140만원(cap) 이하면 면제, 넘으면 cap 공제 */
const capRelief = (tax: number, cap: number) => (tax <= cap ? tax : cap);

export function calcRegistrationTax(input: RegistrationTaxInput, p: RegistrationTaxParams): RegistrationTaxResult {
  if (!Number.isFinite(input.price) || input.price < 0) throw new RangeError("차량 가격은 0 이상");
  parseDate(input.acquiredOn);
  const breakdown: Breakdown[] = [];

  const price = input.vatIncluded ? Math.trunc((input.price * 10) / 11) : Math.trunc(input.price);
  if (input.vatIncluded) breakdown.push({ label: "부가세 뺀 가격", value: price, rule: `${input.price.toLocaleString("ko-KR")}원 × 10/11` });
  const sv = input.standardValue ?? null;
  const useStandard = sv !== null && sv > price;
  const base = useStandard ? sv : price;
  breakdown.push({ label: "과세표준", value: base, rule: useStandard ? "신고가액이 시가표준액보다 적어 시가표준액" : "사실상취득가격(부가세 제외)" });

  const rate = input.compact ? p.rates.compact : p.rates.passenger;
  const taxFree = base <= p.taxFreeThresholdWon;
  const computedTax = taxFree ? 0 : truncateTo(base * rate, p.truncateUnit);
  breakdown.push({
    label: "산출 취득세",
    value: computedTax,
    rule: taxFree ? `${p.taxFreeThresholdWon.toLocaleString("ko-KR")}원 이하 면세점` : `과세표준 × ${Math.round(rate * 1000) / 10}%`,
  });

  const candidates: Relief[] = [];
  const expired: { label: string; until: IsoDate }[] = [];
  const add = (r: Omit<Relief, "minimumTaxApplied">, minimumTaxExcepted: boolean) => {
    // 면제(전액 감면)인데 산출세액이 기준 초과면 85%만 (제66조 등 예외)
    const full = r.amount >= computedTax;
    if (full && !minimumTaxExcepted && computedTax > p.minimumTax.exemptOverWon) {
      candidates.push({ ...r, amount: truncateTo(computedTax * p.minimumTax.reliefRate, p.truncateUnit), rule: `${r.rule} → 산출세액 ${p.minimumTax.exemptOverWon.toLocaleString("ko-KR")}원 초과라 ${p.minimumTax.reliefRate * 100}%만 감면`, minimumTaxApplied: true });
    } else {
      candidates.push({ ...r, minimumTaxApplied: false });
    }
  };

  if (computedTax > 0) {
    if (input.powertrain === "electric") {
      if (within(input.acquiredOn, p.evRelief.until)) add({ id: "ev", label: "전기자동차 감면", amount: capRelief(computedTax, p.evRelief.capWon), rule: `${p.evRelief.capWon.toLocaleString("ko-KR")}원 한도` }, true);
      else expired.push({ label: "전기자동차 감면", until: p.evRelief.until });
    }
    if (input.powertrain === "hydrogen") {
      if (within(input.acquiredOn, p.hydrogenRelief.until)) add({ id: "hydrogen", label: "수소전기자동차 감면", amount: capRelief(computedTax, p.hydrogenRelief.capWon), rule: `${p.hydrogenRelief.capWon.toLocaleString("ko-KR")}원 한도` }, true);
      else expired.push({ label: "수소전기자동차 감면", until: p.hydrogenRelief.until });
    }
    if (input.compact) {
      if (within(input.acquiredOn, p.compactRelief.until)) add({ id: "compact", label: "경형자동차 감면", amount: capRelief(computedTax, p.compactRelief.capWon), rule: `${p.compactRelief.capWon.toLocaleString("ko-KR")}원 한도` }, false);
      else expired.push({ label: "경형자동차 감면", until: p.compactRelief.until });
    }
    if (input.childrenUnder18 >= 2) {
      const mc = p.multiChild;
      if (!within(input.acquiredOn, mc.until)) expired.push({ label: "다자녀 감면", until: mc.until });
      else if (input.childrenUnder18 >= 3) {
        if (input.seats7to10) add({ id: "multi-child-3", label: "다자녀(3명 이상) 감면", amount: computedTax, rule: "7~10인승 승용 면제" }, false);
        else add({ id: "multi-child-3", label: "다자녀(3명 이상) 감면", amount: capRelief(computedTax, mc.threePlus.otherPassengerCapWon), rule: `${mc.threePlus.otherPassengerCapWon.toLocaleString("ko-KR")}원 한도` }, false);
      } else if (input.seats7to10) {
        add({ id: "multi-child-2", label: "다자녀(2명) 감면", amount: truncateTo(computedTax * mc.two.vanRate, p.truncateUnit), rule: "7~10인승 승용 50% 경감" }, false);
      } else {
        const amount = computedTax <= mc.two.otherPassengerThresholdWon ? truncateTo(computedTax * mc.two.otherPassengerRate, p.truncateUnit) : mc.two.otherPassengerFixedWon;
        add({ id: "multi-child-2", label: "다자녀(2명) 감면", amount, rule: computedTax <= mc.two.otherPassengerThresholdWon ? "50% 경감" : `${mc.two.otherPassengerFixedWon.toLocaleString("ko-KR")}원 공제` }, false);
      }
    }
  }

  candidates.sort((a, b) => b.amount - a.amount);
  const relief = candidates[0] ?? null;
  const payable = truncateTo(computedTax - (relief?.amount ?? 0), p.truncateUnit);
  if (relief) breakdown.push({ label: relief.label, value: -relief.amount, rule: relief.rule });
  breakdown.push({ label: "낼 취득세", value: payable, rule: "지방교육세·농어촌특별세 없음" });
  return { base, baseFrom: useStandard ? "standard-value" : "price", taxFree, rate, computedTax, relief, otherReliefs: candidates.slice(1), expired, payable, breakdown };
}
