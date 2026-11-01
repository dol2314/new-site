/**
 * 사례 분석 5: 전기차 vs 휘발유차 5년 비용 — 주행거리·충전 방식·기름값에 따라 누가 덜 드나.
 * 세금·공공 충전요금은 확인된 데이터, 차값·보조금·주행거리·연비·전비·기름값은 예시 가정값.
 * 숫자는 모두 calc-core로 빌드 때 계산한다.
 */
import {
  calcOwnershipCost,
  calcPurchase,
  calcRegistrationTax,
  formatWon,
  tierForKw,
  type OwnershipResult,
  type RegistrationTaxInput,
} from "@site/calc-core";
import { evChargingData, ownershipData, registrationTaxData } from "@site/data";
import Link from "next/link";
import { GuideLayout } from "@/components/GuideLayout";
import { tierLabel } from "@/lib/charging";
import type { GuideMeta } from "@/lib/guides";
import { formatKoreanDate } from "@/lib/kst";

const own = ownershipData();
const charging = evChargingData();
const reg = registrationTaxData();
const p = reg.params;
const START = "2027-01-04";
const YEARS = 5;
const y0 = Number(START.slice(0, 4));
const carTaxFor = (y: number) => own.carTaxByYear[Math.min(y, own.latestYear)]!;

// 예시 가정값
const EV_PRICE = 45_000_000;
const EV_SUBSIDY = 9_000_000;
const EV_EFF = 5; // km/kWh
const ICE_PRICE = 30_000_000;
const ICE_CC = 1598;
const ICE_EFF = 12; // km/L
const FUEL = 1_700; // 원/L
const KM = 15_000; // 1년

const slow = tierForKw(7, charging.publicTiers);
const fast = tierForKw(100, charging.publicTiers);
const ultra = tierForKw(350, charging.publicTiers);

const regIn = (
  price: number,
  powertrain: RegistrationTaxInput["powertrain"],
  acquiredOn = START,
): RegistrationTaxInput => ({
  price,
  vatIncluded: true,
  compact: false,
  powertrain,
  seats7to10: false,
  childrenUnder18: 0,
  acquiredOn,
});
const real = (price: number, subsidy: number, tax: number) =>
  calcPurchase({
    price,
    subsidy,
    registrationTax: tax,
    extra: 0,
    downPayment: 0,
    financeTaxAndExtra: false,
  }).realPrice;

const evTaxJan = calcRegistrationTax(regIn(EV_PRICE, "electric"), p);
const evTaxDec = calcRegistrationTax(
  regIn(EV_PRICE, "electric", "2026-12-20"),
  p,
);
const iceTax = calcRegistrationTax(regIn(ICE_PRICE, "ice"), p);
const evReal = real(EV_PRICE, EV_SUBSIDY, evTaxJan.payable);
const iceReal = real(ICE_PRICE, 0, iceTax.payable);

interface Scenario {
  km?: number;
  evWon?: number;
  fuelWon?: number;
}
function run(s: Scenario = {}): {
  ev: OwnershipResult;
  ice: OwnershipResult;
  diff: number;
} {
  const km = s.km ?? KM;
  const common = {
    start: START,
    years: YEARS,
    carTaxParamsFor: carTaxFor,
    newRegistration: own.newRegistration,
    annualInsurance: 0,
  };
  const ev = calcOwnershipCost({
    ...common,
    purchase: evReal,
    fuelType: "electric",
    annualEnergy: (km / EV_EFF) * (s.evWon ?? slow.wonPerKwh),
  });
  const ice = calcOwnershipCost({
    ...common,
    purchase: iceReal,
    fuelType: "gasoline",
    displacementCc: ICE_CC,
    annualEnergy: (km / ICE_EFF) * (s.fuelWon ?? FUEL),
  });
  // 양수면 휘발유차가 더 듦(전기차가 이득)
  return { ev, ice, diff: ice.totals.all - ev.totals.all };
}

const base = run();
const verdict = (d: number) =>
  d >= 0
    ? `전기차가 ${formatWon(d)} 덜 듭니다`
    : `휘발유차가 ${formatWon(-d)} 덜 듭니다`;

// 손익 주행거리: diff가 주행거리에 거의 정비례하므로 두 점으로 구한다 (100km 단위로 올림)
const breakEven = (s: Omit<Scenario, "km"> = {}) => {
  const a = run({ ...s, km: 0 }).diff;
  const b = run({ ...s, km: 10_000 }).diff;
  const slope = (b - a) / 10_000;
  if (slope <= 0) return null;
  return Math.ceil(-a / slope / 100) * 100;
};
const beSlow = breakEven();
const beFast = breakEven({ evWon: fast.wonPerKwh });

const kms = [10_000, 15_000, 20_000, 30_000];
const byKm = kms.map((km) => ({ km, r: run({ km }) }));
const byCharge = [slow, fast, ultra].map((t) => ({
  t,
  r: run({ evWon: t.wonPerKwh }),
}));
const fuels = [1_500, 1_700, 1_900, 2_100];
const byFuel = fuels.map((f) => ({ f, r: run({ fuelWon: f }) }));
const yearTaxEv = base.ev.rows[1]!.carTax;
const yearTaxIce = base.ice.rows[1]!.carTax;

const sources = [
  ...own.sources,
  ...charging.sources.filter((s) => s.key === "values.publicTiers"),
  ...reg.sources.filter((s) =>
    ["values.rates", "values.evRelief", "rules.subsidyInBase"].includes(s.key),
  ),
];

export default function Article({ meta }: { meta: GuideMeta }) {
  return (
    <GuideLayout
      meta={meta}
      summary={[
        <>
          4,500만원 전기차(보조금 900만원)와 3,000만원 1,598cc 휘발유차를 {y0}년
          1월에 사서 1년 {KM.toLocaleString("ko-KR")}km씩 5개 연도를 타면
          {Math.abs(base.diff) < 1_000_000
            ? ", 두 차에 드는 돈은 거의 같습니다"
            : ""}
          . 이 조건에서는 <strong>{verdict(base.diff)}</strong>.
        </>,
        <>
          손익이 갈리는 지점은 1년 약 {beSlow?.toLocaleString("ko-KR")}km입니다.
          이보다 많이 달리면 전기차, 적게 달리면 휘발유차가 유리하고,
          충전을 {tierLabel(fast)} 충전기로만 하면 이 지점이 약{" "}
          {beFast?.toLocaleString("ko-KR")}km로 밀립니다(
          {formatKoreanDate(meta.asOf)} 세율 기준).
        </>,
        <>
          내 차값과 주행거리로는{" "}
          <Link href="/car-loan/">실구매가·할부 계산기</Link>의 5년 비용
          비교에서 바로 계산할 수 있습니다.
        </>,
      ]}
      faq={[
        {
          q: "1년에 몇 km를 달려야 전기차가 이득인가요?",
          a: `이 글 조건(차값 차이, 연비 ${ICE_EFF}km/L, 기름값 ${FUEL.toLocaleString("ko-KR")}원, 전비 ${EV_EFF}km/kWh)에서는 공공 완속 충전 기준 1년 약 ${beSlow?.toLocaleString("ko-KR")}km입니다. 차값 차이가 줄거나 기름값이 오르면 이 기준이 내려갑니다.`,
        },
        {
          q: "자동차세는 얼마나 차이 나나요?",
          a: `전기차는 배기량과 관계없이 1년 ${formatWon(yearTaxEv)}(지방교육세 포함)입니다. 1,598cc 휘발유차는 ${y0 + 1}년 ${formatWon(yearTaxIce)}이고, 3년째부터 차령 경감으로 조금씩 줄어듭니다.`,
        },
        {
          q: "중고로 팔 때 값은 왜 빠졌나요?",
          a: "중고 시세는 차종, 주행거리, 시장 상황에 따라 크게 달라 공식 기준이 없습니다. 5년 뒤 팔 계획이라면 두 차의 예상 시세 차이를 이 글의 결과에 직접 더해 보세요.",
        },
      ]}
      sources={sources}
      disclaimer="예시 조건은 이해를 돕기 위한 가정이며, 실제 비용은 차값, 보조금, 주행 습관, 충전·주유 가격에 따라 달라집니다. 세율이나 요금이 바뀌면 이 글을 고칩니다."
    >
      <section data-article-section="conditions">
        <h2>계산 조건 (가정)</h2>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th scope="col">항목</th>
                <th scope="col">전기차</th>
                <th scope="col">휘발유차</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <th scope="row">차값(부가세 포함)</th>
                <td>{formatWon(EV_PRICE)}</td>
                <td>{formatWon(ICE_PRICE)}</td>
              </tr>
              <tr>
                <th scope="row">보조금</th>
                <td>{formatWon(EV_SUBSIDY)}</td>
                <td>없음</td>
              </tr>
              <tr>
                <th scope="row">효율</th>
                <td>{EV_EFF}km/kWh</td>
                <td>
                  {ICE_EFF}km/L, {ICE_CC.toLocaleString("ko-KR")}cc
                </td>
              </tr>
              <tr>
                <th scope="row">에너지 가격</th>
                <td>공공 완속 kWh당 {slow.wonPerKwh.toFixed(1)}원</td>
                <td>1L에 {FUEL.toLocaleString("ko-KR")}원</td>
              </tr>
              <tr>
                <th scope="row">구입·주행</th>
                <td colSpan={2}>
                  {formatKoreanDate(START)} 인도·등록, 1년{" "}
                  {KM.toLocaleString("ko-KR")}km, {y0}~{y0 + YEARS - 1}년
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className="muted small">
          차값·보조금·연비·전비·기름값은 특정 차종이 아닌 예시입니다. 공공
          충전요금과 세금은 확인된 기준을 썼고, 보험료·정비비·중고 시세는 넣지
          않았습니다.
        </p>
      </section>

      <section data-article-section="steps">
        <h2>단계별 계산</h2>
        <ol>
          <li>
            <strong>실구매가:</strong> 전기차는 차값에서 보조금을 빼고 취득세{" "}
            {formatWon(evTaxJan.payable)}을 더해 {formatWon(evReal)}입니다. 1월
            인도라 현행법상 전기차 취득세 감면이 없습니다. 휘발유차는 취득세{" "}
            {formatWon(iceTax.payable)}을 더해 {formatWon(iceReal)}입니다.
            출발선 차이는 {formatWon(evReal - iceReal)}입니다.
          </li>
          <li>
            <strong>자동차세:</strong> 등록한 해는 1월 4일부터 날짜만큼, 그 뒤는
            1년치를 냅니다. 5개 연도 합계는 전기차{" "}
            {formatWon(base.ev.totals.carTax)}, 휘발유차{" "}
            {formatWon(base.ice.totals.carTax)}입니다.
          </li>
          <li>
            <strong>충전비·기름값:</strong> 1km에 전기차는{" "}
            {(slow.wonPerKwh / EV_EFF).toFixed(1)}원, 휘발유차는{" "}
            {(FUEL / ICE_EFF).toFixed(1)}원이 듭니다. 5개 연도 합계는 전기차{" "}
            {formatWon(base.ev.totals.energy)}, 휘발유차{" "}
            {formatWon(base.ice.totals.energy)}입니다.
          </li>
          <li>
            <strong>합계:</strong> 전기차 {formatWon(base.ev.totals.all)},
            휘발유차 {formatWon(base.ice.totals.all)}. {verdict(base.diff)}.
          </li>
        </ol>

        <h3>연도별 누적</h3>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th scope="col">연도</th>
                <th scope="col">전기차</th>
                <th scope="col">휘발유차</th>
              </tr>
            </thead>
            <tbody>
              {base.ev.rows.map((r, i) => (
                <tr key={r.year}>
                  <td>{r.year}년</td>
                  <td>{formatWon(r.cumulative)}</td>
                  <td>{formatWon(base.ice.rows[i]!.cumulative)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p>
          처음에 {formatWon(evReal - iceReal)} 비싸게 산 전기차가 해마다
          운행비로 1년 약{" "}
          {formatWon(
            base.ice.rows[1]!.carTax +
              base.ice.rows[1]!.energy -
              base.ev.rows[1]!.carTax -
              base.ev.rows[1]!.energy,
          )}
          씩 차이를 줄이는 구조입니다.
        </p>
      </section>

      <section data-article-section="variations">
        <h2>조건이 바뀌면</h2>

        <h3 data-variation>많이 달릴수록 전기차가 유리하다</h3>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th scope="col">1년 주행</th>
                <th scope="col">전기차</th>
                <th scope="col">휘발유차</th>
                <th scope="col">결과</th>
              </tr>
            </thead>
            <tbody>
              {byKm.map(({ km, r }) => (
                <tr key={km}>
                  <td>{km.toLocaleString("ko-KR")}km</td>
                  <td>{formatWon(r.ev.totals.all)}</td>
                  <td>{formatWon(r.ice.totals.all)}</td>
                  <td>
                    {r.diff >= 0 ? "전기차" : "휘발유차"}{" "}
                    {formatWon(Math.abs(r.diff))} 적음
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p>
          1년 {byKm[3]!.km.toLocaleString("ko-KR")}km를 달리면 5개 연도에{" "}
          {verdict(byKm[3]!.r.diff)}. 1년 {byKm[0]!.km.toLocaleString("ko-KR")}
          km만 달린다면 {verdict(byKm[0]!.r.diff)}. 손익이 갈리는 주행거리는
          공공 완속 충전 기준 1년 약 {beSlow?.toLocaleString("ko-KR")}km입니다.
        </p>

        <h3 data-variation>급속으로만 충전하면 차이가 줄어든다</h3>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th scope="col">전기차 충전</th>
                <th scope="col">전기차 5개 연도</th>
                <th scope="col">결과</th>
              </tr>
            </thead>
            <tbody>
              {byCharge.map(({ t, r }) => (
                <tr key={t.minKw}>
                  <td>
                    공공 {tierLabel(t)} ({t.wonPerKwh.toFixed(1)}원)
                  </td>
                  <td>{formatWon(r.ev.totals.all)}</td>
                  <td>
                    {r.diff >= 0 ? "전기차" : "휘발유차"}{" "}
                    {formatWon(Math.abs(r.diff))} 적음
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p>
          충전 단가가 오르면 1km당 비용 차이가 줄어 손익 주행거리가 올라갑니다.
          집에서 이보다 싼 단가로 충전한다면 반대로 전기차가 더 빨리
          유리해집니다.
        </p>

        <h3 data-variation>기름값이 오르면 전기차 쪽으로 기운다</h3>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th scope="col">기름값(가정)</th>
                <th scope="col">휘발유차 5개 연도</th>
                <th scope="col">결과</th>
              </tr>
            </thead>
            <tbody>
              {byFuel.map(({ f, r }) => (
                <tr key={f}>
                  <td>1L에 {f.toLocaleString("ko-KR")}원</td>
                  <td>{formatWon(r.ice.totals.all)}</td>
                  <td>
                    {r.diff >= 0 ? "전기차" : "휘발유차"}{" "}
                    {formatWon(Math.abs(r.diff))} 적음
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p>
          기름값이 1L에 200원 오를 때마다 휘발유차의 5개 연도 비용이{" "}
          {formatWon(byFuel[2]!.r.ice.totals.all - byFuel[1]!.r.ice.totals.all)}{" "}
          늘어납니다. 오늘 기름값은 오피넷에서 확인해 계산기에 넣어 보세요.
        </p>
      </section>

      <section data-article-section="pitfalls">
        <h2>놓치기 쉬운 것</h2>
        <ol>
          <li>
            <strong>12월에 인도받으면 결과가 바뀝니다.</strong> 현행법상 전기차
            취득세 감면은 {formatKoreanDate(p.evRelief.until)} 취득분까지라,
            같은 전기차를 12월에 인도받으면 취득세가{" "}
            {formatWon(evTaxDec.payable)}으로{" "}
            {formatWon(evTaxJan.payable - evTaxDec.payable)} 줄어듭니다. 그만큼
            전기차가 더 유리해집니다.
          </li>
          <li>
            <strong>보조금은 사는 곳마다 다릅니다.</strong> 이 글의 900만원은
            예시입니다. 지방비는 지자체마다 정해 같은 차라도 사는 곳에 따라
            보조금이 다르니, 무공해차 통합누리집 보조금 계산기로 내 지역 금액을
            확인하세요.
          </li>
          <li>
            <strong>중고 시세 차이가 결과를 뒤집을 수 있습니다.</strong> 5년 뒤
            팔 때 두 차의 시세 차이가 이 글의 차이보다 크면 결론이 달라집니다.
          </li>
          <li>
            <strong>
              {own.latestYear + 1}년 이후 세금은 현행 세율 기준입니다.
            </strong>{" "}
            자동차세 세율이 바뀌면 다시 계산해야 합니다.
          </li>
        </ol>
      </section>
    </GuideLayout>
  );
}
