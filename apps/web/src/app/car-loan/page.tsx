import {
  calcLoan,
  calcPurchase,
  calcRegistrationTax,
  formatWon,
  type RegistrationTaxInput,
} from "@site/calc-core";
import {
  EV_SUBSIDY_YEARS,
  evSubsidyData,
  registrationTaxData,
} from "@site/data";
import { SourcesList } from "@/components/tool/SourcesList";
import { ToolPage, type Example } from "@/components/tool/ToolPage";
import { formatKoreanDate } from "@/lib/kst";
import { LINKS } from "@/lib/links";
import { pageMetadata } from "@/lib/seo";
import { toolById } from "@/lib/tools";
import { CarLoanCalculator } from "./CarLoanCalculator";

const tool = toolById("car-loan");
const reg = registrationTaxData();
const ev = evSubsidyData(EV_SUBSIDY_YEARS[EV_SUBSIDY_YEARS.length - 1]!);
const p = reg.params;

export const metadata = pageMetadata({
  title: "자동차 실구매가·할부 계산기",
  description:
    "차값에서 보조금을 빼고 취득세를 더한 실구매가와 원리금균등·원금균등·유예할부 월 납입금을 한 번에 계산합니다.",
  path: tool.path,
  noindex: !tool.published,
});

// 사례: 입력은 예시 가정값(차값·보조금·금리), 계산은 엔진
const T: RegistrationTaxInput = {
  price: 45_000_000,
  vatIncluded: true,
  compact: false,
  powertrain: "electric",
  seats7to10: false,
  childrenUnder18: 0,
  acquiredOn: "2026-12-15",
};
const t1 = calcRegistrationTax(T, p);
const t2 = calcRegistrationTax({ ...T, acquiredOn: "2027-01-04" }, p);
const p1 = calcPurchase({
  price: 45_000_000,
  subsidy: 9_000_000,
  registrationTax: t1.payable,
  extra: 0,
  downPayment: 0,
  financeTaxAndExtra: false,
});
const p2 = calcPurchase({
  price: 45_000_000,
  subsidy: 9_000_000,
  registrationTax: t2.payable,
  extra: 0,
  downPayment: 0,
  financeTaxAndExtra: false,
});
const ice = calcRegistrationTax(
  { ...T, price: 30_000_000, powertrain: "ice" },
  p,
);
const ip = calcPurchase({
  price: 30_000_000,
  subsidy: 0,
  registrationTax: ice.payable,
  extra: 0,
  downPayment: 5_000_000,
  financeTaxAndExtra: false,
});
const lp = calcLoan({
  principal: ip.financed,
  annualRate: 0.05,
  months: 36,
  method: "equal-payment",
});
const lq = calcLoan({
  principal: ip.financed,
  annualRate: 0.05,
  months: 36,
  method: "equal-principal",
});
const lb = calcLoan({
  principal: ip.financed,
  annualRate: 0.05,
  months: 36,
  method: "balloon",
  balloonRate: 0.4,
});

const examples: Example[] = [
  {
    title: "4,500만원 전기차, 보조금 900만원 — 12월 등록 vs 1월 등록",
    body: (
      <p>
        차량 대금은 {formatWon(p1.carPayable)}입니다. 취득세는 보조금을 빼기 전
        차값 기준이라 12월 등록이면 {formatWon(t1.payable)}, 실구매가{" "}
        {formatWon(p1.realPrice)}입니다. 현행법상 전기차 취득세 감면이{" "}
        {formatKoreanDate(p.evRelief.until)}에 끝나 1월에 등록하면 취득세{" "}
        {formatWon(t2.payable)}, 실구매가 {formatWon(p2.realPrice)}로{" "}
        {formatWon(p2.realPrice - p1.realPrice)} 늘어납니다. (차값·보조금은
        예시)
      </p>
    ),
  },
  {
    title: "3,000만원 휘발유차, 선수금 500만원, 36개월 연 5%",
    body: (
      <p>
        취득세 {formatWon(ice.payable)}는 처음에 따로 내고, 할부 원금은{" "}
        {formatWon(ip.financed)}입니다. 원리금균등은 매달{" "}
        {formatWon(lp.firstPayment)}, 총이자 {formatWon(lp.totalInterest)}
        입니다. 원금균등은 첫 달 {formatWon(lq.firstPayment)}로 시작해 줄어들고,
        총이자는 {formatWon(lq.totalInterest)}로{" "}
        {formatWon(lp.totalInterest - lq.totalInterest)} 적습니다. (금리는 예시)
      </p>
    ),
  },
  {
    title: "같은 조건을 유예할부(40% 유예)로 하면",
    body: (
      <p>
        매달 {formatWon(lb.firstPayment)}로 원리금균등보다{" "}
        {formatWon(lp.firstPayment - lb.firstPayment)} 적지만, 마지막 달에{" "}
        {formatWon(lb.lastPayment)}를 내야 하고 총이자는{" "}
        {formatWon(lb.totalInterest)}로{" "}
        {formatWon(lb.totalInterest - lp.totalInterest)} 많습니다.
      </p>
    ),
  },
];

const sources = [
  ...reg.sources.filter((s) =>
    [
      "values.rates",
      "values.evRelief",
      "rules.subsidyInBase",
      "rules.actualPrice",
    ].includes(s.key),
  ),
  ...ev.sources.filter((s) => s.key === "rules.nationalUniform"),
];

export default function CarLoanPage() {
  return (
    <ToolPage
      tool={tool}
      summary={[
        "실구매가는 차값에서 보조금을 빼고 취득세와 기타 비용을 더한 금액입니다. 보조금은 지자체가 제작사에 주고, 구매자는 차액만 냅니다.",
        "취득세는 보조금을 빼기 전 차값(부가세 제외) 기준이라, 보조금을 받아도 취득세는 줄지 않습니다.",
        "할부는 원리금균등·원금균등·유예할부의 월 납입금과 총이자를 나란히 비교할 수 있습니다. 금리는 금융사 견적을 넣으세요.",
      ]}
      calculator={
        <CarLoanCalculator
          regParams={p}
          officialSubsidyUrl={LINKS.evPortal.href}
        />
      }
      examples={examples}
      method={
        <>
          <ol>
            <li>
              차량 대금 = 차값 − 보조금. 보조금은 지자체가 제작·수입사에
              지급하고 구매자는 차액을 냅니다(보조금 업무처리지침 추진 절차).
            </li>
            <li>
              취득세 = 부가세를 뺀 차값 × 세율(승용 7%, 경형 4%) − 감면.
              보조금으로 지원받은 금액도 취득가격에 들어갑니다.
            </li>
            <li>실구매가 = 차량 대금 + 취득세 + 기타 비용.</li>
            <li>
              할부 이자 = 매달 남은 원금 × 연 금리 ÷ 12, 원 단위 반올림.
              원리금균등은 매달 같은 금액, 원금균등은 원금을 똑같이 나눠 갚고,
              유예할부는 일부 원금을 마지막 달에 냅니다.
            </li>
            <li>
              금융사는 일할 이자·수수료 등을 따로 계산할 수 있어 실제 금액과
              조금 다를 수 있습니다.
            </li>
          </ol>
          <SourcesList sources={sources} />
        </>
      }
      table={
        <>
          <h3>상환 방식 비교</h3>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th scope="col">방식</th>
                  <th scope="col">매달 내는 돈</th>
                  <th scope="col">총이자</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>원리금균등</td>
                  <td>매달 같음</td>
                  <td>중간</td>
                </tr>
                <tr>
                  <td>원금균등</td>
                  <td>처음에 많고 점점 줄어듦</td>
                  <td>가장 적음</td>
                </tr>
                <tr>
                  <td>유예할부</td>
                  <td>적지만 마지막 달에 크게</td>
                  <td>가장 많음</td>
                </tr>
              </tbody>
            </table>
          </div>
        </>
      }
      faq={[
        {
          q: "보조금을 받으면 취득세도 줄어드나요?",
          a: "아닙니다. 보조금으로 지원받은 금액도 취득가격에 들어가므로, 취득세는 보조금을 빼기 전 차값(부가세 제외) 기준입니다.",
        },
        {
          q: "할부 이자도 취득세에 들어가나요?",
          a: "개인이 사는 경우 할부 이자와 연체료는 취득가격에서 뺍니다. 일시불로 할인을 받았다면 할인된 금액이 기준입니다.",
        },
        {
          q: "원리금균등과 원금균등 중 무엇이 유리한가요?",
          a: "총이자는 원금균등이 적습니다. 대신 초반 납입금이 많아 처음 몇 달 부담이 큽니다. 매달 같은 금액이 편하면 원리금균등입니다.",
        },
        {
          q: "유예할부는 무엇을 조심해야 하나요?",
          a: "매달 내는 돈은 적지만 마지막 달에 남긴 원금을 한꺼번에 내야 하고, 원금이 늦게 줄어 총이자가 가장 많습니다. 만기 때 낼 돈을 미리 준비해야 합니다.",
        },
        {
          q: "금리는 얼마로 넣어야 하나요?",
          a: "금리는 신용도와 금융사, 프로모션에 따라 다르므로 이 사이트는 기본값을 정하지 않습니다. 받은 견적서의 연 금리를 넣으세요.",
        },
        {
          q: "보조금 합계는 어디서 확인하나요?",
          a: "무공해차 통합누리집 메인의 보조금 계산기에서 사는 지역과 차종, 조건을 넣으면 국비·지방비 합계가 나옵니다. 그 금액을 이 계산기에 넣으면 됩니다.",
        },
      ]}
      next={{
        tools: [
          toolById("ev-subsidy"),
          toolById("registration-tax"),
          toolById("car-tax"),
        ],
        links: [LINKS.evPortal],
      }}
      checkedAt={reg.sources[0]?.checked_at ?? "2026-11-01"}
    />
  );
}
