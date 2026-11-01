/**
 * 전기승용차 구매보조금 = 국비 + 지방비 + 추가지원(차상위·청년 생애 첫 차 % → 다자녀 정액) + 전환지원 + BMS 폐차 재구매.
 * 금액은 데이터와 같이 만원 단위로 받고, 결과는 원 단위.
 * 규칙: 「2026년 전기자동차 보급사업」 보조금 업무처리지침(기후에너지환경부, 2026-06-23) 4-1-1·4-1-2.
 * - 추가지원은 중복 가능. 비율 추가지원을 먼저 계산하고 정액(다자녀)을 마지막에 더함.
 * - 추가지원금은 국비·지방비 비율대로 나눠 내지만 구매자가 받는 합계는 같음(지방비를 알면 나눈 몫도 보여 줌).
 * - 전환지원 국비는 차종별 데이터 값(지침 산식: 국비 500만원 이상 100만원, 미만이면 100 × 국비/500, 만원 반올림).
 */
import type { Breakdown } from "./carTax";
import { parseDate, type IsoDate } from "./dates";

export interface EvModel {
  id: string;
  maker: string;
  name: string;
  category: string;
  discontinued: boolean;
  /** 국비(만원) */
  national: number;
  /** 전환지원 국비(만원) */
  conversionNational: number;
  /** 지역 코드 → 지방비(만원). 확인된 지역만 */
  local: Record<string, number>;
  conversionLocal: Record<string, number>;
}

export interface EvSubsidyRules {
  lowIncomeRate: number;
  youthFirstCarRate: number;
  /** 자녀 수(2, 3, 4 이상) → 만원 */
  multiChildManwon: Record<string, number>;
  conversion: { maxManwon: number; fullAtNationalManwon: number };
  bmsScrap: { manwon: number; until: IsoDate };
  localMinRatio: number;
}

export interface EvSubsidyInput {
  model: EvModel;
  /** 데이터에 있는 지역 코드. 없으면 null */
  region: string | null;
  /** 데이터에 없는 지역: 공고에서 본 지방비(만원) */
  userLocal?: number | null;
  conversion: boolean;
  userConversionLocal?: number | null;
  lowIncome?: boolean;
  youthFirstCar?: boolean;
  /** 18세 이하 자녀 수 */
  children?: number;
  /** BMS 업데이트 불가 노후 전기차 폐차 후 재구매 */
  bmsScrap?: boolean;
  /** 지원 신청일(BMS 지원 기한 판단). 없으면 BMS는 기한 안으로 본다 */
  appliedOn?: IsoDate;
}

export interface EvSubsidyResult {
  national: number;
  local: number | null;
  localFrom: "data" | "user" | "none";
  /** 차상위·청년 등 비율 추가지원 합계 */
  rateAdditions: number;
  multiChild: number;
  conversionNational: number;
  conversionLocal: number | null;
  bms: number;
  total: number;
  /** 지방비를 알 때, 추가지원금 중 지방비가 나눠 내는 몫(참고) */
  additionalLocalShare: number | null;
  /** 지방비가 국비의 최소 비율보다 적게 입력됐는지 */
  localBelowMinimum: boolean;
  breakdown: Breakdown[];
}

const MANWON = 10_000;

function manwon(v: number | null | undefined, label: string): number | null {
  if (v === null || v === undefined) return null;
  if (!Number.isFinite(v) || v < 0) throw new RangeError(`${label}은 0 이상의 숫자`);
  return Math.round(v * MANWON);
}

/** 지침 산식으로 계산한 전환지원 국비(만원). 데이터 검증용 */
export function expectedConversionNational(nationalManwon: number, r: EvSubsidyRules["conversion"]): number {
  if (nationalManwon >= r.fullAtNationalManwon) return r.maxManwon;
  return Math.round((r.maxManwon * nationalManwon) / r.fullAtNationalManwon);
}

export function multiChildManwon(children: number, table: Record<string, number>): number {
  if (children < 2) return 0;
  const keys = Object.keys(table).map(Number).sort((a, b) => a - b);
  const key = keys.filter((k) => k <= children).pop();
  return key === undefined ? 0 : (table[String(key)] ?? 0);
}

export function calcEvSubsidy(input: EvSubsidyInput, rules?: EvSubsidyRules): EvSubsidyResult {
  const m = input.model;
  const national = m.national * MANWON;
  const dataLocal = input.region !== null ? m.local[input.region] : undefined;
  const local = dataLocal !== undefined ? dataLocal * MANWON : manwon(input.userLocal, "지방비");
  const localFrom: EvSubsidyResult["localFrom"] = dataLocal !== undefined ? "data" : local !== null ? "user" : "none";

  const breakdown: Breakdown[] = [{ label: "국비", value: national, rule: `${m.national}만원 (차종별)` }];
  breakdown.push({
    label: "지방비",
    value: local ?? 0,
    rule: localFrom === "data" ? "지역 공개 데이터" : localFrom === "user" ? "직접 입력한 공고 금액" : "입력 안 함 — 합계에서 빠짐",
  });

  let rateAdditions = 0;
  let multiChild = 0;
  let bms = 0;
  if (rules) {
    if (input.lowIncome) {
      const v = Math.round(national * rules.lowIncomeRate);
      rateAdditions += v;
      breakdown.push({ label: "차상위 이하 추가", value: v, rule: `국비 × ${rules.lowIncomeRate * 100}%` });
    }
    if (input.youthFirstCar) {
      const v = Math.round(national * rules.youthFirstCarRate);
      rateAdditions += v;
      breakdown.push({ label: "청년 생애 첫 차 추가", value: v, rule: `국비 × ${rules.youthFirstCarRate * 100}%` });
    }
    multiChild = multiChildManwon(input.children ?? 0, rules.multiChildManwon) * MANWON;
    if (multiChild > 0) breakdown.push({ label: "다자녀 추가", value: multiChild, rule: `자녀 ${input.children}명 정액 (비율 추가지원 뒤에 더함)` });
    if (input.bmsScrap) {
      const inTime = !input.appliedOn || parseDate(input.appliedOn) <= parseDate(rules.bmsScrap.until);
      bms = inTime ? rules.bmsScrap.manwon * MANWON : 0;
      breakdown.push({ label: "노후 전기차(BMS 미지원) 폐차 재구매", value: bms, rule: inTime ? `${rules.bmsScrap.manwon}만원` : `지원 기한(${rules.bmsScrap.until}) 지남` });
    }
  }

  const conversionNational = input.conversion ? m.conversionNational * MANWON : 0;
  let conversionLocal: number | null = 0;
  if (input.conversion) {
    const dataConv = input.region !== null ? m.conversionLocal[input.region] : undefined;
    conversionLocal = dataConv !== undefined ? dataConv * MANWON : manwon(input.userConversionLocal, "전환지원 지방비");
    breakdown.push({ label: "전환지원 국비", value: conversionNational, rule: `${m.conversionNational}만원 (차종별)` });
    breakdown.push({ label: "전환지원 지방비", value: conversionLocal ?? 0, rule: conversionLocal === null ? "입력 안 함 — 합계에서 빠짐" : "지역 값" });
  }

  const additional = rateAdditions + multiChild;
  const additionalLocalShare = local !== null && local > 0 && additional > 0 ? Math.round((additional * local) / (national + local)) : null;
  const localBelowMinimum = rules !== undefined && localFrom === "user" && local !== null && local < national * rules.localMinRatio;
  const total = national + (local ?? 0) + additional + conversionNational + (conversionLocal ?? 0) + bms;
  return { national, local, localFrom, rateAdditions, multiChild, conversionNational, conversionLocal, bms, total, additionalLocalShare, localBelowMinimum, breakdown };
}
