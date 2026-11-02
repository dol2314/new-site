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
  {
    slug: "ev-car-tax-flat-rate",
    title: "전기차 자동차세는 왜 1년 13만원인가 — 배기량 차와 차령별 비교",
    description:
      "전기차 자동차세가 배기량과 관계없이 1년 13만원인 법적 이유와, 경차·1,600cc·2,000cc 휘발유차와의 차이, 오래 탈수록 역전되는 경우를 계산했습니다.",
    asOf: "2026-11-02",
    updatedAt: "2026-11-02",
    tools: ["car-tax"],
    published: false,
    reviewed: false,
  },
  {
    slug: "compact-car-acquisition-tax",
    title: "경차 취득세, 얼마짜리부터 나오나 — 75만원 감면 한도 계산",
    description:
      "경차는 취득세율 4%에 75만원까지 면제라, 일정 가격까지는 취득세가 0원입니다. 차값별 취득세와 1,000cc 넘는 소형차와의 차이, 감면이 끝나는 해를 계산했습니다.",
    asOf: "2026-11-02",
    updatedAt: "2026-11-02",
    tools: ["registration-tax", "car-loan"],
    published: false,
    reviewed: false,
  },
  {
    slug: "public-charging-fee-change",
    title: "공공 충전요금 개편 전후, 완속은 내리고 초급속은 올랐다 — 충전 습관별 한 달 변화",
    description:
      "2026년 8월 공공 충전요금이 2단계에서 5단계로 바뀌었습니다. 출력별 요금 변화와 아파트 완속 위주·장거리 초급속 위주 운전자의 한 달 충전비 변화를 계산했습니다.",
    asOf: "2026-11-02",
    updatedAt: "2026-11-02",
    tools: ["ev-charging"],
    published: false,
    reviewed: false,
  },
  {
    slug: "multi-child-car-acquisition-tax",
    title: "다자녀 취득세 감면, 7인승을 사면 얼마 덜 내나 — 자녀 수·좌석 수별 계산",
    description:
      "18세 미만 자녀가 셋 이상이면 7~10인승 취득세가 면제되지만, 세금이 200만원을 넘으면 15%는 냅니다. 자녀 수와 좌석 수, 차값별로 취득세를 계산했습니다.",
    asOf: "2026-11-02",
    updatedAt: "2026-11-02",
    tools: ["registration-tax", "car-loan"],
    published: false,
    reviewed: false,
  },
  {
    slug: "ev-subsidy-extra-support",
    title: "전기차 보조금 추가지원, 청년 첫 차·차상위·다자녀면 얼마 더 받나",
    description:
      "전기차 보조금 지침의 추가지원(청년 생애 첫 차·차상위 국비 20%, 다자녀 정액, 전환지원)을 국비 금액별로 계산하고, 함께 받을 수 있는 조합을 정리했습니다.",
    asOf: "2026-11-02",
    updatedAt: "2026-11-02",
    tools: ["ev-subsidy", "car-loan"],
    published: false,
    reviewed: false,
  },
  {
    slug: "cash-vs-car-installment",
    title: "3천만원 차, 현금 vs 할부 36개월 — 예금 이자까지 넣은 실제 비용",
    description:
      "3,000만원 차를 할부로 살 때 총이자와, 같은 돈을 예금에 두었을 때 받는 이자를 함께 계산했습니다. 금리·기간·선수금별 차이와 일시불 할인의 취득세 효과도 정리했습니다.",
    asOf: "2026-11-02",
    updatedAt: "2026-11-02",
    tools: ["car-loan", "registration-tax"],
    published: false,
    reviewed: false,
  },
  {
    slug: "used-car-tax-by-age",
    title: "중고차 자동차세, 연식에 따라 얼마나 싸지나 — 차령 계산과 등록 월의 반년 차이",
    description:
      "배기량 승용차는 차령 3년부터 해마다 5%씩 자동차세가 줄어듭니다. 최초 등록 연도별 세금, 같은 해 3월·9월 등록 차이, 해 넘겨 등록한 재고차의 경감 시점을 계산했습니다.",
    asOf: "2026-11-02",
    updatedAt: "2026-11-02",
    tools: ["car-tax"],
    published: false,
    reviewed: false,
  },
  {
    slug: "new-car-first-year-car-tax",
    title: "새 차 등록한 해 자동차세, 1월과 12월 등록은 얼마 다른가 — 날짜별 계산",
    description:
      "새 차를 등록한 해에는 등록일부터 반기 말까지 날짜만큼만 자동차세를 냅니다. 등록일별 그해 세금과 6월 말·7월 초 차이, 연말 등록, 전기차의 경우를 계산했습니다.",
    asOf: "2026-11-02",
    updatedAt: "2026-11-02",
    tools: ["car-tax", "car-loan"],
    published: false,
    reviewed: false,
  },
  {
    slug: "balloon-installment-last-payment",
    title: "유예할부 마지막 회차, 미리 얼마를 모아야 하나 — 원리금균등과 비교",
    description:
      "4,000만원을 36개월 유예할부로 빌릴 때 월 납입금, 마지막 달 목돈, 미리 모아야 할 돈과 총이자를 원리금균등과 비교했습니다. 유예 비율·금리·기간별 차이도 정리했습니다.",
    asOf: "2026-11-02",
    updatedAt: "2026-11-02",
    tools: ["car-loan"],
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
