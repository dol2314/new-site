/**
 * 모든 기준 데이터 값의 공통 형식 (CLAUDE.md 절대 규칙 2).
 * 프롬프트 03에서 실제 데이터 파일과 함께 확장한다.
 */
export interface SourcedValue<T = number> {
  /** 공식 출처로 확인한 값. 확인 전에는 null */
  value: T | null;
  unit: string;
  source_name: string;
  source_url: string;
  /** 이 값이 적용되기 시작한 날 (YYYY-MM-DD). 확인 전에는 null */
  effective_date: string | null;
  /** 사람이 공식 출처에서 마지막으로 확인한 날 (YYYY-MM-DD). 확인 전에는 null */
  checked_at: string | null;
  /** 공식 출처로 확인했으면 true. false인 값을 쓰는 화면은 공개하지 않는다. */
  verified: boolean;
  /** 확인 전 후보값 — 계산에 쓰지 않는다. 확인되면 value로 옮기고 지운다 */
  candidate?: T;
  /** 후보값을 어디서 봤는지 (2차 자료면 그렇게 적는다) */
  candidate_source?: string;
  todo?: string;
  /** 확인된 값에 붙이는 주의 사항(해석, 조례 차이 등) */
  note?: string;
}

const DATE = /^\d{4}-\d{2}-\d{2}$/;

/** 형식 오류 목록을 돌려준다. 빈 배열이면 통과. verified:true면 value·날짜가 반드시 있어야 한다. */
export function validateSourcedValue(v: SourcedValue<unknown>, path = "value"): string[] {
  const errors: string[] = [];
  if (!v.unit) errors.push(`${path}: unit 없음`);
  if (!v.source_name) errors.push(`${path}: source_name 없음`);
  if (!/^https:\/\//.test(v.source_url ?? "")) errors.push(`${path}: source_url이 https 주소가 아님`);
  if (typeof v.verified !== "boolean") errors.push(`${path}: verified가 true/false가 아님`);
  if (v.effective_date !== null && !DATE.test(v.effective_date ?? "")) errors.push(`${path}: effective_date 형식(YYYY-MM-DD) 아님`);
  if (v.checked_at !== null && !DATE.test(v.checked_at ?? "")) errors.push(`${path}: checked_at 형식(YYYY-MM-DD) 아님`);
  if (v.verified === true) {
    if (v.value === null || v.value === undefined) errors.push(`${path}: verified인데 value 없음`);
    if (!v.effective_date) errors.push(`${path}: verified인데 effective_date 없음`);
    if (!v.checked_at) errors.push(`${path}: verified인데 checked_at 없음`);
    if (v.candidate !== undefined) errors.push(`${path}: verified인데 candidate가 남아 있음`);
  }
  return errors;
}
