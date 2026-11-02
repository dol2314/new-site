/**
 * 사례 분석 20: 공공 충전기 한 번 충전에 얼마 — 배터리 크기·충전량·출력별.
 * 공공 충전요금은 확인된 데이터(ev-charging), 배터리 용량·충전 구간·전비는 예시 가정값. 숫자는 calc-core로 빌드 때 계산한다.
 */
import { calcChargingCost, formatWon, tierForKw } from "@site/calc-core";
import { evChargingData } from "@site/data";
import Link from "next/link";
import { GuideLayout } from "@/components/GuideLayout";
import { tierLabel } from "@/lib/charging";
import type { GuideMeta } from "@/lib/guides";
import { formatKoreanDate } from "@/lib/kst";

const data = evChargingData();
const tiers = data.publicTiers;
const since = data.effectiveDate ?? "2026-08-01";
const slow = tierForKw(7, tiers);
const mid = tierForKw(50, tiers);
const fast = tierForKw(100, tiers);
const ultra = tierForKw(350, tiers);
const won1 = (n: number) => `${n.toFixed(1)}원`;

/** 한 번 충전 비용: kWh × 단가 (calc-core로 계산: 거리 = kWh, 전비 = 1로 두고 kWh를 그대로 넣는다) */
const session = (kwh: number, wonPerKwh: number) =>
  calcChargingCost({
    monthlyKm: kwh,
    kmPerKwh: 1,
    mix: [{ label: "x", share: 1, wonPerKwh }],
  }).monthlyCost;

// 예시 차: 배터리 용량(kWh)과 전비(km/kWh)
const CARS = [
  { name: "경형", battery: 35, eff: 5.5 },
  { name: "중형", battery: 60, eff: 5.0 },
  { name: "대형", battery: 80, eff: 4.2 },
];
const FROM = 0.1;
const TO = 0.8;
const mid60 = CARS[1]!;
const kwh60 = Math.round(mid60.battery * (TO - FROM) * 10) / 10;
const fullKwh60 = Math.round(mid60.battery * (1 - FROM) * 10) / 10;

const rows = CARS.map((c) => {
  const kwh = Math.round(c.battery * (TO - FROM) * 10) / 10;
  return {
    ...c,
    kwh,
    km: Math.round(kwh * c.eff),
    slow: session(kwh, slow.wonPerKwh),
    fast: session(kwh, fast.wonPerKwh),
    ultra: session(kwh, ultra.wonPerKwh),
  };
});
const r60 = rows[1]!;
const per100 = (wonPerKwh: number, eff: number) =>
  calcChargingCost({
    monthlyKm: 100,
    kmPerKwh: eff,
    mix: [{ label: "x", share: 1, wonPerKwh }],
  }).monthlyCost;

const sources = data.sources.filter((s) =>
  ["values.publicTiers", "rules.publicScope"].includes(s.key),
);

export default function Article({ meta }: { meta: GuideMeta }) {
  return (
    <GuideLayout
      meta={meta}
      summary={[
        <>
          배터리 {mid60.battery}kWh 전기차를 {Math.round(FROM * 100)}%에서{" "}
          {Math.round(TO * 100)}%까지 공공 충전기로 채우면 {kwh60}kWh를
          넣습니다. 완속({tierLabel(slow)})이면{" "}
          <strong>{formatWon(r60.slow)}</strong>, {tierLabel(ultra)} 초급속이면{" "}
          {formatWon(r60.ultra)}입니다.
        </>,
        <>
          이만큼이면 전비 {mid60.eff}km/kWh 기준 약{" "}
          {r60.km.toLocaleString("ko-KR")}km를 달립니다. 한 번 충전 비용은 결국
          넣은 전력량 × kWh당 요금이라, 같은 차라도 어느 출력 충전기를 쓰느냐에
          따라 {formatWon(r60.ultra - r60.slow)}이 갈립니다(
          {formatKoreanDate(since)} 시행 요금).
        </>,
        <>
          완속과 급속을 섞어 쓴다면 섞는 비율을 정해{" "}
          <Link href="/ev-charging/">충전요금 계산기</Link>로 한 달 합계를 내
          보세요.
        </>,
      ]}
      faq={[
        {
          q: "완충까지 하면 얼마인가요?",
          a: `${mid60.battery}kWh 차를 ${Math.round(FROM * 100)}%에서 100%까지 채우면 ${fullKwh60}kWh로, 완속 기준 ${formatWon(session(fullKwh60, slow.wonPerKwh))}입니다. 실제로는 충전 손실이 있어 결제 전력량이 조금 더 나올 수 있습니다.`,
        },
        {
          q: "배터리 용량은 어디서 보나요?",
          a: "차량 제원표나 제조사 안내의 배터리 용량(kWh)을 보세요. 사용 가능한 용량이 표기 용량보다 조금 작은 차도 있어, 정확한 계산에는 실제 충전 기록의 kWh가 가장 좋습니다.",
        },
        {
          q: "공공 요금은 어떤 충전기에 적용되나요?",
          a: "기후에너지환경부가 운영하는 충전기와, 정부 협약 민간 충전기에서 기후부 회원카드로 결제할 때입니다. 사업자 자체 결제는 그 회사 요금을 따릅니다.",
        },
      ]}
      sources={sources}
      disclaimer="배터리 용량·충전 구간·전비는 예시 가정이며, 실제 결제 금액은 충전기 운영자와 결제 방법, 충전 손실에 따라 달라집니다. 요금이 바뀌면 이 글을 고칩니다."
    >
      <section data-article-section="conditions">
        <h2>계산 조건 (가정)</h2>
        <div className="table-wrap">
          <table>
            <tbody>
              <tr>
                <th scope="row">충전 구간</th>
                <td>
                  배터리 {Math.round(FROM * 100)}% → {Math.round(TO * 100)}%
                  (용량의 {Math.round((TO - FROM) * 100)}%)
                </td>
              </tr>
              <tr>
                <th scope="row">예시 차</th>
                <td>
                  {CARS.map(
                    (c) => `${c.name} ${c.battery}kWh·${c.eff}km/kWh`,
                  ).join(", ")}
                </td>
              </tr>
              <tr>
                <th scope="row">요금</th>
                <td>공공 충전요금 5단계 ({formatKoreanDate(since)} 시행)</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className="muted small">
          배터리 용량과 전비는 차급별로 흔한 범위에서 고른 숫자이며 특정 차종이
          아닙니다.
        </p>
      </section>

      <section data-article-section="steps">
        <h2>단계별 계산</h2>
        <ol>
          <li>
            <strong>넣을 전력량:</strong> 배터리 용량 × 충전할 비율.{" "}
            {mid60.battery}kWh × {Math.round((TO - FROM) * 100)}% = {kwh60}kWh.
          </li>
          <li>
            <strong>요금:</strong> 넣은 전력량 × 충전기 출력별 kWh당 요금.
            완속은 {kwh60} × {won1(slow.wonPerKwh)}, 원 단위 반올림하면{" "}
            {formatWon(r60.slow)}입니다.
          </li>
          <li>
            <strong>달릴 수 있는 거리:</strong> 넣은 전력량 × 전비. {kwh60}kWh ×{" "}
            {mid60.eff}km/kWh ≈ {r60.km.toLocaleString("ko-KR")}km.
          </li>
        </ol>

        <h3>
          한 번 충전({Math.round(FROM * 100)}→{Math.round(TO * 100)}%) 비용
        </h3>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th scope="col">차</th>
                <th scope="col">넣는 전력</th>
                <th scope="col">완속</th>
                <th scope="col">100kW급</th>
                <th scope="col">초급속</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.name}>
                  <td>
                    {r.name} {r.battery}kWh
                  </td>
                  <td>
                    {r.kwh}kWh (약 {r.km}km)
                  </td>
                  <td>{formatWon(r.slow)}</td>
                  <td>{formatWon(r.fast)}</td>
                  <td>{formatWon(r.ultra)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section data-article-section="variations">
        <h2>조건이 바뀌면</h2>

        <h3 data-variation>큰 배터리라면: 한 번에 드는 돈도 크다</h3>
        <p>
          {rows[2]!.battery}kWh 대형 전기차는 같은 구간을 채워도 {rows[2]!.kwh}
          kWh가 들어가 초급속 한 번에 {formatWon(rows[2]!.ultra)}입니다. 다만
          전비가 낮아 같은 돈으로 가는 거리는 {rows[2]!.km}km로, 경형(
          {rows[0]!.km}km, {formatWon(rows[0]!.ultra)})과 1km당 비용을 비교하는
          편이 정확합니다.
        </p>

        <h3 data-variation>100km 기준으로 보면</h3>
        <p>
          전비 {mid60.eff}km/kWh 차가 100km를 달리는 데 드는 충전비는 완속{" "}
          {formatWon(per100(slow.wonPerKwh, mid60.eff))}, {tierLabel(mid)}{" "}
          {formatWon(per100(mid.wonPerKwh, mid60.eff))}, {tierLabel(fast)}{" "}
          {formatWon(per100(fast.wonPerKwh, mid60.eff))}, {tierLabel(ultra)}{" "}
          {formatWon(per100(ultra.wonPerKwh, mid60.eff))}
          입니다.
        </p>

        <h3 data-variation>절반만 채운다면: 비용도 절반</h3>
        <p>
          {mid60.battery}kWh 차를 40%만 채우면 {Math.round(mid60.battery * 0.4)}
          kWh로 완속{" "}
          {formatWon(session(Math.round(mid60.battery * 0.4), slow.wonPerKwh))},
          초급속{" "}
          {formatWon(session(Math.round(mid60.battery * 0.4), ultra.wonPerKwh))}
          입니다. 공공 요금은 kWh당 단가라 충전량에 그대로 비례합니다.
        </p>
      </section>

      <section data-article-section="pitfalls">
        <h2>놓치기 쉬운 것</h2>
        <ol>
          <li>
            <strong>계기판 %와 결제 kWh는 다를 수 있습니다.</strong> 충전 중
            손실과 배터리 관리 때문에 결제 화면의 kWh가 위 계산보다 조금 많게
            나오기도 합니다.
          </li>
          <li>
            <strong>충전기 출력은 최대값입니다.</strong> 차와 배터리 상태에 따라
            실제 충전 속도는 표시 출력보다 낮을 수 있지만, 요금 단계는 충전기
            출력 구간으로 정해집니다.
          </li>
          <li>
            <strong>집 충전과 섞어 쓰면 따로 계산하세요.</strong> 집·아파트 충전
            단가는 공공 요금과 다르니, 비교는{" "}
            <Link href="/guides/home-vs-fast-charging-cost/">
              집 충전 vs 급속 사례
            </Link>
            를 보세요.
          </li>
        </ol>
      </section>
    </GuideLayout>
  );
}
