import type { ChargeTier } from "@site/calc-core";

/** 공공 충전요금 단계 이름 (하한 포함, 상한 미포함) */
export function tierLabel(t: ChargeTier): string {
  if (t.minKw === 0) return `${t.maxKw}kW 미만`;
  if (t.maxKw === null) return `${t.minKw}kW 이상`;
  return `${t.minKw}~${t.maxKw}kW 미만`;
}
