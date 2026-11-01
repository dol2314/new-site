/**
 * 공식 바로가기. 도구 페이지의 "다음에 할 일"에 쓴다.
 * verified: 운영자가 실제로 열어 주소와 내용(해당 기능 메뉴)을 확인했는지. false면 품질 검사에서 경고.
 */
export interface OfficialLink {
  label: string;
  href: string;
  desc: string;
  verified: boolean;
}

export const LINKS = {
  wetax: { label: "위택스", href: "https://www.wetax.go.kr/", desc: "자동차세 조회·납부·연납 신고(서울 외 지역)", verified: false },
  lawCarTax: { label: "지방세법 제127조(자동차세 세율)", href: "https://www.law.go.kr/법령/지방세법/제127조", desc: "국가법령정보센터", verified: true },
  lawPrepay: { label: "지방세법 제128조(납기·연납)", href: "https://www.law.go.kr/법령/지방세법/제128조", desc: "국가법령정보센터", verified: true },
  lawAcquisition: { label: "지방세법 제12조(차량 취득세율)", href: "https://www.law.go.kr/법령/지방세법/제12조", desc: "국가법령정보센터", verified: true },
  lawSpecial: { label: "지방세특례제한법 제66조(전기·수소차 감면)", href: "https://www.law.go.kr/법령/지방세특례제한법/제66조", desc: "국가법령정보센터", verified: true },
  lawInspection: { label: "자동차관리법 시행규칙 제77조(정기검사 기간)", href: "https://www.law.go.kr/법령/자동차관리법시행규칙/제77조", desc: "국가법령정보센터", verified: true },
  dataJejuEv: {
    label: "공공데이터포털: 제주 전기자동차 보조금 지원대상 현황",
    href: "https://www.data.go.kr/data/15048678/fileData.do",
    desc: "차종별 국비·지방비 원자료(CSV)",
    verified: true,
  },
  evPortal: { label: "무공해차 통합누리집 보조금 계산기", href: "https://ev.or.kr/", desc: "지역·차종·조건별 공식 보조금 계산(메인 화면)", verified: true },
  kotsa: { label: "한국교통안전공단", href: "https://www.kotsa.or.kr/", desc: "자동차 검사 예약·안내", verified: false },
} satisfies Record<string, OfficialLink>;
