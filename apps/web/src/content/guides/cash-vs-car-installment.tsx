/**
 * 사례 분석 11: 3천만원 차, 현금 vs 할부 36개월 — 이자와 예금 이자를 같이 놓고 비교.
 * 취득세는 확인된 데이터(registration-tax), 할부 금리·예금 금리·할인액은 예시 가정값. 숫자는 calc-core로 빌드 때 계산한다.
 */
import {
  calcLoan,
  calcRegistrationTax,
  depositInterestWhilePaying,
  formatWon,
  type LoanMethod,
} from "@site/calc-core";
import { registrationTaxData } from "@site/data";
import Link from "next/link";
import { GuideLayout } from "@/components/GuideLayout";
import type { GuideMeta } from "@/lib/guides";
import { formatKoreanDate } from "@/lib/kst";

const reg = registrationTaxData();
const p = reg.params;
const PRICE = 30_000_000;
const BUY = "2027-03-02";
const MONTHS = 36;
const RATE = 0.06; // 할부 금리(가정)
const DEPOSIT = 0.03; // 예금 금리(가정, 세전)
const CASH_DISCOUNT = 500_000; // 일시불 할인(가정)
const pct = (r: number) =>
  `${(Math.round(r * 1000) / 10).toLocaleString("ko-KR")}%`;

const regTax = (price: number) =>
  calcRegistrationTax(
    {
      price,
      vatIncluded: true,
      compact: false,
      powertrain: "ice",
      seats7to10: false,
      childrenUnder18: 0,
      acquiredOn: BUY,
    },
    p,
  ).payable;
const taxFull = regTax(PRICE);
const taxDiscounted = regTax(PRICE - CASH_DISCOUNT);

const loanOf = (
  principal: number,
  rate = RATE,
  months = MONTHS,
  method: LoanMethod = "equal-payment",
) => calcLoan({ principal, annualRate: rate, months, method });
const net = (principal: number, rate = RATE, months = MONTHS) => {
  const l = loanOf(principal, rate, months);
  const earned = depositInterestWhilePaying(l, principal, DEPOSIT);
  return { l, earned, net: l.totalInterest - earned };
};

const base = net(PRICE);
const byRate = [0.04, 0.06, 0.08].map((r) => ({ r, ...net(PRICE, r) }));
const byMonths = [24, 36, 48, 60].map((m) => ({ m, ...net(PRICE, RATE, m) }));
const DOWN = 0.3;
const withDown = net(PRICE * (1 - DOWN));
// 현금 사는 쪽: 할인 + 할인된 금액 기준 취득세
const cashTotal = PRICE - CASH_DISCOUNT + taxDiscounted;
const loanTotal = PRICE + taxFull + base.l.totalInterest;

const sources = reg.sources.filter((s) =>
  ["values.rates", "rules.actualPrice", "rules.taxBase"].includes(s.key),
);

export default function Article({ meta }: { meta: GuideMeta }) {
  return (
    <GuideLayout
      meta={meta}
      summary={[
        <>
          부가세 포함 3,000만원 차를 연 {pct(RATE)}, {MONTHS}개월 원리금균등
          할부로 사면 매달 {formatWon(base.l.firstPayment)}씩 내고 이자로{" "}
          <strong>{formatWon(base.l.totalInterest)}</strong>을 더 냅니다.
        </>,
        <>
          같은 돈을 연 {pct(DEPOSIT)} 예금에 두고 할부금을 꺼내 쓰면 세전 이자{" "}
          {formatWon(base.earned)}을 받아, 할부의 실제 부담은 약{" "}
          {formatWon(base.net)}입니다. 할부 금리가 예금 금리보다 높으면 현금이
          유리합니다(금리는 가정, {formatKoreanDate(meta.asOf)} 세율 기준).
        </>,
        <>
          받은 견적 금리로는 <Link href="/car-loan/">실구매가·할부 계산기</Link>
          에서 방식별 월 납입금과 회차별 상환표를 확인할 수 있습니다.
        </>,
      ]}
      faq={[
        {
          q: "할부 이자에도 취득세가 붙나요?",
          a: "개인이 사는 경우 할부 이자와 연체료는 취득가격에 넣지 않습니다. 그래서 할부로 사도 취득세는 차값(부가세 제외) 기준입니다.",
        },
        {
          q: "예금 이자 계산에 세금은 빠졌나요?",
          a: "네. 이 글의 예금 이자는 세전 금액입니다. 이자소득세를 빼면 받는 이자가 줄어 할부의 실제 부담은 조금 더 커집니다.",
        },
        {
          q: "무이자 할부라면 어떻게 되나요?",
          a: "금리가 0%면 이자가 없고, 그동안 남은 돈을 예금에 두면 이자만큼 이득입니다. 다만 무이자 조건에 일시불 할인이 빠지는지 견적서를 비교해 보세요.",
        },
      ]}
      sources={sources}
      disclaimer="할부·예금 금리와 할인액은 예시 가정이며, 실제 조건은 금융사·판매사의 견적과 심사로 정해집니다. 세율이 바뀌면 이 글을 고칩니다."
    >
      <section data-article-section="conditions">
        <h2>계산 조건 (가정)</h2>
        <div className="table-wrap">
          <table>
            <tbody>
              <tr>
                <th scope="row">차</th>
                <td>휘발유 승용차, 부가세 포함 3,000만원, 개인 비영업용</td>
              </tr>
              <tr>
                <th scope="row">할부</th>
                <td>
                  선수금 없음, {MONTHS}개월, 연 {pct(RATE)}, 원리금균등
                </td>
              </tr>
              <tr>
                <th scope="row">예금</th>
                <td>연 {pct(DEPOSIT)} (세전, 매달 남은 금액에 단리)</td>
              </tr>
              <tr>
                <th scope="row">취득세</th>
                <td>
                  {formatWon(taxFull)} — 할부·현금 모두 처음에 현금으로 냄 (
                  {formatKoreanDate(BUY)} 취득)
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className="muted small">
          금리는 신용도와 금융사에 따라 크게 다릅니다. 숫자는 비교 구조를 보여
          주기 위한 가정입니다.
        </p>
      </section>

      <section data-article-section="steps">
        <h2>단계별 계산</h2>
        <ol>
          <li>
            <strong>할부 납입금:</strong> 3,000만원을 월 {pct(RATE / 12)}로{" "}
            {MONTHS}번에 나눠 갚으면 매달 {formatWon(base.l.firstPayment)}
            입니다.
          </li>
          <li>
            <strong>할부 이자:</strong> {MONTHS}개월 동안 낸 돈{" "}
            {formatWon(base.l.totalPaid)}에서 원금을 빼면{" "}
            {formatWon(base.l.totalInterest)}입니다.
          </li>
          <li>
            <strong>현금을 두었을 때:</strong> 3,000만원을 예금에 넣고 매달
            할부금을 꺼내 쓰면, 남은 금액에 붙는 이자가 {MONTHS}개월 동안{" "}
            {formatWon(base.earned)}입니다.
          </li>
          <li>
            <strong>순비용:</strong> {formatWon(base.l.totalInterest)} −{" "}
            {formatWon(base.earned)} = <strong>{formatWon(base.net)}</strong>.
            이만큼이 할부를 고른 대가입니다.
          </li>
        </ol>
      </section>

      <section data-article-section="variations">
        <h2>조건이 바뀌면</h2>

        <h3 data-variation>
          금리가 다르면: 2%포인트에 이자 약{" "}
          {formatWon(
            Math.round(
              (byRate[1]!.l.totalInterest - byRate[0]!.l.totalInterest) /
                10_000,
            ) * 10_000,
          )}{" "}
          차이
        </h3>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th scope="col">할부 금리</th>
                <th scope="col">월 납입금</th>
                <th scope="col">총이자</th>
                <th scope="col">예금 이자 뺀 순비용</th>
              </tr>
            </thead>
            <tbody>
              {byRate.map(({ r, l, net: n }) => (
                <tr key={r}>
                  <td>연 {pct(r)}</td>
                  <td>{formatWon(l.firstPayment)}</td>
                  <td>{formatWon(l.totalInterest)}</td>
                  <td>{formatWon(n)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p>
          연 {pct(byRate[0]!.r)}와 {pct(byRate[2]!.r)}의 총이자 차이는{" "}
          {formatWon(byRate[2]!.l.totalInterest - byRate[0]!.l.totalInterest)}
          입니다. 견적을 두세 곳에서 받아 금리를 비교하는 것만으로 아낄 수 있는
          돈입니다.
        </p>

        <h3 data-variation>기간을 늘리면: 월 부담은 줄고 이자는 는다</h3>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th scope="col">기간</th>
                <th scope="col">월 납입금</th>
                <th scope="col">총이자</th>
              </tr>
            </thead>
            <tbody>
              {byMonths.map(({ m, l }) => (
                <tr key={m}>
                  <td>{m}개월</td>
                  <td>{formatWon(l.firstPayment)}</td>
                  <td>{formatWon(l.totalInterest)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p>
          60개월로 늘리면 매달{" "}
          {formatWon(byMonths[1]!.l.firstPayment - byMonths[3]!.l.firstPayment)}{" "}
          덜 내지만, 총이자는 {MONTHS}개월보다{" "}
          {formatWon(
            byMonths[3]!.l.totalInterest - byMonths[1]!.l.totalInterest,
          )}{" "}
          많습니다.
        </p>

        <h3 data-variation>선수금 {pct(DOWN)}를 내면: 이자도 그만큼 준다</h3>
        <p>
          차값의 {pct(DOWN)}인 {formatWon(PRICE * DOWN)}을 먼저 내고 나머지{" "}
          {formatWon(PRICE * (1 - DOWN))}만 할부로 하면 총이자가{" "}
          {formatWon(withDown.l.totalInterest)}으로 줄어듭니다. 선수금을 내지
          않을 때보다{" "}
          {formatWon(base.l.totalInterest - withDown.l.totalInterest)} 적습니다.
        </p>
      </section>

      <section data-article-section="pitfalls">
        <h2>놓치기 쉬운 것</h2>
        <ol>
          <li>
            <strong>일시불 할인은 취득세도 줄입니다.</strong> 취득세는 실제로 낸
            값 기준이라, 현금가가 {formatWon(CASH_DISCOUNT)} 싸면 취득세도{" "}
            {formatWon(taxFull - taxDiscounted)} 줄어듭니다. 이 할인까지 넣으면
            현금 쪽 합계는 {formatWon(cashTotal)}, 할부 쪽은{" "}
            {formatWon(loanTotal)}으로 {formatWon(loanTotal - cashTotal)} 차이가
            납니다(예금 이자 제외).
          </li>
          <li>
            <strong>중도상환 조건을 확인하세요.</strong> 할부를 일찍 갚을 때
            수수료가 있는지는 금융사·상품마다 다릅니다. 계약서의 중도상환 조항을
            먼저 보세요.
          </li>
          <li>
            <strong>월 납입금만 보지 마세요.</strong> 같은 차라도 기간을
            늘리거나 유예할부를 고르면 월 부담은 작아 보이지만 총이자는
            커집니다. 견적서의 총상환액을 함께 비교하세요.
          </li>
        </ol>
      </section>
    </GuideLayout>
  );
}
