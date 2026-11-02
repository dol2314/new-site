/**
 * 사례 분석 19: 경형 전기차 실구매가 — 보조금·취득세·할부를 한 번에.
 * 경·소형 국비 범위는 제주 공공데이터(국비는 전국 같음), 취득세·감면은 확인된 데이터. 차값·지방비·금리는 예시 가정값.
 * 숫자는 calc-core로 빌드 때 계산한다.
 */
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
import Link from "next/link";
import { GuideLayout } from "@/components/GuideLayout";
import type { GuideMeta } from "@/lib/guides";
import { formatKoreanDate } from "@/lib/kst";

const YEAR = EV_SUBSIDY_YEARS[EV_SUBSIDY_YEARS.length - 1]!;
const ev = evSubsidyData(YEAR);
const reg = registrationTaxData();
const p = reg.params;
const man = (won: number) =>
  `${Math.round(won / 10_000).toLocaleString("ko-KR")}만원`;
const pct = (r: number) => `${Math.round(r * 100)}%`;

const compact = ev.models.filter(
  (m) => !m.discontinued && m.category === "경·소형",
);
const natMin = Math.min(...compact.map((m) => m.national));
const natMax = Math.max(...compact.map((m) => m.national));

// 예시 가정
const PRICE = 29_000_000;
const NATIONAL = natMax * 10_000;
const LOCALS = [
  Math.ceil((NATIONAL * ev.rules.localMinRatio) / 10_000) * 10_000,
  2_500_000,
  3_500_000,
];
const LOCAL = LOCALS[1]!;
const DEC = `${YEAR}-12-18`;
const JAN = `${YEAR + 1}-01-12`;
const RATE = 0.05;
const MONTHS = 36;

const taxOn = (acquiredOn: string) =>
  calcRegistrationTax(
    {
      price: PRICE,
      vatIncluded: true,
      compact: true,
      powertrain: "electric",
      seats7to10: false,
      childrenUnder18: 0,
      acquiredOn,
    } as RegistrationTaxInput,
    p,
  );
const taxDec = taxOn(DEC);
const taxJan = taxOn(JAN);
const purchase = (subsidy: number, tax: number) =>
  calcPurchase({
    price: PRICE,
    subsidy,
    registrationTax: tax,
    extra: 0,
    downPayment: 0,
    financeTaxAndExtra: false,
  });
const base = purchase(NATIONAL + LOCAL, taxJan.payable);
const byLocal = LOCALS.map((l) => ({
  l,
  r: purchase(NATIONAL + l, taxJan.payable),
}));
const decBuy = purchase(NATIONAL + LOCAL, taxDec.payable);
const loan = calcLoan({
  principal: base.carPayable,
  annualRate: RATE,
  months: MONTHS,
  method: "equal-payment",
});

const sources = [
  ...ev.sources.filter((s) =>
    ["values.models", "values.localMinRatio", "rules.nationalUniform"].includes(
      s.key,
    ),
  ),
  ...reg.sources.filter((s) =>
    [
      "values.rates",
      "values.evRelief",
      "values.compactRelief",
      "rules.overlap",
      "rules.subsidyInBase",
    ].includes(s.key),
  ),
];

export default function Article({ meta }: { meta: GuideMeta }) {
  return (
    <GuideLayout
      meta={meta}
      summary={[
        <>
          {YEAR}년 경·소형 전기 승용차의 국비는 차종별로 {man(natMin * 10_000)}~
          {man(natMax * 10_000)}입니다. 부가세 포함 {man(PRICE)}짜리 경형
          전기차에 국비 {man(NATIONAL)}, 지방비 {man(LOCAL)}을 받으면 차량
          대금은 {formatWon(base.carPayable)}입니다.
        </>,
        <>
          여기에 {formatKoreanDate(JAN)} 인도 기준 취득세{" "}
          {formatWon(taxJan.payable)}을 더한 실구매가는{" "}
          <strong>{formatWon(base.realPrice)}</strong>이고, 차량 대금을 연{" "}
          {pct(RATE)} {MONTHS}개월 할부하면 매달 {formatWon(loan.firstPayment)}
          입니다(차값·지방비·금리는 예시).
        </>,
        <>
          내 지역 보조금을 넣어 다시 계산하려면{" "}
          <Link href="/car-loan/">실구매가·할부 계산기</Link>를 쓰세요.
        </>,
      ]}
      faq={[
        {
          q: "보조금을 받으면 취득세도 줄어드나요?",
          a: "아닙니다. 보조금으로 지원받은 금액도 취득가격에 들어가, 취득세는 보조금을 빼기 전 차값(부가세 제외)으로 계산합니다.",
        },
        {
          q: "경형 전기차는 어떤 취득세 감면을 받나요?",
          a: "전기차 감면과 경형 자동차 감면에 둘 다 해당할 수 있지만, 감면액이 큰 것 하나만 받습니다. 기한 안이면 보통 전기차 감면 쪽이 큽니다.",
        },
        {
          q: "지방비는 얼마인가요?",
          a: `지역마다 다릅니다. 지침상 지자체는 국비의 ${pct(ev.rules.localMinRatio)} 이상을 지방비로 편성해야 해, 국비 ${man(NATIONAL)}인 차라면 지방비가 최소 약 ${man(LOCALS[0]!)}입니다. 정확한 금액은 사는 지역 공고를 보세요.`,
        },
      ]}
      sources={sources}
      disclaimer="차값·지방비·금리는 예시 가정이며, 실제 보조금은 지자체 공고와 심사, 실제 차값과 금리는 판매사·금융사 견적으로 정해집니다."
    >
      <section data-article-section="conditions">
        <h2>계산 조건 (가정)</h2>
        <div className="table-wrap">
          <table>
            <tbody>
              <tr>
                <th scope="row">차</th>
                <td>경형 전기 승용차, 부가세 포함 {man(PRICE)} (예시 가격)</td>
              </tr>
              <tr>
                <th scope="row">보조금</th>
                <td>
                  국비 {man(NATIONAL)}(경·소형 최고 수준) + 지방비 {man(LOCAL)}
                  (예시)
                </td>
              </tr>
              <tr>
                <th scope="row">인도·등록</th>
                <td>{formatKoreanDate(JAN)} (12월 인도와 비교)</td>
              </tr>
              <tr>
                <th scope="row">할부</th>
                <td>
                  차량 대금 전액, 연 {pct(RATE)}, {MONTHS}개월 원리금균등
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className="muted small">
          특정 모델의 가격·견적이 아니라, 실구매가가 어떻게 쌓이는지 보여 주기
          위한 예시입니다.
        </p>
      </section>

      <section data-article-section="steps">
        <h2>단계별 계산</h2>
        <ol>
          <li>
            <strong>차량 대금:</strong> 보조금은 판매사 쪽으로 지급되고 구매자는
            나머지만 냅니다. {formatWon(PRICE)} − {formatWon(NATIONAL + LOCAL)}{" "}
            = {formatWon(base.carPayable)}.
          </li>
          <li>
            <strong>취득세:</strong> 보조금을 빼기 전 차값에서 부가세를 덜고
            경차 세율 {pct(p.rates.compact)}를 곱하면{" "}
            {formatWon(taxJan.computedTax)}. {formatKoreanDate(JAN)} 인도라면
            경형 자동차 감면(
            {formatWon(p.compactRelief.capWon)} 한도)으로{" "}
            {formatWon(taxJan.payable)}을 냅니다.
          </li>
          <li>
            <strong>실구매가:</strong> {formatWon(base.carPayable)} +{" "}
            {formatWon(taxJan.payable)} ={" "}
            <strong>{formatWon(base.realPrice)}</strong>.
          </li>
          <li>
            <strong>할부:</strong> 차량 대금을 {MONTHS}개월 할부하면 매달{" "}
            {formatWon(loan.firstPayment)}, 이자 합계{" "}
            {formatWon(loan.totalInterest)}입니다. 취득세는 등록할 때 따로
            냅니다.
          </li>
        </ol>
      </section>

      <section data-article-section="variations">
        <h2>조건이 바뀌면</h2>

        <h3 data-variation>
          사는 지역의 지방비에 따라: 최대{" "}
          {formatWon(byLocal[0]!.r.realPrice - byLocal[2]!.r.realPrice)} 차이
        </h3>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th scope="col">지방비(예시)</th>
                <th scope="col">차량 대금</th>
                <th scope="col">실구매가</th>
              </tr>
            </thead>
            <tbody>
              {byLocal.map(({ l, r }) => (
                <tr key={l}>
                  <td>{man(l)}</td>
                  <td>{formatWon(r.carPayable)}</td>
                  <td>{formatWon(r.realPrice)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p>
          첫 줄은 지침상 최소 수준(국비의 {pct(ev.rules.localMinRatio)})입니다.
          같은 차라도 지방비가 많은 지역에 살면 실구매가가{" "}
          {formatWon(byLocal[0]!.r.realPrice - byLocal[2]!.r.realPrice)}{" "}
          낮아집니다.
        </p>

        <h3 data-variation>{YEAR}년 12월에 인도받으면: 취득세가 0원</h3>
        <p>
          {formatKoreanDate(p.evRelief.until)}까지는 전기차 감면(
          {formatWon(p.evRelief.capWon)} 한도)이 경차 감면보다 커서 취득세가{" "}
          {formatWon(taxDec.payable)}입니다. 같은 조건의 실구매가는{" "}
          {formatWon(decBuy.realPrice)}으로{" "}
          {formatWon(base.realPrice - decBuy.realPrice)} 낮습니다.
        </p>

        <h3 data-variation>국비가 낮은 경·소형 차라면</h3>
        <p>
          {YEAR}년 경·소형 차종 가운데 국비가 가장 적은 차는{" "}
          {man(natMin * 10_000)}입니다. 다른 조건이 같다면 실구매가가{" "}
          {formatWon((natMax - natMin) * 10_000)} 늘어납니다. 지침상 지방비도
          국비 수준에 비례해 정하므로 실제 차이는 이보다 크니, 차종별 금액은
          보조금 계산기에서 확인하세요.
        </p>
      </section>

      <section data-article-section="pitfalls">
        <h2>놓치기 쉬운 것</h2>
        <ol>
          <li>
            <strong>
              견적서의 &quot;보조금 적용가&quot;를 다시 계산해 보세요.
            </strong>{" "}
            판매사 견적에는 지역 보조금을 가정한 금액이 들어갈 수 있어, 내 지역
            공고 금액과 다르면 차량 대금도 달라집니다.
          </li>
          <li>
            <strong>취득세는 보조금과 따로 준비하세요.</strong> 보조금으로 차량
            대금은 줄지만 취득세는 줄지 않습니다.
          </li>
          <li>
            <strong>{YEAR + 1}년 보조금은 새 지침으로 정해집니다.</strong> 이
            글의 국비 범위는 {YEAR}년 기준입니다.
          </li>
        </ol>
      </section>
    </GuideLayout>
  );
}
