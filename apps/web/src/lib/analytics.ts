/**
 * GA4 이벤트 헬퍼. 사용자 입력값(차종, 주행거리, 지역, 금액 등)은 절대 보내지 않는다 (CLAUDE.md 규칙 4).
 * 그래서 파라미터는 미리 정한 값(도구 ID, 구간 이름)만 받도록 타입으로 막아 둔다.
 */
import type { ToolId } from "./tools";

/** 결과 구간: 실제 금액 대신 범위 이름만 보낸다 */
export type ResultBand = "none" | "low" | "mid" | "high" | "very-high";

type EventParams = {
  tool_start: { tool: ToolId };
  tool_complete: { tool: ToolId; result_band?: ResultBand };
  next_action_click: { tool: ToolId; target: ToolId | "official" };
  share_click: { tool: ToolId; method: "copy" | "kakao" | "native" };
  calendar_add: { item_id: string };
  pwa_install: Record<string, never>;
};

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}

export function track<E extends keyof EventParams>(event: E, params: EventParams[E]): void {
  if (typeof window === "undefined" || typeof window.gtag !== "function") return;
  window.gtag("event", event, params);
}
