/**
 * 사례 분석 17: 선수금 비율별 할부 총이자 — 선수금을 늘리면 이자가 얼마나 주나, 그 돈을 예금에 두면 어떤가.
 * 할부 산식·예금 이자는 calc-core, 차값·금리·예금 금리는 예시 가정값. 숫자는 빌드 때 계산한다.
 */
import {
  calcLoan,
  depositInterestWhilePaying,
  formatWon,
} from "@site/calc-core";
import { registrationTaxData } from "@site/data";
import Link from "next/link";
import { GuideLayout } from "@/components/GuideLayout";
import type { GuideMeta } from "@/lib/guides";

const PRICE = 35_000_000;
const RATE = 0.07;
const MONTHS = 48;
const DEPOSIT = 0.03;
const pct = (r: number) =>
  `${(Math.round(r * 1000) / 10).toLocaleString("ko-KR")}%`;
const man = (won: number) =>
  `${Math.round(won / 10_000).toLocaleString("ko-KR")}만원`;

const loanFor = (down: number, rate = RATE, months = MONTHS) =>
  calcLoan({
    principal: PRICE - down,
    annualRate: rate,
    months,
    method: "equal-payment",
  });

const RATIOS = [0, 0.1, 0.2, 0.3, 0.4, 0.5];
const rows = RATIOS.map((r) => ({ r, down: PRICE * r, l: loanFor(PRICE * r) }));
const none = rows[0]!.l;
const step = PRICE * 0.1;
const saveStep = none.totalInterest - rows[1]!.l.totalInterest;
// 선수금으로 낼 돈을 예금에 두고, 그 돈만큼 더 빌려서 늘어난 할부금을 예금에서 꺼내 낼 때 받는 이자
const depStep = depositInterestWhilePaying(
  calcLoan({
    principal: step,
    annualRate: RATE,
    months: MONTHS,
    method: "equal-payment",
  }),
  step,
  DEPOSIT,
);

const lowRate = 0.04;
const lowNone = loanFor(0, lowRate);
const lowTen = loanFor(step, lowRate);
const lowSave = lowNone.totalInterest - lowTen.totalInterest;
const lowDep = depositInterestWhilePaying(
  calcLoan({
    principal: step,
    annualRate: lowRate,
    months: MONTHS,
    method: "equal-payment",
  }),
  step,
  DEPOSIT,
);

const short = 24;
const shortNone = loanFor(0, RATE, short);
const shortTen = loanFor(step, RATE, short);

const sources = registrationTaxData().sources.filter(
  (s) => s.key === "rules.actualPrice",
);

export default function Article({ meta }: { meta: GuideMeta }) {
  return (
    <GuideLayout
      meta={meta}
      summary={[
        <>
          처음에 {man(step)}을 더 내면 {MONTHS}개월 동안 낼 이자가 약{" "}
          <strong>{formatWon(saveStep)}</strong> 줄어듭니다. {man(PRICE)} 차를
          한 푼도 먼저 내지 않고 연 {pct(RATE)}로 빌리면 이자만{" "}
          {formatWon(none.totalInterest)}이기 때문입니다.
        </>,
        <>
          이 {man(step)}을 선수금으로 내지 않고 연 {pct(DEPOSIT)} 예금에 둔 채,
          그만큼 늘어난 할부금을 예금에서 꺼내 내면 세전 이자{" "}
          {formatWon(depStep)}을 받습니다. 줄어드는 할부 이자가{" "}
          {saveStep > depStep
            ? "더 커서 선수금을 내는 쪽이 이득입니다"
            : "더 작아서 예금에 두는 쪽이 낫습니다"}
          (금리는 예시).
        </>,
        <>
          받은 견적으로 바로 비교하려면{" "}
          <Link href="/car-loan/">실구매가·할부 계산기</Link>의 선수금 칸에
          금액을 바꿔 넣어 보세요.
        </>,
      ]}
      faq={[
        {
          q: "선수금은 많을수록 좋은가요?",
          a: "할부 금리가 예금 금리보다 높다면 이자만 보면 그렇습니다. 다만 비상금까지 털어 넣으면 급한 일이 생겼을 때 더 비싼 대출을 쓸 수 있으니, 생활비 몇 달치는 남겨 두는 편이 안전합니다.",
        },
        {
          q: "선수금을 내면 취득세도 줄어드나요?",
          a: "아닙니다. 취득세는 차값 기준이라 선수금과 할부 비율과는 관계없습니다. 개인이 할부로 사도 할부 이자는 취득세 기준 금액에 들어가지 않습니다.",
        },
        {
          q: "선수금 대신 기간을 줄이면 어떤가요?",
          a: "기간을 줄여도 총이자가 줄어듭니다. 대신 월 납입금이 커지니, 매달 낼 수 있는 금액과 처음에 낼 수 있는 금액을 함께 보고 고르세요.",
        },
      ]}
      sources={sources}
      disclaimer="이 글의 금리 7%, 예금 3%, 차값 3,500만원은 비교를 위해 고른 숫자입니다. 내 조건은 받은 견적서 숫자로 다시 계산하세요."
    >
      <section data-article-section="conditions">
        <h2>계산 조건 (가정)</h2>
        <div className="table-wrap">
          <table>
            <tbody>
              <tr>
                <th scope="row">할부 대상</th>
                <td>차값 {man(PRICE)} (취득세·등록 비용은 따로 냄)</td>
              </tr>
              <tr>
                <th scope="row">할부</th>
                <td>
                  연 {pct(RATE)}, {MONTHS}개월, 원리금균등
                </td>
              </tr>
              <tr>
                <th scope="row">비교 예금</th>
                <td>연 {pct(DEPOSIT)}, 세전, 단리</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className="muted small">
          차값과 금리는 선수금 효과를 보여 주려고 정한 숫자이며, 특정
          차종·상품이 아닙니다.
        </p>
      </section>

      <section data-article-section="steps">
        <h2>단계별 계산</h2>
        <ol>
          <li>
            <strong>할부 원금:</strong> 차값 − 선수금. 선수금 20%면{" "}
            {formatWon(PRICE - rows[2]!.down)}을 빌립니다.
          </li>
          <li>
            <strong>월 납입금:</strong> 원리금균등으로 {MONTHS}번 나누면 선수금
            20%일 때 매달 {formatWon(rows[2]!.l.firstPayment)}
            입니다.
          </li>
          <li>
            <strong>총이자:</strong> 낸 돈 합계 − 빌린 돈. 원금에 거의 비례해,
            빌리는 돈이 10% 줄면 이자도 약 10% 줄어듭니다.
          </li>
          <li>
            <strong>예금과 비교:</strong> 선수금으로 낼 돈을 예금에 두고 그만큼
            늘어난 할부금을 거기서 꺼내 낼 때 받는 이자와, 그 돈을 빌리지 않아
            줄어드는 할부 이자를 견줍니다.
          </li>
        </ol>

        <h3>선수금 비율별 할부</h3>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th scope="col">선수금</th>
                <th scope="col">월 납입금</th>
                <th scope="col">총이자</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(({ r, down, l }) => (
                <tr key={r}>
                  <td>{r === 0 ? "없음" : `${pct(r)} (${man(down)})`}</td>
                  <td>{formatWon(l.firstPayment)}</td>
                  <td>{formatWon(l.totalInterest)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section data-article-section="variations">
        <h2>조건이 바뀌면</h2>

        <h3 data-variation>금리가 낮은 상품이라면: 선수금 효과가 작아진다</h3>
        <p>
          연 {pct(lowRate)}라면 선수금 {man(step)}이 줄여 주는 이자는{" "}
          {formatWon(lowSave)}이고, 같은 방식으로 예금에 둘 때 받는 이자는{" "}
          {formatWon(lowDep)}입니다. 차이가{" "}
          {formatWon(Math.abs(lowSave - lowDep))}뿐이라 금리가 예금과 비슷한
          특판 할부라면 선수금을 늘려도 얻는 것이 크지 않습니다.
        </p>

        <h3 data-variation>기간이 짧다면: 줄어드는 이자도 작다</h3>
        <p>
          {short}개월 할부라면 선수금 없이 총이자{" "}
          {formatWon(shortNone.totalInterest)}, 선수금 {man(step)}이면{" "}
          {formatWon(shortTen.totalInterest)}입니다. 빌리는 기간이 짧을수록
          선수금으로 아끼는 이자도 줄어듭니다.
        </p>

        <h3 data-variation>절반을 선수금으로 낸다면: 월 부담이 크게 준다</h3>
        <p>
          선수금 50%({man(rows[5]!.down)})를 내면 월 납입금이{" "}
          {formatWon(rows[5]!.l.firstPayment)}으로, 선수금이 없을 때(
          {formatWon(none.firstPayment)})의 절반입니다. 총이자도{" "}
          {formatWon(none.totalInterest - rows[5]!.l.totalInterest)} 줄어듭니다.
        </p>
      </section>

      <section data-article-section="pitfalls">
        <h2>놓치기 쉬운 것</h2>
        <ol>
          <li>
            <strong>취득세와 등록 비용도 처음에 듭니다.</strong> 선수금 외에
            취득세와 등록 비용이 함께 나가니, 처음에 필요한 현금을 모두 더해
            보세요.
          </li>
          <li>
            <strong>프로모션 조건을 확인하세요.</strong> 선수금 비율에 따라
            금리를 다르게 주는 상품도 있어, 선수금을 바꾸면 금리가 같이 바뀌는지
            견적서에서 확인하세요.
          </li>
          <li>
            <strong>예금 이자는 세금을 떼기 전입니다.</strong> 실제로 받는
            이자는 이보다 적어, 선수금을 내는 쪽이 이 글의 비교보다 조금 더
            유리합니다.
          </li>
        </ol>
      </section>
    </GuideLayout>
  );
}
