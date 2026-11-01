/**
 * 사례 분석 4: 집 충전 vs 급속 충전 — 월 1,500km 충전비.
 * 공공 충전요금은 확인된 데이터, 집 충전 단가는 확인할 공식 출처가 없어(한전 사이트 수집 금지) 독자가 넣는 값으로 다룬다.
 * 아래 HOME_SCENARIOS는 "만약 이 단가라면"을 보여 주는 가정값이며 실제 요금이 아니다.
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
const KM = 1500;
const EFF = 5;
const slow = tierForKw(7, tiers);
const fast = tierForKw(100, tiers); // 100~200kW 미만
const ultra = tierForKw(350, tiers);
const won1 = (n: number) => `${n.toFixed(1)}원`;

const only = (monthlyKm: number, kmPerKwh: number, wonPerKwh: number) =>
  calcChargingCost({
    monthlyKm,
    kmPerKwh,
    mix: [{ label: "x", share: 1, wonPerKwh }],
  });

const base = only(KM, EFF, fast.wonPerKwh);
const kwh = base.kwh;
const byTier = tiers.map((t) => ({ t, r: only(KM, EFF, t.wonPerKwh) }));
const perWon = Math.round(kwh); // 단가 1원 차이 = kWh만큼

// 가정 단가(예시) — 실제 요금 아님
const HOME_SCENARIOS = [150, 200, 250, 300];
const home = HOME_SCENARIOS.map((w) => ({ w, r: only(KM, EFF, w) }));

// 변형 1: 주행거리별
const kms = [500, 1000, 1500, 2000, 3000];
const byKm = kms.map((k) => ({
  k,
  slow: only(k, EFF, slow.wonPerKwh),
  fast: only(k, EFF, fast.wonPerKwh),
}));

// 변형 2: 완속 80% + 초급속 20%
const mix = calcChargingCost({
  monthlyKm: KM,
  kmPerKwh: EFF,
  mix: [
    { label: "완속", share: 0.8, wonPerKwh: slow.wonPerKwh },
    { label: "초급속", share: 0.2, wonPerKwh: ultra.wonPerKwh },
  ],
});
const ultraOnly = only(KM, EFF, ultra.wonPerKwh);

// 변형 3: 전비가 떨어지면
const EFF_LOW = 4;
const lowSlow = only(KM, EFF_LOW, slow.wonPerKwh);
const lowFast = only(KM, EFF_LOW, fast.wonPerKwh);

const sources = data.sources;

export default function Article({ meta }: { meta: GuideMeta }) {
  return (
    <GuideLayout
      meta={meta}
      summary={[
        <>
          한 달 {KM.toLocaleString("ko-KR")}km를 전비 {EFF}km/kWh로 달리면 {kwh}
          kWh를 충전합니다. 공공 급속({tierLabel(fast)})만 쓰면{" "}
          <strong>{formatWon(base.monthlyCost)}</strong>, 공공 완속만 쓰면{" "}
          {formatWon(only(KM, EFF, slow.wonPerKwh).monthlyCost)}입니다(
          {formatKoreanDate(meta.asOf)} 공공 요금 기준).
        </>,
        <>
          집 충전이 얼마나 싼지는 집 단가에 달려 있습니다. 이 조건에서는 kWh당
          단가가 1원 다를 때마다 한 달 충전비가 {perWon}원씩 달라집니다.
        </>,
        <>
          내 집 단가를 넣어 바로 비교하려면{" "}
          <Link href="/ev-charging/">충전요금 계산기</Link>의 집·아파트 칸을
          쓰세요.
        </>,
      ]}
      faq={[
        {
          q: "집 충전이 항상 급속보다 싼가요?",
          a: `아닙니다. 집이나 아파트 충전기의 kWh당 단가가 공공 급속(${tierLabel(fast)} ${won1(fast.wonPerKwh)})보다 낮을 때만 쌉니다. 단가는 충전 앱, 충전기 화면, 전기요금 고지서에서 확인하세요.`,
        },
        {
          q: "아파트 충전기 단가는 어디서 보나요?",
          a: "아파트 주차장 충전기는 운영하는 사업자 앱이나 충전기 화면에 kWh당 요금이 나옵니다. 같은 충전기라도 회원 여부에 따라 요금이 다를 수 있습니다.",
        },
        {
          q: "주말에 충전하면 더 싼가요?",
          a: "정부는 2026년 4월에 봄·가을 주말과 공휴일 낮 11~14시에 집·회사 충전기와 공공 급속충전기 요금을 할인한다고 발표했습니다. 8월 요금 개편 뒤에도 같은 금액인지는 충전 앱에서 확인하세요.",
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
                <th scope="row">한 달 주행거리</th>
                <td>{KM.toLocaleString("ko-KR")}km</td>
              </tr>
              <tr>
                <th scope="row">전비</th>
                <td>{EFF}km/kWh (계기판 평균 전비로 가정)</td>
              </tr>
              <tr>
                <th scope="row">공공 충전요금</th>
                <td>
                  기후에너지환경부 5단계 요금(
                  {formatKoreanDate(data.effectiveDate ?? "2026-08-01")} 시행)
                </td>
              </tr>
              <tr>
                <th scope="row">집 충전 단가</th>
                <td>사람마다 달라 정하지 않음 — 아래는 예시 단가</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className="muted small">
          특정 차종이나 특정 아파트의 실제 요금이 아니라 계산을 보여 주기 위한
          예시입니다.
        </p>
      </section>

      <section data-article-section="steps">
        <h2>단계별 계산</h2>
        <ol>
          <li>
            <strong>충전할 전력:</strong> {KM.toLocaleString("ko-KR")}km ÷ {EFF}
            km/kWh = {kwh}kWh.
          </li>
          <li>
            <strong>공공 충전기 요금:</strong> 출력별 kWh당 요금 × {kwh}
            kWh입니다. 아래 표처럼 가장 싼 완속과 가장 비싼 초급속은 한 달{" "}
            {formatWon(ultraOnly.monthlyCost - byTier[0]!.r.monthlyCost)} 차이가
            납니다.
          </li>
          <li>
            <strong>집 충전 요금:</strong> 집 단가 × {kwh}kWh입니다. 단가가
            kWh당 1원 싸질 때마다 한 달 {perWon}원을 아낍니다.
          </li>
          <li>
            <strong>손익 기준:</strong> 집 단가가 급속 단가(
            {won1(fast.wonPerKwh)})보다 낮으면 그 차이 × {kwh}kWh만큼
            이득입니다.
          </li>
        </ol>

        <h3>공공 충전기만 쓸 때 (한 달)</h3>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th scope="col">충전기 출력</th>
                <th scope="col">kWh당</th>
                <th scope="col">한 달</th>
                <th scope="col">1년</th>
              </tr>
            </thead>
            <tbody>
              {byTier.map(({ t, r }) => (
                <tr key={t.minKw}>
                  <td>{tierLabel(t)}</td>
                  <td>{won1(t.wonPerKwh)}</td>
                  <td>{formatWon(r.monthlyCost)}</td>
                  <td>{formatWon(r.annualCost)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <h3>집 단가가 이렇다면 (예시 단가)</h3>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th scope="col">집 단가(예시)</th>
                <th scope="col">한 달</th>
                <th scope="col">급속({tierLabel(fast)})보다</th>
              </tr>
            </thead>
            <tbody>
              {home.map(({ w, r }) => (
                <tr key={w}>
                  <td>kWh당 {w}원</td>
                  <td>{formatWon(r.monthlyCost)}</td>
                  <td>{formatWon(base.monthlyCost - r.monthlyCost)} 적음</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="muted small">
          집 단가 150~300원은 계산을 보여 주려고 고른 숫자이고, 실제 요금이
          아닙니다. 내 단가는 충전 앱이나 고지서에서 확인하세요.
        </p>
      </section>

      <section data-article-section="variations">
        <h2>조건이 바뀌면</h2>

        <h3 data-variation>주행거리가 다르면: 차이는 거리에 정비례한다</h3>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th scope="col">한 달 주행</th>
                <th scope="col">완속만</th>
                <th scope="col">급속({tierLabel(fast)})만</th>
                <th scope="col">차이</th>
              </tr>
            </thead>
            <tbody>
              {byKm.map((x) => (
                <tr key={x.k}>
                  <td>{x.k.toLocaleString("ko-KR")}km</td>
                  <td>{formatWon(x.slow.monthlyCost)}</td>
                  <td>{formatWon(x.fast.monthlyCost)}</td>
                  <td>{formatWon(x.fast.monthlyCost - x.slow.monthlyCost)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p>
          덜 달리는 사람은 급속만 써도 한 달 차이가 크지 않습니다. 한 달 3,000km
          넘게 달리는 영업·출퇴근 장거리 운전자라면 충전 장소를 고르는 것만으로
          1년에{" "}
          {formatWon(
            (byKm[4]!.fast.monthlyCost - byKm[4]!.slow.monthlyCost) * 12,
          )}
          이 달라집니다.
        </p>

        <h3 data-variation>섞어 쓰면: 완속 80% + 초급속 20%</h3>
        <p>
          평소에는 완속으로 채우고 장거리 때만 {tierLabel(ultra)} 충전기를 쓰는
          경우입니다. 한 달 {formatWon(mix.monthlyCost)}으로, 초급속만 쓸 때(
          {formatWon(ultraOnly.monthlyCost)})보다{" "}
          {formatWon(ultraOnly.monthlyCost - mix.monthlyCost)} 적습니다. 초급속
          비율이 10%포인트 늘 때마다 한 달{" "}
          {formatWon(
            Math.round(kwh * 0.1 * (ultra.wonPerKwh - slow.wonPerKwh)),
          )}
          씩 늘어납니다.
        </p>

        <h3 data-variation>전비가 떨어지면: 같은 거리에 전기가 더 든다</h3>
        <p>
          전비가 {EFF}에서 {EFF_LOW}km/kWh로 떨어지면 충전할 전력이{" "}
          {lowSlow.kwh}kWh로 늘어납니다. 완속만 써도 한 달{" "}
          {formatWon(lowSlow.monthlyCost)}, 급속만 쓰면{" "}
          {formatWon(lowFast.monthlyCost)}입니다. 전비는 계절과 운전 습관에 따라
          달라지니, 계산할 때는 최근 몇 달 평균을 넣는 편이 정확합니다.
        </p>
      </section>

      <section data-article-section="pitfalls">
        <h2>놓치기 쉬운 것</h2>
        <ol>
          <li>
            <strong>공공 요금은 결제 방법에 따라 달라집니다.</strong> 위 공공
            요금은 기후에너지환경부 충전기, 또는 협약한 민간 충전기에서 기후부
            회원카드로 결제할 때 적용됩니다. 사업자 자체 카드나 앱으로 결제하면
            그 사업자 요금이 나옵니다.
          </li>
          <li>
            <strong>봄·가을 주말 낮에는 할인이 있습니다.</strong> 주말과 공휴일
            11~14시에 집·회사 충전기는 kWh당 40.1~48.6원, 공공 급속충전기는
            42.7~48.6원 할인한다고 2026년 4월에 발표됐습니다. 8월 요금 개편 뒤
            할인액은 충전 앱에서 확인하세요.
          </li>
          <li>
            <strong>집 콘센트 충전은 고지서로 확인하세요.</strong> 집 전기로
            충전하면 그만큼 집 전기 사용량이 늘어 한 달 고지서 금액이 바뀝니다.
            충전하기 전과 후 고지서를 비교하면 실제 단가에 가까운 값을 알 수
            있습니다.
          </li>
          <li>
            <strong>요금 체계가 또 바뀔 예정입니다.</strong> 정부는 시간대별
            전기요금과 충전요금을 연동해 재생에너지가 많은 시간에 더 싸게
            충전하도록 바꾸겠다고 밝혔습니다. 바뀌면 이 글을 고칩니다.
          </li>
        </ol>
      </section>
    </GuideLayout>
  );
}
