/**
 * 도구 목록 (기획안 3-2절). published가 true인 도구만 내비게이션·홈·사이트맵에 나온다.
 * 도구 페이지를 만들고 품질 검사를 통과했을 때만 true로 바꾼다.
 */
export type ToolId = "car-tax" | "inspection" | "ev-subsidy" | "registration-tax" | "car-loan" | "ev-charging";

export interface Tool {
  id: ToolId;
  path: `/${string}/`;
  title: string;
  /** 메뉴용 짧은 이름 */
  short: string;
  summary: string;
  stage: "before-buy" | "after-buy";
  /** 품질 검사 통과 + 운영자 검수 후 true. false면 메뉴·홈·사이트맵에서 빠지고 noindex */
  published: boolean;
  /** 운영자가 사례·FAQ 문장을 검수했는지 */
  reviewed: boolean;
}

export const TOOLS: Tool[] = [
  { id: "car-tax", path: "/car-tax/", title: "자동차세·연납 계산기", short: "자동차세", summary: "배기량·차령으로 연 세액과 1·3·6·9월 연납 절감액을 계산합니다.", stage: "after-buy", published: false, reviewed: false },
  { id: "inspection", path: "/inspection/", title: "자동차 검사 기간·과태료 계산기", short: "검사 기간", summary: "최초등록일로 다음 검사 기간과 늦었을 때 날짜별 과태료를 확인합니다.", stage: "after-buy", published: false, reviewed: false },
  { id: "ev-subsidy", path: "/ev-subsidy/", title: "전기차 보조금 계산기", short: "전기차 보조금", summary: "차종과 사는 곳으로 국비·지방비 보조금 합계를 계산하고 지역별로 비교합니다.", stage: "before-buy", published: false, reviewed: false },
  { id: "registration-tax", path: "/registration-tax/", title: "취등록세 계산기", short: "취등록세", summary: "신차·중고차 취득세와 경차·다자녀·전기차 감면을 계산합니다.", stage: "before-buy", published: false, reviewed: false },
  { id: "car-loan", path: "/car-loan/", title: "실구매가·할부 계산기", short: "실구매가·할부", summary: "보조금과 취등록세를 반영한 실구매가와 월 납입금, 5년 비용을 계산합니다.", stage: "before-buy", published: false, reviewed: false },
  { id: "ev-charging", path: "/ev-charging/", title: "전기차 충전요금 계산기", short: "충전요금", summary: "급속·완속·집 충전 요금으로 월 충전비를 계산하고 주유비와 비교합니다.", stage: "after-buy", published: false, reviewed: false },
];

export const publishedTools = (): Tool[] => TOOLS.filter((t) => t.published);

export function toolById(id: ToolId): Tool {
  const t = TOOLS.find((x) => x.id === id);
  if (!t) throw new Error(`도구 없음: ${id}`);
  return t;
}
