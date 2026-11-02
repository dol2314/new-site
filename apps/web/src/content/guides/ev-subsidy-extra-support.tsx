/**
 * 사례 분석 10: 전기차 보조금 추가지원 — 청년 생애 첫 차·차상위·다자녀·전환지원을 더하면.
 * 규칙은 확인된 지침 데이터(ev-subsidy rules), 국비 금액은 예시(차종 아님). 지방비는 지역마다 달라 빼고 계산한다.
 * 숫자는 calc-core로 빌드 때 계산한다.
 */
import {
  calcEvSubsidy,
  expectedConversionNational,
  formatWon,
  type EvModel,
  type EvSubsidyInput,
} from "@site/calc-core";
import { EV_SUBSIDY_YEARS, evSubsidyData } from "@site/data";
import Link from "next/link";
import { GuideLayout } from "@/components/GuideLayout";
import type { GuideMeta } from "@/lib/guides";
import { formatKoreanDate } from "@/lib/kst";

const YEAR = EV_SUBSIDY_YEARS[EV_SUBSIDY_YEARS.length - 1]!;
const ev = evSubsidyData(YEAR);
const rules = ev.rules;
const pct = (r: number) => `${Math.round(r * 100)}%`;
const man = (manwon: number) => `${manwon.toLocaleString("ko-KR")}만원`;

/** 국비만 있는 가상의 차(지방비 제외) */
const car = (national: number): EvModel => ({
  id: `example-${national}`,
  maker: "예시",
  name: `국비 ${national}만원 차`,
  category: "승용",
  discontinued: false,
  national,
  conversionNational: expectedConversionNational(national, rules.conversion),
  local: {},
  conversionLocal: {},
});
const run = (national: number, extra: Partial<EvSubsidyInput> = {}) =>
  calcEvSubsidy(
    { model: car(national), region: null, conversion: false, ...extra },
    rules,
  );

const BASE = 500;
const plain = run(BASE);
const youth = run(BASE, { youthFirstCar: true });
const low = run(BASE, { lowIncome: true });
const youthKids2 = run(BASE, { youthFirstCar: true, children: 2 });
const lowKids3 = run(BASE, { lowIncome: true, children: 3 });
const lowConv = run(BASE, { lowIncome: true, conversion: true });

const NATIONALS = [300, 400, 500];
const byNational = NATIONALS.map((n) => ({
  n,
  base: run(n),
  youth: run(n, { youthFirstCar: true }),
  conv: run(n, { conversion: true }),
}));
const kidsRows = [2, 3, 4].map((k) => ({ k, r: run(BASE, { children: k }) }));

const sources = ev.sources.filter((s) =>
  [
    "values.lowIncomeRate",
    "values.youthFirstCarRate",
    "values.multiChildManwon",
    "values.conversion",
    "values.localMinRatio",
    "rules.conversionEligibility",
    "rules.nationalUniform",
  ].includes(s.key),
);

export default function Article({ meta }: { meta: GuideMeta }) {
  return (
    <GuideLayout
      meta={meta}
      summary={[
        <>
          {YEAR}년 지침상 전기차 보조금에는 조건에 따라 추가지원이 붙습니다.
          19~34세 청년이 생애 첫 차로 사거나 차상위 이하 계층이면{" "}
          <strong>국비의 {pct(rules.youthFirstCarRate)}</strong>를 더 받고, 18세
          이하 자녀가 둘 이상이면 정액이 더해집니다.
        </>,
        <>
          국비 {man(BASE)}인 차라면 청년 생애 첫 차 추가로{" "}
          {formatWon(youth.total - plain.total)}, 여기에 자녀 둘이면 합계{" "}
          {formatWon(youthKids2.total - plain.total)}을 더 받습니다(지방비 제외,{" "}
          {formatKoreanDate(meta.asOf)} 기준 지침).
        </>,
        <>
          내 차종과 지역의 국비·지방비는{" "}
          <Link href="/ev-subsidy/">전기차 보조금 계산기</Link>에서 조건을
          체크해 확인할 수 있습니다.
        </>,
      ]}
      faq={[
        {
          q: "청년 추가지원은 몇 살까지인가요?",
          a: "지침은 19세부터 34세까지 청년 개인이 생애 첫 자동차로 전기차를 살 때 추가지원한다고 정합니다. 나이 계산 기준과 증빙 서류는 사는 지역 공고문을 확인하세요.",
        },
        {
          q: "추가지원도 지방비에서 나오나요?",
          a: "추가지원금은 국비와 지방비 비율대로 나눠 부담하지만, 구매자가 받는 합계는 같습니다. 이 글의 금액은 받는 합계 기준입니다.",
        },
        {
          q: "내년에도 같은 조건인가요?",
          a: `이 글은 ${YEAR}년 지침 기준입니다. 보조금 지침은 해마다 1~2월쯤 새로 나오므로, 새 지침이 나오면 금액과 조건을 고칩니다.`,
        },
      ]}
      sources={sources}
      disclaimer="예시 조건은 이해를 돕기 위한 가정이며, 실제 보조금은 지자체 공고와 심사로 정해집니다. 지침이 바뀌면 이 글을 고칩니다."
    >
      <section data-article-section="conditions">
        <h2>계산 조건 (가정)</h2>
        <div className="table-wrap">
          <table>
            <tbody>
              <tr>
                <th scope="row">차</th>
                <td>국비가 {man(BASE)}인 전기 승용차 (특정 차종 아님)</td>
              </tr>
              <tr>
                <th scope="row">지방비</th>
                <td>
                  지역마다 달라 빼고 계산 (지자체는 국비의{" "}
                  {pct(rules.localMinRatio)} 이상 편성)
                </td>
              </tr>
              <tr>
                <th scope="row">기준</th>
                <td>{YEAR}년 전기자동차 보급사업 보조금 업무처리지침</td>
              </tr>
              <tr>
                <th scope="row">구매자</th>
                <td>개인</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className="muted small">
          국비 금액은 차종별로 다릅니다. 여기서는 계산 구조를 보여 주려고 정한
          숫자를 썼습니다.
        </p>
      </section>

      <section data-article-section="steps">
        <h2>단계별 계산</h2>
        <ol>
          <li>
            <strong>기본 국비:</strong> 차종마다 정해진 금액입니다. 이 예시는{" "}
            {formatWon(plain.national)}입니다.
          </li>
          <li>
            <strong>비율 추가지원:</strong> 청년 생애 첫 차{" "}
            {pct(rules.youthFirstCarRate)}, 차상위 이하{" "}
            {pct(rules.lowIncomeRate)}를 국비에 곱합니다. 지방비에는 곱하지
            않습니다. 국비 {man(BASE)}이면 각각 {formatWon(youth.rateAdditions)}
            입니다.
          </li>
          <li>
            <strong>다자녀 정액:</strong> 비율 추가지원을 계산한 뒤 자녀 수에
            따른 정액을 더합니다.
          </li>
          <li>
            <strong>합계:</strong> 해당하는 추가지원은 함께 받을 수 있어, 청년
            생애 첫 차에 자녀 둘이면 {formatWon(plain.national)} +{" "}
            {formatWon(youthKids2.rateAdditions)} +{" "}
            {formatWon(youthKids2.multiChild)} ={" "}
            <strong>{formatWon(youthKids2.total)}</strong>입니다(지방비 별도).
          </li>
        </ol>

        <h3>조건별 국비 쪽 합계 (국비 {man(BASE)} 차)</h3>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th scope="col">조건</th>
                <th scope="col">추가지원</th>
                <th scope="col">합계</th>
              </tr>
            </thead>
            <tbody>
              {[
                ["추가지원 없음", plain],
                ["청년 생애 첫 차", youth],
                ["차상위 이하", low],
                ["청년 생애 첫 차 + 자녀 2명", youthKids2],
                ["차상위 이하 + 자녀 3명", lowKids3],
              ].map(([label, r]) => {
                const res = r as typeof plain;
                return (
                  <tr key={label as string}>
                    <td>{label as string}</td>
                    <td>{formatWon(res.total - plain.total)}</td>
                    <td>{formatWon(res.total)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      <section data-article-section="variations">
        <h2>조건이 바뀌면</h2>

        <h3 data-variation>
          국비가 적은 차라면: 비율 추가지원도 함께 줄어든다
        </h3>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th scope="col">국비</th>
                <th scope="col">청년 첫 차 추가</th>
                <th scope="col">전환지원</th>
              </tr>
            </thead>
            <tbody>
              {byNational.map(({ n, base, youth: y, conv }) => (
                <tr key={n}>
                  <td>{man(n)}</td>
                  <td>{formatWon(y.total - base.total)}</td>
                  <td>{formatWon(conv.total - base.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p>
          청년·차상위 추가지원은 국비에 비례해, 국비가 적은 차는 추가로 받는
          돈도 적습니다. 비싸서 국비가 깎인 차일수록 추가지원 효과가 작아집니다.
        </p>

        <h3 data-variation>자녀 수가 늘면: 정액이 커진다</h3>
        <p>
          18세 이하 자녀 정액은{" "}
          {kidsRows.map(({ k, r }, i) => (
            <span key={k}>
              {i > 0 ? ", " : ""}
              {k === 4 ? "4명 이상" : `${k}명`} {formatWon(r.multiChild)}
            </span>
          ))}
          입니다. 비율 추가지원과 달리 국비 금액과 관계없이 같은 금액이
          붙습니다.
        </p>

        <h3 data-variation>타던 내연차를 팔고 산다면: 전환지원까지</h3>
        <p>
          3년 넘게 가진 내연기관차를 팔거나 폐차하고 전기차를 사면 전환지원
          국비가 붙습니다. 국비 {man(rules.conversion.fullAtNationalManwon)}{" "}
          이상인 차는 {man(rules.conversion.maxManwon)}, 그보다 적으면 비례해
          줄어듭니다. 차상위 이하 가정이 타던 차를 팔고 사면 국비 쪽 합계가{" "}
          {formatWon(lowConv.total)}입니다. 청년 생애 첫 차 추가지원은 처음 사는
          차에만 붙으므로, 타던 차를 파는 전환지원과는 함께 받을 수 없는
          구조입니다.
        </p>
      </section>

      <section data-article-section="pitfalls">
        <h2>놓치기 쉬운 것</h2>
        <ol>
          <li>
            <strong>20%는 국비에만 붙습니다.</strong> 지방비까지 합친 보조금에
            20%를 곱하면 실제보다 크게 계산됩니다.
          </li>
          <li>
            <strong>전환지원은 조건이 까다롭습니다.</strong> 최초 등록 후 3년
            넘은 내연기관차(하이브리드 제외)를 3년 이상 가진 개인이어야 하고,
            가족 사이에 팔거나 넘긴 경우는 인정되지 않습니다.
          </li>
          <li>
            <strong>접수 현황을 함께 보세요.</strong> 보조금은 지역별 예산
            안에서 지급돼, 조건에 맞아도 예산이 소진되면 접수가 마감될 수
            있습니다. 사는 지역 공고의 남은 대수를 확인하세요.
          </li>
        </ol>
      </section>
    </GuideLayout>
  );
}
