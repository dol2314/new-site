# 전기차 보조금 데이터 갱신 절차

## 원칙
- **무공해차 통합누리집(ev.or.kr)은 자동 수집하지 않는다.** 본문이 보호 스크립트(pnp4web)로 암호화되어 있고 robots.txt도 없다(2026-11-01 확인). 지침·공고 PDF는 운영자가 사람으로서 내려받아 확인한다.
- 자동으로 받는 것은 공공데이터포털에 공개된 파일(이용허락범위 확인)뿐이다.
- 금액은 원본 파일 → `node scripts/data/import-ev-subsidy.mjs` → `packages/data/data/ev-subsidy/{연도}.json` 순서로만 바꾼다. JSON을 손으로 고치지 않는다.

## 지금 상태 (2026-11-01)
| 기능 | 상태 | 막힌 이유 |
|---|---|---|
| 제주 거주자 합계(국비+도비, 전환지원 포함) | 확인 완료 | — |
| 다른 지역(국비 + 직접 입력 지방비) | 확인 전 | 제주 파일의 국비가 전국에 같게 적용되는지 지침 원문 확인 필요 (`rules.nationalUniform`) |
| 전환지원금 조건 설명 | 확인 전 | 대상 조건 지침 원문 확인 필요 (`rules.conversionEligibility`) |

## 운영자가 할 일
1. 무공해차 통합누리집 공지사항에서 해당 연도 「전기자동차 보급사업 보조금 업무처리지침」 PDF를 내려받아 이 세션에 올린다.
   → Claude가 국비 산정·전국 동일 적용 여부·전환지원 조건을 읽고 `rules`를 확인 처리한다.
2. 지역 추가: 시·군·구 공고문의 차종별 지방비 표를 `packages/data/raw/ev-subsidy/README.md` 형식의 CSV로 만들어 올린다.
   (사용자가 많은 지역부터: 서울, 경기 주요 시, 부산, 인천, 대구, 대전, 광주)

## 연 1회 갱신
- 제주 공공데이터 차기 등록 예정일: 2027-09-17 (데이터 페이지 표시값). 새 파일이 올라오면 원본을 교체하고 스크립트 실행.
- 새 연도 지침(보통 연초)이 나오면 `{새연도}.json`을 만들고, 그 전까지 화면은 이전 연도 기준임을 표시한다.

## 갱신 후 확인
```bash
node scripts/data/import-ev-subsidy.mjs
npm test                     # official.test.ts의 보조금 사례가 바뀌면 기대값을 공고 값으로 고친다
npm run validate:data -- --write
npm run build && npm run check:quality ev-subsidy
```
