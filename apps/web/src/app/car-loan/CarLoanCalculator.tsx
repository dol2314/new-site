"use client";

import {
  calcLoan,
  calcPurchase,
  calcRegistrationTax,
  formatWon,
  type LoanMethod,
  type Powertrain,
  type RegistrationTaxParams,
} from "@site/calc-core";
import { useEffect, useRef, useState } from "react";
import { track, type ResultBand } from "@/lib/analytics";
import { useTodayKst } from "@/lib/use-today";
import { CostCompare, type CompareData } from "./CostCompare";

const POWER: { id: Powertrain; label: string }[] = [
  { id: "electric", label: "전기" },
  { id: "hydrogen", label: "수소" },
  { id: "hybrid", label: "하이브리드" },
  { id: "ice", label: "휘발유·경유·LPG" },
];
const MONTHS = [12, 24, 36, 48, 60];
const METHODS: { id: LoanMethod; label: string }[] = [
  { id: "equal-payment", label: "원리금균등" },
  { id: "equal-principal", label: "원금균등" },
  { id: "balloon", label: "유예할부" },
];

const num = (s: string) => (s === "" ? 0 : Number(s));
const digits = (s: string) => s.replace(/[^0-9]/g, "");

function band(real: number): ResultBand {
  if (real < 20_000_000) return "low";
  if (real < 40_000_000) return "mid";
  if (real < 60_000_000) return "high";
  return "very-high";
}

export function CarLoanCalculator({
  regParams,
  officialSubsidyUrl,
  compareData,
}: {
  regParams: RegistrationTaxParams;
  officialSubsidyUrl: string;
  compareData: CompareData;
}) {
  const [price, setPrice] = useState("4500");
  const [power, setPower] = useState<Powertrain>("electric");
  const [compact, setCompact] = useState(false);
  const [subsidy, setSubsidy] = useState("");
  const [extra, setExtra] = useState("");
  const [dateSel, setDate] = useState<string | null>(null);
  const [down, setDown] = useState("");
  const [months, setMonths] = useState(36);
  const [rate, setRate] = useState("");
  const [method, setMethod] = useState<LoanMethod>("equal-payment");
  const [balloonPct, setBalloonPct] = useState("30");
  const [financeAll, setFinanceAll] = useState(false);
  const today = useTodayKst();
  const done = useRef("");
  const acquiredOn = dateSel ?? today ?? "";
  const subsidyAllowed = power === "electric" || power === "hydrogen";

  const calc = (() => {
    if (!acquiredOn || price === "") return null;
    try {
      const priceWon = num(price) * 10_000;
      const tax = calcRegistrationTax(
        {
          price: priceWon,
          vatIncluded: true,
          compact,
          powertrain: power,
          seats7to10: false,
          childrenUnder18: 0,
          acquiredOn,
        },
        regParams,
      );
      const purchase = calcPurchase({
        price: priceWon,
        subsidy: subsidyAllowed ? num(subsidy) * 10_000 : 0,
        registrationTax: tax.payable,
        extra: num(extra) * 10_000,
        downPayment: num(down) * 10_000,
        financeTaxAndExtra: financeAll,
      });
      const r = rate === "" ? null : Number(rate) / 100;
      const loans =
        r === null || purchase.financed === 0
          ? null
          : METHODS.map((m) => ({
              m,
              res: calcLoan({
                principal: purchase.financed,
                annualRate: r,
                months,
                method: m.id,
                balloonRate: num(balloonPct) / 100,
              }),
            }));
      return { tax, purchase, loans, error: null as string | null };
    } catch (e) {
      return {
        tax: null,
        purchase: null,
        loans: null,
        error: e instanceof Error ? e.message : "입력값을 확인하세요",
      };
    }
  })();

  useEffect(() => {
    if (!calc?.purchase) return;
    const key = `${calc.purchase.realPrice}`;
    if (done.current === key) return;
    done.current = key;
    track("tool_complete", {
      tool: "car-loan",
      result_band: band(calc.purchase.realPrice),
    });
  }, [calc]);

  const selected = calc?.loans?.find((l) => l.m.id === method)?.res ?? null;

  return (
    <form
      className="calc-form"
      onSubmit={(e) => e.preventDefault()}
      onChange={() => track("tool_start", { tool: "car-loan" })}
    >
      <h3>1. 실구매가</h3>
      <div className="field">
        <label htmlFor="price">차값 (만원, 부가세 포함)</label>
        <input
          id="price"
          inputMode="numeric"
          value={price}
          onChange={(e) => setPrice(digits(e.target.value))}
        />
      </div>
      <div className="field">
        <label htmlFor="power">연료</label>
        <select
          id="power"
          value={power}
          onChange={(e) => setPower(e.target.value as Powertrain)}
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
            checked={compact}
            onChange={(e) => setCompact(e.target.checked)}
          />{" "}
          경형 자동차
        </label>
      </div>
      {subsidyAllowed && (
        <div className="field">
          <label htmlFor="subsidy">보조금 합계 (만원)</label>
          <input
            id="subsidy"
            inputMode="numeric"
            value={subsidy}
            onChange={(e) => setSubsidy(digits(e.target.value))}
          />
          <p className="hint">
            무공해차 통합누리집{" "}
            <a href={officialSubsidyUrl} rel="noopener">
              보조금 계산기
            </a>
            에서 사는 지역으로 계산한 합계를 넣으세요.
          </p>
        </div>
      )}
      <div className="field">
        <label htmlFor="date">취득일 (인도 예정일)</label>
        <input
          id="date"
          type="date"
          value={acquiredOn}
          onChange={(e) => setDate(e.target.value)}
        />
        <p className="hint">
          취득세 감면은 등록(취득)하는 날 기준으로 적용됩니다.
        </p>
      </div>
      <div className="field">
        <label htmlFor="extra">기타 비용 (만원, 선택)</label>
        <input
          id="extra"
          inputMode="numeric"
          value={extra}
          onChange={(e) => setExtra(digits(e.target.value))}
        />
        <p className="hint">
          탁송료, 번호판, 공채 매입 비용 등 견적서에 있는 금액.
        </p>
      </div>

      <h3>2. 할부</h3>
      <div className="field">
        <label htmlFor="down">선수금 (만원)</label>
        <input
          id="down"
          inputMode="numeric"
          value={down}
          onChange={(e) => setDown(digits(e.target.value))}
        />
        <label className="inline">
          <input
            type="checkbox"
            checked={financeAll}
            onChange={(e) => setFinanceAll(e.target.checked)}
          />{" "}
          취득세·기타 비용도 할부에 넣기
        </label>
      </div>
      <div className="field">
        <label htmlFor="months">기간</label>
        <select
          id="months"
          value={months}
          onChange={(e) => setMonths(Number(e.target.value))}
        >
          {MONTHS.map((m) => (
            <option key={m} value={m}>
              {m}개월
            </option>
          ))}
        </select>
      </div>
      <div className="field">
        <label htmlFor="rate">연 금리 (%)</label>
        <input
          id="rate"
          inputMode="decimal"
          placeholder="견적서의 금리"
          value={rate}
          onChange={(e) => setRate(e.target.value.replace(/[^0-9.]/g, ""))}
        />
      </div>
      <fieldset className="field">
        <legend>상환 방식</legend>
        {METHODS.map((m) => (
          <label key={m.id} className="inline">
            <input
              type="radio"
              name="method"
              checked={method === m.id}
              onChange={() => setMethod(m.id)}
            />{" "}
            {m.label}
          </label>
        ))}
        {method === "balloon" && (
          <>
            <label htmlFor="balloon">마지막에 남길 비율 (%)</label>
            <input
              id="balloon"
              inputMode="numeric"
              value={balloonPct}
              onChange={(e) =>
                setBalloonPct(digits(e.target.value).slice(0, 2))
              }
            />
          </>
        )}
      </fieldset>

      <output className="result" aria-live="polite">
        {calc?.error && <p className="error">{calc.error}</p>}
        {calc?.purchase && calc.tax && (
          <>
            <p className="result-main">
              실구매가 <strong>{formatWon(calc.purchase.realPrice)}</strong>
            </p>
            <div className="table-wrap">
              <table>
                <tbody>
                  <tr>
                    <th scope="row">차량 대금</th>
                    <td>
                      {formatWon(calc.purchase.carPayable)}
                      <div className="muted small">
                        차값 − 보조금 (제작사에 내는 돈)
                      </div>
                    </td>
                  </tr>
                  <tr>
                    <th scope="row">취득세</th>
                    <td>
                      {formatWon(calc.tax.payable)}
                      <div className="muted small">
                        보조금 빼기 전 차값 기준
                        {calc.tax.relief
                          ? ` · ${calc.tax.relief.label} ${formatWon(calc.tax.relief.amount)}`
                          : ""}
                        {calc.tax.expired.length > 0
                          ? ` · ${calc.tax.expired.map((e) => e.label).join(", ")} 기한 지남`
                          : ""}
                      </div>
                    </td>
                  </tr>
                  {num(extra) > 0 && (
                    <tr>
                      <th scope="row">기타 비용</th>
                      <td>{formatWon(num(extra) * 10_000)}</td>
                    </tr>
                  )}
                  <tr>
                    <th scope="row">처음에 낼 돈</th>
                    <td>
                      {formatWon(calc.purchase.cashAtStart)}
                      <div className="muted small">
                        선수금{financeAll ? "" : " + 취득세·기타 비용"}
                      </div>
                    </td>
                  </tr>
                  <tr>
                    <th scope="row">할부 원금</th>
                    <td>{formatWon(calc.purchase.financed)}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {calc.purchase.financed > 0 && rate === "" && (
              <p className="hint">연 금리를 넣으면 월 납입금이 나옵니다.</p>
            )}
            {calc.loans && selected && (
              <>
                <h3>월 납입금 비교</h3>
                <div className="table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th scope="col">방식</th>
                        <th scope="col">1회차</th>
                        <th scope="col">총이자</th>
                      </tr>
                    </thead>
                    <tbody>
                      {calc.loans.map(({ m, res }) => (
                        <tr
                          key={m.id}
                          className={m.id === method ? "selected" : undefined}
                        >
                          <td>{m.label}</td>
                          <td>
                            {formatWon(res.firstPayment)}
                            {m.id === "balloon" && (
                              <div className="muted small">
                                마지막 {formatWon(res.lastPayment)}
                              </div>
                            )}
                          </td>
                          <td>{formatWon(res.totalInterest)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <p className="hint">
                  {months}개월 동안 이자로 {formatWon(selected.totalInterest)}을
                  더 냅니다. 할부 대신 현금으로 사면 이만큼 아낍니다.
                </p>
                <details>
                  <summary>
                    회차별 상환표 ({METHODS.find((m) => m.id === method)?.label}
                    )
                  </summary>
                  <div className="table-wrap">
                    <table>
                      <thead>
                        <tr>
                          <th scope="col">회차</th>
                          <th scope="col">납입금</th>
                          <th scope="col">이자</th>
                          <th scope="col">남은 원금</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selected.schedule.map((row) => (
                          <tr key={row.month}>
                            <td>{row.month}</td>
                            <td>{formatWon(row.payment)}</td>
                            <td>{formatWon(row.interest)}</td>
                            <td>{formatWon(row.balance)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </details>
              </>
            )}
          </>
        )}
      </output>

      <CostCompare
        carA={
          calc?.purchase && acquiredOn
            ? {
                realPrice: calc.purchase.realPrice,
                power,
                acquiredOn,
              }
            : null
        }
        regParams={regParams}
        data={compareData}
      />
    </form>
  );
}
