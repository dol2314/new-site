# 데이터 확인 체크리스트

- 생성: 2026-11-01 (`node scripts/validate-data.mjs --write`)
- 확인 전 7개 / 전체 53개

## 확인하는 방법

1. 출처 링크(법령 조문·공식 안내)를 열어 값을 확인한다.
2. 데이터 파일에서 `value`에 확인한 값, `effective_date`에 시행일, `checked_at`에 확인한 날, `verified`를 `true`로 바꾸고 `candidate`·`candidate_source`·`todo`를 지운다.
3. 후보값과 다르면 후보값은 버리고 법령 값을 쓴다. 규칙(rules) 항목은 calc-core 함수의 산식이 법령과 같은지 확인하고, 다르면 함수와 테스트를 고친다.
4. `npm test`(형식 검사) → 이 스크립트를 다시 실행해 목록을 갱신한다.

## `ev-subsidy/2026.json` — 2026년 전기승용차 구매보조금 (차종별 국비·전환지원금, 지역별 지방비)

| 항목 | 확인할 것 | 출처 | 후보값 (계산에 안 씀) | 후보값 근거 |
|---|---|---|---|---|
| `rules.nationalUniform` | 제주 파일의 국비 금액이 다른 지역에도 똑같이 적용되는지 지침 원문으로 확인 (무공해차 통합누리집은 자동 수집 불가 — 운영자가 지침 PDF를 내려받아 확인) | [2026년 전기자동차 보급사업 보조금 업무처리지침(기후에너지환경부)](https://ev.or.kr/) | — | — |
| `rules.conversionEligibility` | 전환지원금을 받는 조건(내연기관차 폐차·판매, 보유 기간, 신청 기한 등)을 지침 원문으로 확인 | [2026년 전기자동차 보급사업 보조금 업무처리지침(기후에너지환경부)](https://ev.or.kr/) | — | — |

## `inspection/rules.json` — 자동차 정기검사 기간·유효기간·미수검 과태료 (비사업용 승용)

| 항목 | 확인할 것 | 출처 | 후보값 (계산에 안 씀) | 후보값 근거 |
|---|---|---|---|---|
| `values.cyclePassengerPrivatePre2025` | 2024-12-31 이전 신규등록 차의 최초 검사 유효기간 확인(개정 전 별표) | [자동차관리법 시행규칙 별표 15의2 개정 전 규정(2024-12-17 개정 전)](https://www.law.go.kr/%EB%B2%95%EB%A0%B9%EB%B3%84%ED%91%9C%EC%84%9C%EC%8B%9D/(%EC%9E%90%EB%8F%99%EC%B0%A8%EA%B4%80%EB%A6%AC%EB%B2%95%20%EC%8B%9C%ED%96%89%EA%B7%9C%EC%B9%99,20261002,%EB%B3%84%ED%91%9C15%EC%9D%982)) | `{"firstAfterYears":4,"everyYears":2}` | 작성자(AI) 사전 지식 — 개정 전 별표로 확인 필요 |
| `values.comprehensiveScope` | 정기검사 대신 종합검사를 받는 지역·차령 기준 확인 | [자동차종합검사의 시행 등에 관한 규칙](https://www.law.go.kr/%EB%B2%95%EB%A0%B9/%EC%9E%90%EB%8F%99%EC%B0%A8%EC%A2%85%ED%95%A9%EA%B2%80%EC%82%AC%EC%9D%98%EC%8B%9C%ED%96%89%EB%93%B1%EC%97%90%EA%B4%80%ED%95%9C%EA%B7%9C%EC%B9%99) | — | — |
| `values.fees` | 정기검사·종합검사 수수료 확인(이 세션에서 kotsa.or.kr 연결 시간 초과). 민간 검사소는 다를 수 있어 범위로 표시 | [한국교통안전공단 검사 수수료 안내](https://www.kotsa.or.kr/) | — | — |
| `rules.firstExpiry` | 신규등록일부터 기산한 N년의 만료일 = 신규등록일 + N년 - 1일 인지 확인 — calc-core estimateExpiry() | [자동차관리법 시행규칙 제74조제2항 + 민법 기간 계산(제157조·제160조)](https://www.law.go.kr/%EB%B2%95%EB%A0%B9/%EB%AF%BC%EB%B2%95/%EC%A0%9C160%EC%A1%B0) | — | — |
| `rules.overdueCount` | 검사 지연기간을 정기검사 기간(만료일 후 31일)이 끝난 다음 날부터 1일로 세는지 확인 — 별표에 기산일 명시 없음. calc-core calcInspectionPenalty() | [자동차관리법 시행령(대통령령 제36376호, 2026-06-03 시행 현행본) 별표 2 제2호 소목 '검사 지연기간'](https://www.law.go.kr/%EB%B2%95%EB%A0%B9%EB%B3%84%ED%91%9C%EC%84%9C%EC%8B%9D/(%EC%9E%90%EB%8F%99%EC%B0%A8%EA%B4%80%EB%A6%AC%EB%B2%95%20%EC%8B%9C%ED%96%89%EB%A0%B9,20260603,%EB%B3%84%ED%91%9C2)) | — | — |

