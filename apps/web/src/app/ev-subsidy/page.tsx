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
const jeju = data.regions.find((r) => r.code === "jeju");

export const metadata = pageMetadata({
  title: "전기차 보조금 계산기",
  description: `차종을 고르면 ${data.year}년 국비·지방비·전환지원금 보조금 합계를 공공데이터 기준(${data.baseDate})으로 계산합니다.`,
  path: tool.path,
  noindex: !tool.published,
});

function find(name: string): EvModel {
  const m = data.models.find((x) => x.name === name);
  if (!m) throw new Error(`사례 차종 없음: ${name} — 데이터가 바뀌었으면 사례를 고친다`);
  return m;
}

// 사례: 금액은 엔진으로 계산 (제주 공개 데이터 기준)
const ev3 = find("EV3 롱레인지 2WD 19인치");
const ray = find("레이 EV 2WD 14인치 4인승 승용");
const casper = find("캐스퍼 일렉트릭 기본형 15인치");
const r1 = calcEvSubsidy({ model: ev3, region: "jeju", conversion: false });
const r1c = calcEvSubsidy({ model: ev3, region: "jeju", conversion: true });
const r2 = calcEvSubsidy({ model: ray, region: "jeju", conversion: false });
const r3 = calcEvSubsidy({ model: casper, region: "jeju", conversion: false });

const examples: Example[] = [
  {
    title: `기아 ${ev3.name}, 제주`,
    body: (
      <p>
        국비 {formatWon(r1.national)}와 제주 지방비 {formatWon(r1.local ?? 0)}를 더해 <strong>{formatWon(r1.total)}</strong>입니다. 전환지원금 대상이면
        국비 {formatWon(r1c.conversionNational)}, 지방비 {formatWon(r1c.conversionLocal ?? 0)}가 더해져 {formatWon(r1c.total)}입니다.
      </p>
    ),
  },
  {
    title: `기아 ${ray.name}, 제주`,
    body: (
      <p>
        경·소형으로 분류되며 국비 {formatWon(r2.national)}, 지방비 {formatWon(r2.local ?? 0)}로 합계 {formatWon(r2.total)}입니다.
      </p>
    ),
  },
  {
    title: `현대 ${casper.name}, 제주`,
    body: (
      <p>
        국비 {formatWon(r3.national)}, 지방비 {formatWon(r3.local ?? 0)}로 합계 {formatWon(r3.total)}입니다. 같은 경·소형인 레이 EV보다{" "}
        {formatWon(Math.abs(r3.total - r2.total))} {r3.total >= r2.total ? "많습니다" : "적습니다"}.
      </p>
    ),
  },
];

const top = [...data.models]
  .filter((m) => !m.discontinued)
  .sort((a, b) => b.national - a.national)
  .slice(0, 15);

export default function EvSubsidyPage() {
  const active = data.models.filter((m) => !m.discontinued).length;
  return (
    <ToolPage
      tool={tool}
      summary={[
        `전기차 구매보조금은 차종별 국비와 사는 지역의 지방비를 더한 금액입니다.`,
        `${formatKoreanDate(data.baseDate)} 공공데이터 기준 전기승용 ${active}개 차종(단종 제외) 중 국비가 가장 많은 차는 ${top[0]?.name}로 ${formatWon((top[0]?.national ?? 0) * 10_000)}입니다.`,
        `내연기관차를 바꾸는 경우의 전환지원금도 차종별로 정해져 있어 함께 계산합니다. 지금은 ${jeju?.name ?? "제주"} 지방비까지 들어 있습니다.`,
      ]}
      calculator={<EvSubsidyCalculator models={data.models} regions={data.regions} otherRegionReady={otherRegionReady} />}
      examples={examples}
      method={
        <>
          <ol>
            <li>보조금 합계 = 국비 + 지방비. 전환지원금 대상이면 전환지원 국비 + 전환지원 지방비를 더합니다.</li>
            <li>국비·전환지원 국비와 제주 지방비는 공공데이터포털에 공개된 제주특별자치도 자료의 차종별 금액(만원)입니다.</li>
            <li>그 밖의 지역 지방비는 시·군·구 공고문에서 확인한 값만 넣습니다.</li>
          </ol>
          {!otherRegionReady && (
            <p className="notice small" data-pending>
              다른 지역에 같은 국비가 적용되는지는 보조금 지침 원문으로 확인한 뒤 &apos;그 밖의 지역&apos; 계산을 엽니다.
            </p>
          )}
          {data.missing.conversion.length > 0 && (
            <p className="notice small" data-pending>
              전환지원금을 받는 조건은 지침 원문 확인 전이라 설명하지 않습니다. 대상 여부는 공고문에서 확인하세요.
            </p>
          )}
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
                    <td>{m.local.jeju !== undefined ? `${m.local.jeju}만원` : "-"}</td>
                    <td>{m.conversionNational}만원</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="muted small">기준일 {formatKoreanDate(data.baseDate)}. 지방비는 지역마다 다릅니다.</p>
        </>
      }
      faq={[
        { q: "전기차 보조금은 어떻게 정해지나요?", a: "차종마다 정해진 국비에, 사는 지역의 지방비를 더합니다. 그래서 같은 차라도 사는 곳에 따라 합계가 달라집니다." },
        { q: "이 계산기의 금액은 언제 기준인가요?", a: `공공데이터포털에 공개된 제주특별자치도 자료(${formatKoreanDate(data.baseDate)} 기준)입니다. 이 자료는 1년에 한 번 갱신되고, 지자체 공고는 그 사이에도 바뀔 수 있습니다.` },
        { q: "전환지원금은 얼마인가요?", a: `차종마다 다릅니다. 예를 들어 ${ev3.name}는 전환지원 국비 ${ev3.conversionNational}만원, 제주 지방비 ${ev3.conversionLocal.jeju ?? "-"}만원입니다. 받을 수 있는 조건은 공고문에서 확인하세요.` },
        { q: "우리 지역 지방비는 어디서 보나요?", a: "사는 시·군·구의 전기자동차 보급사업 공고문에 차종별 지방비 표가 있습니다. 지역이 추가되면 이 계산기에 자동으로 반영합니다." },
        { q: `${data.year + 1}년 보조금은 언제 반영되나요?`, a: `${data.year + 1}년 보조금 지침과 지자체 공고가 나오면 공식 자료를 확인해 바꿉니다. 그 전까지는 ${data.year}년 기준임을 표시합니다.` },
      ]}
      next={{ tools: [toolById("car-tax")], links: [LINKS.dataJejuEv, LINKS.evPortal] }}
      checkedAt={data.sources[0]?.checked_at ?? "2026-11-01"}
    />
  );
}
