"use client";

import { useSyncExternalStore } from "react";
import { todayKst } from "./kst";

const noopSubscribe = () => () => {};

/** 클라이언트에서만 오늘(KST)을 돌려주는 훅. 서버·정적 빌드에서는 null(화면이 빌드 날짜로 굳지 않게). */
export function useTodayKst(): string | null {
  return useSyncExternalStore(noopSubscribe, todayKst, () => null);
}
