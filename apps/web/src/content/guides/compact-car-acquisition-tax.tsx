/**
 * 사례 분석 7: 경차 취득세 감면(75만원 한도) — 얼마짜리 경차부터 세금이 나오나.
 * 세율·감면은 확인된 데이터(registration-tax), 차값은 예시. 숫자는 calc-core로 빌드 때 계산한다.
 */
import {
  calcRegistrationTax,
  formatWon,
  type RegistrationTaxInput,
} from "@site/calc-core";
import { registrationTaxData } from "@site/data";
import Link from "next/link";
import { GuideLayout } from "@/components/GuideLayout";
import type { GuideMeta } from "@/lib/guides";
import { formatKoreanDate } from "@/lib/kst";

const reg = registrationTaxData();
const p = reg.params;
const def = reg.compactDefinition;
const BUY = "2027-03-15";
const pct = (r: number) => `${Math.round(r * 1000) / 10}%`;
const man = (won: number) =>
  `${Math.round(won / 10_000).toLocaleString("ko-KR")}만원`;

const input = (
  price: number,
  extra: Partial<RegistrationTaxInput> = {},
): RegistrationTaxInput => ({
  price,
  vatIncluded: true,
  compact: true,
  powertrain: "ice",
  seats7to10: false,
  childrenUnder18: 0,
  acquiredOn: BUY,
  ...extra,
});
const tax = (price: number, extra: Partial<RegistrationTaxInput> = {}) =>
  calcRegistrationTax(input(price, extra), p);

// 취득세가 0원인 가장 비싼 차값(부가세 포함, 1만원 단위)
const zeroLimit = (() => {
  let lo = 0;
  let hi = 5_000;
  while (lo < hi) {
    const mid = Math.ceil((lo + hi) / 2);
    if (tax(mid * 10_000).payable === 0) lo = mid;
    else hi = mid - 1;
  }
  return lo * 10_000;
})();

const prices = [
  14_000_000,
  18_000_000,
  20_000_000,
  zeroLimit,
  zeroLimit + 10_000,
  24_000_000,
];
const rows = prices.map((price) => ({ price, r: tax(price) }));
const base18 = tax(18_000_000);
const small18 = tax(18_000_000, { compact: false });
const after = tax(18_000_000, {
  acquiredOn: `${Number(p.compactRelief.until.slice(0, 4)) + 1}-01-10`,
});
const at24 = tax(24_000_000);

const sources = reg.sources.filter((s) =>
  [
    "values.rates",
    "values.compactRelief",
    "values.compactDefinition",
    "rules.overlap",
    "rules.taxBase",
    "rules.acquisitionDate",
  ].includes(s.key),
);

export default function Article({ meta }: { meta: GuideMeta }) {
  return (
    <GuideLayout
      meta={meta}
      summary={[
        <>
          개인이 쓰려고 사는 경차는 취득세율이 {pct(p.rates.compact)}이고,
          계산한 취득세가 {formatWon(p.compactRelief.capWon)} 이하면 한 푼도
          내지 않습니다.
        </>,
        <>
          그래서 부가세 포함 차값이 <strong>{man(zeroLimit)}</strong>까지는
          취득세가 0원이고, 그보다 비싸면 넘는 부분에만 세금이 붙습니다. 예를
          들어 {man(24_000_000)}짜리 경차는 {formatWon(at24.payable)}입니다(
          {formatKoreanDate(meta.asOf)} 현행법 기준).
        </>,
        <>
          견적서에 적힌 금액을{" "}
          <Link href="/registration-tax/">취등록세 계산기</Link>에 넣고 경차
          칸에 표시하면, 감면이 빠진 금액까지 한 화면에 보입니다.
        </>,
      ]}
      faq={[
        {
          q: "경차 기준이 정확히 뭔가요?",
          a: `배기량 ${def.maxCcExclusive.toLocaleString("ko-KR")}cc 미만이면서 길이 ${def.maxLengthM}m, 너비 ${def.maxWidthM}m, 높이 ${def.maxHeightM}m 이하인 차입니다. 전기로만 움직이는 차는 크기 기준만 봅니다.`,
        },
        {
          q: "경형 전기차는 두 감면을 다 받나요?",
          a: "아닙니다. 같은 취득세에 감면이 둘 이상이면 감면액이 큰 것 하나만 적용합니다. 전기차 감면 기한 안이면 보통 전기차 감면이 더 큽니다.",
        },
        {
          q: "감면받고 바로 영업용으로 써도 되나요?",
          a: "취득한 날부터 1년 안에 영업용으로 쓰면 감면받은 취득세를 다시 냅니다.",
        },
      ]}
      sources={sources}
    >
      <section data-article-section="conditions">
        <h2>계산 조건 (가정)</h2>
        <div className="table-wrap">
          <table>
            <tbody>
              <tr>
                <th scope="row">차</th>
                <td>휘발유 경형 승용차, 개인이 비영업용으로 구입</td>
              </tr>
              <tr>
                <th scope="row">차값</th>
                <td>판매 가격(부가세 포함) — 아래 표의 값은 예시</td>
              </tr>
              <tr>
                <th scope="row">취득일</th>
                <td>{formatKoreanDate(BUY)}</td>
              </tr>
              <tr>
                <th scope="row">그 밖의 감면</th>
                <td>없음</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className="muted small">
          표의 차값은 가격대별로 고른 숫자이고, 실제 판매 모델 가격과는
          관계없습니다.
        </p>
      </section>

      <section data-article-section="steps">
        <h2>단계별 계산</h2>
        <ol>
          <li>
            <strong>세금을 매길 금액부터:</strong> 1,800만원짜리 경차를 예로
            들면, 판매가에 들어 있는 부가세 몫을 덜어 낸{" "}
            {formatWon(base18.base)}에 세금을 매깁니다.
          </li>
          <li>
            <strong>경차 세율 적용:</strong> 일반 승용차(
            {pct(p.rates.passenger)})보다 낮은 {pct(p.rates.compact)}를 적용하면{" "}
            {formatWon(base18.computedTax)}이 나옵니다(10원 단위 아래는 버림).
          </li>
          <li>
            <strong>감면:</strong> 산출 취득세가{" "}
            {formatWon(p.compactRelief.capWon)} 이하라 전액 면제, 낼 취득세는{" "}
            <strong>{formatWon(base18.payable)}</strong>입니다.
          </li>
          <li>
            <strong>한도를 넘으면:</strong> {formatWon(p.compactRelief.capWon)}
            을 뺀 나머지를 냅니다. 이 감면은{" "}
            {formatKoreanDate(p.compactRelief.until)} 취득분까지입니다.
          </li>
        </ol>

        <h3>차값별 경차 취득세</h3>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th scope="col">차값(부가세 포함)</th>
                <th scope="col">산출 취득세</th>
                <th scope="col">낼 취득세</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(({ price, r }) => (
                <tr key={price}>
                  <td>{formatWon(price)}</td>
                  <td>{formatWon(r.computedTax)}</td>
                  <td>{formatWon(r.payable)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p>
          {formatWon(zeroLimit)}까지는 0원이고, 1만원만 비싸도 산출 취득세가
          한도를 넘어 {formatWon(rows[4]!.r.payable)}이 붙기 시작합니다. 그
          위로는 차값 100만원마다 취득세가 약{" "}
          {formatWon(
            Math.round((((1_000_000 * 10) / 11) * p.rates.compact) / 10) * 10,
          )}
          씩 늘어납니다.
        </p>
      </section>

      <section data-article-section="variations">
        <h2>조건이 바뀌면</h2>

        <h3 data-variation>
          1,000cc가 넘는 소형차라면: 같은 값에 {formatWon(small18.payable)}
        </h3>
        <p>
          차값이 같은 1,800만원이라도 배기량이 1,000cc를 넘으면 경차가 아니라
          세율 {pct(p.rates.passenger)}에 감면도 없습니다. 취득세가{" "}
          {formatWon(small18.payable)}으로, 경차보다 그만큼 더 냅니다. 비슷한
          가격대에서 차를 고를 때 빠뜨리기 쉬운 차이입니다.
        </p>

        <h3 data-variation>
          {Number(p.compactRelief.until.slice(0, 4)) + 1}년에 산다면:
          현행법으로는 감면이 끝난다
        </h3>
        <p>
          경차 감면은 {formatKoreanDate(p.compactRelief.until)}까지입니다. 법이
          그대로라면 {Number(p.compactRelief.until.slice(0, 4)) + 1}년 1월에 산
          1,800만원 경차는 산출 취득세 {formatWon(after.payable)}을 모두 냅니다.
          이 감면은 그동안 연장돼 온 적이 있으니, 그해 말에 개정 여부를 다시
          확인하세요.
        </p>

        <h3 data-variation>
          비싼 경차라면: {man(24_000_000)}에도 {formatWon(at24.payable)}
        </h3>
        <p>
          옵션을 많이 넣어 차값이 {man(24_000_000)}이 되면 산출 취득세는{" "}
          {formatWon(at24.computedTax)}이고, 감면{" "}
          {formatWon(p.compactRelief.capWon)}을 빼 {formatWon(at24.payable)}을
          냅니다. 같은 값의 일반 승용차라면{" "}
          {formatWon(tax(24_000_000, { compact: false }).payable)}입니다.
        </p>
      </section>

      <section data-article-section="pitfalls">
        <h2>놓치기 쉬운 것</h2>
        <ol>
          <li>
            <strong>크기 기준도 봅니다.</strong> 배기량이 1,000cc 미만이어도
            길이·너비·높이 중 하나라도 기준을 넘으면 경차가 아닙니다.
            차량등록증이나 제원표의 차종 구분을 확인하세요.
          </li>
          <li>
            <strong>할인받은 값이 기준입니다.</strong> 취득세는 실제로 낸
            차값(부가세 제외)으로 계산합니다. 일시불 할인을 받았다면 할인된
            금액, 할부라면 할부 이자는 빼고 계산합니다.
          </li>
          <li>
            <strong>경형 전기차는 다른 감면과 겹칩니다.</strong> 감면은 큰 것
            하나만 받으므로, 경형 전기차의 12월·1월 차이는{" "}
            <Link href="/guides/ev-acquisition-tax-year-end/">
              전기차 취득세 사례
            </Link>
            에서 확인하세요.
          </li>
        </ol>
      </section>
    </GuideLayout>
  );
}
