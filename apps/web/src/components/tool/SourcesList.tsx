import type { SourceRef } from "@site/data";
import { formatKoreanDate } from "@/lib/kst";

/** 계산에 쓴 값의 법령 출처·시행일·확인일 */
export function SourcesList({ sources }: { sources: SourceRef[] }) {
  return (
    <ul className="sources">
      {sources.map((s) => (
        <li key={s.key}>
          <a href={s.source_url} rel="noopener">
            {s.source_name}
          </a>
          <span className="muted small">
            {" "}
            · 시행 {s.effective_date ? formatKoreanDate(s.effective_date) : "확인 전"} · 확인 {s.checked_at ? formatKoreanDate(s.checked_at) : "확인 전"}
          </span>
          {s.note && <div className="muted small">{s.note}</div>}
        </li>
      ))}
    </ul>
  );
}
