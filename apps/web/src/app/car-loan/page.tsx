import {
  calcLoan,
  calcOwnershipCost,
  calcPurchase,
  tierForKw,
  calcRegistrationTax,
  formatWon,
  type RegistrationTaxInput,
} from "@site/calc-core";
import {
  EV_SUBSIDY_YEARS,
  evChargingData,
  evSubsidyData,
  ownershipData,
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
const own = ownershipData();
const charging = evChargingData();

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

// 5년 비용 비교 사례: 차값·보조금·주행거리·전비·연비·기름값은 예시 가정값, 세금·충전요금은 확인된 데이터
const START = "2027-01-04";
const carTaxFor = (y: number) => own.carTaxByYear[Math.min(y, own.latestYear)]!;
const slowWon = tierForKw(7, charging.publicTiers).wonPerKwh;
const KM_YEAR = 15_000;
const evOwn = calcOwnershipCost({
  start: START,
  years: 5,
  purchase: p2.realPrice,
  fuelType: "electric",
  carTaxParamsFor: carTaxFor,
  newRegistration: own.newRegistration,
  annualEnergy: (KM_YEAR / 5) * slowWon,
  annualInsurance: 0,
});
const iceReal = calcPurchase({
  price: 30_000_000,
  subsidy: 0,
  registrationTax: calcRegistrationTax(
    { ...T, price: 30_000_000, powertrain: "ice", acquiredOn: START },
    p,
  ).payable,
  extra: 0,
  downPayment: 0,
  financeTaxAndExtra: false,
}).realPrice;
const iceOwn = calcOwnershipCost({
  start: START,
  years: 5,
  purchase: iceReal,
  fuelType: "gasoline",
  displacementCc: 1598,
  carTaxParamsFor: carTaxFor,
  newRegistration: own.newRegistration,
  annualEnergy: (KM_YEAR / 12) * 1_700,
  annualInsurance: 0,
});
const y0 = Number(START.slice(0, 4));

const examples: Example[] = [
  {
    title: "4,500만원 전기차, 보조금 900만원 — 12월 인도 vs 1월 인도",
    body: (
      <p>
        차량 대금은 {formatWon(p1.carPayable)}입니다. 취득세는 보조금을 빼기 전
        차값 기준이라 12월에 인도받으면 {formatWon(t1.payable)}, 실구매가{" "}
        {formatWon(p1.realPrice)}입니다. 현행법상 전기차 취득세 감면이{" "}
        {formatKoreanDate(p.evRelief.until)}에 끝나 1월에 인도받으면 취득세{" "}
        {formatWon(t2.payable)}, 실구매가 {formatWon(p2.realPrice)}으로{" "}
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
        입니다. 원금균등은 첫 달 {formatWon(lq.firstPayment)}으로 시작해
        줄어들고, 총이자는 {formatWon(lq.totalInterest)}으로{" "}
        {formatWon(lp.totalInterest - lq.totalInterest)} 적습니다. (금리는 예시)
      </p>
    ),
  },
  {
    title: "같은 조건을 유예할부(40% 유예)로 하면",
    body: (
      <p>
        매달 {formatWon(lb.firstPayment)}으로 원리금균등보다{" "}
        {formatWon(lp.firstPayment - lb.firstPayment)} 적지만, 마지막 달에{" "}
        {formatWon(lb.lastPayment)}을 내야 하고 총이자는{" "}
        {formatWon(lb.totalInterest)}으로{" "}
        {formatWon(lb.totalInterest - lp.totalInterest)} 많습니다.
      </p>
    ),
  },
  {
    title: `5년 비교: 위 전기차(1월 인도) vs 3,000만원 1,598cc 휘발유차`,
    body: (
      <p>
        1년 {KM_YEAR.toLocaleString("ko-KR")}km를 달린다고 보고 {y0}~{y0 + 4}
        년을 더했습니다. 전기차는 실구매가 {formatWon(evOwn.totals.purchase)},
        자동차세 {formatWon(evOwn.totals.carTax)}, 공공 완속 충전비{" "}
        {formatWon(evOwn.totals.energy)}으로 합계 {formatWon(evOwn.totals.all)}
        입니다. 휘발유차(연비 12km/L, 기름값 1L에 1,700원 가정)는 실구매가{" "}
        {formatWon(iceOwn.totals.purchase)}, 자동차세{" "}
        {formatWon(iceOwn.totals.carTax)}, 기름값{" "}
        {formatWon(iceOwn.totals.energy)}으로 합계 {formatWon(iceOwn.totals.all)}
        입니다.{" "}
        {evOwn.totals.all <= iceOwn.totals.all
          ? `전기차가 ${formatWon(iceOwn.totals.all - evOwn.totals.all)} 덜 듭니다.`
          : `휘발유차가 ${formatWon(evOwn.totals.all - iceOwn.totals.all)} 덜 듭니다.`}{" "}
        (보험료·중고 시세 제외)
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
  ...own.sources,
  ...charging.sources.filter((s) => s.key === "values.publicTiers"),
];

export default function CarLoanPage() {
  return (
    <ToolPage
      tool={tool}
      summary={[
        "실구매가는 차값에서 보조금을 빼고 취득세와 기타 비용을 더한 금액입니다. 보조금은 지자체가 제작사에 주고, 구매자는 차액만 냅니다.",
        "취득세는 보조금을 빼기 전 차값(부가세 제외) 기준이라, 보조금을 받아도 취득세는 줄지 않습니다.",
        "할부는 원리금균등·원금균등·유예할부의 월 납입금과 총이자를 나란히 비교하고, 다른 차와 5년 동안 드는 돈(자동차세·연료비 포함)도 비교할 수 있습니다.",
      ]}
      calculator={
        <CarLoanCalculator
          regParams={p}
          officialSubsidyUrl={LINKS.evPortal.href}
          compareData={{
            carTaxByYear: own.carTaxByYear,
            latestYear: own.latestYear,
            newRegistration: own.newRegistration,
            tiers: charging.publicTiers,
            pendingFuels: own.pendingFuels,
          }}
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
            <li>
              5년 비용 = 실구매가 + 자동차세 + 연료·충전비 + 보험료. 등록한 해는
              등록일부터 연말까지만 셉니다. 자동차세는 등록한 기분을 등록일부터
              일할계산하고, 다음 해부터 차령 경감을 반영합니다.{" "}
              {own.latestYear + 1}년 이후는 {own.latestYear}년 세율이 그대로라고
              가정합니다.
            </li>
            <li>
              전기차 충전비는 공공 충전요금(기후에너지환경부) 또는 입력한 요금,
              기름값·보험료는 입력한 값입니다. 중고 시세, 정비비, 할부 이자,
              연납 공제는 넣지 않습니다.
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
          q: "5년 비용 비교에는 무엇이 빠져 있나요?",
          a: "중고로 팔 때 받는 돈(감가), 정비·타이어 비용, 할부 이자, 자동차세 연납 공제는 빠져 있습니다. 공식 기준이 없거나 사람마다 차이가 커서입니다. 보험료는 받은 견적을 넣으면 더해집니다.",
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
      disclaimer="이 계산은 모의 계산입니다. 실제 차값·보조금·금리는 판매사·지자체·금융회사의 견적과 심사로 정해지고, 5년 비용은 입력한 가정값에 따라 달라집니다."
      checkedAt={reg.sources[0]?.checked_at ?? "2026-11-01"}
    />
  );
}
