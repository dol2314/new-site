/**
 * 사이트 전역 설정. 값은 환경변수로 넣는다(.env.example 참고).
 * 이름·도메인이 정해지기 전에는 기본값(가칭)으로 빌드되며, 검색 노출 스위치는 꺼져 있다.
 */
const env = (key: string): string => (process.env[key] ?? "").trim();

export const site = {
  name: env("NEXT_PUBLIC_SITE_NAME") || "차값계산소(가칭)",
  url: (env("NEXT_PUBLIC_SITE_URL") || "http://localhost:3000").replace(/\/+$/, ""),
  description:
    "자동차세·연납, 자동차 검사 기간·과태료, 전기차 보조금, 취등록세, 할부, 충전요금을 공식 기준으로 계산합니다. 입력한 값은 내 기기 밖으로 나가지 않습니다.",
  locale: "ko_KR",
  /** false면 모든 페이지 noindex + robots.txt 전체 차단. 도구가 공개되기 전까지 false로 둔다. */
  indexable: env("NEXT_PUBLIC_SITE_INDEXABLE") === "true",
  operator: {
    name: env("NEXT_PUBLIC_OPERATOR_NAME"),
    email: env("NEXT_PUBLIC_OPERATOR_EMAIL"),
  },
  gaId: env("NEXT_PUBLIC_GA_ID"),
  verification: {
    google: env("NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION"),
    naver: env("NEXT_PUBLIC_NAVER_SITE_VERIFICATION"),
  },
  ogImage: "/og/default.png",
} as const;

export const operatorConfigured = Boolean(site.operator.name && site.operator.email);

/** 절대 URL. path는 "/"로 시작하고 trailingSlash 규칙에 맞게 "/"로 끝난다. */
export function absoluteUrl(path: string): string {
  return `${site.url}${path}`;
}
