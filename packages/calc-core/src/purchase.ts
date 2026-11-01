/**
 * 실구매가: 구매자가 실제로 쓰는 돈 = 차값 − 보조금 + 취득세 + 기타 비용.
 * - 보조금은 지자체가 제작·수입사에 주고, 구매자는 차값과 보조금의 차액만 낸다(보조금 업무처리지침 2026, 추진 절차).
 * - 취득세는 보조금을 빼기 전 차값(부가세 제외) 기준이다(지방세법 시행령 제18조제3항제2호) — 취득세 계산은 calcRegistrationTax.
 */
export interface PurchaseInput {
  /** 부가세 포함 차값(원) */
  price: number;
  subsidy: number;
  registrationTax: number;
  /** 탁송료·번호판·공채 할인 비용 등 사용자가 넣는 기타 비용 */
  extra: number;
  downPayment: number;
  /** 취득세·기타 비용도 할부에 넣을지 */
  financeTaxAndExtra: boolean;
}

export interface PurchaseResult {
  /** 제작사에 내는 차량 대금(차값 − 보조금) */
  carPayable: number;
  realPrice: number;
  /** 할부 원금 */
  financed: number;
  /** 등록·인도 때 현금으로 내는 돈(선수금 + 할부에 안 넣은 취득세·기타) */
  cashAtStart: number;
}

export function calcPurchase(i: PurchaseInput): PurchaseResult {
  for (const [k, v] of Object.entries({ 차값: i.price, 보조금: i.subsidy, 취득세: i.registrationTax, 기타비용: i.extra, 선수금: i.downPayment })) {
    if (!Number.isFinite(v) || v < 0) throw new RangeError(`${k}은 0 이상`);
  }
  if (i.subsidy > i.price) throw new RangeError("보조금이 차값보다 큼");
  const carPayable = i.price - i.subsidy;
  const realPrice = carPayable + i.registrationTax + i.extra;
  const base = i.financeTaxAndExtra ? realPrice : carPayable;
  if (i.downPayment > base) throw new RangeError("선수금이 할부 대상 금액보다 큼");
  const financed = base - i.downPayment;
  const cashAtStart = i.downPayment + (i.financeTaxAndExtra ? 0 : i.registrationTax + i.extra);
  return { carPayable, realPrice, financed, cashAtStart };
}
