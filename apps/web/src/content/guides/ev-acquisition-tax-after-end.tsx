/**
 * 사례 분석 1편의 "감면 종료 뒤" 판 — 전기차 취득세 감면(현행법 2026-12-31 취득분까지)이 끝난 뒤 2027년 취득분 계산.
 * 같은 주소(/guides/ev-acquisition-tax-year-end/)에서 빌드한 날이 기한을 지나면 이 판이 나온다(lib/guide-phase.ts).
 * 숫자는 모두 calc-core + 확인된 데이터로 빌드 때 계산한다.
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
const BUY = "2027-01-15";
const LAST = "2026-12-20";
const pct = (r: number) => `${Math.round(r * 1000) / 10}%`;
const man = (won: number) =>
  `${Math.round(won / 10_000).toLocaleString("ko-KR")}만원`;

const input = (
  o: Partial<RegistrationTaxInput> = {},
): RegistrationTaxInput => ({
  price: 45_000_000,
  vatIncluded: true,
  compact: false,
  powertrain: "electric",
  seats7to10: false,
  childrenUnder18: 0,
  acquiredOn: BUY,
  ...o,
});
const tax = (o: Partial<RegistrationTaxInput> = {}) =>
  calcRegistrationTax(input(o), p);

const now = tax();
const before = tax({ acquiredOn: LAST });
const PRICES = [
  25_000_000, 30_000_000, 40_000_000, 45_000_000, 55_000_000, 65_000_000,
];
const rows = PRICES.map((price) => ({
  price,
  n: tax({ price }),
  b: tax({ price, acquiredOn: LAST }),
}));

// 변형
const kei = tax({ price: 28_000_000, compact: true });
const keiAsNormal = tax({ price: 28_000_000 });
// 작년에 취득세가 0원이던 가장 비싼 차값(부가세 포함): 감면 한도 ÷ 세율 × 1.1
const zeroLastYear = Math.round(
  ((p.evRelief.capWon / p.rates.passenger) * 11) / 10,
);
const keiBefore = tax({ price: 28_000_000, compact: true, acquiredOn: LAST });
const h2 = tax({ price: 70_000_000, powertrain: "hydrogen" });
const VAN = 60_000_000;
const vanKids = tax({ price: VAN, seats7to10: true, childrenUnder18: 3 });
const vanNoKids = tax({ price: VAN, seats7to10: true });

const sources = reg.sources.filter((s) =>
  [
    "values.rates",
    "values.evRelief",
    "values.hydrogenRelief",
    "values.compactRelief",
    "values.multiChild",
    "values.minimumTax",
    "values.hybridRelief",
    "rules.acquisitionDate",
    "rules.subsidyInBase",
    "rules.overlap",
  ].includes(s.key),
);

export default function ArticleAfterEnd({ meta }: { meta: GuideMeta }) {
  return (
    <GuideLayout
      meta={meta}
      summary={[
        <>
          전기차 취득세 감면({formatWon(p.evRelief.capWon)} 한도)은{" "}
          {formatKoreanDate(p.evRelief.until)} 취득분으로 끝났습니다. 그 뒤에
          취득한 전기차는 일반 승용차와 같은 세율 {pct(p.rates.passenger)}를
          그대로 냅니다.
        </>,
        <>
          부가세 포함 {man(45_000_000)} 전기차라면{" "}
          <strong>{formatWon(now.payable)}</strong>으로, 감면이 있던 작년 12월(
          {formatWon(before.payable)})보다{" "}
          {formatWon(now.payable - before.payable)} 많습니다(
          {formatKoreanDate(meta.asOf)} 법령 확인 기준).
        </>,
        <>
          내 차값으로는 <Link href="/registration-tax/">취등록세 계산기</Link>
          에서 취득일을 넣으면 바로 계산됩니다.
        </>,
      ]}
      faq={[
        {
          q: "작년에 계약했는데 올해 차를 받으면 감면이 없나요?",
          a: "새 차의 취득일은 차를 인도받은 날과 계약서상 잔금지급일 가운데 빠른 날입니다. 잔금을 작년 12월 31일까지 치렀다면 작년 취득이라 감면 대상이 될 수 있으니, 계약서의 잔금지급일을 확인하세요.",
        },
        {
          q: "수소차와 경차 감면도 끝났나요?",
          a: `아닙니다. 현행법상 수소전기차 감면은 ${formatKoreanDate(p.hydrogenRelief.until)}, 경형 자동차 감면은 ${formatKoreanDate(p.compactRelief.until)} 취득분까지 남아 있습니다.`,
        },
        {
          q: "하이브리드는 감면이 있나요?",
          a: `하이브리드 취득세 감면은 이미 ${formatKoreanDate(reg.hybridRelief.until)}에 끝났습니다. 지금은 일반 승용차와 같은 세율입니다.`,
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
                <td>전기 승용차, 개인 비영업용</td>
              </tr>
              <tr>
                <th scope="row">차값</th>
                <td>{formatWon(45_000_000)} (부가세 포함, 보조금 빼기 전)</td>
              </tr>
              <tr>
                <th scope="row">취득일</th>
                <td>
                  {formatKoreanDate(BUY)} (비교: {formatKoreanDate(LAST)})
                </td>
              </tr>
              <tr>
                <th scope="row">그 밖의 감면</th>
                <td>없음 (변형에서 경차·수소차·다자녀)</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className="muted small">
          같은 차를 같은 값에 샀다고 놓고 취득일만 바꿔 작년 12월과
          비교했습니다.
        </p>
      </section>

      <section data-article-section="steps">
        <h2>단계별 계산</h2>
        <ol>
          <li>
            <strong>세금을 매길 금액:</strong> 차값에서 부가세 몫을 빼면{" "}
            {formatWon(now.base)}입니다. 보조금을 받아도 이 금액은 줄지
            않습니다.
          </li>
          <li>
            <strong>세율:</strong> 비영업용 승용차 {pct(p.rates.passenger)}를
            곱하고 10원 미만을 버리면 {formatWon(now.computedTax)}입니다.
          </li>
          <li>
            <strong>감면:</strong> 전기차 감면 기한이 지나 빼 줄 금액이
            없습니다. 낼 취득세는 <strong>{formatWon(now.payable)}</strong>
            입니다.
          </li>
          <li>
            <strong>작년과 비교:</strong> {formatKoreanDate(LAST)}에 취득했다면{" "}
            {formatWon(p.evRelief.capWon)}을 빼고 {formatWon(before.payable)}
            이었습니다.
          </li>
        </ol>

        <h3>차값별 취득세 (전기 승용차)</h3>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th scope="col">차값(부가세 포함)</th>
                <th scope="col">올해 취득</th>
                <th scope="col">작년 12월이었다면</th>
                <th scope="col">늘어난 금액</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(({ price, n, b }) => (
                <tr key={price}>
                  <td>{formatWon(price)}</td>
                  <td>{formatWon(n.payable)}</td>
                  <td>{formatWon(b.payable)}</td>
                  <td>{formatWon(n.payable - b.payable)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p>
          감면 한도가 {formatWon(p.evRelief.capWon)}이었기 때문에, 산출 취득세가
          그보다 큰 차는 모두 같은 금액만큼 늘었습니다. 부가세 포함 약{" "}
          {man(zeroLastYear)} 이하 전기차는 작년에는 취득세가 0원이었다가 올해
          전액을 내게 됩니다.
        </p>
      </section>

      <section data-article-section="variations">
        <h2>조건이 바뀌면</h2>

        <h3 data-variation>경형 전기차라면: 경차 감면이 남아 있다</h3>
        <p>
          부가세 포함 {man(28_000_000)} 경형 전기차는 세율{" "}
          {pct(p.rates.compact)}에 경형 자동차 감면(
          {formatWon(p.compactRelief.capWon)} 한도,{" "}
          {formatKoreanDate(p.compactRelief.until)}까지)을 받아{" "}
          {formatWon(kei.payable)}을 냅니다. 작년 12월(
          {formatWon(keiBefore.payable)})보다는 늘었지만, 경차가 아닌 같은 값의
          전기 승용차({formatWon(keiAsNormal.payable)})보다{" "}
          {formatWon(keiAsNormal.payable - kei.payable)} 적습니다.
        </p>

        <h3 data-variation>수소전기차라면: 올해도 감면 그대로</h3>
        <p>
          수소전기차 감면은 {formatKoreanDate(p.hydrogenRelief.until)}{" "}
          취득분까지라, 부가세 포함 {man(70_000_000)} 수소차는 올해도{" "}
          {formatWon(p.hydrogenRelief.capWon)}을 빼고 {formatWon(h2.payable)}
          입니다.
        </p>

        <h3 data-variation>자녀가 셋인 집이라면: 다자녀 감면을 받는다</h3>
        <p>
          18세 미만 자녀가 셋 이상인 집이 7~10인승을 사면 전기차라도 다자녀
          감면을 받습니다. 부가세 포함 {man(VAN)} 7인승 전기차는 감면이 없으면{" "}
          {formatWon(vanNoKids.payable)}이지만, 다자녀 감면으로{" "}
          {formatWon(vanKids.payable)}만 냅니다. 산출 취득세가{" "}
          {formatWon(p.minimumTax.exemptOverWon)}을 넘어{" "}
          {pct(1 - p.minimumTax.reliefRate)}는 내는 것입니다. 자세한 조건은{" "}
          <Link href="/guides/multi-child-car-acquisition-tax/">
            다자녀 취득세 사례
          </Link>
          에 있습니다.
        </p>
      </section>

      <section data-article-section="pitfalls">
        <h2>놓치기 쉬운 것</h2>
        <ol>
          <li>
            <strong>기준은 취득일입니다.</strong> 등록한 날이 아니라 인도일과
            잔금지급일 중 빠른 날로 판단합니다. 해를 넘겨 등록했더라도 작년에
            잔금을 치렀다면 감면 대상인지 다시 확인하세요.
          </li>
          <li>
            <strong>보조금과는 따로 계산됩니다.</strong> 보조금으로 받은 금액도
            취득가격에 들어가 취득세는 보조금을 빼기 전 차값 기준입니다. 보조금
            금액은 <Link href="/ev-subsidy/">보조금 계산기</Link>에서 따로
            확인하세요.
          </li>
          <li>
            <strong>감면이 다시 생길 수 있습니다.</strong> 감면 기한은 연말 법
            개정으로 정해집니다. 새 감면이 생기면 이 글과 계산기를 고치고
            수정일을 표시합니다.
          </li>
        </ol>
      </section>
    </GuideLayout>
  );
}
