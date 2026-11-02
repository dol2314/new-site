/**
 * 사례 분석 9: 다자녀 취득세 감면 — 7인승을 사면 얼마 덜 내나.
 * 세율·감면·최소납부세제는 확인된 데이터(registration-tax), 차값은 예시. 숫자는 calc-core로 빌드 때 계산한다.
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
const mc = p.multiChild;
const BUY = "2027-04-01";
const PRICE = 40_000_000;
const man = (won: number) =>
  `${Math.round(won / 10_000).toLocaleString("ko-KR")}만원`;
const pct = (r: number) => `${Math.round(r * 100)}%`;

const tax = (over: Partial<RegistrationTaxInput>) =>
  calcRegistrationTax(
    {
      price: PRICE,
      vatIncluded: true,
      compact: false,
      powertrain: "ice",
      seats7to10: true,
      childrenUnder18: 3,
      acquiredOn: BUY,
      ...over,
    },
    p,
  );

const van3 = tax({});
const none = tax({ childrenUnder18: 0 });
const sedan3 = tax({ seats7to10: false });
const van2 = tax({ childrenUnder18: 2 });
const sedan2 = tax({ childrenUnder18: 2, seats7to10: false });

// 3자녀 7인승이 전액 면제되는 가장 비싼 차값(부가세 포함, 1만원 단위)
const fullExemptLimit = (() => {
  let lo = 0;
  let hi = 10_000;
  while (lo < hi) {
    const mid = Math.ceil((lo + hi) / 2);
    if (tax({ price: mid * 10_000 }).payable === 0) lo = mid;
    else hi = mid - 1;
  }
  return lo * 10_000;
})();
const prices = [
  30_000_000,
  fullExemptLimit,
  fullExemptLimit + 10_000,
  40_000_000,
  50_000_000,
];
const byPrice = prices.map((price) => ({
  price,
  r: tax({ price }),
  base: tax({ price, childrenUnder18: 0 }),
}));
const afterYear = Number(mc.until.slice(0, 4)) + 1;
const after = tax({ acquiredOn: `${afterYear}-01-10` });

const sources = reg.sources.filter((s) =>
  [
    "values.rates",
    "values.multiChild",
    "values.minimumTax",
    "rules.overlap",
    "rules.acquisitionDate",
  ].includes(s.key),
);

export default function Article({ meta }: { meta: GuideMeta }) {
  return (
    <GuideLayout
      meta={meta}
      summary={[
        <>
          18세 미만 자녀가 셋 이상인 집이 7~10인승 승용차를 사면 취득세가
          면제됩니다. 다만 계산한 취득세가{" "}
          {formatWon(p.minimumTax.exemptOverWon)}을 넘으면{" "}
          {pct(p.minimumTax.reliefRate)}만 감면돼 나머지{" "}
          {pct(1 - p.minimumTax.reliefRate)}는 냅니다.
        </>,
        <>
          부가세 포함 {man(PRICE)} 7인승이라면 감면이 없을 때{" "}
          {formatWon(none.payable)}이지만, 세 자녀 가정은{" "}
          <strong>{formatWon(van3.payable)}</strong>만 냅니다. 같은 값의 5인승을
          사면 {formatWon(sedan3.payable)}이라 7인승 쪽이{" "}
          {formatWon(sedan3.payable - van3.payable)} 덜 냅니다(
          {formatKoreanDate(meta.asOf)} 현행법 기준).
        </>,
        <>
          자녀 수와 승차정원을 넣어 보려면{" "}
          <Link href="/registration-tax/">취등록세 계산기</Link>를 쓰세요.
        </>,
      ]}
      faq={[
        {
          q: "자녀 나이는 어떻게 세나요?",
          a: "18세 미만인 자녀 수로 셉니다. 세 명 이상이면 7~10인승 면제, 두 명이면 50% 경감처럼 자녀 수에 따라 감면 폭이 달라집니다. 정확한 기준일은 신청할 때 관할 시·군·구에 확인하세요.",
        },
        {
          q: "차를 두 대 사면 둘 다 감면되나요?",
          a: "아닙니다. 먼저 감면을 신청한 한 대만 받습니다. 이미 이 감면을 받은 차를 가지고 있거나, 제3자와 공동으로 등록하면 받을 수 없습니다.",
        },
        {
          q: "감면받은 차를 금방 팔면 어떻게 되나요?",
          a: "1년 안에 다른 사람에게 넘기면 감면받은 취득세를 다시 냅니다.",
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
                <th scope="row">가족</th>
                <td>18세 미만 자녀 3명 (변형에서 2명)</td>
              </tr>
              <tr>
                <th scope="row">차</th>
                <td>휘발유 7인승 승용차, 부가세 포함 {man(PRICE)}, 비영업용</td>
              </tr>
              <tr>
                <th scope="row">취득일</th>
                <td>{formatKoreanDate(BUY)}</td>
              </tr>
              <tr>
                <th scope="row">다른 감면</th>
                <td>없음 (경차·전기차 아님)</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className="muted small">
          가족 구성과 차값은 계산 구조를 보여 주려고 정한 예시입니다.
        </p>
      </section>

      <section data-article-section="steps">
        <h2>단계별 계산</h2>
        <ol>
          <li>
            <strong>감면 전 세금:</strong> 차값에서 부가세 몫을 빼고 승용차 세율{" "}
            {pct(p.rates.passenger)}를 적용하면 {formatWon(van3.computedTax)}
            입니다.
          </li>
          <li>
            <strong>다자녀 감면:</strong> 세 자녀 가정의 7~10인승은 원래 전액
            면제 대상입니다.
          </li>
          <li>
            <strong>최소납부세제:</strong> 면제 대상이라도 감면 전 세금이{" "}
            {formatWon(p.minimumTax.exemptOverWon)}을 넘으면{" "}
            {pct(p.minimumTax.reliefRate)}만 깎아 줍니다. 감면액은{" "}
            {formatWon(van3.relief?.amount ?? 0)}입니다.
          </li>
          <li>
            <strong>낼 세금:</strong> {formatWon(van3.computedTax)} −{" "}
            {formatWon(van3.relief?.amount ?? 0)} ={" "}
            <strong>{formatWon(van3.payable)}</strong>.
          </li>
        </ol>

        <h3>차값별 세 자녀 7인승 취득세</h3>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th scope="col">차값(부가세 포함)</th>
                <th scope="col">감면 없으면</th>
                <th scope="col">세 자녀 가정</th>
              </tr>
            </thead>
            <tbody>
              {byPrice.map(({ price, r, base }) => (
                <tr key={price}>
                  <td>{formatWon(price)}</td>
                  <td>{formatWon(base.payable)}</td>
                  <td>{formatWon(r.payable)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p>
          {man(fullExemptLimit)}까지는 감면 전 세금이{" "}
          {formatWon(p.minimumTax.exemptOverWon)} 이하라 0원입니다. 그보다
          비싸지면 감면 전 세금의 {pct(1 - p.minimumTax.reliefRate)}를 내기
          시작합니다.
        </p>
      </section>

      <section data-article-section="variations">
        <h2>조건이 바뀌면</h2>

        <h3 data-variation>
          5인승을 산다면: 한도 {formatWon(mc.threePlus.otherPassengerCapWon)}
          까지만
        </h3>
        <p>
          세 자녀 가정이라도 7~10인승이 아닌 승용차는 면제가 아니라{" "}
          {formatWon(mc.threePlus.otherPassengerCapWon)} 한도 감면입니다. 같은{" "}
          {man(PRICE)}짜리 5인승은 {formatWon(sedan3.payable)}으로 7인승보다{" "}
          {formatWon(sedan3.payable - van3.payable)} 더 냅니다.
        </p>

        <h3 data-variation>자녀가 둘이라면: 7인승도 절반</h3>
        <p>
          18세 미만 자녀가 두 명이면 7~10인승은 {pct(mc.two.vanRate)} 경감이라{" "}
          {formatWon(van2.payable)}을 냅니다. 5인승은 감면 전 세금이{" "}
          {formatWon(mc.two.otherPassengerThresholdWon)}을 넘으면{" "}
          {formatWon(mc.two.otherPassengerFixedWon)}만 빼 주므로{" "}
          {formatWon(sedan2.payable)}입니다.
        </p>

        <h3 data-variation>
          {afterYear}년에 산다면: 현행법으로는 감면이 끝난다
        </h3>
        <p>
          지금 조문에는 다자녀 감면 기한이 {formatKoreanDate(mc.until)}로 적혀
          있습니다. 셋째가 태어날 예정이라 차를 미루는 집이라면 이 날짜를 넘기지
          않는지 보세요. 기한이 연장되지 않으면 같은 7인승도 감면 없이{" "}
          {formatWon(after.payable)}이 됩니다.
        </p>
      </section>

      <section data-article-section="pitfalls">
        <h2>놓치기 쉬운 것</h2>
        <ol>
          <li>
            <strong>승차정원은 등록증 기준입니다.</strong> 같은 차종이라도 좌석
            구성에 따라 5인승·7인승이 나뉘니, 견적 단계에서 승차정원을
            확인하세요.
          </li>
          <li>
            <strong>감면은 하나만 받습니다.</strong> 다자녀 감면과 전기차
            감면처럼 두 감면에 해당하면 감면액이 큰 쪽 하나만 적용됩니다.
          </li>
          <li>
            <strong>지자체마다 조금 다를 수 있습니다.</strong> 최소납부세제는
            지자체 감면 조례로 달리 정할 수 있어, 고지 금액이 이 글과 다르면
            관할 시·군·구에 확인하세요.
          </li>
        </ol>
      </section>
    </GuideLayout>
  );
}
