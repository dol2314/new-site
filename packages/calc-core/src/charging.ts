/**
 * 전기차 월 충전비와 같은 거리 주유비 비교.
 *
 * 요금 단가는 이 파일에 쓰지 않는다. 공공 충전요금 단계는 ChargeTier[]로 받고(packages/data/data/ev-charging),
 * 집·민간 충전 단가와 연비·유가는 사용자가 넣는다.
 *
 * 계산:
 * - 필요한 전력량(kWh) = 월 주행거리 ÷ 전비(km/kWh)
 * - 충전비 = Σ 전력량 × 충전 방식별 비율 × 단가(원/kWh), 방식마다 원 단위 반올림
 * - 주유비 = 월 주행거리 ÷ 연비(km/L) × 유가(원/L), 원 단위 반올림
 * 세금 계산이 아니라 추정이라 반올림한다(10원 미만 버림 규칙 없음).
 */

export interface ChargeTier {
  /** 이 출력 이상 (kW) */
  minKw: number;
  /** 이 출력 미만 (kW). null이면 상한 없음 */
  maxKw: number | null;
  wonPerKwh: number;
}

/** 충전기 출력(kW)에 맞는 공공 충전요금 단계 */
export function tierForKw(kw: number, tiers: ChargeTier[]): ChargeTier {
  if (!Number.isFinite(kw) || kw <= 0)
    throw new RangeError("충전기 출력(kW)은 0보다 커야 함");
  const t = tiers.find(
    (x) => kw >= x.minKw && (x.maxKw === null || kw < x.maxKw),
  );
  if (!t) throw new RangeError(`요금 단계 없음: ${kw}kW`);
  return t;
}

export interface ChargingMixItem {
  label: string;
  /** 0~1. 모든 항목 합이 1 */
  share: number;
  wonPerKwh: number;
}

export interface ChargingInput {
  monthlyKm: number;
  kmPerKwh: number;
  mix: ChargingMixItem[];
  fuel?: { kmPerLiter: number; wonPerLiter: number };
}

export interface ChargingResult {
  kwh: number;
  items: (ChargingMixItem & { kwh: number; cost: number })[];
  monthlyCost: number;
  annualCost: number;
  /** km당 원 (소수 첫째 자리) */
  wonPerKm: number;
  fuel: {
    liters: number;
    monthlyCost: number;
    annualCost: number;
    wonPerKm: number;
  } | null;
  /** 주유비 − 충전비 (양수면 전기차가 덜 듦) */
  monthlyDiff: number | null;
}

const round1 = (n: number) => Math.round(n * 10) / 10;

export function calcChargingCost(input: ChargingInput): ChargingResult {
  const { monthlyKm, kmPerKwh, mix, fuel } = input;
  if (!(monthlyKm >= 0) || !Number.isFinite(monthlyKm))
    throw new RangeError("월 주행거리를 확인해야 함");
  if (!(kmPerKwh > 0)) throw new RangeError("전비(km/kWh)는 0보다 커야 함");
  if (mix.length === 0) throw new RangeError("충전 방식이 없음");
  if (mix.some((m) => m.share < 0 || !(m.wonPerKwh >= 0)))
    throw new RangeError("비율·단가는 0 이상");
  const total = mix.reduce((s, m) => s + m.share, 0);
  if (Math.abs(total - 1) > 1e-9)
    throw new RangeError(`충전 비율 합이 100%가 아님: ${round1(total * 100)}%`);

  const kwh = monthlyKm / kmPerKwh;
  const items = mix.map((m) => {
    const k = kwh * m.share;
    return { ...m, kwh: round1(k), cost: Math.round(k * m.wonPerKwh) };
  });
  const monthlyCost = items.reduce((s, i) => s + i.cost, 0);

  let f: ChargingResult["fuel"] = null;
  if (fuel) {
    if (!(fuel.kmPerLiter > 0) || !(fuel.wonPerLiter >= 0))
      throw new RangeError("연비·유가를 확인해야 함");
    const liters = monthlyKm / fuel.kmPerLiter;
    const cost = Math.round(liters * fuel.wonPerLiter);
    f = {
      liters: round1(liters),
      monthlyCost: cost,
      annualCost: cost * 12,
      wonPerKm: monthlyKm ? round1(cost / monthlyKm) : 0,
    };
  }
  return {
    kwh: round1(kwh),
    items,
    monthlyCost,
    annualCost: monthlyCost * 12,
    wonPerKm: monthlyKm ? round1(monthlyCost / monthlyKm) : 0,
    fuel: f,
    monthlyDiff: f ? f.monthlyCost - monthlyCost : null,
  };
}
