# 데이터 확인 체크리스트

- 생성: 2026-11-01 (`node scripts/validate-data.mjs --write`)
- 확인 전 28개 / 전체 28개

## 확인하는 방법

1. 출처 링크(법령 조문·공식 안내)를 열어 값을 확인한다.
2. 데이터 파일에서 `value`에 확인한 값, `effective_date`에 시행일, `checked_at`에 확인한 날, `verified`를 `true`로 바꾸고 `candidate`·`candidate_source`·`todo`를 지운다.
3. 후보값과 다르면 후보값은 버리고 법령 값을 쓴다. 규칙(rules) 항목은 calc-core 함수의 산식이 법령과 같은지 확인하고, 다르면 함수와 테스트를 고친다.
4. `npm test`(형식 검사) → 이 스크립트를 다시 실행해 목록을 갱신한다.

## `car-tax/2026.json` — 2026년 비영업용 승용자동차 자동차세·지방교육세·연납

| 항목 | 확인할 것 | 출처 | 후보값 (계산에 안 씀) | 후보값 근거 |
|---|---|---|---|---|
| `values.ccBrackets` | 배기량 구간과 cc당 세액 확인 | [지방세법 제127조 제1항(비영업용 승용자동차 세율)](https://www.law.go.kr/%EB%B2%95%EB%A0%B9/%EC%A7%80%EB%B0%A9%EC%84%B8%EB%B2%95/%EC%A0%9C127%EC%A1%B0) | `[{"maxCc":1000,"wonPerCc":80},{"maxCc":1600,"wonPerCc":140},{"maxCc":null,"wonPerCc":200}]` | 2차 자료(웹 검색 요약, 2026-11-01) — 법령으로 확인 필요 |
| `values.flatAnnualWon` | 배기량으로 과세하지 않는 승용차의 연 세액 확인 | [지방세법 제127조 제1항(그 밖의 승용자동차: 전기·수소 등)](https://www.law.go.kr/%EB%B2%95%EB%A0%B9/%EC%A7%80%EB%B0%A9%EC%84%B8%EB%B2%95/%EC%A0%9C127%EC%A1%B0) | `100000` | 작성자(AI) 사전 지식 — 2차 자료보다 약함, 반드시 법령으로 확인 |
| `values.educationTaxRate` | 자동차세분 지방교육세율 확인. 전기차 등 정액 차량에도 같은 비율이 붙는지 확인 | [지방세법 제151조(지방교육세 — 자동차세액 기준 세율)](https://www.law.go.kr/%EB%B2%95%EB%A0%B9/%EC%A7%80%EB%B0%A9%EC%84%B8%EB%B2%95/%EC%A0%9C151%EC%A1%B0) | `0.3` | 2차 자료(웹 검색 요약, 2026-11-01) — 법령으로 확인 필요 |
| `values.ageReduction` | 경감 시작 차령, 연간 경감률, 최대 경감률 확인 | [지방세법 제127조 제3항(차령 경감)](https://www.law.go.kr/%EB%B2%95%EB%A0%B9/%EC%A7%80%EB%B0%A9%EC%84%B8%EB%B2%95/%EC%A0%9C127%EC%A1%B0) | `{"startAge":3,"perYearRate":0.05,"maxRate":0.5}` | 작성자(AI) 사전 지식 — 2차 자료보다 약함, 반드시 법령으로 확인 |
| `values.truncateUnit` | 세액 10원 미만 절사 규정과 적용 법령(지방세기본법 또는 국고금 관리법 준용) 확인 | [지방세 끝수 처리 규정](https://www.law.go.kr/%EB%B2%95%EB%A0%B9/%EC%A7%80%EB%B0%A9%EC%84%B8%EA%B8%B0%EB%B3%B8%EB%B2%95) | `10` | 작성자(AI) 사전 지식 — 2차 자료보다 약함, 반드시 법령으로 확인 |
| `values.prepayRate` | 2026년 연납 공제율 확인 (2026년은 5% 유지 보도 — 시행령 조문으로 확인) | [지방세법 제128조 제3항 및 같은 법 시행령(연세액 일시납부 공제)](https://www.law.go.kr/%EB%B2%95%EB%A0%B9/%EC%A7%80%EB%B0%A9%EC%84%B8%EB%B2%95/%EC%A0%9C128%EC%A1%B0) | `0.05` | 2차 자료(웹 검색 요약, 2026-11-01) — 법령으로 확인 필요 |
| `values.prepayMonths` | 연납 신청 가능 월과 기간(1월 16~31일 등), 연세액 10만 원 미만 차량의 예외 확인 | [지방세법 제128조 제3항 및 같은 법 시행령](https://www.law.go.kr/%EB%B2%95%EB%A0%B9/%EC%A7%80%EB%B0%A9%EC%84%B8%EB%B2%95/%EC%A0%9C128%EC%A1%B0) | `[1,3,6,9]` | 2차 자료(웹 검색 요약, 2026-11-01) — 법령으로 확인 필요 |
| `values.dueDates` | 1기(6월)·2기(12월) 납기 기간 확인 | [지방세법 제128조 제1항(납기)](https://www.law.go.kr/%EB%B2%95%EB%A0%B9/%EC%A7%80%EB%B0%A9%EC%84%B8%EB%B2%95/%EC%A0%9C128%EC%A1%B0) | `{"first":"06-16~06-30","second":"12-16~12-31"}` | 2차 자료(웹 검색 요약, 2026-11-01) — 법령으로 확인 필요 |
| `rules.carAge` | 차령 산정 기준(과세연도-최초등록연도+1인지, 등록 시기별 처리) 확인 — calc-core carAge()가 이 규칙을 씀 | [지방세법 제127조 제3항(차령 산정)](https://www.law.go.kr/%EB%B2%95%EB%A0%B9/%EC%A7%80%EB%B0%A9%EC%84%B8%EB%B2%95/%EC%A0%9C127%EC%A1%B0) | — | — |
| `rules.prepayDiscount` | 공제액 = 연세액 × 공제율 × (납부 월 다음 달 1일~12월 31일 일수 ÷ 연 일수) 인지 확인 — calc-core calcPrepay()가 이 규칙을 씀. 보도된 실효 절감률(1월 약 4.57%, 3월 약 3.76%, 6월 약 2.51%, 9월 약 1.25%)과는 일치함 | [지방세법 시행령(연납 공제액 산식)](https://www.law.go.kr/%EB%B2%95%EB%A0%B9/%EC%A7%80%EB%B0%A9%EC%84%B8%EB%B2%95%EC%8B%9C%ED%96%89%EB%A0%B9) | — | — |

## `car-tax/2027.json` — 2027년 비영업용 승용자동차 자동차세·지방교육세·연납

| 항목 | 확인할 것 | 출처 | 후보값 (계산에 안 씀) | 후보값 근거 |
|---|---|---|---|---|
| `values.ccBrackets` | 배기량 구간과 cc당 세액 확인 · 2027년 시행 개정 여부(공제율 등)를 확인할 것 | [지방세법 제127조 제1항(비영업용 승용자동차 세율)](https://www.law.go.kr/%EB%B2%95%EB%A0%B9/%EC%A7%80%EB%B0%A9%EC%84%B8%EB%B2%95/%EC%A0%9C127%EC%A1%B0) | `[{"maxCc":1000,"wonPerCc":80},{"maxCc":1600,"wonPerCc":140},{"maxCc":null,"wonPerCc":200}]` | 2차 자료(웹 검색 요약, 2026-11-01) — 법령으로 확인 필요 |
| `values.flatAnnualWon` | 배기량으로 과세하지 않는 승용차의 연 세액 확인 | [지방세법 제127조 제1항(그 밖의 승용자동차: 전기·수소 등)](https://www.law.go.kr/%EB%B2%95%EB%A0%B9/%EC%A7%80%EB%B0%A9%EC%84%B8%EB%B2%95/%EC%A0%9C127%EC%A1%B0) | `100000` | 작성자(AI) 사전 지식 — 2차 자료보다 약함, 반드시 법령으로 확인 |
| `values.educationTaxRate` | 자동차세분 지방교육세율 확인. 전기차 등 정액 차량에도 같은 비율이 붙는지 확인 | [지방세법 제151조(지방교육세 — 자동차세액 기준 세율)](https://www.law.go.kr/%EB%B2%95%EB%A0%B9/%EC%A7%80%EB%B0%A9%EC%84%B8%EB%B2%95/%EC%A0%9C151%EC%A1%B0) | `0.3` | 2차 자료(웹 검색 요약, 2026-11-01) — 법령으로 확인 필요 |
| `values.ageReduction` | 경감 시작 차령, 연간 경감률, 최대 경감률 확인 | [지방세법 제127조 제3항(차령 경감)](https://www.law.go.kr/%EB%B2%95%EB%A0%B9/%EC%A7%80%EB%B0%A9%EC%84%B8%EB%B2%95/%EC%A0%9C127%EC%A1%B0) | `{"startAge":3,"perYearRate":0.05,"maxRate":0.5}` | 작성자(AI) 사전 지식 — 2차 자료보다 약함, 반드시 법령으로 확인 |
| `values.truncateUnit` | 세액 10원 미만 절사 규정과 적용 법령(지방세기본법 또는 국고금 관리법 준용) 확인 | [지방세 끝수 처리 규정](https://www.law.go.kr/%EB%B2%95%EB%A0%B9/%EC%A7%80%EB%B0%A9%EC%84%B8%EA%B8%B0%EB%B3%B8%EB%B2%95) | `10` | 작성자(AI) 사전 지식 — 2차 자료보다 약함, 반드시 법령으로 확인 |
| `values.prepayRate` | 2027년 연납 공제율 확인 (2027년 이후 변경 여부 미확정 보도) | [지방세법 제128조 제3항 및 같은 법 시행령(연세액 일시납부 공제)](https://www.law.go.kr/%EB%B2%95%EB%A0%B9/%EC%A7%80%EB%B0%A9%EC%84%B8%EB%B2%95/%EC%A0%9C128%EC%A1%B0) | — | — |
| `values.prepayMonths` | 연납 신청 가능 월과 기간(1월 16~31일 등), 연세액 10만 원 미만 차량의 예외 확인 | [지방세법 제128조 제3항 및 같은 법 시행령](https://www.law.go.kr/%EB%B2%95%EB%A0%B9/%EC%A7%80%EB%B0%A9%EC%84%B8%EB%B2%95/%EC%A0%9C128%EC%A1%B0) | `[1,3,6,9]` | 2차 자료(웹 검색 요약, 2026-11-01) — 법령으로 확인 필요 |
| `values.dueDates` | 1기(6월)·2기(12월) 납기 기간 확인 | [지방세법 제128조 제1항(납기)](https://www.law.go.kr/%EB%B2%95%EB%A0%B9/%EC%A7%80%EB%B0%A9%EC%84%B8%EB%B2%95/%EC%A0%9C128%EC%A1%B0) | `{"first":"06-16~06-30","second":"12-16~12-31"}` | 2차 자료(웹 검색 요약, 2026-11-01) — 법령으로 확인 필요 |
| `rules.carAge` | 차령 산정 기준(과세연도-최초등록연도+1인지, 등록 시기별 처리) 확인 — calc-core carAge()가 이 규칙을 씀 | [지방세법 제127조 제3항(차령 산정)](https://www.law.go.kr/%EB%B2%95%EB%A0%B9/%EC%A7%80%EB%B0%A9%EC%84%B8%EB%B2%95/%EC%A0%9C127%EC%A1%B0) | — | — |
| `rules.prepayDiscount` | 공제액 = 연세액 × 공제율 × (납부 월 다음 달 1일~12월 31일 일수 ÷ 연 일수) 인지 확인 — calc-core calcPrepay()가 이 규칙을 씀. 보도된 실효 절감률(1월 약 4.57%, 3월 약 3.76%, 6월 약 2.51%, 9월 약 1.25%)과는 일치함 | [지방세법 시행령(연납 공제액 산식)](https://www.law.go.kr/%EB%B2%95%EB%A0%B9/%EC%A7%80%EB%B0%A9%EC%84%B8%EB%B2%95%EC%8B%9C%ED%96%89%EB%A0%B9) | — | — |

## `inspection/rules.json` — 자동차 검사 기간·주기·지연 과태료 (비사업용 승용 우선)

| 항목 | 확인할 것 | 출처 | 후보값 (계산에 안 씀) | 후보값 근거 |
|---|---|---|---|---|
| `values.windowDays` | 검사 유효기간 만료일 전후 며칠이 검사 기간인지 확인 | [자동차관리법 시행규칙(검사 기간)](https://www.law.go.kr/%EB%B2%95%EB%A0%B9/%EC%9E%90%EB%8F%99%EC%B0%A8%EA%B4%80%EB%A6%AC%EB%B2%95%EC%8B%9C%ED%96%89%EA%B7%9C%EC%B9%99) | `{"before":31,"after":31}` | 2차 자료(웹 검색 요약, 2026-11-01) — 법령으로 확인 필요 |
| `values.cyclePassengerPrivate` | 비사업용 승용 신차 최초 검사까지 연수와 이후 주기 확인 | [자동차관리법 시행규칙(검사 유효기간 별표)](https://www.law.go.kr/%EB%B2%95%EB%A0%B9/%EC%9E%90%EB%8F%99%EC%B0%A8%EA%B4%80%EB%A6%AC%EB%B2%95%EC%8B%9C%ED%96%89%EA%B7%9C%EC%B9%99) | `{"firstAfterYears":4,"everyYears":2}` | 작성자(AI) 사전 지식 — 2차 자료보다 약함, 반드시 법령으로 확인 |
| `values.comprehensiveScope` | 정기검사 대신 종합검사를 받는 지역·차령 기준 확인 | [자동차종합검사의 시행 등에 관한 규칙](https://www.law.go.kr/%EB%B2%95%EB%A0%B9/%EC%9E%90%EB%8F%99%EC%B0%A8%EC%A2%85%ED%95%A9%EA%B2%80%EC%82%AC%EC%9D%98%EC%8B%9C%ED%96%89%EB%93%B1%EC%97%90%EA%B4%80%ED%95%9C%EA%B7%9C%EC%B9%99) | — | — |
| `values.penaltyTiers` | 지연 일수별 과태료 구간·가산 방식·상한 확인. 2차 자료에 상한 도달 시점이 115일/180일로 엇갈림 | [자동차관리법 시행령 별표(과태료 부과기준)](https://www.law.go.kr/%EB%B2%95%EB%A0%B9/%EC%9E%90%EB%8F%99%EC%B0%A8%EA%B4%80%EB%A6%AC%EB%B2%95%EC%8B%9C%ED%96%89%EB%A0%B9) | `{"note":"2차 자료: 30일 이내 4만 원, 이후 가산, 상한 60만 원 — 구간 세부는 확인 필요"}` | 2차 자료(웹 검색 요약, 2026-11-01) — 법령으로 확인 필요 |
| `values.penaltyCapWon` | 과태료 상한과 시행일 확인 (2배 상향 보도) | [자동차관리법 시행령 별표(과태료 부과기준)](https://www.law.go.kr/%EB%B2%95%EB%A0%B9/%EC%9E%90%EB%8F%99%EC%B0%A8%EA%B4%80%EB%A6%AC%EB%B2%95%EC%8B%9C%ED%96%89%EB%A0%B9) | `600000` | 2차 자료(웹 검색 요약, 2026-11-01) — 법령으로 확인 필요 |
| `values.fees` | 정기검사·종합검사 수수료(차종별) 확인. 민간 검사소는 다를 수 있어 범위로 표시 | [한국교통안전공단 검사 수수료 안내](https://www.kotsa.or.kr/) | — | — |
| `rules.firstExpiry` | 최초 만료일 = 최초등록일 + N년 - 1일 인지 확인 — calc-core estimateExpiry()가 이 규칙을 씀 | [자동차관리법 시행규칙(검사 유효기간 기산일)](https://www.law.go.kr/%EB%B2%95%EB%A0%B9/%EC%9E%90%EB%8F%99%EC%B0%A8%EA%B4%80%EB%A6%AC%EB%B2%95%EC%8B%9C%ED%96%89%EA%B7%9C%EC%B9%99) | — | — |
| `rules.overdueCount` | 지연 일수를 검사 기간 끝난 다음 날부터 세는지 확인 — calc-core calcInspectionPenalty()가 이 규칙을 씀 | [자동차관리법 시행령 별표(과태료 부과기준)](https://www.law.go.kr/%EB%B2%95%EB%A0%B9/%EC%9E%90%EB%8F%99%EC%B0%A8%EA%B4%80%EB%A6%AC%EB%B2%95%EC%8B%9C%ED%96%89%EB%A0%B9) | — | — |

