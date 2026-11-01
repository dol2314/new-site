"use client";

import { calcRegistrationTax, formatWon, type Powertrain, type RegistrationTaxParams } from "@site/calc-core";
import { useEffect, useRef, useState } from "react";
import { track, type ResultBand } from "@/lib/analytics";
import { formatKoreanDate } from "@/lib/kst";
import { useTodayKst } from "@/lib/use-today";

const POWER: { id: Powertrain; label: string }[] = [
  { id: "ice", label: "휘발유·경유·LPG" },
  { id: "hybrid", label: "하이브리드" },
  { id: "electric", label: "전기" },
  { id: "hydrogen", label: "수소" },
];

function band(v: number): ResultBand {
  if (v === 0) return "none";
  if (v < 1_000_000) return "low";
  if (v < 2_500_000) return "mid";
  if (v < 5_000_000) return "high";
  return "very-high";
}

export function RegistrationTaxCalculator({ params }: { params: RegistrationTaxParams }) {
  const [used, setUsed] = useState(false);
  const [priceManwon, setPrice] = useState("3500");
  const [vatSel, setVat] = useState<boolean | null>(null);
  const [standardManwon, setStandard] = useState("");
  const [power, setPower] = useState<Powertrain>("ice");
  const [compact, setCompact] = useState(false);
  const [seats, setSeats] = useState(false);
  const [children, setChildren] = useState(0);
  const [dateSel, setDate] = useState<string | null>(null);
  const today = useTodayKst();
  const done = useRef("");

  // 신차는 보통 부가세 포함 가격, 중고차는 직접 선택
  const vatIncluded = vatSel ?? !used;
  const acquiredOn = dateSel ?? today ?? "";

  const result = (() => {
    if (!acquiredOn || priceManwon === "") return null;
    try {
      return calcRegistrationTax(
        {
          price: Number(priceManwon) * 10_000,
          vatIncluded,
          standardValue: used && standardManwon !== "" ? Number(standardManwon) * 10_000 : null,
          compact,
          powertrain: power,
          seats7to10: seats,
          childrenUnder18: children,
          acquiredOn,
        },
        params,
      );
    } catch {
      return null;
    }
  })();

  useEffect(() => {
    if (!result) return;
    const key = `${result.payable}`;
    if (done.current === key) return;
    done.current = key;
    track("tool_complete", { tool: "registration-tax", result_band: band(result.payable) });
  }, [result]);

  return (
    <form className="calc-form" onSubmit={(e) => e.preventDefault()} onChange={() => track("tool_start", { tool: "registration-tax" })}>
      <fieldset className="field">
        <legend>어떤 차를 사나요?</legend>
        <label className="inline">
          <input type="radio" name="kind" checked={!used} onChange={() => setUsed(false)} /> 새 차
        </label>{" "}
        <label className="inline">
          <input type="radio" name="kind" checked={used} onChange={() => setUsed(true)} /> 중고차
        </label>
      </fieldset>
      <div className="field">
        <label htmlFor="price">{used ? "거래 가격" : "차량 가격"} (만원)</label>
        <input id="price" inputMode="numeric" value={priceManwon} onChange={(e) => setPrice(e.target.value.replace(/[^0-9]/g, ""))} />
        <label className="inline">
          <input type="checkbox" checked={vatIncluded} onChange={(e) => setVat(e.target.checked)} /> 부가세 포함 가격이에요
        </label>
        <p className="hint">취득세는 부가세를 뺀 금액으로 계산합니다. 할인받았다면 할인된 가격을, 할부 이자는 빼고 넣으세요.</p>
      </div>
      {used && (
        <div className="field">
          <label htmlFor="sv">시가표준액 (만원, 알면)</label>
          <input id="sv" inputMode="numeric" value={standardManwon} onChange={(e) => setStandard(e.target.value.replace(/[^0-9]/g, ""))} />
          <p className="hint">거래 가격이 시가표준액보다 낮으면 시가표준액으로 계산합니다. 시가표준액은 위택스에서 조회할 수 있습니다.</p>
        </div>
      )}
      <div className="field">
        <label htmlFor="power">연료</label>
        <select id="power" value={power} onChange={(e) => setPower(e.target.value as Powertrain)}>
          {POWER.map((p) => (
            <option key={p.id} value={p.id}>
              {p.label}
            </option>
          ))}
        </select>
      </div>
      <div className="field">
        <label className="inline">
          <input type="checkbox" checked={compact} onChange={(e) => setCompact(e.target.checked)} /> 경형 자동차예요 (자동차등록증의 차종이 &apos;경형&apos;)
        </label>
        <label className="inline">
          <input type="checkbox" checked={seats} onChange={(e) => setSeats(e.target.checked)} /> 승차정원 7~10명
        </label>
      </div>
      <div className="field">
        <label htmlFor="children">18세 미만 자녀 (다자녀 감면을 신청할 때)</label>
        <select id="children" value={children} onChange={(e) => setChildren(Number(e.target.value))}>
          <option value={0}>해당 없음</option>
          <option value={2}>2명</option>
          <option value={3}>3명 이상</option>
        </select>
      </div>
      <div className="field">
        <label htmlFor="date">취득일(등록 예정일)</label>
        <input id="date" type="date" value={acquiredOn} onChange={(e) => setDate(e.target.value)} />
      </div>

      <output className="result" aria-live="polite">
        {result && (
          <>
            <p className="result-main">
              낼 취득세 <strong>{formatWon(result.payable)}</strong>
            </p>
            <div className="table-wrap">
              <table>
                <tbody>
                  {result.breakdown.map((b) => (
                    <tr key={b.label}>
                      <th scope="row">{b.label}</th>
                      <td>
                        {formatWon(b.value)}
                        <div className="muted small">{b.rule}</div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {result.otherReliefs.length > 0 && (
              <p className="hint">
                {result.otherReliefs.map((r) => r.label).join(", ")}도 해당하지만, 감면은 가장 큰 것 하나만 적용됩니다.
              </p>
            )}
            {result.expired.map((e) => (
              <p key={e.label} className="notice small">
                {e.label}은 현행법상 {formatKoreanDate(e.until)}까지 취득한 차에만 적용돼 이 날짜에는 빠졌습니다. 법이 바뀌면 다시 확인합니다.
              </p>
            ))}
            {result.relief?.id.startsWith("multi-child") && (
              <p className="hint">다자녀 감면은 먼저 신청한 1대만 되고, 이미 감면받은 차를 갖고 있거나 가족 외의 사람과 공동등록하면 받을 수 없습니다.</p>
            )}
            <p className="hint">공채 매입 비용, 번호판·등록 수수료는 지역마다 달라 포함하지 않았습니다.</p>
          </>
        )}
      </output>
    </form>
  );
}
