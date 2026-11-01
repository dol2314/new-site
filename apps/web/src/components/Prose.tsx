import type { ReactNode } from "react";

/** 안내 문서형 페이지(소개, 약관 등)의 공통 틀 */
export function Prose({ title, updated, children }: { title: string; updated?: string; children: ReactNode }) {
  return (
    <article className="container prose">
      <h1>{title}</h1>
      {updated && <p className="muted small">최종 수정: {updated}</p>}
      {children}
    </article>
  );
}
