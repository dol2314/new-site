"use client";

import { calcInspectionPenalty, diffDays, formatWon, inspectionWindow, type InspectionParams } from "@site/calc-core";
import { useEffect, useMemo, useRef, useState } from "react";
import { track } from "@/lib/analytics";
import { formatKoreanDate } from "@/lib/kst";
import { useTodayKst } from "@/lib/use-today";

interface Props {
  params: InspectionParams;
  /** 지연 과태료 날짜 계산을 보여 줄 수 있는지 (관련 데이터가 모두 확인됐을 때만 true) */
  penaltyReady: boolean;
}

export function InspectionCalculator({ params, penaltyReady }: Props) {
  const [expiry, setExpiry] = useState("");
  const today = useTodayKst();
  const done = useRef("");

  const result = useMemo(() => {
    if (!expiry || !today) return null;
    try {
      const w = inspectionWindow(expiry, params);
      const penalty = calcInspectionPenalty(expiry, today, params);
      return { w, penalty, toStart: diffDays(today, w.start), toEnd: diffDays(today, w.end), error: null as string | null };
    } catch (e) {
      return { error: e instanceof Error ? e.message : "날짜를 확인하세요" };
    }
  }, [expiry, today, params]);

  useEffect(() => {
    if (!result || "w" in result === false || !expiry || done.current === expiry) return;
    done.current = expiry;
    const status = (result as { penalty: { status: string } }).penalty.status;
    track("tool_complete", { tool: "inspection", result_band: status === "overdue" ? "high" : status === "in-window" ? "mid" : "low" });
  }, [result, expiry]);

  return (
    <form className="calc-form" onSubmit={(e) => e.preventDefault()} onChange={() => track("tool_start", { tool: "inspection" })}>
      <div className="field">
        <label htmlFor="expiry">검사 유효기간 만료일</label>
        <input id="expiry" type="date" value={expiry} onChange={(e) => setExpiry(e.target.value)} />
        <p className="hint">자동차등록증 뒷면의 검사 유효기간 칸에서 확인할 수 있습니다.</p>
      </div>

      <output className="result" aria-live="polite">
        {result && "error" in result && result.error && <p className="error">{result.error}</p>}
        {result && "w" in result && result.w && (
          <>
            <p className="result-main">
              검사 받을 수 있는 기간: <strong>{formatKoreanDate(result.w.start)} ~ {formatKoreanDate(result.w.end)}</strong>
            </p>
            {result.penalty.status === "before-window" && <p>검사 기간이 {result.toStart}일 뒤에 시작합니다.</p>}
            {result.penalty.status === "in-window" && <p>지금 검사 기간입니다. 마감까지 {result.toEnd}일 남았습니다. 이 기간 안에 합격하면 만료일에 받은 것으로 봅니다.</p>}
            {result.penalty.status === "overdue" &&
              (penaltyReady ? (
                <p className="error">
                  검사 기간이 {result.penalty.daysOverdue}일 지났습니다. 이 조건이면 과태료 {formatWon(result.penalty.amountWon)}이고, 계속 미루면{" "}
                  {result.penalty.capReachedOn ? formatKoreanDate(result.penalty.capReachedOn) : "-"}에 상한 {formatWon(params.penaltyCapWon)}이 됩니다.
                </p>
              ) : (
                <p className="error">검사 기간이 지났습니다. 지연 일수별 과태료는 아래 기준표를 참고하고, 가능한 한 빨리 검사를 받으세요.</p>
              ))}
          </>
        )}
      </output>
    </form>
  );
}
