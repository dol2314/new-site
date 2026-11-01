"use client";

import {
  calcOwnershipCost,
  calcPurchase,
  calcRegistrationTax,
  formatWon,
  type CarTaxParams,
  type ChargeTier,
  type FuelType,
  type OwnershipResult,
  type Powertrain,
  type RegistrationTaxParams,
} from "@site/calc-core";
import { useState } from "react";
import { tierLabel } from "@/lib/charging";

export interface CompareData {
  carTaxByYear: Record<number, CarTaxParams>;
  latestYear: number;
  newRegistration: { minCollectWon: number; halfBasisMinAge: number };
  tiers: ChargeTier[];
}

interface CarA {
  realPrice: number;
  power: Powertrain;
  acquiredOn: string;
}

const YEARS = 5;
const POWER: { id: Powertrain; label: string }[] = [
  { id: "ice", label: "휘발유·경유·LPG" },
  { id: "hybrid", label: "하이브리드" },
  { id: "electric", label: "전기" },
  { id: "hydrogen", label: "수소" },
];
const num = (s: string) => (s === "" ? 0 : Number(s));
const digits = (s: string) => s.replace(/[^0-9]/g, "");
const decimal = (s: string) =>
  s.replace(/[^0-9.]/g, "").replace(/(\..*)\./g, "$1");
const fuelOf = (p: Powertrain): FuelType =>
  p === "ice" ? "gasoline" : p === "hybrid" ? "hybrid" : p;
const unitOf = (p: Powertrain) =>
  p === "electric"
    ? { eff: "전비 (km/kWh)", price: "kWh당 요금 (원)" }
    : p === "hydrogen"
      ? { eff: "연비 (km/kg)", price: "수소 1kg 가격 (원)" }
      : { eff: "연비 (km/L)", price: "기름값 (원/L)" };

interface CarInputs {
  cc: string;
  eff: string;
  /** 전기차: 공공 요금 단계 번호 또는 "custom" */
  tier: string;
  price: string;
  insurance: string;
}

const EMPTY: CarInputs = {
  cc: "",
  eff: "",
  tier: "0",
  price: "",
  insurance: "",
};

function CarFields({
  id,
  power,
  v,
  set,
  tiers,
}: {
  id: string;
  power: Powertrain;
  v: CarInputs;
  set: (v: CarInputs) => void;
  tiers: ChargeTier[];
}) {
  const u = unitOf(power);
  const cc = power === "ice" || power === "hybrid";
  return (
    <>
      {cc && (
        <div className="field">
          <label htmlFor={`${id}-cc`}>배기량 (cc)</label>
          <input
            id={`${id}-cc`}
            inputMode="numeric"
            value={v.cc}
            onChange={(e) => set({ ...v, cc: digits(e.target.value) })}
          />
        </div>
      )}
      <div className="field">
        <label htmlFor={`${id}-eff`}>{u.eff}</label>
        <input
          id={`${id}-eff`}
          inputMode="decimal"
          value={v.eff}
          onChange={(e) => set({ ...v, eff: decimal(e.target.value) })}
        />
      </div>
      {power === "electric" && (
        <div className="field">
          <label htmlFor={`${id}-tier`}>주로 쓰는 충전</label>
          <select
            id={`${id}-tier`}
            value={v.tier}
            onChange={(e) => set({ ...v, tier: e.target.value })}
          >
            {tiers.map((t, i) => (
              <option key={i} value={String(i)}>
                공공 {tierLabel(t)} — {t.wonPerKwh.toFixed(1)}원
              </option>
            ))}
            <option value="custom">집·민간 요금 직접 입력</option>
          </select>
        </div>
      )}
      {(power !== "electric" || v.tier === "custom") && (
        <div className="field">
          <label htmlFor={`${id}-unit`}>{u.price}</label>
          <input
            id={`${id}-unit`}
            inputMode="decimal"
            value={v.price}
            onChange={(e) => set({ ...v, price: decimal(e.target.value) })}
          />
        </div>
      )}
      <div className="field">
        <label htmlFor={`${id}-ins`}>1년 보험료 (만원, 선택)</label>
        <input
          id={`${id}-ins`}
          inputMode="numeric"
          value={v.insurance}
          onChange={(e) => set({ ...v, insurance: digits(e.target.value) })}
        />
      </div>
    </>
  );
}

export function CostCompare({
  carA,
  regParams,
  data,
}: {
  carA: CarA | null;
  regParams: RegistrationTaxParams;
  data: CompareData;
}) {
  const [km, setKm] = useState("15000");
  const [a, setA] = useState<CarInputs>(EMPTY);
  const [bPower, setBPower] = useState<Powertrain>("ice");
  const [bCompact, setBCompact] = useState(false);
  const [bPrice, setBPrice] = useState("");
  const [bSubsidy, setBSubsidy] = useState("");
  const [b, setB] = useState<CarInputs>(EMPTY);

  const paramsFor = (y: number) =>
    data.carTaxByYear[Math.min(y, data.latestYear)]!;

  const energyPrice = (p: Powertrain, v: CarInputs) =>
    p === "electric" && v.tier !== "custom"
      ? (data.tiers[Number(v.tier)]?.wonPerKwh ?? null)
      : v.price === ""
        ? null
        : Number(v.price);

  const run = (
    p: Powertrain,
    v: CarInputs,
    purchase: number,
    start: string,
  ): OwnershipResult | string => {
    const cc = p === "ice" || p === "hybrid";
    if (cc && v.cc === "") return "배기량을 넣어 주세요.";
    if (v.eff === "" || num(v.eff) <= 0)
      return `${unitOf(p).eff}를 넣어 주세요.`;
    const price = energyPrice(p, v);
    if (price === null) return `${unitOf(p).price}을 넣어 주세요.`;
    try {
      return calcOwnershipCost({
        start,
        years: YEARS,
        purchase,
        fuelType: fuelOf(p),
        displacementCc: cc ? num(v.cc) : undefined,
        carTaxParamsFor: paramsFor,
        newRegistration: data.newRegistration,
        annualEnergy: (num(km) / num(v.eff)) * price,
        annualInsurance: num(v.insurance) * 10_000,
      });
    } catch (e) {
      return e instanceof Error ? e.message : "입력값을 확인하세요";
    }
  };

  const result = (() => {
    if (!carA) return { error: "1단계에서 차값과 취득일을 먼저 넣어 주세요." };
    if (km === "") return { error: "1년 주행거리를 넣어 주세요." };
    if (bPrice === "") return { error: "비교할 차의 차값을 넣어 주세요." };
    const ra = run(carA.power, a, carA.realPrice, carA.acquiredOn);
    if (typeof ra === "string") return { error: `이 차: ${ra}` };
    let bReal: number;
    try {
      const priceWon = num(bPrice) * 10_000;
      const tax = calcRegistrationTax(
        {
          price: priceWon,
          vatIncluded: true,
          compact: bCompact,
          powertrain: bPower,
          seats7to10: false,
          childrenUnder18: 0,
          acquiredOn: carA.acquiredOn,
        },
        regParams,
      );
      bReal = calcPurchase({
        price: priceWon,
        subsidy:
          bPower === "electric" || bPower === "hydrogen"
            ? num(bSubsidy) * 10_000
            : 0,
        registrationTax: tax.payable,
        extra: 0,
        downPayment: 0,
        financeTaxAndExtra: false,
      }).realPrice;
    } catch (e) {
      return { error: e instanceof Error ? e.message : "입력값을 확인하세요" };
    }
    const rb = run(bPower, b, bReal, carA.acquiredOn);
    if (typeof rb === "string") return { error: `비교할 차: ${rb}` };
    return { ra, rb };
  })();

  const y0 = carA ? Number(carA.acquiredOn.slice(0, 4)) : null;
  const assumed = y0 !== null && y0 + YEARS - 1 > data.latestYear;

  return (
    <>
      <h3>3. 5년 비용 비교 (선택)</h3>
      <p className="hint">
        위에서 넣은 차와 다른 차 한 대를 같은 날 산다고 보고, 등록한 해부터 5개
        연도 동안의 실구매가·자동차세·연료(충전)비·보험료를 더합니다.
      </p>
      <div className="field">
        <label htmlFor="cmp-km">1년 주행거리 (km)</label>
        <input
          id="cmp-km"
          inputMode="numeric"
          value={km}
          onChange={(e) => setKm(digits(e.target.value))}
        />
        <p className="hint">처음 값 15,000km는 예시입니다.</p>
      </div>

      <fieldset className="field">
        <legend>이 차 (1단계에서 넣은 차)</legend>
        {carA && (
          <CarFields
            id="cmp-a"
            power={carA.power}
            v={a}
            set={setA}
            tiers={data.tiers}
          />
        )}
      </fieldset>

      <fieldset className="field">
        <legend>비교할 차</legend>
        <div className="field">
          <label htmlFor="cmp-b-power">연료</label>
          <select
            id="cmp-b-power"
            value={bPower}
            onChange={(e) => setBPower(e.target.value as Powertrain)}
          >
            {POWER.map((p) => (
              <option key={p.id} value={p.id}>
                {p.label}
              </option>
            ))}
          </select>
          <label className="inline">
            <input
              type="checkbox"
              checked={bCompact}
              onChange={(e) => setBCompact(e.target.checked)}
            />{" "}
            경형 자동차
          </label>
        </div>
        <div className="field">
          <label htmlFor="cmp-b-price">차값 (만원, 부가세 포함)</label>
          <input
            id="cmp-b-price"
            inputMode="numeric"
            value={bPrice}
            onChange={(e) => setBPrice(digits(e.target.value))}
          />
        </div>
        {(bPower === "electric" || bPower === "hydrogen") && (
          <div className="field">
            <label htmlFor="cmp-b-subsidy">보조금 합계 (만원)</label>
            <input
              id="cmp-b-subsidy"
              inputMode="numeric"
              value={bSubsidy}
              onChange={(e) => setBSubsidy(digits(e.target.value))}
            />
          </div>
        )}
        <CarFields
          id="cmp-b"
          power={bPower}
          v={b}
          set={setB}
          tiers={data.tiers}
        />
      </fieldset>

      <div className="result" aria-live="polite">
        {"error" in result && <p className="hint">{result.error}</p>}
        {"ra" in result && result.ra && result.rb && y0 !== null && (
          <>
            <p className="result-main">
              {y0}~{y0 + YEARS - 1}년 합계 차이{" "}
              <strong>
                {formatWon(
                  Math.abs(result.ra.totals.all - result.rb.totals.all),
                )}
              </strong>
              <br />
              <span className="small">
                {result.ra.totals.all <= result.rb.totals.all
                  ? "이 차가 덜 듭니다"
                  : "비교할 차가 덜 듭니다"}
              </span>
            </p>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th scope="col">항목</th>
                    <th scope="col">이 차</th>
                    <th scope="col">비교할 차</th>
                  </tr>
                </thead>
                <tbody>
                  {(
                    [
                      ["실구매가", "purchase"],
                      ["자동차세", "carTax"],
                      ["연료·충전비", "energy"],
                      ["보험료", "insurance"],
                    ] as const
                  ).map(([label, k]) => (
                    <tr key={k}>
                      <th scope="row">{label}</th>
                      <td>{formatWon(result.ra!.totals[k])}</td>
                      <td>{formatWon(result.rb!.totals[k])}</td>
                    </tr>
                  ))}
                  <tr className="selected">
                    <th scope="row">합계</th>
                    <td>{formatWon(result.ra.totals.all)}</td>
                    <td>{formatWon(result.rb.totals.all)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <h4>연도별 누적</h4>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th scope="col">연도</th>
                    <th scope="col">이 차</th>
                    <th scope="col">비교할 차</th>
                  </tr>
                </thead>
                <tbody>
                  {result.ra.rows.map((r, i) => (
                    <tr key={r.year}>
                      <th scope="row">{r.year}년</th>
                      <td>{formatWon(r.cumulative)}</td>
                      <td>{formatWon(result.rb!.rows[i]!.cumulative)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="hint">
              {y0}년은 등록일부터 연말까지만 셉니다. 중고로 팔 때 받는 돈,
              정비비, 할부 이자, 연납 공제는 넣지 않았습니다.
              {assumed &&
                ` ${data.latestYear + 1}년 이후 자동차세는 ${data.latestYear}년 세율이 그대로라고 보고 계산했습니다.`}
            </p>
          </>
        )}
      </div>
    </>
  );
}
