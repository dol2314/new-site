import Link from "next/link";
import type { ReactNode } from "react";
import { JsonLd } from "@/components/JsonLd";
import { Faq, type FaqItem } from "@/components/tool/Faq";
import { SourcesList } from "@/components/tool/SourcesList";
import type { SourceRef } from "@site/data";
import type { GuideMeta } from "@/lib/guides";
import { formatKoreanDate } from "@/lib/kst";
import { breadcrumbJsonLd } from "@/lib/seo";
import { toolById } from "@/lib/tools";
import { absoluteUrl, site } from "@/site.config";

interface Props {
  meta: GuideMeta;
  /** 첫 3문장: 결론 숫자, 기준일, 계산기 링크 */
  summary: ReactNode[];
  children: ReactNode;
  faq: FaqItem[];
  sources: SourceRef[];
}

/** 사례 분석 글 공통 틀. data-article-section 표시를 scripts/check-page-quality.mjs가 검사한다. */
export function GuideLayout({ meta, summary, children, faq, sources }: Props) {
  const path = `/guides/${meta.slug}/`;
  return (
    <article className="container prose guide">
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "사례 분석", path },
          { name: meta.title, path },
        ])}
      />
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Article",
          headline: meta.title,
          description: meta.description,
          dateModified: meta.updatedAt,
          inLanguage: "ko-KR",
          mainEntityOfPage: absoluteUrl(path),
          publisher: { "@type": "Organization", name: site.name },
        }}
      />
      {!meta.published && (
        <p className="notice small" data-draft>
          공개 전 초안입니다. 검색에 노출되지 않습니다.
        </p>
      )}
      <h1>{meta.title}</h1>
      <p className="muted small">
        {formatKoreanDate(meta.asOf)} 기준 · 수정{" "}
        {formatKoreanDate(meta.updatedAt)}
      </p>
      <section data-article-section="summary" className="summary">
        {summary.map((s, i) => (
          <p key={i}>{s}</p>
        ))}
      </section>
      {children}
      <section data-article-section="faq">
        <h2>자주 묻는 질문</h2>
        <Faq items={faq} />
      </section>
      <section data-article-section="related">
        <h2>직접 계산해 보기</h2>
        <ul>
          {meta.tools.map((id) => {
            const t = toolById(id);
            return (
              <li key={id}>
                <Link href={t.path}>{t.title}</Link>{" "}
                <span className="muted small">{t.summary}</span>
              </li>
            );
          })}
        </ul>
      </section>
      <section data-article-section="sources">
        <h2>근거</h2>
        <SourcesList sources={sources} />
      </section>
      <section data-section="disclaimer" className="muted small">
        <p>
          예시 조건은 이해를 돕기 위한 가정이며, 실제 세액은 관할 지자체의
          결정으로 정해집니다. 법이 바뀌면 이 글을 고칩니다.
        </p>
        <p>
          검수일:{" "}
          {meta.reviewedAt ? (
            formatKoreanDate(meta.reviewedAt)
          ) : (
            <span data-unreviewed>운영자 검수 전</span>
          )}
        </p>
      </section>
    </article>
  );
}
