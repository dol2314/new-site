/**
 * 자동차 할부 상환 계산 (원리금균등 / 원금균등 / 유예할부).
 * 법령값이 없는 순수 금융 산식이다. 금리·기간·선수금은 사용자가 금융사 견적을 보고 넣는다(기본 금리를 정하지 않는다).
 * 매월 이자 = 직전 잔액 × 월 이율(연 이율 ÷ 12), 원 단위 반올림. 마지막 회차에서 남은 잔액을 정리한다.
 * 실제 금융사 계산(일할 이자, 첫 회차 기간 등)과 몇 원~몇백 원 다를 수 있다.
 */
export type LoanMethod = "equal-payment" | "equal-principal" | "balloon";

export interface LoanInput {
  principal: number;
  /** 연 이율 (예: 0.05 = 연 5%) */
  annualRate: number;
  months: number;
  method: LoanMethod;
  /** 유예할부: 마지막 회차에 남겨 두는 비율 (예: 0.4) */
  balloonRate?: number;
}

export interface LoanRow {
  month: number;
  payment: number;
  principal: number;
  interest: number;
  balance: number;
}

export interface LoanResult {
  schedule: LoanRow[];
  /** 1회차 납입금 */
  firstPayment: number;
  /** 마지막 회차 납입금(유예할부는 유예금 포함) */
  lastPayment: number;
  /** 유예금(마지막에 한꺼번에 내는 원금) */
  balloon: number;
  totalInterest: number;
  totalPaid: number;
}

export function calcLoan(input: LoanInput): LoanResult {
  const { principal: P, annualRate, months: n, method } = input;
  if (!Number.isFinite(P) || P < 0) throw new RangeError("할부 원금은 0 이상");
  if (!Number.isInteger(n) || n < 1 || n > 120)
    throw new RangeError("기간은 1~120개월");
  if (!Number.isFinite(annualRate) || annualRate < 0 || annualRate > 0.3)
    throw new RangeError("연 이율은 0~30%");
  const r = annualRate / 12;
  const balloon =
    method === "balloon" ? Math.round(P * (input.balloonRate ?? 0)) : 0;
  if (
    method === "balloon" &&
    (!(input.balloonRate! >= 0) || input.balloonRate! >= 1)
  )
    throw new RangeError("유예 비율은 0 이상 1 미만");

  // 원리금균등·유예: 매월 같은 금액 (유예는 마지막에 유예금을 남기도록)
  let level = 0;
  if (method !== "equal-principal") {
    if (r === 0) level = (P - balloon) / n;
    else {
      const g = Math.pow(1 + r, n);
      level = ((P * g - balloon) * r) / (g - 1);
    }
    level = Math.round(level);
  }
  const fixedPrincipal = Math.round(P / n);

  const schedule: LoanRow[] = [];
  let balance = P;
  for (let k = 1; k <= n; k++) {
    const interest = Math.round(balance * r);
    let principal: number;
    if (k === n)
      principal = balance; // 마지막 회차: 남은 원금(유예금 포함) 정리
    else if (method === "equal-principal") principal = fixedPrincipal;
    else principal = level - interest;
    balance -= principal;
    schedule.push({
      month: k,
      payment: principal + interest,
      principal,
      interest,
      balance,
    });
  }
  const totalInterest = schedule.reduce((s, x) => s + x.interest, 0);
  return {
    schedule,
    firstPayment: schedule[0]!.payment,
    lastPayment: schedule[n - 1]!.payment,
    balloon,
    totalInterest,
    totalPaid: P + totalInterest,
  };
}

/**
 * 현금을 예금에 두고 할부금을 그 돈에서 낼 때 받는 예금 이자(세전, 단리, 매달 남은 잔액 기준).
 * 잔액은 처음에 할부 원금만큼 두고, 매달 납입금만큼 줄어든다. 원 단위 반올림.
 * 할부 총이자 − 이 금액 = 할부의 순비용(양수면 현금이 유리).
 */
export function depositInterestWhilePaying(
  loan: LoanResult,
  principal: number,
  annualDepositRate: number,
): number {
  if (annualDepositRate < 0) throw new RangeError("예금 이율은 0 이상");
  let balance = principal;
  let earned = 0;
  for (const row of loan.schedule) {
    earned += Math.max(balance, 0) * (annualDepositRate / 12);
    balance -= row.payment;
  }
  return Math.round(earned);
}

