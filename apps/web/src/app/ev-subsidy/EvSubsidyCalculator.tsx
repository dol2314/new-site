"use client";

import { calcEvSubsidy, formatWon, type EvModel } from "@site/calc-core";
import { useEffect, useMemo, useRef, useState } from "react";
import { track, type ResultBand } from "@/lib/analytics";

interface Region {
  code: string;
  name: string;
}

interface Props {
  models: EvModel[];
  regions: Region[];
  /** 데이터에 없는 지역(국비 + 직접 입력 지방비)을 계산해도 되는지 — 국비 전국 동일 규칙 확인 후 true */
  otherRegionReady: boolean;
}

const OTHER = "__other";

function band(total: number): ResultBand {
  if (total < 5_000_000) return "low";
  if (total < 8_000_000) return "mid";
  if (total < 10_000_000) return "high";
  return "very-high";
}

export function EvSubsidyCalculator({ models, regions, otherRegionReady }: Props) {
  const [showOld, setShowOld] = useState(false);
  const list = useMemo(() => models.filter((m) => showOld || !m.discontinued), [models, showOld]);
  const makers = useMemo(() => [...new Set(list.map((m) => m.maker))], [list]);
  const [makerSel, setMaker] = useState(makers[0] ?? "");
  // 단종 숨김으로 선택한 제조사가 목록에서 빠지면 첫 제조사로
  const maker = makers.includes(makerSel) ? makerSel : (makers[0] ?? "");
  const modelsOfMaker = list.filter((m) => m.maker === maker);
  const [modelId, setModelId] = useState<string>(modelsOfMaker[0]?.id ?? "");
  const [region, setRegion] = useState(regions[0]?.code ?? OTHER);
  const [conversion, setConversion] = useState(false);
  const [userLocal, setUserLocal] = useState("");
  const [userConvLocal, setUserConvLocal] = useState("");
  const done = useRef("");

  const model = modelsOfMaker.find((m) => m.id === modelId) ?? modelsOfMaker[0];
  const isOther = region === OTHER;

  // 계산이 가벼워서 메모이제이션 없이 렌더마다 계산한다
  const result = (() => {
    if (!model || (isOther && !otherRegionReady)) return null;
    try {
      return calcEvSubsidy({
        model,
        region: isOther ? null : region,
        userLocal: isOther && userLocal !== "" ? Number(userLocal) : null,
        conversion,
        userConversionLocal: isOther && userConvLocal !== "" ? Number(userConvLocal) : null,
      });
    } catch {
      return null;
    }
  })();

  useEffect(() => {
    if (!result) return;
    const key = `${model?.id}|${region}|${conversion}`;
    if (done.current === key) return;
    done.current = key;
    track("tool_complete", { tool: "ev-subsidy", result_band: band(result.total) });
  }, [result, model, region, conversion]);

  return (
    <form className="calc-form" onSubmit={(e) => e.preventDefault()} onChange={() => track("tool_start", { tool: "ev-subsidy" })}>
      <div className="field">
        <label htmlFor="maker">제조·수입사</label>
        <select
          id="maker"
          value={maker}
          onChange={(e) => {
            setMaker(e.target.value);
            setModelId(list.find((m) => m.maker === e.target.value)?.id ?? "");
          }}
        >
          {makers.map((mk) => (
            <option key={mk} value={mk}>
              {mk}
            </option>
          ))}
        </select>
      </div>
      <div className="field">
        <label htmlFor="model">차종</label>
        <select id="model" value={model?.id ?? ""} onChange={(e) => setModelId(e.target.value)}>
          {modelsOfMaker.map((m) => (
            <option key={m.id} value={m.id}>
              {m.name}
              {m.discontinued ? " (단종)" : ""}
            </option>
          ))}
        </select>
        <label className="inline">
          <input type="checkbox" checked={showOld} onChange={(e) => setShowOld(e.target.checked)} /> 단종 차종도 보기
        </label>
      </div>
      <div className="field">
        <label htmlFor="region">사는 곳</label>
        <select id="region" value={region} onChange={(e) => setRegion(e.target.value)}>
          {regions.map((r) => (
            <option key={r.code} value={r.code}>
              {r.name}
            </option>
          ))}
          <option value={OTHER} disabled={!otherRegionReady}>
            그 밖의 지역 (지방비 직접 입력){otherRegionReady ? "" : " — 준비 중"}
          </option>
        </select>
      </div>
      {isOther && otherRegionReady && (
        <div className="field">
          <label htmlFor="local">우리 시·군·구 지방비 (만원)</label>
          <input id="local" inputMode="numeric" value={userLocal} onChange={(e) => setUserLocal(e.target.value.replace(/[^0-9]/g, ""))} />
          <p className="hint">사는 시·군·구의 전기차 보급사업 공고문에 차종별 지방비가 있습니다.</p>
        </div>
      )}
      <div className="field">
        <label className="inline">
          <input type="checkbox" checked={conversion} onChange={(e) => setConversion(e.target.checked)} /> 전환지원금도 더해 보기
        </label>
        <p className="hint">전환지원금 대상인지는 지자체 공고문의 조건을 확인하세요.</p>
        {conversion && isOther && otherRegionReady && (
          <>
            <label htmlFor="convlocal">전환지원 지방비 (만원)</label>
            <input id="convlocal" inputMode="numeric" value={userConvLocal} onChange={(e) => setUserConvLocal(e.target.value.replace(/[^0-9]/g, ""))} />
          </>
        )}
      </div>

      <output className="result" aria-live="polite">
        {result && model && (
          <>
            <p className="result-main">
              {model.name} 보조금 합계 <strong>{formatWon(result.total)}</strong>
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
            {result.localFrom === "none" && <p className="notice small">지방비를 넣지 않아 국비만 더했습니다.</p>}
          </>
        )}
      </output>
    </form>
  );
}
