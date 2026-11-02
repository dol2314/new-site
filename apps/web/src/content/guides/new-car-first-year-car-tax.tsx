/**
 * 사례 분석 13: 새 차를 등록한 해의 자동차세 — 등록 달에 따라 얼마 다른가.
 * 신규등록 일할계산(지방세법 제130조제1항·시행령 제126조·운영예규 법130-1)과 세율은 확인된 데이터, 등록일·배기량은 예시.
 * 숫자는 calc-core로 빌드 때 계산한다.
 */
import {
  calcCarTax,
  calcNewRegistrationTax,
  formatWon,
  type FuelType,
} from "@site/calc-core";
import { carTaxData, ownershipData } from "@site/data";
import Link from "next/link";
import { GuideLayout } from "@/components/GuideLayout";
import type { GuideMeta } from "@/lib/guides";
import { formatKoreanDate } from "@/lib/kst";

const Y = 2027;
const data = carTaxData(Y);
const own = ownershipData();
const t = data.tax;
const CC = 1999;
const short = (d: string) =>
  `${Number(d.slice(5, 7))}월 ${Number(d.slice(8, 10))}일`;

const firstYear = (reg: string, fuelType: FuelType = "gasoline") => {
  const tax = calcCarTax(
    {
      fuelType,
      displacementCc: fuelType === "electric" ? undefined : CC,
      ageStartDate: reg,
      taxYear: Y,
    },
    t,
  );
  const nr = calcNewRegistrationTax(tax, reg, {
    ...own.newRegistration,
    educationTaxRate: t.educationTaxRate,
    truncateUnit: t.truncateUnit,
  });
  return { tax, nr };
};

const DATES = [
  `${Y}-01-04`,
  `${Y}-03-02`,
  `${Y}-06-25`,
  `${Y}-07-01`,
  `${Y}-10-15`,
  `${Y}-12-20`,
];
const rows = DATES.map((d) => ({
  d,
  ice: firstYear(d),
  ev: firstYear(d, "electric"),
}));
const jan = rows[0]!.ice;
const mar = rows[1]!.ice;
const lateJune = rows[2]!.ice;
const july = rows[3]!.ice;
const dec = rows[5]!.ice;
const full = jan.tax.annualTotal;

// 2천원 미만 미징수: 전기차를 12월 31일에 등록하면
const evLast = firstYear(`${Y}-12-31`, "electric").nr;

const sources = data.sources
  .filter((s) =>
    [
      "values.ccBrackets",
      "values.flatAnnualWon",
      "values.educationTaxRate",
      "values.dueDates",
    ].includes(s.key),
  )
  .concat(
    own.sources.filter((s) =>
      ["rules.newRegistrationProrate", "values.prorateMinWon"].includes(s.key),
    ),
  );

export default function Article({ meta }: { meta: GuideMeta }) {
  return (
    <GuideLayout
      meta={meta}
      summary={[
        <>
          새 차를 등록한 해에는 1년치 자동차세를 다 내지 않습니다. 등록한 반기는
          등록일부터 반기 말까지 날짜만큼, 그 뒤 반기는 정해진 금액을 냅니다.
        </>,
        <>
          같은 {CC.toLocaleString("ko-KR")}cc 새 차라도 연초 등록과 연말 등록은
          첫해 세금이{" "}
          <strong>{formatWon(jan.nr.yearTotal - dec.nr.yearTotal)}</strong> 차이
          납니다. 1월 초 등록은 거의 1년치, 12월 하순 등록은 열흘 남짓한
          날짜분만 내기 때문입니다({formatKoreanDate(meta.asOf)} 세율 기준).
        </>,
        <>
          등록 다음 해부터의 1년 세금은{" "}
          <Link href="/car-tax/">자동차세 계산기</Link>로, 차값까지 넣은 5년
          비교는 실구매가 계산기로 확인할 수 있습니다.
        </>,
      ]}
      faq={[
        {
          q: "등록한 날도 세금에 들어가나요?",
          a: "네. 행정안전부 운영 예규는 신규등록 자동차의 사용일수를 신규등록일부터 센다고 정합니다.",
        },
        {
          q: "등록한 해 세금은 언제 고지되나요?",
          a: "등록한 반기의 일할 세금은 수시로 부과될 수 있고, 남은 반기는 6월·12월 정기분으로 나옵니다. 정확한 고지 시기는 관할 시·군·구에서 정합니다.",
        },
        {
          q: "등록한 다음 해에는 얼마를 내나요?",
          a: `${CC.toLocaleString("ko-KR")}cc 휘발유차라면 차령 경감 전이라 1년 ${formatWon(full)}입니다. 1월에 연납하면 공제를 받을 수 있습니다.`,
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
                  새 휘발유 승용차 {CC.toLocaleString("ko-KR")}cc, 비교로 전기
                  승용차 (개인 비영업용)
                </td>
              </tr>
              <tr>
                <th scope="row">등록</th>
                <td>{Y}년 안의 여러 날짜 (만든 해에 등록)</td>
              </tr>
              <tr>
                <th scope="row">금액</th>
                <td>등록한 해에 내는 자동차세 + 지방교육세</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className="muted small">
          등록일과 배기량은 계산 방식을 보여 주기 위한 예시입니다.
        </p>
      </section>

      <section data-article-section="steps">
        <h2>단계별 계산</h2>
        <ol>
          <li>
            <strong>1년치 기준:</strong> {CC.toLocaleString("ko-KR")}cc ×{" "}
            {t.ccBrackets[2]!.wonPerCc}원 = {formatWon(jan.tax.baseAnnual)}. 새
            차는 차령 경감이 없습니다.
          </li>
          <li>
            <strong>등록한 반기:</strong> 3월 2일 등록이면 3월 2일부터 6월
            30일까지 {mar.nr.days}일입니다. {formatWon(jan.tax.baseAnnual)} ×{" "}
            {mar.nr.days}/365를 10원 미만 버림하면 {formatWon(mar.nr.carTax)},
            교육세를 더해 {formatWon(mar.nr.total)}입니다.
          </li>
          <li>
            <strong>남은 반기:</strong> 7~12월분은 정해진 대로{" "}
            {formatWon(mar.tax.halves[1].total)}을 냅니다.
          </li>
          <li>
            <strong>그해 합계:</strong> {formatWon(mar.nr.total)} +{" "}
            {formatWon(mar.tax.halves[1].total)} ={" "}
            <strong>{formatWon(mar.nr.yearTotal)}</strong>.
          </li>
        </ol>

        <h3>등록일별 그해 자동차세</h3>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th scope="col">등록일</th>
                <th scope="col">{CC.toLocaleString("ko-KR")}cc 휘발유</th>
                <th scope="col">전기차</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(({ d, ice, ev }) => (
                <tr key={d}>
                  <td>{short(d)}</td>
                  <td>{formatWon(ice.nr.yearTotal)}</td>
                  <td>{formatWon(ev.nr.yearTotal)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section data-article-section="variations">
        <h2>조건이 바뀌면</h2>

        <h3 data-variation>6월 말과 7월 초: 며칠 차이에 금액은 비슷</h3>
        <p>
          6월 25일 등록은 상반기 {lateJune.nr.days}일분{" "}
          {formatWon(lateJune.nr.total)}에 하반기 전액{" "}
          {formatWon(lateJune.tax.halves[1].total)}을 더해{" "}
          {formatWon(lateJune.nr.yearTotal)}입니다. 7월 1일 등록은 하반기
          184일을 날짜로 계산해 {formatWon(july.nr.yearTotal)}입니다. 반기가
          바뀌는 날짜 전후로 큰 차이는 없습니다.
        </p>

        <h3 data-variation>연말에 등록하면: 그해 세금은 거의 없다</h3>
        <p>
          12월 20일에 등록하면 12일분 {formatWon(dec.nr.yearTotal)}만 냅니다.
          전기차를 12월 31일에 등록하면 하루분 세금이{" "}
          {formatWon(own.newRegistration.minCollectWon)}이 안 돼 아예 걷지
          않습니다
          {evLast.waived ? "" : ` (${formatWon(evLast.total)})`}.
        </p>

        <h3 data-variation>전기차라면: 정액 기준으로 같은 방식</h3>
        <p>
          전기차도 1년 정액 {formatWon(t.flatAnnualWon)}을 같은 방식으로
          날짜만큼 나눕니다. 1월 4일 등록이면 그해{" "}
          {formatWon(rows[0]!.ev.nr.yearTotal)}, 10월 15일 등록이면{" "}
          {formatWon(rows[4]!.ev.nr.yearTotal)}입니다.
        </p>
      </section>

      <section data-article-section="pitfalls">
        <h2>놓치기 쉬운 것</h2>
        <ol>
          <li>
            <strong>연말 등록을 노리기 전에 다른 세금도 보세요.</strong>{" "}
            자동차세는 몇십만 원 차이지만, 전기차 취득세 감면처럼 해가 바뀌면
            끝나는 감면은 훨씬 큽니다.{" "}
            <Link href="/guides/ev-acquisition-tax-year-end/">
              전기차 취득세 사례
            </Link>
            를 함께 보세요.
          </li>
          <li>
            <strong>차령은 등록일부터 셉니다.</strong> 만든 해에 등록한 차는
            등록일이 차령 기산일이라, 등록 월에 따라 몇 년 뒤 경감이 시작되는
            시점도 달라집니다.
          </li>
          <li>
            <strong>다음 해 1월 연납을 챙기세요.</strong> 등록 다음 해부터는
            1월에 1년치를 미리 내면 공제를 받습니다. 계산은{" "}
            <Link href="/guides/car-tax-prepay-timing/">연납 사례</Link>에
            있습니다.
          </li>
        </ol>
      </section>
    </GuideLayout>
  );
}
