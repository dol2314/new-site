import Link from "next/link";
import { JsonLd } from "@/components/JsonLd";
import { GUIDES, publishedGuides } from "@/lib/guides";
import { formatKoreanDate } from "@/lib/kst";
import { breadcrumbJsonLd, pageMetadata } from "@/lib/seo";
import { toolById } from "@/lib/tools";
import { launchPreview, site } from "@/site.config";

const published = publishedGuides();

export const metadata = pageMetadata({
  title: "사례 분석",
  description:
    "특정 조건의 차를 놓고 세금·보조금·충전비를 공식 기준으로 계산한 사례 분석 글 목록입니다. 조건을 바꾼 결과와 놓치기 쉬운 점을 함께 정리했습니다.",
  path: "/guides/",
  noindex: published.length === 0,
});

export default function GuidesIndex() {
  // 공개 전(검색 노출 꺼짐)에는 초안도 보여 주고, 공개 후에는 공개된 글만 보여 준다.
  const list = site.indexable || launchPreview ? published : GUIDES;
  const sorted = [...list].sort((a, b) =>
    b.updatedAt.localeCompare(a.updatedAt),
  );
  return (
    <div className="container">
      <JsonLd
        data={breadcrumbJsonLd([{ name: "사례 분석", path: "/guides/" }])}
      />
      {published.length === 0 && (
        <p className="notice small" data-draft>
          공개 전 초안입니다. 검색에 노출되지 않습니다.
        </p>
      )}
      <h1>사례 분석</h1>
      <p className="lead">
        조건을 하나 정해 계산기로 끝까지 계산한 글입니다. 숫자는 모두 공식
        기준으로 계산했고, 조건을 바꾸면 결과가 어떻게 달라지는지와 놓치기 쉬운
        점을 함께 적었습니다.
      </p>
      {sorted.length === 0 ? (
        <p className="muted">아직 공개한 글이 없습니다.</p>
      ) : (
        <ul className="card-grid guide-list">
          {sorted.map((g) => (
            <li key={g.slug}>
              <Link href={`/guides/${g.slug}/`} className="card">
                <strong>{g.title}</strong>
                <span className="muted small">
                  {g.description} ({formatKoreanDate(g.asOf)} 기준
                  {g.published ? "" : ", 공개 전"})
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
      <h2>함께 쓰는 계산기</h2>
      <p>
        글에 나온 조건을 내 차에 맞게 바꿔 보려면 각 글 아래 &quot;직접 계산해
        보기&quot;의 계산기를 쓰세요. 예를 들어{" "}
        <Link href={toolById("car-loan").path}>
          {toolById("car-loan").title}
        </Link>
        는 실구매가와 5년 비용을 한 번에 계산합니다.
      </p>
    </div>
  );
}
