/**
 * 사례 분석 글 목록. published=true인 글만 사이트맵·RSS에 들어가고 색인을 허용한다.
 * 글을 공개하려면: 품질·유사도 검사 통과 → 운영자 검수(reviewed, reviewedAt) → published.
 */
import { launchPreview } from "@/site.config";
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
  /** 공개하면 안 되는 이유(확인 전 데이터 등). 있으면 LAUNCH_PREVIEW에서도 공개로 바꾸지 않는다 */
  hold?: string;
}

const RAW_GUIDES: GuideMeta[] = [
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
  {
    slug: "car-tax-prepay-timing",
    title: "자동차세 연납, 2,000cc급은 1월에 22,600원 아낀다 — 3·6·9월 신청과 비교",
    description:
      "2027년 자동차세 연납 공제를 1·3·6·9월 신청 시기별로 계산했습니다. 배기량별·오래된 차·전기차로 나눠 아끼는 금액과 분할납부·이사·차 판매 때 주의할 점을 정리했습니다.",
    asOf: "2026-11-01",
    updatedAt: "2026-11-01",
    tools: ["car-tax"],
    published: false,
    reviewed: false,
  },
  {
    slug: "car-tax-transfer-proration",
    title: "차 팔 때 자동차세, 이전등록일로 나눈다 — 판 사람·산 사람 일할계산 예시",
    description:
      "과세기간 중 차를 팔면 자동차세를 소유 일수만큼 나눠 각자 냅니다. 2027년 기준으로 상반기·하반기 이전, 등록 지연, 새 차, 2천원 미만 사례를 계산하고 계약일 기준 신청과 연납 환급을 정리했습니다.",
    asOf: "2026-11-01",
    updatedAt: "2026-11-01",
    tools: ["car-tax"],
    published: false,
    reviewed: false,
    hold: "이전일 당일 귀속 규칙 확인 전 (car-tax rules.prorateDayBoundary)",
  },
  {
    slug: "home-vs-fast-charging-cost",
    title: "집 충전 vs 급속 충전, 월 1,500km면 얼마 차이? — 단가별 충전비 계산",
    description:
      "2026년 8월 개편된 공공 충전요금 5단계로 월 1,500km 충전비를 계산하고, 집 충전 단가에 따라 급속보다 얼마나 아끼는지 손익 기준을 정리했습니다.",
    asOf: "2026-11-01",
    updatedAt: "2026-11-01",
    tools: ["ev-charging", "car-loan"],
    published: false,
    reviewed: false,
  },
  {
    slug: "ev-vs-gasoline-5-years",
    title: "전기차 vs 휘발유차, 5년 타면 얼마 차이? — 주행거리·충전 방식별 손익 계산",
    description:
      "4,500만원 전기차와 3,000만원 휘발유차를 5개 연도 동안 탈 때 실구매가·자동차세·충전비·기름값을 더해 비교하고, 몇 km부터 전기차가 덜 드는지 계산했습니다.",
    asOf: "2026-11-01",
    updatedAt: "2026-11-01",
    tools: ["car-loan", "ev-charging", "registration-tax"],
    published: false,
    reviewed: false,
  },
];

for (const x of RAW_GUIDES) {
  if (x.published && x.hold) throw new Error(`공개할 수 없는 항목이 published=true: ${x.slug} — ${x.hold}`);
}

/** LAUNCH_PREVIEW(로컬 점검)에서는 hold 없는 글을 공개로 본다 */
export const GUIDES: GuideMeta[] = launchPreview ? RAW_GUIDES.map((g) => (g.hold ? g : { ...g, published: true })) : RAW_GUIDES;

export const publishedGuides = () => GUIDES.filter((g) => g.published);
export const guideBySlug = (slug: string) => GUIDES.find((g) => g.slug === slug);
