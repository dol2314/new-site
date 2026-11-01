/**
 * 자동차 검사 기간·지연 과태료.
 *
 * 검사 주기, 검사 기간(만료일 전후 며칠), 과태료 구간은 모두 InspectionParams로 받는다.
 * 실제 값은 packages/data 의 데이터 파일(자동차관리법·시행령·시행규칙, 한국교통안전공단 안내로 확인)에서 온다.
 */
import { addDays, addYears, diffDays, type IsoDate } from "./dates";
import type { Breakdown } from "./carTax";

export interface InspectionCycle {
  /** 신차 최초 검사까지 연수 */
  firstAfterYears: number;
  /** 이후 검사 주기(연) */
  everyYears: number;
}

/**
 * 과태료 구간. 지연 일수(검사 기간이 끝난 다음 날 = 1일)가 fromDay~toDay에 들면
 * 금액 = baseWon + floor((지연 일수 - fromDay) / stepDays) × stepWon. stepDays가 없으면 구간 내내 baseWon.
 * 전체 금액은 penaltyCapWon을 넘지 않는다.
 */
export interface PenaltyTier {
  fromDay: number;
  toDay: number | null;
  baseWon: number;
  stepDays?: number;
  stepWon?: number;
}

export interface InspectionParams {
  /** 검사 유효기간 만료일 기준, 검사를 받을 수 있는 기간: 만료일 - before ~ 만료일 + after */
  windowDaysBefore: number;
  windowDaysAfter: number;
  penaltyTiers: PenaltyTier[];
  penaltyCapWon: number;
}

export interface InspectionWindow {
  expiry: IsoDate;
  start: IsoDate;
  end: IsoDate;
}

/** 검사 유효기간 만료일로 검사 기간을 구한다. */
export function inspectionWindow(expiry: IsoDate, p: InspectionParams): InspectionWindow {
  return { expiry, start: addDays(expiry, -p.windowDaysBefore), end: addDays(expiry, p.windowDaysAfter) };
}

/**
 * 최초등록일로 만료일을 추정한다(등록증의 유효기간을 모를 때만 쓰는 참고값).
 * 규칙(확인 필요): 최초 만료 = 최초등록일 + firstAfterYears년 - 1일, 이후 everyYears년씩.
 * today 이후 처음 오는 만료일(또는 오늘이 검사 기간 안이면 그 만료일)을 돌려준다.
 */
export function estimateExpiry(firstRegisteredAt: IsoDate, today: IsoDate, cycle: InspectionCycle, p: InspectionParams): IsoDate {
  let expiry = addDays(addYears(firstRegisteredAt, cycle.firstAfterYears), -1);
  // 오늘이 이 만료일의 검사 기간 끝을 지났으면 다음 주기로
  for (let guard = 0; guard < 100 && diffDays(inspectionWindow(expiry, p).end, today) > 0; guard++) {
    expiry = addYears(expiry, cycle.everyYears);
  }
  return expiry;
}

export interface PenaltyResult {
  window: InspectionWindow;
  /** 검사 기간이 끝난 뒤 지난 일수. 기간 안이거나 전이면 0 */
  daysOverdue: number;
  amountWon: number;
  /** 상한에 처음 도달하는 날 (검사를 계속 안 받으면) */
  capReachedOn: IsoDate | null;
  status: "before-window" | "in-window" | "overdue";
  breakdown: Breakdown[];
}

export function penaltyForDays(daysOverdue: number, p: InspectionParams): number {
  if (daysOverdue <= 0) return 0;
  const tier = p.penaltyTiers.find((t) => daysOverdue >= t.fromDay && (t.toDay === null || daysOverdue <= t.toDay));
  if (!tier) throw new RangeError(`과태료 구간 없음: ${daysOverdue}일`);
  let amount = tier.baseWon;
  if (tier.stepDays && tier.stepWon) {
    const steps = Math.floor((daysOverdue - tier.fromDay) / tier.stepDays);
    amount += steps * tier.stepWon;
  }
  return Math.min(amount, p.penaltyCapWon);
}

export function calcInspectionPenalty(expiry: IsoDate, today: IsoDate, p: InspectionParams): PenaltyResult {
  const window = inspectionWindow(expiry, p);
  const toStart = diffDays(today, window.start);
  const overdue = diffDays(window.end, today);
  const status: PenaltyResult["status"] = toStart > 0 ? "before-window" : overdue > 0 ? "overdue" : "in-window";
  const daysOverdue = Math.max(0, overdue);
  const amountWon = penaltyForDays(daysOverdue, p);

  let capReachedOn: IsoDate | null = null;
  for (let d = 1; d <= 3650; d++) {
    if (penaltyForDays(d, p) >= p.penaltyCapWon) {
      capReachedOn = addDays(window.end, d);
      break;
    }
  }

  return {
    window,
    daysOverdue,
    amountWon,
    capReachedOn,
    status,
    breakdown: [
      { label: "검사 기간", value: p.windowDaysBefore + p.windowDaysAfter + 1, rule: `${window.start} ~ ${window.end}` },
      { label: "지연 일수", value: daysOverdue, rule: "검사 기간이 끝난 다음 날부터 1일" },
      { label: "과태료", value: amountWon, rule: `상한 ${p.penaltyCapWon.toLocaleString("ko-KR")}원` },
    ],
  };
}
