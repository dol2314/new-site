"use client";

import { ageStartDate, calcCarTax, calcPrepay, formatWon, type CarTaxParams, type FuelType, type PrepayParams } from "@site/calc-core";
import { useEffect, useMemo, useRef, useState } from "react";
import { track, type ResultBand } from "@/lib/analytics";
import { useTodayKst } from "@/lib/use-today";

export interface YearData {
  year: number;
  tax: CarTaxParams;
  prepay: PrepayParams;
  smallTaxThresholdWon: number;
}

const FUELS: { id: FuelType; label: string }[] = [
  { id: "gasoline", label: "휘발유" },
  { id: "diesel", label: "경유" },
  { id: "lpg", label: "LPG" },
  { id: "hybrid", label: "하이브리드" },
  { id: "electric", label: "전기" },
  { id: "hydrogen", label: "수소" },
];

function band(total: number): ResultBand {
  if (total < 150_000) return "low";
  if (total < 400_000) return "mid";
  if (total < 700_000) return "high";
  return "very-high";
}

export function CarTaxCalculator({ years }: { years: YearData[] }) {
  const [fuel, setFuel] = useState<FuelType>("gasoline");
  const [cc, setCc] = useState("1999");
  const [regDateSel, setRegDate] = useState<string | null>(null);
  const [sameYear, setSameYear] = useState(true);
  const [prodYear, setProdYear] = useState("");
  const [yearSel, setYear] = useState<number | null>(null);
  const today = useTodayKst();
  const started = useRef(false);
  const completed = useRef("");

  // 기본값은 오늘(브라우저 기준)에서 계산한다: 올해 데이터가 있으면 올해, 등록일은 3년 전 3월 15일
  const todayYear = today ? Number(today.slice(0, 4)) : null;
  const year = yearSel ?? (todayYear !== null && years.some((d) => d.year === todayYear) ? todayYear : (years[0]?.year ?? 2026));
  const regDate = regDateSel ?? (todayYear !== null ? `${todayYear - 3}-03-15` : "");

  const flat = fuel === "electric" || fuel === "hydrogen";
  const data = years.find((d) => d.year === year);

  const result = useMemo(() => {
    if (!data || !regDate) return null;
    try {
      const start = ageStartDate(regDate, sameYear || !prodYear ? undefined : Number(prodYear));
      const tax = calcCarTax({ fuelType: fuel, displacementCc: flat ? undefined : Number(cc), ageStartDate: start, taxYear: year }, data.tax);
      const prepays = data.prepay.periods.map((p) => ({ period: p, r: calcPrepay(tax, p.month, year, data.prepay) }));
      return { tax, prepays, error: null as string | null };
    } catch (e) {
      return { tax: null, prepays: [], error: e instanceof Error ? e.message : "입력값을 확인하세요" };
    }
  }, [data, regDate, sameYear, prodYear, fuel, flat, cc, year]);

  useEffect(() => {
    if (!result?.tax) return;
    const key = `${result.tax.annualTotal}`;
    if (completed.current === key) return;
    completed.current = key;
    track("tool_complete", { tool: "car-tax", result_band: band(result.tax.annualTotal) });
  }, [result]);

  const onInput = () => {
    if (started.current) return;
    started.current = true;
    track("tool_start", { tool: "car-tax" });
  };

  return (
    <form className="calc-form" onSubmit={(e) => e.preventDefault()} onChange={onInput}>
      <div className="field">
        <label htmlFor="fuel">연료</label>
        <select id="fuel" value={fuel} onChange={(e) => setFuel(e.target.value as FuelType)}>
          {FUELS.map((f) => (
            <option key={f.id} value={f.id}>
              {f.label}
            </option>
          ))}
        </select>
      </div>
      {!flat && (
        <div className="field">
          <label htmlFor="cc">배기량 (cc)</label>
          <input id="cc" inputMode="numeric" value={cc} onChange={(e) => setCc(e.target.value.replace(/[^0-9]/g, ""))} />
          <p className="hint">자동차등록증의 &apos;배기량&apos; 칸에 있습니다.</p>
        </div>
      )}
      <div className="field">
        <label htmlFor="reg">최초 등록일</label>
        <input id="reg" type="date" value={regDate} onChange={(e) => setRegDate(e.target.value)} />
      </div>
      <div className="field">
        <label>
          <input type="checkbox" checked={sameYear} onChange={(e) => setSameYear(e.target.checked)} /> 만들어진 해에 등록한 차예요 (대부분 해당)
        </label>
        {!sameYear && (
          <>
            <label htmlFor="prod">제작연도</label>
            <input id="prod" inputMode="numeric" placeholder="예: 2024" value={prodYear} onChange={(e) => setProdYear(e.target.value.replace(/[^0-9]/g, "").slice(0, 4))} />
            <p className="hint">제작연도에 등록하지 않은 차는 제작연도 12월 31일부터 차령을 셉니다.</p>
          </>
        )}
      </div>
      <div className="field">
        <label htmlFor="year">과세연도</label>
        <select id="year" value={year} onChange={(e) => setYear(Number(e.target.value))}>
          {years.map((d) => (
            <option key={d.year} value={d.year}>
              {d.year}년
            </option>
          ))}
        </select>
      </div>

      <output className="result" aria-live="polite">
        {result?.error && <p className="error">{result.error}</p>}
        {result?.tax && (
          <>
            <p className="result-main">
              {year}년 자동차세(지방교육세 포함) <strong>{formatWon(result.tax.annualTotal)}</strong>
            </p>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th scope="col">납기</th>
                    <th scope="col">차령</th>
                    <th scope="col">낼 돈</th>
                  </tr>
                </thead>
                <tbody>
                  {result.tax.halves.map((h) => (
                    <tr key={h.half}>
                      <td>{h.half === 1 ? "6월" : "12월"}</td>
                      <td>
                        {h.carAge}년{h.reductionRate > 0 ? ` (−${Math.round(h.reductionRate * 100)}%)` : ""}
                      </td>
                      <td>
                        {formatWon(h.total)}
                        <div className="muted small">
                          자동차세 {formatWon(h.carTax)} + 교육세 {formatWon(h.educationTax)}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <h3>연납하면</h3>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th scope="col">연납 기간</th>
                    <th scope="col">낼 금액</th>
                    <th scope="col">아끼는 금액</th>
                  </tr>
                </thead>
                <tbody>
                  {result.prepays.map(({ period, r }) => {
                    const passed = today !== null && today > r.periodEnd;
                    return (
                      <tr key={period.month} className={passed ? "passed" : undefined}>
                        <td>
                          {Number(r.periodStart.slice(5, 7))}월 {Number(r.periodStart.slice(8))}~{Number(r.periodEnd.slice(8))}일
                          {passed && <span className="muted small"> (지남)</span>}
                        </td>
                        <td>{formatWon(r.payTotal)}</td>
                        <td>{formatWon(r.saving)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <p className="hint">
              6월·9월 연납은 아직 내지 않은 기분까지 한꺼번에 내는 경우의 연 합계입니다. 이미 낸 기분이 있으면 그만큼 빼고 냅니다.
            </p>
            {data && result.tax.carTax <= data.smallTaxThresholdWon && (
              <p className="notice small">
                연 자동차세가 {formatWon(data.smallTaxThresholdWon)} 이하라서, 지자체가 6월에 1년치를 한꺼번에 고지할 수 있습니다. 이때는 6월 연납과
                같은 공제가 적용됩니다.
              </p>
            )}
            <details>
              <summary>계산 과정 보기</summary>
              <ul className="breakdown">
                {result.tax.breakdown.map((b) => (
                  <li key={b.label}>
                    {b.label}: <strong>{formatWon(b.value)}</strong> <span className="muted small">— {b.rule}</span>
                  </li>
                ))}
              </ul>
            </details>
          </>
        )}
      </output>
    </form>
  );
}
