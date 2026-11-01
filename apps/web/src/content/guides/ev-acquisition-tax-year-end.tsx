/**
 * 사례 분석 1: 전기차 취득세 감면 종료(현행법 2026-12-31) — 12월 vs 1월 취득.
 * 숫자는 모두 calc-core + 확인된 데이터로 빌드 때 계산한다(손으로 쓰지 않는다).
 */
import {
  calcCarTax,
  calcRegistrationTax,
  formatWon,
  type RegistrationTaxInput,
} from "@site/calc-core";
import {
  EV_SUBSIDY_YEARS,
  carTaxData,
  evSubsidyData,
  registrationTaxData,
} from "@site/data";
import Link from "next/link";
import { GuideLayout } from "@/components/GuideLayout";
import type { GuideMeta } from "@/lib/guides";
import { formatKoreanDate } from "@/lib/kst";

const reg = registrationTaxData();
const p = reg.params;
const DEC = "2026-12-20";
const JAN = "2027-01-05";
const pct = (r: number) => `${Math.round(r * 1000) / 10}%`;

// 기본 조건(가정): 부가세 포함 4,500만원 전기 승용차, 개인 비영업용
const base: RegistrationTaxInput = {
  price: 45_000_000,
  vatIncluded: true,
  compact: false,
  powertrain: "electric",
  seats7to10: false,
  childrenUnder18: 0,
  acquiredOn: DEC,
};
const dec = calcRegistrationTax(base, p);
const jan = calcRegistrationTax({ ...base, acquiredOn: JAN }, p);

// 변형 1: 차값별
const prices = [22_000_000, 30_000_000, 45_000_000, 55_000_000];
const byPrice = prices.map((price) => {
  const d = calcRegistrationTax({ ...base, price }, p);
  const j = calcRegistrationTax({ ...base, price, acquiredOn: JAN }, p);
  return { price, d, j, diff: j.payable - d.payable };
});
// 경계: 감면 한도와 같아지는 차값(부가세 포함) = 한도 ÷ 세율 × 1.1
const fullExemptPrice = Math.round(
  ((p.evRelief.capWon / p.rates.passenger) * 11) / 10,
);

// 변형 2: 경형 전기차 2,800만원
const cDec = calcRegistrationTax(
  { ...base, price: 28_000_000, compact: true },
  p,
);
const cJan = calcRegistrationTax(
  { ...base, price: 28_000_000, compact: true, acquiredOn: JAN },
  p,
);
// 변형 3: 수소전기차 7,000만원
const hDec = calcRegistrationTax(
  { ...base, price: 70_000_000, powertrain: "hydrogen" },
  p,
);
const hJan = calcRegistrationTax(
  { ...base, price: 70_000_000, powertrain: "hydrogen", acquiredOn: JAN },
  p,
);

// 참고: 전기차 자동차세(정액)
const car = carTaxData(2027);
const evTax = calcCarTax(
  { fuelType: "electric", ageStartDate: "2027-01-05", taxYear: 2027 },
  car.tax,
);

const sourceKeys = [
  "values.rates",
  "values.evRelief",
  "values.hydrogenRelief",
  "values.compactRelief",
  "rules.actualPrice",
  "rules.subsidyInBase",
  "rules.acquisitionDate",
];
const ev = evSubsidyData(EV_SUBSIDY_YEARS[EV_SUBSIDY_YEARS.length - 1]!);
const sources = [
  ...reg.sources.filter((s) => sourceKeys.includes(s.key)),
  ...ev.sources.filter((s) => s.key === "rules.nationalUniform"),
];

export default function Article({ meta }: { meta: GuideMeta }) {
  return (
    <GuideLayout
      meta={meta}
      summary={[
        <>
          부가세 포함 4,500만원 전기차를 2026년 12월에 인도받으면 취득세는{" "}
          <strong>{formatWon(dec.payable)}</strong>, 2027년 1월에 인도받으면{" "}
          <strong>{formatWon(jan.payable)}</strong>으로{" "}
          {formatWon(jan.payable - dec.payable)} 차이가 납니다.
        </>,
        <>
          현행 지방세특례제한법의 전기차 취득세 감면(
          {formatWon(p.evRelief.capWon)} 한도)이{" "}
          {formatKoreanDate(p.evRelief.until)} 취득분까지이기 때문입니다(
          {formatKoreanDate(meta.asOf)} 기준).
        </>,
        <>
          내 차값으로는 <Link href="/registration-tax/">취등록세 계산기</Link>
          에서 취득일만 바꿔 바로 확인할 수 있습니다.
        </>,
      ]}
      faq={[
        {
          q: "1월에 인도받으면 전기차 취득세 감면이 전혀 없나요?",
          a: `현행법대로라면 전기차 감면은 없습니다. 다만 경형 전기차는 경형 자동차 감면(${formatWon(p.compactRelief.capWon)} 한도, ${formatKoreanDate(p.compactRelief.until)}까지)을 받을 수 있고, 수소전기차 감면은 ${formatKoreanDate(p.hydrogenRelief.until)}까지입니다.`,
        },
        {
          q: "연말에 법이 바뀌면 어떻게 되나요?",
          a: "지방세 감면 기한은 연말 법 개정으로 연장되는 경우가 있습니다. 개정되면 이 글과 계산기를 고치고 수정일을 표시합니다. 계약 전에 관할 지자체에도 확인하세요.",
        },
        {
          q: "취득세 말고 매년 내는 자동차세는 얼마인가요?",
          a: `전기차는 배기량과 관계없이 자동차세 연 ${formatWon(evTax.carTax)}에 지방교육세를 더해 ${formatWon(evTax.annualTotal)}이고, 오래 타도 차령 경감이 없습니다.`,
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
                <td>전기 승용차, 개인이 비영업용으로 구입</td>
              </tr>
              <tr>
                <th scope="row">차값</th>
                <td>{formatWon(base.price)} (부가세 포함)</td>
              </tr>
              <tr>
                <th scope="row">취득일</th>
                <td>
                  {formatKoreanDate(DEC)} vs {formatKoreanDate(JAN)}
                </td>
              </tr>
              <tr>
                <th scope="row">그 밖의 감면</th>
                <td>없음 (다자녀·장애인 등 해당 없음)</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className="muted small">
          특정 차종의 실제 가격이 아니라 계산을 보여 주기 위한 예시입니다.
        </p>
      </section>

      <section data-article-section="steps">
        <h2>단계별 계산</h2>
        <ol>
          <li>
            <strong>과세표준:</strong> 취득세는 부가세를 뺀 금액으로 계산합니다.{" "}
            {formatWon(base.price)} × 10/11 = {formatWon(dec.base)}.
          </li>
          <li>
            <strong>산출 취득세:</strong> 비영업용 승용차 세율{" "}
            {pct(p.rates.passenger)}를 곱하고 10원 미만을 버리면{" "}
            {formatWon(dec.computedTax)}입니다.
          </li>
          <li>
            <strong>12월 취득:</strong> 전기차 감면은 취득세가{" "}
            {formatWon(p.evRelief.capWon)} 이하면 면제, 넘으면{" "}
            {formatWon(p.evRelief.capWon)}을 뺍니다. 그래서{" "}
            {formatWon(dec.computedTax)} − {formatWon(dec.relief?.amount ?? 0)}{" "}
            = <strong>{formatWon(dec.payable)}</strong>.
          </li>
          <li>
            <strong>1월 취득:</strong> 현행법상 감면 기한이 지나 산출 취득세를
            그대로 냅니다. <strong>{formatWon(jan.payable)}</strong>.
          </li>
        </ol>
        <p>
          자동차 취득세에는 지방교육세와 농어촌특별세가 붙지 않으므로 이 금액이
          낼 취득세 전부입니다. 공채 매입 비용은 지역마다 따로 듭니다.
        </p>
      </section>

      <section data-article-section="variations">
        <h2>조건이 바뀌면</h2>

        <h3 data-variation>차값이 다르면: 대부분 차이는 140만원으로 같다</h3>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th scope="col">차값(부가세 포함)</th>
                <th scope="col">12월 취득</th>
                <th scope="col">1월 취득</th>
                <th scope="col">차이</th>
              </tr>
            </thead>
            <tbody>
              {byPrice.map((r) => (
                <tr key={r.price}>
                  <td>{formatWon(r.price)}</td>
                  <td>{formatWon(r.d.payable)}</td>
                  <td>{formatWon(r.j.payable)}</td>
                  <td>{formatWon(r.diff)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p>
          산출 취득세가 감면 한도({formatWon(p.evRelief.capWon)})를 넘는 차, 즉
          부가세 포함 차값이 약 {formatWon(fullExemptPrice)}보다 비싼 전기차는
          차값과 상관없이 차이가 {formatWon(p.evRelief.capWon)}입니다. 그보다 싼
          차는 12월에는 취득세가 0원이고, 1월에는 산출 취득세 전부를 냅니다.
        </p>

        <h3 data-variation>경형 전기차라면: 1월에도 경차 감면이 남는다</h3>
        <p>
          부가세 포함 2,800만원 경형 전기차는 세율이 {pct(p.rates.compact)}라
          산출 취득세가 {formatWon(cDec.computedTax)}입니다. 12월에는 전기차
          감면으로 {formatWon(cDec.payable)}입니다. 1월에는 전기차 감면이 없어도
          경형 자동차 감면({formatWon(p.compactRelief.capWon)} 한도,{" "}
          {formatKoreanDate(p.compactRelief.until)}
          까지)이 적용돼 {formatWon(cJan.payable)}만 냅니다. 차이는{" "}
          {formatWon(cJan.payable - cDec.payable)}으로 줄어듭니다.
        </p>

        <h3 data-variation>수소전기차라면: 2027년에도 그대로</h3>
        <p>
          수소전기차 감면은 {formatKoreanDate(p.hydrogenRelief.until)}까지라
          부가세 포함 7,000만원 수소차는 12월이든 1월이든 취득세가{" "}
          {formatWon(hDec.payable)}으로 같습니다
          {hDec.payable === hJan.payable
            ? ""
            : ` (1월 ${formatWon(hJan.payable)})`}
          .
        </p>
      </section>

      <section data-article-section="pitfalls">
        <h2>놓치기 쉬운 것</h2>
        <ol>
          <li>
            <strong>기준은 등록일이 아니라 취득일입니다.</strong> 새 차는 차를
            인도받는 날과 계약서상 잔금지급일 중 빠른 날이 취득일입니다. 12월에
            잔금을 치르기로 계약했다면 인도가 1월로 밀려도 12월 취득이 될 수
            있으니, 계약서의 잔금지급일을 확인하세요.
          </li>
          <li>
            <strong>보조금은 취득세를 줄이지 않습니다.</strong> 보조금으로
            지원받은 금액도 취득가격에 들어가서, 취득세는 보조금을 빼기 전 차값
            기준입니다. 보조금은 <Link href="/ev-subsidy/">보조금 계산기</Link>
            와 무공해차 통합누리집에서 따로 확인하세요.
          </li>
          <li>
            <strong>2027년 보조금 기준도 바뀔 수 있습니다.</strong> 2026년
            보조금 지침에는 2027년에 보조금 전액 지원 가격 기준을 5,300만원에서
            5,000만원 미만으로 강화할 계획이 적혀 있습니다. 취득세만 보고 시기를
            정하지 말고, 2027년 지침이 나오면 보조금도 함께 비교하세요.
          </li>
        </ol>
      </section>
    </GuideLayout>
  );
}
