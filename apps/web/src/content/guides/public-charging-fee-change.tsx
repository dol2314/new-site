/**
 * 사례 분석 8: 공공 충전요금 개편(2026-08-01) 전후 — 충전 습관별로 한 달에 얼마 달라졌나.
 * 개편 전·후 요금은 확인된 데이터(ev-charging), 주행거리·전비·충전 비율은 예시. 숫자는 calc-core로 빌드 때 계산한다.
 */
import {
  calcChargingCost,
  formatWon,
  tierForKw,
  type ChargeTier,
  type ChargingMixItem,
} from "@site/calc-core";
import { evChargingData } from "@site/data";
import Link from "next/link";
import { GuideLayout } from "@/components/GuideLayout";
import { tierLabel } from "@/lib/charging";
import type { GuideMeta } from "@/lib/guides";
import { formatKoreanDate } from "@/lib/kst";

const data = evChargingData();
const now = data.publicTiers;
const before = data.publicTiersBefore;
const since = data.effectiveDate ?? "2026-08-01";
const KM = 1000;
const EFF = 6;
const won1 = (n: number) => `${n.toFixed(1)}원`;
const signed = (n: number) =>
  `${n > 0 ? "+" : n < 0 ? "−" : ""}${formatWon(Math.abs(n))}`;

/** 출력 kW 목록과 비율로 전·후 한 달 충전비 */
function compare(km: number, mix: { kw: number; share: number }[]) {
  const build = (tiers: ChargeTier[]): ChargingMixItem[] =>
    mix.map((m) => ({
      label: `${m.kw}kW`,
      share: m.share,
      wonPerKwh: tierForKw(m.kw, tiers).wonPerKwh,
    }));
  const b = calcChargingCost({
    monthlyKm: km,
    kmPerKwh: EFF,
    mix: build(before),
  });
  const a = calcChargingCost({ monthlyKm: km, kmPerKwh: EFF, mix: build(now) });
  return { b, a, diff: a.monthlyCost - b.monthlyCost };
}

// 단계마다 대표 출력
const REP = [7, 40, 50, 100, 200];
const byTier = REP.map((kw) => ({
  kw,
  t: tierForKw(kw, now),
  old: tierForKw(kw, before),
  r: compare(KM, [{ kw, share: 1 }]),
}));
const slowRow = byTier[0]!;
const ultraRow = byTier[4]!;

const apt = compare(KM, [
  { kw: 7, share: 0.9 },
  { kw: 100, share: 0.1 },
]);
const LONG_KM = 2500;
const road = compare(LONG_KM, [
  { kw: 200, share: 0.8 },
  { kw: 7, share: 0.2 },
]);
const midOnly = byTier[2]!;

const sources = data.sources.filter((s) =>
  [
    "values.publicTiers",
    "values.publicTiersBefore",
    "rules.publicScope",
    "rules.publicChange",
  ].includes(s.key),
);

export default function Article({ meta }: { meta: GuideMeta }) {
  return (
    <GuideLayout
      meta={meta}
      summary={[
        <>
          {formatKoreanDate(since)}부터 공공 충전요금이 2단계에서 5단계로
          바뀌었습니다. {tierLabel(slowRow.t)} 완속은 kWh당{" "}
          {won1(slowRow.old.wonPerKwh)}에서 {won1(slowRow.t.wonPerKwh)}으로
          내렸고, {tierLabel(ultraRow.t)} 초급속은{" "}
          {won1(ultraRow.old.wonPerKwh)}에서 {won1(ultraRow.t.wonPerKwh)}으로
          올랐습니다.
        </>,
        <>
          한 달 {KM.toLocaleString("ko-KR")}km(전비 {EFF}km/kWh)를 완속으로만
          채우면 <strong>{formatWon(-slowRow.r.diff)} 줄고</strong>,
          초급속으로만 채우면{" "}
          <strong>{formatWon(ultraRow.r.diff)} 늘었습니다</strong>.
        </>,
        <>
          내 충전 비율로는 <Link href="/ev-charging/">충전요금 계산기</Link>에
          주행거리와 충전 방식을 넣어 지금 요금으로 계산할 수 있습니다.
        </>,
      ]}
      faq={[
        {
          q: "개편 전 요금은 언제부터 쓰던 것인가요?",
          a: `2022년 9월 1일부터 100kW 미만 ${won1(before[0]!.wonPerKwh)}, 100kW 이상 ${won1(before[1]!.wonPerKwh)}이었습니다. 4년 가까이 같은 요금이 이어지다 이번에 출력별로 나뉘었습니다.`,
        },
        {
          q: "초급속은 왜 올랐나요?",
          a: "정부는 급속충전기의 설치·운영 비용이 높고, 초급속 충전과 전력분배 같은 서비스 품질 향상에 투자가 필요하다는 점을 들었습니다. 요금에는 전기요금, 운영비, 법정검사비가 반영됐다고 밝혔습니다.",
        },
        {
          q: "앞으로 또 바뀌나요?",
          a: "정부는 계시별 전기요금과 충전요금을 연동해, 재생에너지 발전이 많은 시간대에 더 싸게 충전하도록 바꿀 계획이라고 밝혔습니다. 바뀌면 이 글과 계산기를 고칩니다.",
        },
      ]}
      sources={sources}
      disclaimer="예시 조건은 이해를 돕기 위한 가정이며, 실제 충전요금은 충전기 운영자와 결제 방법에 따라 정해집니다. 요금이 바뀌면 이 글을 고칩니다."
    >
      <section data-article-section="conditions">
        <h2>계산 조건 (가정)</h2>
        <div className="table-wrap">
          <table>
            <tbody>
              <tr>
                <th scope="row">한 달 주행</th>
                <td>
                  {KM.toLocaleString("ko-KR")}km, 전비 {EFF}km/kWh (약{" "}
                  {slowRow.r.a.kwh}kWh 충전)
                </td>
              </tr>
              <tr>
                <th scope="row">요금</th>
                <td>
                  공공 충전요금 개편 전(2022-09-01 ~ 2026-07-31)과 개편 후(
                  {formatKoreanDate(since)} ~)
                </td>
              </tr>
              <tr>
                <th scope="row">결제</th>
                <td>
                  기후에너지환경부 충전기, 또는 협약 민간 충전기에서 기후부
                  회원카드로 결제
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className="muted small">
          주행거리·전비·충전 비율은 예시입니다. 사업자 자체 요금은 이 비교에
          들어가지 않습니다.
        </p>
      </section>

      <section data-article-section="steps">
        <h2>단계별 계산</h2>
        <ol>
          <li>
            <strong>개편 전:</strong> 100kW 미만은 모두{" "}
            {won1(before[0]!.wonPerKwh)}, 100kW 이상은 모두{" "}
            {won1(before[1]!.wonPerKwh)}이었습니다. 7kW 완속과 50kW 급속이 같은
            값이었습니다.
          </li>
          <li>
            <strong>개편 후:</strong> 30kW, 50kW, 100kW, 200kW를 경계로 다섯
            단계가 됐습니다. 출력이 높을수록 비쌉니다.
          </li>
          <li>
            <strong>한 달 차이:</strong> 충전한 전력({slowRow.r.a.kwh}kWh) ×
            kWh당 바뀐 금액입니다. 비율을 섞어 쓰면 단계마다 계산해 더합니다.
          </li>
        </ol>

        <h3>출력별로 달라진 금액 (한 달 {KM.toLocaleString("ko-KR")}km)</h3>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th scope="col">충전기 출력</th>
                <th scope="col">개편 전</th>
                <th scope="col">개편 후</th>
                <th scope="col">한 달 변화</th>
              </tr>
            </thead>
            <tbody>
              {byTier.map(({ kw, t, old, r }) => (
                <tr key={kw}>
                  <td>{tierLabel(t)}</td>
                  <td>{won1(old.wonPerKwh)}</td>
                  <td>{won1(t.wonPerKwh)}</td>
                  <td>{signed(r.diff)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p>
          50~100kW 구간은 {won1(midOnly.t.wonPerKwh - midOnly.old.wonPerKwh)}{" "}
          올라 한 달 {formatWon(midOnly.r.diff)} 정도라 사실상 그대로입니다.
          체감 차이는 완속과 초급속 양 끝에서 납니다.
        </p>
      </section>

      <section data-article-section="variations">
        <h2>조건이 바뀌면</h2>

        <h3 data-variation>아파트 완속 위주라면: 개편으로 이득</h3>
        <p>
          완속 90%에 100kW급 급속 10%를 섞으면 한 달{" "}
          {formatWon(apt.b.monthlyCost)}에서 {formatWon(apt.a.monthlyCost)}으로{" "}
          {formatWon(-apt.diff)} 줄었습니다. 1년이면 {formatWon(-apt.diff * 12)}
          입니다. 충전기의 대부분이 완속이라 많은 운전자가 이쪽에 해당합니다.
        </p>

        <h3 data-variation>
          장거리·초급속 위주라면: 1년 {formatWon(road.diff * 12)} 더
        </h3>
        <p>
          한 달 {LONG_KM.toLocaleString("ko-KR")}km를 달리면서 80%를{" "}
          {tierLabel(ultraRow.t)} 충전기로 채우는 경우입니다. 한 달{" "}
          {formatWon(road.b.monthlyCost)}에서 {formatWon(road.a.monthlyCost)}
          으로 {formatWon(road.diff)} 늘었습니다. 업무로 장거리를 달리는
          운전자는 출력이 한 단계 낮은 충전기를 고르는 것만으로 차이를 줄일 수
          있습니다.
        </p>

        <h3 data-variation>같은 거리라도 출력 선택이 요금을 가른다</h3>
        <p>
          지금 요금으로 한 달 {KM.toLocaleString("ko-KR")}km를 채울 때 가장 싼
          완속은 {formatWon(slowRow.r.a.monthlyCost)}, 가장 비싼 초급속은{" "}
          {formatWon(ultraRow.r.a.monthlyCost)}입니다. 개편 전에는 이 차이가{" "}
          {formatWon(ultraRow.r.b.monthlyCost - slowRow.r.b.monthlyCost)}
          이었는데, 지금은{" "}
          {formatWon(ultraRow.r.a.monthlyCost - slowRow.r.a.monthlyCost)}
          으로 벌어졌습니다.
        </p>
      </section>

      <section data-article-section="pitfalls">
        <h2>놓치기 쉬운 것</h2>
        <ol>
          <li>
            <strong>내 결제 수단이 개편 대상인지 보세요.</strong> 사업자 앱이나
            사업자 멤버십 카드로 결제해 왔다면 이번 개편과 상관없이 그 회사
            요금표를 따릅니다. 개편 요금이 붙는 것은 정부가 운영하는 충전기,
            그리고 협약 사업자 충전기에서 정부 회원카드를 쓸 때입니다.
          </li>
          <li>
            <strong>충전기 출력을 먼저 보세요.</strong> 같은
            &quot;급속&quot;이라도 50kW급과 200kW급은 이제 kWh당{" "}
            {won1(ultraRow.t.wonPerKwh - midOnly.t.wonPerKwh)} 차이가 납니다.
            충전소 앱이나 충전기 본체의 표시를 확인하세요.
          </li>
          <li>
            <strong>집 충전과 비교는 따로 하세요.</strong> 아파트·단독주택 충전
            단가는 이 개편과 별개입니다. 집 단가와 급속 단가를 견주는 계산은{" "}
            <Link href="/guides/home-vs-fast-charging-cost/">
              집 충전 vs 급속 사례
            </Link>
            에 있습니다.
          </li>
        </ol>
      </section>
    </GuideLayout>
  );
}
