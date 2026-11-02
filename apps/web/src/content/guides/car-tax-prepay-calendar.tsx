/**
 * 사례 분석 21: 2027년 자동차세 연납 일정 — 신청 기간 달력과 놓쳤을 때 다음 기회.
 * 기간·공제·다음 해 납부서·이사·매매 규칙은 확인된 데이터(car-tax), 차는 예시. 숫자는 calc-core로 빌드 때 계산한다.
 */
import { calcCarTax, calcPrepay, formatWon, parseDate } from "@site/calc-core";
import { carTaxData } from "@site/data";
import Link from "next/link";
import { GuideLayout } from "@/components/GuideLayout";
import type { GuideMeta } from "@/lib/guides";
import { formatKoreanDate } from "@/lib/kst";

const Y = 2027;
const data = carTaxData(Y);
const t = data.tax;
const CC = 1598;
const tax = calcCarTax(
  {
    fuelType: "gasoline",
    displacementCc: CC,
    ageStartDate: "2024-05-10",
    taxYear: Y,
  },
  t,
);
const DAYS = "일월화수목금토";
const dow = (d: string) => DAYS[new Date(parseDate(d)).getUTCDay()]!;
const md = (d: string) =>
  `${Number(d.slice(5, 7))}월 ${Number(d.slice(8, 10))}일(${dow(d)})`;

const windows = data.prepay.periods.map((p) => {
  const r = calcPrepay(tax, p.month, Y, data.prepay);
  return {
    p,
    r,
    start: `${Y}-${p.start}`,
    end: `${Y}-${p.end}`,
    rate: r.carTaxDiscount / tax.carTax,
  };
});
const janW = windows.find((w) => w.p.month === 1)!;
const sepW = windows.find((w) => w.p.month === 9)!;
const pct2 = (r: number) => `${(Math.round(r * 1000) / 10).toFixed(1)}%`;
const weekendEnd = ["토", "일"].includes(dow(janW.end));

const sources = data.sources.filter((s) =>
  [
    "values.prepayPeriods",
    "values.prepayRate",
    "rules.prepayNotice",
    "rules.prepayMove",
    "rules.prepayTransfer",
    "rules.installment",
  ].includes(s.key),
);

export default function Article({ meta }: { meta: GuideMeta }) {
  return (
    <GuideLayout
      meta={meta}
      summary={[
        <>
          {Y}년 자동차세 연납은 1월·3월·6월·9월 네 번 신청할 수 있습니다. 첫
          기회는{" "}
          <strong>
            {md(janW.start)}부터 {md(janW.end)}까지
          </strong>
          이고, 이때 내야 공제가 가장 큽니다.
        </>,
        <>
          기간마다 공제 폭이 달라, 첫 기간과 마지막 9월 기간의 차이가 예시 차
          기준 {formatWon(janW.r.saving - sepW.r.saving)}입니다. 늦게 신청해도
          공제가 사라지지는 않으니 놓쳤다면 다음 기간을 노리면 됩니다(
          {formatKoreanDate(meta.asOf)} 현행법 기준).
        </>,
        <>
          내 차의 기간별 공제액은 <Link href="/car-tax/">자동차세 계산기</Link>
          에서 바로 나옵니다.
        </>,
      ]}
      faq={[
        {
          q: "작년에 연납했는데 올해도 신청해야 하나요?",
          a: "연납한 사람에게 지자체가 다음 해 1월에 연납 납부서를 보낼 수 있지만, 보낼지는 지자체가 정합니다. 1월 중순까지 납부서가 없으면 직접 신고납부하세요.",
        },
        {
          q: "연납한 뒤 이사하면 다시 내나요?",
          a: "아닙니다. 연세액을 낸 뒤 차의 사용본거지가 바뀌어도 새 지역에서 그 해 자동차세를 다시 매기지 않습니다.",
        },
        {
          q: "연납한 차를 팔면요?",
          a: "소유 기간에 따라 날짜로 나눠 다시 계산하고, 이미 낸 세금은 일할계산 신청서로 돌려받거나, 판 사람이 동의하면 산 사람이 낸 것으로 볼 수 있습니다.",
        },
      ]}
      sources={sources}
    >
      <section data-article-section="conditions">
        <h2>계산 조건</h2>
        <div className="table-wrap">
          <table>
            <tbody>
              <tr>
                <th scope="row">차</th>
                <td>
                  휘발유 승용차 {CC.toLocaleString("ko-KR")}cc, 2024년 5월 등록
                  ({Y}년 차령 {tax.halves[0].carAge}년)
                </td>
              </tr>
              <tr>
                <th scope="row">1년 세금</th>
                <td>{formatWon(tax.annualTotal)} (자동차세 + 지방교육세)</td>
              </tr>
              <tr>
                <th scope="row">기준</th>
                <td>
                  {Y}년 신고납부 기간, 연납 공제 이자율{" "}
                  {Math.round(data.prepay.rate * 100)}%
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className="muted small">
          차는 계산을 보여 주기 위한 예시입니다. 요일은 {Y}년 달력 기준입니다.
        </p>
      </section>

      <section data-article-section="steps">
        <h2>단계별 계산</h2>
        <ol>
          <li>
            <strong>기간 고르기:</strong> 아래 네 기간 가운데 하나에 1년치를
            한꺼번에 신고납부합니다. 기간이 지나면 다음 기간을 기다려야 합니다.
          </li>
          <li>
            <strong>공제 계산:</strong> 1·3월은 1년 자동차세 × 남은 날 ÷ 365 ×
            5%, 6월은 7~12월분 × 5%, 9월은 7~12월분 × 남은 날 ÷ 184 × 5%입니다.
          </li>
          <li>
            <strong>교육세:</strong> 공제한 뒤의 자동차세에 지방교육세가 붙어,
            교육세도 같이 줄어듭니다.
          </li>
        </ol>

        <h3>{Y}년 연납 달력</h3>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th scope="col">신고납부 기간</th>
                <th scope="col">공제율(자동차세 대비)</th>
                <th scope="col">낼 돈</th>
                <th scope="col">아끼는 돈</th>
              </tr>
            </thead>
            <tbody>
              {windows.map((w) => (
                <tr key={w.p.month}>
                  <td>
                    {md(w.start)} ~ {md(w.end)}
                  </td>
                  <td>약 {pct2(w.rate)}</td>
                  <td>{formatWon(w.r.payTotal)}</td>
                  <td>{formatWon(w.r.saving)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {weekendEnd && (
          <p>
            {Y}년 1월 기간은 토요일에 시작해 일요일에 끝납니다. 주말 납부가
            되는지, 마감이 미뤄지는지는 납부서와 납부 사이트 안내를 확인하고,
            평일인 1월 마지막 주 초에 미리 내는 편이 안전합니다.
          </p>
        )}
      </section>

      <section data-article-section="variations">
        <h2>조건이 바뀌면</h2>

        <h3 data-variation>1월을 놓쳤다면: 3월이 다음 기회</h3>
        <p>
          3월 기간에 내면 공제가 {formatWon(windows[1]!.r.saving)}으로 1월보다{" "}
          {formatWon(janW.r.saving - windows[1]!.r.saving)} 적습니다. 3월에는
          분할납부 기간도 겹치니, 공제를 받으려면 1년치 연납으로 신고해야
          합니다.
        </p>

        <h3 data-variation>3월도 놓쳤다면: 6월에는 하반기분만 공제</h3>
        <p>
          6월 기간에는 1~6월분을 고지대로 내면서 7~12월분까지 한꺼번에 내는
          방식이라, 공제는 7~12월분의 5%인 {formatWon(windows[2]!.r.saving)}
          입니다. 9월이 마지막 기회이고, 그때는 {formatWon(sepW.r.saving)}으로
          줄어듭니다.
        </p>

        <h3 data-variation>새 차를 연중에 샀다면: 다음 해 1월부터</h3>
        <p>
          새로 등록한 해에는 등록한 반기를 날짜만큼 계산해 고지되므로, 연납은
          보통 다음 해 1월부터 챙기면 됩니다. 등록한 해의 세금은{" "}
          <Link href="/guides/new-car-first-year-car-tax/">
            새 차 첫해 자동차세 사례
          </Link>
          에 있습니다.
        </p>
      </section>

      <section data-article-section="pitfalls">
        <h2>놓치기 쉬운 것</h2>
        <ol>
          <li>
            <strong>1월 기간은 보름 남짓입니다.</strong> 16일에 열려 그달 말에
            닫히고 연초 다른 지출과 겹치기 쉬우니, 휴대폰 달력에 시작일 알림을
            맞춰 두세요.
          </li>
          <li>
            <strong>달력에 네 기간을 적어 두세요.</strong> 1월 16~31일, 3월
            16~31일, 6월 16~30일, 9월 16~30일입니다. 모두 매달 16일에
            시작합니다.
          </li>
          <li>
            <strong>공제율은 법령으로 정합니다.</strong> 공제 이자율(지금 5%)은
            시행령으로 정해 바뀔 수 있어, 해마다 연초에 이 글을 확인해 고칩니다.
          </li>
        </ol>
      </section>
    </GuideLayout>
  );
}
