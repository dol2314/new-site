import { calcChargingCost, formatWon, tierForKw } from "@site/calc-core";
import { evChargingData } from "@site/data";
import { SourcesList } from "@/components/tool/SourcesList";
import { ToolPage, type Example } from "@/components/tool/ToolPage";
import { tierLabel } from "@/lib/charging";
import { formatKoreanDate } from "@/lib/kst";
import { LINKS } from "@/lib/links";
import { pageMetadata } from "@/lib/seo";
import { toolById } from "@/lib/tools";
import { EvChargingCalculator } from "./EvChargingCalculator";

const tool = toolById("ev-charging");
const data = evChargingData();
const tiers = data.publicTiers;
const since = formatKoreanDate(data.effectiveDate ?? "2026-08-01");
const slow = tierForKw(7, tiers);
const ultra = tierForKw(350, tiers);
const mid = tierForKw(50, tiers);
const won1 = (n: number) => `${n.toFixed(1)}원`;

export const metadata = pageMetadata({
  title: "전기차 충전요금 계산기",
  description:
    "2026년 8월 개편된 공공 충전요금 5단계로 한 달 충전비를 계산하고, 집·민간 충전 요금과 같은 거리 주유비까지 비교합니다.",
  path: tool.path,
  noindex: !tool.published,
});

// 사례: 주행거리·전비·연비·기름값은 예시 가정값, 요금은 확인된 공공 요금, 계산은 엔진
const one = (monthlyKm: number, kmPerKwh: number, wonPerKwh: number) =>
  calcChargingCost({
    monthlyKm,
    kmPerKwh,
    mix: [{ label: "x", share: 1, wonPerKwh }],
  });
const e1Slow = one(1500, 5, slow.wonPerKwh);
const e1Ultra = one(1500, 5, ultra.wonPerKwh);
const e2 = calcChargingCost({
  monthlyKm: 1000,
  kmPerKwh: 6,
  mix: [
    { label: "완속", share: 0.7, wonPerKwh: slow.wonPerKwh },
    { label: "급속", share: 0.3, wonPerKwh: mid.wonPerKwh },
  ],
});
const e3 = calcChargingCost({
  monthlyKm: 1500,
  kmPerKwh: 5,
  mix: [{ label: "완속", share: 1, wonPerKwh: slow.wonPerKwh }],
  fuel: { kmPerLiter: 12, wonPerLiter: 1700 },
});

const examples: Example[] = [
  {
    title: "한 달 1,500km, 전비 5km/kWh — 완속만 vs 초급속만",
    body: (
      <p>
        필요한 전력은 {e1Slow.kwh.toLocaleString("ko-KR")}kWh입니다. 공공 완속
        충전기({tierLabel(slow)})만 쓰면 {formatWon(e1Slow.monthlyCost)},{" "}
        {tierLabel(ultra)} 충전기만 쓰면 {formatWon(e1Ultra.monthlyCost)}입니다.
        한 달 {formatWon(e1Ultra.monthlyCost - e1Slow.monthlyCost)}, 1년이면{" "}
        {formatWon(e1Ultra.annualCost - e1Slow.annualCost)} 차이입니다.
      </p>
    ),
  },
  {
    title: "한 달 1,000km, 전비 6km/kWh — 완속 70% + 50kW급 30%",
    body: (
      <p>
        {e2.kwh.toLocaleString("ko-KR")}kWh 가운데 완속{" "}
        {e2.items[0]!.kwh.toLocaleString("ko-KR")}kWh는{" "}
        {formatWon(e2.items[0]!.cost)}, {tierLabel(mid)} 충전기{" "}
        {e2.items[1]!.kwh.toLocaleString("ko-KR")}kWh는{" "}
        {formatWon(e2.items[1]!.cost)}입니다. 합계 {formatWon(e2.monthlyCost)},
        1km당 {e2.wonPerKm}원입니다.
      </p>
    ),
  },
  {
    title: "같은 1,500km를 연비 12km/L 휘발유차로 달리면",
    body: (
      <p>
        기름값을 1L에 1,700원으로 가정하면 {e3.fuel!.liters}L,{" "}
        {formatWon(e3.fuel!.monthlyCost)}입니다. 공공 완속으로만 충전한 전기차(
        {formatWon(e3.monthlyCost)})보다 한 달 {formatWon(e3.monthlyDiff!)} 더
        듭니다. 기름값은 날마다 바뀌니 오피넷에서 오늘 값을 넣어 보세요.
      </p>
    ),
  },
];

export default function EvChargingPage() {
  return (
    <ToolPage
      tool={tool}
      summary={[
        `${since}부터 공공 충전요금이 충전기 출력에 따라 5단계로 바뀌었습니다. 완속(30kW 미만)은 kWh당 ${won1(slow.wonPerKwh)}, 200kW 이상 초급속은 ${won1(ultra.wonPerKwh)}입니다.`,
        `한 달 1,500km를 전비 5km/kWh로 달리면 완속만 쓸 때 ${formatWon(e1Slow.monthlyCost)}, 초급속만 쓸 때 ${formatWon(e1Ultra.monthlyCost)}입니다.`,
        "집·아파트 충전과 민간 사업자 요금은 사람마다 달라 직접 넣고, 같은 거리 주유비와도 비교할 수 있습니다.",
      ]}
      calculator={
        <EvChargingCalculator tiers={tiers} fuelPriceUrl={LINKS.opinet.href} />
      }
      examples={examples}
      method={
        <>
          <ol>
            <li>필요한 전력(kWh) = 한 달 주행거리 ÷ 전비(km/kWh).</li>
            <li>
              충전비 = 필요한 전력 × 충전 방식별 비율 × kWh당 요금. 방식마다 원
              단위로 반올림해 더합니다.
            </li>
            <li>
              공공 충전기 요금은 기후에너지환경부가 정한 출력별 5단계 요금을
              씁니다. 집·민간 충전 요금은 입력한 값을 씁니다.
            </li>
            <li>주유비 = 한 달 주행거리 ÷ 연비(km/L) × 기름값(원/L).</li>
            <li>
              충전 중 손실과 계절에 따른 전비 차이 때문에 실제 결제 금액은
              계산보다 많을 수 있습니다. 계기판 평균 전비를 넣으면 가장
              가깝습니다.
            </li>
          </ol>
          <SourcesList sources={data.sources} />
        </>
      }
      table={
        <>
          <h3>공공 충전요금 ({since} 시행)</h3>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th scope="col">충전기 출력</th>
                  <th scope="col">kWh당 요금</th>
                  <th scope="col">100kWh 충전</th>
                </tr>
              </thead>
              <tbody>
                {tiers.map((t) => (
                  <tr key={t.minKw}>
                    <td>{tierLabel(t)}</td>
                    <td>{won1(t.wonPerKwh)}</td>
                    <td>{formatWon(Math.round(t.wonPerKwh * 100))}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="small muted">
            기후에너지환경부가 설치·운영하는 공공 충전기와, 정부와 협약한 민간
            충전기에서 기후부 회원카드로 결제할 때 적용됩니다.
          </p>
        </>
      }
      faq={[
        {
          q: "공공 충전요금은 언제 어떻게 바뀌었나요?",
          a: `${since}부터 2단계(100kW 미만·이상)에서 5단계로 나뉘었습니다. 30kW 미만 완속은 kWh당 29.4원 내렸고, 200kW 이상 초급속은 45.9원 올랐습니다.`,
        },
        {
          q: "내가 쓰는 충전기가 몇 kW인지 어떻게 아나요?",
          a: "충전기 본체나 충전소를 찾는 앱에 출력(kW)이 표시됩니다. 기후에너지환경부 자료로는 전체 충전기의 약 90%가 30kW 미만 완속입니다.",
        },
        {
          q: "민간 충전기에서도 이 요금이 적용되나요?",
          a: "정부와 협약한 민간 충전기에서 기후에너지환경부 회원카드로 결제할 때만 적용됩니다. 사업자 자체 회원카드나 앱으로 결제하면 그 사업자 요금이 적용되니, 민간 충전기 칸에 그 요금을 넣으세요.",
        },
        {
          q: "집·아파트 충전 요금은 왜 직접 넣어야 하나요?",
          a: "아파트 충전 사업자, 전기 계약 방식, 사용량과 시간대에 따라 단가가 달라 이 사이트는 기본값을 정하지 않습니다. 충전 앱이나 관리비·전기요금 고지서의 단가를 넣으세요.",
        },
        {
          q: "계산보다 실제 충전비가 더 나오는 이유는 무엇인가요?",
          a: "충전기에서 배터리로 들어가는 동안 손실이 있고, 계절에 따라 전비가 달라지기 때문입니다. 계기판의 최근 평균 전비를 넣으면 실제와 가까워집니다.",
        },
        {
          q: "주유비 비교의 기름값은 어디서 보나요?",
          a: "한국석유공사가 운영하는 오피넷에서 지역별 오늘 기름값을 볼 수 있습니다. 이 계산기는 입력한 기름값을 저장하거나 보내지 않습니다.",
        },
      ]}
      next={{
        tools: [
          toolById("car-loan"),
          toolById("ev-subsidy"),
          toolById("car-tax"),
        ],
        links: [LINKS.chargingPolicy, LINKS.opinet],
      }}
      checkedAt={data.sources[0]?.checked_at ?? "2026-11-01"}
    />
  );
}
