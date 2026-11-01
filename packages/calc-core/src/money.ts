/**
 * 금액 처리 공통 함수. 세금·과태료 계산에서 단위 절사·반올림 규칙이 다르므로
 * 각 계산 함수는 어떤 규칙을 쓰는지 근거 조문과 함께 이 함수들을 골라 쓴다.
 */

/** 원 단위 금액을 `unit`원 미만 절사한다. 예: truncateTo(12_345, 10) === 12_340 */
export function truncateTo(value: number, unit: number): number {
  assertFinite(value);
  assertPositiveUnit(unit);
  return Math.trunc(value / unit) * unit;
}

/** `unit`원 단위로 반올림한다(0.5는 올림). 예: roundTo(12_345, 10) === 12_350 */
export function roundTo(value: number, unit: number): number {
  assertFinite(value);
  assertPositiveUnit(unit);
  const sign = value < 0 ? -1 : 1;
  return sign * Math.floor(Math.abs(value) / unit + 0.5) * unit;
}

/** 화면 표시용: 12345 → "12,345원" */
export function formatWon(value: number): string {
  assertFinite(value);
  return `${Math.round(value).toLocaleString("ko-KR")}원`;
}

function assertFinite(value: number): void {
  if (!Number.isFinite(value)) throw new RangeError(`금액이 숫자가 아님: ${value}`);
}

function assertPositiveUnit(unit: number): void {
  if (!Number.isFinite(unit) || unit <= 0) throw new RangeError(`단위는 0보다 커야 함: ${unit}`);
}
