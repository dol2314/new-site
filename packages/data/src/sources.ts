/**
 * 사이트가 쓰는(쓸 예정인) 공식 출처 목록. /data/ 페이지에 그대로 보인다.
 * 실제 값과 확인일은 프롬프트 03에서 데이터 파일로 관리한다.
 */
export interface DataSource {
  id: string;
  topic: string;
  name: string;
  url: string;
  howUpdated: string;
}

export const DATA_SOURCES: DataSource[] = [
  { id: "fuel", topic: "유가 (전국·시도 평균)", name: "오피넷 (한국석유공사)", url: "https://www.opinet.co.kr/", howUpdated: "공식 API로 매일 자동 갱신" },
  { id: "ev-subsidy", topic: "전기차 구매 보조금 (국비·지방비)", name: "무공해차 통합누리집", url: "https://ev.or.kr/", howUpdated: "지침·공고가 바뀔 때 갱신, 공고 시즌에는 주 1회 확인" },
  { id: "law", topic: "자동차세·취득세·감면, 검사 주기·과태료", name: "국가법령정보센터", url: "https://www.law.go.kr/", howUpdated: "법령 개정 시, 최소 연 1회 확인" },
  { id: "wetax", topic: "자동차세 납부·연납 일정", name: "위택스 (행정안전부)", url: "https://www.wetax.go.kr/", howUpdated: "연 1회 + 납기 공지 시" },
  { id: "kepco", topic: "주택용 전기요금", name: "한국전력공사", url: "https://home.kepco.co.kr/", howUpdated: "요금 개정 시" },
  { id: "kotsa", topic: "자동차 검사 기간·수수료", name: "한국교통안전공단", url: "https://www.kotsa.or.kr/", howUpdated: "개정 시, 최소 연 1회 확인" },
  { id: "datagokr", topic: "공공데이터 (가능한 경우 API 우선)", name: "공공데이터포털", url: "https://www.data.go.kr/", howUpdated: "데이터셋별" },
  { id: "korea-kr", topic: "정부 발표·보도자료", name: "대한민국 정책브리핑", url: "https://www.korea.kr/", howUpdated: "발표 시" },
];
