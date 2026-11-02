/**
 * 사례 분석 16: 중고차 취득세 — 실거래가와 시가표준액 중 무엇으로 내나.
 * 과세표준 규칙·세율·면세점은 확인된 데이터(registration-tax), 거래가·시가표준액은 예시 가정값(차종별 시가표준액표 없음).
 * 숫자는 calc-core로 빌드 때 계산한다.
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
const BUY = "2027-02-15";
const pct = (r: number) => `${Math.round(r * 1000) / 10}%`;
const man = (won: number) =>
  `${Math.round(won / 10_000).toLocaleString("ko-KR")}만원`;

/** 개인 간 중고차 거래(부가세 없음) */
const used = (
  price: number,
  standardValue: number | null,
  o: Partial<RegistrationTaxInput> = {},
) =>
  calcRegistrationTax(
    {
      price,
      vatIncluded: false,
      standardValue,
      compact: false,
      powertrain: "ice",
      seats7to10: false,
      childrenUnder18: 0,
      acquiredOn: BUY,
      ...o,
    },
    p,
  );

const SV = 13_000_000; // 시가표준액(가정)
const fair = used(15_000_000, SV);
const low = used(10_000_000, SV);
const lowReal = used(10_000_000, null);
const cheap = used(300_000, 800_000);
const cheapNoSv = used(300_000, null);
const scrapLike = used(300_000, 400_000);

const prices = [8_000_000, 11_000_000, 13_000_000, 15_000_000, 18_000_000];
const rows = prices.map((price) => ({ price, r: used(price, SV) }));

const sources = reg.sources.filter((s) =>
  [
    "rules.taxBase",
    "rules.actualPrice",
    "values.rates",
    "values.taxFreeThresholdWon",
    "rules.noEducationTax",
    "rules.noRuralSpecialTax",
  ].includes(s.key),
);

export default function Article({ meta }: { meta: GuideMeta }) {
  return (
    <GuideLayout
      meta={meta}
      summary={[
        <>
          중고차를 사면 취득세는 원칙적으로 실제로 주고받은 값(실거래가)에
          매깁니다. 다만 신고한 값이 차종·연식별 기준가격인 시가표준액보다
          낮으면 <strong>시가표준액</strong>이 기준이 됩니다.
        </>,
        <>
          시가표준액이 {man(SV)}인 승용차를 {man(15_000_000)}에 사면 취득세{" "}
          {formatWon(fair.payable)}, {man(10_000_000)}에 샀다고 신고해도
          시가표준액 기준 {formatWon(low.payable)}입니다(시가표준액은 예시,{" "}
          {formatKoreanDate(meta.asOf)} 현행 세율).
        </>,
        <>
          거래가와 시가표준액을 넣어 보려면{" "}
          <Link href="/registration-tax/">취등록세 계산기</Link>의 중고차 입력을
          쓰세요.
        </>,
      ]}
      faq={[
        {
          q: "시가표준액은 어디서 보나요?",
          a: "차종·연식별로 정해져 있어 같은 차라도 연식이 오래될수록 낮아집니다. 등록하려는 시·군·구의 차량등록 부서나 지방세 담당 부서에 차종과 연식으로 물어 확인하세요.",
        },
        {
          q: "중고차 취득세에 교육세가 붙나요?",
          a: "자동차 취득세에는 지방교육세와 농어촌특별세가 붙지 않습니다. 계산한 취득세가 낼 금액 전부입니다(공채 매입 등 등록 비용은 별도).",
        },
        {
          q: "가족에게 차를 그냥 받으면요?",
          a: "돈을 주고받지 않는 무상취득은 시가표준액이 기준입니다. 상속·증여는 세율이 따로 정해질 수 있어 이 글의 계산 범위 밖이니, 관할 시·군·구에 확인하세요.",
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
                <th scope="row">거래</th>
                <td>개인 간 중고 승용차 매매(부가세 없음), 비영업용</td>
              </tr>
              <tr>
                <th scope="row">시가표준액</th>
                <td>{formatWon(SV)} (예시 — 실제 값은 차종·연식별로 다름)</td>
              </tr>
              <tr>
                <th scope="row">세율</th>
                <td>
                  승용차 {pct(p.rates.passenger)}, 경차 {pct(p.rates.compact)}
                </td>
              </tr>
              <tr>
                <th scope="row">취득일</th>
                <td>{formatKoreanDate(BUY)}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className="muted small">
          시가표준액과 거래가는 기준이 바뀌는 지점을 보여 주려고 정한
          숫자입니다.
        </p>
      </section>

      <section data-article-section="steps">
        <h2>단계별 계산</h2>
        <ol>
          <li>
            <strong>신고할 값:</strong> 판 사람에게 실제로 준 돈입니다. 할부
            이자는 빼고, 깎아 준 금액이 있으면 깎은 값입니다.
          </li>
          <li>
            <strong>시가표준액과 비교:</strong> 신고한 값이 시가표준액보다 크면
            신고한 값, 작거나 신고가 없으면 시가표준액을 과세표준으로 씁니다.
          </li>
          <li>
            <strong>세율 적용:</strong> 과세표준 × {pct(p.rates.passenger)},
            10원 미만 버림. {man(15_000_000)} 거래라면 {formatWon(fair.base)} ×{" "}
            {pct(p.rates.passenger)} ={" "}
            <strong>{formatWon(fair.payable)}</strong>.
          </li>
          <li>
            <strong>면세점:</strong> 과세표준이{" "}
            {formatWon(p.taxFreeThresholdWon)} 이하면 취득세를 매기지 않습니다.
          </li>
        </ol>

        <h3>거래가별 취득세 (시가표준액 {man(SV)})</h3>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th scope="col">거래가</th>
                <th scope="col">과세표준</th>
                <th scope="col">취득세</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(({ price, r }) => (
                <tr key={price}>
                  <td>{formatWon(price)}</td>
                  <td>
                    {formatWon(r.base)}
                    {r.base > price ? " (시가표준액)" : ""}
                  </td>
                  <td>{formatWon(r.payable)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p>
          시가표준액보다 싸게 산 구간에서는 거래가가 달라도 취득세가 같습니다.
          그 위로는 거래가에 비례해 늘어납니다.
        </p>
      </section>

      <section data-article-section="variations">
        <h2>조건이 바뀌면</h2>

        <h3 data-variation>값을 낮춰 신고하면: 아낄 수 있는 돈이 없다</h3>
        <p>
          실제로 {man(10_000_000)}에 샀다면 거래가 기준으로는{" "}
          {formatWon(lowReal.payable)}이지만, 시가표준액이 그보다 높아{" "}
          {formatWon(low.payable)}을 냅니다. 반대로 더 비싸게 산 차를 낮게
          신고해도 시가표준액 아래로는 내려가지 않습니다. 취득세는 실제로
          주고받은 값대로 신고하는 것이 원칙입니다.
        </p>

        <h3 data-variation>아주 싼 차라면: 면세점도 시가표준액으로 본다</h3>
        <p>
          {man(300_000)}에 산 오래된 차라도 시가표준액이 {man(800_000)}이면
          과세표준은 시가표준액이라 {formatWon(cheap.payable)}을 냅니다.
          시가표준액도 {man(400_000)}처럼 {formatWon(p.taxFreeThresholdWon)}{" "}
          이하면 {formatWon(scrapLike.payable)}입니다. 거래가만 보면 면세점
          아래(
          {formatWon(cheapNoSv.payable)})여도 시가표준액을 함께 봐야 합니다.
        </p>

        <h3 data-variation>경차를 샀다면: 세율부터 낮다</h3>
        <p>
          같은 조건의 중고 경차는 세율이 {pct(p.rates.compact)}라{" "}
          {man(15_000_000)} 거래 기준 산출 취득세가{" "}
          {formatWon(used(15_000_000, SV, { compact: true }).computedTax)}
          입니다. 경차 감면 대상이면 더 줄어드니, 감면 요건은{" "}
          <Link href="/guides/compact-car-acquisition-tax/">
            경차 취득세 사례
          </Link>
          에서 확인하세요.
        </p>
      </section>

      <section data-article-section="pitfalls">
        <h2>놓치기 쉬운 것</h2>
        <ol>
          <li>
            <strong>매매업자에게 샀다면 금액 구성을 보세요.</strong> 개인 간
            거래와 달리 계약서에 부가세 등 여러 금액이 섞여 있을 수 있습니다.
            취득세는 부가세를 뺀 실제 차값 기준입니다.
          </li>
          <li>
            <strong>계약서 금액을 남겨 두세요.</strong> 실거래가로 신고할 때는
            매매계약서가 근거가 됩니다. 시가표준액보다 비싸게 산 경우에도 계약서
            금액이 기준입니다.
          </li>
          <li>
            <strong>이전 등록 비용은 따로입니다.</strong> 취득세 말고도 공채
            매입, 번호판 등 등록할 때 드는 돈이 지역마다 있습니다.
          </li>
        </ol>
      </section>
    </GuideLayout>
  );
}
