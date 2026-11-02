/**
 * 사례 분석 14: 유예할부 마지막 회차 — 미리 얼마를 모아야 하나, 원리금균등과 무엇이 다른가.
 * 할부 산식은 calc-core(calcLoan), 원금·금리·유예 비율은 예시 가정값. 숫자는 빌드 때 계산한다.
 */
import { calcLoan, formatWon } from "@site/calc-core";
import { registrationTaxData } from "@site/data";
import Link from "next/link";
import { GuideLayout } from "@/components/GuideLayout";
import type { GuideMeta } from "@/lib/guides";

const P = 40_000_000;
const RATE = 0.06;
const MONTHS = 36;
const BALLOON = 0.4;
const pct = (r: number) =>
  `${(Math.round(r * 1000) / 10).toLocaleString("ko-KR")}%`;
const man = (won: number) =>
  `${Math.round(won / 10_000).toLocaleString("ko-KR")}만원`;

const loan = (o: { rate?: number; months?: number; balloon?: number } = {}) =>
  o.balloon === 0
    ? calcLoan({
        principal: P,
        annualRate: o.rate ?? RATE,
        months: o.months ?? MONTHS,
        method: "equal-payment",
      })
    : calcLoan({
        principal: P,
        annualRate: o.rate ?? RATE,
        months: o.months ?? MONTHS,
        method: "balloon",
        balloonRate: o.balloon ?? BALLOON,
      });

const even = loan({ balloon: 0 });
const bal = loan();
/** 마지막 회차를 위해 매달 따로 모을 돈(이자 없이 단순히 나눔, 원 단위 올림) */
const saveMonthly = (l: ReturnType<typeof loan>, months = MONTHS) =>
  Math.ceil(l.balloon / months);
const balSave = saveMonthly(bal);
const heavier = bal.firstPayment + balSave > even.firstPayment;
const sources = registrationTaxData().sources.filter(
  (s) => s.key === "rules.actualPrice",
);

const RATIOS = [0.3, 0.4, 0.5];
const byRatio = RATIOS.map((r) => ({ r, l: loan({ balloon: r }) }));
const RATES = [0.04, 0.06, 0.08];
const byRate = RATES.map((r) => ({
  r,
  l: loan({ rate: r }),
  e: loan({ rate: r, balloon: 0 }),
}));
const long = loan({ months: 48 });
const longEven = loan({ months: 48, balloon: 0 });

export default function Article({ meta }: { meta: GuideMeta }) {
  return (
    <GuideLayout
      meta={meta}
      summary={[
        <>
          {man(P)}을 연 {pct(RATE)}, {MONTHS}개월 유예할부(원금 {pct(BALLOON)}{" "}
          유예)로 빌리면 매달 {formatWon(bal.firstPayment)}을 내다가 마지막 달에{" "}
          <strong>{formatWon(bal.lastPayment)}</strong>을 한꺼번에 냅니다.
        </>,
        <>
          이 돈을 미리 모으려면 매달 {formatWon(balSave)}이 더 필요합니다.
          그러면 한 달 부담은 {formatWon(bal.firstPayment + balSave)}으로,
          원리금균등({formatWon(even.firstPayment)})보다{" "}
          {heavier ? "오히려 많고" : "조금 적지만"} 총이자는{" "}
          {formatWon(bal.totalInterest - even.totalInterest)} 더 냅니다.
        </>,
        <>
          유예 비율을 바꿔 가며 마지막 달 금액을 미리 보고 싶다면{" "}
          <Link href="/car-loan/">실구매가·할부 계산기</Link>의 상환 방식에서
          유예할부를 고르세요.
        </>,
      ]}
      faq={[
        {
          q: "유예할부는 왜 총이자가 더 많나요?",
          a: "유예한 원금은 마지막 달까지 줄지 않아, 그 금액에 대한 이자를 매달 계속 내기 때문입니다. 원리금균등은 원금이 매달 조금씩 줄어 이자도 함께 줄어듭니다.",
        },
        {
          q: "마지막 회차를 못 내면 어떻게 하나요?",
          a: "만기 때 다시 할부로 돌리거나 차를 팔아 갚는 등 방법은 금융사·상품마다 다릅니다. 계약 전에 만기 때 고를 수 있는 방법과 그 조건을 견적서에서 확인하세요.",
        },
        {
          q: "유예할부가 유리한 경우는 없나요?",
          a: "몇 년 뒤 목돈이 들어올 계획이 확실하거나, 만기 전에 차를 팔 계획이라 당장 월 부담을 줄이는 것이 중요할 때입니다. 그래도 총이자가 더 든다는 점은 같습니다.",
        },
      ]}
      sources={sources}
      disclaimer="원금·금리·유예 비율은 예시 가정이며, 실제 조건과 이자 계산 방식은 금융사 상품마다 다릅니다. 견적서와 약관을 기준으로 확인하세요."
    >
      <section data-article-section="conditions">
        <h2>계산 조건 (가정)</h2>
        <div className="table-wrap">
          <table>
            <tbody>
              <tr>
                <th scope="row">할부 원금</th>
                <td>{man(P)} (선수금·취득세 뺀 금액)</td>
              </tr>
              <tr>
                <th scope="row">금리·기간</th>
                <td>
                  연 {pct(RATE)}, {MONTHS}개월
                </td>
              </tr>
              <tr>
                <th scope="row">유예 비율</th>
                <td>원금의 {pct(BALLOON)}를 마지막 회차에</td>
              </tr>
              <tr>
                <th scope="row">이자 계산</th>
                <td>매달 남은 원금 × 연 금리 ÷ 12, 원 단위 반올림</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className="muted small">
          연 6%와 40% 유예는 계산을 따라가기 쉽게 고른 값이고, 특정 금융사
          상품의 조건이 아닙니다.
        </p>
      </section>

      <section data-article-section="steps">
        <h2>단계별 계산</h2>
        <ol>
          <li>
            <strong>유예 원금:</strong> {man(P)} × {pct(BALLOON)} ={" "}
            {formatWon(bal.balloon)}. 이 돈은 {MONTHS}개월 동안 갚지 않고 마지막
            달에 냅니다.
          </li>
          <li>
            <strong>매달 내는 돈:</strong> 나머지 원금을 {MONTHS}번에 나눠
            갚으면서, 유예 원금의 이자까지 매달 냅니다. 그래서 월 납입금이{" "}
            {formatWon(bal.firstPayment)}입니다.
          </li>
          <li>
            <strong>마지막 달:</strong> 그달 납입금에 유예 원금이 더해져{" "}
            {formatWon(bal.lastPayment)}입니다.
          </li>
          <li>
            <strong>총이자:</strong> 유예할부 {formatWon(bal.totalInterest)},
            같은 조건 원리금균등 {formatWon(even.totalInterest)}입니다.
          </li>
        </ol>

        <h3>원리금균등과 나란히 보면</h3>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th scope="col">항목</th>
                <th scope="col">원리금균등</th>
                <th scope="col">유예할부 {pct(BALLOON)}</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <th scope="row">월 납입금</th>
                <td>{formatWon(even.firstPayment)}</td>
                <td>{formatWon(bal.firstPayment)}</td>
              </tr>
              <tr>
                <th scope="row">마지막 달</th>
                <td>{formatWon(even.lastPayment)}</td>
                <td>{formatWon(bal.lastPayment)}</td>
              </tr>
              <tr>
                <th scope="row">유예금을 모으면 한 달 부담</th>
                <td>{formatWon(even.firstPayment)}</td>
                <td>{formatWon(bal.firstPayment + balSave)}</td>
              </tr>
              <tr>
                <th scope="row">총이자</th>
                <td>{formatWon(even.totalInterest)}</td>
                <td>{formatWon(bal.totalInterest)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section data-article-section="variations">
        <h2>조건이 바뀌면</h2>

        <h3 data-variation>
          유예 비율을 높이면: 월 부담은 줄고 마지막 달은 커진다
        </h3>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th scope="col">유예 비율</th>
                <th scope="col">월 납입금</th>
                <th scope="col">마지막 달</th>
                <th scope="col">총이자</th>
              </tr>
            </thead>
            <tbody>
              {byRatio.map(({ r, l }) => (
                <tr key={r}>
                  <td>{pct(r)}</td>
                  <td>{formatWon(l.firstPayment)}</td>
                  <td>{formatWon(l.lastPayment)}</td>
                  <td>{formatWon(l.totalInterest)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <h3 data-variation>
          금리가 높을수록: 유예한 만큼 이자 차이가 벌어진다
        </h3>
        <p>
          {byRate.map(({ r, l, e }, i) => (
            <span key={r}>
              {i > 0 ? " " : ""}연 {pct(r)}이면 유예할부가 원리금균등보다 이자를{" "}
              {formatWon(l.totalInterest - e.totalInterest)} 더 냅니다.
            </span>
          ))}{" "}
          유예한 원금에 붙는 이자가 금리에 비례하기 때문입니다.
        </p>

        <h3 data-variation>
          48개월로 늘리면: 매달은 더 가볍지만 이자는 더 붙는다
        </h3>
        <p>
          같은 {pct(BALLOON)} 유예로 48개월이면 월{" "}
          {formatWon(long.firstPayment)}, 마지막 달{" "}
          {formatWon(long.lastPayment)}, 총이자 {formatWon(long.totalInterest)}
          입니다. 48개월 원리금균등({formatWon(longEven.totalInterest)})과
          비교하면 {formatWon(long.totalInterest - longEven.totalInterest)} 더
          냅니다. 유예금을 모으려면 매달 {formatWon(saveMonthly(long, 48))}이
          필요합니다.
        </p>
      </section>

      <section data-article-section="pitfalls">
        <h2>놓치기 쉬운 것</h2>
        <ol>
          <li>
            <strong>월 납입금만 보고 고르지 마세요.</strong> 유예할부는 월
            부담이 작아 보이지만, 마지막 달 목돈과 더 많은 총이자를 함께 봐야
            합니다.
          </li>
          <li>
            <strong>
              차를 팔아 갚을 계획이라면 시세를 보수적으로 잡으세요.
            </strong>{" "}
            만기 때 중고 시세가 유예금보다 낮으면 차를 팔아도 부족한 돈을 따로
            마련해야 합니다.
          </li>
          <li>
            <strong>취득세는 할부와 따로입니다.</strong> 취득세는 등록할 때
            내며, 개인이 할부로 사도 할부 이자는 취득세 기준 금액에 들어가지
            않습니다. 계산은{" "}
            <Link href="/guides/cash-vs-car-installment/">
              현금 vs 할부 사례
            </Link>
            에 있습니다.
          </li>
        </ol>
      </section>
    </GuideLayout>
  );
}
