# 프롬프트 10 — 자동차 돈 일정 캘린더 + PWA

## 목표
연납·자동차세 납기·보조금 공고 일정을 한곳에서 관리해 웹 캘린더·.ics·앱 알림이 같은 데이터를 쓰게 하고, 웹을 홈 화면에 설치할 수 있게 한다.

## Claude Code에게
```
1. packages/data/calendar/2027.json: id, title, category(세금/보조금/검사/기타), scope(전국/시도/시군구 코드), start, end, description, official_url, source_name, checked_at, verified.
   - 자동차세 1기(6/16~30)·2기(12/16~31), 연납(1·3·6·9월 기간), 보조금 공고(지역별, 확인된 것만) 등. 확인 안 된 날짜는 "예정".
   - 빌드 시 public/data/calendar-2027.json 으로 공개(앱이 받아 감), schemaVersion 필드.
2. /calendar/ 페이지: 월별 목록, 카테고리·지역 필터, 항목마다 .ics 추가 버튼과 관련 도구 링크. 3-3절 항목 중 해당되는 것(요약, 출처, FAQ) 포함.
3. .ics: 항목별·카테고리별 파일 빌드 생성, VALARM(시작 7일 전, 마감 3일 전).
4. PWA: manifest(이름, 아이콘 192/512/maskable, start_url "/?source=pwa", standalone), 서비스 워커는 도구 페이지·data JSON 오프라인 캐시(네트워크 우선). 광고 스크립트는 캐시하지 않는다.
5. 설치 안내: 도구 결과 아래에만 작게(안드로이드 설치 버튼, iOS 안내 문구).
6. GA4: calendar_add{item_id}, pwa_install.
7. Lighthouse PWA·성능 측정 결과 보고.
```

## 완료 조건
- /calendar/ 공개, .ics가 휴대폰 캘린더에 등록됨(운영자 확인), JSON 스키마 테스트 통과
