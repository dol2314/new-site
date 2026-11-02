/**
 * 사례 분석 18: 전기차 전환지원금 — 타던 내연차를 팔거나 폐차하고 사면 얼마 더 받나.
 * 금액·요건은 확인된 지침 데이터와 제주 공공데이터(2026-09-17, 차종별 국비·지방비). 숫자는 calc-core로 빌드 때 계산한다.
 */
import { calcEvSubsidy, formatWon, type EvModel } from "@site/calc-core";
import { EV_SUBSIDY_YEARS, evSubsidyData } from "@site/data";
import Link from "next/link";
import { GuideLayout } from "@/components/GuideLayout";
import { josa } from "@/lib/josa";
import type { GuideMeta } from "@/lib/guides";
import { formatKoreanDate } from "@/lib/kst";

const YEAR = EV_SUBSIDY_YEARS[EV_SUBSIDY_YEARS.length - 1]!;
const ev = evSubsidyData(YEAR);
const rules = ev.rules;
const man = (manwon: number) => `${manwon.toLocaleString("ko-KR")}만원`;
const find = (name: string) =>
  ev.models.find((m) => m.name === name && !m.discontinued)!;

const PICKS = [
  "EV3 롱레인지 2WD 17인치",
  "EV3 스탠다드 2WD",
  "EV3 GT",
  "캐스퍼 일렉트릭 기본형 15인치",
  "레이 EV 2WD 14인치 4인승 승용",
];
const models: EvModel[] = PICKS.map(find).filter(Boolean);
const lr = models[0]!;
const gt = models[2]!;
const run = (m: EvModel, conversion: boolean, region: string | null = null) =>
  calcEvSubsidy({ model: m, region, conversion }, rules);

const lrJeju = run(lr, true, "jeju");
const lrJejuNo = run(lr, false, "jeju");
const fullCount = ev.models.filter(
  (m) => !m.discontinued && m.conversionNational === rules.conversion.maxManwon,
).length;
const activeCount = ev.models.filter((m) => !m.discontinued).length;
const jejuBase = ev.baseDate;
if (ev.missing.conversion.length || ev.missing.regionData.length)
  throw new Error(
    `전환지원 사례 글: 확인 전 데이터 ${[...ev.missing.conversion, ...ev.missing.regionData].join(", ")}`,
  );

const sources = ev.sources.filter((s) =>
  [
    "values.conversion",
    "rules.conversionEligibility",
    "values.models",
    "rules.nationalUniform",
  ].includes(s.key),
);

export default function Article({ meta }: { meta: GuideMeta }) {
  return (
    <GuideLayout
      meta={meta}
      summary={[
        <>
          3년 넘게 가진 내연기관차를 팔거나 폐차하고 전기차를 사면
          &quot;전환지원금&quot;이 붙습니다. {YEAR}년 지침상 국비로는 최대{" "}
          <strong>{man(rules.conversion.maxManwon)}</strong>이고, 사는 지역의
          지방비 전환지원이 더해질 수 있습니다.
        </>,
        <>
          기본 국비가 {man(rules.conversion.fullAtNationalManwon)} 이상인 차는{" "}
          {man(rules.conversion.maxManwon)}을 다 받지만, 그보다 적은 차는 비례해
          줄어듭니다. 예를 들어 {josa(lr.name, "은/는")}{" "}
          {man(lr.conversionNational)}, {josa(gt.name, "은/는")}{" "}
          {man(gt.conversionNational)}입니다(
          {formatKoreanDate(jejuBase)} 공공데이터 기준).
        </>,
        <>
          차종과 지역을 골라 전환지원까지 더해 보려면{" "}
          <Link href="/ev-subsidy/">전기차 보조금 계산기</Link>에서
          &quot;전환지원금도 더해 보기&quot;를 체크하세요.
        </>,
      ]}
      faq={[
        {
          q: "팔아도 되고 폐차해도 되나요?",
          a: "네. 지침은 내연기관차를 판매하거나 폐차한 경우 모두 인정합니다. 다만 가족에게 팔거나 넘긴 경우는 인정하지 않습니다.",
        },
        {
          q: "중고로 산 내연차를 처분해도 되나요?",
          a: "차가 최초 등록 후 3년 넘었고, 본인이 그 차를 3년 이상 가지고 있었다면 대상입니다. 보유 기간을 세는 기준일과 증빙 서류는 사는 지역 공고문을 확인하세요.",
        },
        {
          q: "작년에 판 차도 되나요?",
          a: `${YEAR}년 지침은 ${YEAR}년 1월 1일 이후에 판매·폐차한 차부터 인정합니다. 그 전에 처분한 차는 대상이 아닙니다.`,
        },
      ]}
      sources={sources}
      disclaimer="금액은 공공데이터 기준일의 값이며, 실제 보조금은 지자체 공고와 심사로 정해집니다. 지침이나 공고가 바뀌면 이 글을 고칩니다."
    >
      <section data-article-section="conditions">
        <h2>계산 조건</h2>
        <div className="table-wrap">
          <table>
            <tbody>
              <tr>
                <th scope="row">기준</th>
                <td>{YEAR}년 전기자동차 보급사업 보조금 업무처리지침</td>
              </tr>
              <tr>
                <th scope="row">차종별 금액</th>
                <td>
                  제주특별자치도 공공데이터({formatKoreanDate(jejuBase)}) —
                  국비는 전국 같음, 지방비는 제주 값
                </td>
              </tr>
              <tr>
                <th scope="row">구매자</th>
                <td>개인, 다른 추가지원 없음</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className="muted small">
          제주 지방비는 지역 예시입니다. 다른 지역은 그 지역 공고의 금액을
          보세요.
        </p>
      </section>

      <section data-article-section="steps">
        <h2>단계별 계산</h2>
        <ol>
          <li>
            <strong>대상인지:</strong> 최초 등록 후 3년이 넘은
            내연기관차(하이브리드 제외)를, 내가 3년 이상 가지고 있다가 {YEAR}년
            1월 1일 이후 팔거나 폐차했는지 봅니다.
          </li>
          <li>
            <strong>국비 전환지원:</strong> 사려는 전기차의 기본 국비가{" "}
            {man(rules.conversion.fullAtNationalManwon)} 이상이면{" "}
            {man(rules.conversion.maxManwon)}, 미만이면{" "}
            {man(rules.conversion.maxManwon)} × 국비 ÷{" "}
            {rules.conversion.fullAtNationalManwon}(만원 단위 반올림)입니다.
          </li>
          <li>
            <strong>지방비 전환지원:</strong> 지자체가 차종별로 정합니다. 제주는{" "}
            {lr.name}에 {man(lr.conversionLocal.jeju ?? 0)}을 더합니다.
          </li>
          <li>
            <strong>합계:</strong> 제주에서 {josa(lr.name, "을/를")} 사면
            전환지원 없이 {formatWon(lrJejuNo.total)}, 전환지원을 받으면{" "}
            <strong>{formatWon(lrJeju.total)}</strong>입니다.
          </li>
        </ol>

        <h3>차종별 전환지원 ({formatKoreanDate(jejuBase)} 기준)</h3>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th scope="col">차종</th>
                <th scope="col">기본 국비</th>
                <th scope="col">전환 국비</th>
                <th scope="col">전환 지방비(제주)</th>
              </tr>
            </thead>
            <tbody>
              {models.map((m) => (
                <tr key={m.id}>
                  <td>
                    {m.maker} {m.name}
                  </td>
                  <td>{man(m.national)}</td>
                  <td>{man(m.conversionNational)}</td>
                  <td>
                    {m.conversionLocal.jeju !== undefined
                      ? man(m.conversionLocal.jeju)
                      : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p>
          데이터에 있는 판매 중 차종 {activeCount}개 가운데 전환 국비를{" "}
          {man(rules.conversion.maxManwon)} 다 받는 차는 {fullCount}개입니다.
          나머지는 기본 국비가 적어 전환지원도 비례해 줄어듭니다.
        </p>
      </section>

      <section data-article-section="variations">
        <h2>조건이 바뀌면</h2>

        <h3 data-variation>국비가 적은 차라면: 전환지원도 비례해 준다</h3>
        <p>
          {josa(gt.name, "은/는")} 기본 국비가 {man(gt.national)}이라 전환
          국비도 {man(rules.conversion.maxManwon)} × {gt.national}/
          {rules.conversion.fullAtNationalManwon} = {man(gt.conversionNational)}
          입니다. 같은 차 이름이라도 트림에 따라 기본 국비가 다르면 전환지원도
          달라집니다.
        </p>

        <h3 data-variation>처분한 차가 하이브리드라면: 대상이 아니다</h3>
        <p>
          전환지원은 내연기관차를 처분한 경우만 인정하고, 하이브리드는
          제외됩니다. 하이브리드를 팔고 {josa(lr.name, "을/를")} 사면 제주 기준
          보조금은 {formatWon(lrJejuNo.total)}으로, 전환지원분{" "}
          {formatWon(lrJeju.total - lrJejuNo.total)}을 받지 못합니다.
        </p>

        <h3 data-variation>
          경형 전기차라면: {man(models[4]!.conversionNational)}~
          {man(models[3]!.conversionNational)}
        </h3>
        <p>
          캐스퍼 일렉트릭 기본형은 기본 국비가 {man(models[3]!.national)}으로{" "}
          {man(rules.conversion.fullAtNationalManwon)}에 조금 못 미쳐 전환
          국비가 {man(models[3]!.conversionNational)}, 레이 EV 승용은{" "}
          {man(models[4]!.conversionNational)}입니다. 경형이라도 비례 계산은
          같습니다.
        </p>
      </section>

      <section data-article-section="pitfalls">
        <h2>놓치기 쉬운 것</h2>
        <ol>
          <li>
            <strong>처분 시점이 중요합니다.</strong> {YEAR}년 1월 1일 이후
            판매·폐차한 차만 인정됩니다. 전기차 계약 전에 미리 팔았다면 날짜를
            확인하세요.
          </li>
          <li>
            <strong>가족 간 거래는 안 됩니다.</strong> 가족에게 팔거나 증여한
            차로는 전환지원을 받을 수 없습니다.
          </li>
          <li>
            <strong>2027년 지침은 다를 수 있습니다.</strong> 전환지원 금액과
            요건은 해마다 지침으로 정합니다. 내년에 살 계획이면 새 지침이 나온
            뒤 다시 확인하세요.
          </li>
        </ol>
      </section>
    </GuideLayout>
  );
}
