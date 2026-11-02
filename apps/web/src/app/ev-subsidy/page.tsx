import { calcEvSubsidy, formatWon, type EvModel } from "@site/calc-core";
import { EV_SUBSIDY_YEARS, evSubsidyData } from "@site/data";
import { SourcesList } from "@/components/tool/SourcesList";
import { ToolPage, type Example } from "@/components/tool/ToolPage";
import { formatKoreanDate } from "@/lib/kst";
import { LINKS } from "@/lib/links";
import { pageMetadata } from "@/lib/seo";
import { toolById } from "@/lib/tools";
import { EvSubsidyCalculator } from "./EvSubsidyCalculator";

const tool = toolById("ev-subsidy");
const data = evSubsidyData(EV_SUBSIDY_YEARS[EV_SUBSIDY_YEARS.length - 1]!);
const otherRegionReady = data.missing.nationwide.length === 0;
const OFFICIAL = LINKS.evPortal.href;

export const metadata = pageMetadata({
  title: "전기차 보조금 계산기",
  description: `차종을 고르면 ${data.year}년 국비·지방비·전환지원금 보조금 합계를 공공데이터 기준(${data.baseDate})으로 계산합니다.`,
  path: tool.path,
  noindex: !tool.published,
});

function find(name: string): EvModel {
  const m = data.models.find((x) => x.name === name);
  if (!m)
    throw new Error(
      `사례 차종 없음: ${name} — 데이터가 바뀌었으면 사례를 고친다`,
    );
  return m;
}

// 사례: 금액은 엔진으로 계산 (제주 공개 데이터 + 지침 규칙)
const R = data.rules;
const ev3 = find("EV3 롱레인지 2WD 19인치");
const ray = find("레이 EV 2WD 14인치 4인승 승용");
const r1 = calcEvSubsidy({ model: ev3, region: "jeju", conversion: false }, R);
const r2 = calcEvSubsidy(
  { model: ev3, region: "jeju", conversion: true, youthFirstCar: true },
  R,
);
const r3 = calcEvSubsidy(
  {
    model: ray,
    region: "jeju",
    conversion: false,
    lowIncome: true,
    children: 3,
  },
  R,
);

const examples: Example[] = [
  {
    title: `기아 ${ev3.name}, 제주, 추가지원 없음`,
    body: (
      <p>
        국비 {formatWon(r1.national)}과 제주 지방비 {formatWon(r1.local ?? 0)}을
        더해 <strong>{formatWon(r1.total)}</strong>입니다.
      </p>
    ),
  },
  {
    title: `같은 차를 청년이 생애 첫 차로, 5년 된 휘발유차를 팔고 사면`,
    body: (
      <p>
        청년 추가지원 {formatWon(r2.rateAdditions)}(국비의{" "}
        {R.youthFirstCarRate * 100}%)과 전환지원금 국비{" "}
        {formatWon(r2.conversionNational)}·지방비{" "}
        {formatWon(r2.conversionLocal ?? 0)}이 더해져 {formatWon(r2.total)}
        입니다.
      </p>
    ),
  },
  {
    title: `기아 ${ray.name}, 제주, 차상위 이하 + 자녀 3명`,
    body: (
      <p>
        국비 {formatWon(r3.national)}, 지방비 {formatWon(r3.local ?? 0)}에
        차상위 추가 {formatWon(r3.rateAdditions)}과 다자녀 정액{" "}
        {formatWon(r3.multiChild)}을 더해 {formatWon(r3.total)}입니다.
      </p>
    ),
  },
];

const top = [...data.models]
  .filter((m) => !m.discontinued)
  .sort((a, b) => b.national - a.national)
  .slice(0, 15);

export default function EvSubsidyPage() {
  return (
    <ToolPage
      tool={tool}
      summary={[
        `전기차 구매보조금은 차종별 국비에 사는 지역의 지방비를 더하고, 조건에 따라 추가지원과 전환지원금을 더한 금액입니다.`,
        `${data.year}년 지침상 차상위 이하와 청년(19~34세) 생애 첫 차는 국비의 ${R.lowIncomeRate * 100}%씩, 18세 이하 자녀 2·3·4명 이상은 ${R.multiChildManwon["2"]}·${R.multiChildManwon["3"]}·${R.multiChildManwon["4"]}만원이 더해집니다.`,
        `3년 넘게 탄 내연기관차를 팔거나 폐차하고 사면 전환지원금 국비가 최대 ${R.conversion.maxManwon}만원 붙습니다. 지방비까지 정확한 금액은 무공해차 통합누리집 계산기에서 확인하세요.`,
      ]}
      calculator={
        <EvSubsidyCalculator
          models={data.models}
          regions={data.regions}
          rules={data.rules}
          otherRegionReady={otherRegionReady}
          officialCalculatorUrl={OFFICIAL}
        />
      }
      examples={examples}
      method={
        <>
          <ol>
            <li>
              국비는 차종마다 지침의 산식(성능, 가격계수, 안전계수 등)으로
              정해지고 전국이 같습니다. 기본가격 5,300만원 이상 8,500만원 미만은
              50%, 8,500만원 이상은 0원이 이미 반영돼 있습니다.
            </li>
            <li>
              지방비는 지자체가 국비의 {R.localMinRatio * 100}% 이상으로, 국비에
              비례해 차종별로 정합니다.
            </li>
            <li>
              추가지원: 차상위 이하·청년 생애 첫 차는 국비 ×{" "}
              {R.lowIncomeRate * 100}%씩(중복 가능), 그다음 다자녀 정액을
              더합니다. 추가지원금은 국비와 지방비가 비율대로 나눠 냅니다.
            </li>
            <li>
              전환지원 국비 = 국비 {R.conversion.fullAtNationalManwon}만원
              이상이면 {R.conversion.maxManwon}만원, 미만이면{" "}
              {R.conversion.maxManwon}만원 × 국비/
              {R.conversion.fullAtNationalManwon}(만원 미만 반올림).
            </li>
            <li>
              구매자는 차값에서 보조금을 뺀 금액만 제작·수입사에 내고, 보조금은
              지자체가 제작사에 줍니다.
            </li>
          </ol>
          <SourcesList sources={data.sources} />
        </>
      }
      table={
        <>
          <h3>국비가 많은 차종 15개 (단종 제외)</h3>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th scope="col">차종</th>
                  <th scope="col">국비</th>
                  <th scope="col">제주 지방비</th>
                  <th scope="col">전환지원 국비</th>
                </tr>
              </thead>
              <tbody>
                {top.map((m) => (
                  <tr key={m.id}>
                    <td>
                      {m.maker} {m.name}
                    </td>
                    <td>{m.national}만원</td>
                    <td>
                      {m.local.jeju !== undefined ? `${m.local.jeju}만원` : "-"}
                    </td>
                    <td>{m.conversionNational}만원</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="muted small">
            기준일 {formatKoreanDate(data.baseDate)}. 지방비는 지역마다
            다릅니다.
          </p>
        </>
      }
      faq={[
        {
          q: "전기차 보조금은 지역마다 다른가요?",
          a: `국비는 차종마다 전국이 같고, 지방비가 지역마다 다릅니다. 지방비는 국비의 ${R.localMinRatio * 100}% 이상으로 정해집니다.`,
        },
        {
          q: "전환지원금은 누가 받나요?",
          a: "최초 등록 후 3년 넘은 내연기관차(하이브리드 제외)를 3년 이상 갖고 있다가 팔거나 폐차하고 전기차를 사는 개인입니다. 2026년 1월 1일 이후 판매·폐차한 차부터 인정되고, 가족 간 판매·증여는 안 됩니다.",
        },
        {
          q: "청년 추가지원 조건은요?",
          a: `19~34세 개인이 생애 첫 자동차로 전기차를 살 때 국비의 ${R.youthFirstCarRate * 100}%가 더해집니다. 차상위 추가지원과 함께 받을 수 있습니다.`,
        },
        {
          q: "다자녀 추가지원은 얼마인가요?",
          a: `18세 이하 자녀 2명 ${R.multiChildManwon["2"]}만원, 3명 ${R.multiChildManwon["3"]}만원, 4명 이상 ${R.multiChildManwon["4"]}만원입니다. 취득세 다자녀 감면(18세 미만 기준)과는 기준 나이가 다릅니다.`,
        },
        {
          q: "비싼 차는 보조금이 줄어드나요?",
          a: "기본가격 5,300만원 이상 8,500만원 미만은 보조금의 50%, 8,500만원 이상은 지원하지 않습니다. 2027년에는 5,000만원·8,000만원으로 강화할 계획이라고 지침에 적혀 있습니다.",
        },
        {
          q: "이 계산기의 금액은 언제 기준인가요?",
          a: `차종별 금액은 공공데이터포털의 제주특별자치도 자료(${formatKoreanDate(data.baseDate)}), 추가지원 규칙은 2026년 6월 23일 보조금 지침입니다.`,
        },
      ]}
      next={{
        tools: [toolById("car-tax")],
        links: [LINKS.dataJejuEv, LINKS.evPortal],
      }}
      checkedAt={data.sources[0]?.checked_at ?? "2026-11-01"}
    />
  );
}
