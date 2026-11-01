/**
 * 모든 기준 데이터 값의 공통 형식 (CLAUDE.md 절대 규칙 2).
 * 프롬프트 03에서 실제 데이터 파일과 함께 확장한다.
 */
export interface SourcedValue<T = number> {
  value: T;
  unit: string;
  source_name: string;
  source_url: string;
  /** 이 값이 적용되기 시작한 날 (YYYY-MM-DD) */
  effective_date: string;
  /** 사람이 공식 출처에서 마지막으로 확인한 날 (YYYY-MM-DD) */
  checked_at: string;
  /** 공식 출처로 확인했으면 true. false인 값을 쓰는 화면은 공개하지 않는다. */
  verified: boolean;
}

const DATE = /^\d{4}-\d{2}-\d{2}$/;

/** 형식 오류 목록을 돌려준다. 빈 배열이면 통과. */
export function validateSourcedValue(v: SourcedValue<unknown>, path = "value"): string[] {
  const errors: string[] = [];
  if (v.value === undefined || v.value === null) errors.push(`${path}: value 없음`);
  if (!v.unit) errors.push(`${path}: unit 없음`);
  if (!v.source_name) errors.push(`${path}: source_name 없음`);
  if (!/^https:\/\//.test(v.source_url ?? "")) errors.push(`${path}: source_url이 https 주소가 아님`);
  if (!DATE.test(v.effective_date ?? "")) errors.push(`${path}: effective_date 형식(YYYY-MM-DD) 아님`);
  if (!DATE.test(v.checked_at ?? "")) errors.push(`${path}: checked_at 형식(YYYY-MM-DD) 아님`);
  if (typeof v.verified !== "boolean") errors.push(`${path}: verified가 true/false가 아님`);
  return errors;
}
