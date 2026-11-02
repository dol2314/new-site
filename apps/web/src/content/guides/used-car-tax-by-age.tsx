/**
 * 사례 분석 12: 중고차 자동차세 — 최초 등록 연·월에 따라 얼마나 싸지나(차령 계산, 반년 차이, 해 넘긴 재고차).
 * 세율·경감·차령 규칙은 확인된 데이터(car-tax), 등록일은 예시. 숫자는 calc-core로 빌드 때 계산한다.
 */
import { ageStartDate, calcCarTax, formatWon } from "@site/calc-core";
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
const pct = (r: number) => `${Math.round(r * 100)}%`;
const paramsFor = (y: number) => own.carTaxByYear[Math.min(y, own.latestYear)]!;
const taxOf = (start: string, year = Y) =>
  calcCarTax(
    {
      fuelType: "gasoline",
      displacementCc: CC,
      ageStartDate: start,
      taxYear: year,
    },
    paramsFor(year),
  );

// 최초 등록 연도별(3월 등록) Y년 세금
const REG_YEARS = [2025, 2023, 2021, 2019, 2017, 2015, 2013];
const byYear = REG_YEARS.map((ry) => ({ ry, r: taxOf(`${ry}-03-10`) }));
const newest = taxOf(`${Y - 1}-03-10`);

// 같은 해 3월 vs 9월 등록
const mar = taxOf("2022-03-10");
const sep = taxOf("2022-09-10");

// 해 넘겨 등록한 재고차: 2026년식을 2027년 1월 등록 vs 2027년식 2027년 1월 등록
const stockStart = ageStartDate("2027-01-15", 2026);
const freshStart = ageStartDate("2027-01-15", 2027);
const stock = [2028, 2029].map((y) => taxOf(stockStart, y));
const fresh = [2028, 2029].map((y) => taxOf(freshStart, y));

// 12년 넘은 차
const old12 = taxOf("2015-03-10");
const old16 = taxOf("2011-03-10");

const sources = data.sources.filter((s) =>
  [
    "values.ccBrackets",
    "values.ageReduction",
    "values.educationTaxRate",
    "rules.carAge",
  ].includes(s.key),
);

export default function Article({ meta }: { meta: GuideMeta }) {
  return (
    <GuideLayout
      meta={meta}
      summary={[
        <>
          배기량으로 세금을 매기는 승용차는 차령 3년부터 해마다{" "}
          {pct(t.ageReduction.perYearRate)}씩, 12년 이상이면{" "}
          {pct(
            (t.ageReduction.maxAge - t.ageReduction.minAge) *
              t.ageReduction.perYearRate,
          )}
          까지 자동차세가 줄어듭니다.
        </>,
        <>
          거의 새 차인 {CC.toLocaleString("ko-KR")}cc 중고차와 12년 넘은 같은
          배기량 중고차는 {Y}년 한 해 세금만{" "}
          <strong>{formatWon(newest.annualTotal - old12.annualTotal)}</strong>{" "}
          차이 납니다. 매물을 고를 때 최초 등록일을 보면 앞으로 낼 세금이
          보입니다({formatKoreanDate(meta.asOf)} 세율 기준).
        </>,
        <>
          사려는 차의 최초 등록일을{" "}
          <Link href="/car-tax/">자동차세 계산기</Link>에 넣으면 올해와 내년
          세금이 나옵니다.
        </>,
      ]}
      faq={[
        {
          q: "연식이 같으면 자동차세도 같나요?",
          a: "아닙니다. 최초 등록일이 1~6월인지 7~12월인지에 따라 상반기분 차령이 1년 달라져, 같은 해 등록한 차라도 상반기 세금이 다를 수 있습니다.",
        },
        {
          q: "차령은 어디서 확인하나요?",
          a: "자동차등록증의 최초등록일과 제작연도를 보세요. 만든 해에 등록한 차는 최초등록일부터, 해를 넘겨 등록한 차는 만든 해의 12월 31일부터 셉니다.",
        },
        {
          q: "중고차를 산 해의 세금은 누가 내나요?",
          a: "과세기간 중에 소유권을 넘기면 이전등록일을 기준으로 판 사람과 산 사람이 각자 가진 기간만큼 나눠 냅니다. 1년치를 산 사람이 다 내는 것이 아닙니다.",
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
                  휘발유 승용차 {CC.toLocaleString("ko-KR")}cc, 개인 비영업용
                </td>
              </tr>
              <tr>
                <th scope="row">세금 연도</th>
                <td>{Y}년 (자동차세 + 지방교육세, 1년치)</td>
              </tr>
              <tr>
                <th scope="row">최초 등록</th>
                <td>만든 해에 등록, 3월 (변형에서 9월·해 넘긴 등록)</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className="muted small">
          특정 매물의 고지액이 아니라 차령에 따른 세금 변화를 보여 주기 위한
          예시입니다.
        </p>
      </section>

      <section data-article-section="steps">
        <h2>단계별 계산</h2>
        <ol>
          <li>
            <strong>경감 전 1년 세금:</strong> {CC.toLocaleString("ko-KR")}cc ×
            cc당 {t.ccBrackets[2]!.wonPerCc}원 = {formatWon(newest.baseAnnual)}.
            상반기·하반기로 절반씩 나눕니다.
          </li>
          <li>
            <strong>차령 세기:</strong> 기산일이 1~6월이면 &quot;세금 연도 −
            기산 연도 + 1&quot;입니다. 2019년 3월 등록 차는 {Y}년에 차령{" "}
            {taxOf("2019-03-10").halves[0].carAge}년입니다.
          </li>
          <li>
            <strong>경감:</strong> 반기마다 (차령 − 2) ×{" "}
            {pct(t.ageReduction.perYearRate)}를 깎습니다. 차령{" "}
            {taxOf("2019-03-10").halves[0].carAge}년이면{" "}
            {pct(taxOf("2019-03-10").halves[0].reductionRate)}입니다.
          </li>
          <li>
            <strong>교육세:</strong> 경감 뒤 자동차세의{" "}
            {pct(t.educationTaxRate)}를 더하면 그 차의 1년 세금입니다.
          </li>
        </ol>

        <h3>최초 등록 연도별 {Y}년 자동차세</h3>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th scope="col">최초 등록</th>
                <th scope="col">차령</th>
                <th scope="col">경감</th>
                <th scope="col">1년 세금</th>
              </tr>
            </thead>
            <tbody>
              {byYear.map(({ ry, r }) => (
                <tr key={ry}>
                  <td>{ry}년 3월</td>
                  <td>{r.halves[0].carAge}년</td>
                  <td>{pct(r.halves[0].reductionRate)}</td>
                  <td>{formatWon(r.annualTotal)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section data-article-section="variations">
        <h2>조건이 바뀌면</h2>

        <h3 data-variation>
          같은 해라도 9월 등록이면: 상반기분이 1년 덜 깎인다
        </h3>
        <p>
          2022년 3월에 등록한 차는 {Y}년 상·하반기 모두 차령{" "}
          {mar.halves[0].carAge}년입니다. 9월에 등록한 차는 상반기 차령이{" "}
          {sep.halves[0].carAge}년, 하반기가 {sep.halves[1].carAge}년이라 {Y}년
          세금이 {formatWon(sep.annualTotal)}
          으로 3월 등록 차({formatWon(mar.annualTotal)})보다{" "}
          {formatWon(sep.annualTotal - mar.annualTotal)} 많습니다. 연식이 같은
          매물이라도 등록 월을 보면 세금 차이를 알 수 있습니다.
        </p>

        <h3 data-variation>해를 넘겨 등록한 차라면: 경감이 반년 빨리 온다</h3>
        <p>
          2026년에 만든 차를 {Y}년 1월에 처음 등록하면 차령은 만든 해 12월
          31일부터 셉니다. 그래서 2028년 세금은{" "}
          {formatWon(stock[0]!.annualTotal)}, 2029년은{" "}
          {formatWon(stock[1]!.annualTotal)}입니다. 같은 날 등록한 {Y}년식은
          2028년 {formatWon(fresh[0]!.annualTotal)}, 2029년{" "}
          {formatWon(fresh[1]!.annualTotal)}이라, 두 해 동안{" "}
          {formatWon(
            fresh[0]!.annualTotal +
              fresh[1]!.annualTotal -
              stock[0]!.annualTotal -
              stock[1]!.annualTotal,
          )}{" "}
          덜 냅니다.
        </p>

        <h3 data-variation>12년이 넘으면: 더 오래돼도 같다</h3>
        <p>
          경감은 차령 12년에서 멈춥니다. 2015년 3월 등록 차와 2011년 3월 등록
          차는 {Y}년에 둘 다 {formatWon(old16.annualTotal)}으로 같습니다. 12년
          넘은 차끼리는 연식 차이가 세금에 영향을 주지 않습니다.
        </p>
      </section>

      <section data-article-section="pitfalls">
        <h2>놓치기 쉬운 것</h2>
        <ol>
          <li>
            <strong>광고의 연식과 차령이 다를 수 있습니다.</strong> 판매 광고는
            모델 연도로 표기하는 경우가 많지만, 세금은 등록증의
            최초등록일·제작연도로 셉니다.
          </li>
          <li>
            <strong>전기차는 경감이 없습니다.</strong> 정액 세금이라 오래된
            전기차도 같은 금액입니다. 자세한 비교는{" "}
            <Link href="/guides/ev-car-tax-flat-rate/">
              전기차 자동차세 사례
            </Link>
            에 있습니다.
          </li>
          <li>
            <strong>살 해에는 세금이 나뉩니다.</strong> 매매한 해의 자동차세는
            이전등록일을 기준으로 판 사람과 나눠 내므로, 위 표의 1년치를 그해에
            다 내는 것은 아닙니다.
          </li>
        </ol>
      </section>
    </GuideLayout>
  );
}
