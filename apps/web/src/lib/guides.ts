/**
 * 사례 분석 글 목록. published=true인 글만 사이트맵·RSS에 들어가고 색인을 허용한다.
 * 글을 공개하려면: 품질·유사도 검사 통과 → 운영자 검수(reviewed, reviewedAt) → published.
 */
import type { ToolId } from "./tools";

export interface GuideMeta {
  slug: string;
  title: string;
  description: string;
  /** 글의 숫자가 기준으로 삼는 날 */
  asOf: string;
  updatedAt: string;
  tools: ToolId[];
  published: boolean;
  reviewed: boolean;
  reviewedAt?: string;
}

export const GUIDES: GuideMeta[] = [
  {
    slug: "ev-acquisition-tax-year-end",
    title: "전기차 취득세, 12월에 인도받으면 140만원 덜 낸다 — 2026년 말 감면 종료 계산",
    description:
      "현행법상 전기차 취득세 감면(140만원 한도)은 2026년 12월 31일 취득분까지입니다. 차값별·경차·수소차로 12월과 1월 인도 때 취득세 차이를 계산했습니다.",
    asOf: "2026-11-01",
    updatedAt: "2026-11-01",
    tools: ["registration-tax", "car-loan", "ev-subsidy"],
    published: false,
    reviewed: false,
  },
];

export const publishedGuides = () => GUIDES.filter((g) => g.published);
export const guideBySlug = (slug: string) => GUIDES.find((g) => g.slug === slug);
