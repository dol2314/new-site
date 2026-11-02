"use client";

import {
  calcEvSubsidy,
  formatWon,
  type EvModel,
  type EvSubsidyRules,
} from "@site/calc-core";
import { useEffect, useMemo, useRef, useState } from "react";
import { track, type ResultBand } from "@/lib/analytics";
import { useTodayKst } from "@/lib/use-today";

interface Region {
  code: string;
  name: string;
}

interface Props {
  models: EvModel[];
  regions: Region[];
  rules: EvSubsidyRules;
  /** 데이터에 없는 지역(국비 + 직접 입력 지방비)을 계산해도 되는지 — 국비 전국 동일 규칙 확인 후 true */
  otherRegionReady: boolean;
  officialCalculatorUrl: string;
}

const OTHER = "__other";

function band(total: number): ResultBand {
  if (total < 5_000_000) return "low";
  if (total < 8_000_000) return "mid";
  if (total < 10_000_000) return "high";
  return "very-high";
}

export function EvSubsidyCalculator({
  models,
  regions,
  rules,
  otherRegionReady,
  officialCalculatorUrl,
}: Props) {
  const [showOld, setShowOld] = useState(false);
  const list = useMemo(
    () => models.filter((m) => showOld || !m.discontinued),
    [models, showOld],
  );
  const makers = useMemo(() => [...new Set(list.map((m) => m.maker))], [list]);
  const [makerSel, setMaker] = useState(makers[0] ?? "");
  // 단종 숨김으로 선택한 제조사가 목록에서 빠지면 첫 제조사로
  const maker = makers.includes(makerSel) ? makerSel : (makers[0] ?? "");
  const modelsOfMaker = list.filter((m) => m.maker === maker);
  const [modelId, setModelId] = useState<string>(modelsOfMaker[0]?.id ?? "");
  const [region, setRegion] = useState(
    otherRegionReady ? OTHER : (regions[0]?.code ?? OTHER),
  );
  const [lowIncome, setLowIncome] = useState(false);
  const [youth, setYouth] = useState(false);
  const [children, setChildren] = useState(0);
  const [bms, setBms] = useState(false);
  const today = useTodayKst();
  // BMS 폐차 재구매 지원은 기한이 있다(지침). 오늘(KST)이 기한을 넘으면 선택지를 숨기고 계산에서도 뺀다.
  const bmsOpen = today === null || today <= rules.bmsScrap.until;
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
      return calcEvSubsidy(
        {
          model,
          region: isOther ? null : region,
          userLocal: isOther && userLocal !== "" ? Number(userLocal) : null,
          conversion,
          userConversionLocal:
            isOther && userConvLocal !== "" ? Number(userConvLocal) : null,
          lowIncome,
          youthFirstCar: youth,
          children,
          bmsScrap: bms && bmsOpen,
          appliedOn: today ?? undefined,
        },
        rules,
      );
    } catch {
      return null;
    }
  })();

  useEffect(() => {
    if (!result) return;
    const key = `${model?.id}|${region}|${conversion}`;
    if (done.current === key) return;
    done.current = key;
    track("tool_complete", {
      tool: "ev-subsidy",
      result_band: band(result.total),
    });
  }, [result, model, region, conversion]);

  return (
    <>
      <p className="notice small">
        사는 시·군·구의 지방비까지 정확한 금액은 무공해차 통합누리집의{" "}
        <a href={officialCalculatorUrl} rel="noopener">
          보조금 계산기
        </a>
        에서 확인하세요. 여기서는 지침 기준으로 국비·추가지원이 어떻게
        더해지는지 보여 줍니다.
      </p>
      <form
        className="calc-form"
        onSubmit={(e) => e.preventDefault()}
        onChange={() => track("tool_start", { tool: "ev-subsidy" })}
      >
        <div className="field">
          <label htmlFor="maker">제조·수입사</label>
          <select
            id="maker"
            value={maker}
            onChange={(e) => {
              setMaker(e.target.value);
              setModelId(
                list.find((m) => m.maker === e.target.value)?.id ?? "",
              );
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
          <select
            id="model"
            value={model?.id ?? ""}
            onChange={(e) => setModelId(e.target.value)}
          >
            {modelsOfMaker.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
                {m.discontinued ? " (단종)" : ""}
              </option>
            ))}
          </select>
          <label className="inline">
            <input
              type="checkbox"
              checked={showOld}
              onChange={(e) => setShowOld(e.target.checked)}
            />{" "}
            단종 차종도 보기
          </label>
        </div>
        <div className="field">
          <label htmlFor="region">사는 곳</label>
          <select
            id="region"
            value={region}
            onChange={(e) => setRegion(e.target.value)}
          >
            {regions.map((r) => (
              <option key={r.code} value={r.code}>
                {r.name}
              </option>
            ))}
            {otherRegionReady && (
              <option value={OTHER}>그 밖의 지역 (지방비 직접 입력)</option>
            )}
          </select>
        </div>
        {isOther && otherRegionReady && (
          <div className="field">
            <label htmlFor="local">우리 시·군·구 지방비 (만원)</label>
            <input
              id="local"
              inputMode="numeric"
              value={userLocal}
              onChange={(e) =>
                setUserLocal(e.target.value.replace(/[^0-9]/g, ""))
              }
            />
            <p className="hint">
              사는 시·군·구의 전기차 보급사업 공고문에 차종별 지방비가 있습니다.
            </p>
          </div>
        )}
        <div className="field">
          <label className="inline">
            <input
              type="checkbox"
              checked={conversion}
              onChange={(e) => setConversion(e.target.checked)}
            />{" "}
            전환지원금도 더해 보기
          </label>
          <p className="hint">
            최초 등록 후 3년 넘은 내연기관차(하이브리드 제외)를 3년 이상 갖고
            있다가 팔거나 폐차한 개인이 대상입니다. 가족 간 판매·증여는 안
            됩니다.
          </p>
          {conversion && isOther && otherRegionReady && (
            <>
              <label htmlFor="convlocal">전환지원 지방비 (만원)</label>
              <input
                id="convlocal"
                inputMode="numeric"
                value={userConvLocal}
                onChange={(e) =>
                  setUserConvLocal(e.target.value.replace(/[^0-9]/g, ""))
                }
              />
            </>
          )}
        </div>

        <fieldset className="field">
          <legend>추가지원 (해당하면 체크)</legend>
          <label className="inline">
            <input
              type="checkbox"
              checked={lowIncome}
              onChange={(e) => setLowIncome(e.target.checked)}
            />{" "}
            차상위 이하 계층
          </label>
          <label className="inline">
            <input
              type="checkbox"
              checked={youth}
              onChange={(e) => setYouth(e.target.checked)}
            />{" "}
            19~34세 청년의 생애 첫 차
          </label>
          {bmsOpen && (
            <label className="inline">
              <input
                type="checkbox"
                checked={bms}
                onChange={(e) => setBms(e.target.checked)}
              />{" "}
              BMS 업데이트가 안 되는 노후 전기차를 폐차하고 다시 구매 (
              {rules.bmsScrap.until.slice(0, 4)}년 말까지)
            </label>
          )}
          <label htmlFor="kids">18세 이하 자녀</label>
          <select
            id="kids"
            value={children}
            onChange={(e) => setChildren(Number(e.target.value))}
          >
            <option value={0}>없음 또는 1명</option>
            <option value={2}>2명</option>
            <option value={3}>3명</option>
            <option value={4}>4명 이상</option>
          </select>
        </fieldset>

        <output className="result" aria-live="polite">
          {result && model && (
            <>
              <p className="result-main">
                {model.name} 보조금 합계{" "}
                <strong>{formatWon(result.total)}</strong>
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
              {result.localFrom === "none" && (
                <p className="notice small">
                  지방비를 넣지 않아 국비 쪽 금액만 더했습니다. 지방비는
                  지역마다 국비의 {rules.localMinRatio * 100}% 이상입니다.
                </p>
              )}
              {result.localBelowMinimum && (
                <p className="notice small">
                  입력한 지방비가 국비의 {rules.localMinRatio * 100}%보다
                  적습니다. 공고문 금액을 다시 확인해 보세요.
                </p>
              )}
              {result.additionalLocalShare !== null && (
                <p className="hint">
                  추가지원금 중 약{" "}
                  {formatWon(
                    Math.round(result.additionalLocalShare / 10_000) * 10_000,
                  )}
                  은 지방비에서, 나머지는 국비에서 나눠 냅니다(받는 합계는 같음,
                  실제 분담은 지자체가 정함).
                </p>
              )}
            </>
          )}
        </output>
      </form>
    </>
  );
}
