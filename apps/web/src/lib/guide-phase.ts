/**
 * 시점에 따라 바뀌는 글 판(版).
 *
 * 전기차 취득세 감면(지방세특례제한법 제66조 제4항)은 현행법상 2026-12-31 취득분까지다.
 * 빌드한 날이 그 기한을 지나면 1편(/guides/ev-acquisition-tax-year-end/)은 "감면 종료 뒤" 판으로 바뀐다(같은 주소).
 * 다만 기한이 지난 뒤 빌드인데 기한이 있는 달(12월)의 법 개정 확인 기록(checked_at)이 없으면 빌드를 멈춘다 —
 * 감면이 연장됐는데 데이터를 못 고친 채 "끝났다"는 글이 나가지 않게.
 */
import { registrationTaxData } from "@site/data";
import { buildDate } from "@/site.config";

const reg = registrationTaxData();
const ev = reg.params.evRelief;

/** 전기차 감면 확인일 (데이터 values.evRelief.checked_at) */
export const evReliefCheckedAt =
  reg.sources.find((s) => s.key === "values.evRelief")?.checked_at ?? null;

/** 빌드한 날 기준으로 전기차 취득세 감면 기한이 지났는지 */
export const evReliefEnded = buildDate > ev.until;

/** 감면 종료 뒤 판은 "작년(기한이 있던 해)·올해(그다음 해)"로 쓴 글이라 그다음 해 안에서만 맞다 */
const afterTextValidUntil = `${Number(ev.until.slice(0, 4)) + 1}-12-31`;

export function checkGuidePhases(): void {
  if (!evReliefEnded) return;
  if (buildDate > afterTextValidUntil) {
    throw new Error(
      `[글 표현 갱신 필요] 1편 '감면 종료 뒤' 판(content/guides/ev-acquisition-tax-after-end.tsx)은 ${afterTextValidUntil}까지 기준으로 ` +
        "'작년·올해'라고 썼습니다. 표현을 연도로 바꾸거나 글을 새로 쓴 뒤 lib/guide-phase.ts의 기한을 고치세요.",
    );
  }
  const mustCheckFrom = `${ev.until.slice(0, 7)}-01`;
  if (!evReliefCheckedAt || evReliefCheckedAt < mustCheckFrom) {
    throw new Error(
      `[법령 확인 필요] 전기차 취득세 감면 기한(${ev.until})이 지난 뒤 빌드인데, ` +
        `registration-tax/rules.json values.evRelief의 checked_at(${evReliefCheckedAt})이 ${mustCheckFrom} 이전입니다. ` +
        "12월 개정(연장 여부)을 국가법령정보센터에서 확인하고 데이터와 checked_at을 고친 뒤 빌드하세요. 절차: docs/runbook/year-end-law-update.md",
    );
  }
}
