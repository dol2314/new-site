"use client";

import {
  calcChargingCost,
  formatWon,
  type ChargeTier,
  type ChargingMixItem,
} from "@site/calc-core";
import { useEffect, useRef, useState } from "react";
import { track, type ResultBand } from "@/lib/analytics";
import { tierLabel } from "@/lib/charging";

const decimal = (s: string) =>
  s.replace(/[^0-9.]/g, "").replace(/(\..*)\./g, "$1");
const digits = (s: string) => s.replace(/[^0-9]/g, "");

function band(monthly: number): ResultBand {
  if (monthly < 50_000) return "low";
  if (monthly < 100_000) return "mid";
  if (monthly < 150_000) return "high";
  return "very-high";
}

export function EvChargingCalculator({
  tiers,
  fuelPriceUrl,
}: {
  tiers: ChargeTier[];
  fuelPriceUrl: string;
}) {
  const [km, setKm] = useState("1500");
  const [eff, setEff] = useState("5.0");
  const [tierIdx, setTierIdx] = useState(0);
  const [pubShare, setPubShare] = useState("100");
  const [homePrice, setHomePrice] = useState("");
  const [homeShare, setHomeShare] = useState("0");
  const [privPrice, setPrivPrice] = useState("");
  const [privShare, setPrivShare] = useState("0");
  const [kmPerL, setKmPerL] = useState("");
  const [fuelPrice, setFuelPrice] = useState("");
  const done = useRef("");

  const tier = tiers[tierIdx] ?? tiers[0]!;
  const shares = [pubShare, homeShare, privShare].map((s) =>
    s === "" ? 0 : Number(s),
  );
  const shareSum = shares.reduce((a, b) => a + b, 0);

  const calc = (() => {
    if (km === "" || eff === "") return null;
    if (shareSum !== 100)
      return {
        r: null,
        error: `충전 비율 합이 ${shareSum}%입니다. 100%로 맞춰 주세요.`,
      };
    const mix: ChargingMixItem[] = [];
    if (shares[0]! > 0)
      mix.push({
        label: `공공 충전기 (${tierLabel(tier)})`,
        share: shares[0]! / 100,
        wonPerKwh: tier.wonPerKwh,
      });
    if (shares[1]! > 0) {
      if (homePrice === "")
        return { r: null, error: "집·아파트 충전 단가를 넣어 주세요." };
      mix.push({
        label: "집·아파트 충전기",
        share: shares[1]! / 100,
        wonPerKwh: Number(homePrice),
      });
    }
    if (shares[2]! > 0) {
      if (privPrice === "")
        return { r: null, error: "민간 충전기 단가를 넣어 주세요." };
      mix.push({
        label: "민간 충전기 (사업자 요금)",
        share: shares[2]! / 100,
        wonPerKwh: Number(privPrice),
      });
    }
    try {
      const r = calcChargingCost({
        monthlyKm: Number(km),
        kmPerKwh: Number(eff),
        mix,
        fuel:
          kmPerL !== "" && fuelPrice !== ""
            ? { kmPerLiter: Number(kmPerL), wonPerLiter: Number(fuelPrice) }
            : undefined,
      });
      return { r, error: null as string | null };
    } catch (e) {
      return {
        r: null,
        error: e instanceof Error ? e.message : "입력값을 확인하세요",
      };
    }
  })();

  useEffect(() => {
    if (!calc?.r) return;
    const key = `${calc.r.monthlyCost}`;
    if (done.current === key) return;
    done.current = key;
    track("tool_complete", {
      tool: "ev-charging",
      result_band: band(calc.r.monthlyCost),
    });
  }, [calc]);

  const r = calc?.r ?? null;

  return (
    <form
      className="calc-form"
      onSubmit={(e) => e.preventDefault()}
      onChange={() => track("tool_start", { tool: "ev-charging" })}
    >
      <h3>1. 주행거리와 전비</h3>
      <div className="field">
        <label htmlFor="km">한 달 주행거리 (km)</label>
        <input
          id="km"
          inputMode="numeric"
          value={km}
          onChange={(e) => setKm(digits(e.target.value))}
        />
      </div>
      <div className="field">
        <label htmlFor="eff">전비 (km/kWh)</label>
        <input
          id="eff"
          inputMode="decimal"
          value={eff}
          onChange={(e) => setEff(decimal(e.target.value))}
        />
        <p className="hint">
          계기판의 평균 전비를 넣으세요. 처음 값 5.0은 예시입니다.
        </p>
      </div>

      <h3>2. 어디서 얼마나 충전하나요</h3>
      <fieldset className="field">
        <legend>공공 충전기 (기후에너지환경부 요금)</legend>
        <label htmlFor="tier">충전기 출력</label>
        <select
          id="tier"
          value={tierIdx}
          onChange={(e) => setTierIdx(Number(e.target.value))}
        >
          {tiers.map((t, i) => (
            <option key={i} value={i}>
              {tierLabel(t)} — kWh당 {t.wonPerKwh.toFixed(1)}원
            </option>
          ))}
        </select>
        <label htmlFor="pubShare">비율 (%)</label>
        <input
          id="pubShare"
          inputMode="numeric"
          value={pubShare}
          onChange={(e) => setPubShare(digits(e.target.value))}
        />
      </fieldset>
      <fieldset className="field">
        <legend>집·아파트 충전기</legend>
        <label htmlFor="homePrice">kWh당 요금 (원)</label>
        <input
          id="homePrice"
          inputMode="decimal"
          value={homePrice}
          onChange={(e) => setHomePrice(decimal(e.target.value))}
        />
        <label htmlFor="homeShare">비율 (%)</label>
        <input
          id="homeShare"
          inputMode="numeric"
          value={homeShare}
          onChange={(e) => setHomeShare(digits(e.target.value))}
        />
        <p className="hint">
          아파트 충전기는 사업자 앱이나 충전기 화면, 집 콘센트·전용 계량기는
          전기요금 고지서에서 단가를 확인하세요.
        </p>
      </fieldset>
      <fieldset className="field">
        <legend>민간 충전기 (사업자 자체 요금)</legend>
        <label htmlFor="privPrice">kWh당 요금 (원)</label>
        <input
          id="privPrice"
          inputMode="decimal"
          value={privPrice}
          onChange={(e) => setPrivPrice(decimal(e.target.value))}
        />
        <label htmlFor="privShare">비율 (%)</label>
        <input
          id="privShare"
          inputMode="numeric"
          value={privShare}
          onChange={(e) => setPrivShare(digits(e.target.value))}
        />
        <p className="hint">
          사업자마다, 회원·비회원마다 요금이 다릅니다. 쓰는 사업자 앱의 요금을
          넣으세요.
        </p>
      </fieldset>

      <h3>3. 같은 거리 주유비와 비교 (선택)</h3>
      <div className="field">
        <label htmlFor="kmPerL">비교할 차 연비 (km/L)</label>
        <input
          id="kmPerL"
          inputMode="decimal"
          value={kmPerL}
          onChange={(e) => setKmPerL(decimal(e.target.value))}
        />
      </div>
      <div className="field">
        <label htmlFor="fuelPrice">기름값 (원/L)</label>
        <input
          id="fuelPrice"
          inputMode="numeric"
          value={fuelPrice}
          onChange={(e) => setFuelPrice(digits(e.target.value))}
        />
        <p className="hint">
          오늘 기름값은{" "}
          <a href={fuelPriceUrl} rel="noopener">
            오피넷
          </a>
          에서 확인하세요.
        </p>
      </div>

      <output className="result" aria-live="polite">
        {calc?.error && <p className="error">{calc.error}</p>}
        {r && (
          <>
            <p className="result-main">
              한 달 충전비 <strong>{formatWon(r.monthlyCost)}</strong>
            </p>
            <div className="table-wrap">
              <table>
                <tbody>
                  {r.items.map((i) => (
                    <tr key={i.label}>
                      <th scope="row">{i.label}</th>
                      <td>
                        {formatWon(i.cost)}
                        <div className="muted small">
                          {i.kwh.toLocaleString("ko-KR")}kWh × {i.wonPerKwh}원
                        </div>
                      </td>
                    </tr>
                  ))}
                  <tr>
                    <th scope="row">필요한 전력</th>
                    <td>{r.kwh.toLocaleString("ko-KR")}kWh</td>
                  </tr>
                  <tr>
                    <th scope="row">1년</th>
                    <td>{formatWon(r.annualCost)}</td>
                  </tr>
                  <tr>
                    <th scope="row">1km당</th>
                    <td>{r.wonPerKm.toLocaleString("ko-KR")}원</td>
                  </tr>
                  {r.fuel && r.monthlyDiff !== null && (
                    <>
                      <tr>
                        <th scope="row">같은 거리 주유비</th>
                        <td>
                          {formatWon(r.fuel.monthlyCost)}
                          <div className="muted small">
                            {r.fuel.liters.toLocaleString("ko-KR")}L, 1km당{" "}
                            {r.fuel.wonPerKm.toLocaleString("ko-KR")}원
                          </div>
                        </td>
                      </tr>
                      <tr className="selected">
                        <th scope="row">
                          {r.monthlyDiff >= 0
                            ? "한 달 아끼는 돈"
                            : "한 달 더 드는 돈"}
                        </th>
                        <td>{formatWon(Math.abs(r.monthlyDiff))}</td>
                      </tr>
                    </>
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}
      </output>
    </form>
  );
}
