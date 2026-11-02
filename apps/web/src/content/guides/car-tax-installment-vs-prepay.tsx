/**
 * 사례 분석 15: 자동차세 분할납부 vs 연납 — 1년에 네 번 나눠 낼까, 한 번에 내고 공제받을까.
 * 납기·분할납부·연납 공제는 확인된 데이터(car-tax), 차는 예시. 숫자는 calc-core로 빌드 때 계산한다.
 */
import {
  calcCarTax,
  calcPrepay,
  formatWon,
  splitInstallments,
  type CarTaxResult,
} from "@site/calc-core";
import { carTaxData } from "@site/data";
import Link from "next/link";
import { GuideLayout } from "@/components/GuideLayout";
import type { GuideMeta } from "@/lib/guides";
import { formatKoreanDate } from "@/lib/kst";

const Y = 2027;
const data = carTaxData(Y);
const t = data.tax;
const CC = 2497;
const tax = calcCarTax(
  {
    fuelType: "gasoline",
    displacementCc: CC,
    ageStartDate: "2022-04-20",
    taxYear: Y,
  },
  t,
);
const pct = (r: number) => `${Math.round(r * 100)}%`;

const split = (x: CarTaxResult) => {
  const r = splitInstallments(x, t.educationTaxRate, t.truncateUnit);
  return {
    mar: r.march,
    jun: r.june,
    sep: r.september,
    dec: r.december,
    total: r.total,
  };
};
const s = split(tax);
const jan = calcPrepay(tax, 1, Y, data.prepay);
const mar = calcPrepay(tax, 3, Y, data.prepay);
const jun = calcPrepay(tax, 6, Y, data.prepay);

// 변형: 경차(연세액 10만원 이하 → 6월 일괄 고지 가능)
const kei = calcCarTax(
  {
    fuelType: "gasoline",
    displacementCc: 998,
    ageStartDate: "2022-04-20",
    taxYear: Y,
  },
  t,
);
const keiSplit = split(kei);
// 변형: 오래된 대형차
const big = calcCarTax(
  {
    fuelType: "gasoline",
    displacementCc: 3342,
    ageStartDate: "2014-04-20",
    taxYear: Y,
  },
  t,
);
const bigSplit = split(big);
const bigJan = calcPrepay(big, 1, Y, data.prepay);

const sources = data.sources.filter((x) =>
  [
    "values.dueDates",
    "rules.installment",
    "values.prepayRate",
    "values.prepayPeriods",
    "values.smallTaxRule",
    "values.ageReduction",
  ].includes(x.key),
);

export default function Article({ meta }: { meta: GuideMeta }) {
  return (
    <GuideLayout
      meta={meta}
      summary={[
        <>
          자동차세는 원래 6월과 12월 두 번 냅니다. 신청하면 이를 3·6·9·12월 네
          번으로 쪼갤 수 있지만(분할납부), 총액은 그대로이고 깎아 주는 돈이
          없습니다.
        </>,
        <>
          {CC.toLocaleString("ko-KR")}cc 차(2022년 4월 등록)의 {Y}년 세금{" "}
          {formatWon(s.total)}을 분할하면 석 달마다 약 {formatWon(s.mar)}씩
          냅니다. 같은 돈을 1월에 한꺼번에 내면{" "}
          <strong>{formatWon(jan.saving)}</strong>, 3월이면{" "}
          {formatWon(mar.saving)}을 아낍니다({formatKoreanDate(meta.asOf)}{" "}
          현행법 기준).
        </>,
        <>
          내 차의 달별 금액은 <Link href="/car-tax/">자동차세 계산기</Link>에서
          연납 공제와 함께 볼 수 있습니다.
        </>,
      ]}
      faq={[
        {
          q: "분할납부는 어떻게 신청하나요?",
          a: "분할납부는 납세자가 신청해야 적용됩니다. 신청 방법과 기한은 관할 시·군·구나 지방세 납부 사이트 안내를 따르세요.",
        },
        {
          q: "분할납부와 연납을 같이 할 수 있나요?",
          a: "3월에는 1~6월분 절반을 내는 분할납부와, 1년치를 공제받고 내는 연납이 같은 기간(3월 16~31일)에 있습니다. 둘 중 하나를 고르는 것이고, 공제는 연납에만 있습니다.",
        },
        {
          q: "분할납부를 하면 손해인가요?",
          a: "더 내는 돈은 없습니다. 원래 6월·12월에 낼 돈의 절반을 석 달 먼저 낼 뿐이라, 이자로 따지면 오히려 조금 일찍 내는 셈입니다.",
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
                  휘발유 승용차 {CC.toLocaleString("ko-KR")}cc, 2022년 4월 최초
                  등록 ({Y}년 차령 {tax.halves[0].carAge}년, 경감{" "}
                  {pct(tax.halves[0].reductionRate)})
                </td>
              </tr>
              <tr>
                <th scope="row">세금</th>
                <td>
                  {Y}년 자동차세 + 지방교육세 {formatWon(s.total)}
                </td>
              </tr>
              <tr>
                <th scope="row">비교</th>
                <td>정기 고지(2회), 분할납부(4회), 1·3·6월 연납</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className="muted small">
          배기량과 등록일은 계산 구조를 보여 주기 위한 예시입니다.
        </p>
      </section>

      <section data-article-section="steps">
        <h2>단계별 계산</h2>
        <ol>
          <li>
            <strong>기분 나누기:</strong> 1~6월분{" "}
            {formatWon(tax.halves[0].total)}, 7~12월분{" "}
            {formatWon(tax.halves[1].total)}
            입니다. 차령 경감은 기분마다 따로 적용합니다.
          </li>
          <li>
            <strong>분할납부:</strong> 1~6월분의 절반은 3월 16~31일, 나머지는
            6월 납기에 냅니다. 7~12월분도 절반은 9월 16~30일, 나머지는 12월
            납기입니다.
          </li>
          <li>
            <strong>연납:</strong> 1년치를 한꺼번에 내면 남은 기간 세금에{" "}
            {pct(data.prepay.rate)} 이자율을 적용해 깎아 줍니다. 일찍 낼수록
            남은 기간이 길어 공제가 큽니다.
          </li>
        </ol>

        <h3>달별로 내는 돈</h3>
        <p className="muted small">
          분할 금액은 끝수 처리 방식에 따라 실제 고지액과 몇십 원 다를 수
          있습니다.
        </p>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th scope="col">방법</th>
                <th scope="col">1월</th>
                <th scope="col">3월</th>
                <th scope="col">6월</th>
                <th scope="col">9월</th>
                <th scope="col">12월</th>
                <th scope="col">합계</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>정기 고지</td>
                <td>—</td>
                <td>—</td>
                <td>{formatWon(tax.halves[0].total)}</td>
                <td>—</td>
                <td>{formatWon(tax.halves[1].total)}</td>
                <td>{formatWon(s.total)}</td>
              </tr>
              <tr>
                <td>분할납부</td>
                <td>—</td>
                <td>{formatWon(s.mar)}</td>
                <td>{formatWon(s.jun)}</td>
                <td>{formatWon(s.sep)}</td>
                <td>{formatWon(s.dec)}</td>
                <td>{formatWon(s.total)}</td>
              </tr>
              <tr>
                <td>1월 연납</td>
                <td>{formatWon(jan.payTotal)}</td>
                <td>—</td>
                <td>—</td>
                <td>—</td>
                <td>—</td>
                <td>{formatWon(jan.payTotal)}</td>
              </tr>
              <tr>
                <td>3월 연납</td>
                <td>—</td>
                <td>{formatWon(mar.payTotal)}</td>
                <td>—</td>
                <td>—</td>
                <td>—</td>
                <td>{formatWon(mar.payTotal)}</td>
              </tr>
              <tr>
                <td>6월 연납</td>
                <td>—</td>
                <td>—</td>
                <td>{formatWon(jun.payTotal)}</td>
                <td>—</td>
                <td>—</td>
                <td>{formatWon(jun.payTotal)}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p>
          분할납부의 장점은 한 번에 나가는 돈이 작다는 것뿐입니다. 아끼는 돈이
          목표라면 연납, 매달 가계 부담을 고르게 하는 게 목표라면
          분할납부입니다.
        </p>
      </section>

      <section data-article-section="variations">
        <h2>조건이 바뀌면</h2>

        <h3 data-variation>경차라면: 6월에 한 번에 나올 수 있다</h3>
        <p>
          998cc 경차의 {Y}년 자동차세는 {formatWon(kei.carTax)}으로{" "}
          {formatWon(data.smallTaxThresholdWon)} 이하입니다. 이런 차는 지자체가
          6월에 1년치를 한꺼번에 고지할 수 있어, 분할납부로 나눠도 한 번에 몇만
          원(3월 {formatWon(keiSplit.mar)}) 수준이라 나누는 의미가 크지
          않습니다.
        </p>

        <h3 data-variation>12년 넘은 대형차라면: 연납 공제도 절반</h3>
        <p>
          차령 경감이 최대인 오래된 3,342cc 차({formatWon(big.annualTotal)})는
          분할 첫 회가 {formatWon(bigSplit.mar)}이고, 1월 연납 공제는{" "}
          {formatWon(bigJan.saving)}에 그칩니다. 공제가 세금에 비례하니 세금이
          반으로 줄면 공제도 반으로 줄어듭니다.
        </p>

        <h3 data-variation>1월을 놓쳤다면: 3월에 분할 대신 연납</h3>
        <p>
          3월 16~31일에 1~6월분 절반({formatWon(s.mar)})만 내는 대신 1년치를
          내면 {formatWon(mar.payTotal)}을 내고 {formatWon(mar.saving)}을
          아낍니다. 한 번에 낼 돈이 있다면 같은 기간에 연납을 고르는 편이
          낫습니다.
        </p>
      </section>

      <section data-article-section="pitfalls">
        <h2>놓치기 쉬운 것</h2>
        <ol>
          <li>
            <strong>신청하지 않으면 분할되지 않습니다.</strong> 분할납부는
            납세자가 신청해야 적용되고, 신청하지 않으면 6월·12월 고지서가 그대로
            나옵니다.
          </li>
          <li>
            <strong>9월 분할분도 따로 챙기세요.</strong> 하반기분 절반은 9월
            16~30일입니다. 분할을 골랐다면 1년에 네 번 납부일을 달력에 적어
            두세요.
          </li>
          <li>
            <strong>연납 계산은 따로 있습니다.</strong> 달별 공제액을 더 자세히
            보려면{" "}
            <Link href="/guides/car-tax-prepay-timing/">연납 시기별 사례</Link>
            를 참고하세요.
          </li>
        </ol>
      </section>
    </GuideLayout>
  );
}
