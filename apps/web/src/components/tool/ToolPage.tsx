import type { ReactNode } from "react";
import { JsonLd } from "@/components/JsonLd";
import { breadcrumbJsonLd } from "@/lib/seo";
import type { OfficialLink } from "@/lib/links";
import type { Tool } from "@/lib/tools";
import { formatKoreanDate } from "@/lib/kst";
import Link from "next/link";
import { Faq, type FaqItem } from "./Faq";

export interface Example {
  title: string;
  body: ReactNode;
}

interface Props {
  tool: Tool;
  /** 첫 3문장 요약 (결론 먼저) */
  summary: string[];
  calculator: ReactNode;
  examples: Example[];
  method: ReactNode;
  table: ReactNode;
  faq: FaqItem[];
  next: { tools: Tool[]; links: OfficialLink[] };
  /** 데이터 기준일(가장 최근 확인일) */
  checkedAt: string;
  /** 운영자 검수일 (없으면 검수 전) */
  reviewedAt?: string;
}

/**
 * 도구 페이지 공통 틀. 기획안 3-3절 8개 항목을 data-section으로 표시해 scripts/check-page-quality.mjs가 검사한다.
 */
export function ToolPage(p: Props) {
  return (
    <article className="container tool">
      <JsonLd data={breadcrumbJsonLd([{ name: p.tool.title, path: p.tool.path }])} />
      {!p.tool.published && (
        <p className="notice small" data-draft>
          공개 전 초안입니다. 검색에 노출되지 않습니다.
        </p>
      )}
      <h1>{p.tool.title}</h1>

      <section data-section="summary" className="summary">
        {p.summary.map((s) => (
          <p key={s}>{s}</p>
        ))}
      </section>

      <section data-section="calculator" aria-label="계산기" className="calculator">
        {p.calculator}
      </section>

      <section data-section="examples">
        <h2>계산 예시</h2>
        {p.examples.map((e) => (
          <div key={e.title} className="example" data-example>
            <h3>{e.title}</h3>
            {e.body}
          </div>
        ))}
      </section>

      <section data-section="method">
        <h2>계산 방법과 출처</h2>
        {p.method}
      </section>

      <section data-section="table">
        <h2>기준표</h2>
        {p.table}
      </section>

      <section data-section="faq">
        <h2>자주 묻는 질문</h2>
        <Faq items={p.faq} />
      </section>

      <section data-section="next">
        <h2>다음에 할 일</h2>
        <ul>
          {p.next.tools.filter((t) => t.published).map((t) => (
            <li key={t.id}>
              <Link href={t.path}>{t.title}</Link>
            </li>
          ))}
          {p.next.links.map((l) => (
            <li key={l.href} data-link-verified={l.verified ? "true" : "false"}>
              <a href={l.href} rel="noopener">
                {l.label}
              </a>{" "}
              <span className="muted small">{l.desc}</span>
            </li>
          ))}
        </ul>
      </section>

      <section data-section="disclaimer" className="muted small">
        <p>
          이 계산은 모의 계산입니다. 실제 금액은 관할 지방자치단체의 고지·결정으로 정해지며, 지자체 조례나 개인 사정(감면, 연중 등록·이전 등)에
          따라 다를 수 있습니다.
        </p>
        <p>
          데이터 확인일: {formatKoreanDate(p.checkedAt)} · 검수일: {p.reviewedAt ? formatKoreanDate(p.reviewedAt) : <span data-unreviewed>운영자 검수 전</span>}
        </p>
      </section>
    </article>
  );
}
