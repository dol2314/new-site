/**
 * 전기승용차 구매보조금 합계 = 국비 + 지방비 (+ 전환지원 국비·지방비).
 * 금액은 데이터와 같이 만원 단위로 받고, 결과는 원 단위로 돌려준다.
 * 국비·지방비 값은 packages/data/data/ev-subsidy/{연도}.json (출처·기준일 포함)에서 온다.
 */
import type { Breakdown } from "./carTax";

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
  /** 지역 코드 → 지방비(만원). 확인된 지역만 들어 있다 */
  local: Record<string, number>;
  conversionLocal: Record<string, number>;
}

export interface EvSubsidyInput {
  model: EvModel;
  /** 데이터에 있는 지역 코드. 없으면 null */
  region: string | null;
  /** 데이터에 없는 지역일 때 사용자가 공고에서 보고 넣은 지방비(만원) */
  userLocal?: number | null;
  /** 전환지원금 대상(공고 조건 충족)으로 계산할지 */
  conversion: boolean;
  /** 데이터에 없는 지역일 때 사용자가 넣은 전환지원 지방비(만원) */
  userConversionLocal?: number | null;
}

export interface EvSubsidyResult {
  national: number;
  local: number | null;
  localFrom: "data" | "user" | "none";
  conversionNational: number;
  conversionLocal: number | null;
  total: number;
  breakdown: Breakdown[];
}

const MANWON = 10_000;

function manwon(v: number | null | undefined, label: string): number | null {
  if (v === null || v === undefined) return null;
  if (!Number.isFinite(v) || v < 0) throw new RangeError(`${label}은 0 이상의 숫자`);
  return Math.round(v * MANWON);
}

export function calcEvSubsidy(input: EvSubsidyInput): EvSubsidyResult {
  const m = input.model;
  const national = m.national * MANWON;
  const dataLocal = input.region !== null ? m.local[input.region] : undefined;
  const local = dataLocal !== undefined ? dataLocal * MANWON : manwon(input.userLocal, "지방비");
  const localFrom: EvSubsidyResult["localFrom"] = dataLocal !== undefined ? "data" : local !== null ? "user" : "none";

  const conversionNational = input.conversion ? m.conversionNational * MANWON : 0;
  let conversionLocal: number | null = 0;
  if (input.conversion) {
    const dataConv = input.region !== null ? m.conversionLocal[input.region] : undefined;
    conversionLocal = dataConv !== undefined ? dataConv * MANWON : manwon(input.userConversionLocal, "전환지원 지방비");
  }

  const total = national + (local ?? 0) + conversionNational + (conversionLocal ?? 0);
  const breakdown: Breakdown[] = [
    { label: "국비", value: national, rule: `${m.national}만원 (차종별)` },
    {
      label: "지방비",
      value: local ?? 0,
      rule: localFrom === "data" ? "지역 공개 데이터" : localFrom === "user" ? "직접 입력한 공고 금액" : "입력 안 함 — 합계에서 빠짐",
    },
  ];
  if (input.conversion) {
    breakdown.push({ label: "전환지원 국비", value: conversionNational, rule: `${m.conversionNational}만원 (차종별)` });
    breakdown.push({ label: "전환지원 지방비", value: conversionLocal ?? 0, rule: conversionLocal === null ? "입력 안 함 — 합계에서 빠짐" : "지역 값" });
  }
  return { national, local, localFrom, conversionNational, conversionLocal, total, breakdown };
}
